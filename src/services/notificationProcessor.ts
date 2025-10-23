import { supabase } from '../lib/supabase';
import { sendNotification } from './notifications';

/**
 * Process scheduled notifications that are due
 * This should be called periodically (e.g., every minute via a cron job or in the app)
 */
export const processScheduledNotifications = async () => {
  try {
    const now = new Date().toISOString();

    // Get all unsent notifications that are due
    const { data: dueNotifications, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_for', now)
      .limit(100); // Process max 100 at a time

    if (error) throw error;

    if (!dueNotifications || dueNotifications.length === 0) {
      return { success: true, processed: 0 };
    }

    // Process each notification
    const results = await Promise.allSettled(
      dueNotifications.map(async (notification) => {
        try {
          // Send the notification
          await sendNotification({
            userId: notification.user_id,
            type: notification.type,
            title: notification.title,
            message: notification.message
          });

          // Mark as sent
          await supabase
            .from('scheduled_notifications')
            .update({
              sent: true,
              sent_at: new Date().toISOString()
            })
            .eq('id', notification.id);

          return { success: true, id: notification.id };
        } catch (error) {
          console.error(`Failed to process notification ${notification.id}:`, error);
          return { success: false, id: notification.id, error };
        }
      })
    );

    const processed = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    return {
      success: true,
      processed,
      total: dueNotifications.length
    };
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    return { success: false, error };
  }
};

/**
 * Start periodic processing of scheduled notifications
 * Call this once when the app starts
 */
export const startNotificationProcessor = () => {
  // Check for due notifications every minute
  const intervalId = setInterval(() => {
    processScheduledNotifications().catch(console.error);
  }, 60000); // 60 seconds

  // Also run immediately on start
  processScheduledNotifications().catch(console.error);

  return intervalId;
};

/**
 * Stop the notification processor
 */
export const stopNotificationProcessor = (intervalId: NodeJS.Timeout) => {
  clearInterval(intervalId);
};
