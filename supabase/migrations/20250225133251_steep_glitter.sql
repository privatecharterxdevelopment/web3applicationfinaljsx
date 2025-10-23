/*
  # Company Settings and Storage Setup

  1. Changes
    - Create company_settings table if not exists
    - Enable RLS on company_settings
    - Create policies for public read and authenticated update access
    - Create storage bucket for logos
    - Create storage policies for logo management
    - Insert default company settings record

  2. Security
    - Row Level Security enabled on company_settings
    - Public read access to company settings
    - Only authenticated users can update company settings
    - Public access to logo files
    - Only authenticated users can upload logos
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

-- Create storage bucket for logos if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('logos', 'logos', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Safely create storage policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow authenticated users to upload logos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public access to logos" ON storage.objects;
  
  -- Create new policies
  CREATE POLICY "Allow authenticated users to upload logos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'logos');

  CREATE POLICY "Allow public access to logos"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'logos');
END $$;

-- Insert default company settings if none exist
INSERT INTO company_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM company_settings);