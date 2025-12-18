/*
  # Add profile columns to system_users table

  1. New Columns
    - `avatar_url` (text) - URL for user profile picture
    - `birthday` (date) - User's birthday
    - `address_city` (text) - User's city
    - `address_country` (text) - User's country

  2. Changes
    - Add missing profile-related columns to system_users table
    - All columns are nullable to maintain compatibility with existing data

  3. Security
    - No RLS changes needed as existing policies will apply to new columns
*/

-- Add missing profile columns to system_users table
DO $$
BEGIN
  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE system_users ADD COLUMN avatar_url text;
  END IF;

  -- Add birthday column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_users' AND column_name = 'birthday'
  ) THEN
    ALTER TABLE system_users ADD COLUMN birthday date;
  END IF;

  -- Add address_city column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_users' AND column_name = 'address_city'
  ) THEN
    ALTER TABLE system_users ADD COLUMN address_city text;
  END IF;

  -- Add address_country column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_users' AND column_name = 'address_country'
  ) THEN
    ALTER TABLE system_users ADD COLUMN address_country text;
  END IF;
END $$;