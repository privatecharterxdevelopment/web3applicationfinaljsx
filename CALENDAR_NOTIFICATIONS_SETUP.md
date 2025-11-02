# Calendar & Notifications Setup Guide

This guide explains the new calendar and notification features that have been implemented.

## Features Implemented

### 1. Automatic Calendar Integration from Favourites
- When you click "Add to Calendar" on any favourite event, it automatically creates a calendar entry
- If Google Calendar is connected, the event syncs automatically to Google Calendar
- You receive instant notifications in the bell icon when events are added
- The button shows "Add & Sync" when Google Calendar is connected

### 2. Simplified Calendar Event Creation
- The calendar event form now automatically creates notifications
- Reminders are scheduled based on your local timezone
- Google Calendar sync happens automatically if connected
- You get notified when events are added and when they're synced to Google

### 3. Smart Reminder System
- Reminders respect your local timezone (uses browser timezone detection)
- Scheduled reminders appear in the notification bell at the right time
- All reminder notifications show up in the notifications page
- You can set reminders from 15 minutes to 1 day before an event

## How It Works

### Adding Events from Favourites

1. **Go to Favourites** (heart icon in header)
2. **Find an event** you want to add to your calendar
3. **Click "Add to Calendar"** button
   - If Google Calendar is connected: Button shows "Add & Sync"
   - If not connected: Button shows "Add to Calendar"
4. **Check notifications** (bell icon) - you'll see:
   - "Event Added to Calendar" notification
   - "Synced to Google Calendar" notification (if connected)

### Creating Calendar Events Manually

1. **Go to Calendar** view in the dashboard
2. **Click "New Event"**
3. **Fill in the details:**
   - Title (required)
   - Event type (Flight, Booking, Meeting, etc.)
   - Date and time
   - Location
   - Reminder time
4. **Submit** - notifications are created automatically

### Viewing Notifications

1. **Click the bell icon** in the header
2. **See all notifications** including:
   - Calendar event additions
   - Google Calendar sync confirmations
   - Upcoming event reminders (sent at the scheduled time)
3. **Click a notification** to navigate to the calendar
4. **Mark as read** or delete individual notifications

## Notification Types

| Type | Description | When It Appears |
|------|-------------|-----------------|
| `calendar_entry` | Event added to calendar | Immediately when event is created |
| `calendar_entry` | Synced to Google Calendar | Immediately after Google sync completes |
| `calendar_reminder` | Upcoming event reminder | At the scheduled reminder time (e.g., 1 hour before) |

## Setup Required (For Developers/Admins)

### Database Tables

The following tables are used (should already exist):

1. **`calendar_events`** - Stores calendar events
2. **`notifications`** - Stores all notifications
3. **`scheduled_notifications`** - Stores future reminder notifications
4. **`google_calendar_connections`** - Stores Google Calendar OAuth tokens

### Supabase Edge Function Setup

A background job needs to be set up to process scheduled reminders:

#### Deploy the Edge Function

```bash
cd /Users/macbookair/web3applicationfinaljsx
supabase functions deploy process-scheduled-reminders
```

#### Set Up Cron Job

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to process reminders every minute
SELECT cron.schedule(
  'process-scheduled-reminders',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-scheduled-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your Supabase anon key

#### Verify Cron Job

```sql
-- Check if cron job is created
SELECT * FROM cron.job;

-- View cron job history
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-scheduled-reminders')
ORDER BY start_time DESC
LIMIT 10;
```

### Testing the System

#### Test 1: Add Event from Favourites

1. Go to Events & Sports and add an event to favourites
2. Go to Favourites view
3. Click "Add to Calendar" on the event
4. Check notifications bell - you should see notification immediately

#### Test 2: Create Calendar Event with Reminder

1. Go to Calendar view
2. Click "New Event"
3. Create an event starting in 20 minutes
4. Set reminder to "15 minutes before"
5. Submit the event
6. Check notifications - you should see "Event Added" notification
7. Wait 5 minutes (until 15 minutes before the event)
8. Check notifications again - you should see the reminder notification

#### Test 3: Google Calendar Sync

1. Connect Google Calendar (if not already connected)
2. Add an event from Favourites
3. Check notifications - you should see TWO notifications:
   - "Event Added to Calendar"
   - "Synced to Google Calendar"
4. Open your Google Calendar - the event should be there

### Manual Testing of Edge Function

Test the reminder processor manually:

```bash
# Test the edge function
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-scheduled-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: "application/json"

# Check the response - should show processed count
```

### Monitoring

View Edge Function logs:

```bash
supabase functions logs process-scheduled-reminders --follow
```

Check scheduled notifications in database:

```sql
-- View pending scheduled notifications
SELECT * FROM scheduled_notifications
WHERE sent = false
ORDER BY scheduled_for ASC;

-- View recently sent notifications
SELECT * FROM scheduled_notifications
WHERE sent = true
ORDER BY sent_at DESC
LIMIT 20;
```

## Troubleshooting

### Notifications not appearing

1. Check browser console for errors
2. Verify notification permissions are granted
3. Check the `notifications` table in Supabase

### Reminders not firing

1. Check if the cron job is running:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
   ```
2. Check Edge Function logs for errors
3. Verify scheduled_notifications table has entries

### Google Calendar not syncing

1. Check if Google Calendar is connected (green badge in Calendar view)
2. Check browser console for sync errors
3. Verify Google Calendar OAuth tokens in database
4. Check if tokens have expired

## Files Modified/Created

### New Files Created
- `/src/services/calendarNotifications.js` - Helper functions for calendar notifications
- `/supabase/functions/process-scheduled-reminders/index.ts` - Edge function for processing reminders
- This setup guide

### Modified Files
- `/src/components/Favourites/FavouritesView.jsx` - Auto calendar sync from favourites
- `/src/components/Calendar/CreateEventModal.jsx` - Simplified notification creation with timezone support

## User Experience Flow

```
User Journey: Adding Favourite to Calendar

1. User favorites an event in Events & Sports
   ↓
2. User navigates to Favourites view
   ↓
3. User clicks "Add to Calendar" (or "Add & Sync" if Google connected)
   ↓
4. System creates calendar event with:
   - Event details from favourite
   - Default 1-hour reminder
   - User's local timezone
   ↓
5. System creates notification: "Event Added to Calendar"
   ↓
6. If Google Calendar connected:
   - System syncs to Google Calendar
   - System creates notification: "Synced to Google Calendar"
   ↓
7. System schedules reminder notification for 1 hour before event
   ↓
8. User sees bell icon badge with unread count
   ↓
9. User clicks bell icon and sees all notifications
   ↓
10. At reminder time (1 hour before event):
    - Cron job processes scheduled notification
    - User sees reminder notification in bell icon
    - Browser notification shown (if permitted)
```

## Best Practices

1. **Always set reminders** - Users appreciate being reminded of upcoming events
2. **Use appropriate reminder times** - Default is 1 hour, but adjust based on event type
3. **Keep notifications concise** - Title and message should be clear and brief
4. **Test with different timezones** - Ensure reminders work correctly for users in different regions
5. **Monitor the cron job** - Check logs regularly to ensure reminders are being processed

## Future Enhancements

Potential improvements that could be added:

1. **SMS/Email reminders** - In addition to in-app notifications
2. **Multiple reminders** - Allow users to set multiple reminder times for one event
3. **Snooze reminders** - Allow users to snooze a reminder for later
4. **Recurring events** - Support for recurring calendar events
5. **Calendar sharing** - Share calendar with other users
6. **iCal export** - Export calendar to .ics format
7. **Timezone selector** - Manual timezone selection for events

## Support

For issues or questions about this feature:
1. Check browser console for error messages
2. Verify Supabase Edge Function logs
3. Check database tables for data integrity
4. Review this documentation for setup steps
