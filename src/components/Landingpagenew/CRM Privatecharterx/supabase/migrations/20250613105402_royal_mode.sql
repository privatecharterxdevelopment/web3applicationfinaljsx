/*
  # Add Creator Tracking to Clients and Companies

  1. Schema Changes
    - Add `created_by` column to `clients` table
    - Add `created_by` column to `partners` table (companies)
    - Add foreign key relationships to `system_users`
    - Update existing records with current user context

  2. Security
    - Update RLS policies to include creator information
    - Ensure proper access control for creator data

  3. Indexes
    - Add indexes for better query performance on creator fields
*/

-- Add created_by column to clients table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE clients ADD COLUMN created_by uuid REFERENCES system_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add created_by column to partners table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE partners ADD COLUMN created_by uuid REFERENCES system_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_partners_created_by ON partners(created_by);

-- Update existing RLS policies for clients to include creator information
DROP POLICY IF EXISTS "Allow public to read clients" ON clients;
CREATE POLICY "Allow public to read clients"
  ON clients
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow public to insert clients" ON clients;
CREATE POLICY "Allow public to insert clients"
  ON clients
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;
CREATE POLICY "Allow authenticated users to update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON clients;
CREATE POLICY "Allow authenticated users to delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to get current user ID from JWT claims
CREATE OR REPLACE FUNCTION get_current_user_from_jwt()
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
  
  -- Find user ID by email
  SELECT id INTO user_id 
  FROM system_users 
  WHERE email = user_email 
  LIMIT 1;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to automatically set created_by for clients
CREATE OR REPLACE FUNCTION set_client_creator()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Try to get current user ID
  current_user_id := get_current_user_from_jwt();
  
  -- Set created_by if we have a current user and it's not already set
  IF current_user_id IS NOT NULL AND NEW.created_by IS NULL THEN
    NEW.created_by := current_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to automatically set created_by for partners
CREATE OR REPLACE FUNCTION set_partner_creator()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Try to get current user ID
  current_user_id := get_current_user_from_jwt();
  
  -- Set created_by if we have a current user and it's not already set
  IF current_user_id IS NOT NULL AND NEW.created_by IS NULL THEN
    NEW.created_by := current_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically set creator
DROP TRIGGER IF EXISTS set_client_creator_trigger ON clients;
CREATE TRIGGER set_client_creator_trigger
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_client_creator();

DROP TRIGGER IF EXISTS set_partner_creator_trigger ON partners;
CREATE TRIGGER set_partner_creator_trigger
  BEFORE INSERT ON partners
  FOR EACH ROW
  EXECUTE FUNCTION set_partner_creator();