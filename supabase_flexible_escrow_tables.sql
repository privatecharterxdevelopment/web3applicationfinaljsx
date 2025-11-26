-- ================================================
-- FLEXIBLE ESCROW DATABASE TABLES
-- ================================================
-- Run this in Supabase SQL Editor to create tables for FlexibleEscrow
-- with contract upload + multi-signature support

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS escrow_signatures CASCADE;
DROP TABLE IF EXISTS escrow_contracts CASCADE;
DROP TABLE IF EXISTS flexible_escrow_payments CASCADE;
DROP TABLE IF EXISTS flexible_escrow_events CASCADE;

-- ================================================
-- TABLE: flexible_escrow_payments
-- ================================================
-- Stores all flexible escrow payments with progressive fees

CREATE TABLE flexible_escrow_payments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Blockchain data
  escrow_id INTEGER NOT NULL UNIQUE, -- From smart contract (incremental ID)
  contract_address TEXT NOT NULL, -- FlexibleEscrow contract address
  transaction_hash TEXT, -- Creation transaction hash

  -- Booking reference (optional)
  booking_id TEXT UNIQUE, -- Links to bookings table

  -- Participants
  buyer_address TEXT NOT NULL, -- Buyer wallet address (lowercase)
  seller_address TEXT NOT NULL, -- Seller wallet address (lowercase)

  -- Payment details
  amount_wei TEXT NOT NULL, -- Seller amount in wei (as string for bigint)
  platform_fee_wei TEXT NOT NULL, -- Platform fee in wei
  total_deposit_wei TEXT NOT NULL, -- Total deposited (amount + fee)
  fee_tier TEXT NOT NULL CHECK (fee_tier IN ('Standard', 'Premium', 'Enterprise')),
  fee_percentage INTEGER NOT NULL, -- 200 (2.0%), 150 (1.5%), or 0 (custom)

  -- Contract/Agreement
  contract_cid TEXT NOT NULL, -- IPFS CID (encrypted)
  contract_title TEXT,
  description TEXT,

  -- Multi-signature
  required_signatures INTEGER NOT NULL DEFAULT 1,
  current_signatures INTEGER NOT NULL DEFAULT 0,
  signers TEXT[] NOT NULL DEFAULT '{}', -- Array of signer addresses

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'refunded', 'disputed')),
  emergency_exitable BOOLEAN DEFAULT false,

  -- User reference (optional)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT unique_flexible_escrow_id UNIQUE (escrow_id),
  CONSTRAINT unique_flexible_booking_id UNIQUE (booking_id)
);

-- Create indexes for fast lookups
CREATE INDEX idx_flexible_escrow_payments_buyer ON flexible_escrow_payments(buyer_address);
CREATE INDEX idx_flexible_escrow_payments_seller ON flexible_escrow_payments(seller_address);
CREATE INDEX idx_flexible_escrow_payments_booking ON flexible_escrow_payments(booking_id);
CREATE INDEX idx_flexible_escrow_payments_status ON flexible_escrow_payments(status);
CREATE INDEX idx_flexible_escrow_payments_created_at ON flexible_escrow_payments(created_at DESC);
CREATE INDEX idx_flexible_escrow_payments_tier ON flexible_escrow_payments(fee_tier);

-- Add comments for documentation
COMMENT ON TABLE flexible_escrow_payments IS 'Stores all flexible escrow payments with progressive fees and multi-sig';
COMMENT ON COLUMN flexible_escrow_payments.escrow_id IS 'On-chain escrow ID from FlexibleEscrow contract (incremental)';
COMMENT ON COLUMN flexible_escrow_payments.amount_wei IS 'Seller amount (excluding fee) stored as string for bigint';
COMMENT ON COLUMN flexible_escrow_payments.platform_fee_wei IS 'Platform fee calculated on-chain';
COMMENT ON COLUMN flexible_escrow_payments.fee_tier IS 'Fee tier: Standard (2.0%), Premium (1.5%), or Enterprise (Custom)';
COMMENT ON COLUMN flexible_escrow_payments.contract_cid IS 'IPFS CID of uploaded contract (AES encrypted)';
COMMENT ON COLUMN flexible_escrow_payments.signers IS 'Array of wallet addresses authorized to sign release';

-- ================================================
-- TABLE: escrow_contracts
-- ================================================
-- Stores contract/agreement details for escrows

CREATE TABLE escrow_contracts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to escrow payment
  escrow_payment_id UUID NOT NULL REFERENCES flexible_escrow_payments(id) ON DELETE CASCADE,

  -- Contract details
  contract_type TEXT NOT NULL CHECK (contract_type IN ('uploaded', 'generated', 'template')),
  contract_title TEXT NOT NULL,
  contract_description TEXT,

  -- IPFS storage (encrypted)
  ipfs_cid TEXT NOT NULL, -- IPFS CID for contract file
  ipfs_gateway_url TEXT, -- Optional gateway URL for easier access
  file_size_bytes INTEGER, -- Original file size
  file_type TEXT, -- MIME type (e.g., 'application/pdf')
  original_filename TEXT, -- Original uploaded filename

  -- Encryption details
  encryption_algorithm TEXT DEFAULT 'AES-256-GCM',
  encryption_key_buyer TEXT NOT NULL, -- AES key encrypted for buyer's wallet
  encryption_key_seller TEXT NOT NULL, -- AES key encrypted for seller's wallet

  -- Metadata
  metadata JSONB, -- Additional metadata (tags, custom fields, etc.)

  -- Timestamps
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,

  CONSTRAINT unique_escrow_contract UNIQUE (escrow_payment_id)
);

-- Create indexes
CREATE INDEX idx_escrow_contracts_payment_id ON escrow_contracts(escrow_payment_id);
CREATE INDEX idx_escrow_contracts_cid ON escrow_contracts(ipfs_cid);
CREATE INDEX idx_escrow_contracts_uploaded_at ON escrow_contracts(uploaded_at DESC);

-- Add comments
COMMENT ON TABLE escrow_contracts IS 'Stores contract/agreement files uploaded to IPFS (encrypted)';
COMMENT ON COLUMN escrow_contracts.ipfs_cid IS 'IPFS content identifier (CID) for encrypted contract file';
COMMENT ON COLUMN escrow_contracts.encryption_key_buyer IS 'AES encryption key encrypted with buyer wallet public key';
COMMENT ON COLUMN escrow_contracts.encryption_key_seller IS 'AES encryption key encrypted with seller wallet public key';

-- ================================================
-- TABLE: escrow_signatures
-- ================================================
-- Tracks multi-signature collection for escrow releases

CREATE TABLE escrow_signatures (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to escrow payment
  escrow_payment_id UUID NOT NULL REFERENCES flexible_escrow_payments(id) ON DELETE CASCADE,

  -- Signer details
  signer_address TEXT NOT NULL, -- Wallet address (lowercase)
  signer_role TEXT CHECK (signer_role IN ('buyer', 'seller', 'authorized')),

  -- Signature data
  signature_hash TEXT NOT NULL, -- Wallet signature (hex)
  message_signed TEXT NOT NULL, -- Message that was signed
  signature_type TEXT DEFAULT 'eth_sign', -- Type of signature

  -- Status
  status TEXT NOT NULL DEFAULT 'signed' CHECK (status IN ('pending', 'signed', 'revoked')),

  -- Metadata
  metadata JSONB, -- Additional signature data

  -- Timestamps
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,

  CONSTRAINT unique_escrow_signer UNIQUE (escrow_payment_id, signer_address)
);

-- Create indexes
CREATE INDEX idx_escrow_signatures_payment_id ON escrow_signatures(escrow_payment_id);
CREATE INDEX idx_escrow_signatures_signer ON escrow_signatures(signer_address);
CREATE INDEX idx_escrow_signatures_status ON escrow_signatures(status);
CREATE INDEX idx_escrow_signatures_signed_at ON escrow_signatures(signed_at DESC);

-- Add comments
COMMENT ON TABLE escrow_signatures IS 'Tracks digital signatures for multi-sig escrow releases';
COMMENT ON COLUMN escrow_signatures.signature_hash IS 'Wallet signature in hexadecimal format';
COMMENT ON COLUMN escrow_signatures.message_signed IS 'Original message that was signed by wallet';

-- ================================================
-- TABLE: flexible_escrow_events
-- ================================================
-- Audit trail for all escrow actions

CREATE TABLE flexible_escrow_events (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to escrow payment
  escrow_payment_id UUID NOT NULL REFERENCES flexible_escrow_payments(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created',
    'signature_added',
    'released',
    'refunded',
    'disputed',
    'resolved',
    'emergency_exit',
    'contract_viewed',
    'contract_downloaded'
  )),
  transaction_hash TEXT, -- Blockchain transaction hash (if on-chain event)
  triggered_by TEXT, -- Wallet address that triggered the event

  -- Additional data
  metadata JSONB, -- Store additional event data

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_flexible_escrow_events_payment_id ON flexible_escrow_events(escrow_payment_id);
CREATE INDEX idx_flexible_escrow_events_type ON flexible_escrow_events(event_type);
CREATE INDEX idx_flexible_escrow_events_created_at ON flexible_escrow_events(created_at DESC);

-- Add comments
COMMENT ON TABLE flexible_escrow_events IS 'Complete audit trail for all flexible escrow events';
COMMENT ON COLUMN flexible_escrow_events.event_type IS 'Type of event that occurred';

-- ================================================
-- TRIGGER: Update updated_at timestamp
-- ================================================

CREATE OR REPLACE FUNCTION update_flexible_escrow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flexible_escrow_payments_updated_at
  BEFORE UPDATE ON flexible_escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_flexible_escrow_updated_at();

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE flexible_escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexible_escrow_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view escrows where they are buyer, seller, or signer
CREATE POLICY "Users can view their own flexible escrows"
  ON flexible_escrow_payments
  FOR SELECT
  USING (true); -- Filtering done in application by wallet address

-- Policy: Authenticated users can insert escrows
CREATE POLICY "Authenticated users can create flexible escrows"
  ON flexible_escrow_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update their own escrows
CREATE POLICY "Users can update their own flexible escrows"
  ON flexible_escrow_payments
  FOR UPDATE
  USING (true); -- App handles authorization

-- Policy: Users can view contracts for their escrows
CREATE POLICY "Users can view contracts for their escrows"
  ON escrow_contracts
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert contracts (with escrow creation)
CREATE POLICY "Anyone can create contracts"
  ON escrow_contracts
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view signatures for their escrows
CREATE POLICY "Users can view signatures"
  ON escrow_signatures
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert signatures
CREATE POLICY "Anyone can add signatures"
  ON escrow_signatures
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view events for their escrows
CREATE POLICY "Users can view events"
  ON flexible_escrow_events
  FOR SELECT
  USING (true);

-- Policy: Anyone can create events
CREATE POLICY "Anyone can create events"
  ON flexible_escrow_events
  FOR INSERT
  WITH CHECK (true);

-- ================================================
-- VIEWS (for easier querying)
-- ================================================

-- View: Escrow payments with signature counts
CREATE OR REPLACE VIEW flexible_escrow_payments_with_stats AS
SELECT
  ep.*,
  COUNT(es.id) FILTER (WHERE es.status = 'signed') AS signature_count,
  COUNT(ee.id) AS total_events,
  MAX(ee.created_at) AS last_event_at,
  ec.ipfs_cid AS contract_cid,
  ec.contract_title,
  ec.file_type AS contract_file_type
FROM flexible_escrow_payments ep
LEFT JOIN escrow_signatures es ON es.escrow_payment_id = ep.id
LEFT JOIN flexible_escrow_events ee ON ee.escrow_payment_id = ep.id
LEFT JOIN escrow_contracts ec ON ec.escrow_payment_id = ep.id
GROUP BY ep.id, ec.ipfs_cid, ec.contract_title, ec.file_type;

-- Grant access to view
GRANT SELECT ON flexible_escrow_payments_with_stats TO authenticated, anon;

-- ================================================
-- FUNCTIONS (helper functions)
-- ================================================

-- Function: Get user's escrow stats
CREATE OR REPLACE FUNCTION get_user_flexible_escrow_stats(wallet_addr TEXT)
RETURNS TABLE (
  total_escrows BIGINT,
  active_escrows BIGINT,
  completed_escrows BIGINT,
  disputed_escrows BIGINT,
  total_volume_wei TEXT,
  total_fees_paid_wei TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'released')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'disputed')::BIGINT,
    SUM(total_deposit_wei::NUMERIC)::TEXT,
    SUM(platform_fee_wei::NUMERIC)::TEXT
  FROM flexible_escrow_payments
  WHERE LOWER(buyer_address) = LOWER(wallet_addr)
     OR LOWER(seller_address) = LOWER(wallet_addr)
     OR LOWER(wallet_addr) = ANY(signers);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_flexible_escrow_stats TO authenticated, anon;

-- Function: Check if user can sign escrow
CREATE OR REPLACE FUNCTION can_user_sign_escrow(
  p_escrow_id INTEGER,
  p_wallet_addr TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_escrow_payment_id UUID;
  v_signers TEXT[];
  v_already_signed BOOLEAN;
BEGIN
  -- Get escrow payment ID and signers
  SELECT id, signers INTO v_escrow_payment_id, v_signers
  FROM flexible_escrow_payments
  WHERE escrow_id = p_escrow_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if already signed
  SELECT EXISTS(
    SELECT 1 FROM escrow_signatures
    WHERE escrow_payment_id = v_escrow_payment_id
      AND LOWER(signer_address) = LOWER(p_wallet_addr)
      AND status = 'signed'
  ) INTO v_already_signed;

  IF v_already_signed THEN
    RETURN false;
  END IF;

  -- Check if wallet is in signers list
  RETURN LOWER(p_wallet_addr) = ANY(
    SELECT LOWER(unnest(v_signers))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_user_sign_escrow TO authenticated, anon;

-- ================================================
-- COMPLETED!
-- ================================================

-- Verify tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'flexible_escrow_payments',
    'escrow_contracts',
    'escrow_signatures',
    'flexible_escrow_events'
  )
ORDER BY table_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Flexible Escrow tables created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '- flexible_escrow_payments (main escrow data)';
  RAISE NOTICE '- escrow_contracts (IPFS contract storage)';
  RAISE NOTICE '- escrow_signatures (multi-sig tracking)';
  RAISE NOTICE '- flexible_escrow_events (audit trail)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy FlexibleEscrow smart contract to Base Sepolia';
  RAISE NOTICE '2. Setup Web3.Storage for IPFS';
  RAISE NOTICE '3. Update VITE_FLEXIBLE_ESCROW_CONTRACT_ADDRESS in .env';
  RAISE NOTICE '4. Test escrow creation with contract upload';
END $$;
