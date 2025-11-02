// Supabase Edge Function: process-scheduled-reminders
// This function processes scheduled reminder notifications and sends them to users
// It should be triggered by a Supabase cron job every minute

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const now = new Date().toISOString()

    console.log(`Processing scheduled reminders at ${now}`)

    // Get all unsent scheduled notifications that are due
    const { data: scheduledNotifications, error: fetchError } = await supabaseClient
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(100) // Process up to 100 at a time

    if (fetchError) {
      console.error('Error fetching scheduled notifications:', fetchError)
      throw fetchError
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log('No scheduled notifications to process')
      return new Response(
        JSON.stringify({ message: 'No notifications to process', count: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`Found ${scheduledNotifications.length} notifications to process`)

    let successCount = 0
    let errorCount = 0

    // Process each notification
    for (const scheduled of scheduledNotifications) {
      try {
        // Create the actual notification
        const { error: insertError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: scheduled.user_id,
            type: scheduled.type,
            title: scheduled.title,
            message: scheduled.message,
            is_read: false,
            action_url: scheduled.metadata?.action_url || null,
            metadata: scheduled.metadata || {}
          })

        if (insertError) {
          console.error(`Error creating notification for scheduled ID ${scheduled.id}:`, insertError)
          errorCount++
          continue
        }

        // Mark scheduled notification as sent
        const { error: updateError } = await supabaseClient
          .from('scheduled_notifications')
          .update({
            sent: true,
            sent_at: new Date().toISOString()
          })
          .eq('id', scheduled.id)

        if (updateError) {
          console.error(`Error updating scheduled notification ${scheduled.id}:`, updateError)
          errorCount++
        } else {
          console.log(`Successfully sent notification for scheduled ID ${scheduled.id}`)
          successCount++
        }

      } catch (error) {
        console.error(`Error processing notification ${scheduled.id}:`, error)
        errorCount++
      }
    }

    console.log(`Processed ${successCount + errorCount} notifications: ${successCount} success, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        message: 'Scheduled reminders processed',
        total: scheduledNotifications.length,
        success: successCount,
        errors: errorCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/*
SETUP INSTRUCTIONS:

1. Deploy this edge function:
   supabase functions deploy process-scheduled-reminders

2. Create a Postgres cron job to run this function every minute:
   Run this SQL in Supabase SQL Editor:

   -- Enable pg_cron extension
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

3. Alternative: Use Supabase Dashboard to set up the cron job:
   - Go to Database > Cron Jobs
   - Click "Create a new cron job"
   - Name: process-scheduled-reminders
   - Schedule: * * * * * (every minute)
   - Command: (use the SQL above)

4. Monitor the function:
   supabase functions logs process-scheduled-reminders

5. Test manually:
   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-scheduled-reminders \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json"
*/
