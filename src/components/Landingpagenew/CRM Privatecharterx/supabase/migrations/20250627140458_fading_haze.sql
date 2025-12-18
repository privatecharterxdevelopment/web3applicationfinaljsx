/*
  # Fix Invoice RLS Policy

  1. Security Updates
    - Fix RLS policies for invoices table
    - Allow all authenticated users to create invoices
    - Maintain proper access control for viewing and updating invoices

  2. Changes
    - Drop existing problematic policies
    - Create new, more permissive policies for invoice creation
    - Ensure proper security while allowing necessary operations
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "invoices_public_read" ON invoices;
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

-- Allow ANY authenticated user to insert invoices
-- This is the key fix - previously only admins/accountants could insert
CREATE POLICY "invoices_insert_policy"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update invoices they created or if they're admin/accountant
CREATE POLICY "invoices_update_policy"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.id = auth.uid()
      AND system_users.role IN ('admin', 'accountant')
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.id = auth.uid()
      AND system_users.role IN ('admin', 'accountant')
    )
  );

-- Allow admin/accountant users to delete invoices
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