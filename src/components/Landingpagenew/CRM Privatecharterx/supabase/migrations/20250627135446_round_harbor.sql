/*
  # Fix Invoice RLS Policies

  1. Security Updates
    - Update RLS policies for invoices table to allow proper access
    - Ensure accountants and admins can create invoices
    - Add fallback policies for system users

  2. Changes
    - Drop existing restrictive policies
    - Add new policies that work with the current user system
    - Ensure proper access control based on user roles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Accountants and admins can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Public can read invoices" ON invoices;

-- Create new policies that work with the current system
CREATE POLICY "invoices_select_policy" ON invoices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "invoices_insert_policy" ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'accountant')
    )
  );

CREATE POLICY "invoices_update_policy" ON invoices
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'accountant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'accountant')
    )
  );

CREATE POLICY "invoices_delete_policy" ON invoices
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'accountant')
    )
  );

-- Allow public read access for invoices (for client portals, etc.)
CREATE POLICY "invoices_public_read" ON invoices
  FOR SELECT
  TO public
  USING (true);