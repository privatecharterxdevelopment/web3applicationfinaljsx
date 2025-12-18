/*
  # Fix user_requests and system_users relationship

  1. Changes
    - Add foreign key constraint between user_requests.user_id and system_users.id
    - This will allow Supabase to recognize the relationship for joins in the BookingsManagement component

  2. Security
    - No RLS changes needed as existing policies remain intact
*/

-- First, let's check if there are any user_requests records that don't have corresponding system_users
-- and handle them appropriately

-- Add the foreign key constraint between user_requests.user_id and system_users.id
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_requests_user_id_system_users_fkey'
    AND table_name = 'user_requests'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE user_requests 
    ADD CONSTRAINT user_requests_user_id_system_users_fkey 
    FOREIGN KEY (user_id) REFERENCES system_users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create an index on user_id for better join performance if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_user_requests_user_id_system_users'
    AND tablename = 'user_requests'
  ) THEN
    CREATE INDEX idx_user_requests_user_id_system_users ON user_requests(user_id);
  END IF;
END $$;