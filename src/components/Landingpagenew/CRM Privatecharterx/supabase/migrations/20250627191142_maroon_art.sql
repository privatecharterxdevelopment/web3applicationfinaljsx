/*
  # Add Notes and Source Columns to Partners Table

  1. Schema Changes
    - Add `notes` column to `partners` table
    - Add `source` column to `partners` table
    - Both columns are nullable text fields

  2. Purpose
    - Support lead management functionality in the Sales CRM
    - Allow storing additional information about partners/leads
    - Fix schema cache error when adding new leads
*/

-- Add notes column to partners table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'notes'
  ) THEN
    ALTER TABLE partners ADD COLUMN notes text;
  END IF;
END $$;

-- Add source column to partners table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'source'
  ) THEN
    ALTER TABLE partners ADD COLUMN source text;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_partners_source ON partners(source);