import { supabase } from '../lib/supabase';

/**
 * Calendar Notification Service
 * Handles notifications for calendar events and reminders
 */

/**
 * Create a calendar event notification
 * @param {string} userId - User ID
 * @param {string} eventTitle - Event title
 * @param {string} eventDate - Event date/time
 * @param {boolean} googleSynced - Whether synced to Google Calendar
 */
export async function notifyCalendarEventAdded(userId, eventTitle, eventDate, googleSynced = false) {
  try {
    const notifications = [
      {
        user_id: userId,
        type: 'calendar_entry',
        title: 'Event Added to Calendar',
        message: `"${eventTitle}" has been added to your calendar`,
        is_read: false,
        action_url: '/dashboard?view=calendar'
      }
    ];

    if (googleSynced) {
      notifications.push({
        user_id: userId,
        type: 'calendar_entry',
        title: 'Synced to Google Calendar',
        message: `"${eventTitle}" has been synced to your Google Calendar`,
        is_read: false
      });
    }

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error creating calendar notification:', error);
    return { success: false, error };
  }
}

/**
 * Schedule a reminder notification for a calendar event
 * Uses the user's local timezone for accurate reminder timing
 * @param {string} userId - User ID
 * @param {string} eventId - Calendar event ID
 * @param {string} eventTitle - Event title
 * @param {Date} eventStartTime - Event start time (Date object)
 * @param {number} reminderMinutes - Minutes before event to remind
 * @param {string} location - Event location (optional)
 * @param {string} userTimezone - User's timezone (e.g., 'America/New_York')
 */
export async function scheduleReminderNotification(
  userId,
  eventId,
  eventTitle,
  eventStartTime,
  reminderMinutes,
  location = null,
  userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
) {
  try {
    // Calculate reminder time in user's timezone
    const reminderDate = new Date(eventStartTime);
    reminderDate.setMinutes(reminderDate.getMinutes() - reminderMinutes);

    const now = new Date();

    // If reminder time has already passed, don't create it
    if (reminderDate <= now) {
      console.log('Reminder time has passed, skipping');
      return { success: false, reason: 'past' };
    }

    // Create scheduled notification
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: userId,
        event_id: eventId,
        type: 'calendar_reminder',
        title: `Reminder: ${eventTitle}`,
        message: `Your event "${eventTitle}" starts ${formatReminderTime(reminderMinutes)}${location ? ` at ${location}` : ''}`,
        scheduled_for: reminderDate.toISOString(),
        timezone: userTimezone,
        sent: false,
        metadata: {
          event_title: eventTitle,
          event_start: eventStartTime.toISOString(),
          reminder_minutes: reminderMinutes,
          location
        }
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Scheduled reminder for "${eventTitle}" at ${reminderDate.toISOString()}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error scheduling reminder notification:', error);
    return { success: false, error };
  }
}

/**
 * Cancel scheduled reminders for an event
 * @param {string} eventId - Calendar event ID
 */
export async function cancelEventReminders(eventId) {
  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('event_id', eventId)
      .eq('sent', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error canceling reminders:', error);
    return { success: false, error };
  }
}

/**
 * Update reminder for an event
 * @param {string} eventId - Calendar event ID
 * @param {Object} updates - Updates to apply
 */
export async function updateEventReminder(eventId, updates) {
  try {
    // Cancel existing reminders
    await cancelEventReminders(eventId);

    // Create new reminder if provided
    if (updates.reminderMinutes && updates.reminderMinutes > 0) {
      return await scheduleReminderNotification(
        updates.userId,
        eventId,
        updates.eventTitle,
        new Date(updates.eventStartTime),
        updates.reminderMinutes,
        updates.location,
        updates.userTimezone
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating reminder:', error);
    return { success: false, error };
  }
}

/**
 * Format reminder time in human-readable format
 * @param {number} minutes - Minutes before event
 * @returns {string} Formatted string
 */
function formatReminderTime(minutes) {
  if (minutes === 0) return 'now';
  if (minutes < 60) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  }

  return `in ${hours}h ${remainingMinutes}m`;
}

/**
 * Get user's timezone
 * @returns {string} User's timezone
 */
export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting timezone:', error);
    return 'UTC';
  }
}

export default {
  notifyCalendarEventAdded,
  scheduleReminderNotification,
  cancelEventReminders,
  updateEventReminder,
  getUserTimezone
};
