-- Create crypto_transactions table
-- This table stores all cryptocurrency payment transactions via CoinGate

CREATE TABLE IF NOT EXISTS public.crypto_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.user_requests(id) ON DELETE SET NULL,
  coingate_order_id INTEGER NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  crypto_currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  payment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_user_id ON public.crypto_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_order_id ON public.crypto_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_status ON public.crypto_transactions(status);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_request_id ON public.crypto_transactions(request_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own crypto transactions"
  ON public.crypto_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own crypto transactions"
  ON public.crypto_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can update transactions (for webhook callbacks)
CREATE POLICY "Service can update crypto transactions"
  ON public.crypto_transactions
  FOR UPDATE
  USING (true);

-- Add payment_status and payment_method columns to user_requests if not exists
ALTER TABLE public.user_requests
ADD COLUMN IF NOT EXISTS payment_status TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS crypto_currency TEXT,
ADD COLUMN IF NOT EXISTS crypto_transaction_id TEXT;

-- Create index on crypto_transaction_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_requests_crypto_transaction_id
ON public.user_requests(crypto_transaction_id);

COMMENT ON TABLE public.crypto_transactions IS 'Stores cryptocurrency payment transactions via CoinGate payment gateway';
COMMENT ON COLUMN public.crypto_transactions.coingate_order_id IS 'CoinGate API order ID (integer)';
COMMENT ON COLUMN public.crypto_transactions.order_id IS 'Our internal unique order ID (format: ADV-{offer_id}-{timestamp})';
COMMENT ON COLUMN public.crypto_transactions.crypto_currency IS 'Cryptocurrency used for payment (BTC, ETH, USDT, etc.)';
COMMENT ON COLUMN public.crypto_transactions.status IS 'Payment status from CoinGate (new, pending, confirming, paid, confirmed, invalid, expired, canceled, refunded)';
