/*
  # Add Sales Role Support

  1. Database Changes
    - Add 'sales' role to system_users role constraint
    - Update RLS policies to include sales role
    - Add sales-specific permissions

  2. Security
    - Enable RLS on all relevant tables
    - Add policies for sales role access
    - Ensure proper data isolation
*/

-- Add sales role to the role constraint
ALTER TABLE system_users DROP CONSTRAINT IF EXISTS system_users_role_check;
ALTER TABLE system_users ADD CONSTRAINT system_users_role_check 
  CHECK (role = ANY (ARRAY['admin'::text, 'employee'::text, 'sales'::text]));

-- Update partners table policies for sales role
DROP POLICY IF EXISTS "Sales can read all partners" ON partners;
CREATE POLICY "Sales can read all partners"
  ON partners
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'sales')
    )
  );

DROP POLICY IF EXISTS "Sales can update partners" ON partners;
CREATE POLICY "Sales can update partners"
  ON partners
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

DROP POLICY IF EXISTS "Sales can insert partners" ON partners;
CREATE POLICY "Sales can insert partners"
  ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'sales')
    )
  );

-- Add sales tracking table for deals
CREATE TABLE IF NOT EXISTS sales_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_user_id uuid REFERENCES system_users(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE,
  deal_amount numeric NOT NULL DEFAULT 0,
  deal_date date NOT NULL DEFAULT CURRENT_DATE,
  commission_rate numeric DEFAULT 0.1,
  commission_amount numeric GENERATED ALWAYS AS (deal_amount * commission_rate) STORED,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'closed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on sales_deals
ALTER TABLE sales_deals ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_deals
CREATE POLICY "Sales can read own deals"
  ON sales_deals
  FOR SELECT
  TO authenticated
  USING (
    sales_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  );

CREATE POLICY "Sales can insert own deals"
  ON sales_deals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sales_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role IN ('admin', 'sales')
    )
  );

CREATE POLICY "Sales can update own deals"
  ON sales_deals
  FOR UPDATE
  TO authenticated
  USING (
    sales_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  )
  WITH CHECK (
    sales_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  );

-- Add client interaction tracking
CREATE TABLE IF NOT EXISTS client_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES system_users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  interaction_type text NOT NULL DEFAULT 'view' CHECK (interaction_type IN ('view', 'call', 'email', 'meeting', 'note')),
  notes text NOT NULL,
  interaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on client_interactions
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_interactions
CREATE POLICY "Users can read own interactions"
  ON client_interactions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own interactions"
  ON client_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_deals_sales_user_id ON sales_deals(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_deals_partner_id ON sales_deals(partner_id);
CREATE INDEX IF NOT EXISTS idx_sales_deals_deal_date ON sales_deals(deal_date);
CREATE INDEX IF NOT EXISTS idx_client_interactions_user_id ON client_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_client_id ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_date ON client_interactions(interaction_date);

-- Function to update total_sales for users
CREATE OR REPLACE FUNCTION update_user_total_sales()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE system_users 
    SET total_sales = (
      SELECT COALESCE(SUM(deal_amount), 0) 
      FROM sales_deals 
      WHERE sales_user_id = NEW.sales_user_id 
      AND status = 'closed'
    )
    WHERE id = NEW.sales_user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE system_users 
    SET total_sales = (
      SELECT COALESCE(SUM(deal_amount), 0) 
      FROM sales_deals 
      WHERE sales_user_id = OLD.sales_user_id 
      AND status = 'closed'
    )
    WHERE id = OLD.sales_user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update total_sales
DROP TRIGGER IF EXISTS update_user_sales_trigger ON sales_deals;
CREATE TRIGGER update_user_sales_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sales_deals
  FOR EACH ROW EXECUTE FUNCTION update_user_total_sales();

-- Add avatar storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );