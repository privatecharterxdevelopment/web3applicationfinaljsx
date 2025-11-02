-- ============================================
-- Supabase Migration: DAO Management System
-- ============================================

-- Create DAOs table
CREATE TABLE IF NOT EXISTS public.daos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_address TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    dao_type TEXT NOT NULL CHECK (dao_type IN ('fundraising', 'fractional', 'governance', 'service')),
    category TEXT,
    logo_url TEXT,
    header_image_url TEXT,

    -- Token Configuration
    token_name TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    initial_supply NUMERIC,
    token_contract_address TEXT,

    -- Governance
    governance_model TEXT NOT NULL CHECK (governance_model IN ('token-voting', 'multisig', 'quadratic')),
    voting_period_days INTEGER DEFAULT 7,
    quorum_percentage INTEGER DEFAULT 50,

    -- Financial (for fundraising DAOs)
    fundraising_goal NUMERIC,
    fundraising_current NUMERIC DEFAULT 0,
    minimum_contribution NUMERIC,
    token_price NUMERIC,

    -- Access Control
    is_public BOOLEAN DEFAULT true,
    whitelisted_addresses TEXT[] DEFAULT '{}',

    -- Safe (Gnosis) Escrow
    use_safe_escrow BOOLEAN DEFAULT false,
    safe_address TEXT,
    safe_owners TEXT[] DEFAULT '{}',
    safe_threshold INTEGER DEFAULT 1,

    -- Aragon Integration
    aragon_dao_address TEXT,
    aragon_token_address TEXT,
    aragon_voting_address TEXT,

    -- Products/Services
    products JSONB DEFAULT '[]',

    -- Legal
    legal_docs JSONB DEFAULT '[]',

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'closed')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deployed_at TIMESTAMP WITH TIME ZONE
);

-- Create DAO Proposals table
CREATE TABLE IF NOT EXISTS public.dao_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dao_id UUID REFERENCES public.daos(id) ON DELETE CASCADE,
    creator_address TEXT NOT NULL,

    -- Proposal Info
    title TEXT NOT NULL,
    description TEXT,
    proposal_type TEXT CHECK (proposal_type IN ('general', 'funding', 'parameter-change', 'membership')),

    -- Voting
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    votes_for NUMERIC DEFAULT 0,
    votes_against NUMERIC DEFAULT 0,
    votes_abstain NUMERIC DEFAULT 0,
    quorum_reached BOOLEAN DEFAULT false,

    -- On-chain
    on_chain_id TEXT,
    transaction_hash TEXT,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed', 'expired')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Create DAO Votes table
CREATE TABLE IF NOT EXISTS public.dao_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
    dao_id UUID REFERENCES public.daos(id) ON DELETE CASCADE,
    voter_address TEXT NOT NULL,

    -- Vote Details
    vote_choice TEXT CHECK (vote_choice IN ('for', 'against', 'abstain')),
    voting_power NUMERIC NOT NULL,

    -- On-chain
    transaction_hash TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- Ensure one vote per address per proposal
    UNIQUE(proposal_id, voter_address)
);

-- Create DAO Transactions table
CREATE TABLE IF NOT EXISTS public.dao_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dao_id UUID REFERENCES public.daos(id) ON DELETE CASCADE,

    -- Transaction Info
    type TEXT CHECK (type IN ('contribution', 'distribution', 'withdrawal', 'purchase', 'other')),
    from_address TEXT,
    to_address TEXT,
    amount NUMERIC,
    token_symbol TEXT,
    description TEXT,

    -- On-chain
    transaction_hash TEXT,
    block_number BIGINT,

    -- Safe Transaction
    safe_tx_hash TEXT,
    safe_nonce INTEGER,
    safe_confirmations INTEGER DEFAULT 0,
    safe_executed BOOLEAN DEFAULT false,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create DAO Members table
CREATE TABLE IF NOT EXISTS public.dao_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dao_id UUID REFERENCES public.daos(id) ON DELETE CASCADE,
    member_address TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),

    -- Membership Info
    role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member', 'observer')),
    token_balance NUMERIC DEFAULT 0,
    voting_power NUMERIC DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,

    -- Ensure one membership per address per DAO
    UNIQUE(dao_id, member_address)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daos_creator ON public.daos(creator_address);
CREATE INDEX IF NOT EXISTS idx_daos_status ON public.daos(status);
CREATE INDEX IF NOT EXISTS idx_daos_created_at ON public.daos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_dao ON public.dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_creator ON public.dao_proposals(creator_address);

CREATE INDEX IF NOT EXISTS idx_votes_proposal ON public.dao_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON public.dao_votes(voter_address);

CREATE INDEX IF NOT EXISTS idx_transactions_dao ON public.dao_transactions(dao_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.dao_transactions(status);

CREATE INDEX IF NOT EXISTS idx_members_dao ON public.dao_members(dao_id);
CREATE INDEX IF NOT EXISTS idx_members_address ON public.dao_members(member_address);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
DROP TRIGGER IF EXISTS update_daos_updated_at ON public.daos;
CREATE TRIGGER update_daos_updated_at
    BEFORE UPDATE ON public.daos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON public.dao_proposals;
CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON public.dao_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.daos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for DAOs table
CREATE POLICY "DAOs are viewable by everyone" ON public.daos
    FOR SELECT USING (true);

CREATE POLICY "Users can create DAOs" ON public.daos
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their DAOs" ON public.daos
    FOR UPDATE USING (creator_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Creators can delete their DAOs" ON public.daos
    FOR DELETE USING (creator_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for Proposals
CREATE POLICY "Proposals are viewable by everyone" ON public.dao_proposals
    FOR SELECT USING (true);

CREATE POLICY "DAO members can create proposals" ON public.dao_proposals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.dao_members
            WHERE dao_id = dao_proposals.dao_id
            AND member_address = dao_proposals.creator_address
            AND is_active = true
        )
    );

-- RLS Policies for Votes
CREATE POLICY "Votes are viewable by everyone" ON public.dao_votes
    FOR SELECT USING (true);

CREATE POLICY "DAO members can vote" ON public.dao_votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.dao_members
            WHERE dao_id = dao_votes.dao_id
            AND member_address = dao_votes.voter_address
            AND is_active = true
        )
    );

-- RLS Policies for Transactions
CREATE POLICY "Transactions are viewable by DAO members" ON public.dao_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.dao_members
            WHERE dao_id = dao_transactions.dao_id
            AND member_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "DAO admins can create transactions" ON public.dao_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.dao_members
            WHERE dao_id = dao_transactions.dao_id
            AND member_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid())
            AND role IN ('creator', 'admin')
        )
    );

-- RLS Policies for Members
CREATE POLICY "Members are viewable by everyone" ON public.dao_members
    FOR SELECT USING (true);

CREATE POLICY "DAO creators can manage members" ON public.dao_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.daos
            WHERE id = dao_members.dao_id
            AND creator_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid())
        )
    );

-- Create a function to automatically add creator as member
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.dao_members (dao_id, member_address, user_id, role, is_active)
    VALUES (NEW.id, NEW.creator_address, NEW.user_id, 'creator', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS add_creator_as_member_trigger ON public.daos;
CREATE TRIGGER add_creator_as_member_trigger
    AFTER INSERT ON public.daos
    FOR EACH ROW
    EXECUTE FUNCTION add_creator_as_member();

-- Comments for documentation
COMMENT ON TABLE public.daos IS 'Stores DAO (Decentralized Autonomous Organization) information';
COMMENT ON TABLE public.dao_proposals IS 'Stores proposals for DAO governance voting';
COMMENT ON TABLE public.dao_votes IS 'Stores individual votes on DAO proposals';
COMMENT ON TABLE public.dao_transactions IS 'Stores financial transactions for DAOs';
COMMENT ON TABLE public.dao_members IS 'Stores DAO membership information';
