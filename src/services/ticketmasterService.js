/**
 * Ticketmaster API Service
 * Handles all interactions with the Ticketmaster Discovery API
 */

const TICKETMASTER_API_BASE = 'https://app.ticketmaster.com/discovery/v2';
const CONSUMER_KEY = import.meta.env.VITE_TICKETMASTER_CONSUMER_KEY;

class TicketmasterService {
  /**
   * Search for events
   * @param {Object} params - Search parameters
   * @param {string} params.keyword - Search keyword
   * @param {string} params.city - City name
   * @param {string} params.countryCode - Country code (e.g., 'US', 'CH', 'GB')
   * @param {string} params.classificationName - Event type (e.g., 'Music', 'Sports', 'Arts & Theatre')
   * @param {string} params.startDateTime - Start date in ISO format
   * @param {string} params.endDateTime - End date in ISO format
   * @param {number} params.size - Number of results (default 20, max 200)
   * @param {number} params.page - Page number (default 0)
   * @param {string} params.sort - Sort order (relevance, date, distance, name)
   * @returns {Promise<Object>} Event search results
   */
  async searchEvents(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        apikey: CONSUMER_KEY,
        size: params.size || 20,
        page: params.page || 0,
        sort: params.sort || 'date,asc',
        ...params
      });

      const response = await fetch(`${TICKETMASTER_API_BASE}/events?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatEventsResponse(data);
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  }

  /**
   * Get event details by ID
   * @param {string} eventId - Ticketmaster event ID
   * @returns {Promise<Object>} Event details
   */
  async getEventById(eventId) {
    try {
      const response = await fetch(
        `${TICKETMASTER_API_BASE}/events/${eventId}?apikey=${CONSUMER_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatSingleEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }

  /**
   * Search attractions (artists, teams, etc.)
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Attraction search results
   */
  async searchAttractions(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        apikey: CONSUMER_KEY,
        size: params.size || 20,
        page: params.page || 0,
        ...params
      });

      const response = await fetch(`${TICKETMASTER_API_BASE}/attractions?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching attractions:', error);
      throw error;
    }
  }

  /**
   * Get suggested events based on location
   * @param {string} city - City name
   * @param {string} countryCode - Country code
   * @param {string} classification - Event classification (Music, Sports, etc.)
   * @returns {Promise<Object>} Suggested events
   */
  async getSuggestedEvents(city, countryCode = 'CH', classification = null) {
    const params = {
      city,
      countryCode,
      size: 50,
      sort: 'date,asc'
    };

    if (classification) {
      params.classificationName = classification;
    }

    return await this.searchEvents(params);
  }

  /**
   * Get popular events in major cities
   * @returns {Promise<Array>} Popular events grouped by city
   */
  async getPopularEvents() {
    const cities = [
      { city: 'Zurich', countryCode: 'CH' },
      { city: 'Geneva', countryCode: 'CH' },
      { city: 'London', countryCode: 'GB' },
      { city: 'Paris', countryCode: 'FR' },
      { city: 'Dubai', countryCode: 'AE' },
      { city: 'New York', countryCode: 'US' },
      { city: 'Monaco', countryCode: 'MC' },
      { city: 'Milan', countryCode: 'IT' }
    ];

    try {
      const results = await Promise.all(
        cities.map(async ({ city, countryCode }) => {
          const events = await this.searchEvents({
            city,
            countryCode,
            size: 10,
            sort: 'date,asc'
          });
          return {
            city,
            countryCode,
            events: events.events || []
          };
        })
      );

      return results;
    } catch (error) {
      console.error('Error fetching popular events:', error);
      throw error;
    }
  }

  /**
   * Get events by classification
   * @param {string} classification - Music, Sports, Arts & Theatre, Family, Film, Miscellaneous
   * @param {number} size - Number of results
   * @returns {Promise<Object>} Events by classification
   */
  async getEventsByClassification(classification, size = 20) {
    return await this.searchEvents({
      classificationName: classification,
      size,
      sort: 'date,asc'
    });
  }

  /**
   * Format events response to match our app structure
   * @param {Object} data - Raw Ticketmaster API response
   * @returns {Object} Formatted response
   */
  formatEventsResponse(data) {
    if (!data._embedded || !data._embedded.events) {
      return {
        events: [],
        total: 0,
        page: data.page
      };
    }

    const events = data._embedded.events.map(event => this.formatSingleEvent(event));

    return {
      events,
      total: data.page?.totalElements || 0,
      page: {
        size: data.page?.size || 0,
        totalPages: data.page?.totalPages || 0,
        number: data.page?.number || 0
      }
    };
  }

  /**
   * Format single event object
   * @param {Object} event - Raw event data
   * @returns {Object} Formatted event
   */
  formatSingleEvent(event) {
    return {
      id: event.id,
      name: event.name,
      type: event.type,
      url: event.url,
      images: event.images?.map(img => ({
        url: img.url,
        ratio: img.ratio,
        width: img.width,
        height: img.height
      })) || [],

      // Sales info
      sales: {
        public: {
          startDateTime: event.sales?.public?.startDateTime || null,
          endDateTime: event.sales?.public?.endDateTime || null,
          startTBD: event.sales?.public?.startTBD || false
        },
        presales: event.sales?.presales || []
      },

      // Date and time
      dates: {
        start: {
          localDate: event.dates?.start?.localDate || null,
          localTime: event.dates?.start?.localTime || null,
          dateTime: event.dates?.start?.dateTime || null,
          dateTBD: event.dates?.start?.dateTBD || false,
          timeTBD: event.dates?.start?.timeTBD || false
        },
        timezone: event.dates?.timezone || null,
        status: {
          code: event.dates?.status?.code || null
        }
      },

      // Classification
      classifications: event.classifications?.map(c => ({
        primary: c.primary,
        segment: {
          id: c.segment?.id,
          name: c.segment?.name
        },
        genre: {
          id: c.genre?.id,
          name: c.genre?.name
        },
        subGenre: {
          id: c.subGenre?.id,
          name: c.subGenre?.name
        }
      })) || [],

      // Venue info
      venues: event._embedded?.venues?.map(venue => ({
        id: venue.id,
        name: venue.name,
        type: venue.type,
        url: venue.url,
        location: {
          longitude: venue.location?.longitude,
          latitude: venue.location?.latitude
        },
        city: {
          name: venue.city?.name
        },
        state: {
          name: venue.state?.name,
          stateCode: venue.state?.stateCode
        },
        country: {
          name: venue.country?.name,
          countryCode: venue.country?.countryCode
        },
        address: {
          line1: venue.address?.line1
        },
        postalCode: venue.postalCode,
        timezone: venue.timezone,
        parkingDetail: venue.parkingDetail,
        accessibleSeatingDetail: venue.accessibleSeatingDetail
      })) || [],

      // Attractions (performers, teams, artists)
      attractions: event._embedded?.attractions?.map(attr => ({
        id: attr.id,
        name: attr.name,
        type: attr.type,
        url: attr.url,
        images: attr.images?.map(img => ({
          url: img.url,
          ratio: img.ratio,
          width: img.width,
          height: img.height
        })) || []
      })) || [],

      // Price ranges
      priceRanges: event.priceRanges?.map(pr => ({
        type: pr.type,
        currency: pr.currency,
        min: pr.min,
        max: pr.max
      })) || [],

      // Promoter info
      promoter: event.promoter ? {
        id: event.promoter.id,
        name: event.promoter.name,
        description: event.promoter.description
      } : null,

      // Additional info
      info: event.info || null,
      pleaseNote: event.pleaseNote || null,
      seatmap: event.seatmap || null,
      accessibility: event.accessibility || null,
      ticketLimit: event.ticketLimit || null,
      ageRestrictions: event.ageRestrictions || null
    };
  }

  /**
   * Get event image by preferred ratio
   * @param {Array} images - Array of event images
   * @param {string} ratio - Preferred ratio (16_9, 4_3, 3_2, etc.)
   * @returns {string|null} Image URL
   */
  getEventImage(images, ratio = '16_9') {
    if (!images || images.length === 0) return null;

    const preferredImage = images.find(img => img.ratio === ratio);
    if (preferredImage) return preferredImage.url;

    // Fallback to first image
    return images[0].url;
  }

  /**
   * Format price range for display
   * @param {Array} priceRanges - Price ranges array
   * @returns {string} Formatted price string
   */
  formatPriceRange(priceRanges) {
    if (!priceRanges || priceRanges.length === 0) return 'Price TBA';

    const range = priceRanges[0];
    if (range.min === range.max) {
      return `${range.currency} ${range.min}`;
    }

    return `${range.currency} ${range.min} - ${range.max}`;
  }

  /**
   * Format event date for display
   * @param {Object} dates - Event dates object
   * @returns {string} Formatted date string
   */
  formatEventDate(dates) {
    if (!dates || !dates.start) return 'Date TBA';

    if (dates.start.dateTBD) return 'Date TBA';

    const date = new Date(dates.start.localDate);
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    let formatted = date.toLocaleDateString('en-US', options);

    if (dates.start.localTime && !dates.start.timeTBD) {
      const time = dates.start.localTime;
      formatted += ` at ${time}`;
    }

    return formatted;
  }
}

export const ticketmasterService = new TicketmasterService();
