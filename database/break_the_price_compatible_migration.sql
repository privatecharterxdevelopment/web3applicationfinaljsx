-- =====================================================
-- BREAK THE PRICE - COMPATIBLE MIGRATION
-- =====================================================
-- This migration is compatible with EXISTING user_profiles table
-- It ADDS subscription columns if missing, then creates Break the Price
-- Safe to run on production - uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- =====================================================

-- =====================================================
-- STEP 1: ADD SUBSCRIPTION COLUMNS TO EXISTING user_profiles
-- =====================================================
-- These columns are ADDED to your existing table, not replacing it
-- Uses DO block with exception handling for safety

DO $$
BEGIN
    -- Add subscription_tier column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN subscription_tier TEXT DEFAULT 'explorer'
        CHECK (subscription_tier IN ('explorer', 'starter', 'pro', 'business', 'elite', 'admin'));
        RAISE NOTICE 'Added subscription_tier column';
    END IF;

    -- Add subscription_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN subscription_status TEXT DEFAULT 'active'
        CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete'));
        RAISE NOTICE 'Added subscription_status column';
    END IF;

    -- Add chats_limit column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'chats_limit'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN chats_limit INTEGER DEFAULT 1; -- Explorer = 1 free chat
        RAISE NOTICE 'Added chats_limit column';
    END IF;

    -- Add chats_used column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'chats_used'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN chats_used INTEGER DEFAULT 0;
        RAISE NOTICE 'Added chats_used column';
    END IF;

    -- Add chats_reset_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'chats_reset_date'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN chats_reset_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added chats_reset_date column';
    END IF;

    -- Add stripe_customer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN stripe_customer_id TEXT;
        RAISE NOTICE 'Added stripe_customer_id column';
    END IF;

    -- Add stripe_subscription_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN stripe_subscription_id TEXT;
        RAISE NOTICE 'Added stripe_subscription_id column';
    END IF;

    -- Add current_period_start column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'current_period_start'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added current_period_start column';
    END IF;

    -- Add current_period_end column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'current_period_end'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added current_period_end column';
    END IF;

    -- Add cancel_at_period_end column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'cancel_at_period_end'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added cancel_at_period_end column';
    END IF;

    -- Add metadata column if it doesn't exist (for coordinator flag, etc.)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added metadata column';
    END IF;

END $$;

-- =====================================================
-- STEP 2: CREATE SUBSCRIPTION TIERS TABLE (IF NOT EXISTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly_usd DECIMAL(10, 2) NOT NULL,
    chats_limit INTEGER, -- NULL = unlimited
    features JSONB DEFAULT '[]',
    stripe_price_id TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert/Update subscription tiers
INSERT INTO public.subscription_tiers (id, name, description, price_monthly_usd, chats_limit, features) VALUES
('explorer', 'Free', 'Try Sphera AI for free', 0, 1, '["1 AI Conversation (lifetime)", "20 messages per chat", "Text Only", "Browse all services", "View prices"]'),
('starter', 'Starter', 'Get started with AI booking', 20, 15, '["15 AI Conversations/month", "20 messages per chat", "Break the Price (costs 1 chat)", "Voice & Text Support", "Email Support"]'),
('pro', 'Professional', 'Most popular for regular travelers', 40, 30, '["30 AI Conversations/month", "20 messages per chat", "Break the Price (costs 1 chat)", "Priority Support", "Dedicated Manager"]'),
('elite', 'Elite', 'Unlimited VIP access', 130, NULL, '["Unlimited AI Conversations", "Unlimited messages per chat", "Unlimited Break the Price", "24/7 Live Broker Assistance", "White Glove Treatment"]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_usd = EXCLUDED.price_monthly_usd,
  chats_limit = EXCLUDED.chats_limit,
  features = EXCLUDED.features;

-- Enable RLS on subscription_tiers
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can read subscription tiers
DROP POLICY IF EXISTS "Anyone can view subscription tiers" ON public.subscription_tiers;
CREATE POLICY "Anyone can view subscription tiers"
    ON public.subscription_tiers FOR SELECT
    TO public
    USING (active = TRUE);

-- =====================================================
-- STEP 3: CREATE CHAT USAGE TABLE (IF NOT EXISTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chat_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    chat_session_id TEXT NOT NULL,
    message_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_usage_user_id ON public.chat_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_session ON public.chat_usage(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_started_at ON public.chat_usage(started_at);

-- Enable RLS
ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_usage
DROP POLICY IF EXISTS "Users can view own chat usage" ON public.chat_usage;
CREATE POLICY "Users can view own chat usage"
    ON public.chat_usage FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat usage" ON public.chat_usage;
CREATE POLICY "Users can insert own chat usage"
    ON public.chat_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chat usage" ON public.chat_usage;
CREATE POLICY "Users can update own chat usage"
    ON public.chat_usage FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage chat usage" ON public.chat_usage;
CREATE POLICY "Service role can manage chat usage"
    ON public.chat_usage FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- STEP 4: CREATE PRICE BREAK REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.price_break_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    chat_id TEXT NOT NULL,

    -- Request details
    service_type TEXT NOT NULL DEFAULT 'unknown',
    service_details JSONB DEFAULT '{}',

    -- Uploaded quote file
    quote_file_url TEXT NOT NULL,
    quote_file_type TEXT NOT NULL DEFAULT 'image',
    quote_extracted_data JSONB DEFAULT '{}',

    -- Pricing comparison
    competitor_price DECIMAL(12, 2),
    competitor_currency TEXT DEFAULT 'USD',
    our_offer_price DECIMAL(12, 2),
    our_offer_currency TEXT DEFAULT 'USD',
    savings_amount DECIMAL(12, 2),
    savings_percentage DECIMAL(5, 2),

    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'analyzing', 'reviewed', 'offer_made', 'accepted', 'declined', 'expired'
    )),

    -- Coordinator response
    coordinator_id UUID,
    coordinator_notes TEXT,
    response_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '48 hours'),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for price_break_requests
CREATE INDEX IF NOT EXISTS idx_price_break_user_id ON public.price_break_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_price_break_chat_id ON public.price_break_requests(chat_id);
CREATE INDEX IF NOT EXISTS idx_price_break_status ON public.price_break_requests(status);
CREATE INDEX IF NOT EXISTS idx_price_break_created ON public.price_break_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_price_break_expires ON public.price_break_requests(expires_at);

-- Enable RLS
ALTER TABLE public.price_break_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_break_requests
DROP POLICY IF EXISTS "Users can view own price break requests" ON public.price_break_requests;
CREATE POLICY "Users can view own price break requests"
    ON public.price_break_requests FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create price break requests" ON public.price_break_requests;
CREATE POLICY "Users can create price break requests"
    ON public.price_break_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own price break requests" ON public.price_break_requests;
CREATE POLICY "Users can update own price break requests"
    ON public.price_break_requests FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coordinators can view all price break requests" ON public.price_break_requests;
CREATE POLICY "Coordinators can view all price break requests"
    ON public.price_break_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND (
                user_profiles.subscription_tier = 'admin'
                OR user_profiles.metadata->>'is_coordinator' = 'true'
                OR user_profiles.metadata->>'role' = 'coordinator'
            )
        )
    );

DROP POLICY IF EXISTS "Coordinators can update price break requests" ON public.price_break_requests;
CREATE POLICY "Coordinators can update price break requests"
    ON public.price_break_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND (
                user_profiles.subscription_tier = 'admin'
                OR user_profiles.metadata->>'is_coordinator' = 'true'
                OR user_profiles.metadata->>'role' = 'coordinator'
            )
        )
    );

DROP POLICY IF EXISTS "Service role can manage price break requests" ON public.price_break_requests;
CREATE POLICY "Service role can manage price break requests"
    ON public.price_break_requests FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- STEP 5: HELPER FUNCTIONS
-- =====================================================

-- Function: Check if user has Break the Price access
CREATE OR REPLACE FUNCTION check_break_the_price_access(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    -- Get user profile
    SELECT * INTO v_profile FROM public.user_profiles WHERE user_id = p_user_id;

    -- If no profile exists
    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'has_access', FALSE,
            'error', 'NO_PROFILE',
            'message', 'User profile not found.'
        );
    END IF;

    -- Check if subscription_tier column exists and has value
    IF v_profile.subscription_tier IS NULL THEN
        -- Default to explorer if not set
        UPDATE public.user_profiles
        SET subscription_tier = 'explorer', chats_limit = 1, chats_used = 0
        WHERE user_id = p_user_id;

        RETURN jsonb_build_object(
            'has_access', FALSE,
            'tier', 'explorer',
            'error', 'UPGRADE_REQUIRED',
            'message', 'Break the Price requires Starter plan or higher.'
        );
    END IF;

    -- Explorer (free) = NO access
    IF v_profile.subscription_tier NOT IN ('starter', 'pro', 'elite') THEN
        RETURN jsonb_build_object(
            'has_access', FALSE,
            'tier', v_profile.subscription_tier,
            'error', 'UPGRADE_REQUIRED',
            'message', 'Break the Price requires Starter plan or higher.'
        );
    END IF;

    -- Elite users get unlimited Break the Price
    IF v_profile.subscription_tier = 'elite' THEN
        RETURN jsonb_build_object(
            'has_access', TRUE,
            'tier', 'elite',
            'cost', 0,
            'unlimited', TRUE,
            'message', 'Elite plan - unlimited Break the Price'
        );
    END IF;

    -- Starter/Pro users - check if they have chats remaining
    IF v_profile.chats_limit IS NOT NULL AND v_profile.chats_used >= v_profile.chats_limit THEN
        RETURN jsonb_build_object(
            'has_access', FALSE,
            'tier', v_profile.subscription_tier,
            'error', 'NO_CHATS_REMAINING',
            'message', 'No chats remaining. Break the Price costs 1 chat.',
            'chats_used', v_profile.chats_used,
            'chats_limit', v_profile.chats_limit
        );
    END IF;

    -- User has access
    RETURN jsonb_build_object(
        'has_access', TRUE,
        'tier', v_profile.subscription_tier,
        'cost', 1,
        'unlimited', FALSE,
        'chats_used', COALESCE(v_profile.chats_used, 0),
        'chats_limit', COALESCE(v_profile.chats_limit, 1),
        'chats_remaining', COALESCE(v_profile.chats_limit, 1) - COALESCE(v_profile.chats_used, 0),
        'message', 'Break the Price available (costs 1 chat)'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Use Break the Price (deducts 1 chat for Starter/Pro)
CREATE OR REPLACE FUNCTION use_break_the_price(p_user_id UUID, p_chat_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_access JSONB;
BEGIN
    -- First check access
    v_access := check_break_the_price_access(p_user_id);

    -- If no access, return the error
    IF NOT (v_access->>'has_access')::boolean THEN
        RETURN v_access;
    END IF;

    -- Get user profile
    SELECT * INTO v_profile FROM public.user_profiles WHERE user_id = p_user_id;

    -- Elite users - no deduction needed
    IF v_profile.subscription_tier = 'elite' THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'tier', 'elite',
            'cost', 0,
            'message', 'Break the Price used (Elite - no cost)'
        );
    END IF;

    -- Starter/Pro users - deduct 1 chat
    UPDATE public.user_profiles
    SET chats_used = COALESCE(chats_used, 0) + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Get updated profile
    SELECT * INTO v_profile FROM public.user_profiles WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'tier', v_profile.subscription_tier,
        'cost', 1,
        'chats_used', v_profile.chats_used,
        'chats_limit', v_profile.chats_limit,
        'chats_remaining', CASE
            WHEN v_profile.chats_limit IS NULL THEN NULL
            ELSE v_profile.chats_limit - v_profile.chats_used
        END,
        'message', 'Break the Price used (1 chat deducted)'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment chat usage
CREATE OR REPLACE FUNCTION increment_chat_usage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    -- Get current profile
    SELECT * INTO v_profile FROM public.user_profiles WHERE user_id = p_user_id;

    -- Check if chat limit reached
    IF v_profile.chats_limit IS NOT NULL AND v_profile.chats_used >= v_profile.chats_limit THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'CHAT_LIMIT_REACHED',
            'chats_used', v_profile.chats_used,
            'chats_limit', v_profile.chats_limit,
            'tier', v_profile.subscription_tier
        );
    END IF;

    -- Increment usage
    UPDATE public.user_profiles
    SET chats_used = COALESCE(chats_used, 0) + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Get updated profile
    SELECT * INTO v_profile FROM public.user_profiles WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'chats_used', v_profile.chats_used,
        'chats_limit', v_profile.chats_limit,
        'chats_remaining', CASE
            WHEN v_profile.chats_limit IS NULL THEN NULL
            ELSE v_profile.chats_limit - v_profile.chats_used
        END,
        'tier', v_profile.subscription_tier
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's Break the Price statistics
CREATE OR REPLACE FUNCTION get_price_break_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total INTEGER;
    v_pending INTEGER;
    v_offers INTEGER;
    v_accepted INTEGER;
    v_total_savings DECIMAL;
BEGIN
    SELECT COUNT(*) INTO v_total FROM public.price_break_requests WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO v_pending FROM public.price_break_requests WHERE user_id = p_user_id AND status IN ('pending', 'analyzing', 'reviewed');
    SELECT COUNT(*) INTO v_offers FROM public.price_break_requests WHERE user_id = p_user_id AND status = 'offer_made';
    SELECT COUNT(*) INTO v_accepted FROM public.price_break_requests WHERE user_id = p_user_id AND status = 'accepted';
    SELECT COALESCE(SUM(savings_amount), 0) INTO v_total_savings FROM public.price_break_requests WHERE user_id = p_user_id AND status = 'accepted' AND savings_amount IS NOT NULL;

    RETURN jsonb_build_object(
        'total_requests', v_total,
        'pending', v_pending,
        'offers_waiting', v_offers,
        'accepted', v_accepted,
        'total_savings', v_total_savings
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: SUBSCRIPTION TRANSACTIONS TABLE
-- =====================================================
-- Tracks all subscription payments, upgrades, cancellations

CREATE TABLE IF NOT EXISTS public.subscription_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    -- Transaction type
    type TEXT NOT NULL CHECK (type IN (
        'subscription_created',   -- New subscription
        'subscription_renewed',   -- Monthly/annual renewal
        'subscription_upgraded',  -- Upgrade to higher tier
        'subscription_downgraded', -- Downgrade to lower tier
        'subscription_canceled',  -- Cancellation
        'subscription_reactivated', -- Reactivation after cancel
        'topup_purchase',         -- Chat top-up purchase
        'refund'                  -- Refund issued
    )),

    -- Subscription details
    tier TEXT,  -- 'starter', 'pro', 'elite'
    previous_tier TEXT, -- For upgrades/downgrades

    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT, -- 'card', 'crypto', 'bank_transfer'

    -- Stripe references
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    stripe_subscription_id TEXT,

    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

    -- Billing period
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,

    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sub_transactions_user_id ON public.subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_transactions_type ON public.subscription_transactions(type);
CREATE INDEX IF NOT EXISTS idx_sub_transactions_created ON public.subscription_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_sub_transactions_stripe_invoice ON public.subscription_transactions(stripe_invoice_id);

-- Enable RLS
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.subscription_transactions;
CREATE POLICY "Users can view own transactions"
    ON public.subscription_transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage transactions" ON public.subscription_transactions;
CREATE POLICY "Service role can manage transactions"
    ON public.subscription_transactions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- STEP 7: CHAT TOP-UPS TABLE
-- =====================================================
-- For users who want to buy extra chats without upgrading

CREATE TABLE IF NOT EXISTS public.chat_topups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    -- Package details
    package_type TEXT NOT NULL CHECK (package_type IN ('5_chats', '10_chats', '25_chats', '50_chats')),
    chats_added INTEGER NOT NULL,
    price_usd DECIMAL(10, 2) NOT NULL,

    -- Payment
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

    -- Timestamps
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_topups_user_id ON public.chat_topups(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_topups_purchased_at ON public.chat_topups(purchased_at);

-- Enable RLS
ALTER TABLE public.chat_topups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own topups" ON public.chat_topups;
CREATE POLICY "Users can view own topups"
    ON public.chat_topups FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage topups" ON public.chat_topups;
CREATE POLICY "Service role can manage topups"
    ON public.chat_topups FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- STEP 8: HELPER FUNCTION FOR TRANSACTION HISTORY
-- =====================================================

-- Function: Get user's subscription transaction history
CREATE OR REPLACE FUNCTION get_subscription_history(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    type TEXT,
    tier TEXT,
    previous_tier TEXT,
    amount DECIMAL,
    currency TEXT,
    status TEXT,
    description TEXT,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.type,
        t.tier,
        t.previous_tier,
        t.amount,
        t.currency,
        t.status,
        t.description,
        t.period_start,
        t.period_end,
        t.created_at
    FROM public.subscription_transactions t
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get subscription spending summary
CREATE OR REPLACE FUNCTION get_subscription_spending_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_spent DECIMAL;
    v_this_month DECIMAL;
    v_last_month DECIMAL;
    v_total_transactions INTEGER;
    v_current_tier TEXT;
    v_member_since TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get total spent (completed transactions only)
    SELECT COALESCE(SUM(amount), 0) INTO v_total_spent
    FROM public.subscription_transactions
    WHERE user_id = p_user_id AND status = 'completed' AND type != 'refund';

    -- Get this month's spending
    SELECT COALESCE(SUM(amount), 0) INTO v_this_month
    FROM public.subscription_transactions
    WHERE user_id = p_user_id
    AND status = 'completed'
    AND type != 'refund'
    AND created_at >= date_trunc('month', CURRENT_DATE);

    -- Get last month's spending
    SELECT COALESCE(SUM(amount), 0) INTO v_last_month
    FROM public.subscription_transactions
    WHERE user_id = p_user_id
    AND status = 'completed'
    AND type != 'refund'
    AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
    AND created_at < date_trunc('month', CURRENT_DATE);

    -- Get total transaction count
    SELECT COUNT(*) INTO v_total_transactions
    FROM public.subscription_transactions
    WHERE user_id = p_user_id;

    -- Get current tier
    SELECT subscription_tier INTO v_current_tier
    FROM public.user_profiles
    WHERE user_id = p_user_id;

    -- Get member since (first transaction or profile creation)
    SELECT COALESCE(
        (SELECT MIN(created_at) FROM public.subscription_transactions WHERE user_id = p_user_id),
        (SELECT created_at FROM public.user_profiles WHERE user_id = p_user_id)
    ) INTO v_member_since;

    RETURN jsonb_build_object(
        'total_spent', v_total_spent,
        'this_month', v_this_month,
        'last_month', v_last_month,
        'total_transactions', v_total_transactions,
        'current_tier', COALESCE(v_current_tier, 'explorer'),
        'member_since', v_member_since
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 9: COMMENTS
-- =====================================================

COMMENT ON TABLE public.price_break_requests IS 'Break the Price quote submissions - users upload competitor quotes for better prices';
COMMENT ON TABLE public.subscription_transactions IS 'All subscription payments, upgrades, cancellations, and refunds';
COMMENT ON TABLE public.chat_topups IS 'One-time chat top-up purchases';
COMMENT ON FUNCTION check_break_the_price_access IS 'Check if user has Break the Price access based on subscription tier';
COMMENT ON FUNCTION use_break_the_price IS 'Deduct 1 chat credit for Break the Price usage (free for Elite)';
COMMENT ON FUNCTION increment_chat_usage IS 'Increment chat usage count for a user';
COMMENT ON FUNCTION get_subscription_history IS 'Get paginated transaction history for a user';
COMMENT ON FUNCTION get_subscription_spending_summary IS 'Get spending summary with totals and current tier';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- What was done:
-- ✅ Added subscription columns to existing user_profiles (if missing)
-- ✅ Created subscription_tiers table
-- ✅ Created chat_usage table
-- ✅ Created price_break_requests table
-- ✅ Created all RLS policies
-- ✅ Created helper functions
--
-- What was NOT touched:
-- ✅ Existing user_profiles data preserved
-- ✅ Existing user_requests table unchanged
-- ✅ All other existing tables unchanged
-- =====================================================
