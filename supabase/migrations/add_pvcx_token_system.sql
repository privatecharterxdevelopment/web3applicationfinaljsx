-- Migration: Add PVCX Token System Tables
-- Run this in your Supabase SQL Editor

-- 1. Create user_pvcx_balances table
CREATE TABLE IF NOT EXISTS user_pvcx_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC DEFAULT 0 CHECK (balance >= 0),
  earned_from_bookings NUMERIC DEFAULT 0,
  earned_from_co2 NUMERIC DEFAULT 0,
  pending_withdrawal NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  wallet_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for user_pvcx_balances
ALTER TABLE user_pvcx_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PVCX balance"
  ON user_pvcx_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own PVCX balance"
  ON user_pvcx_balances FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Create pvcx_withdrawal_requests table
CREATE TABLE IF NOT EXISTS pvcx_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL, -- 'ethereum' or 'base'
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'sent', 'rejected'
  tx_hash TEXT, -- Transaction hash after admin sends tokens
  admin_note TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for pvcx_withdrawal_requests
ALTER TABLE pvcx_withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own withdrawal requests"
  ON pvcx_withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests"
  ON pvcx_withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Create pvcx_transactions table (tracks all earnings)
CREATE TABLE IF NOT EXISTS pvcx_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES user_requests(id),
  type TEXT NOT NULL, -- 'booking_reward', 'co2_certificate', 'withdrawal', 'admin_bonus', 'ngo_contribution'
  amount NUMERIC NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for pvcx_transactions
ALTER TABLE pvcx_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PVCX transactions"
  ON pvcx_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Add columns to user_requests table
ALTER TABLE user_requests
ADD COLUMN IF NOT EXISTS pvcx_earned NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pvcx_credited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS distance_km NUMERIC,
ADD COLUMN IF NOT EXISTS co2_saved_tons NUMERIC;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_pvcx_balances_user_id ON user_pvcx_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_pvcx_withdrawal_requests_user_id ON pvcx_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pvcx_withdrawal_requests_status ON pvcx_withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_pvcx_transactions_user_id ON pvcx_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pvcx_transactions_booking_id ON pvcx_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_pvcx_transactions_type ON pvcx_transactions(type);

-- 6. Create trigger function for updating PVCX balance
CREATE OR REPLACE FUNCTION update_pvcx_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's PVCX balance based on transaction type
  IF NEW.type IN ('booking_reward', 'co2_certificate', 'admin_bonus') THEN
    -- Add to balance
    UPDATE user_pvcx_balances
    SET
      balance = balance + NEW.amount,
      earned_from_bookings = CASE
        WHEN NEW.type = 'booking_reward' THEN earned_from_bookings + NEW.amount
        ELSE earned_from_bookings
      END,
      earned_from_co2 = CASE
        WHEN NEW.type = 'co2_certificate' THEN earned_from_co2 + NEW.amount
        ELSE earned_from_co2
      END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;

    -- Create balance record if doesn't exist
    INSERT INTO user_pvcx_balances (user_id, balance, earned_from_bookings, earned_from_co2)
    VALUES (
      NEW.user_id,
      NEW.amount,
      CASE WHEN NEW.type = 'booking_reward' THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.type = 'co2_certificate' THEN NEW.amount ELSE 0 END
    )
    ON CONFLICT (user_id) DO NOTHING;

  ELSIF NEW.type = 'withdrawal' THEN
    -- Subtract from balance
    UPDATE user_pvcx_balances
    SET
      balance = balance - NEW.amount,
      total_withdrawn = total_withdrawn + NEW.amount,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to pvcx_transactions
DROP TRIGGER IF EXISTS trigger_update_pvcx_balance ON pvcx_transactions;
CREATE TRIGGER trigger_update_pvcx_balance
  AFTER INSERT ON pvcx_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_pvcx_balance_on_transaction();

-- 7. Create updated_at triggers
CREATE TRIGGER update_user_pvcx_balances_updated_at
  BEFORE UPDATE ON user_pvcx_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pvcx_withdrawal_requests_updated_at
  BEFORE UPDATE ON pvcx_withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Grant permissions
GRANT ALL ON user_pvcx_balances TO authenticated;
GRANT ALL ON pvcx_withdrawal_requests TO authenticated;
GRANT ALL ON pvcx_transactions TO authenticated;

-- 9. Create function to calculate potential earnings
CREATE OR REPLACE FUNCTION calculate_potential_pvcx_earnings(p_user_id UUID)
RETURNS TABLE(
  total_km NUMERIC,
  km_reward NUMERIC,
  co2_tons NUMERIC,
  co2_reward NUMERIC,
  total_potential NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(distance_km), 0) as total_km,
    COALESCE(SUM(distance_km * 1.5), 0) as km_reward,
    COALESCE(SUM(co2_saved_tons), 0) as co2_tons,
    COALESCE(SUM(co2_saved_tons * 2.0), 0) as co2_reward,
    COALESCE(SUM(distance_km * 1.5), 0) + COALESCE(SUM(co2_saved_tons * 2.0), 0) as total_potential
  FROM user_requests
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND pvcx_credited = FALSE;
END;
$$ LANGUAGE plpgsql;
