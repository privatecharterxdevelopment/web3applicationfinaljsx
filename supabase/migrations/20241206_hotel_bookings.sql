-- Hotel Bookings Table for LiteAPI Integration
-- Run this migration to create the hotel_bookings table

-- Create hotel_bookings table
CREATE TABLE IF NOT EXISTS hotel_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- LiteAPI Reference
  liteapi_booking_id text,
  liteapi_prebook_id text,

  -- Hotel Information
  hotel_id text NOT NULL,
  hotel_name text NOT NULL,
  hotel_address text,
  hotel_city text,
  hotel_country text,
  hotel_image text,
  hotel_star_rating integer,

  -- Booking Details
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  room_type text,
  room_count integer DEFAULT 1,
  guests integer NOT NULL,
  board_type text, -- 'Room Only', 'Breakfast', 'Half Board', 'Full Board', 'All Inclusive'

  -- Pricing
  total_price numeric NOT NULL,
  currency text DEFAULT 'USD',
  rate_id text,

  -- Payment Information
  payment_method text, -- 'bank', 'card', 'crypto'
  payment_status text DEFAULT 'pending', -- 'pending', 'confirming', 'paid', 'expired', 'cancelled', 'failed'
  booking_status text DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'

  -- CoinGate Payment Fields (for crypto payments)
  coingate_order_id text,
  coingate_payment_url text,
  coingate_token text,
  crypto_amount numeric,
  crypto_currency text,
  exchange_rate numeric,

  -- Blockchain Payment Fields (for direct crypto)
  transaction_hash text,
  block_number bigint,
  network text,
  wallet_address text,

  -- Guest Information
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  guest_country text,
  special_requests text,

  -- Confirmation
  confirmation_code text,

  -- Timestamps
  paid_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_user_id ON hotel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_booking_status ON hotel_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_payment_status ON hotel_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_check_in_date ON hotel_bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_created_at ON hotel_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_hotel_id ON hotel_bookings(hotel_id);

-- Enable Row Level Security
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own bookings
CREATE POLICY "Users can view own hotel bookings"
  ON hotel_bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create own hotel bookings"
  ON hotel_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (limited fields)
CREATE POLICY "Users can update own hotel bookings"
  ON hotel_bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role has full access to hotel bookings"
  ON hotel_bookings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_hotel_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_hotel_bookings_updated_at ON hotel_bookings;
CREATE TRIGGER set_hotel_bookings_updated_at
  BEFORE UPDATE ON hotel_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_hotel_bookings_updated_at();

-- Add hotel_booking to user_requests type if using enum
-- (Skip if user_requests.type is just a text field)
-- ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'hotel_booking';

COMMENT ON TABLE hotel_bookings IS 'Hotel booking records integrated with LiteAPI';
COMMENT ON COLUMN hotel_bookings.liteapi_booking_id IS 'Booking ID returned from LiteAPI after successful booking';
COMMENT ON COLUMN hotel_bookings.liteapi_prebook_id IS 'Prebook ID used to confirm rate availability';
COMMENT ON COLUMN hotel_bookings.payment_status IS 'Payment status: pending, confirming, paid, expired, cancelled, failed';
COMMENT ON COLUMN hotel_bookings.booking_status IS 'Booking status: pending, confirmed, cancelled, completed';
