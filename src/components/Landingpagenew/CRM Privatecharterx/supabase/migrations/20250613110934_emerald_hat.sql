/*
  # Employee Booking System

  1. New Tables
    - `employee_bookings` - Store employee-created bookings
    - `booking_assignments` - Track which managers handle bookings

  2. Security
    - Enable RLS on new tables
    - Add policies for employee booking creation
    - Add policies for manager/admin booking management

  3. Changes
    - Add booking history tracking
    - Add deal closure tracking
    - Add manager assignment system
*/

-- Create employee_bookings table
CREATE TABLE IF NOT EXISTS employee_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE NOT NULL,
  employee_id uuid NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  service_type text NOT NULL DEFAULT 'jet' CHECK (service_type IN ('jet', 'yacht', 'helicopter', 'car', 'emptyleg')),
  departure text NOT NULL,
  arrival text NOT NULL,
  departure_date date NOT NULL,
  departure_time time,
  return_date date,
  return_time time,
  passengers integer NOT NULL DEFAULT 1,
  aircraft_preference text,
  special_requests text,
  estimated_budget numeric,
  currency text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'quoted', 'confirmed', 'completed', 'cancelled')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid REFERENCES system_users(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  closed_by uuid REFERENCES system_users(id) ON DELETE SET NULL,
  closed_at timestamptz,
  final_amount numeric,
  commission_rate numeric DEFAULT 0.05,
  commission_amount numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create booking_history table for tracking changes
CREATE TABLE IF NOT EXISTS booking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES employee_bookings(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_status text,
  new_status text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employee_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employee_bookings_employee_id ON employee_bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_bookings_assigned_to ON employee_bookings(assigned_to);
CREATE INDEX IF NOT EXISTS idx_employee_bookings_status ON employee_bookings(status);
CREATE INDEX IF NOT EXISTS idx_employee_bookings_created_at ON employee_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_bookings_departure_date ON employee_bookings(departure_date);
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_history(booking_id);

-- Function to check if user is business aviation manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM system_users 
    WHERE id = user_id 
    AND (role = 'admin' OR department = 'Business Aviation' OR role = 'sales')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for employee_bookings

-- Employees can read their own bookings
CREATE POLICY "Employees can read own bookings"
  ON employee_bookings
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- Employees can create bookings
CREATE POLICY "Employees can create bookings"
  ON employee_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

-- Employees can update their own pending bookings
CREATE POLICY "Employees can update own pending bookings"
  ON employee_bookings
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending')
  WITH CHECK (employee_id = auth.uid() AND status = 'pending');

-- Managers and admins can read all bookings
CREATE POLICY "Managers can read all bookings"
  ON employee_bookings
  FOR SELECT
  TO authenticated
  USING (is_manager_or_admin(auth.uid()));

-- Managers and admins can update all bookings
CREATE POLICY "Managers can update all bookings"
  ON employee_bookings
  FOR UPDATE
  TO authenticated
  USING (is_manager_or_admin(auth.uid()))
  WITH CHECK (is_manager_or_admin(auth.uid()));

-- RLS Policies for booking_history

-- Users can read history of bookings they have access to
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

-- System can insert booking history
CREATE POLICY "System can insert booking history"
  ON booking_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS text AS $$
DECLARE
  booking_num text;
BEGIN
  booking_num := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('booking_number_seq')::text, 4, '0');
  RETURN booking_num;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for booking numbers
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

-- Function to log booking changes
CREATE OR REPLACE FUNCTION log_booking_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO booking_history (booking_id, changed_by, action, old_status, new_status, notes)
    VALUES (
      NEW.id,
      auth.uid(),
      CASE 
        WHEN OLD.status != NEW.status THEN 'status_change'
        WHEN OLD.assigned_to != NEW.assigned_to THEN 'assignment_change'
        ELSE 'update'
      END,
      OLD.status,
      NEW.status,
      CASE 
        WHEN OLD.status != NEW.status THEN 'Status changed from ' || OLD.status || ' to ' || NEW.status
        WHEN OLD.assigned_to != NEW.assigned_to THEN 'Assignment changed'
        ELSE 'Booking updated'
      END
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO booking_history (booking_id, changed_by, action, new_status, notes)
    VALUES (NEW.id, auth.uid(), 'created', NEW.status, 'Booking created');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking history
CREATE TRIGGER log_booking_change_trigger
  AFTER INSERT OR UPDATE ON employee_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_change();

-- Function to update commission when booking is closed
CREATE OR REPLACE FUNCTION update_booking_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.final_amount IS NOT NULL THEN
    NEW.commission_amount := NEW.final_amount * COALESCE(NEW.commission_rate, 0.05);
    NEW.closed_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for commission calculation
CREATE TRIGGER update_booking_commission_trigger
  BEFORE UPDATE ON employee_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_commission();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_booking_updated_at_trigger
  BEFORE UPDATE ON employee_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_updated_at();