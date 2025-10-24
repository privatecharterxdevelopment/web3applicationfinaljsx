/**
 * Eventbrite API Service
 * Full checkout integration with cart and ticket selection
 */

const EVENTBRITE_API_BASE = 'https://www.eventbriteapi.com/v3';
const EVENTBRITE_TOKEN = import.meta.env.VITE_EVENTBRITE_TOKEN;

class EventbriteService {
  /**
   * Get authorization headers
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Search for events
   * @param {Object} params - Search parameters
   * @param {string} params.q - Search query
   * @param {string} params.location_address - Location (city, address)
   * @param {string} params.location_within - Distance (e.g., '25km')
   * @param {string} params.start_date_range_start - Start date (ISO 8601)
   * @param {string} params.start_date_range_end - End date (ISO 8601)
   * @param {Array<string>} params.categories - Category IDs
   * @param {Array<string>} params.formats - Format IDs
   * @param {number} params.page - Page number
   * @param {string} params.sort_by - Sort order (date, distance, best, name)
   * @returns {Promise<Object>} Event search results
   */
  async searchEvents(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Add search parameters
      if (params.q) queryParams.append('q', params.q);
      if (params.location_address) queryParams.append('location.address', params.location_address);
      if (params.location_within) queryParams.append('location.within', params.location_within);
      if (params.start_date_range_start) queryParams.append('start_date.range_start', params.start_date_range_start);
      if (params.start_date_range_end) queryParams.append('start_date.range_end', params.start_date_range_end);
      if (params.categories) queryParams.append('categories', params.categories.join(','));
      if (params.formats) queryParams.append('formats', params.formats.join(','));
      if (params.page) queryParams.append('page', params.page);

      queryParams.append('sort_by', params.sort_by || 'date');
      queryParams.append('expand', 'venue,ticket_availability,category,format');

      const response = await fetch(`${EVENTBRITE_API_BASE}/events/search/?${queryParams}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatEventsResponse(data);
    } catch (error) {
      console.error('Error searching Eventbrite events:', error);
      throw error;
    }
  }

  /**
   * Get event details by ID
   * @param {string} eventId - Eventbrite event ID
   * @returns {Promise<Object>} Event details
   */
  async getEventById(eventId) {
    try {
      const response = await fetch(
        `${EVENTBRITE_API_BASE}/events/${eventId}/?expand=venue,ticket_availability,category,format,organizer,ticket_classes`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatSingleEvent(data);
    } catch (error) {
      console.error('Error fetching Eventbrite event:', error);
      throw error;
    }
  }

  /**
   * Get ticket classes for an event
   * @param {string} eventId - Eventbrite event ID
   * @returns {Promise<Array>} Ticket classes
   */
  async getTicketClasses(eventId) {
    try {
      const response = await fetch(
        `${EVENTBRITE_API_BASE}/events/${eventId}/ticket_classes/`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`);
      }

      const data = await response.json();
      return data.ticket_classes || [];
    } catch (error) {
      console.error('Error fetching ticket classes:', error);
      throw error;
    }
  }

  /**
   * Get available categories
   * @returns {Promise<Array>} Categories
   */
  async getCategories() {
    try {
      const response = await fetch(`${EVENTBRITE_API_BASE}/categories/`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`);
      }

      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get events by location
   * @param {string} city - City name
   * @param {string} within - Distance radius (e.g., '50km')
   * @returns {Promise<Object>} Events
   */
  async getEventsByLocation(city, within = '50km') {
    return await this.searchEvents({
      location_address: city,
      location_within: within,
      sort_by: 'date'
    });
  }

  /**
   * Get events by category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Events
   */
  async getEventsByCategory(categoryId) {
    return await this.searchEvents({
      categories: [categoryId],
      sort_by: 'date'
    });
  }

  /**
   * Create checkout URL for event
   * @param {string} eventId - Event ID
   * @param {Object} tickets - Ticket selections { ticket_class_id: quantity }
   * @returns {string} Checkout URL
   */
  createCheckoutUrl(eventId, tickets = {}) {
    // Build Eventbrite checkout URL with pre-selected tickets
    const baseUrl = `https://www.eventbrite.com/e/${eventId}`;

    if (Object.keys(tickets).length === 0) {
      return baseUrl;
    }

    // Add ticket quantities to URL
    const ticketParams = Object.entries(tickets)
      .map(([ticketClassId, quantity]) => `qty[${ticketClassId}]=${quantity}`)
      .join('&');

    return `${baseUrl}?${ticketParams}`;
  }

  /**
   * Format events response
   * @param {Object} data - Raw API response
   * @returns {Object} Formatted response
   */
  formatEventsResponse(data) {
    if (!data.events) {
      return {
        events: [],
        total: 0,
        page: 1,
        pageCount: 0
      };
    }

    const events = data.events.map(event => this.formatSingleEvent(event));

    return {
      events,
      total: data.pagination?.object_count || 0,
      page: data.pagination?.page_number || 1,
      pageCount: data.pagination?.page_count || 0,
      hasMoreItems: data.pagination?.has_more_items || false
    };
  }

  /**
   * Format single event
   * @param {Object} event - Raw event data
   * @returns {Object} Formatted event
   */
  formatSingleEvent(event) {
    return {
      id: event.id,
      name: event.name?.text || 'Untitled Event',
      description: event.description?.text || event.summary || '',
      url: event.url,

      // Images
      logo: event.logo?.url || event.logo?.original?.url || null,
      image: event.logo?.url || event.logo?.original?.url || null,

      // Dates
      start: {
        local: event.start?.local,
        utc: event.start?.utc,
        timezone: event.start?.timezone
      },
      end: {
        local: event.end?.local,
        utc: event.end?.utc,
        timezone: event.end?.timezone
      },

      // Status
      status: event.status,
      isFree: event.is_free || false,
      isOnlineEvent: event.online_event || false,

      // Capacity
      capacity: event.capacity,
      ticketsAvailable: event.ticket_availability?.minimum_ticket_price?.major_value !== undefined,

      // Pricing
      currency: event.currency,
      priceRange: this.extractPriceRange(event),

      // Venue
      venue: event.venue ? {
        id: event.venue.id,
        name: event.venue.name,
        address: {
          line1: event.venue.address?.address_1,
          line2: event.venue.address?.address_2,
          city: event.venue.address?.city,
          region: event.venue.address?.region,
          postalCode: event.venue.address?.postal_code,
          country: event.venue.address?.country
        },
        latitude: event.venue.latitude,
        longitude: event.venue.longitude
      } : null,

      // Category
      category: event.category ? {
        id: event.category.id,
        name: event.category.name,
        shortName: event.category.short_name
      } : null,

      // Format
      format: event.format ? {
        id: event.format.id,
        name: event.format.name,
        shortName: event.format.short_name
      } : null,

      // Organizer
      organizer: event.organizer ? {
        id: event.organizer.id,
        name: event.organizer.name,
        description: event.organizer.description?.text
      } : null,

      // Ticket Classes (if expanded)
      ticketClasses: event.ticket_classes || [],

      // Original data
      rawData: event
    };
  }

  /**
   * Extract price range from event
   * @param {Object} event - Event data
   * @returns {Object} Price range
   */
  extractPriceRange(event) {
    if (event.is_free) {
      return { min: 0, max: 0, currency: event.currency, display: 'Free' };
    }

    if (event.ticket_availability) {
      const minPrice = event.ticket_availability.minimum_ticket_price;
      const maxPrice = event.ticket_availability.maximum_ticket_price;

      if (minPrice && maxPrice) {
        return {
          min: minPrice.major_value || 0,
          max: maxPrice.major_value || 0,
          currency: minPrice.currency || event.currency,
          display: minPrice.major_value === maxPrice.major_value
            ? `${minPrice.currency} ${minPrice.major_value}`
            : `${minPrice.currency} ${minPrice.major_value} - ${maxPrice.major_value}`
        };
      }
    }

    return { min: null, max: null, currency: event.currency, display: 'Price TBA' };
  }

  /**
   * Format event date for display
   * @param {Object} event - Event object
   * @returns {string} Formatted date string
   */
  formatEventDate(event) {
    if (!event.start || !event.start.local) return 'Date TBA';

    const date = new Date(event.start.local);
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Format price for display
   * @param {Object} event - Event object
   * @returns {string} Formatted price string
   */
  formatPrice(event) {
    return event.priceRange?.display || 'Price TBA';
  }

  /**
   * Get venue info for display
   * @param {Object} event - Event object
   * @returns {string} Venue info string
   */
  getVenueInfo(event) {
    if (event.isOnlineEvent) return 'Online Event';
    if (!event.venue) return 'Venue TBA';

    const parts = [];
    if (event.venue.name) parts.push(event.venue.name);
    if (event.venue.address?.city) parts.push(event.venue.address.city);

    return parts.join(', ') || 'Venue TBA';
  }
}

export const eventbriteService = new EventbriteService();
