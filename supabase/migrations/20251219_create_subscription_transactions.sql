-- =====================================================
-- SUBSCRIPTION TRANSACTIONS TABLE
-- Run this in Supabase Dashboard -> SQL Editor
-- =====================================================

-- Create subscription_transactions table to track all subscription payments
CREATE TABLE IF NOT EXISTS public.subscription_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'subscription_created', 'subscription_renewed', 'subscription_upgraded', 'subscription_canceled'
  tier TEXT, -- 'explorer', 'traveller', 'elite'
  previous_tier TEXT, -- For upgrades/downgrades
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'failed', 'refunded'
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON public.subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_created_at ON public.subscription_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_status ON public.subscription_transactions(status);

-- Enable RLS
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own transactions" ON public.subscription_transactions;
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.subscription_transactions;
DROP POLICY IF EXISTS "Service role can update transactions" ON public.subscription_transactions;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.subscription_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Anyone can insert (needed for webhooks with service role)
CREATE POLICY "Service role can insert transactions" ON public.subscription_transactions
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can update (needed for webhooks with service role)
CREATE POLICY "Service role can update transactions" ON public.subscription_transactions
  FOR UPDATE USING (true);

-- Grant permissions
GRANT ALL ON public.subscription_transactions TO authenticated;
GRANT ALL ON public.subscription_transactions TO service_role;

-- Add Alessandro's transaction (manual fix for his Dec 18 payment)
INSERT INTO public.subscription_transactions (user_id, type, tier, amount, currency, status, period_start, period_end, description, metadata)
VALUES (
  '942139a6-451d-44ed-8d94-16dc90aa17f6',
  'subscription_created',
  'explorer',
  49.00,
  'USD',
  'completed',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Explorer subscription activated',
  '{"source": "manual_fix", "original_payment_date": "2025-12-18"}'::jsonb
)
ON CONFLICT DO NOTHING;
