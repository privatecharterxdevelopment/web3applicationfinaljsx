-- Add pricing tier columns to campaigns table

-- Add pricing_tier enum column
ALTER TABLE campaigns
ADD COLUMN pricing_tier TEXT CHECK (pricing_tier IN ('starter', 'pro', 'enterprise', 'enterprise_audit'));

-- Add launch fee tracking
ALTER TABLE campaigns
ADD COLUMN launch_fee_paid_amount DECIMAL(10,2);

-- Add transaction hash for launch fee payment
ALTER TABLE campaigns
ADD COLUMN launch_fee_tx_hash TEXT;

-- Add transaction fee percentage
ALTER TABLE campaigns
ADD COLUMN transaction_fee_percentage DECIMAL(4,2);

-- Add featured until date (for Pro/Enterprise tiers)
ALTER TABLE campaigns
ADD COLUMN featured_until TIMESTAMP WITH TIME ZONE;

-- Add published at timestamp
ALTER TABLE campaigns
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;

-- Update status enum to include 'pending_payment'
-- Note: PostgreSQL doesn't support ALTER TYPE easily, so we use TEXT with CHECK constraint
ALTER TABLE campaigns
DROP CONSTRAINT IF EXISTS campaigns_status_check;

ALTER TABLE campaigns
ADD CONSTRAINT campaigns_status_check
CHECK (status IN ('draft', 'pending_payment', 'active', 'funded', 'failed', 'completed', 'cancelled'));

-- Create index for featured campaigns
CREATE INDEX idx_campaigns_featured ON campaigns(featured_until)
WHERE featured_until IS NOT NULL AND featured_until > NOW();

-- Create index for pricing tier
CREATE INDEX idx_campaigns_pricing_tier ON campaigns(pricing_tier);

-- Add comment explaining the pricing tiers
COMMENT ON COLUMN campaigns.pricing_tier IS 'Pricing tier: starter (CHF 250), pro (CHF 500), enterprise (CHF 2000), enterprise_audit (CHF 15000)';
COMMENT ON COLUMN campaigns.transaction_fee_percentage IS 'Transaction fee percentage charged on successful fundraise (1.0-2.5%)';
COMMENT ON COLUMN campaigns.featured_until IS 'Date until which campaign is featured on homepage (based on pricing tier)';
COMMENT ON COLUMN campaigns.launch_fee_paid_amount IS 'Amount paid in USDC for campaign launch fee';
COMMENT ON COLUMN campaigns.launch_fee_tx_hash IS 'Transaction hash of launch fee payment';
