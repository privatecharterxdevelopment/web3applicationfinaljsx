/**
 * Google Calendar Service
 * 
 * Handles Google Calendar OAuth and event management
 * Syncs bookings to user's Google Calendar
 */

import { supabase } from '../lib/supabase';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

class CalendarService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.calendarId = 'primary';
  }

  /**
   * Initialize Google API client
   */
  async initializeGoogleAPI() {
    return new Promise((resolve) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            clientId: GOOGLE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: 'https://www.googleapis.com/auth/calendar.events'
          }).then(resolve);
        });
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Sign in to Google
   * @returns {Promise<boolean>}
   */
  async signInToGoogle() {
    try {
      await this.initializeGoogleAPI();
      const auth = window.gapi.auth2.getAuthInstance();
      
      if (auth.isSignedIn.get()) {
        this.updateAccessToken();
        return true;
      }

      await auth.signIn();
      this.updateAccessToken();
      
      // Save connection status to Supabase
      await this.saveConnectionStatus(true);
      
      return true;
    } catch (error) {
      console.error('Error signing in to Google:', error);
      return false;
    }
  }

  /**
   * Sign out from Google
   */
  async signOutFromGoogle() {
    try {
      const auth = window.gapi.auth2.getAuthInstance();
      if (auth) {
        await auth.signOut();
      }
      this.accessToken = null;
      this.tokenExpiresAt = null;
      
      await this.saveConnectionStatus(false);
    } catch (error) {
      console.error('Error signing out from Google:', error);
    }
  }

  /**
   * Check if user is connected to Google Calendar
   * @returns {boolean}
   */
  isConnected() {
    if (!window.gapi?.auth2) return false;
    const auth = window.gapi.auth2.getAuthInstance();
    return auth && auth.isSignedIn.get();
  }

  /**
   * Update access token from Google
   */
  updateAccessToken() {
    try {
      const auth = window.gapi.auth2.getAuthInstance();
      const user = auth.currentUser.get();
      const authResponse = user.getAuthResponse(true);
      
      this.accessToken = authResponse.access_token;
      this.tokenExpiresAt = new Date(authResponse.expires_at);
    } catch (error) {
      console.error('Error updating access token:', error);
    }
  }

  /**
   * Save calendar connection status to Supabase
   */
  async saveConnectionStatus(connected) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('users')
        .update({
          google_calendar_connected: connected,
          google_calendar_connected_at: connected ? new Date().toISOString() : null
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving connection status:', error);
    }
  }

  /**
   * Create calendar event
   * @param {Object} eventData - Event details
   * @returns {Promise<Object>}
   */
  async createEvent({
    title,
    description,
    startTime,
    endTime,
    location,
    timezone = 'UTC',
    bookingReference,
    serviceType,
    chatRequestId
  }) {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to Google Calendar');
      }

      const event = {
        summary: title,
        description: description || '',
        location: location || '',
        start: {
          dateTime: new Date(startTime).toISOString(),
          timeZone: timezone
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
          timeZone: timezone
        },
        colorId: this.getColorIdByServiceType(serviceType),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }        // 1 hour before
          ]
        }
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: this.calendarId,
        resource: event
      });

      const googleEvent = response.result;

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('calendar_events').insert({
          user_id: user.id,
          google_event_id: googleEvent.id,
          google_calendar_id: this.calendarId,
          title,
          description,
          start_time: startTime,
          end_time: endTime,
          timezone,
          location,
          booking_reference: bookingReference,
          service_type: serviceType,
          chat_request_id: chatRequestId,
          status: 'confirmed'
        });
      }

      return {
        success: true,
        eventId: googleEvent.id,
        htmlLink: googleEvent.htmlLink
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update calendar event
   * @param {string} eventId - Google Calendar event ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>}
   */
  async updateEvent(eventId, updates) {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to Google Calendar');
      }

      // Get existing event
      const response = await window.gapi.client.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId
      });

      const event = response.result;

      // Apply updates
      if (updates.title) event.summary = updates.title;
      if (updates.description) event.description = updates.description;
      if (updates.location) event.location = updates.location;
      if (updates.startTime) {
        event.start.dateTime = new Date(updates.startTime).toISOString();
      }
      if (updates.endTime) {
        event.end.dateTime = new Date(updates.endTime).toISOString();
      }

      // Update in Google Calendar
      const updateResponse = await window.gapi.client.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        resource: event
      });

      // Update in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('calendar_events')
          .update({
            title: updates.title,
            description: updates.description,
            start_time: updates.startTime,
            end_time: updates.endTime,
            location: updates.location,
            updated_at: new Date().toISOString()
          })
          .eq('google_event_id', eventId)
          .eq('user_id', user.id);
      }

      return {
        success: true,
        event: updateResponse.result
      };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete calendar event
   * @param {string} eventId - Google Calendar event ID
   * @returns {Promise<Object>}
   */
  async deleteEvent(eventId) {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to Google Calendar');
      }

      await window.gapi.client.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: eventId
      });

      // Update in Supabase (soft delete)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('calendar_events')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('google_event_id', eventId)
          .eq('user_id', user.id);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get upcoming events
   * @param {number} daysAhead - Number of days to fetch
   * @returns {Promise<Array>}
   */
  async getUpcomingEvents(daysAhead = 30) {
    try {
      if (!this.isConnected()) {
        return [];
      }

      const now = new Date();
      const maxTime = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const response = await window.gapi.client.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: now.toISOString(),
        timeMax: maxTime.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  }

  /**
   * Get Sphera bookings from Supabase
   * @returns {Promise<Array>}
   */
  async getSyncedBookings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching synced bookings:', error);
      return [];
    }
  }

  /**
   * Get color ID by service type for visual organization
   */
  getColorIdByServiceType(serviceType) {
    const colorMap = {
      flight: '7',      // Peacock (blue)
      jet: '9',         // Blueberry (dark blue)
      yacht: '10',      // Basil (green)
      car: '11',        // Tomato (red)
      helicopter: '5',  // Banana (yellow)
      hotel: '6',       // Tangerine (orange)
      event: '4'        // Flamingo (pink)
    };
    return colorMap[serviceType] || '1'; // Default to Lavender
  }

  /**
   * Quick add booking from chat request
   * @param {Object} chatRequest - Chat request object
   * @returns {Promise<Object>}
   */
  async quickAddFromChatRequest(chatRequest) {
    const serviceTypes = {
      private_jet: 'Private Jet Flight',
      yacht: 'Yacht Charter',
      luxury_car: 'Luxury Car',
      helicopter: 'Helicopter Tour',
      hotel: 'Hotel Stay',
      event: 'Event Tickets'
    };

    const title = `${serviceTypes[chatRequest.service_type] || 'Booking'} - ${chatRequest.destination || 'TBD'}`;
    const description = `
Sphera AI Booking
Service: ${chatRequest.service_type}
${chatRequest.departure ? `From: ${chatRequest.departure}` : ''}
${chatRequest.destination ? `To: ${chatRequest.destination}` : ''}
${chatRequest.passengers ? `Passengers: ${chatRequest.passengers}` : ''}
${chatRequest.budget ? `Budget: €${chatRequest.budget}` : ''}
    `.trim();

    const startTime = chatRequest.departure_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const endTime = chatRequest.return_date || new Date(new Date(startTime).getTime() + 24 * 60 * 60 * 1000);

    return this.createEvent({
      title,
      description,
      startTime,
      endTime,
      location: chatRequest.destination || '',
      serviceType: chatRequest.service_type,
      chatRequestId: chatRequest.id,
      bookingReference: chatRequest.id
    });
  }
}

export const calendarService = new CalendarService();
export default calendarService;
