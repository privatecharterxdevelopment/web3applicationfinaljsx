import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://waqhyhebpgngumxfejfl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWh5aGVicGduZ3VteGZlamZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDg3OTksImV4cCI6MjA0ODAyNDc5OX0.2ikJJqtqFdTQ1kKkmT0GC_wLy2dHJqAwp8ygR76WHGA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addWelcomeNotification() {
  try {
    // Find user with email containing 'eltesto'
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .or('email.ilike.%eltesto%,first_name.ilike.%eltesto%,last_name.ilike.%eltesto%');

    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No user found with "eltesto" in email or name');
      return;
    }

    const user = users[0];
    console.log('Found user:', user.email, '- ID:', user.id);

    // Create welcome notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'welcome',
        title: 'Welcome to PVCX!',
        message: `Hi ${user.first_name || 'there'}! Welcome to the PVCX platform. You've received 100 PVCX tokens as a welcome bonus. Start exploring tokenized assets, P2P marketplace, and exclusive travel services.`,
        is_read: false
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      return;
    }

    console.log('✅ Welcome notification created successfully!');
    console.log('Notification ID:', notification.id);

    // Also create a few sample notifications for testing
    const sampleNotifications = [
      {
        user_id: user.id,
        type: 'booking_update',
        title: 'Booking Confirmed',
        message: 'Your taxi booking from Geneva to Zurich has been confirmed. Driver will contact you 30 minutes before pickup.',
        is_read: false
      },
      {
        user_id: user.id,
        type: 'p2p_bid',
        title: 'New Bid Received',
        message: 'You received a new bid of 150 PVCX for your Dubai Villa token listing.',
        is_read: false
      },
      {
        user_id: user.id,
        type: 'document_status',
        title: 'Document Approved',
        message: 'Your KYC documents have been reviewed and approved. You can now access all platform features.',
        is_read: true
      },
      {
        user_id: user.id,
        type: 'calendar_entry',
        title: 'Calendar Entry Added',
        message: 'Your private jet booking for Paris on Jan 25, 2025 has been added to your calendar.',
        is_read: false
      }
    ];

    const { error: batchError } = await supabase
      .from('notifications')
      .insert(sampleNotifications);

    if (batchError) {
      console.error('Error creating sample notifications:', batchError);
    } else {
      console.log('✅ Sample notifications created successfully!');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addWelcomeNotification();
