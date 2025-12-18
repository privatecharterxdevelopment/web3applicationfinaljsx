/*
  # Add Payment System and Accountant Role

  1. Schema Changes
    - Add payment_status column to service_orders table
    - Add payment_method column to service_orders table
    - Add payment_date column to service_orders table
    - Add payment_amount column to service_orders table
    - Add payment_reference column to service_orders table
    - Add payment_notes column to service_orders table
    - Update system_users role constraint to include 'accountant' role

  2. Security
    - Add RLS policies for accountant role
    - Ensure proper access control for payment operations

  3. Indexes
    - Add indexes for better query performance on payment fields
*/

-- Add accountant role to the role constraint
ALTER TABLE system_users DROP CONSTRAINT IF EXISTS system_users_role_check;
ALTER TABLE system_users ADD CONSTRAINT system_users_role_check 
  CHECK (role = ANY (ARRAY['admin'::text, 'employee'::text, 'sales'::text, 'marketing'::text, 'accountant'::text]));

-- Add payment fields to service_orders table
DO $$
BEGIN
  -- Add payment_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_status text DEFAULT 'unpaid' 
      CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'cancelled'));
  END IF;

  -- Add payment_method column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_method text DEFAULT NULL
      CHECK (payment_method IS NULL OR payment_method IN ('credit_card', 'bank_transfer', 'paypal', 'crypto', 'cash', 'other'));
  END IF;

  -- Add payment_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_date timestamptz DEFAULT NULL;
  END IF;

  -- Add payment_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'payment_amount'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_amount numeric DEFAULT NULL;
  END IF;

  -- Add payment_reference column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_reference text DEFAULT NULL;
  END IF;

  -- Add payment_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'payment_notes'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_notes text DEFAULT NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_orders_payment_status ON service_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_service_orders_payment_date ON service_orders(payment_date);

-- Create function to check if user is accountant
CREATE OR REPLACE FUNCTION is_accountant()
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
  
  RETURN user_role = 'accountant' OR user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for accountants
CREATE POLICY "Accountants can update payment fields"
  ON service_orders
  FOR UPDATE
  TO authenticated
  USING (is_accountant())
  WITH CHECK (is_accountant());

-- Add a demo accountant user
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
  'accountant@privatecharterx.com',
  'Finance Manager',
  'accountant',
  'Finance',
  true,
  CURRENT_DATE,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'accountant',
  department = 'Finance',
  is_active = true,
  updated_at = now();

-- Create auth user for accountant
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the system user ID
  SELECT id INTO user_id FROM system_users WHERE email = 'accountant@privatecharterx.com';
  
  -- Check if auth user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'accountant@privatecharterx.com') THEN
    -- Insert auth user
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
      'accountant@privatecharterx.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object(
        'name', 'Finance Manager',
        'role', 'accountant'
      ),
      false,
      'authenticated',
      'authenticated',
      '',
      now()
    );

    -- Create identity
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
        'email', 'accountant@privatecharterx.com',
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

-- Create function to log payment status changes
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if payment_status has changed
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO user_activity_logs (
      user_id,
      action,
      details,
      created_at
    ) VALUES (
      COALESCE(
        (SELECT id FROM system_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'),
        NULL
      ),
      'payment_status_change',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'old_status', OLD.payment_status,
        'new_status', NEW.payment_status,
        'payment_amount', NEW.payment_amount,
        'payment_method', NEW.payment_method
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status changes
DROP TRIGGER IF EXISTS log_payment_status_change_trigger ON service_orders;
CREATE TRIGGER log_payment_status_change_trigger
  AFTER UPDATE OF payment_status ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_payment_status_change();