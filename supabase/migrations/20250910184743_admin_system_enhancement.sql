-- Admin System Enhancement Migration
-- This migration creates the enhanced admin system with permission-based access control

-- 1. Create admin action logging table
CREATE TABLE IF NOT EXISTS admin_action_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    action_type TEXT NOT NULL CHECK (action_type IN (
        'create', 'update', 'approve', 'reject', 'assign', 'complete', 'cancel', 'delete'
    )),
    target_table TEXT NOT NULL CHECK (target_table IN (
        'booking_requests', 'co2_certificate_requests', 'user_requests', 'kyc_applications'
    )),
    target_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    admin_notes TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_admin_action_log_admin_user_id ON admin_action_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_target ON admin_action_log(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_created_at ON admin_action_log(created_at DESC);

-- 2. Create admin permission helper functions

-- Function to check if user has admin permission for specific action
CREATE OR REPLACE FUNCTION is_admin_with_permission(
    user_id UUID,
    table_name TEXT,
    action_name TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_settings_data JSONB;
    permissions JSONB;
BEGIN
    -- Get admin settings for the user
    SELECT settings INTO admin_settings_data
    FROM admin_settings 
    WHERE admin_settings.user_id = is_admin_with_permission.user_id;
    
    -- If no admin settings found, user is not an admin
    IF admin_settings_data IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Extract permissions for the specific table
    permissions := admin_settings_data->'permissions'->table_name;
    
    -- Check if user has the specific permission
    RETURN COALESCE((permissions->>action_name)::BOOLEAN, FALSE);
END;
$$;

-- Function to get admin role
CREATE OR REPLACE FUNCTION get_admin_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT settings->>'role' INTO admin_role
    FROM admin_settings 
    WHERE admin_settings.user_id = get_admin_role.user_id;
    
    RETURN COALESCE(admin_role, 'none');
END;
$$;

-- 3. Update admin_settings RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin settings are only accessible by the user" ON admin_settings;
DROP POLICY IF EXISTS "Users can insert their own admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Users can update their own admin settings" ON admin_settings;

-- Enable RLS on admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy for reading admin settings (only the admin user themselves)
CREATE POLICY "Admin can read own settings"
    ON admin_settings FOR SELECT
    USING (user_id = auth.uid());

-- Policy for inserting admin settings (super admins can create new admin users)
CREATE POLICY "Super admin can create admin settings"
    ON admin_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_settings 
            WHERE user_id = auth.uid() 
            AND settings->>'role' = 'super_admin'
        )
    );

-- Policy for updating admin settings (super admins can update any, regular admins can update their own)
CREATE POLICY "Admin can update settings"
    ON admin_settings FOR UPDATE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_settings 
            WHERE user_id = auth.uid() 
            AND settings->>'role' = 'super_admin'
        )
    );

-- 4. Update RLS policies for request tables

-- Booking Requests
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Users can insert own booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Users can update own booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Admins can manage booking requests" ON booking_requests;

CREATE POLICY "Users can view own booking requests"
    ON booking_requests FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own booking requests"
    ON booking_requests FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own booking requests"
    ON booking_requests FOR UPDATE
    USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage booking requests"
    ON booking_requests FOR ALL
    USING (is_admin_with_permission(auth.uid(), 'booking_requests', 'read'))
    WITH CHECK (is_admin_with_permission(auth.uid(), 'booking_requests', 'write'));

-- CO2 Certificate Requests
ALTER TABLE co2_certificate_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own co2 requests" ON co2_certificate_requests;
DROP POLICY IF EXISTS "Admins can manage co2 certificate requests" ON co2_certificate_requests;

CREATE POLICY "Users can manage own co2 requests"
    ON co2_certificate_requests FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage co2 certificate requests"
    ON co2_certificate_requests FOR ALL
    USING (is_admin_with_permission(auth.uid(), 'co2_certificate_requests', 'read'))
    WITH CHECK (is_admin_with_permission(auth.uid(), 'co2_certificate_requests', 'write'));

-- User Requests
-- (Already has RLS enabled, update policies)
DROP POLICY IF EXISTS "Users can manage own requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can manage all user requests" ON user_requests;

CREATE POLICY "Users can manage own requests"
    ON user_requests FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user requests"
    ON user_requests FOR ALL
    USING (is_admin_with_permission(auth.uid(), 'user_requests', 'read'))
    WITH CHECK (is_admin_with_permission(auth.uid(), 'user_requests', 'write'));

-- KYC Applications
-- (Already has RLS enabled, update policies)
DROP POLICY IF EXISTS "Users can manage own kyc applications" ON kyc_applications;
DROP POLICY IF EXISTS "Admins can manage kyc applications" ON kyc_applications;

CREATE POLICY "Users can manage own kyc applications"
    ON kyc_applications FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage kyc applications"
    ON kyc_applications FOR ALL
    USING (is_admin_with_permission(auth.uid(), 'kyc_applications', 'read'))
    WITH CHECK (is_admin_with_permission(auth.uid(), 'kyc_applications', 'write'));

-- 5. Admin Action Log RLS
ALTER TABLE admin_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view relevant action logs"
    ON admin_action_log FOR SELECT
    USING (
        is_admin_with_permission(auth.uid(), target_table, 'read') OR
        admin_user_id = auth.uid()
    );

CREATE POLICY "Admins can insert action logs"
    ON admin_action_log FOR INSERT
    WITH CHECK (admin_user_id = auth.uid());

-- 6. Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action_type TEXT,
    p_target_table TEXT,
    p_target_id UUID,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_action_log (
        admin_user_id,
        action_type,
        target_table,
        target_id,
        old_data,
        new_data,
        admin_notes
    ) VALUES (
        auth.uid(),
        p_action_type,
        p_target_table,
        p_target_id,
        p_old_data,
        p_new_data,
        p_admin_notes
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- 7. Insert default super admin settings (update this with actual admin user ID)
-- Note: Replace the email with the actual super admin email
INSERT INTO admin_settings (user_id, settings)
SELECT 
    id,
    '{
        "role": "super_admin",
        "permissions": {
            "booking_requests": {
                "read": true,
                "write": true,
                "approve": true
            },
            "co2_certificate_requests": {
                "read": true,
                "write": true,
                "assign_ngo": true,
                "approve": true
            },
            "user_requests": {
                "read": true,
                "write": true,
                "complete": true
            },
            "kyc_applications": {
                "read": true,
                "write": true,
                "approve": true,
                "reject": true
            }
        }
    }'::jsonb
FROM auth.users 
WHERE email ILIKE '%admin%' OR email ILIKE '%privatecharterx.com%'
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();