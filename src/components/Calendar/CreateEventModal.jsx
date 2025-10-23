import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendNotification } from '../../services/notifications';

const CreateEventModal = ({ onClose, onEventCreated, user, linkedChatRequest = null, linkedBooking = null, prefillData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'personal',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    all_day: false,
    location: '',
    meeting_link: '',
    color: '#3B82F6',
    reminder_minutes: 60
  });

  const [attendees, setAttendees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill if linked to chat request
    if (linkedChatRequest) {
      setFormData(prev => ({
        ...prev,
        title: `Travel Request: ${linkedChatRequest.query}`,
        description: `From: ${linkedChatRequest.from_location || 'N/A'}\nTo: ${linkedChatRequest.to_location || 'N/A'}\nPassengers: ${linkedChatRequest.passengers || 'N/A'}`,
        event_type: 'travel',
        start_date: linkedChatRequest.date_start || '',
        location: linkedChatRequest.from_location || '',
        color: '#F59E0B'
      }));
    }

    // Pre-fill if linked to booking
    if (linkedBooking) {
      setFormData(prev => ({
        ...prev,
        title: `Booking: ${linkedBooking.title}`,
        description: linkedBooking.description || '',
        event_type: 'booking',
        color: '#10B981'
      }));
    }

    // Pre-fill from favourites
    if (prefillData) {
      const eventDate = prefillData.event_date ? new Date(prefillData.event_date) : null;
      setFormData(prev => ({
        ...prev,
        title: prefillData.event_name || '',
        description: `Source: ${prefillData.source || 'Event'}\nCategory: ${prefillData.category || 'N/A'}`,
        event_type: 'event',
        start_date: eventDate ? eventDate.toISOString().split('T')[0] : '',
        start_time: eventDate ? eventDate.toISOString().split('T')[1].substring(0, 5) : '',
        location: prefillData.location || '',
        color: '#8B5CF6'
      }));
    }
  }, [linkedChatRequest, linkedBooking, prefillData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Search for users by email or name in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;

      // Filter out already added attendees and current user
      const filtered = (data || []).filter(
        u => u.id !== user.id && !attendees.find(a => a.user_id === u.id)
      );

      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const addAttendee = (user) => {
    setAttendees(prev => [...prev, {
      user_id: user.id,
      email: user.email,
      name: user.full_name || user.email,
      role: 'attendee',
      status: 'pending'
    }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeAttendee = (userId) => {
    setAttendees(prev => prev.filter(a => a.user_id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time
      const startDateTime = formData.all_day
        ? new Date(formData.start_date).toISOString()
        : new Date(`${formData.start_date}T${formData.start_time}`).toISOString();

      const endDateTime = formData.all_day
        ? new Date(formData.end_date || formData.start_date).toISOString()
        : new Date(`${formData.end_date || formData.start_date}T${formData.end_time || formData.start_time}`).toISOString();

      // Create event
      const eventData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        start_date: startDateTime,
        end_date: endDateTime,
        all_day: formData.all_day,
        location: formData.location,
        meeting_link: formData.meeting_link,
        color: formData.color,
        reminder_minutes: formData.reminder_minutes,
        status: 'confirmed',
        chat_request_id: linkedChatRequest?.id || null,
        booking_id: linkedBooking?.id || null
      };

      const { data: event, error: eventError } = await supabase
        .from('calendar_events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) {
        console.error('Event creation error:', eventError);
        throw new Error(`Failed to create event: ${eventError.message || JSON.stringify(eventError)}`);
      }

      // Add attendees
      if (attendees.length > 0) {
        const attendeesData = attendees.map(a => ({
          event_id: event.id,
          user_id: a.user_id,
          email: a.email,
          name: a.name,
          role: a.role,
          status: 'pending'
        }));

        const { error: attendeesError } = await supabase
          .from('event_attendees')
          .insert(attendeesData);

        if (attendeesError) throw attendeesError;

        // Send notifications to attendees (would be done via Supabase Edge Function)
        console.log('Sending invitations to:', attendees.map(a => a.email));
      }

      // Sync to Google Calendar if connected (non-blocking)
      syncToGoogleCalendar(event).catch(err => {
        console.error('Google Calendar sync failed:', err);
      });

      // Create reminder notification if reminder is set (non-blocking)
      if (formData.reminder_minutes > 0) {
        const reminderDate = new Date(startDateTime);
        reminderDate.setMinutes(reminderDate.getMinutes() - formData.reminder_minutes);

        const now = new Date();

        // If reminder time is in the future, schedule it
        // If it's immediate or past (which shouldn't happen), create notification now
        if (reminderDate <= now) {
          // Create notification immediately
          sendNotification({
            userId: user.id,
            type: 'calendar_reminder',
            title: `Reminder: ${formData.title}`,
            message: `Your event "${formData.title}" is starting ${formData.reminder_minutes === 0 ? 'now' : 'soon'}${formData.location ? ` at ${formData.location}` : ''}.`,
            smsText: `Reminder: ${formData.title} - ${new Date(startDateTime).toLocaleString()}`
          }).catch(err => {
            console.error('Failed to send notification:', err);
          });
        } else {
          // Schedule a notification for the future by creating a scheduled notification record
          supabase
            .from('scheduled_notifications')
            .insert([{
              user_id: user.id,
              event_id: event.id,
              type: 'calendar_reminder',
              title: `Reminder: ${formData.title}`,
              message: `Your event "${formData.title}" is starting soon${formData.location ? ` at ${formData.location}` : ''}.`,
              scheduled_for: reminderDate.toISOString(),
              sent: false
            }])
            .then(({ error }) => {
              if (error) console.error('Failed to schedule notification:', error);
            });
        }
      }

      onEventCreated();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to create event: ${errorMessage}\n\nPlease check the console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const syncToGoogleCalendar = async (event) => {
    try {
      const { data: connection } = await supabase
        .from('google_calendar_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (connection && connection.sync_enabled) {
        // Call Edge Function to sync with Google Calendar
        console.log('Syncing event to Google Calendar:', event.id);
        // Implementation would call Supabase Edge Function
      }
    } catch (error) {
      console.log('No Google Calendar connection');
    }
  };

  const eventTypes = [
    { value: 'flight', label: 'Flight', color: '#3B82F6' },
    { value: 'booking', label: 'Booking', color: '#10B981' },
    { value: 'meeting', label: 'Meeting', color: '#8B5CF6' },
    { value: 'personal', label: 'Personal', color: '#6B7280' },
    { value: 'travel', label: 'Travel', color: '#F59E0B' },
    { value: 'other', label: 'Other', color: '#EC4899' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create Event</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Linked Info */}
            {(linkedChatRequest || linkedBooking) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <LinkIcon size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Linked to {linkedChatRequest ? 'Chat Request' : 'Booking'}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {linkedChatRequest?.query || linkedBooking?.title}
                  </p>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Flight to London"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Event Type & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={(e) => {
                    const selected = eventTypes.find(t => t.value === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      event_type: e.target.value,
                      color: selected?.color || prev.color
                    }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full h-10 px-2 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="all_day"
                id="all_day"
                checked={formData.all_day}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="all_day" className="text-sm font-medium text-gray-700">
                All day event
              </label>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!formData.all_day && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!formData.all_day && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Zurich Airport"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Add more details about this event..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Meeting Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link
              </label>
              <input
                type="url"
                name="meeting_link"
                value={formData.meeting_link}
                onChange={handleChange}
                placeholder="https://zoom.us/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reminder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder
              </label>
              <select
                name="reminder_minutes"
                value={formData.reminder_minutes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">No reminder</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="120">2 hours before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>

            {/* Attendees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users size={16} className="inline mr-1" />
                Invite Attendees (PrivateCharterX users only)
              </label>

              {/* Search Box */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => addAttendee(user)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'User'}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Attendees */}
              {attendees.length > 0 && (
                <div className="space-y-2">
                  {attendees.map(attendee => (
                    <div
                      key={attendee.user_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                          {attendee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{attendee.name}</div>
                          <div className="text-xs text-gray-500">{attendee.email}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttendee(attendee.user_id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
