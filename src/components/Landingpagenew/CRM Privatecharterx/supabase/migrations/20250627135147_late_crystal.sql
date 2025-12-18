/*
  # Accounting System

  1. New Tables
    - `invoices` - Store invoice data
    - `financial_transactions` - Track income and expenses
    - `tax_rates` - Store tax rates for different regions

  2. Security
    - Enable RLS on all new tables
    - Add policies for accountant and admin roles
    - Ensure proper access control

  3. Features
    - Invoice generation and tracking
    - Payment tracking
    - Financial reporting
    - VAT calculation
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  amount numeric NOT NULL,
  tax_amount numeric NOT NULL,
  total_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'CHF',
  issue_date date NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'cancelled')),
  payment_method text,
  payment_date timestamptz,
  payment_reference text,
  notes text,
  created_by uuid NOT NULL REFERENCES system_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  file_url text
);

-- Create financial_transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'CHF',
  category text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  reference text,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES system_users(id),
  created_at timestamptz DEFAULT now()
);

-- Create tax_rates table
CREATE TABLE IF NOT EXISTS tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  region text,
  rate numeric NOT NULL,
  tax_type text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_invoice_id ON financial_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_client_id ON financial_transactions(client_id);

-- Create function to check if user is accountant or admin
CREATE OR REPLACE FUNCTION is_accountant_or_admin()
RETURNS boolean AS $$
DECLARE
  user_email text;
  user_role text;
BEGIN
  -- Get email from JWT claims
  user_email := (current_setting('request.jwt.claims', true)::json ->> 'email');
  
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check user role
  SELECT role INTO user_role 
  FROM system_users 
  WHERE email = user_email 
  AND is_active = true
  LIMIT 1;
  
  RETURN user_role IN ('accountant', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for invoices
CREATE POLICY "Accountants and admins can manage invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (is_accountant_or_admin())
  WITH CHECK (is_accountant_or_admin());

CREATE POLICY "Public can read invoices"
  ON invoices
  FOR SELECT
  TO public
  USING (true);

-- RLS policies for financial_transactions
CREATE POLICY "Accountants and admins can manage transactions"
  ON financial_transactions
  FOR ALL
  TO authenticated
  USING (is_accountant_or_admin())
  WITH CHECK (is_accountant_or_admin());

CREATE POLICY "Public can read transactions"
  ON financial_transactions
  FOR SELECT
  TO public
  USING (true);

-- RLS policies for tax_rates
CREATE POLICY "Accountants and admins can manage tax rates"
  ON tax_rates
  FOR ALL
  TO authenticated
  USING (is_accountant_or_admin())
  WITH CHECK (is_accountant_or_admin());

CREATE POLICY "Public can read tax rates"
  ON tax_rates
  FOR SELECT
  TO public
  USING (true);

-- Create storage bucket for invoices if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for invoices bucket
CREATE POLICY "Accountants and admins can upload invoices"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' AND
    (EXISTS (
      SELECT 1 FROM system_users 
      WHERE email = (current_setting('request.jwt.claims', true)::json ->> 'email')
      AND role IN ('accountant', 'admin')
    ))
  );

CREATE POLICY "Authenticated users can read invoices"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices');

-- Insert default Swiss tax rate
INSERT INTO tax_rates (country, rate, tax_type, is_default)
VALUES ('Switzerland', 8.1, 'VAT', true)
ON CONFLICT DO NOTHING;

-- Create function to update invoice status based on due date
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'sent'
    AND payment_status != 'paid'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run daily (this would be set up in a real environment)
-- SELECT cron.schedule('0 0 * * *', 'SELECT update_overdue_invoices()');