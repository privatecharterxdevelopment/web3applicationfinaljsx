/*
  # Create admin settings table and policies

  1. New Tables
    - `admin_settings` - Stores admin-specific settings
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for admin access only
    - Add function to check admin status
*/

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create index for user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'admin_settings' 
    AND indexname = 'idx_admin_settings_user_id'
  ) THEN
    CREATE INDEX idx_admin_settings_user_id ON admin_settings(user_id);
  END IF;
END $$;

-- Add trigger to update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_admin_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_admin_settings_updated_at
      BEFORE UPDATE ON admin_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow admin read access" ON admin_settings;
  DROP POLICY IF EXISTS "Allow admin write access" ON admin_settings;
  DROP POLICY IF EXISTS "fixed_offers_admin_20250312" ON fixed_offers;
  DROP POLICY IF EXISTS "fixed_offers_read_20250312" ON fixed_offers;
  DROP POLICY IF EXISTS "user_requests_admin_20250312" ON user_requests;
END $$;

-- Create admin-only policies for admin_settings
CREATE POLICY "admin_settings_read_20250315"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_settings_write_20250315"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add admin-specific RLS policies to existing tables
DO $$
BEGIN
  -- Add admin policies to fixed_offers if it exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fixed_offers') THEN
    CREATE POLICY "fixed_offers_admin_20250315"
      ON fixed_offers
      FOR ALL
      TO authenticated
      USING (is_admin(auth.uid()));

    CREATE POLICY "fixed_offers_read_20250315"
      ON fixed_offers
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Add admin policies to user_requests if it exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_requests') THEN
    CREATE POLICY "user_requests_admin_20250315"
      ON user_requests
      FOR ALL
      TO authenticated
      USING (is_admin(auth.uid()));
  END IF;
END $$;