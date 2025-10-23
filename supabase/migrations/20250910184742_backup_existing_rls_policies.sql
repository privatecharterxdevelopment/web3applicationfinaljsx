-- Backup of Existing RLS Policies
-- This migration backs up all existing RLS policies that will be dropped by the admin system enhancement
-- Created: 2025-09-10 before applying admin system enhancement migration

-- =============================================================================
-- ADMIN_SETTINGS TABLE POLICIES
-- =============================================================================

-- Backup: admin_settings_read_20250315
-- Original policy: SELECT for authenticated users with is_admin(auth.uid()) check
CREATE OR REPLACE FUNCTION backup_admin_settings_read_20250315()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "admin_settings_read_20250315_backup"
        ON admin_settings FOR SELECT
        TO authenticated
        USING (is_admin(auth.uid()));';
END;
$$ LANGUAGE plpgsql;

-- Backup: admin_settings_write_20250315
-- Original policy: ALL operations for authenticated users with is_admin(auth.uid()) check
CREATE OR REPLACE FUNCTION backup_admin_settings_write_20250315()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "admin_settings_write_20250315_backup"
        ON admin_settings FOR ALL
        TO authenticated
        USING (is_admin(auth.uid()))
        WITH CHECK (is_admin(auth.uid()));';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- BOOKING_REQUESTS TABLE POLICIES
-- =============================================================================

-- Backup: Allow service role to read
CREATE OR REPLACE FUNCTION backup_booking_requests_service_read()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Allow service role to read_backup"
        ON booking_requests FOR SELECT
        TO service_role
        USING (true);';
END;
$$ LANGUAGE plpgsql;

-- Backup: Enable insert for users based on user_id
CREATE OR REPLACE FUNCTION backup_booking_requests_user_insert()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Enable insert for users based on user_id_backup"
        ON booking_requests FOR INSERT
        TO authenticated
        WITH CHECK ((SELECT auth.uid() AS uid) = user_id);';
END;
$$ LANGUAGE plpgsql;

-- Backup: Only admins can update booking requests
CREATE OR REPLACE FUNCTION backup_booking_requests_admin_update()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Only admins can update booking requests_backup"
        ON booking_requests FOR UPDATE
        TO public
        USING (EXISTS (
            SELECT 1
            FROM auth.users
            WHERE (auth.uid() = users.id) 
            AND ((users.raw_user_meta_data ->> ''role''::text) = ''admin''::text)
        ));';
END;
$$ LANGUAGE plpgsql;

-- Backup: Users can view own booking requests
CREATE OR REPLACE FUNCTION backup_booking_requests_user_view()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Users can view own booking requests_backup"
        ON booking_requests FOR SELECT
        TO public
        USING ((auth.uid() = user_id) OR (auth.role() = ''service_role''::text));';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CO2_CERTIFICATE_REQUESTS TABLE POLICIES
-- =============================================================================

-- Backup: Admins can view all certificate requests
CREATE OR REPLACE FUNCTION backup_co2_cert_admin_all()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Admins can view all certificate requests_backup"
        ON co2_certificate_requests FOR ALL
        TO public
        USING (EXISTS (
            SELECT 1
            FROM users
            WHERE (users.id = auth.uid()) AND (users.is_admin = true)
        ));';
END;
$$ LANGUAGE plpgsql;

-- Backup: Users can insert own certificate requests
CREATE OR REPLACE FUNCTION backup_co2_cert_user_insert()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Users can insert own certificate requests_backup"
        ON co2_certificate_requests FOR INSERT
        TO public
        WITH CHECK (auth.uid() = user_id);';
END;
$$ LANGUAGE plpgsql;

-- Backup: Users can update own certificate requests
CREATE OR REPLACE FUNCTION backup_co2_cert_user_update()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Users can update own certificate requests_backup"
        ON co2_certificate_requests FOR UPDATE
        TO public
        USING (auth.uid() = user_id);';
END;
$$ LANGUAGE plpgsql;

-- Backup: Users can view own certificate requests
CREATE OR REPLACE FUNCTION backup_co2_cert_user_view()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Users can view own certificate requests_backup"
        ON co2_certificate_requests FOR SELECT
        TO public
        USING (auth.uid() = user_id);';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- KYC_APPLICATIONS TABLE POLICIES
-- =============================================================================

-- Backup: Users can insert own KYC application
CREATE OR REPLACE FUNCTION backup_kyc_user_insert()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Users can insert own KYC application_backup"
        ON kyc_applications FOR INSERT
        TO public
        WITH CHECK (auth.uid() = user_id);';
END;
$$ LANGUAGE plpgsql;

-- Backup: Users can update own KYC application
CREATE OR REPLACE FUNCTION backup_kyc_user_update()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Users can update own KYC application_backup"
        ON kyc_applications FOR UPDATE
        TO public
        USING (auth.uid() = user_id);';
END;
$$ LANGUAGE plpgsql;

-- Backup: Users can view own KYC application
CREATE OR REPLACE FUNCTION backup_kyc_user_view()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Users can view own KYC application_backup"
        ON kyc_applications FOR SELECT
        TO public
        USING (auth.uid() = user_id);';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- USER_REQUESTS TABLE POLICIES
-- =============================================================================

-- Backup: Admins have full access to user requests
CREATE OR REPLACE FUNCTION backup_user_requests_admin_all()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Admins have full access to user requests_backup"
        ON user_requests FOR ALL
        TO authenticated
        USING (is_admin(auth.uid()))
        WITH CHECK (is_admin(auth.uid()));';
END;
$$ LANGUAGE plpgsql;

-- Backup: Users can create requests
CREATE OR REPLACE FUNCTION backup_user_requests_user_create()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Users can create requests_backup"
        ON user_requests FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);';
END;
$$ LANGUAGE plpgsql;

-- Backup: Users can update own pending requests
CREATE OR REPLACE FUNCTION backup_user_requests_user_update()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Users can update own pending requests_backup"
        ON user_requests FOR UPDATE
        TO authenticated
        USING ((auth.uid() = user_id) AND (status = ''pending''::text))
        WITH CHECK ((auth.uid() = user_id) AND (status = ''pending''::text));';
END;
$$ LANGUAGE plpgsql;

-- Backup: Users can view own requests
CREATE OR REPLACE FUNCTION backup_user_requests_user_view()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CREATE POLICY "Users can view own requests_backup"
        ON user_requests FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

-- Create a documentation table to track what policies were backed up
CREATE TABLE IF NOT EXISTS rls_policy_backup_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    policy_name TEXT NOT NULL,
    policy_definition TEXT NOT NULL,
    backup_function_name TEXT NOT NULL,
    backup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Insert backup documentation
INSERT INTO rls_policy_backup_log (table_name, policy_name, policy_definition, backup_function_name, notes) VALUES
-- admin_settings
('admin_settings', 'admin_settings_read_20250315', 'SELECT for authenticated users with is_admin(auth.uid())', 'backup_admin_settings_read_20250315', 'Original read policy for admin settings'),
('admin_settings', 'admin_settings_write_20250315', 'ALL operations for authenticated users with is_admin(auth.uid())', 'backup_admin_settings_write_20250315', 'Original write policy for admin settings'),

-- booking_requests
('booking_requests', 'Allow service role to read', 'SELECT for service_role with true condition', 'backup_booking_requests_service_read', 'Service role read access'),
('booking_requests', 'Enable insert for users based on user_id', 'INSERT for authenticated users matching user_id', 'backup_booking_requests_user_insert', 'User can insert own booking requests'),
('booking_requests', 'Only admins can update booking requests', 'UPDATE for public role with admin check via raw_user_meta_data', 'backup_booking_requests_admin_update', 'Admin-only update access'),
('booking_requests', 'Users can view own booking requests', 'SELECT for public role with user_id match or service_role', 'backup_booking_requests_user_view', 'User can view own requests'),

-- co2_certificate_requests
('co2_certificate_requests', 'Admins can view all certificate requests', 'ALL operations for public role with users.is_admin check', 'backup_co2_cert_admin_all', 'Admin full access to CO2 requests'),
('co2_certificate_requests', 'Users can insert own certificate requests', 'INSERT for public role with user_id match', 'backup_co2_cert_user_insert', 'User can create CO2 requests'),
('co2_certificate_requests', 'Users can update own certificate requests', 'UPDATE for public role with user_id match', 'backup_co2_cert_user_update', 'User can update own CO2 requests'),
('co2_certificate_requests', 'Users can view own certificate requests', 'SELECT for public role with user_id match', 'backup_co2_cert_user_view', 'User can view own CO2 requests'),

-- kyc_applications
('kyc_applications', 'Users can insert own KYC application', 'INSERT for public role with user_id match', 'backup_kyc_user_insert', 'User can create KYC applications'),
('kyc_applications', 'Users can update own KYC application', 'UPDATE for public role with user_id match', 'backup_kyc_user_update', 'User can update own KYC applications'),
('kyc_applications', 'Users can view own KYC application', 'SELECT for public role with user_id match', 'backup_kyc_user_view', 'User can view own KYC applications'),

-- user_requests
('user_requests', 'Admins have full access to user requests', 'ALL operations for authenticated users with is_admin() check', 'backup_user_requests_admin_all', 'Admin full access to user requests'),
('user_requests', 'Users can create requests', 'INSERT for authenticated users with user_id match', 'backup_user_requests_user_create', 'User can create requests'),
('user_requests', 'Users can update own pending requests', 'UPDATE for authenticated users with user_id match and pending status', 'backup_user_requests_user_update', 'User can update own pending requests'),
('user_requests', 'Users can view own requests', 'SELECT for authenticated users with user_id match', 'backup_user_requests_user_view', 'User can view own requests');

-- Add a comment for future reference
COMMENT ON TABLE rls_policy_backup_log IS 'Backup log of RLS policies that were replaced by the admin system enhancement migration 20250910184743';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RLS Policy Backup Complete: All existing policies have been backed up as functions and documented in rls_policy_backup_log table';
END $$;