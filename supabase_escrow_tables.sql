-- ================================================
-- ESCROW V1 DATABASE TABLES
-- ================================================
-- Run this in Supabase SQL Editor to create tables for EscrowV1 payments

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS escrow_events CASCADE;
DROP TABLE IF EXISTS escrow_payments CASCADE;

-- ================================================
-- TABLE: escrow_payments
-- ================================================
-- Stores all escrow payments created via EscrowV1 smart contract

CREATE TABLE escrow_payments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Blockchain data
  escrow_id INTEGER NOT NULL UNIQUE, -- From smart contract (incremental ID)
  contract_address TEXT NOT NULL, -- EscrowV1 contract address
  transaction_hash TEXT, -- Creation transaction hash

  -- Booking reference
  booking_id TEXT NOT NULL UNIQUE, -- Links to bookings table

  -- Participants
  buyer_address TEXT NOT NULL, -- Buyer wallet address (lowercase)
  seller_address TEXT NOT NULL, -- Seller wallet address (lowercase)

  -- Payment details
  amount_wei TEXT NOT NULL, -- Total amount in wei (as string for bigint)
  fee_percentage INTEGER NOT NULL CHECK (fee_percentage IN (150, 250)), -- 150 (1.5%) or 250 (2.5%)

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'refunded', 'disputed')),

  -- User reference (optional)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT unique_escrow_id UNIQUE (escrow_id),
  CONSTRAINT unique_booking_id UNIQUE (booking_id)
);

-- Create indexes for fast lookups
CREATE INDEX idx_escrow_payments_buyer ON escrow_payments(buyer_address);
CREATE INDEX idx_escrow_payments_seller ON escrow_payments(seller_address);
CREATE INDEX idx_escrow_payments_booking ON escrow_payments(booking_id);
CREATE INDEX idx_escrow_payments_status ON escrow_payments(status);
CREATE INDEX idx_escrow_payments_created_at ON escrow_payments(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE escrow_payments IS 'Stores all escrow payments created via EscrowV1 smart contract';
COMMENT ON COLUMN escrow_payments.escrow_id IS 'On-chain escrow ID from smart contract (incremental)';
COMMENT ON COLUMN escrow_payments.booking_id IS 'Off-chain booking reference linking to bookings table';
COMMENT ON COLUMN escrow_payments.amount_wei IS 'Total amount locked in escrow (stored as string for bigint compatibility)';
COMMENT ON COLUMN escrow_payments.fee_percentage IS 'Fee tier: 150 (1.5% Classic) or 250 (2.5% Managed with Disputes)';

-- ================================================
-- TABLE: escrow_events
-- ================================================
-- Tracks all events/actions performed on escrows (audit trail)

CREATE TABLE escrow_events (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to escrow_payments
  escrow_payment_id UUID NOT NULL REFERENCES escrow_payments(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'released', 'refunded', 'disputed', 'resolved', 'emergency_exit')),
  transaction_hash TEXT, -- Blockchain transaction hash
  triggered_by TEXT, -- Wallet address that triggered the event

  -- Additional data
  metadata JSONB, -- Store additional event data (e.g., dispute reason)

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_escrow_events_payment_id ON escrow_events(escrow_payment_id);
CREATE INDEX idx_escrow_events_type ON escrow_events(event_type);
CREATE INDEX idx_escrow_events_created_at ON escrow_events(created_at DESC);

-- Add comments
COMMENT ON TABLE escrow_events IS 'Audit trail for all escrow payment events and actions';
COMMENT ON COLUMN escrow_events.event_type IS 'Type of event: created, released, refunded, disputed, resolved, emergency_exit';
COMMENT ON COLUMN escrow_events.metadata IS 'Additional event data stored as JSON (e.g., dispute reason)';

-- ================================================
-- TRIGGER: Update updated_at timestamp
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_escrow_payments_updated_at
  BEFORE UPDATE ON escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on both tables
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view escrows where they are buyer or seller
-- NOTE: Since we're using wallet-based auth, we allow SELECT but filter in application layer
CREATE POLICY "Users can view their own escrows"
  ON escrow_payments
  FOR SELECT
  USING (true); -- Filtering done in application by wallet address

-- Policy: Only authenticated users can insert escrows
CREATE POLICY "Authenticated users can create escrows"
  ON escrow_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update their own escrows
CREATE POLICY "Users can update their own escrows"
  ON escrow_payments
  FOR UPDATE
  USING (
    buyer_address = LOWER(auth.jwt()->>'wallet_address') OR
    seller_address = LOWER(auth.jwt()->>'wallet_address')
  );

-- Policy: Users can view events for their escrows
CREATE POLICY "Users can view events for their escrows"
  ON escrow_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM escrow_payments
      WHERE escrow_payments.id = escrow_events.escrow_payment_id
      AND (
        escrow_payments.buyer_address = LOWER(auth.jwt()->>'wallet_address') OR
        escrow_payments.seller_address = LOWER(auth.jwt()->>'wallet_address')
      )
    )
  );

-- Policy: Anyone can insert events (triggered by smart contract actions)
CREATE POLICY "Anyone can create events"
  ON escrow_events
  FOR INSERT
  WITH CHECK (true);

-- ================================================
-- SAMPLE DATA (for testing - remove in production)
-- ================================================

-- Insert a test escrow payment (uncomment to use)
/*
INSERT INTO escrow_payments (
  escrow_id,
  contract_address,
  transaction_hash,
  booking_id,
  buyer_address,
  seller_address,
  amount_wei,
  fee_percentage,
  status,
  user_id
) VALUES (
  1,
  '0xYourEscrowContractAddressHere',
  '0xTransactionHashHere',
  'TEST-BOOKING-001',
  '0xbuyeraddresshere',
  '0xselleraddresshere',
  '1000000000000000000', -- 1 ETH in wei
  150, -- 1.5% fee
  'active',
  NULL
);

-- Insert corresponding event
INSERT INTO escrow_events (
  escrow_payment_id,
  event_type,
  transaction_hash,
  triggered_by,
  metadata
) VALUES (
  (SELECT id FROM escrow_payments WHERE escrow_id = 1),
  'created',
  '0xTransactionHashHere',
  '0xbuyeraddresshere',
  '{"note": "Test escrow creation"}'::jsonb
);
*/

-- ================================================
-- VIEWS (optional - for easier querying)
-- ================================================

-- View: Escrow payments with event counts
CREATE OR REPLACE VIEW escrow_payments_with_stats AS
SELECT
  ep.*,
  COUNT(ee.id) FILTER (WHERE ee.event_type = 'disputed') AS dispute_count,
  COUNT(ee.id) AS total_events,
  MAX(ee.created_at) AS last_event_at
FROM escrow_payments ep
LEFT JOIN escrow_events ee ON ee.escrow_payment_id = ep.id
GROUP BY ep.id;

-- Grant access to view
GRANT SELECT ON escrow_payments_with_stats TO authenticated, anon;

-- ================================================
-- FUNCTIONS (helper functions for common queries)
-- ================================================

-- Function: Get user's escrow stats
CREATE OR REPLACE FUNCTION get_user_escrow_stats(wallet_addr TEXT)
RETURNS TABLE (
  total_escrows BIGINT,
  active_escrows BIGINT,
  completed_escrows BIGINT,
  disputed_escrows BIGINT,
  total_volume_wei TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'released')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'disputed')::BIGINT,
    SUM(amount_wei::NUMERIC)::TEXT
  FROM escrow_payments
  WHERE LOWER(buyer_address) = LOWER(wallet_addr)
     OR LOWER(seller_address) = LOWER(wallet_addr);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_escrow_stats TO authenticated, anon;

-- ================================================
-- COMPLETED!
-- ================================================

-- Verify tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('escrow_payments', 'escrow_events')
ORDER BY table_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Escrow tables created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy EscrowV1 smart contract to Base Sepolia';
  RAISE NOTICE '2. Update VITE_ESCROW_CONTRACT_ADDRESS in .env';
  RAISE NOTICE '3. Test escrow creation in the app';
  RAISE NOTICE '4. Check escrow_payments table for new entries';
END $$;
