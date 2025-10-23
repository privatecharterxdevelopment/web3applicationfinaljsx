/*
  # Create partner tables and referral system

  1. New Tables
    - `partners` - Stores partner information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_name` (text)
      - `contact_name` (text)
      - `email` (text)
      - `phone` (text)
      - `website` (text)
      - `business_type` (text)
      - `tier_id` (text)
      - `status` (text)
      - `payment_id` (text)
      - `paid_amount` (numeric)
      - `payment_date` (timestamptz)
      - `expiry_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `partner_referrals` - Tracks partner referrals
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, references partners)
      - `referred_id` (uuid, references partners)
      - `status` (text)
      - `discount_applied` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user access
    - Add policies for admin access
*/

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  business_type text NOT NULL,
  tier_id text,
  status text NOT NULL DEFAULT 'pending',
  payment_id text,
  paid_amount numeric,
  payment_date timestamptz,
  expiry_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'inactive', 'expired'))
);

-- Create partner_referrals table
CREATE TABLE IF NOT EXISTS partner_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES partners NOT NULL,
  referred_id uuid REFERENCES partners NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  discount_applied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Create partner_applications table for storing applications
CREATE TABLE IF NOT EXISTS partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  business_type text,
  referral_code text,
  message text,
  user_id uuid REFERENCES auth.users,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_partners_user_id ON partners(user_id);
CREATE INDEX idx_partners_email ON partners(email);
CREATE INDEX idx_partners_company_name ON partners(company_name);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partner_referrals_referrer_id ON partner_referrals(referrer_id);
CREATE INDEX idx_partner_referrals_referred_id ON partner_referrals(referred_id);
CREATE INDEX idx_partner_applications_email ON partner_applications(email);
CREATE INDEX idx_partner_applications_status ON partner_applications(status);

-- Add updated_at triggers
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies for partners table
CREATE POLICY "Partners can read own data"
  ON partners
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can update own data"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for partner_applications table
CREATE POLICY "Users can create applications"
  ON partner_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own applications"
  ON partner_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create admin policies
CREATE POLICY "Admins can read all partners"
  ON partners
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all partners"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can read all partner applications"
  ON partner_applications
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all partner applications"
  ON partner_applications
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can read all partner referrals"
  ON partner_referrals
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all partner referrals"
  ON partner_referrals
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));