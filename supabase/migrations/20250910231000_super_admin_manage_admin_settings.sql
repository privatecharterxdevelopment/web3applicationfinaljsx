-- Migration: Allow super admins to manage admin_settings for all users
-- This enables the Admin Management interface to work properly

-- Drop ALL existing policies on admin_settings
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admin_settings' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.admin_settings';
    END LOOP;
END $$;

-- Create function to check if user is super admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_settings 
    WHERE admin_settings.user_id = user_uuid
    AND (admin_settings.settings->>'role') = 'super_admin'
  );
$$;

-- Create policy for users to read their own admin settings
CREATE POLICY "Users can read own admin settings" ON public.admin_settings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create policy for super admins to have full access
CREATE POLICY "Super admins manage all admin settings" ON public.admin_settings
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- Add comments to explain the policies
COMMENT ON FUNCTION public.is_super_admin(uuid) IS 
'Checks if the given user (or current user if not specified) has super_admin role in admin_settings';

COMMENT ON POLICY "Users can read own admin settings" ON public.admin_settings IS 
'Allows any authenticated user to read their own admin settings record';

COMMENT ON POLICY "Super admins manage all admin settings" ON public.admin_settings IS 
'Allows super admins to create, read, update, and delete any admin_settings record';