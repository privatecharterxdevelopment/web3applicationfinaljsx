-- Migration: Add admin_settings based RLS policy for users table
-- This allows admins to view all users based on their admin_settings record

-- Drop the old admin policy that checks JWT user_role
DROP POLICY IF EXISTS "Admins have full access" ON public.users;

-- Create new policy that checks admin_settings table for super_admin role
CREATE POLICY "Super admin can view all users" ON public.users
FOR ALL
TO authenticated
USING (
  -- Allow access if user has super_admin role in admin_settings
  EXISTS (
    SELECT 1 
    FROM public.admin_settings 
    WHERE admin_settings.user_id = auth.uid()
    AND (admin_settings.settings->>'role') = 'super_admin'
  )
  OR
  -- OR if accessing own record
  auth.uid() = users.id
);

-- Add comment to explain the policy
COMMENT ON POLICY "Super admin can view all users" ON public.users IS 
'Allows users to access their own records, and allows super_admin users to access all user records for admin management';