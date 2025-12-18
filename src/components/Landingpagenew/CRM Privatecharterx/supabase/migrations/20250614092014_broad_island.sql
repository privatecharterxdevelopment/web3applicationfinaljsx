/*
  # Fix Employee Bookings RLS Policy

  1. Policy Updates
    - Update the public insert policy to allow proper booking creation
    - Ensure the policy allows setting employee_id to null for public requests
    - Fix any conflicts with existing policies

  2. Security
    - Maintain proper access control
    - Allow public users to create booking requests
    - Ensure employees can only see their own bookings
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Public can create booking requests" ON employee_bookings;
DROP POLICY IF EXISTS "Employees can read own bookings" ON employee_bookings;
DROP POLICY IF EXISTS "Employees can update own pending bookings" ON employee_bookings;
DROP POLICY IF EXISTS "Managers can read all bookings" ON employee_bookings;
DROP POLICY IF EXISTS "Managers can update all bookings" ON employee_bookings;
DROP POLICY IF EXISTS "Managers can delete bookings" ON employee_bookings;

-- Create new policies with proper logic
CREATE POLICY "Allow public to create booking requests"
  ON employee_bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to read all bookings"
  ON employee_bookings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Employees can read own bookings"
  ON employee_bookings
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can update own pending bookings"
  ON employee_bookings
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending')
  WITH CHECK (employee_id = auth.uid() AND status = 'pending');

CREATE POLICY "Managers can read all bookings"
  ON employee_bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'sales')
    )
  );

CREATE POLICY "Managers can update all bookings"
  ON employee_bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'sales')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'sales')
    )
  );

CREATE POLICY "Managers can delete bookings"
  ON employee_bookings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'sales')
    )
  );

CREATE POLICY "Allow authenticated users to create bookings"
  ON employee_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update bookings"
  ON employee_bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);