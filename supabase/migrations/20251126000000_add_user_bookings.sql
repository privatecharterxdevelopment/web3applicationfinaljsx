-- Migration: Add User Bookings Table for Paid Crypto Transactions
-- Separate from user_requests - these are CONFIRMED PAID bookings
--
-- Fee Structure:
--   - CoinGate Processing Fee: 1% of transaction
--   - PVCX Reward: 1.5% of booking value (credited to user)

-- 1. Create user_bookings table
CREATE TABLE IF NOT EXISTS user_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Booking Type (only crypto-payable services)
  booking_type TEXT NOT NULL CHECK (booking_type IN ('empty_leg', 'adventure_package', 'co2_certificate')),

  -- Reference to original request (optional)
  request_id UUID REFERENCES user_requests(id) ON DELETE SET NULL,

  -- Service Reference (ID of the booked item)
  service_id TEXT NOT NULL, -- Can be empty_leg ID, adventure ID, CO2 certificate ID

  -- Service Details (snapshot at time of booking)
  service_title TEXT NOT NULL,
  service_description TEXT,
  service_image_url TEXT,

  -- Route/Location Info (for empty legs & adventures)
  origin TEXT,
  destination TEXT,
  departure_date TIMESTAMPTZ,
  return_date TIMESTAMPTZ,

  -- Booking Details
  passengers INTEGER DEFAULT 1,
  duration TEXT,
  aircraft_type TEXT,

  -- CO2 Specific
  co2_tons_offset DECIMAL(10, 2),
  certification_type TEXT,

  -- Pricing
  base_price DECIMAL(12, 2) NOT NULL,
  platform_fee DECIMAL(12, 2) DEFAULT 0,
  processing_fee DECIMAL(12, 2) DEFAULT 0,  -- CoinGate fee = 1% of transaction
  coingate_fee DECIMAL(12, 2) DEFAULT 0,    -- CoinGate 1% fee (stored separately)
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  discount_type TEXT, -- 'nft', 'promo', etc.
  total_amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',

  -- Crypto Payment Details (CoinGate)
  payment_method TEXT NOT NULL DEFAULT 'crypto', -- 'crypto_btc', 'crypto_eth', 'crypto_usdt', 'crypto_usdc'
  crypto_currency TEXT, -- BTC, ETH, USDT, USDC
  coingate_order_id TEXT UNIQUE,
  coingate_payment_url TEXT,
  coingate_token TEXT,

  -- Payment amounts in crypto
  crypto_amount DECIMAL(18, 8),
  crypto_amount_received DECIMAL(18, 8),
  exchange_rate DECIMAL(18, 8),

  -- Transaction Details
  wallet_address TEXT, -- User's wallet address
  transaction_hash TEXT, -- Blockchain transaction hash
  block_number BIGINT,
  network TEXT, -- 'ethereum', 'base', 'polygon', etc.

  -- Status
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'confirming', 'paid', 'expired', 'cancelled', 'refunded', 'failed')
  ),
  booking_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    booking_status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded')
  ),

  -- Contact Info (snapshot)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Additional Data
  special_requests TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Admin
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id)
);

-- 2. Create booking_transactions table for detailed payment history
CREATE TABLE IF NOT EXISTS booking_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES user_bookings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Transaction Type
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN ('payment', 'refund', 'fee', 'adjustment', 'pvcx_reward')
  ),

  -- Amounts
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  crypto_amount DECIMAL(18, 8),
  crypto_currency TEXT,

  -- Blockchain Details
  transaction_hash TEXT,
  block_number BIGINT,
  network TEXT,
  from_address TEXT,
  to_address TEXT,

  -- CoinGate Details
  coingate_order_id TEXT,
  coingate_status TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirming', 'completed', 'failed', 'cancelled')
  ),

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- 3. Add RLS policies for user_bookings
ALTER TABLE user_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
  ON user_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON user_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending bookings"
  ON user_bookings FOR UPDATE
  USING (auth.uid() = user_id AND payment_status = 'pending');

-- 4. Add RLS policies for booking_transactions
ALTER TABLE booking_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own booking transactions"
  ON booking_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_bookings_user_id ON user_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookings_booking_type ON user_bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_user_bookings_payment_status ON user_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_user_bookings_booking_status ON user_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_user_bookings_coingate_order_id ON user_bookings(coingate_order_id);
CREATE INDEX IF NOT EXISTS idx_user_bookings_created_at ON user_bookings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_transactions_booking_id ON booking_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_transactions_user_id ON booking_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_transactions_transaction_hash ON booking_transactions(transaction_hash);

-- 6. Create updated_at trigger
CREATE TRIGGER update_user_bookings_updated_at
  BEFORE UPDATE ON user_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create function to auto-credit PVCX on confirmed booking
CREATE OR REPLACE FUNCTION credit_pvcx_on_booking_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  pvcx_reward NUMERIC;
BEGIN
  -- Only process when payment_status changes to 'paid'
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    -- Calculate PVCX reward (1.5% of booking value)
    pvcx_reward := NEW.total_amount * 0.015;

    -- Credit PVCX to user
    -- NOTE: booking_id FK points to user_requests, so we store user_booking_id in metadata instead
    INSERT INTO pvcx_transactions (
      user_id,
      booking_id,
      type,
      amount,
      description,
      metadata,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.request_id,  -- Use request_id if exists (FK compatible), otherwise NULL
      'booking_reward',
      pvcx_reward,
      'Booking reward - ' || NEW.service_title,
      jsonb_build_object(
        'booking_type', NEW.booking_type,
        'booking_amount', NEW.total_amount,
        'currency', NEW.currency,
        'user_booking_id', NEW.id::text  -- Store actual booking ID in metadata
      ),
      NOW()
    );

    -- Record transaction for the booking
    INSERT INTO booking_transactions (
      booking_id,
      user_id,
      transaction_type,
      amount,
      currency,
      status,
      description,
      created_at,
      confirmed_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'pvcx_reward',
      pvcx_reward,
      'PVCX',
      'completed',
      'PVCX reward for booking',
      NOW(),
      NOW()
    );

    -- Update booking status to confirmed
    NEW.booking_status := 'confirmed';
    NEW.confirmed_at := NOW();
    NEW.paid_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for PVCX reward
DROP TRIGGER IF EXISTS trigger_credit_pvcx_on_booking ON user_bookings;
CREATE TRIGGER trigger_credit_pvcx_on_booking
  BEFORE UPDATE ON user_bookings
  FOR EACH ROW
  EXECUTE FUNCTION credit_pvcx_on_booking_confirmation();

-- 8. Grant permissions
GRANT ALL ON user_bookings TO authenticated;
GRANT ALL ON booking_transactions TO authenticated;

-- 9. Add service role policies for Edge Functions
CREATE POLICY "Service role full access to bookings"
  ON user_bookings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to booking transactions"
  ON booking_transactions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
