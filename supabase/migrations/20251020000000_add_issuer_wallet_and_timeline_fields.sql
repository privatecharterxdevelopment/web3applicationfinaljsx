-- Add issuer_wallet_address column to tokenization_drafts table
-- This stores the wallet address where NFTs/tokens will be minted and issued from

ALTER TABLE tokenization_drafts
ADD COLUMN IF NOT EXISTS issuer_wallet_address TEXT;

-- Add timeline tracking columns
ALTER TABLE tokenization_drafts
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS waitlist_opens_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marketplace_launch_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_launch_days INTEGER;

-- Add comments to explain the columns
COMMENT ON COLUMN tokenization_drafts.issuer_wallet_address IS 'Wallet address where NFTs/tokens will be minted and issued from';
COMMENT ON COLUMN tokenization_drafts.approved_at IS 'Timestamp when admin approved the tokenization';
COMMENT ON COLUMN tokenization_drafts.waitlist_opens_at IS 'Timestamp when waitlist phase opens (24h after approval for UTOs)';
COMMENT ON COLUMN tokenization_drafts.marketplace_launch_at IS 'Timestamp when asset launches on marketplace/goes live';
COMMENT ON COLUMN tokenization_drafts.estimated_launch_days IS 'Estimated days from approval to launch (14 for UTO, 14-30 for STO)';

-- Add index for faster queries by wallet address
CREATE INDEX IF NOT EXISTS idx_tokenization_drafts_issuer_wallet
ON tokenization_drafts(issuer_wallet_address);

-- Add index for timeline queries
CREATE INDEX IF NOT EXISTS idx_tokenization_drafts_status_approved
ON tokenization_drafts(status, approved_at);

CREATE INDEX IF NOT EXISTS idx_tokenization_drafts_launch_date
ON tokenization_drafts(marketplace_launch_at);
