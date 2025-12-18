/*
  # Fix system_users RLS policy for inserts

  1. Security Changes
    - Add INSERT policy for system_users table to allow admins to create new users
    - Ensure only authenticated users with admin role can insert new system users

  This migration fixes the RLS policy violation error when trying to create new system users.
*/

-- Add INSERT policy for system_users table
CREATE POLICY "Admins can insert system users"
  ON system_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.email = ((current_setting('request.jwt.claims', true))::json ->> 'email')
      AND su.role = 'admin'
    )
  );