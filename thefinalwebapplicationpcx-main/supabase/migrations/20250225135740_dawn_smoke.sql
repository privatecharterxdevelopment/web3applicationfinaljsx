/*
  # Company Settings and Storage Setup

  1. Tables
    - `company_settings`
      - `id` (uuid, primary key)
      - `logo_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on company_settings table
    - Add policies for public read access
    - Add policies for authenticated user updates
    - Set up storage bucket and policies for logo uploads

  3. Initial Data
    - Insert default logo URL
*/

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON company_settings;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON company_settings;
  DROP POLICY IF EXISTS "Allow public read access to company settings" ON company_settings;
  DROP POLICY IF EXISTS "Allow authenticated users to update company settings" ON company_settings;
END $$;

-- Recreate the table
DROP TABLE IF EXISTS company_settings;

CREATE TABLE company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names
CREATE POLICY "company_settings_public_read"
  ON company_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "company_settings_auth_update"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Set up storage for logos
DO $$
BEGIN
  -- Create bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('logos', 'logos', true)
  ON CONFLICT (id) DO NOTHING;

  -- Create storage policies with unique names
  DROP POLICY IF EXISTS "storage_logos_auth_insert" ON storage.objects;
  DROP POLICY IF EXISTS "storage_logos_public_select" ON storage.objects;

  CREATE POLICY "storage_logos_auth_insert"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'logos');

  CREATE POLICY "storage_logos_public_select"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'logos');
END $$;

-- Insert initial record with the logo
INSERT INTO company_settings (logo_url)
VALUES ('https://raw.githubusercontent.com/stackblitz/private-jet-icons/main/x-logo-black.webp');