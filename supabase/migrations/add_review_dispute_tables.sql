-- Migration: Add Dispute System Tables (Admin handles manually via support tickets)
-- Run this in your Supabase SQL Editor

-- 1. Add columns to user_requests table
ALTER TABLE user_requests
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS coingate_order_id TEXT,
ADD COLUMN IF NOT EXISTS coingate_payment_url TEXT,
ADD COLUMN IF NOT EXISTS estimated_price NUMERIC,
ADD COLUMN IF NOT EXISTS final_price NUMERIC,
ADD COLUMN IF NOT EXISTS admin_adjusted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_note TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', -- 'pending', 'authorized', 'captured', 'cancelled', 'refunded', 'pending_crypto'
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS driver_confirmed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS disputed BOOLEAN DEFAULT FALSE;

-- 2. Create ride_disputes table
CREATE TABLE IF NOT EXISTS ride_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES user_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'in_review', 'resolved', 'rejected'
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for ride_disputes
ALTER TABLE ride_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own disputes"
  ON ride_disputes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create disputes for their bookings"
  ON ride_disputes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM user_requests
      WHERE id = booking_id
      AND user_id = auth.uid()
      AND status = 'completed'
    )
  );

-- 4. Create support_tickets table (if doesn't exist)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'general', 'technical', 'billing', 'ride_dispute', etc.
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  related_booking_id UUID REFERENCES user_requests(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Add RLS policies for support_tickets (skip if already exists)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_tickets'
    AND policyname = 'Users can view their own support tickets'
  ) THEN
    CREATE POLICY "Users can view their own support tickets"
      ON support_tickets FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_tickets'
    AND policyname = 'Users can create support tickets'
  ) THEN
    CREATE POLICY "Users can create support tickets"
      ON support_tickets FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ride_disputes_booking_id ON ride_disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_ride_disputes_user_id ON ride_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_disputes_status ON ride_disputes(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_user_requests_payment_status ON user_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_user_requests_stripe_payment_intent ON user_requests(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_user_requests_coingate_order ON user_requests(coingate_order_id);

-- 6. Create updated_at trigger function (if doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_ride_disputes_updated_at
  BEFORE UPDATE ON ride_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_support_tickets_updated_at'
  ) THEN
    CREATE TRIGGER update_support_tickets_updated_at
      BEFORE UPDATE ON support_tickets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 7. Grant permissions
GRANT ALL ON ride_disputes TO authenticated;
GRANT ALL ON support_tickets TO authenticated;
