/*
  # Update company settings table and policies

  1. Changes
    - Create company_settings table if it doesn't exist
    - Enable RLS
    - Safely create policies using IF NOT EXISTS checks
    - Set default logo URL
*/

-- Create the company_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$
BEGIN
  -- Create public read policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_settings' 
    AND policyname = 'Allow public read access to company settings'
  ) THEN
    CREATE POLICY "Allow public read access to company settings"
      ON company_settings
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Create update policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_settings' 
    AND policyname = 'Allow authenticated users to update company settings'
  ) THEN
    CREATE POLICY "Allow authenticated users to update company settings"
      ON company_settings
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Update or insert logo URL
INSERT INTO company_settings (logo_url)
VALUES ('https://raw.githubusercontent.com/stackblitz/private-jet-icons/main/x-logo-black.webp')
ON CONFLICT (id) DO UPDATE
SET logo_url = EXCLUDED.logo_url,
    updated_at = now();