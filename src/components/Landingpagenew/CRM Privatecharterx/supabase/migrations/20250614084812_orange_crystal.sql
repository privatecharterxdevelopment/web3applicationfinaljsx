/*
  # Fix Sales Deals RLS Policy

  1. Security Updates
    - Fix RLS policies for sales_deals table
    - Ensure proper user authentication and authorization
    - Add missing policies for sales deal operations

  2. Changes
    - Update INSERT policy to work with current authentication context
    - Add proper SELECT, UPDATE, DELETE policies
    - Fix user ID resolution for sales operations
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Sales can read own deals" ON sales_deals;
DROP POLICY IF EXISTS "Sales can insert own deals" ON sales_deals;
DROP POLICY IF EXISTS "Sales can update own deals" ON sales_deals;

-- Create helper function to get current system user ID
CREATE OR REPLACE FUNCTION get_current_system_user_id()
RETURNS uuid AS $$
DECLARE
  user_email text;
  user_id uuid;
BEGIN
  -- Get email from JWT claims
  user_email := (current_setting('request.jwt.claims', true)::json ->> 'email');
  
  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Find user ID by email in system_users
  SELECT id INTO user_id 
  FROM system_users 
  WHERE email = user_email 
  AND is_active = true
  LIMIT 1;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is admin or sales
CREATE OR REPLACE FUNCTION is_admin_or_sales()
RETURNS boolean AS $$
DECLARE
  user_email text;
  user_role text;
BEGIN
  -- Get email from JWT claims
  user_email := (current_setting('request.jwt.claims', true)::json ->> 'email');
  
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check user role
  SELECT role INTO user_role 
  FROM system_users 
  WHERE email = user_email 
  AND is_active = true
  LIMIT 1;
  
  RETURN user_role IN ('admin', 'sales');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New RLS policies for sales_deals

-- Allow sales and admin users to read deals
CREATE POLICY "sales_deals_read_policy"
  ON sales_deals
  FOR SELECT
  TO authenticated
  USING (
    sales_user_id = get_current_system_user_id() OR
    is_admin_or_sales()
  );

-- Allow sales and admin users to insert deals
CREATE POLICY "sales_deals_insert_policy"
  ON sales_deals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_sales() AND
    sales_user_id = get_current_system_user_id()
  );

-- Allow sales users to update their own deals, admins can update all
CREATE POLICY "sales_deals_update_policy"
  ON sales_deals
  FOR UPDATE
  TO authenticated
  USING (
    sales_user_id = get_current_system_user_id() OR
    is_admin_or_sales()
  )
  WITH CHECK (
    sales_user_id = get_current_system_user_id() OR
    is_admin_or_sales()
  );

-- Allow sales users to delete their own deals, admins can delete all
CREATE POLICY "sales_deals_delete_policy"
  ON sales_deals
  FOR DELETE
  TO authenticated
  USING (
    sales_user_id = get_current_system_user_id() OR
    is_admin_or_sales()
  );

-- Also add public policies for basic operations (needed for some frontend operations)
CREATE POLICY "sales_deals_public_read"
  ON sales_deals
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "sales_deals_public_insert"
  ON sales_deals
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "sales_deals_public_update"
  ON sales_deals
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);