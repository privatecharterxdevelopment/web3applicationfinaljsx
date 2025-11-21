-- Add pricing tier columns to campaigns table (safe version with IF NOT EXISTS checks)

-- Add pricing_tier column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='pricing_tier') THEN
    ALTER TABLE campaigns
    ADD COLUMN pricing_tier TEXT CHECK (pricing_tier IN ('starter', 'pro', 'enterprise', 'enterprise_audit'));
  END IF;
END $$;

-- Add launch fee tracking columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='launch_fee_paid_amount') THEN
    ALTER TABLE campaigns
    ADD COLUMN launch_fee_paid_amount DECIMAL(10,2);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='launch_fee_tx_hash') THEN
    ALTER TABLE campaigns
    ADD COLUMN launch_fee_tx_hash TEXT;
  END IF;
END $$;

-- Add transaction fee percentage
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='transaction_fee_percentage') THEN
    ALTER TABLE campaigns
    ADD COLUMN transaction_fee_percentage DECIMAL(4,2);
  END IF;
END $$;

-- Add featured until date
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='featured_until') THEN
    ALTER TABLE campaigns
    ADD COLUMN featured_until TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add published at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='campaigns' AND column_name='published_at') THEN
    ALTER TABLE campaigns
    ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Update status constraint to include 'pending_payment'
ALTER TABLE campaigns
DROP CONSTRAINT IF EXISTS campaigns_status_check;

ALTER TABLE campaigns
ADD CONSTRAINT campaigns_status_check
CHECK (status IN ('draft', 'pending_payment', 'active', 'funded', 'failed', 'completed', 'cancelled'));

-- Create indexes (DROP first to avoid errors)
DROP INDEX IF EXISTS idx_campaigns_featured;
CREATE INDEX idx_campaigns_featured ON campaigns(featured_until)
WHERE featured_until IS NOT NULL AND featured_until > NOW();

DROP INDEX IF EXISTS idx_campaigns_pricing_tier;
CREATE INDEX idx_campaigns_pricing_tier ON campaigns(pricing_tier);

-- Add comments
COMMENT ON COLUMN campaigns.pricing_tier IS 'Pricing tier: starter (CHF 250), pro (CHF 500), enterprise (CHF 2000), enterprise_audit (CHF 15000)';
COMMENT ON COLUMN campaigns.transaction_fee_percentage IS 'Transaction fee percentage charged on successful fundraise (1.0-2.5%)';
COMMENT ON COLUMN campaigns.featured_until IS 'Date until which campaign is featured on homepage (based on pricing tier)';
COMMENT ON COLUMN campaigns.launch_fee_paid_amount IS 'Amount paid in USDC for campaign launch fee';
COMMENT ON COLUMN campaigns.launch_fee_tx_hash IS 'Transaction hash of launch fee payment';
