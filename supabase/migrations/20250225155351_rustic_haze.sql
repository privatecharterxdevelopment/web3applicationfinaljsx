/*
  # Fix company settings table

  1. Changes
    - Drop and recreate company_settings table
    - Add RLS policies for public read access
    - Insert default logo URL
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS company_settings;

-- Create the company_settings table
CREATE TABLE company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "company_settings_public_read"
  ON company_settings
  FOR SELECT
  TO public
  USING (true);

-- Insert default logo
INSERT INTO company_settings (logo_url)
VALUES ('https://raw.githubusercontent.com/stackblitz/private-jet-icons/main/x-logo-black.webp');