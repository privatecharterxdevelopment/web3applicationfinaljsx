-- ============================================
-- Supabase Migration: Safe (Escrow) Accounts
-- ============================================

-- Create Safe Accounts table
CREATE TABLE IF NOT EXISTS public.safe_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_address TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    network TEXT NOT NULL CHECK (network IN ('mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism')),

    -- Safe Configuration
    owners TEXT[] NOT NULL DEFAULT '{}',
    threshold INTEGER NOT NULL DEFAULT 1,
    safe_address TEXT,
    deployed_at TIMESTAMP WITH TIME ZONE,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Safe Transactions table
CREATE TABLE IF NOT EXISTS public.safe_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    safe_id UUID REFERENCES public.safe_accounts(id) ON DELETE CASCADE,

    -- Transaction Info
    type TEXT CHECK (type IN ('send', 'receive', 'contract_interaction', 'settings_change')),
    to_address TEXT,
    from_address TEXT,
    value NUMERIC DEFAULT 0,
    data TEXT,
    description TEXT,

    -- Confirmations
    confirmations INTEGER DEFAULT 0,
    required_confirmations INTEGER NOT NULL,
    confirmed_by TEXT[] DEFAULT '{}',
    executed BOOLEAN DEFAULT false,

    -- On-chain
    transaction_hash TEXT,
    safe_tx_hash TEXT,
    nonce INTEGER,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'cancelled')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Create Safe Transaction Confirmations table
CREATE TABLE IF NOT EXISTS public.safe_transaction_confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.safe_transactions(id) ON DELETE CASCADE,
    safe_id UUID REFERENCES public.safe_accounts(id) ON DELETE CASCADE,

    -- Confirmation Info
    owner_address TEXT NOT NULL,
    signature TEXT,

    -- Timestamps
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- Ensure one confirmation per owner per transaction
    UNIQUE(transaction_id, owner_address)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_safe_accounts_creator ON public.safe_accounts(creator_address);
CREATE INDEX IF NOT EXISTS idx_safe_accounts_status ON public.safe_accounts(status);
CREATE INDEX IF NOT EXISTS idx_safe_accounts_network ON public.safe_accounts(network);

CREATE INDEX IF NOT EXISTS idx_safe_transactions_safe ON public.safe_transactions(safe_id);
CREATE INDEX IF NOT EXISTS idx_safe_transactions_status ON public.safe_transactions(status);
CREATE INDEX IF NOT EXISTS idx_safe_transactions_created ON public.safe_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_safe_confirmations_tx ON public.safe_transaction_confirmations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_safe_confirmations_owner ON public.safe_transaction_confirmations(owner_address);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to safe_accounts
DROP TRIGGER IF EXISTS update_safe_accounts_updated_at ON public.safe_accounts;
CREATE TRIGGER update_safe_accounts_updated_at
    BEFORE UPDATE ON public.safe_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.safe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_transaction_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Safe Accounts table
CREATE POLICY "Safe accounts are viewable by owners" ON public.safe_accounts
    FOR SELECT USING (
        creator_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid())
        OR (SELECT wallet_address FROM auth.users WHERE id = auth.uid()) = ANY(owners)
    );

CREATE POLICY "Users can create safe accounts" ON public.safe_accounts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their safe accounts" ON public.safe_accounts
    FOR UPDATE USING (
        creator_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid())
        OR (SELECT wallet_address FROM auth.users WHERE id = auth.uid()) = ANY(owners)
    );

-- RLS Policies for Safe Transactions
CREATE POLICY "Transactions are viewable by safe owners" ON public.safe_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.safe_accounts
            WHERE id = safe_transactions.safe_id
            AND (
                creator_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid())
                OR (SELECT wallet_address FROM auth.users WHERE id = auth.uid()) = ANY(owners)
            )
        )
    );

CREATE POLICY "Safe owners can create transactions" ON public.safe_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.safe_accounts
            WHERE id = safe_transactions.safe_id
            AND (
                creator_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid())
                OR (SELECT wallet_address FROM auth.users WHERE id = auth.uid()) = ANY(owners)
            )
        )
    );

-- RLS Policies for Transaction Confirmations
CREATE POLICY "Confirmations are viewable by safe owners" ON public.safe_transaction_confirmations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.safe_accounts
            WHERE id = safe_transaction_confirmations.safe_id
            AND (
                creator_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid())
                OR (SELECT wallet_address FROM auth.users WHERE id = auth.uid()) = ANY(owners)
            )
        )
    );

CREATE POLICY "Safe owners can confirm transactions" ON public.safe_transaction_confirmations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.safe_accounts
            WHERE id = safe_transaction_confirmations.safe_id
            AND (SELECT wallet_address FROM auth.users WHERE id = auth.uid()) = ANY(owners)
        )
    );

-- Function to automatically update confirmation count
CREATE OR REPLACE FUNCTION update_transaction_confirmations()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Add owner to confirmed_by array and increment confirmations
        UPDATE public.safe_transactions
        SET
            confirmations = confirmations + 1,
            confirmed_by = array_append(confirmed_by, NEW.owner_address),
            status = CASE
                WHEN confirmations + 1 >= required_confirmations THEN 'ready'
                ELSE status
            END
        WHERE id = NEW.transaction_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transaction_confirmations ON public.safe_transaction_confirmations;
CREATE TRIGGER trigger_update_transaction_confirmations
    AFTER INSERT ON public.safe_transaction_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_confirmations();

-- Comments for documentation
COMMENT ON TABLE public.safe_accounts IS 'Multi-signature Safe (Gnosis Safe) accounts for secure fund management';
COMMENT ON TABLE public.safe_transactions IS 'Transactions requiring multi-signature approval';
COMMENT ON TABLE public.safe_transaction_confirmations IS 'Individual owner confirmations for transactions';
