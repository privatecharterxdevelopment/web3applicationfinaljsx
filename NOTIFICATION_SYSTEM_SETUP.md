# Real-Time Notification System - Setup Guide

## Overview
Complete real-time notification system with Supabase Realtime for instant user notifications across the platform.

## Features Implemented

### Notification Triggers
✅ **Launchpad Waitlist Joins** - Notifies project owner and user when someone joins a waitlist
✅ **P2P Marketplace Bids** - Notifies seller and bidder about bids
✅ **New Projects Launched** - Notifies all users when a new project goes live
✅ **Support Ticket Responses** - Notifies users when support responds to their tickets
✅ **Token Purchases** - Notifies buyer and seller when tokens are purchased
✅ **Token Sales** - Notifies project owner when their tokens are sold
✅ **Launchpad Bids** - Notifies when users bid on projects

### Real-Time Features
- **Instant Updates**: Supabase Realtime subscriptions for zero-delay notifications
- **Browser Notifications**: Native browser notifications for important events
- **Unread Count Badge**: Red badge showing unread notification count
- **Smart Grouping**: Notifications grouped by type with appropriate icons
- **Mark as Read**: Individual or bulk mark as read functionality
- **Auto-cleanup**: Old read notifications auto-deleted after 30 days

## Setup Instructions

### 1. Run Database Setup

Execute the SQL file to create all tables, triggers, and functions:

```bash
# Connect to your Supabase project and run:
psql -h <your-supabase-host> -U postgres -d postgres -f database/create_notifications_system.sql
```

Or use the Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `database/create_notifications_system.sql`
3. Click "Run"

### 2. Enable Realtime in Supabase

1. Go to **Database > Replication** in Supabase Dashboard
2. Enable replication for the `notifications` table
3. Select all events (INSERT, UPDATE, DELETE)

### 3. Install Required Dependencies

The notification system requires `date-fns` for time formatting:

```bash
npm install date-fns
```

### 4. Component Integration

The NotificationBell component is already integrated in the header at:
- **File**: `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx`
- **Line**: ~2220-2229

The integration is complete and working!

## How It Works

### Database Schema

**notifications table**:
- `id`: UUID primary key
- `user_id`: Reference to user
- `type`: Enum of notification types
- `title`: Short notification title
- `message`: Detailed message
- `related_id`: ID of related entity (project, bid, etc.)
- `related_type`: Type of related entity
- `action_url`: URL to navigate when clicked
- `image_url`: Optional image/icon
- `metadata`: JSON with additional data
- `is_read`: Boolean read status
- `created_at`: Timestamp

### Notification Types

```typescript
'waitlist_join'           // User joins launchpad waitlist
'p2p_bid'                 // Bid placed on P2P marketplace
'p2p_bid_accepted'        // Bid accepted by seller
'p2p_bid_rejected'        // Bid rejected by seller
'new_project_launched'    // New launchpad project goes live
'project_approved'        // User's project approved
'project_rejected'        // User's project rejected
'support_ticket_response' // Support team responds to ticket
'launchpad_bid'           // Bid on user's project
'token_purchase'          // Tokens purchased
'token_sale'              // User's tokens sold
'marketplace_purchase'    // Marketplace item purchased
'payment_received'        // Payment received
'kyc_approved'            // KYC verification approved
'kyc_rejected'            // KYC verification rejected
'transaction_completed'   // Transaction completed
```

### Automatic Triggers

The system automatically creates notifications for:

1. **Waitlist Join** (`launchpad_waitlist` INSERT)
   - Notifies project owner
   - Confirms to user who joined

2. **P2P Bid** (`p2p_bids` INSERT)
   - Notifies listing owner
   - Confirms to bidder

3. **New Project** (`launchpad_projects` UPDATE to 'active'/'upcoming')
   - Broadcasts to all users

4. **Support Response** (`support_ticket_messages` INSERT)
   - Notifies ticket owner (if response is from support)

5. **Token Purchase** (`launchpad_transactions` INSERT)
   - Notifies seller
   - Confirms to buyer

### Real-Time Subscription

The NotificationBell component subscribes to:
```javascript
supabase
  .channel('notifications-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${user.id}`
  }, handleNotification)
  .subscribe()
```

## Usage Examples

### Manual Notification Creation

You can manually create notifications from anywhere in your app:

```javascript
// Create a custom notification
await supabase
  .from('notifications')
  .insert({
    user_id: 'user-uuid',
    type: 'custom',
    title: 'Custom Event',
    message: 'Something happened!',
    related_id: 'entity-uuid',
    related_type: 'entity-type',
    action_url: '/some-page',
    metadata: {
      customData: 'value'
    }
  });
```

### Triggering Notifications

Notifications are automatically triggered by database events:

```javascript
// When user joins waitlist, notification is auto-created
await supabase
  .from('launchpad_waitlist')
  .insert({
    user_id: userId,
    project_id: projectId,
    signature: signature
  });
// ✅ Notification automatically sent to project owner and user
```

### Marking as Read

```javascript
// Mark single notification as read
await supabase
  .from('notifications')
  .update({ is_read: true, read_at: new Date().toISOString() })
  .eq('id', notificationId);

// Mark all as read
await supabase
  .from('notifications')
  .update({ is_read: true, read_at: new Date().toISOString() })
  .eq('user_id', userId)
  .eq('is_read', false);
```

## Browser Notifications

The system requests permission for browser notifications on load. Users will see native OS notifications for:
- New launchpad projects
- Bids on their listings
- Support responses
- Token purchases

## Testing

### Test Waitlist Notification
```sql
INSERT INTO launchpad_waitlist (user_id, project_id, signature)
VALUES (
  'test-user-id',
  'test-project-id',
  '0x...'
);
```

### Test P2P Bid Notification
```sql
INSERT INTO p2p_bids (listing_id, bidder_id, bid_amount)
VALUES (
  'test-listing-id',
  'test-bidder-id',
  50000
);
```

### Test New Project Notification
```sql
UPDATE launchpad_projects
SET status = 'active'
WHERE id = 'test-project-id';
```

## Maintenance

### Cleanup Old Notifications

Run this periodically (can be a cron job):
```sql
SELECT cleanup_old_notifications();
```

This deletes read notifications older than 30 days.

### Monitor Notification Volume

```sql
-- Count notifications by type
SELECT type, COUNT(*),
       COUNT(*) FILTER (WHERE is_read = false) as unread_count
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- Recent notification activity
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = false) as unread
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
```

## Troubleshooting

### Notifications Not Appearing
1. Check Supabase Realtime is enabled for `notifications` table
2. Verify RLS policies allow user to see their notifications
3. Check browser console for subscription errors
4. Verify user is authenticated

### Browser Notifications Not Working
1. Check browser notification permission is granted
2. Look for blocked notifications in browser settings
3. Ensure HTTPS is enabled (required for notifications)

### Triggers Not Firing
1. Verify trigger functions exist: `\df notify_*` in psql
2. Check trigger is attached: `\d+ launchpad_waitlist`
3. Look for errors in Supabase logs

## Performance Optimization

- **Indexes**: Already created on user_id, is_read, created_at
- **RLS**: Policies ensure users only see their own notifications
- **Pagination**: Limit 20 notifications in dropdown, more on full page
- **Cleanup**: Auto-delete old read notifications to prevent bloat

## Security

- Row Level Security (RLS) enabled
- Users can only view/update their own notifications
- System functions run as SECURITY DEFINER with proper permissions
- All notification triggers validate user access

## Future Enhancements

- [ ] Email notification digests
- [ ] Push notifications via web push API
- [ ] Notification preferences/settings per user
- [ ] Group notifications by project/type
- [ ] Rich notification templates with images
- [ ] Notification analytics dashboard

## Support

For issues or questions about the notification system, check:
- Supabase Dashboard > Database > notifications table
- Supabase Dashboard > Database > Logs
- Browser console for real-time errors
