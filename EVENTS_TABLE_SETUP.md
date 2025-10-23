# Events Table Setup Instructions

## Overview
The events functionality has been updated to fetch events from a Supabase `events` table instead of external APIs (Ticketmaster/Eventbrite). This provides better control, performance, and eliminates external API dependencies.

## Database Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/create_events_table.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project root directory
cd /path/to/Tokenization-main\ 2

# Run the migration
supabase db push
```

## What the Migration Does

1. **Creates `events` table** with the following structure:
   - Event details (name, description, category)
   - Date/time information (event_date, end_date, timezone)
   - Location details (venue, city, state, country)
   - Pricing information (price_min, price_max, currency, is_free)
   - Status and availability tracking
   - External links (event_url, ticket_url, image_url)
   - Platform tracking (ticketmaster, eventbrite, custom)

2. **Creates indexes** for better query performance on:
   - event_date
   - city
   - category
   - status
   - featured
   - platform

3. **Sets up Row Level Security (RLS)**:
   - Everyone can READ events
   - Only admins can INSERT/UPDATE/DELETE events

4. **Inserts sample events** including:
   - Miami Art Basel 2025
   - Ultra Music Festival 2025
   - Miami Grand Prix
   - South Beach Wine & Food Festival
   - Miami International Boat Show

## Code Changes

### Updated Files

1. **`src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx`**
   - `fetchEvents()` function now queries Supabase instead of external APIs
   - Event display logic updated to handle Supabase data format
   - Transforms Supabase events to match expected UI format

### Event Data Format

Events from Supabase are transformed to this format:

```javascript
{
  id: event.id,
  name: event.event_name,
  event_name: event.event_name,
  description: event.description,
  date: event.event_date,
  event_date: event.event_date,
  location: event.city || event.venue_name,
  venue: {
    name: event.venue_name,
    address: {
      city: event.city
    }
  },
  category: event.category,
  price_min: event.price_min,
  price_max: event.price_max,
  currency: event.currency,
  url: event.event_url || event.ticket_url,
  image: event.image_url,
  platform: event.platform || 'supabase',
  source: 'supabase'
}
```

## Adding New Events

### Via Supabase Dashboard

1. Go to **Table Editor** → **events**
2. Click **Insert row**
3. Fill in the event details:
   - **event_name** (required): Name of the event
   - **event_date** (required): Date and time of the event
   - **description**: Event description
   - **category**: Category (Music, Sports, Arts, etc.)
   - **venue_name**: Venue name
   - **city**, **state**, **country**: Location details
   - **price_min**, **price_max**, **currency**: Pricing
   - **event_url**: Link to event page
   - **image_url**: Event image URL
   - **status**: Set to 'active' for it to appear
4. Click **Save**

### Via SQL

```sql
INSERT INTO public.events (
  event_name,
  description,
  category,
  event_date,
  venue_name,
  city,
  state,
  country,
  price_min,
  price_max,
  currency,
  status,
  event_url,
  image_url,
  platform,
  featured
) VALUES (
  'Your Event Name',
  'Event description here',
  'Music',
  '2025-06-15 19:00:00-04:00',
  'Venue Name',
  'Miami',
  'FL',
  'USA',
  50.00,
  200.00,
  'USD',
  'active',
  'https://event-website.com',
  'https://event-image-url.com/image.jpg',
  'custom',
  true
);
```

## Event Display on Overview Page

Events are displayed in the **Events Card** on the overview page:
- Shows event name
- Shows location and date
- Rotates through events every few seconds
- Only shows upcoming events (past events are filtered out)
- Maximum of 10 events are fetched and rotated

## Admin Functions

Admins can manage events through:
- Supabase Dashboard (Table Editor)
- SQL Editor for bulk operations
- Future: Admin panel in the application

## Troubleshooting

### Events not showing up?

1. Check if the migration ran successfully
2. Verify events have `status = 'active'`
3. Ensure `event_date` is in the future
4. Check browser console for any errors
5. Verify Supabase connection is working

### Sample data not showing?

Run this query to check:
```sql
SELECT * FROM public.events WHERE status = 'active' AND event_date > NOW();
```

## Benefits of Supabase Events

✅ **No API Rate Limits**: No more 429 errors from external APIs
✅ **Better Performance**: Direct database queries are faster
✅ **Full Control**: Add/edit/remove events anytime
✅ **Cost Effective**: No external API subscription costs
✅ **Customizable**: Add custom fields as needed
✅ **Reliable**: No dependency on external services

## Migration from External APIs

The old implementation fetched from:
- Ticketmaster API (required `VITE_TICKETMASTER_CONSUMER_KEY`)
- Eventbrite API (required `VITE_EVENTBRITE_TOKEN`)

You can now remove these environment variables if they're not used elsewhere.

## Next Steps

1. Run the migration
2. Verify sample events appear on the overview page
3. Add your own events for your target audience
4. Consider adding an admin panel for easier event management
5. Set up automated event updates if needed (e.g., import from external sources on a schedule)
