/*
  # Fix company settings and storage setup

  1. Changes
    - Create company_settings table with proper structure
    - Create storage bucket for logos
    - Set up RLS policies for both table and storage
    - Insert default company logo

  2. Security
    - Enable RLS on company_settings table
    - Add policies for public read access
    - Add policies for authenticated user updates
    - Add storage policies for logo uploads and public access
*/

-- First, safely handle policy removal
DO $$
BEGIN
  -- Drop policies only if they exist and their table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'company_settings') THEN
    DROP POLICY IF EXISTS "company_settings_public_read" ON company_settings;
    DROP POLICY IF EXISTS "company_settings_auth_update" ON company_settings;
  END IF;
END $$;

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create table policies
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

-- Set up storage
DO $$
BEGIN
  -- Create logos bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('logos', 'logos', true)
  ON CONFLICT (id) DO NOTHING;

  -- Safely handle storage policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
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
  END IF;
END $$;

-- Insert default logo if table is empty
INSERT INTO company_settings (logo_url)
SELECT 'https://raw.githubusercontent.com/stackblitz/private-jet-icons/main/x-logo-black.webp'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);