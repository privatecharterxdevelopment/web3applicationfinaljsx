-- Flight Bids System
-- Allows users to place bids on flight ops (fixed flights)

-- =====================================================
-- TABLE: flight_bids
-- =====================================================
CREATE TABLE IF NOT EXISTS flight_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES fixed_offers(id) ON DELETE CASCADE,
  bid_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired', 'withdrawn')),
  admin_response TEXT,
  counter_amount NUMERIC(12, 2),
  passengers INTEGER NOT NULL DEFAULT 1,
  departure_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  responded_at TIMESTAMPTZ
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_flight_bids_user_id ON flight_bids(user_id);
CREATE INDEX IF NOT EXISTS idx_flight_bids_flight_id ON flight_bids(flight_id);
CREATE INDEX IF NOT EXISTS idx_flight_bids_status ON flight_bids(status);
CREATE INDEX IF NOT EXISTS idx_flight_bids_created_at ON flight_bids(created_at DESC);

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_flight_bid_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_flight_bid_update ON flight_bids;
CREATE TRIGGER on_flight_bid_update
  BEFORE UPDATE ON flight_bids
  FOR EACH ROW
  EXECUTE FUNCTION update_flight_bid_timestamp();

-- =====================================================
-- TRIGGER: Set responded_at when status changes from pending
-- =====================================================
CREATE OR REPLACE FUNCTION set_bid_response_time()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_bid_response ON flight_bids;
CREATE TRIGGER on_bid_response
  BEFORE UPDATE ON flight_bids
  FOR EACH ROW
  EXECUTE FUNCTION set_bid_response_time();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE flight_bids ENABLE ROW LEVEL SECURITY;

-- Users can view their own bids
CREATE POLICY "Users can view their own bids"
  ON flight_bids FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create bids
CREATE POLICY "Users can create bids"
  ON flight_bids FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending bids (withdraw)
CREATE POLICY "Users can update their own pending bids"
  ON flight_bids FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all bids
CREATE POLICY "Admins can view all bids"
  ON flight_bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update any bid (accept/reject/counter)
CREATE POLICY "Admins can update any bid"
  ON flight_bids FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- ENABLE REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE flight_bids;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON flight_bids TO authenticated;
