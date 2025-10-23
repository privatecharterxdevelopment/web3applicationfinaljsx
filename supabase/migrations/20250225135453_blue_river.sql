/*
  # Company Settings Schema

  1. Tables
    - `company_settings`
      - `id` (uuid, primary key)
      - `logo_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `company_settings` table
    - Add policies for public read access
    - Add policies for authenticated user updates

  3. Initial Data
    - Insert default logo URL
*/

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public read access to company settings" ON company_settings;
  DROP POLICY IF EXISTS "Allow authenticated users to update company settings" ON company_settings;
END $$;

-- Create the company_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable read access for all users"
  ON company_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable update for authenticated users"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert or update the default logo
INSERT INTO company_settings (logo_url)
VALUES ('https://raw.githubusercontent.com/stackblitz/private-jet-icons/main/x-logo-black.webp')
ON CONFLICT (id) DO UPDATE
SET logo_url = EXCLUDED.logo_url,
    updated_at = now();