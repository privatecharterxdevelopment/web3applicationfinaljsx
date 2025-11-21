-- Add pricing tier columns to campaigns table
-- This migration is safe to run multiple times

-- Add pricing_tier column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='pricing_tier') THEN
    ALTER TABLE campaigns
    ADD COLUMN pricing_tier TEXT CHECK (pricing_tier IN ('starter', 'pro', 'enterprise', 'enterprise_audit'));
  END IF;
END $$;

-- Add launch_fee_paid_amount (separate from boolean launch_fee_paid)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='launch_fee_paid_amount') THEN
    ALTER TABLE campaigns
    ADD COLUMN launch_fee_paid_amount DECIMAL(10,2);
  END IF;
END $$;

-- Note: launch_fee_tx_hash already exists in schema, skip it

-- Add transaction_fee_percentage
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='transaction_fee_percentage') THEN
    ALTER TABLE campaigns
    ADD COLUMN transaction_fee_percentage DECIMAL(4,2);
  END IF;
END $$;

-- Add featured_until date
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='featured_until') THEN
    ALTER TABLE campaigns
    ADD COLUMN featured_until TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Note: published_at already exists in schema, skip it

-- Update status constraint to include 'pending_payment' and align with code (active instead of live)
ALTER TABLE campaigns
DROP CONSTRAINT IF EXISTS campaigns_status_check;

ALTER TABLE campaigns
ADD CONSTRAINT campaigns_status_check
CHECK (status IN ('draft', 'pending_payment', 'active', 'funded', 'failed', 'completed', 'cancelled'));

-- Create indexes
DROP INDEX IF EXISTS idx_campaigns_featured;
CREATE INDEX idx_campaigns_featured ON campaigns(featured_until)
WHERE featured_until IS NOT NULL AND featured_until > NOW();

DROP INDEX IF EXISTS idx_campaigns_pricing_tier;
CREATE INDEX idx_campaigns_pricing_tier ON campaigns(pricing_tier);

DROP INDEX IF EXISTS idx_campaigns_creator_status;
CREATE INDEX idx_campaigns_creator_status ON campaigns(creator_wallet, status);

-- Add comments
COMMENT ON COLUMN campaigns.pricing_tier IS 'Pricing tier: starter (CHF 250), pro (CHF 500), enterprise (CHF 2000), enterprise_audit (CHF 15000)';
COMMENT ON COLUMN campaigns.transaction_fee_percentage IS 'Transaction fee percentage charged on successful fundraise (1.0-2.5%)';
COMMENT ON COLUMN campaigns.featured_until IS 'Date until which campaign is featured on homepage (Pro: 7 days, Enterprise: 30 days)';
COMMENT ON COLUMN campaigns.launch_fee_paid_amount IS 'Amount paid in USDC for campaign launch fee';

-- =====================================================
-- USER PROFILE INTEGRATION
-- =====================================================

-- Create view for user campaigns with pricing info
CREATE OR REPLACE VIEW user_campaigns_with_pricing AS
SELECT
  c.id,
  c.creator_wallet,
  u.username,
  u.profile_image_url,
  c.title,
  c.description,
  c.short_description,
  c.category,
  c.logo_image_url,
  c.header_image_url,
  c.goal_amount,
  c.raised_amount,
  c.status,
  c.pricing_tier,
  c.launch_fee_paid_amount,
  c.transaction_fee_percentage,
  c.featured_until,
  c.backer_count,
  c.view_count,
  c.created_at,
  c.published_at,
  c.start_date,
  c.end_date,
  get_campaign_progress(c.id) as progress_percentage,
  get_days_remaining(c.id) as days_remaining,
  CASE 
    WHEN c.featured_until IS NOT NULL AND c.featured_until > NOW() THEN true
    ELSE false
  END as is_featured
FROM campaigns c
LEFT JOIN users u ON c.creator_wallet = u.wallet_address;

-- Create function to get user's total fees paid
CREATE OR REPLACE FUNCTION get_user_total_fees_paid(user_wallet TEXT)
RETURNS DECIMAL AS $$
DECLARE
  total_fees DECIMAL;
BEGIN
  SELECT COALESCE(SUM(launch_fee_paid_amount), 0) INTO total_fees
  FROM campaigns
  WHERE creator_wallet = user_wallet
  AND launch_fee_paid_amount IS NOT NULL;
  
  RETURN total_fees;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's campaigns by tier
CREATE OR REPLACE FUNCTION get_user_campaigns_by_tier(user_wallet TEXT)
RETURNS TABLE (
  tier TEXT,
  campaign_count BIGINT,
  total_fees_paid DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(pricing_tier, 'none') as tier,
    COUNT(*)::BIGINT as campaign_count,
    COALESCE(SUM(launch_fee_paid_amount), 0) as total_fees_paid
  FROM campaigns
  WHERE creator_wallet = user_wallet
  GROUP BY pricing_tier;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETE
-- =====================================================

-- Migration complete!
-- Run this SQL in Supabase SQL Editor
