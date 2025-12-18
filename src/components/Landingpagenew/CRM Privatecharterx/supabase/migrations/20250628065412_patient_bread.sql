/*
  # Add color column to calendar_events table

  1. Schema Changes
    - Add `color` column to `calendar_events` table
    - Column is nullable text field to store Tailwind CSS classes for event colors

  2. Purpose
    - Support custom color coding for different types of calendar events
    - Fix schema cache error when fetching calendar events with color field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'color'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN color text;
  END IF;
END $$;