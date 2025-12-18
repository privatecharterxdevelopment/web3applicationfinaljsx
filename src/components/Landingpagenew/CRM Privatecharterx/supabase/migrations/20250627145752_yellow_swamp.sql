-- Disable RLS temporarily to ensure we can modify the table
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "invoices_public_read" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON invoices;
DROP POLICY IF EXISTS "Accountants and admins can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Public can read invoices" ON invoices;

-- Re-enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create new, more permissive policies

-- Allow public to read invoices
CREATE POLICY "invoices_public_read"
  ON invoices
  FOR SELECT
  TO public
  USING (true);

-- Allow ANY authenticated user to insert invoices
CREATE POLICY "invoices_insert_policy"
  ON invoices
  FOR INSERT
  TO public
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