# Simple Setup (No CLI Required)

## DON'T WORRY - YOU DON'T NEED TO DEPLOY ANYTHING!

The edge function I created can be deployed later. For now, **the app will work perfectly fine** without it. Here's what happens:

### What Works RIGHT NOW (without edge function):
✅ Favourites with heart icons on all events
✅ Add events to calendar from Favourites page
✅ Google Calendar auto-sync (if connected)
✅ Notifications appear immediately when you add events to calendar
✅ Calendar events are created with all details

### What Needs the Edge Function (can deploy later):
⏰ Automatic reminder notifications at the scheduled time

---

## How It Works Now

### 1. Adding Events from Favourites
1. Go to any event in Events & Sports
2. Click the heart icon to favorite it
3. Go to Favourites (heart icon in header)
4. Click "Add to Calendar" or "Add & Sync" (if Google connected)
5. **BOOM** - You'll see notifications immediately in the bell icon!

### 2. Creating Calendar Events
1. Go to Calendar view
2. Click "New Event"
3. Fill in the details and set a reminder time
4. Click "Create Event"
5. **BOOM** - Notification appears instantly!

### 3. The Reminder System
- When you create an event with a reminder (e.g., "1 hour before")
- The reminder is **scheduled** in the database
- It will sit there until you deploy the edge function
- Once deployed, the cron job will check every minute and send reminders

---

## Want to Deploy the Edge Function? (Optional - Do This Later)

### Option 1: Use Supabase Dashboard (EASIEST - No CLI needed!)

1. **Upload the Edge Function Manually:**
   - Go to https://app.supabase.com
   - Select your project
   - Go to **Edge Functions** in the sidebar
   - Click **Create a new function**
   - Name it: `process-scheduled-reminders`
   - Copy the contents from: `/Users/macbookair/web3applicationfinaljsx/supabase/functions/process-scheduled-reminders/index.ts`
   - Paste it into the editor
   - Click **Deploy**

2. **Set Up the Cron Job:**
   - Go to **Database** → **Extensions**
   - Enable **pg_cron** if not enabled
   - Go to **SQL Editor**
   - Run this SQL:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Create the cron job (replace YOUR_PROJECT_REF and YOUR_ANON_KEY)
SELECT cron.schedule(
  'process-scheduled-reminders',
  '* * * * *',
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

**Find YOUR_PROJECT_REF and YOUR_ANON_KEY:**
- Go to **Settings** → **API**
- Project URL shows your project ref (e.g., `https://abcdefg.supabase.co` → `abcdefg` is your ref)
- Anon key is shown under "Project API keys"

### Option 2: Install Supabase CLI (For Future)

If you want to use the CLI later:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
cd /Users/macbookair/web3applicationfinaljsx
supabase functions deploy process-scheduled-reminders

# View logs
supabase functions logs process-scheduled-reminders
```

---

## Testing Without Edge Function

You can test everything **except** scheduled reminders:

### Test 1: Add Favourite to Calendar
1. Go to Events & Sports
2. Favorite an event (heart icon)
3. Go to Favourites
4. Click "Add to Calendar"
5. **Check bell icon** - you should see notification!

### Test 2: Create Event
1. Go to Calendar
2. Click "New Event"
3. Create an event
4. **Check bell icon** - notification appears!

### Test 3: Google Calendar Sync
1. Connect Google Calendar if not connected
2. Add event from Favourites
3. **Check bell icon** - you should see TWO notifications:
   - "Event Added to Calendar"
   - "Synced to Google Calendar"
4. Check your Google Calendar - event should be there!

---

## When You're Ready to Enable Reminders

Just follow **Option 1** above (Supabase Dashboard method) - takes about 5 minutes, no command line needed!

Once the edge function is deployed and cron job is set up:
- Reminders will automatically be sent at the scheduled time
- You'll see them in the bell icon
- Browser notifications will appear (if you allow them)

---

## Summary

**RIGHT NOW:**
- ✅ Everything works except scheduled reminder notifications
- ✅ You can add events to calendar
- ✅ Notifications work for calendar additions
- ✅ Google Calendar sync works
- ✅ App is fully functional

**LATER (when you want reminders):**
- 📦 Deploy edge function via Supabase Dashboard
- ⏰ Set up cron job with simple SQL
- 🔔 Reminder notifications start working automatically

**The files are all here and ready:**
- Edge function: `/Users/macbookair/web3applicationfinaljsx/supabase/functions/process-scheduled-reminders/index.ts`
- Helper service: `/Users/macbookair/web3applicationfinaljsx/src/services/calendarNotifications.js`
- Updated components are already working in your app

**Just refresh your browser and test it out!**
