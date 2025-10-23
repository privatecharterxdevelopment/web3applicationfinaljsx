/*
  # Create Face Authentication Table

  This migration creates the face_authentication table to store encrypted face descriptors
  for biometric authentication and adds face-related fields to user_profiles.

  ## User Architecture Overview:
  The system uses a dual-table approach for user management:

  1. `auth.users` (Supabase Auth) - Core authentication
     - Managed by Supabase Auth
     - Handles login, passwords, email verification

  2. `public.users` (Custom table) - Extended user data
     - Synced with auth.users (same user.id)
     - Stores: email, first_name, last_name, is_admin, email_verified, etc.
     - Created by Edge Function: register-with-verification

  3. `public.user_profiles` - Additional profile data
     - References: auth.users(id) via user_id
     - Stores: phone, bio, address, city, country
     - Extended with: face_registration_completed, face_login_enabled

  4. `public.face_authentication` (NEW) - Biometric data
     - References: auth.users(id) via user_id
     - Stores encrypted 128-dimensional face descriptors
     - One face per user (UNIQUE constraint)

  ## Tables Created/Modified:

  1. New Table: `face_authentication`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users, unique)
    - `face_descriptor` (jsonb) - Encrypted face data
    - `is_active` (boolean) - Whether face auth is active
    - `device_info` (jsonb) - Device information when registered
    - `registered_at` (timestamptz) - When face was registered
    - `last_used_at` (timestamptz) - Last successful face login
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. User Profiles Extension
    - Add `face_registration_completed` (boolean)
    - Add `face_login_enabled` (boolean)

  3. Security
    - Enable RLS on face_authentication table
    - Add policies for user access
    - Users can only access their own face data
    - Admins can view all face data for support
*/

-- Create face_authentication table
CREATE TABLE IF NOT EXISTS public.face_authentication (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  face_descriptor jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  device_info jsonb,
  registered_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add face-related fields to user_profiles if they don't exist
-- Note: user_profiles.user_id references auth.users(id) which matches public.users(id)
DO $$
BEGIN
  -- Check if user_profiles table exists first
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
  ) THEN
    -- Add face_registration_completed column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'face_registration_completed'
    ) THEN
      ALTER TABLE public.user_profiles
      ADD COLUMN face_registration_completed boolean NOT NULL DEFAULT false;
    END IF;

    -- Add face_login_enabled column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'face_login_enabled'
    ) THEN
      ALTER TABLE public.user_profiles
      ADD COLUMN face_login_enabled boolean NOT NULL DEFAULT false;
    END IF;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.face_authentication ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_face_authentication_user_id ON public.face_authentication(user_id);
CREATE INDEX IF NOT EXISTS idx_face_authentication_is_active ON public.face_authentication(is_active);

-- Create updated_at trigger for face_authentication
DROP TRIGGER IF EXISTS update_face_authentication_updated_at ON public.face_authentication;
CREATE TRIGGER update_face_authentication_updated_at
  BEFORE UPDATE ON public.face_authentication
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for face_authentication

-- Users can read their own face authentication data
CREATE POLICY "Users can read own face auth"
  ON public.face_authentication
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own face authentication data
CREATE POLICY "Users can insert own face auth"
  ON public.face_authentication
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own face authentication data
CREATE POLICY "Users can update own face auth"
  ON public.face_authentication
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own face authentication data
CREATE POLICY "Users can delete own face auth"
  ON public.face_authentication
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all face authentication data (for support purposes)
CREATE POLICY "Admins can read all face auth"
  ON public.face_authentication
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Comment on table
COMMENT ON TABLE public.face_authentication IS 'Stores encrypted face descriptors for biometric authentication';
COMMENT ON COLUMN public.face_authentication.face_descriptor IS 'Encrypted face descriptor (128-dimensional vector) stored as JSONB';
COMMENT ON COLUMN public.face_authentication.device_info IS 'Device information when face was registered (user agent, platform, etc.)';
