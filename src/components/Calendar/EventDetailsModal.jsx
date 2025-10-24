import React, { useState } from 'react';
import {
  X, Calendar, Clock, MapPin, Users, Link as LinkIcon,
  Edit, Trash2, Check, XCircle, Mail, ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EventDetailsModal = ({ event, onClose, onEventUpdated, onEventDeleted, user, getStatusBadge }) => {
  const [attendees, setAttendees] = useState(event.event_attendees || []);
  const [isDeleting, setIsDeleting] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);

  const isOrganizer = event.user_id === user?.id;
  const currentUserAttendee = attendees.find(a => a.user_id === user?.id);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    if (event.all_day) {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      // Delete from Google Calendar if synced
      if (event.google_event_id) {
        await deleteFromGoogleCalendar(event.google_event_id);
      }

      onEventDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteFromGoogleCalendar = async (googleEventId) => {
    try {
      // Call Edge Function to delete from Google Calendar
      console.log('Deleting event from Google Calendar:', googleEventId);
    } catch (error) {
      console.error('Error deleting from Google Calendar:', error);
    }
  };

  const respondToInvitation = async (status) => {
    if (!currentUserAttendee) return;

    setRespondingTo(status);
    try {
      const { error } = await supabase
        .from('event_attendees')
        .update({
          status: status,
          responded_at: new Date().toISOString()
        })
        .eq('id', currentUserAttendee.id);

      if (error) throw error;

      // Update local state
      setAttendees(prev =>
        prev.map(a =>
          a.id === currentUserAttendee.id
            ? { ...a, status, responded_at: new Date().toISOString() }
            : a
        )
      );

      // Notify organizer
      await notifyOrganizer(status);
    } catch (error) {
      console.error('Error responding to invitation:', error);
      alert('Failed to respond to invitation');
    } finally {
      setRespondingTo(null);
    }
  };

  const notifyOrganizer = async (status) => {
    try {
      // Send email to organizer about response
      console.log(`User ${user.email} responded ${status} to event ${event.id}`);
      // Implementation would call Supabase Edge Function
    } catch (error) {
      console.error('Error notifying organizer:', error);
    }
  };

  const getEventTypeLabel = (type) => {
    const types = {
      flight: { label: 'Flight', icon: '✈️' },
      booking: { label: 'Booking', icon: '📝' },
      meeting: { label: 'Meeting', icon: '👥' },
      personal: { label: 'Personal', icon: '📅' },
      travel: { label: 'Travel', icon: '🌍' },
      other: { label: 'Other', icon: '📌' }
    };
    return types[type] || types.other;
  };

  const typeInfo = getEventTypeLabel(event.event_type);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{typeInfo.icon}</span>
                <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge(event.status)}
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  {typeInfo.label}
                </span>
                {event.google_event_id && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <ExternalLink size={12} />
                    Synced with Google
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Invitation Response (for attendees) */}
          {!isOrganizer && currentUserAttendee && currentUserAttendee.status === 'pending' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-3">
                You've been invited to this event. Will you attend?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => respondToInvitation('accepted')}
                  disabled={respondingTo !== null}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Accept
                </button>
                <button
                  onClick={() => respondToInvitation('tentative')}
                  disabled={respondingTo !== null}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  Maybe
                </button>
                <button
                  onClick={() => respondToInvitation('declined')}
                  disabled={respondingTo !== null}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle size={16} />
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Date & Time</p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Start:</span> {formatDateTime(event.start_date)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">End:</span> {formatDateTime(event.end_date)}
                </p>
                {event.all_day && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    All day
                  </span>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                </div>
              </div>
            )}

            {/* Meeting Link */}
            {event.meeting_link && (
              <div className="flex items-start gap-3">
                <ExternalLink size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Meeting Link</p>
                  <a
                    href={event.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                  >
                    {event.meeting_link}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Description</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                {event.description}
              </p>
            </div>
          )}

          {/* Linked Resources */}
          {(event.chat_request_id || event.booking_id) && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <LinkIcon size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900 mb-2">Linked Resources</p>
                  {event.chat_request_id && (
                    <button
                      onClick={() => window.location.hash = '#chat-requests'}
                      className="text-sm text-purple-700 hover:underline block mb-1"
                    >
                      → View Chat Request
                    </button>
                  )}
                  {event.booking_id && (
                    <button
                      onClick={() => window.location.hash = '#requests'}
                      className="text-sm text-purple-700 hover:underline block"
                    >
                      → View Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendees */}
          {attendees.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={20} className="text-gray-400" />
                <p className="text-sm font-medium text-gray-900">
                  Attendees ({attendees.length})
                </p>
              </div>
              <div className="space-y-2">
                {attendees.map(attendee => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                        {(attendee.name || attendee.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {attendee.name || 'User'}
                          {attendee.role === 'organizer' && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              Organizer
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{attendee.email}</div>
                      </div>
                    </div>
                    <div>
                      {attendee.status === 'accepted' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          ✓ Accepted
                        </span>
                      )}
                      {attendee.status === 'declined' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          ✕ Declined
                        </span>
                      )}
                      {attendee.status === 'tentative' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          ? Maybe
                        </span>
                      )}
                      {attendee.status === 'pending' && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reminder */}
          {event.reminder_minutes > 0 && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock size={16} className="text-gray-400" />
              <span>Reminder set for {event.reminder_minutes} minutes before</span>
            </div>
          )}

          {/* Created Info */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            Created {new Date(event.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Footer - Actions (only for organizer) */}
        {isOrganizer && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {/* Open edit modal */}}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Edit size={16} />
                Edit Event
              </button>
            </div>
          </div>
        )}

        {/* Footer - Close (for non-organizers) */}
        {!isOrganizer && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailsModal;
