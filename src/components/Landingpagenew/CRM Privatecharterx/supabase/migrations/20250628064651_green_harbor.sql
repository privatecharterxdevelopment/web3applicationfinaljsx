/*
  # Add color column to calendar_events table

  1. Changes
    - Add `color` column to `calendar_events` table to store custom event colors
    - Column allows NULL values for backward compatibility
    - Default value is NULL (events will use default type-based colors)

  2. Notes
    - This column will store Tailwind CSS class strings for custom event styling
    - Existing events will have NULL color values and use default type-based colors
    - New events can optionally specify custom colors
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