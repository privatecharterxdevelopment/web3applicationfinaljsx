/*
  # Fix RLS policies for system_users table

  1. Security Updates
    - Update RLS policies to properly handle admin user creation
    - Add policy for service role operations
    - Fix admin check functions

  2. Policy Changes
    - Allow service role to insert system users
    - Update admin check to work with current auth context
    - Add proper insert policies for admin operations
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can insert system users" ON system_users;
DROP POLICY IF EXISTS "Admins can manage all users" ON system_users;
DROP POLICY IF EXISTS "Users can read their own profile" ON system_users;

-- Create a function to check if current user is admin by email
CREATE OR REPLACE FUNCTION is_admin_by_email(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM system_users 
    WHERE email = user_email AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current user email from JWT
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'email'),
    ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow service role to manage system users (for admin operations)
CREATE POLICY "Service role can manage system users"
  ON system_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admins to read all system users
CREATE POLICY "Admins can read all system users"
  ON system_users
  FOR SELECT
  TO authenticated
  USING (is_admin_by_email(get_current_user_email()));

-- Allow authenticated admins to insert system users
CREATE POLICY "Admins can insert system users"
  ON system_users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_by_email(get_current_user_email()));

-- Allow authenticated admins to update system users
CREATE POLICY "Admins can update system users"
  ON system_users
  FOR UPDATE
  TO authenticated
  USING (is_admin_by_email(get_current_user_email()))
  WITH CHECK (is_admin_by_email(get_current_user_email()));

-- Allow authenticated admins to delete system users
CREATE POLICY "Admins can delete system users"
  ON system_users
  FOR DELETE
  TO authenticated
  USING (is_admin_by_email(get_current_user_email()));

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON system_users
  FOR SELECT
  TO authenticated
  USING (email = get_current_user_email());

-- Allow users to update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON system_users
  FOR UPDATE
  TO authenticated
  USING (email = get_current_user_email())
  WITH CHECK (
    email = get_current_user_email() AND
    -- Prevent users from changing their own role or critical fields
    role = (SELECT role FROM system_users WHERE email = get_current_user_email())
  );

-- Allow public read access for basic user info (needed for some operations)
CREATE POLICY "Public can read basic user info"
  ON system_users
  FOR SELECT
  TO public
  USING (true);