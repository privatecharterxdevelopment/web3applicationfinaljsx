-- Add marketing role to the role constraint
ALTER TABLE system_users DROP CONSTRAINT IF EXISTS system_users_role_check;
ALTER TABLE system_users ADD CONSTRAINT system_users_role_check 
  CHECK (role = ANY (ARRAY['admin'::text, 'employee'::text, 'sales'::text, 'marketing'::text]));

-- Create newsletters table for storing templates
CREATE TABLE IF NOT EXISTS newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  template_html text NOT NULL,
  created_by uuid REFERENCES system_users(id) ON DELETE SET NULL,
  is_draft boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create newsletter_campaigns table for tracking sent newsletters
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id uuid REFERENCES newsletters(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  created_by uuid REFERENCES system_users(id) ON DELETE SET NULL,
  total_recipients integer DEFAULT 0,
  opens integer DEFAULT 0,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create newsletter_recipients table for tracking recipients
CREATE TABLE IF NOT EXISTS newsletter_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_recipients ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is marketing or admin
CREATE OR REPLACE FUNCTION is_marketing_or_admin()
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
  
  RETURN user_role IN ('admin', 'marketing');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for newsletters
CREATE POLICY "Marketing and admin users can manage newsletters"
  ON newsletters
  FOR ALL
  TO authenticated
  USING (is_marketing_or_admin())
  WITH CHECK (is_marketing_or_admin());

CREATE POLICY "Public can read published newsletters"
  ON newsletters
  FOR SELECT
  TO public
  USING (NOT is_draft);

-- RLS policies for newsletter_campaigns
CREATE POLICY "Marketing and admin users can manage campaigns"
  ON newsletter_campaigns
  FOR ALL
  TO authenticated
  USING (is_marketing_or_admin())
  WITH CHECK (is_marketing_or_admin());

CREATE POLICY "Public can read sent campaigns"
  ON newsletter_campaigns
  FOR SELECT
  TO public
  USING (status = 'sent');

-- RLS policies for newsletter_recipients
CREATE POLICY "Marketing and admin users can manage recipients"
  ON newsletter_recipients
  FOR ALL
  TO authenticated
  USING (is_marketing_or_admin())
  WITH CHECK (is_marketing_or_admin());

CREATE POLICY "Users can see their own newsletter subscriptions"
  ON newsletter_recipients
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE email = (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletters_created_by ON newsletters(created_by);
CREATE INDEX IF NOT EXISTS idx_newsletters_is_draft ON newsletters(is_draft);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_newsletter_id ON newsletter_campaigns(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_campaign_id ON newsletter_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_client_id ON newsletter_recipients(client_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_status ON newsletter_recipients(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_newsletters_updated_at
  BEFORE UPDATE ON newsletters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_campaigns_updated_at
  BEFORE UPDATE ON newsletter_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add a marketing user for testing
INSERT INTO system_users (
  id,
  email,
  name,
  role,
  department,
  is_active,
  hire_date,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'marketing@privatecharterx.com',
  'Marketing Manager',
  'marketing',
  'Marketing',
  true,
  CURRENT_DATE,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'marketing',
  department = 'Marketing',
  is_active = true,
  updated_at = now();

-- Create auth user for marketing using a safer approach that avoids generated columns
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the system user ID
  SELECT id INTO user_id FROM system_users WHERE email = 'marketing@privatecharterx.com';
  
  -- Check if auth user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marketing@privatecharterx.com') THEN
    -- Insert auth user without setting confirmed_at (it's a generated column)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      phone_confirmed_at
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      'marketing@privatecharterx.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object(
        'name', 'Marketing Manager',
        'role', 'marketing'
      ),
      false,
      'authenticated',
      'authenticated',
      '',
      now()
    );

    -- Create identity without specifying the email column (it's generated)
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      user_id::text,
      user_id,
      jsonb_build_object(
        'sub', user_id::text,
        'email', 'marketing@privatecharterx.com',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    );
  END IF;
END $$;