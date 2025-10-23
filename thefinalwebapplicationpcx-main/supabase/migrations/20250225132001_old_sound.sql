/*
  # Create company settings table and storage

  1. New Tables
    - `company_settings`
      - `id` (uuid, primary key)
      - `logo_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create a public bucket for logos
    - Add storage policy for authenticated users

  3. Security
    - Enable RLS on company_settings table
    - Add policies for authenticated users
*/

-- Create the company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read company settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update company settings"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true);

-- Create storage policy
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