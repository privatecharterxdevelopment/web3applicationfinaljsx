-- Create card_applications table for DebitCardX applications
CREATE TABLE IF NOT EXISTS card_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Application status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'waitlist', 'cancelled')),

  -- Account type
  account_type TEXT NOT NULL DEFAULT 'individual' CHECK (account_type IN ('individual', 'corporate')),

  -- Personal information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  vat_number TEXT, -- Only for corporate accounts

  -- Financial information
  monthly_spending TEXT NOT NULL, -- e.g., '0-5000', '5000-25000', etc.
  expected_volume TEXT NOT NULL, -- e.g., '0-50000', '50000-250000', etc.

  -- Card selection
  card_tier TEXT NOT NULL CHECK (card_tier IN ('basic', 'gold', 'crew', 'black', 'platinum')),
  card_price DECIMAL(10, 2) NOT NULL, -- Monthly price
  min_topup DECIMAL(10, 2) NOT NULL,

  -- Ground transport
  ground_transport_included TEXT, -- Included km with card tier
  extra_transport_km TEXT DEFAULT '0', -- '0', '10', '25', '50', '100', 'custom'
  extra_transport_price DECIMAL(10, 2) DEFAULT 0,

  -- AI plan (included with card)
  ai_plan_name TEXT,
  ai_plan_value DECIMAL(10, 2),

  -- Staking info
  staking_apy TEXT,

  -- Discounts
  discount_booking TEXT,
  discount_empty_legs TEXT,
  discount_hotels TEXT,

  -- Admin notes
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_card_applications_user_id ON card_applications(user_id);
CREATE INDEX idx_card_applications_status ON card_applications(status);
CREATE INDEX idx_card_applications_card_tier ON card_applications(card_tier);
CREATE INDEX idx_card_applications_created_at ON card_applications(created_at DESC);

-- Enable RLS
ALTER TABLE card_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own applications
CREATE POLICY "Users can view own card applications"
  ON card_applications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can create applications (allows guest applications)
CREATE POLICY "Anyone can create card applications"
  ON card_applications
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own pending applications
CREATE POLICY "Users can update own pending applications"
  ON card_applications
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all applications
CREATE POLICY "Admins can view all card applications"
  ON card_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE user_id = auth.uid()
      AND (is_admin = true OR is_super_admin = true)
    )
  );

-- Admins can update all applications
CREATE POLICY "Admins can update all card applications"
  ON card_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE user_id = auth.uid()
      AND (is_admin = true OR is_super_admin = true)
    )
  );

-- Admins can delete applications
CREATE POLICY "Admins can delete card applications"
  ON card_applications
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE user_id = auth.uid()
      AND is_super_admin = true
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_card_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_card_applications_updated_at
  BEFORE UPDATE ON card_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_card_applications_updated_at();

-- Add comment
COMMENT ON TABLE card_applications IS 'DebitCardX credit card applications with tier selection and add-ons';
