-- ================================================
-- FLEXIBLE ESCROW - SAFE INSTALLATION
-- ================================================
-- This creates NEW tables without touching existing escrow_payments!
-- Both EscrowV1 and FlexibleEscrow can run in parallel.

-- ================================================
-- TABLE: flexible_escrow_payments (NEW!)
-- ================================================
-- Does NOT conflict with existing escrow_payments table

CREATE TABLE IF NOT EXISTS flexible_escrow_payments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Blockchain data
  escrow_id INTEGER NOT NULL UNIQUE,
  contract_address TEXT NOT NULL,
  transaction_hash TEXT,

  -- Booking reference (optional)
  booking_id TEXT UNIQUE,

  -- Participants
  buyer_address TEXT NOT NULL,
  seller_address TEXT NOT NULL,

  -- Payment details with progressive fees
  amount_wei TEXT NOT NULL,
  platform_fee_wei TEXT NOT NULL,
  total_deposit_wei TEXT NOT NULL,
  fee_tier TEXT NOT NULL CHECK (fee_tier IN ('Standard', 'Premium', 'Enterprise')),
  fee_percentage INTEGER NOT NULL,

  -- Contract/Agreement (NEW!)
  contract_cid TEXT NOT NULL,
  contract_title TEXT,
  description TEXT,

  -- Multi-signature (NEW!)
  required_signatures INTEGER NOT NULL DEFAULT 1,
  current_signatures INTEGER NOT NULL DEFAULT 0,
  signers TEXT[] NOT NULL DEFAULT '{}',

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'refunded', 'disputed')),
  emergency_exitable BOOLEAN DEFAULT false,

  -- Optional user link (works with or without Supabase Auth)
  user_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flex_escrow_buyer ON flexible_escrow_payments(buyer_address);
CREATE INDEX IF NOT EXISTS idx_flex_escrow_seller ON flexible_escrow_payments(seller_address);
CREATE INDEX IF NOT EXISTS idx_flex_escrow_status ON flexible_escrow_payments(status);
CREATE INDEX IF NOT EXISTS idx_flex_escrow_created ON flexible_escrow_payments(created_at DESC);

-- ================================================
-- TABLE: escrow_contracts (NEW!)
-- ================================================
-- Stores encrypted IPFS contracts

CREATE TABLE IF NOT EXISTS escrow_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_payment_id UUID NOT NULL REFERENCES flexible_escrow_payments(id) ON DELETE CASCADE,

  contract_type TEXT NOT NULL CHECK (contract_type IN ('uploaded', 'generated', 'template')),
  contract_title TEXT NOT NULL,
  contract_description TEXT,

  -- IPFS storage (encrypted)
  ipfs_cid TEXT NOT NULL,
  ipfs_gateway_url TEXT,
  file_size_bytes INTEGER,
  file_type TEXT,
  original_filename TEXT,

  -- Encryption
  encryption_algorithm TEXT DEFAULT 'AES-256-GCM',
  encryption_key_buyer TEXT NOT NULL,
  encryption_key_seller TEXT NOT NULL,

  metadata JSONB,

  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,

  CONSTRAINT unique_flex_escrow_contract UNIQUE (escrow_payment_id)
);

CREATE INDEX IF NOT EXISTS idx_escrow_contracts_payment ON escrow_contracts(escrow_payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_contracts_cid ON escrow_contracts(ipfs_cid);

-- ================================================
-- TABLE: escrow_signatures (NEW!)
-- ================================================
-- Multi-signature tracking

CREATE TABLE IF NOT EXISTS escrow_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_payment_id UUID NOT NULL REFERENCES flexible_escrow_payments(id) ON DELETE CASCADE,

  signer_address TEXT NOT NULL,
  signer_role TEXT CHECK (signer_role IN ('buyer', 'seller', 'authorized')),

  signature_hash TEXT NOT NULL,
  message_signed TEXT NOT NULL,
  signature_type TEXT DEFAULT 'eth_sign',

  status TEXT NOT NULL DEFAULT 'signed' CHECK (status IN ('pending', 'signed', 'revoked')),

  metadata JSONB,

  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,

  CONSTRAINT unique_flex_escrow_signer UNIQUE (escrow_payment_id, signer_address)
);

CREATE INDEX IF NOT EXISTS idx_escrow_sigs_payment ON escrow_signatures(escrow_payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_sigs_signer ON escrow_signatures(signer_address);

-- ================================================
-- TABLE: flexible_escrow_events (NEW!)
-- ================================================
-- Audit trail for flexible escrows

CREATE TABLE IF NOT EXISTS flexible_escrow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_payment_id UUID NOT NULL REFERENCES flexible_escrow_payments(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'signature_added', 'released', 'refunded',
    'disputed', 'resolved', 'emergency_exit',
    'contract_viewed', 'contract_downloaded'
  )),
  transaction_hash TEXT,
  triggered_by TEXT,

  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flex_events_payment ON flexible_escrow_events(escrow_payment_id);
CREATE INDEX IF NOT EXISTS idx_flex_events_type ON flexible_escrow_events(event_type);
CREATE INDEX IF NOT EXISTS idx_flex_events_created ON flexible_escrow_events(created_at DESC);

-- ================================================
-- TRIGGER: Auto-update updated_at
-- ================================================

CREATE OR REPLACE FUNCTION update_flexible_escrow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS flex_escrow_updated_at ON flexible_escrow_payments;
CREATE TRIGGER flex_escrow_updated_at
  BEFORE UPDATE ON flexible_escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_flexible_escrow_timestamp();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE flexible_escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexible_escrow_events ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for all (filtering in app by wallet address)
CREATE POLICY "flex_escrow_select" ON flexible_escrow_payments FOR SELECT USING (true);
CREATE POLICY "contracts_select" ON escrow_contracts FOR SELECT USING (true);
CREATE POLICY "signatures_select" ON escrow_signatures FOR SELECT USING (true);
CREATE POLICY "flex_events_select" ON flexible_escrow_events FOR SELECT USING (true);

-- Allow INSERT for authenticated users
CREATE POLICY "flex_escrow_insert" ON flexible_escrow_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "contracts_insert" ON escrow_contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "signatures_insert" ON escrow_signatures FOR INSERT WITH CHECK (true);
CREATE POLICY "flex_events_insert" ON flexible_escrow_events FOR INSERT WITH CHECK (true);

-- Allow UPDATE (app handles authorization)
CREATE POLICY "flex_escrow_update" ON flexible_escrow_payments FOR UPDATE USING (true);

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Get user's flexible escrow stats
CREATE OR REPLACE FUNCTION get_flex_escrow_stats(wallet_addr TEXT)
RETURNS TABLE (
  total_escrows BIGINT,
  active_escrows BIGINT,
  completed_escrows BIGINT,
  disputed_escrows BIGINT,
  total_volume_wei TEXT,
  total_fees_wei TEXT
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
     OR LOWER(wallet_addr) = ANY(
       SELECT LOWER(unnest(signers))
     );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can sign
CREATE OR REPLACE FUNCTION can_sign_flex_escrow(
  p_escrow_id INTEGER,
  p_wallet_addr TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_payment_id UUID;
  v_signers TEXT[];
  v_signed BOOLEAN;
BEGIN
  SELECT id, signers INTO v_payment_id, v_signers
  FROM flexible_escrow_payments
  WHERE escrow_id = p_escrow_id;

  IF NOT FOUND THEN RETURN false; END IF;

  SELECT EXISTS(
    SELECT 1 FROM escrow_signatures
    WHERE escrow_payment_id = v_payment_id
      AND LOWER(signer_address) = LOWER(p_wallet_addr)
      AND status = 'signed'
  ) INTO v_signed;

  IF v_signed THEN RETURN false; END IF;

  RETURN LOWER(p_wallet_addr) = ANY(
    SELECT LOWER(unnest(v_signers))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Flexible Escrow tables created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables created:';
  RAISE NOTICE '  - flexible_escrow_payments';
  RAISE NOTICE '  - escrow_contracts';
  RAISE NOTICE '  - escrow_signatures';
  RAISE NOTICE '  - flexible_escrow_events';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Your existing escrow_payments table is UNTOUCHED!';
  RAISE NOTICE '✅ Both EscrowV1 and FlexibleEscrow can run in parallel.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy FlexibleEscrow smart contract';
  RAISE NOTICE '2. Update VITE_FLEXIBLE_ESCROW_CONTRACT_ADDRESS in .env';
  RAISE NOTICE '3. Test escrow creation';
END $$;
