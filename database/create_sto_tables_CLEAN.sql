-- =====================================================
-- STO MARKETPLACE DATABASE SCHEMA - CLEAN VERSION
-- Luxury Asset Tokenization & Trading Platform
-- =====================================================

-- ===== TABLE 1: STO INVESTMENTS =====
-- Primary marketplace: tracks share purchases
CREATE TABLE IF NOT EXISTS sto_investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES user_requests(id) ON DELETE CASCADE,
  shares_purchased INTEGER NOT NULL,
  investment_amount DECIMAL(12, 2) NOT NULL,
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_shares CHECK (shares_purchased > 0),
  CONSTRAINT positive_amount CHECK (investment_amount > 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_sto_investments_user_id ON sto_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_sto_investments_asset_id ON sto_investments(asset_id);
CREATE INDEX IF NOT EXISTS idx_sto_investments_wallet ON sto_investments(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sto_investments_status ON sto_investments(status);

COMMENT ON TABLE sto_investments IS 'Primary marketplace investments in tokenized luxury assets with KYC enforcement';

-- ===== TABLE 2: STO LISTINGS =====
-- Secondary P2P marketplace for share trading
CREATE TABLE IF NOT EXISTS sto_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES user_requests(id) ON DELETE CASCADE,
  shares_for_sale INTEGER NOT NULL,
  price_per_share DECIMAL(12, 2) NOT NULL,
  total_value DECIMAL(12, 2) GENERATED ALWAYS AS (shares_for_sale * price_per_share) STORED,
  status TEXT NOT NULL DEFAULT 'active',
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT positive_shares_sale CHECK (shares_for_sale > 0),
  CONSTRAINT positive_price CHECK (price_per_share > 0),
  CONSTRAINT valid_listing_status CHECK (status IN ('active', 'sold', 'cancelled', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_sto_listings_seller ON sto_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_sto_listings_asset ON sto_listings(asset_id);
CREATE INDEX IF NOT EXISTS idx_sto_listings_status ON sto_listings(status);
CREATE INDEX IF NOT EXISTS idx_sto_listings_active ON sto_listings(status) WHERE status = 'active';

COMMENT ON TABLE sto_listings IS 'Secondary P2P marketplace listings for share trading';

-- ===== TABLE 3: STO TRADES =====
-- Complete trade history for analytics
CREATE TABLE IF NOT EXISTS sto_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES sto_listings(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES user_requests(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shares_traded INTEGER NOT NULL,
  price_per_share DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  platform_fee DECIMAL(12, 2) DEFAULT 0,
  seller_amount DECIMAL(12, 2) NOT NULL,
  transaction_hash TEXT,
  trade_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_shares_trade CHECK (shares_traded > 0),
  CONSTRAINT positive_total CHECK (total_amount > 0),
  CONSTRAINT valid_trade_type CHECK (trade_type IN ('primary_sale', 'p2p_trade', 'transfer')),
  CONSTRAINT valid_trade_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_sto_trades_asset ON sto_trades(asset_id);
CREATE INDEX IF NOT EXISTS idx_sto_trades_seller ON sto_trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_sto_trades_buyer ON sto_trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sto_trades_date ON sto_trades(created_at);

COMMENT ON TABLE sto_trades IS 'Complete trade history for all STO transactions';

-- ===== UPDATE user_requests TABLE =====
-- Add STO status values (if user_requests table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_requests') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_requests_status_check') THEN
      ALTER TABLE user_requests DROP CONSTRAINT user_requests_status_check;
    END IF;

    ALTER TABLE user_requests ADD CONSTRAINT user_requests_status_check
    CHECK (status IN (
      'pending', 'in_progress', 'completed', 'rejected', 'cancelled',
      'approved_for_sto', 'live_on_marketplace', 'fully_funded', 'closed'
    ));
  END IF;
END $$;

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE sto_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sto_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sto_trades ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES: sto_investments =====
DROP POLICY IF EXISTS "Users can view their own investments" ON sto_investments;
CREATE POLICY "Users can view their own investments"
  ON sto_investments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Verified users can create investments" ON sto_investments;
CREATE POLICY "Verified users can create investments"
  ON sto_investments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND kyc_status = 'verified'
    )
  );

-- ===== RLS POLICIES: sto_listings =====
DROP POLICY IF EXISTS "Anyone can view active listings" ON sto_listings;
CREATE POLICY "Anyone can view active listings"
  ON sto_listings FOR SELECT
  TO authenticated
  USING (status = 'active' OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Verified users can create listings" ON sto_listings;
CREATE POLICY "Verified users can create listings"
  ON sto_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND kyc_status = 'verified'
    )
  );

DROP POLICY IF EXISTS "Users can update their own listings" ON sto_listings;
CREATE POLICY "Users can update their own listings"
  ON sto_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id);

-- ===== RLS POLICIES: sto_trades =====
DROP POLICY IF EXISTS "Users can view their trades" ON sto_trades;
CREATE POLICY "Users can view their trades"
  ON sto_trades FOR SELECT
  TO authenticated
  USING (
    auth.uid() = seller_id OR
    auth.uid() = buyer_id
  );

DROP POLICY IF EXISTS "System can create trades" ON sto_trades;
CREATE POLICY "System can create trades"
  ON sto_trades FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ===== HELPER FUNCTIONS =====

-- Function: Calculate user's total shares for an asset
CREATE OR REPLACE FUNCTION get_user_share_balance(p_user_id UUID, p_asset_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT SUM(shares_purchased)
      FROM sto_investments
      WHERE user_id = p_user_id
        AND asset_id = p_asset_id
        AND status = 'confirmed'
    ),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate total shares sold for an asset
CREATE OR REPLACE FUNCTION get_asset_sold_shares(p_asset_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT SUM(shares_purchased)
      FROM sto_investments
      WHERE asset_id = p_asset_id
        AND status = 'confirmed'
    ),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user is KYC verified
CREATE OR REPLACE FUNCTION is_user_kyc_verified(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_user_id
    AND kyc_status = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== TRIGGERS =====

-- Trigger function: Update timestamp
CREATE OR REPLACE FUNCTION update_sto_investment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sto_investment_updated_at ON sto_investments;
CREATE TRIGGER update_sto_investment_updated_at
  BEFORE UPDATE ON sto_investments
  FOR EACH ROW
  EXECUTE FUNCTION update_sto_investment_timestamp();

-- ===== GRANTS =====
GRANT SELECT, INSERT ON sto_investments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sto_listings TO authenticated;
GRANT SELECT ON sto_trades TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
