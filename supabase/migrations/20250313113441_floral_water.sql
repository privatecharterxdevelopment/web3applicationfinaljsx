/*
  # Add missing indexes and policies to user_requests table

  1. Changes
    - Safely add indexes if they don't exist
    - Safely create policies if they don't exist
    - No table creation (already exists)

  2. Security
    - Maintain existing RLS
    - Add policies for user access
    - Add admin access policy
*/

-- Safely create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_requests_user_id'
  ) THEN
    CREATE INDEX idx_user_requests_user_id ON user_requests(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_requests_type'
  ) THEN
    CREATE INDEX idx_user_requests_type ON user_requests(type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_requests_status'
  ) THEN
    CREATE INDEX idx_user_requests_status ON user_requests(status);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_requests_created_at'
  ) THEN
    CREATE INDEX idx_user_requests_created_at ON user_requests(created_at);
  END IF;
END $$;

-- Safely create policies if they don't exist
DO $$
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view own requests" ON user_requests;
  DROP POLICY IF EXISTS "Users can create requests" ON user_requests;
  DROP POLICY IF EXISTS "Users can update own pending requests" ON user_requests;
  DROP POLICY IF EXISTS "Admins have full access" ON user_requests;

  -- Create new policies
  CREATE POLICY "Users can view own requests"
    ON user_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create requests"
    ON user_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own pending requests"
    ON user_requests
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

  CREATE POLICY "Admins have full access"
    ON user_requests
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'is_admin' = 'true'
      )
    );
END $$;