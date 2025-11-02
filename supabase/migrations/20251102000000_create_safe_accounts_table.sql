-- Create safe_accounts table for multi-signature escrow wallets
CREATE TABLE IF NOT EXISTS safe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owners TEXT[] NOT NULL,
  threshold INTEGER NOT NULL CHECK (threshold > 0),
  network TEXT NOT NULL DEFAULT 'sepolia',
  safe_address TEXT,
  fee_option TEXT NOT NULL DEFAULT 'classic' CHECK (fee_option IN ('classic', 'disputes')),
  fee_percentage NUMERIC(4,2) NOT NULL DEFAULT 1.5 CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_safe_accounts_user_id ON safe_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_safe_accounts_creator_address ON safe_accounts(creator_address);
CREATE INDEX IF NOT EXISTS idx_safe_accounts_status ON safe_accounts(status);
CREATE INDEX IF NOT EXISTS idx_safe_accounts_network ON safe_accounts(network);

-- Create safe_transactions table for tracking transactions
CREATE TABLE IF NOT EXISTS safe_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  safe_id UUID REFERENCES safe_accounts(id) ON DELETE CASCADE,
  transaction_hash TEXT,
  type TEXT NOT NULL,
  to_address TEXT,
  value NUMERIC,
  data TEXT,
  confirmations INTEGER DEFAULT 0,
  required_confirmations INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'cancelled')),
  fee_collected NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Create index for faster transaction queries
CREATE INDEX IF NOT EXISTS idx_safe_transactions_safe_id ON safe_transactions(safe_id);
CREATE INDEX IF NOT EXISTS idx_safe_transactions_status ON safe_transactions(status);

-- Enable Row Level Security
ALTER TABLE safe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for safe_accounts

-- Users can view safes they created or are owners of
CREATE POLICY "Users can view their own safes"
  ON safe_accounts
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR creator_address = ANY(
      SELECT DISTINCT jsonb_array_elements_text(
        COALESCE(raw_user_meta_data->>'wallet_addresses', '[]')::jsonb
      )
      FROM auth.users
      WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM unnest(owners) AS owner
      WHERE owner = ANY(
        SELECT DISTINCT jsonb_array_elements_text(
          COALESCE(raw_user_meta_data->>'wallet_addresses', '[]')::jsonb
        )
        FROM auth.users
        WHERE id = auth.uid()
      )
    )
  );

-- Users can create safes
CREATE POLICY "Users can create safes"
  ON safe_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update safes they created
CREATE POLICY "Creators can update their safes"
  ON safe_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for safe_transactions

-- Users can view transactions for their safes
CREATE POLICY "Users can view their safe transactions"
  ON safe_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM safe_accounts
      WHERE id = safe_transactions.safe_id
      AND (
        auth.uid() = user_id
        OR creator_address = ANY(
          SELECT DISTINCT jsonb_array_elements_text(
            COALESCE(raw_user_meta_data->>'wallet_addresses', '[]')::jsonb
          )
          FROM auth.users
          WHERE id = auth.uid()
        )
      )
    )
  );

-- Users can create transactions for their safes
CREATE POLICY "Users can create transactions for their safes"
  ON safe_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM safe_accounts
      WHERE id = safe_transactions.safe_id
      AND (
        auth.uid() = user_id
        OR creator_address = ANY(
          SELECT DISTINCT jsonb_array_elements_text(
            COALESCE(raw_user_meta_data->>'wallet_addresses', '[]')::jsonb
          )
          FROM auth.users
          WHERE id = auth.uid()
        )
      )
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_safe_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER safe_accounts_updated_at
  BEFORE UPDATE ON safe_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_safe_accounts_updated_at();

-- Add comments for documentation
COMMENT ON TABLE safe_accounts IS 'Multi-signature escrow wallet accounts with fee structure';
COMMENT ON COLUMN safe_accounts.fee_option IS 'Fee structure: classic (1.5%) or disputes (2.5% with PrivateCharterX mediation)';
COMMENT ON COLUMN safe_accounts.fee_percentage IS 'Transaction fee percentage (1.5% for classic, 2.5% for disputes)';
COMMENT ON COLUMN safe_accounts.terms_accepted_at IS 'Timestamp when user accepted Terms & Conditions';
COMMENT ON TABLE safe_transactions IS 'Transactions for multi-signature safe accounts';
COMMENT ON COLUMN safe_transactions.fee_collected IS 'Fee amount collected by PrivateCharterX treasury';
