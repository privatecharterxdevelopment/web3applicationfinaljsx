/**
 * Events Service
 * 
 * Fetches events from Ticketmaster and Eventbrite APIs
 * Users are redirected to external sites for ticket purchase
 */

const TICKETMASTER_API_KEY = import.meta.env.VITE_TICKETMASTER_CONSUMER_KEY;
const EVENTBRITE_TOKEN = import.meta.env.VITE_EVENTBRITE_TOKEN;

class EventsService {
  constructor() {
    this.ticketmasterBaseUrl = 'https://app.ticketmaster.com/discovery/v2';
    this.eventbriteBaseUrl = 'https://www.eventbriteapi.com/v3';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Search events from both Ticketmaster and Eventbrite
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} Combined events from both platforms
   */
  async searchEvents({
    keyword = '',
    city = '',
    countryCode = '',
    startDate = null,
    endDate = null,
    category = null,
    size = 20
  } = {}) {
    const cacheKey = JSON.stringify({ keyword, city, countryCode, startDate, endDate, category, size });
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Fetch from both APIs in parallel
      const [ticketmasterEvents, eventbriteEvents] = await Promise.allSettled([
        this.searchTicketmaster({ keyword, city, countryCode, startDate, endDate, category, size }),
        this.searchEventbrite({ keyword, city, startDate, endDate, category, size })
      ]);

      const allEvents = [
        ...(ticketmasterEvents.status === 'fulfilled' ? ticketmasterEvents.value : []),
        ...(eventbriteEvents.status === 'fulfilled' ? eventbriteEvents.value : [])
      ];

      // Sort by date
      allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Cache results
      this.cache.set(cacheKey, {
        data: allEvents,
        timestamp: Date.now()
      });

      return allEvents;
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  }

  /**
   * Search Ticketmaster events
   */
  async searchTicketmaster({ keyword, city, countryCode, startDate, endDate, category, size }) {
    if (!TICKETMASTER_API_KEY) {
      console.warn('Ticketmaster API key not configured');
      return [];
    }

    try {
      const params = new URLSearchParams({
        apikey: TICKETMASTER_API_KEY,
        size: Math.min(size, 50).toString(),
        sort: 'date,asc'
      });

      if (keyword) params.append('keyword', keyword);
      if (city) params.append('city', city);
      if (countryCode) params.append('countryCode', countryCode);
      if (startDate) params.append('startDateTime', new Date(startDate).toISOString());
      if (endDate) params.append('endDateTime', new Date(endDate).toISOString());
      
      // Ticketmaster categories: Music, Sports, Arts & Theatre, Film, Miscellaneous
      if (category) {
        const categoryMap = {
          music: 'KZFzniwnSyZfZ7v7nJ',
          sports: 'KZFzniwnSyZfZ7v7nE',
          arts: 'KZFzniwnSyZfZ7v7na',
          theatre: 'KZFzniwnSyZfZ7v7na',
          family: 'KZFzniwnSyZfZ7v7nF',
          film: 'KZFzniwnSyZfZ7v7nn'
        };
        if (categoryMap[category.toLowerCase()]) {
          params.append('classificationId', categoryMap[category.toLowerCase()]);
        }
      }

      const response = await fetch(
        `${this.ticketmasterBaseUrl}/events.json?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data._embedded?.events) {
        return [];
      }

      return data._embedded.events.map(event => this.normalizeTicketmasterEvent(event));
    } catch (error) {
      console.error('Ticketmaster search error:', error);
      return [];
    }
  }

  /**
   * Search Eventbrite events
   */
  async searchEventbrite({ keyword, city, startDate, endDate, category, size }) {
    if (!EVENTBRITE_TOKEN) {
      console.warn('Eventbrite token not configured');
      return [];
    }

    try {
      const params = new URLSearchParams({
        'location.address': city || 'Online',
        'expand': 'venue,ticket_availability',
        'page_size': Math.min(size, 50).toString()
      });

      if (keyword) params.append('q', keyword);
      if (startDate) params.append('start_date.range_start', new Date(startDate).toISOString());
      if (endDate) params.append('start_date.range_end', new Date(endDate).toISOString());
      
      // Eventbrite categories
      if (category) {
        const categoryMap = {
          music: '103',
          business: '101',
          food: '110',
          health: '107',
          sports: '108',
          arts: '105',
          film: '104',
          charity: '111',
          community: '113',
          family: '115',
          fashion: '106',
          hobbies: '119',
          home: '117',
          auto: '118',
          travel: '109',
          other: '199'
        };
        if (categoryMap[category.toLowerCase()]) {
          params.append('categories', categoryMap[category.toLowerCase()]);
        }
      }

      const response = await fetch(
        `${this.eventbriteBaseUrl}/events/search/?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${EVENTBRITE_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.events) {
        return [];
      }

      return data.events.map(event => this.normalizeEventbriteEvent(event));
    } catch (error) {
      console.error('Eventbrite search error:', error);
      return [];
    }
  }

  /**
   * Normalize Ticketmaster event to common format
   */
  normalizeTicketmasterEvent(event) {
    const venue = event._embedded?.venues?.[0];
    const priceRange = event.priceRanges?.[0];
    
    return {
      id: `tm-${event.id}`,
      platform: 'ticketmaster',
      name: event.name,
      description: event.info || event.pleaseNote || '',
      date: event.dates?.start?.dateTime || event.dates?.start?.localDate,
      timezone: event.dates?.timezone || 'UTC',
      url: event.url,
      image: event.images?.find(img => img.ratio === '16_9')?.url || event.images?.[0]?.url,
      venue: {
        name: venue?.name || 'TBA',
        address: venue?.address?.line1 || '',
        city: venue?.city?.name || '',
        state: venue?.state?.name || '',
        country: venue?.country?.name || '',
        postalCode: venue?.postalCode || ''
      },
      category: event.classifications?.[0]?.segment?.name || 'Other',
      subcategory: event.classifications?.[0]?.genre?.name,
      price: priceRange ? {
        min: priceRange.min,
        max: priceRange.max,
        currency: priceRange.currency || 'USD'
      } : null,
      status: event.dates?.status?.code || 'onsale',
      salesInfo: {
        publicSaleStart: event.sales?.public?.startDateTime,
        publicSaleEnd: event.sales?.public?.endDateTime,
        presaleStart: event.sales?.presales?.[0]?.startDateTime,
        presaleEnd: event.sales?.presales?.[0]?.endDateTime
      }
    };
  }

  /**
   * Normalize Eventbrite event to common format
   */
  normalizeEventbriteEvent(event) {
    const venue = event.venue;
    
    return {
      id: `eb-${event.id}`,
      platform: 'eventbrite',
      name: event.name?.text || 'Untitled Event',
      description: event.description?.text || '',
      date: event.start?.utc,
      timezone: event.start?.timezone || 'UTC',
      url: event.url,
      image: event.logo?.url,
      venue: {
        name: venue?.name || 'Online Event',
        address: venue?.address?.address_1 || '',
        city: venue?.address?.city || '',
        state: venue?.address?.region || '',
        country: venue?.address?.country || '',
        postalCode: venue?.address?.postal_code || ''
      },
      category: event.category?.name || 'Other',
      subcategory: event.subcategory?.name,
      price: event.is_free ? {
        min: 0,
        max: 0,
        currency: event.currency || 'USD'
      } : null,
      status: event.status || 'live',
      salesInfo: {
        publicSaleStart: event.published,
        publicSaleEnd: event.end?.utc,
        isFree: event.is_free,
        capacity: event.capacity
      },
      onlineEvent: event.online_event
    };
  }

  /**
   * Get event details by ID and platform
   * @param {string} eventId - Format: 'tm-123' or 'eb-456'
   * @returns {Promise<Object>}
   */
  async getEventDetails(eventId) {
    const [platform, id] = eventId.split('-');

    if (platform === 'tm') {
      return this.getTicketmasterDetails(id);
    } else if (platform === 'eb') {
      return this.getEventbriteDetails(id);
    }

    throw new Error('Invalid event ID format');
  }

  /**
   * Get Ticketmaster event details
   */
  async getTicketmasterDetails(eventId) {
    if (!TICKETMASTER_API_KEY) {
      throw new Error('Ticketmaster API key not configured');
    }

    try {
      const response = await fetch(
        `${this.ticketmasterBaseUrl}/events/${eventId}.json?apikey=${TICKETMASTER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status}`);
      }

      const event = await response.json();
      return this.normalizeTicketmasterEvent(event);
    } catch (error) {
      console.error('Error fetching Ticketmaster details:', error);
      throw error;
    }
  }

  /**
   * Get Eventbrite event details
   */
  async getEventbriteDetails(eventId) {
    if (!EVENTBRITE_TOKEN) {
      throw new Error('Eventbrite token not configured');
    }

    try {
      const response = await fetch(
        `${this.eventbriteBaseUrl}/events/${eventId}/`,
        {
          headers: {
            'Authorization': `Bearer ${EVENTBRITE_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`);
      }

      const event = await response.json();
      return this.normalizeEventbriteEvent(event);
    } catch (error) {
      console.error('Error fetching Eventbrite details:', error);
      throw error;
    }
  }

  /**
   * Get popular events for a city
   * @param {string} city - City name
   * @param {number} limit - Number of events to return
   * @returns {Promise<Array>}
   */
  async getPopularEvents(city, limit = 10) {
    return this.searchEvents({
      city,
      size: limit,
      startDate: new Date().toISOString()
    });
  }

  /**
   * Get events by category
   * @param {string} category - Category name
   * @param {number} limit - Number of events to return
   * @returns {Promise<Array>}
   */
  async getEventsByCategory(category, limit = 20) {
    return this.searchEvents({
      category,
      size: limit,
      startDate: new Date().toISOString()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const eventsService = new EventsService();
export default eventsService;
