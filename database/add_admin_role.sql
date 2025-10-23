-- =====================================================
-- ADMIN ROLE SUPPORT
-- Add admin role functionality to user_profiles
-- =====================================================

-- Add role column to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Create role constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'user_profiles_role_check'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
    CHECK (role IN ('user', 'admin', 'super_admin'));
  END IF;
END $$;

-- Create index on role for faster admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_user_id
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy: Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_user_admin(auth.uid())
  );

-- Grant execute permission on admin check function
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;

-- =====================================================
-- ADMIN DASHBOARD HELPER VIEWS
-- =====================================================

-- View: Get all platform statistics
CREATE OR REPLACE VIEW admin_platform_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM user_profiles WHERE kyc_status = 'verified') as verified_users,
  (SELECT COUNT(*) FROM launchpad_projects) as total_projects,
  (SELECT COUNT(*) FROM launchpad_projects WHERE status = 'active') as active_projects,
  (SELECT COUNT(*) FROM support_tickets) as total_tickets,
  (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets,
  (SELECT COUNT(*) FROM sto_investments) as total_investments,
  (SELECT SUM(investment_amount) FROM sto_investments WHERE status = 'confirmed') as total_investment_amount,
  (SELECT COUNT(*) FROM sto_listings WHERE status = 'active') as active_listings,
  (SELECT COUNT(*) FROM user_requests) as total_requests,
  (SELECT COUNT(*) FROM user_requests WHERE status = 'pending') as pending_requests;

-- Grant select on admin view to authenticated users (RLS will handle admin check)
GRANT SELECT ON admin_platform_stats TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
