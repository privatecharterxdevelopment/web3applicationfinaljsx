-- Add payment package fields to tokenization_drafts table for UTO (Utility Token Offerings)
-- This tracks which NFT Membership Package the user selected

ALTER TABLE tokenization_drafts
ADD COLUMN IF NOT EXISTS membership_package TEXT CHECK (membership_package IN ('starter', 'professional', 'enterprise')),
ADD COLUMN IF NOT EXISTS package_setup_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS package_monthly_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS package_custom_design BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS package_audited_contract BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('stripe', 'crypto')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'manual_review')),
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT, -- Stripe payment intent ID
ADD COLUMN IF NOT EXISTS coingate_order_id TEXT; -- CoinGate order ID

-- Add comments
COMMENT ON COLUMN tokenization_drafts.membership_package IS 'NFT Membership Package tier: starter, professional, enterprise';
COMMENT ON COLUMN tokenization_drafts.package_setup_fee IS 'One-time setup fee for the package in CHF';
COMMENT ON COLUMN tokenization_drafts.package_monthly_fee IS 'Monthly recurring fee in CHF';
COMMENT ON COLUMN tokenization_drafts.package_custom_design IS 'Custom NFT Design add-on (+CHF 199)';
COMMENT ON COLUMN tokenization_drafts.package_audited_contract IS 'Audited Smart Contract add-on (+CHF 15000) - requires manual review';
COMMENT ON COLUMN tokenization_drafts.payment_method IS 'Payment method chosen: stripe or crypto';
COMMENT ON COLUMN tokenization_drafts.payment_status IS 'Payment status: pending, completed, failed, manual_review';
COMMENT ON COLUMN tokenization_drafts.payment_intent_id IS 'Stripe payment intent ID for fiat payments';
COMMENT ON COLUMN tokenization_drafts.coingate_order_id IS 'CoinGate order ID for crypto payments';

-- Create index for payment tracking
CREATE INDEX IF NOT EXISTS idx_tokenization_drafts_payment_status ON tokenization_drafts(payment_status);
CREATE INDEX IF NOT EXISTS idx_tokenization_drafts_membership_package ON tokenization_drafts(membership_package);
