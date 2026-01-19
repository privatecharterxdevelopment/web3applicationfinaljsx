-- =====================================================
-- MARQETA CARD INTEGRATION - DATABASE SCHEMA
-- PrivateCharterX Mastercard/Visa Card Program
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER CARDS TABLE
-- Stores card information linked to Marqeta
-- =====================================================
CREATE TABLE IF NOT EXISTS user_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Marqeta tokens
  marqeta_user_token VARCHAR(255),           -- Marqeta user token
  marqeta_card_token VARCHAR(255) UNIQUE,    -- Marqeta card token

  -- Card details (stored locally for display)
  last_four VARCHAR(4) NOT NULL,
  card_network VARCHAR(20) DEFAULT 'MASTERCARD',  -- MASTERCARD, VISA
  card_type VARCHAR(20) DEFAULT 'VIRTUAL',        -- VIRTUAL, PHYSICAL
  card_status VARCHAR(20) DEFAULT 'ACTIVE',       -- ACTIVE, SUSPENDED, TERMINATED

  -- Card metadata
  expiration_date DATE,
  card_product_token VARCHAR(255),           -- Marqeta card product
  fulfillment_status VARCHAR(50),            -- For physical cards: ISSUED, SHIPPED, DELIVERED

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_card_status CHECK (card_status IN ('ACTIVE', 'SUSPENDED', 'TERMINATED', 'PENDING_ACTIVATION')),
  CONSTRAINT valid_card_type CHECK (card_type IN ('VIRTUAL', 'PHYSICAL')),
  CONSTRAINT valid_card_network CHECK (card_network IN ('MASTERCARD', 'VISA'))
);

-- Index for fast lookups
CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX idx_user_cards_marqeta_token ON user_cards(marqeta_card_token);
CREATE INDEX idx_user_cards_status ON user_cards(card_status);

-- =====================================================
-- CARD TRANSACTIONS TABLE
-- Synced from Marqeta webhooks
-- =====================================================
CREATE TABLE IF NOT EXISTS card_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Marqeta transaction reference
  marqeta_transaction_token VARCHAR(255) UNIQUE,

  -- Transaction details
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  transaction_type VARCHAR(50) NOT NULL,      -- PURCHASE, REFUND, TOP_UP, WITHDRAWAL, FEE
  status VARCHAR(20) DEFAULT 'PENDING',       -- PENDING, COMPLETED, DECLINED, REVERSED

  -- Merchant information
  merchant_name VARCHAR(255),
  merchant_city VARCHAR(100),
  merchant_country VARCHAR(3),
  merchant_category_code VARCHAR(10),         -- MCC code
  merchant_category VARCHAR(100),             -- Human readable category

  -- Authorization details
  authorization_code VARCHAR(50),
  network_reference_id VARCHAR(100),

  -- Decline reason (if applicable)
  decline_reason VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,

  -- Raw Marqeta payload for debugging
  raw_payload JSONB,

  -- Constraints
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('PURCHASE', 'REFUND', 'TOP_UP', 'WITHDRAWAL', 'FEE', 'ADJUSTMENT')),
  CONSTRAINT valid_transaction_status CHECK (status IN ('PENDING', 'COMPLETED', 'DECLINED', 'REVERSED'))
);

-- Indexes for transactions
CREATE INDEX idx_card_transactions_card_id ON card_transactions(card_id);
CREATE INDEX idx_card_transactions_user_id ON card_transactions(user_id);
CREATE INDEX idx_card_transactions_created_at ON card_transactions(created_at DESC);
CREATE INDEX idx_card_transactions_type ON card_transactions(transaction_type);
CREATE INDEX idx_card_transactions_status ON card_transactions(status);

-- =====================================================
-- CARD TOP-UPS TABLE
-- Track funding sources and top-up history
-- =====================================================
CREATE TABLE IF NOT EXISTS card_topups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Top-up details
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  fee_amount DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2),                   -- Amount after fees

  -- Source information
  source_type VARCHAR(20) NOT NULL,           -- BANK, CRYPTO, CARD
  source_details JSONB,                        -- Bank account info, crypto tx hash, etc.

  -- For crypto top-ups
  crypto_currency VARCHAR(10),                 -- USDC, USDT, ETH, BTC
  crypto_amount DECIMAL(18,8),
  crypto_tx_hash VARCHAR(100),
  crypto_network VARCHAR(20),                  -- ethereum, base, polygon

  -- For bank transfers
  bank_reference VARCHAR(100),
  bank_account_last_four VARCHAR(4),

  -- Status
  status VARCHAR(20) DEFAULT 'PENDING',        -- PENDING, PROCESSING, COMPLETED, FAILED
  failure_reason VARCHAR(255),

  -- Marqeta GPA order reference
  marqeta_gpa_order_token VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_topup_source CHECK (source_type IN ('BANK', 'CRYPTO', 'CARD')),
  CONSTRAINT valid_topup_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

-- Indexes for top-ups
CREATE INDEX idx_card_topups_card_id ON card_topups(card_id);
CREATE INDEX idx_card_topups_user_id ON card_topups(user_id);
CREATE INDEX idx_card_topups_status ON card_topups(status);
CREATE INDEX idx_card_topups_created_at ON card_topups(created_at DESC);

-- =====================================================
-- CARD SUBSCRIPTIONS TABLE
-- Track $299/year membership
-- =====================================================
CREATE TABLE IF NOT EXISTS card_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subscription details
  plan_type VARCHAR(50) DEFAULT 'ANNUAL',      -- ANNUAL, MONTHLY (future)
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE',         -- ACTIVE, CANCELLED, EXPIRED, PENDING

  -- Billing
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_subscription_status CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING', 'PAST_DUE'))
);

-- Index for subscriptions
CREATE INDEX idx_card_subscriptions_user_id ON card_subscriptions(user_id);
CREATE INDEX idx_card_subscriptions_status ON card_subscriptions(status);

-- =====================================================
-- CARD SPENDING LIMITS TABLE
-- Configurable spending controls
-- =====================================================
CREATE TABLE IF NOT EXISTS card_spending_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,

  -- Limit configuration
  limit_type VARCHAR(50) NOT NULL,             -- DAILY, WEEKLY, MONTHLY, PER_TRANSACTION
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Current usage (reset based on limit_type)
  current_usage DECIMAL(12,2) DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_limit_type CHECK (limit_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'PER_TRANSACTION'))
);

-- Index for spending limits
CREATE INDEX idx_card_spending_limits_card_id ON card_spending_limits(card_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_spending_limits ENABLE ROW LEVEL SECURITY;

-- Policies for user_cards
CREATE POLICY "Users can view own cards"
  ON user_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON user_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON user_cards FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for card_transactions
CREATE POLICY "Users can view own transactions"
  ON card_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (from webhooks)
CREATE POLICY "Service role can insert transactions"
  ON card_transactions FOR INSERT
  WITH CHECK (true);

-- Policies for card_topups
CREATE POLICY "Users can view own topups"
  ON card_topups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own topups"
  ON card_topups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for card_subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON card_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Policies for card_spending_limits
CREATE POLICY "Users can view own limits"
  ON card_spending_limits FOR SELECT
  USING (
    card_id IN (SELECT id FROM user_cards WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own limits"
  ON card_spending_limits FOR UPDATE
  USING (
    card_id IN (SELECT id FROM user_cards WHERE user_id = auth.uid())
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_cards_updated_at
  BEFORE UPDATE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_spending_limits_updated_at
  BEFORE UPDATE ON card_spending_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate net amount for topups
CREATE OR REPLACE FUNCTION calculate_topup_net_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.net_amount = NEW.amount - COALESCE(NEW.fee_amount, 0);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_topup_net
  BEFORE INSERT OR UPDATE ON card_topups
  FOR EACH ROW
  EXECUTE FUNCTION calculate_topup_net_amount();

-- =====================================================
-- SAMPLE DATA (for development/testing)
-- Comment out in production
-- =====================================================

-- Insert sample spending limits for new cards
CREATE OR REPLACE FUNCTION create_default_spending_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Daily limit
  INSERT INTO card_spending_limits (card_id, limit_type, amount)
  VALUES (NEW.id, 'DAILY', 10000);

  -- Monthly limit
  INSERT INTO card_spending_limits (card_id, limit_type, amount)
  VALUES (NEW.id, 'MONTHLY', 50000);

  -- Per transaction limit
  INSERT INTO card_spending_limits (card_id, limit_type, amount)
  VALUES (NEW.id, 'PER_TRANSACTION', 25000);

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_default_limits_on_card_create
  AFTER INSERT ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION create_default_spending_limits();

-- =====================================================
-- VIEWS
-- =====================================================

-- View for card balance (aggregated from transactions)
CREATE OR REPLACE VIEW card_balances AS
SELECT
  c.id AS card_id,
  c.user_id,
  c.last_four,
  c.card_status,
  COALESCE(SUM(
    CASE
      WHEN t.transaction_type IN ('TOP_UP') AND t.status = 'COMPLETED' THEN t.amount
      WHEN t.transaction_type IN ('PURCHASE', 'WITHDRAWAL', 'FEE') AND t.status = 'COMPLETED' THEN -t.amount
      WHEN t.transaction_type = 'REFUND' AND t.status = 'COMPLETED' THEN t.amount
      ELSE 0
    END
  ), 0) AS balance
FROM user_cards c
LEFT JOIN card_transactions t ON t.card_id = c.id
GROUP BY c.id, c.user_id, c.last_four, c.card_status;

-- View for monthly spending summary
CREATE OR REPLACE VIEW monthly_spending_summary AS
SELECT
  c.user_id,
  c.id AS card_id,
  DATE_TRUNC('month', t.created_at) AS month,
  SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) AS total_spending,
  COUNT(*) AS transaction_count,
  ARRAY_AGG(DISTINCT t.merchant_category) AS categories
FROM user_cards c
JOIN card_transactions t ON t.card_id = c.id
WHERE t.status = 'COMPLETED'
GROUP BY c.user_id, c.id, DATE_TRUNC('month', t.created_at)
ORDER BY month DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE user_cards IS 'Stores Marqeta card information for PrivateCharterX cardholders';
COMMENT ON TABLE card_transactions IS 'Transaction history synced from Marqeta webhooks';
COMMENT ON TABLE card_topups IS 'Card funding/top-up history from bank, card, or crypto';
COMMENT ON TABLE card_subscriptions IS 'Annual $299 card membership subscriptions';
COMMENT ON TABLE card_spending_limits IS 'Configurable spending limits per card';
