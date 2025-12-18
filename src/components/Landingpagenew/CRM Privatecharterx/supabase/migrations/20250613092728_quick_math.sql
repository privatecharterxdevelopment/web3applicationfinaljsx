/*
  # Service Order and User Management System

  1. New Tables
    - `service_orders` - Store service orders with client and service details
    - `order_items` - Individual services within an order
    - `system_users` - Employee/admin user management
    - `user_activity_logs` - Track user login activity and actions
    - `sales_reports` - Track sales performance by user

  2. Security
    - Enable RLS on all new tables
    - Add policies for admin-only user management
    - Add policies for order management

  3. Features
    - Service ordering system
    - Client profile creation during checkout
    - Admin user management
    - Activity logging
    - Sales reporting
*/

-- Create system_users table for employee/admin management
CREATE TABLE IF NOT EXISTS system_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  department text,
  phone text,
  hire_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  total_sales numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES system_users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create service_orders table
CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id),
  created_by uuid REFERENCES system_users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  total_amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  notes text,
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('jet', 'yacht', 'helicopter', 'car', 'emptyleg')),
  service_id text, -- Reference to specific service (jets.id, etc.)
  service_name text NOT NULL,
  quantity integer DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  departure text,
  arrival text,
  departure_date date,
  return_date date,
  passengers integer,
  duration text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create sales_reports table
CREATE TABLE IF NOT EXISTS sales_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES system_users(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_orders integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  avg_order_value numeric DEFAULT 0,
  top_service_type text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM system_users 
    WHERE email = user_email AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user
CREATE OR REPLACE FUNCTION get_current_user_id(user_email text)
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id FROM system_users 
    WHERE email = user_email AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for system_users (Admin only)
CREATE POLICY "Admins can manage all users"
  ON system_users
  FOR ALL
  TO public
  USING (is_admin(current_setting('request.jwt.claims', true)::json->>'email'))
  WITH CHECK (is_admin(current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can read their own profile"
  ON system_users
  FOR SELECT
  TO public
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policies for user_activity_logs
CREATE POLICY "Admins can read all activity logs"
  ON user_activity_logs
  FOR SELECT
  TO public
  USING (is_admin(current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "System can insert activity logs"
  ON user_activity_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for service_orders
CREATE POLICY "Users can read all orders"
  ON service_orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create orders"
  ON service_orders
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update orders they created"
  ON service_orders
  FOR UPDATE
  TO public
  USING (created_by = get_current_user_id(current_setting('request.jwt.claims', true)::json->>'email'))
  WITH CHECK (created_by = get_current_user_id(current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admins can update all orders"
  ON service_orders
  FOR UPDATE
  TO public
  USING (is_admin(current_setting('request.jwt.claims', true)::json->>'email'))
  WITH CHECK (is_admin(current_setting('request.jwt.claims', true)::json->>'email'));

-- Policies for order_items
CREATE POLICY "Users can read all order items"
  ON order_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage order items"
  ON order_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Policies for sales_reports
CREATE POLICY "Admins can read all sales reports"
  ON sales_reports
  FOR SELECT
  TO public
  USING (is_admin(current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can read their own sales reports"
  ON sales_reports
  FOR SELECT
  TO public
  USING (user_id = get_current_user_id(current_setting('request.jwt.claims', true)::json->>'email'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_orders_client_id ON service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_by ON service_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service_type ON order_items(service_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_reports_user_id ON sales_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_system_users_email ON system_users(email);
CREATE INDEX IF NOT EXISTS idx_system_users_role ON system_users(role);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  order_num text;
BEGIN
  order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::text, 4, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to update order total
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_orders 
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0) 
    FROM order_items 
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update order total
CREATE TRIGGER update_order_total_trigger
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();

-- Function to update user sales
CREATE OR REPLACE FUNCTION update_user_sales()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE system_users 
    SET total_sales = total_sales + NEW.total_amount
    WHERE id = NEW.created_by;
  ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    UPDATE system_users 
    SET total_sales = total_sales - OLD.total_amount
    WHERE id = NEW.created_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user sales
CREATE TRIGGER update_user_sales_trigger
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sales();

-- Insert sample system users
INSERT INTO system_users (email, name, role, department, phone) VALUES
  ('admin@privatecharterx.com', 'John Administrator', 'admin', 'Management', '+1-555-0001'),
  ('employee@privatecharterx.com', 'Sarah Johnson', 'employee', 'Sales', '+1-555-0002'),
  ('mike.davis@privatecharterx.com', 'Mike Davis', 'employee', 'Operations', '+1-555-0003'),
  ('emma.wilson@privatecharterx.com', 'Emma Wilson', 'employee', 'Customer Service', '+1-555-0004')
ON CONFLICT (email) DO NOTHING;