/*
  # Fix user_requests RLS policies and foreign key

  1. Security Updates
    - Enable RLS on user_requests table
    - Add proper foreign key constraint to system_users
    - Create appropriate RLS policies using auth.uid() function
    - Fix admin access policies

  2. Changes
    - Add ON DELETE CASCADE to foreign key for proper cleanup
    - Create index for better join performance
    - Update policies to use auth.uid() instead of uid()
*/

-- First, check if RLS is enabled on user_requests
ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for user_requests
DROP POLICY IF EXISTS "Users can create requests" ON user_requests;
CREATE POLICY "Users can create requests"
  ON user_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own requests" ON user_requests;
CREATE POLICY "Users can view own requests"
  ON user_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending requests" ON user_requests;
CREATE POLICY "Users can update own pending requests"
  ON user_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins have full access" ON user_requests;
CREATE POLICY "Admins have full access"
  ON user_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid() AND (users.raw_user_meta_data->>'is_admin')::text = 'true'
    )
  );

-- Add a policy for admin access based on system_users role
DROP POLICY IF EXISTS "user_requests_admin_20250315" ON user_requests;
DROP POLICY IF EXISTS "user_requests_admin_20250615" ON user_requests;
CREATE POLICY "user_requests_admin_20250615"
  ON user_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.id = auth.uid() AND system_users.role = 'admin'
    )
  );