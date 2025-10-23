-- Create unified transactions table for all wallet signatures, blockchain txs, and Stripe payments
-- This table tracks ALL user activity: wallet signatures, tokenization submissions, payments, etc.

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  transaction_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'platform_action',
  amount DECIMAL(20, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'completed',
  description TEXT,
  signature TEXT,
  tx_hash TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments to explain columns
COMMENT ON TABLE transactions IS 'Unified transaction log for wallet signatures, blockchain transactions, and Stripe payments';
COMMENT ON COLUMN transactions.user_id IS 'Reference to auth.users - null for wallet-only transactions';
COMMENT ON COLUMN transactions.wallet_address IS 'User wallet address (lowercase)';
COMMENT ON COLUMN transactions.transaction_type IS 'Type: wallet_signature, tokenization_submission, stripe_payment, launchpad_join, blog_comment, etc.';
COMMENT ON COLUMN transactions.category IS 'Category: wallet_signature, fiat_payment, crypto_payment, platform_action';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount in specified currency';
COMMENT ON COLUMN transactions.currency IS 'Currency code: USD, ETH, USDC, etc.';
COMMENT ON COLUMN transactions.status IS 'Status: completed, pending, failed, cancelled';
COMMENT ON COLUMN transactions.description IS 'Human-readable description';
COMMENT ON COLUMN transactions.signature IS 'Wallet signature (if applicable)';
COMMENT ON COLUMN transactions.tx_hash IS 'Blockchain transaction hash (if on-chain)';
COMMENT ON COLUMN transactions.metadata IS 'Additional context as JSON';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_address ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_type ON transactions(wallet_address, transaction_type);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions (by user_id or wallet_address)
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (
    auth.uid() = user_id
    OR wallet_address IN (
      SELECT wallet_address
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert their own transactions
CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR wallet_address IN (
      SELECT wallet_address
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Service role can do anything (for backend operations)
CREATE POLICY "Service role has full access"
  ON transactions
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT ON transactions TO authenticated;
GRANT ALL ON transactions TO service_role;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
DROP TRIGGER IF EXISTS trigger_update_transactions_updated_at ON transactions;
CREATE TRIGGER trigger_update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- Create helper function to get user transactions
CREATE OR REPLACE FUNCTION get_user_transactions(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID,
  transaction_type TEXT,
  amount DECIMAL,
  currency TEXT,
  status TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.transaction_type,
    t.amount,
    t.currency,
    t.status,
    t.description,
    t.created_at,
    t.metadata
  FROM transactions t
  WHERE t.user_id = p_user_id
  ORDER BY t.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION get_user_transactions(UUID, INTEGER) TO authenticated;
