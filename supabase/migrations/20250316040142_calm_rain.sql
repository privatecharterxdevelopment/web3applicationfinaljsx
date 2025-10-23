/*
  # Add maintenance mode to company settings

  1. Changes
    - Add maintenance_mode column to company_settings table
    - Set default value to false
    - Add index for performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add maintenance_mode column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'company_settings' 
    AND column_name = 'maintenance_mode'
  ) THEN
    ALTER TABLE company_settings 
    ADD COLUMN maintenance_mode boolean NOT NULL DEFAULT false;

    -- Create index for maintenance_mode column
    CREATE INDEX idx_company_settings_maintenance_mode 
    ON company_settings(maintenance_mode);
  END IF;
END $$;