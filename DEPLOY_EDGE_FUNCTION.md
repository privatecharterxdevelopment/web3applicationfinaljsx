# Quick Guide: Deploy Edge Function for Calendar Reminders

## Location
The edge function is here:
```
/Users/macbookair/web3applicationfinaljsx/supabase/functions/process-scheduled-reminders/index.ts
```

## Step 1: Deploy the Function

Open your terminal and run:

```bash
cd /Users/macbookair/web3applicationfinaljsx
supabase functions deploy process-scheduled-reminders
```

If you get an error about Supabase CLI not being installed, install it first:
```bash
# On macOS
brew install supabase/tap/supabase

# Then login
supabase login

# Then link your project
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 2: Set Up Cron Job (Auto-run every minute)

### Option A: Using Supabase Dashboard (EASIEST)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Database** → **Extensions**
4. Enable **pg_cron** extension if not already enabled
5. Go to **SQL Editor**
6. Create a new query and paste this:

```sql
-- Create cron job to process reminders every minute
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

**IMPORTANT:** Replace these values:
- `YOUR_PROJECT_REF` - Find this in your Supabase project settings (e.g., `abcdefghijklmno`)
- `YOUR_ANON_KEY` - Find this in **Settings → API → Project API keys → anon public**

7. Click **Run** to execute

### Option B: Manual SQL (Alternative)

If you prefer, you can also enable the extension and create the cron job in one go:

```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension (needed for calling edge functions)
CREATE EXTENSION IF NOT EXISTS http;

-- Schedule the job
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

## Step 3: Verify It's Working

### Check Cron Jobs

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View recent runs
SELECT * FROM cron.job_run_details
WHERE jobname = 'process-scheduled-reminders'
ORDER BY start_time DESC
LIMIT 10;
```

### Test Manually

You can also test the function manually without waiting:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-scheduled-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

You should get a response like:
```json
{
  "message": "Scheduled reminders processed",
  "total": 0,
  "success": 0,
  "errors": 0
}
```

## Step 4: Test End-to-End

1. **Create a test event with a reminder:**
   - Go to Calendar in your app
   - Create event starting in 10 minutes
   - Set reminder to "15 minutes before" (it will be in the past, perfect for testing)

2. **Wait 1 minute** (the cron job runs every minute)

3. **Check notifications:**
   - Click the bell icon in header
   - You should see the reminder notification

4. **Check database:**
```sql
-- Check scheduled notifications
SELECT * FROM scheduled_notifications
WHERE sent = true
ORDER BY sent_at DESC
LIMIT 10;

-- Check notifications
SELECT * FROM notifications
WHERE type = 'calendar_reminder'
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### "Cron job not running"

Check if extensions are enabled:
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'http');
```

If not found, enable them:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;
```

### "Edge function not found"

1. Make sure you deployed it: `supabase functions deploy process-scheduled-reminders`
2. Check it's listed: `supabase functions list`
3. View logs: `supabase functions logs process-scheduled-reminders`

### "No notifications appearing"

1. Check scheduled_notifications table:
```sql
SELECT * FROM scheduled_notifications WHERE sent = false;
```

2. If there are unsent notifications, manually trigger the function:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-scheduled-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

3. Check the response for any errors

### "Cron job created but not executing"

View execution history:
```sql
SELECT * FROM cron.job_run_details
WHERE jobname = 'process-scheduled-reminders'
ORDER BY start_time DESC;
```

If no results, the job might not be scheduled correctly. Delete and recreate:
```sql
-- Delete the job
SELECT cron.unschedule('process-scheduled-reminders');

-- Recreate it (use the SQL from Step 2)
```

## Quick Reference

**Your edge function location:**
```
/Users/macbookair/web3applicationfinaljsx/supabase/functions/process-scheduled-reminders/
```

**Deploy command:**
```bash
cd /Users/macbookair/web3applicationfinaljsx
supabase functions deploy process-scheduled-reminders
```

**View logs:**
```bash
supabase functions logs process-scheduled-reminders --follow
```

**Test manually:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-scheduled-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

That's it! Once deployed and the cron job is set up, reminders will automatically be sent to users at the scheduled time.
