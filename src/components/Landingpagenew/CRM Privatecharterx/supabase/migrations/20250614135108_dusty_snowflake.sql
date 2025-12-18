/*
  # Add Client Categories System

  1. New Tables
    - `client_categories` - Store category definitions
    - `client_category_subscriptions` - Link clients to categories

  2. Security
    - Enable RLS on new tables
    - Add policies for proper access control

  3. Changes
    - Add category management system
    - Support for newsletter category subscriptions
*/

-- Create client_categories table
CREATE TABLE IF NOT EXISTS client_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES system_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create client_category_subscriptions table
CREATE TABLE IF NOT EXISTS client_category_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  category_id uuid REFERENCES client_categories(id) ON DELETE CASCADE,
  subscribed_at timestamptz DEFAULT now(),
  UNIQUE(client_id, category_id)
);

-- Enable RLS on new tables
ALTER TABLE client_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_category_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_category_subscriptions_client_id ON client_category_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_category_subscriptions_category_id ON client_category_subscriptions(category_id);

-- RLS policies for client_categories
CREATE POLICY "Marketing and admin users can manage categories"
  ON client_categories
  FOR ALL
  TO authenticated
  USING (is_marketing_or_admin())
  WITH CHECK (is_marketing_or_admin());

CREATE POLICY "Public can read categories"
  ON client_categories
  FOR SELECT
  TO public
  USING (true);

-- RLS policies for client_category_subscriptions
CREATE POLICY "Marketing and admin users can manage subscriptions"
  ON client_category_subscriptions
  FOR ALL
  TO authenticated
  USING (is_marketing_or_admin())
  WITH CHECK (is_marketing_or_admin());

CREATE POLICY "Users can see their own subscriptions"
  ON client_category_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE email = (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

-- Create default categories
INSERT INTO client_categories (name, description) VALUES
  ('Private Jets', 'Subscribers interested in private jet charters'),
  ('Yachts', 'Subscribers interested in yacht charters'),
  ('Helicopters', 'Subscribers interested in helicopter services'),
  ('Luxury Cars', 'Subscribers interested in luxury car rentals'),
  ('Empty Legs', 'Subscribers interested in empty leg flight deals')
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at
CREATE TRIGGER update_client_categories_updated_at
  BEFORE UPDATE ON client_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();