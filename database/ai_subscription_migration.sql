-- =====================================================
-- AI CHAT SUBSCRIPTION SYSTEM - NO COMMISSIONS
-- =====================================================
-- Subscription packages for AI + Voice access only
-- Starter: $29/10 chats, Pro: $79/30 chats, Business: $199/100 chats, Elite: $499/unlimited
-- =====================================================

-- =====================================================
-- 1. ADD SUBSCRIPTION COLUMNS TO USERS TABLE
-- =====================================================
-- Add subscription tracking directly to auth.users metadata or create user_profiles table

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,

    -- Subscription details
    subscription_tier TEXT DEFAULT 'explorer' CHECK (subscription_tier IN ('explorer', 'starter', 'pro', 'business', 'elite')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),

    -- Stripe integration
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,

    -- Chat tracking
    chats_limit INTEGER DEFAULT 2, -- explorer = 2 free chats
    chats_used INTEGER DEFAULT 0,
    chats_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 month',

    -- Billing
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage profiles"
    ON user_profiles FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Auto-update timestamp
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. CHAT USAGE TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Chat details
    chat_session_id TEXT NOT NULL,
    message_count INTEGER DEFAULT 0, -- tracks messages in this chat (max 25)

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_chat_usage_user_id ON chat_usage(user_id);
CREATE INDEX idx_chat_usage_session ON chat_usage(chat_session_id);
CREATE INDEX idx_chat_usage_started_at ON chat_usage(started_at);

-- Enable RLS
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own chat usage"
    ON chat_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage chat usage"
    ON chat_usage FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 3. TOP-UP PURCHASES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_topups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Purchase details
    package_type TEXT NOT NULL CHECK (package_type IN ('5_chats', '10_chats', '25_chats', '50_chats')),
    chats_added INTEGER NOT NULL,
    price_usd DECIMAL(10, 2) NOT NULL,

    -- Stripe
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,

    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

    -- Timestamps
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_chat_topups_user_id ON chat_topups(user_id);
CREATE INDEX idx_chat_topups_purchased_at ON chat_topups(purchased_at);

-- Enable RLS
ALTER TABLE chat_topups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own topups"
    ON chat_topups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage topups"
    ON chat_topups FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 4. SUBSCRIPTION TIERS REFERENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_tiers (
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

-- Insert default tiers
INSERT INTO subscription_tiers (id, name, description, price_monthly_usd, chats_limit, features) VALUES
('explorer', 'Explorer', 'Try Sphera AI for free', 0, 2, '["2 AI Conversations (lifetime)", "Text Only", "Browse all services", "View prices"]'),
('starter', 'Starter', 'Perfect for occasional travelers', 29, 10, '["10 Full Conversations/month", "Voice & Text Support", "Real-time Availability", "Basic Route Planning", "Email Support (24h)"]'),
('pro', 'Professional', 'Most popular for regular users', 79, 30, '["30 Full Conversations/month", "Everything in Starter", "Priority Support (12h)", "Advanced Analytics", "Booking History", "Multi-service cart"]'),
('business', 'Business', 'For frequent travelers', 199, 100, '["100 Full Conversations/month", "Everything in Pro", "Dedicated Concierge", "24/7 Priority Support", "Team collaboration (5 users)", "Custom integrations"]'),
('elite', 'Elite', 'Unlimited VIP access', 499, NULL, '["Unlimited Conversations", "Everything in Business", "Dedicated Account Team", "Instant Support (30min)", "Custom API Access", "VIP Treatment"]')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policy - everyone can read tiers
CREATE POLICY "Anyone can view subscription tiers"
    ON subscription_tiers FOR SELECT
    TO public
    USING (active = TRUE);

-- =====================================================
-- 5. FUNCTIONS FOR CHAT MANAGEMENT
-- =====================================================

-- Function to increment chat usage
CREATE OR REPLACE FUNCTION increment_chat_usage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_result JSONB;
BEGIN
    -- Get current profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

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
    UPDATE user_profiles
    SET chats_used = chats_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Return success
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

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

-- Function to reset monthly chats
CREATE OR REPLACE FUNCTION reset_monthly_chats()
RETURNS void AS $$
BEGIN
    UPDATE user_profiles
    SET chats_used = 0,
        chats_reset_date = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE chats_reset_date <= NOW()
    AND subscription_tier != 'explorer'; -- don't reset explorer (lifetime limit)
END;
$$ LANGUAGE plpgsql;

-- Function to add topup chats
CREATE OR REPLACE FUNCTION add_topup_chats(p_user_id UUID, p_chats INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    -- Update chat limit
    UPDATE user_profiles
    SET chats_limit = CASE
        WHEN chats_limit IS NULL THEN NULL -- unlimited stays unlimited
        ELSE chats_limit + p_chats
    END,
    updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Get updated profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'chats_limit', v_profile.chats_limit,
        'chats_used', v_profile.chats_used,
        'chats_remaining', CASE
            WHEN v_profile.chats_limit IS NULL THEN NULL
            ELSE v_profile.chats_limit - v_profile.chats_used
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. SCHEDULED JOB TO RESET MONTHLY CHATS
-- =====================================================
-- This would typically be set up with pg_cron or external cron job
-- For now, we'll create a function that can be called daily

COMMENT ON FUNCTION reset_monthly_chats() IS 'Run this function daily via cron to reset monthly chat limits';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE user_profiles IS 'User subscription and chat usage tracking';
COMMENT ON TABLE chat_usage IS 'Detailed chat session tracking';
COMMENT ON TABLE chat_topups IS 'One-time chat top-up purchases';
COMMENT ON TABLE subscription_tiers IS 'Available subscription plans';
