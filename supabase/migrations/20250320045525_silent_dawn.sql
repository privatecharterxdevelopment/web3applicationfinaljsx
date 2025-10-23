/*
  # Update fixed offers table and add admin functionality

  1. Changes
    - Set default values for fixed offers
    - Add admin policies for managing offers
*/

-- Drop existing policies
DROP POLICY IF EXISTS "fixed_offers_admin_20250315" ON fixed_offers;
DROP POLICY IF EXISTS "fixed_offers_read_20250315" ON fixed_offers;

-- Update fixed_offers table
ALTER TABLE fixed_offers ALTER COLUMN is_featured SET DEFAULT false;
ALTER TABLE fixed_offers ALTER COLUMN is_empty_leg SET DEFAULT false;

-- Truncate existing data
TRUNCATE TABLE fixed_offers;

-- Create new admin policies
CREATE POLICY "fixed_offers_admin_manage"
  ON fixed_offers
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "fixed_offers_public_read"
  ON fixed_offers
  FOR SELECT
  TO public
  USING (true);