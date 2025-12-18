/*
  # Fix Invoice RLS Policy

  1. Policy Changes
    - Update INSERT policy to allow authenticated users to create invoices
    - Ensure proper access control for invoice creation
    - Maintain security while allowing legitimate invoice creation

  2. Security
    - Users can create invoices they are responsible for
    - Admins and accountants maintain full access
    - Public read access for invoices (as currently configured)
*/

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "invoices_insert_policy" ON invoices;

-- Create a new insert policy that allows authenticated users to create invoices
-- where they are the creator
CREATE POLICY "invoices_insert_policy" 
  ON invoices 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- Allow if the user is creating an invoice and setting themselves as creator
    (auth.uid() = created_by) OR
    -- Allow if the user is an admin or accountant
    (EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'accountant')
    ))
  );

-- Also ensure the update policy allows the creator to update their own invoices
DROP POLICY IF EXISTS "invoices_update_policy" ON invoices;

CREATE POLICY "invoices_update_policy" 
  ON invoices 
  FOR UPDATE 
  TO authenticated 
  USING (
    -- Allow if user created the invoice
    (auth.uid() = created_by) OR
    -- Allow if user is admin or accountant
    (EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'accountant')
    ))
  )
  WITH CHECK (
    -- Same conditions for the updated row
    (auth.uid() = created_by) OR
    (EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'accountant')
    ))
  );