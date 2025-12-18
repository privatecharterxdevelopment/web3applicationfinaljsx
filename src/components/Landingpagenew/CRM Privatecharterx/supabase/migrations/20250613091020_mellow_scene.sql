/*
  # Fix RLS policies for clients table

  1. Security Updates
    - Add policy to allow public users to insert clients
    - Add policy to allow public users to read clients
    - Add policy to allow authenticated users full access to clients
    
  2. Changes
    - Enable public insert access for client creation
    - Enable public read access for client data
    - Maintain authenticated user privileges
    
  Note: This allows unauthenticated users to create and read client data.
  For production, consider implementing proper authentication flow.
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

-- Create new policies that allow public access for basic operations
CREATE POLICY "Allow public to insert clients"
  ON clients
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to read clients"
  ON clients
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);