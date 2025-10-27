-- ============================================================
-- CREATE MISSING TABLES FOR 100 PVCX BONUS & NOTIFICATIONS
-- ============================================================

-- 1. PVCX Balance Table
CREATE TABLE IF NOT EXISTS pvcx_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(20, 2) DEFAULT 0,
  earned_from_bookings DECIMAL(20, 2) DEFAULT 0,
  earned_from_co2 DECIMAL(20, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_pvcx_balance_user_id ON pvcx_balance(user_id);

-- 2. PVCX Transactions Table
CREATE TABLE IF NOT EXISTS pvcx_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('admin_bonus', 'booking_reward', 'co2_reward', 'referral', 'purchase', 'transfer')),
  amount DECIMAL(20, 2) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pvcx_transactions_user_id ON pvcx_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pvcx_transactions_type ON pvcx_transactions(type);
CREATE INDEX IF NOT EXISTS idx_pvcx_transactions_created_at ON pvcx_transactions(created_at DESC);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'booking', 'payment', 'kyc', 'co2', 'admin', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 4. Update timestamp trigger
CREATE OR REPLACE FUNCTION update_pvcx_balance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_pvcx_balance_updated_at ON pvcx_balance;
CREATE TRIGGER trigger_update_pvcx_balance_updated_at
  BEFORE UPDATE ON pvcx_balance
  FOR EACH ROW
  EXECUTE FUNCTION update_pvcx_balance_updated_at();

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tables created successfully:';
  RAISE NOTICE '   - pvcx_balance';
  RAISE NOTICE '   - pvcx_transactions';
  RAISE NOTICE '   - notifications';
  RAISE NOTICE '';
  RAISE NOTICE '✅ New users will now receive:';
  RAISE NOTICE '   - 100 PVCX welcome bonus';
  RAISE NOTICE '   - Welcome notification';
END $$;
