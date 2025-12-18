/*
  # Fix Employee Bookings RLS Policies

  1. Security Updates
    - Fix RLS policies for employee_bookings table
    - Allow public users to create booking requests
    - Ensure proper access control for different user types

  2. Changes
    - Add public insert policy for booking requests
    - Update existing policies to work with current auth context
    - Fix manager/admin access policies
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Employees can create bookings" ON employee_bookings;
DROP POLICY IF EXISTS "Employees can read own bookings" ON employee_bookings;
DROP POLICY IF EXISTS "Employees can update own pending bookings" ON employee_bookings;
DROP POLICY IF EXISTS "Managers can read all bookings" ON employee_bookings;
DROP POLICY IF EXISTS "Managers can update all bookings" ON employee_bookings;
DROP POLICY IF EXISTS "Public can create booking requests" ON employee_bookings;

-- Create function to generate booking number if empty
CREATE OR REPLACE FUNCTION generate_booking_number_if_empty()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('booking_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate booking number
DROP TRIGGER IF EXISTS generate_booking_number_trigger ON employee_bookings;
CREATE TRIGGER generate_booking_number_trigger
  BEFORE INSERT ON employee_bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_number_if_empty();

-- Update is_manager_or_admin function to be more robust
CREATE OR REPLACE FUNCTION is_manager_or_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM system_users 
    WHERE id = user_id 
    AND (role = 'admin' OR department = 'Business Aviation' OR role = 'sales')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow public users to create booking requests
CREATE POLICY "Public can create booking requests"
  ON employee_bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated employees to read their own bookings
CREATE POLICY "Employees can read own bookings"
  ON employee_bookings
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- Allow authenticated employees to update their own pending bookings
CREATE POLICY "Employees can update own pending bookings"
  ON employee_bookings
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending')
  WITH CHECK (employee_id = auth.uid() AND status = 'pending');

-- Allow managers and admins to read all bookings
CREATE POLICY "Managers can read all bookings"
  ON employee_bookings
  FOR SELECT
  TO authenticated
  USING (is_manager_or_admin(auth.uid()));

-- Allow managers and admins to update all bookings
CREATE POLICY "Managers can update all bookings"
  ON employee_bookings
  FOR UPDATE
  TO authenticated
  USING (is_manager_or_admin(auth.uid()))
  WITH CHECK (is_manager_or_admin(auth.uid()));

-- Allow managers and admins to delete bookings
CREATE POLICY "Managers can delete bookings"
  ON employee_bookings
  FOR DELETE
  TO authenticated
  USING (is_manager_or_admin(auth.uid()));

-- Update the booking history policies as well
DROP POLICY IF EXISTS "Users can read booking history" ON booking_history;
DROP POLICY IF EXISTS "System can insert booking history" ON booking_history;

CREATE POLICY "Users can read booking history"
  ON booking_history
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM employee_bookings 
      WHERE employee_id = auth.uid() OR is_manager_or_admin(auth.uid())
    )
  );

CREATE POLICY "System can insert booking history"
  ON booking_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also allow public to insert booking history for system operations
CREATE POLICY "Public can insert booking history"
  ON booking_history
  FOR INSERT
  TO public
  WITH CHECK (true);