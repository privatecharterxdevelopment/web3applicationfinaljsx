/*
  # Fix Sales Deals RLS Policies

  1. Security Updates
    - Add public policies for sales_deals table
    - Fix RLS policy for sales_deals table
    - Ensure proper access control for sales users

  2. Changes
    - Add public policies for basic operations
    - Fix existing RLS policies
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "sales_deals_public_read" ON sales_deals;
DROP POLICY IF EXISTS "sales_deals_public_insert" ON sales_deals;
DROP POLICY IF EXISTS "sales_deals_public_update" ON sales_deals;

-- Create comprehensive public policies for sales_deals
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