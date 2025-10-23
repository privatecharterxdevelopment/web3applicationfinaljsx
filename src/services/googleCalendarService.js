import { supabase } from '../lib/supabase';

/**
 * Google Calendar Integration Service
 * Handles OAuth connection and sync with Google Calendar
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';
const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
].join(' ');

export class GoogleCalendarService {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Initiate Google OAuth flow
   */
  async connectGoogleCalendar() {
    try {
      // Create OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', SCOPES);
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');
      authUrl.searchParams.append('state', this.userId); // Pass user ID in state

      // Redirect to Google OAuth
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleOAuthCallback(code) {
    try {
      // Exchange authorization code for access token
      // This should be done via Supabase Edge Function for security
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          code,
          redirect_uri: REDIRECT_URI,
          user_id: this.userId
        }
      });

      if (error) throw error;

      // Save tokens to database
      await this.saveConnection(data.access_token, data.refresh_token, data.expires_in, data.email);

      return { success: true };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  /**
   * Save Google Calendar connection to database
   */
  async saveConnection(accessToken, refreshToken, expiresIn, email) {
    try {
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      const { data, error } = await supabase
        .from('google_calendar_connections')
        .upsert({
          user_id: this.userId,
          google_access_token: accessToken,
          google_refresh_token: refreshToken,
          token_expires_at: expiresAt.toISOString(),
          google_email: email,
          sync_enabled: true,
          connected_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving Google Calendar connection:', error);
      throw error;
    }
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnectGoogleCalendar() {
    try {
      const { error } = await supabase
        .from('google_calendar_connections')
        .delete()
        .eq('user_id', this.userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Check if user has Google Calendar connected
   */
  async isConnected() {
    try {
      const { data, error } = await supabase
        .from('google_calendar_connections')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data !== null;
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      return false;
    }
  }

  /**
   * Get valid access token (refresh if expired)
   */
  async getAccessToken() {
    try {
      const { data: connection, error } = await supabase
        .from('google_calendar_connections')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error) throw error;

      // Check if token is expired
      const expiresAt = new Date(connection.token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        // Token expired, refresh it
        return await this.refreshAccessToken(connection.google_refresh_token);
      }

      return connection.google_access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // This should be done via Supabase Edge Function for security
      const { data, error } = await supabase.functions.invoke('google-calendar-refresh', {
        body: {
          refresh_token: refreshToken,
          user_id: this.userId
        }
      });

      if (error) throw error;

      // Update tokens in database
      await this.saveConnection(data.access_token, refreshToken, data.expires_in, data.email);

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Sync PrivateCharterX event to Google Calendar
   */
  async syncEventToGoogle(event) {
    try {
      const accessToken = await this.getAccessToken();

      const googleEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.all_day ? undefined : event.start_date,
          date: event.all_day ? event.start_date.split('T')[0] : undefined,
          timeZone: event.timezone || 'UTC'
        },
        end: {
          dateTime: event.all_day ? undefined : event.end_date,
          date: event.all_day ? event.end_date.split('T')[0] : undefined,
          timeZone: event.timezone || 'UTC'
        },
        attendees: event.event_attendees?.map(a => ({
          email: a.email,
          displayName: a.name
        })),
        reminders: event.reminder_minutes > 0 ? {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: event.reminder_minutes }
          ]
        } : undefined,
        colorId: this.getGoogleColorId(event.color)
      };

      // Call Google Calendar API
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(googleEvent)
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const createdEvent = await response.json();

      // Update PrivateCharterX event with Google event ID
      await supabase
        .from('calendar_events')
        .update({
          google_event_id: createdEvent.id,
          synced_to_google: true,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', event.id);

      return createdEvent;
    } catch (error) {
      console.error('Error syncing event to Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Update Google Calendar event
   */
  async updateGoogleEvent(event) {
    try {
      if (!event.google_event_id) {
        // Event not synced yet, create it
        return await this.syncEventToGoogle(event);
      }

      const accessToken = await this.getAccessToken();

      const googleEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.all_day ? undefined : event.start_date,
          date: event.all_day ? event.start_date.split('T')[0] : undefined,
          timeZone: event.timezone || 'UTC'
        },
        end: {
          dateTime: event.all_day ? undefined : event.end_date,
          date: event.all_day ? event.end_date.split('T')[0] : undefined,
          timeZone: event.timezone || 'UTC'
        },
        attendees: event.event_attendees?.map(a => ({
          email: a.email,
          displayName: a.name
        })),
        colorId: this.getGoogleColorId(event.color)
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.google_event_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(googleEvent)
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const updatedEvent = await response.json();

      // Update sync timestamp
      await supabase
        .from('calendar_events')
        .update({
          last_synced_at: new Date().toISOString()
        })
        .eq('id', event.id);

      return updatedEvent;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteGoogleEvent(googleEventId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw error;
    }
  }

  /**
   * Map PrivateCharterX colors to Google Calendar color IDs
   */
  getGoogleColorId(hexColor) {
    const colorMap = {
      '#3B82F6': '9',  // Blue
      '#10B981': '10', // Green
      '#8B5CF6': '3',  // Purple
      '#F59E0B': '5',  // Yellow/Orange
      '#EF4444': '11', // Red
      '#6B7280': '8',  // Gray
      '#EC4899': '4'   // Pink
    };

    return colorMap[hexColor] || '9'; // Default to blue
  }

  /**
   * Import events from Google Calendar
   */
  async importFromGoogle() {
    try {
      const accessToken = await this.getAccessToken();

      // Get events from Google Calendar for next 3 years
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const { items } = await response.json();

      // Import events to PrivateCharterX calendar
      for (const googleEvent of items) {
        await this.importGoogleEvent(googleEvent);
      }

      return { success: true, count: items.length };
    } catch (error) {
      console.error('Error importing from Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Import single Google Calendar event
   */
  async importGoogleEvent(googleEvent) {
    try {
      // Check if event already exists
      const { data: existing } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('google_event_id', googleEvent.id)
        .single();

      if (existing) {
        // Event already imported, skip
        return;
      }

      // Create new event in PrivateCharterX
      const eventData = {
        user_id: this.userId,
        title: googleEvent.summary || '(No title)',
        description: googleEvent.description || '',
        event_type: 'personal',
        start_date: googleEvent.start.dateTime || googleEvent.start.date,
        end_date: googleEvent.end.dateTime || googleEvent.end.date,
        all_day: !googleEvent.start.dateTime,
        location: googleEvent.location || '',
        meeting_link: googleEvent.hangoutLink || '',
        google_event_id: googleEvent.id,
        synced_to_google: true,
        status: 'confirmed',
        color: this.getPrivateCharterXColor(googleEvent.colorId)
      };

      await supabase
        .from('calendar_events')
        .insert([eventData]);
    } catch (error) {
      console.error('Error importing Google event:', error);
    }
  }

  /**
   * Map Google Calendar colors to PrivateCharterX colors
   */
  getPrivateCharterXColor(googleColorId) {
    const colorMap = {
      '9': '#3B82F6',  // Blue
      '10': '#10B981', // Green
      '3': '#8B5CF6',  // Purple
      '5': '#F59E0B',  // Yellow/Orange
      '11': '#EF4444', // Red
      '8': '#6B7280',  // Gray
      '4': '#EC4899'   // Pink
    };

    return colorMap[googleColorId] || '#3B82F6';
  }
}

export default GoogleCalendarService;
