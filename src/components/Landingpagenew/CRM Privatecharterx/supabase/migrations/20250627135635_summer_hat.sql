/*
  # Fix Invoice RLS Policies

  1. Security Updates
    - Update RLS policies for invoices table to allow proper INSERT operations
    - Ensure accountants and admins can create invoices
    - Allow public read access for invoices (as per existing schema)

  2. Changes
    - Drop existing problematic policies
    - Create new comprehensive policies for invoices table
    - Ensure proper role-based access control
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "invoices_public_read" ON invoices;
DROP POLICY IF EXISTS "invoices_select_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON invoices;

-- Create comprehensive RLS policies for invoices table

-- Allow public to read invoices (maintaining existing behavior)
CREATE POLICY "invoices_public_read"
  ON invoices
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users with admin or accountant role to insert invoices
CREATE POLICY "invoices_insert_policy"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.id = auth.uid()
      AND system_users.role IN ('admin', 'accountant')
    )
  );

-- Allow authenticated users with admin or accountant role to update invoices
CREATE POLICY "invoices_update_policy"
  ON invoices
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

-- Allow authenticated users with admin or accountant role to delete invoices
CREATE POLICY "invoices_delete_policy"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.id = auth.uid()
      AND system_users.role IN ('admin', 'accountant')
    )
  );

-- Ensure RLS is enabled on the invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;