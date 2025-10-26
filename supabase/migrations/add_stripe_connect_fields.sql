-- Add Stripe Connect Integration for Partner Marketplace
-- This migration adds fields needed for Stripe Connect Express accounts,
-- commission tracking, and multi-region payout support

-- ============================================================
-- 1. Add Stripe Connect fields to users table
-- ============================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_verification_status TEXT CHECK (stripe_verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_country TEXT, -- Partner's Stripe account country (CH, US, etc.)
ADD COLUMN IF NOT EXISTS stripe_account_type TEXT CHECK (stripe_account_type IN ('express', 'standard', 'custom')) DEFAULT 'express';

-- ============================================================
-- 2. Add commission and payment tracking to partner_bookings
-- ============================================================

ALTER TABLE partner_bookings
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.10, -- Support rates like 0.10 (10%), 0.12 (12%), 0.15 (15%)
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS partner_earnings DECIMAL(10, 2), -- Net amount partner receives
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2), -- Platform commission
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT, -- Payment Intent ID for escrow
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT, -- Transfer ID to partner's Connect account
ADD COLUMN IF NOT EXISTS stripe_transfer_status TEXT CHECK (stripe_transfer_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS service_type TEXT CHECK (service_type IN ('taxi', 'luxury-car', 'adventure', 'auto', 'limousine', 'other')); -- For commission calculation

-- ============================================================
-- 3. Create partner_earnings table for transaction history
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  partner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES partner_bookings(id) ON DELETE SET NULL,

  -- Financial Details
  gross_amount DECIMAL(10, 2) NOT NULL, -- Total booking amount
  commission_rate DECIMAL(5, 4) NOT NULL, -- Commission percentage (0.10, 0.12, 0.15)
  commission_amount DECIMAL(10, 2) NOT NULL, -- Platform commission
  net_amount DECIMAL(10, 2) NOT NULL, -- Amount partner receives
  currency TEXT DEFAULT 'EUR' NOT NULL,

  -- Stripe Details
  stripe_transfer_id TEXT,
  stripe_transfer_status TEXT CHECK (stripe_transfer_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  stripe_payout_id TEXT, -- ID of the payout batch (for daily payouts)

  -- Service Info
  service_type TEXT, -- taxi, luxury-car, adventure
  service_description TEXT,

  -- Status
  status TEXT CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for partner_earnings
CREATE INDEX IF NOT EXISTS idx_partner_earnings_partner_id ON partner_earnings(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_booking_id ON partner_earnings(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_status ON partner_earnings(status);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_created_at ON partner_earnings(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_paid_at ON partner_earnings(paid_at);

-- ============================================================
-- 4. Create partner_stripe_accounts table for detailed tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_stripe_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  partner_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_account_id TEXT UNIQUE NOT NULL,

  -- Account Details
  account_type TEXT CHECK (account_type IN ('express', 'standard', 'custom')) DEFAULT 'express',
  country TEXT NOT NULL, -- CH, US, DE, etc.
  currency TEXT NOT NULL, -- CHF, USD, EUR, etc.

  -- Onboarding Status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,

  -- Verification Status
  verification_status TEXT CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')) DEFAULT 'unverified',
  verification_fields_needed TEXT[], -- Array of missing fields
  verification_due_by TIMESTAMP WITH TIME ZONE,

  -- Capabilities
  card_payments_enabled BOOLEAN DEFAULT FALSE,
  transfers_enabled BOOLEAN DEFAULT FALSE,

  -- Payout Settings
  payout_schedule TEXT CHECK (payout_schedule IN ('manual', 'daily', 'weekly', 'monthly')) DEFAULT 'daily',
  payout_delay_days INTEGER DEFAULT 2, -- Stripe standard delay

  -- Metadata
  last_sync_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_stripe_accounts_partner_id ON partner_stripe_accounts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_stripe_accounts_stripe_account_id ON partner_stripe_accounts(stripe_account_id);

-- ============================================================
-- 5. Enable Row Level Security
-- ============================================================

ALTER TABLE partner_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_stripe_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Create RLS Policies
-- ============================================================

-- Partner Earnings: Partners see their own earnings
DROP POLICY IF EXISTS "Partners can view own earnings" ON partner_earnings;
CREATE POLICY "Partners can view own earnings" ON partner_earnings
  FOR SELECT USING (auth.uid() = partner_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- Partner Stripe Accounts: Partners see their own Stripe account
DROP POLICY IF EXISTS "Partners can view own Stripe account" ON partner_stripe_accounts;
CREATE POLICY "Partners can view own Stripe account" ON partner_stripe_accounts
  FOR SELECT USING (auth.uid() = partner_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- Admins can update Stripe account status
DROP POLICY IF EXISTS "Admins can update Stripe accounts" ON partner_stripe_accounts;
CREATE POLICY "Admins can update Stripe accounts" ON partner_stripe_accounts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- ============================================================
-- 7. Create update trigger for updated_at columns
-- ============================================================

DROP TRIGGER IF EXISTS update_partner_earnings_updated_at ON partner_earnings;
CREATE TRIGGER update_partner_earnings_updated_at BEFORE UPDATE ON partner_earnings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_stripe_accounts_updated_at ON partner_stripe_accounts;
CREATE TRIGGER update_partner_stripe_accounts_updated_at BEFORE UPDATE ON partner_stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. Add helpful comments
-- ============================================================

COMMENT ON TABLE partner_earnings IS 'Transaction history of partner earnings with commission breakdown';
COMMENT ON TABLE partner_stripe_accounts IS 'Detailed Stripe Connect account information for partners';

COMMENT ON COLUMN users.stripe_connect_account_id IS 'Stripe Connect Express/Custom account ID (acct_xxx)';
COMMENT ON COLUMN users.stripe_onboarding_completed IS 'Whether partner completed Stripe onboarding flow';
COMMENT ON COLUMN users.stripe_charges_enabled IS 'Whether partner can receive payments';
COMMENT ON COLUMN users.stripe_payouts_enabled IS 'Whether partner can receive payouts';

COMMENT ON COLUMN partner_bookings.commission_rate IS 'Commission rate (0.10=10%, 0.12=12%, 0.15=15%)';
COMMENT ON COLUMN partner_bookings.commission_amount IS 'Platform commission in currency units';
COMMENT ON COLUMN partner_bookings.partner_earnings IS 'Net amount partner receives after commission';

-- ============================================================
-- 9. Function: Calculate commission based on service type
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_partner_commission(
  p_service_type TEXT,
  p_total_amount DECIMAL
) RETURNS TABLE (
  commission_rate DECIMAL,
  commission_amount DECIMAL,
  partner_earnings DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN p_service_type = 'taxi' THEN 0.10::DECIMAL
      WHEN p_service_type = 'luxury-car' THEN 0.12::DECIMAL
      WHEN p_service_type = 'adventure' THEN 0.15::DECIMAL
      WHEN p_service_type IN ('auto', 'limousine') THEN 0.12::DECIMAL
      ELSE 0.10::DECIMAL -- Default 10%
    END AS commission_rate,
    ROUND(p_total_amount * CASE
      WHEN p_service_type = 'taxi' THEN 0.10
      WHEN p_service_type = 'luxury-car' THEN 0.12
      WHEN p_service_type = 'adventure' THEN 0.15
      WHEN p_service_type IN ('auto', 'limousine') THEN 0.12
      ELSE 0.10
    END, 2) AS commission_amount,
    ROUND(p_total_amount * (1 - CASE
      WHEN p_service_type = 'taxi' THEN 0.10
      WHEN p_service_type = 'luxury-car' THEN 0.12
      WHEN p_service_type = 'adventure' THEN 0.15
      WHEN p_service_type IN ('auto', 'limousine') THEN 0.12
      ELSE 0.10
    END), 2) AS partner_earnings;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_partner_commission IS 'Calculate commission for partner bookings: Taxi 10%, Luxury Car 12%, Adventure 15%';

-- ============================================================
-- Done!
-- ============================================================
