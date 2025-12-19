-- =====================================================
-- FIX SUBSCRIPTION & CHAT SYSTEM - COMPLETE MIGRATION
-- Run this in Supabase Dashboard -> SQL Editor
-- =====================================================
-- This migration is SAFE - uses IF NOT EXISTS for everything
-- =====================================================

-- =====================================================
-- 1. ADD MISSING SUBSCRIPTION COLUMNS TO user_profiles
-- =====================================================

-- Add subscription_tier column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN subscription_tier TEXT DEFAULT 'explorer';
    END IF;
END $$;

-- Add subscription_status column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
    END IF;
END $$;

-- Add chats_limit column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'chats_limit'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN chats_limit INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add chats_used column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'chats_used'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN chats_used INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add chats_reset_date column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'chats_reset_date'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN chats_reset_date TIMESTAMPTZ;
    END IF;
END $$;

-- Add stripe_customer_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;
END $$;

-- Add stripe_subscription_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN stripe_subscription_id TEXT;
    END IF;
END $$;

-- Add current_period_start column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'current_period_start'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN current_period_start TIMESTAMPTZ;
    END IF;
END $$;

-- Add current_period_end column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'current_period_end'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN current_period_end TIMESTAMPTZ;
    END IF;
END $$;

-- Add cancel_at_period_end column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'cancel_at_period_end'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add email column (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Add name column (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN name TEXT;
    END IF;
END $$;

-- =====================================================
-- 2. CREATE subscription_tiers TABLE
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policy - everyone can read tiers
DROP POLICY IF EXISTS "Anyone can view subscription tiers" ON subscription_tiers;
CREATE POLICY "Anyone can view subscription tiers"
    ON subscription_tiers FOR SELECT
    TO public
    USING (active = TRUE);

-- Insert/Update the 3-tier system
INSERT INTO subscription_tiers (id, name, description, price_monthly_usd, chats_limit, features, active) VALUES
('explorer', 'Explorer', 'Perfect for first-time travelers', 49, 5, '["5 AI Conversations/month", "10 messages per chat", "Empty Legs Access", "Ground Transport", "Email Support"]', true),
('traveller', 'Traveller', 'For regular luxury travelers', 99, 10, '["10 AI Conversations/month", "25 messages per chat", "Break the Price Access", "MEDEVAC Services", "Concierge Support", "Priority Booking"]', true),
('elite', 'Elite Club', 'Unlimited VIP experience', 399, NULL, '["Unlimited AI Conversations", "Unlimited messages per chat", "All Services Included", "24/7 White Glove Service", "Dedicated Account Manager", "VIP Events Access"]', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_usd = EXCLUDED.price_monthly_usd,
  chats_limit = EXCLUDED.chats_limit,
  features = EXCLUDED.features,
  active = EXCLUDED.active;

-- =====================================================
-- 3. CREATE get_chat_limits FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_chat_limits(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    -- Get user profile
    SELECT
        user_id,
        subscription_tier,
        subscription_status,
        chats_limit,
        chats_used,
        chats_reset_date,
        current_period_start,
        current_period_end
    INTO v_profile
    FROM user_profiles
    WHERE user_id = p_user_id;

    -- If no profile exists, return default (no subscription)
    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', p_user_id,
            'tier', NULL,
            'status', 'inactive',
            'chats_limit', 0,
            'chats_used', 0,
            'chats_remaining', 0,
            'unlimited', FALSE,
            'can_start_chat', FALSE,
            'requires_subscription', TRUE
        );
    END IF;

    -- Check if user has active subscription
    IF v_profile.subscription_tier IS NULL OR v_profile.subscription_status != 'active' THEN
        RETURN jsonb_build_object(
            'user_id', v_profile.user_id,
            'tier', v_profile.subscription_tier,
            'status', v_profile.subscription_status,
            'chats_limit', COALESCE(v_profile.chats_limit, 0),
            'chats_used', COALESCE(v_profile.chats_used, 0),
            'chats_remaining', 0,
            'unlimited', FALSE,
            'can_start_chat', FALSE,
            'requires_subscription', TRUE
        );
    END IF;

    -- Check if unlimited (elite tier or null chats_limit)
    IF v_profile.subscription_tier = 'elite' OR v_profile.chats_limit IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', v_profile.user_id,
            'tier', v_profile.subscription_tier,
            'status', v_profile.subscription_status,
            'chats_limit', NULL,
            'chats_used', COALESCE(v_profile.chats_used, 0),
            'chats_remaining', NULL,
            'unlimited', TRUE,
            'can_start_chat', TRUE,
            'requires_subscription', FALSE,
            'reset_date', v_profile.chats_reset_date,
            'period_end', v_profile.current_period_end
        );
    END IF;

    -- Regular tier with limits
    RETURN jsonb_build_object(
        'user_id', v_profile.user_id,
        'tier', v_profile.subscription_tier,
        'status', v_profile.subscription_status,
        'chats_limit', v_profile.chats_limit,
        'chats_used', COALESCE(v_profile.chats_used, 0),
        'chats_remaining', GREATEST(0, v_profile.chats_limit - COALESCE(v_profile.chats_used, 0)),
        'unlimited', FALSE,
        'can_start_chat', COALESCE(v_profile.chats_used, 0) < v_profile.chats_limit,
        'requires_subscription', FALSE,
        'reset_date', v_profile.chats_reset_date,
        'period_end', v_profile.current_period_end
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_chat_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_limits(UUID) TO service_role;

-- =====================================================
-- 4. CREATE increment_chat_usage FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION increment_chat_usage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    -- Get current profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

    -- If no profile, return error
    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NO_PROFILE',
            'message', 'User profile not found'
        );
    END IF;

    -- Check if chat limit reached (skip for unlimited/elite)
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
    SET chats_used = COALESCE(chats_used, 0) + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Return success with updated values
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'chats_used', v_profile.chats_used,
        'chats_limit', v_profile.chats_limit,
        'chats_remaining', CASE
            WHEN v_profile.chats_limit IS NULL THEN NULL
            ELSE GREATEST(0, v_profile.chats_limit - v_profile.chats_used)
        END,
        'tier', v_profile.subscription_tier
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_chat_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_chat_usage(UUID) TO service_role;

-- =====================================================
-- 5. UPDATE RLS POLICIES FOR user_profiles
-- =====================================================

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
CREATE POLICY "Service role full access" ON user_profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 6. CREATE chat_usage TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chat_session_id TEXT NOT NULL,
    message_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_usage_user_id ON chat_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_session ON chat_usage(chat_session_id);

-- Enable RLS
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own chat usage" ON chat_usage;
CREATE POLICY "Users can view own chat usage" ON chat_usage
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat usage" ON chat_usage;
CREATE POLICY "Users can insert own chat usage" ON chat_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chat usage" ON chat_usage;
CREATE POLICY "Users can update own chat usage" ON chat_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 7. CREATE chat_messages TABLE (FOR CRM/SUPPORT CHAT)
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
  admin_name VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;
CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND sender_type = 'user');

DROP POLICY IF EXISTS "Service role full access chat_messages" ON chat_messages;
CREATE POLICY "Service role full access chat_messages"
  ON chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 8. CREATE ai_chat_sessions TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_updated_at ON ai_chat_sessions(updated_at DESC);

-- Enable RLS
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own AI chats" ON ai_chat_sessions;
CREATE POLICY "Users can view own AI chats" ON ai_chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own AI chats" ON ai_chat_sessions;
CREATE POLICY "Users can insert own AI chats" ON ai_chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own AI chats" ON ai_chat_sessions;
CREATE POLICY "Users can update own AI chats" ON ai_chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own AI chats" ON ai_chat_sessions;
CREATE POLICY "Users can delete own AI chats" ON ai_chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 9. GRANT ALL PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON chat_usage TO authenticated;
GRANT ALL ON chat_usage TO service_role;
GRANT SELECT ON subscription_tiers TO authenticated;
GRANT SELECT ON subscription_tiers TO anon;
GRANT SELECT, INSERT ON chat_messages TO authenticated;
GRANT ALL ON chat_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_chat_sessions TO authenticated;
GRANT ALL ON ai_chat_sessions TO service_role;

-- =====================================================
-- 10. FIX ALESSANDRO'S SUBSCRIPTION
-- =====================================================

-- Update Alessandro's profile to have active Explorer subscription
UPDATE user_profiles
SET
    subscription_tier = 'explorer',
    subscription_status = 'active',
    chats_limit = 5,
    chats_used = 0,
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '30 days'
WHERE user_id = '942139a6-451d-44ed-8d94-16dc90aa17f6';

-- If no profile exists for Alessandro, create one
INSERT INTO user_profiles (user_id, subscription_tier, subscription_status, chats_limit, chats_used, current_period_start, current_period_end)
VALUES (
    '942139a6-451d-44ed-8d94-16dc90aa17f6',
    'explorer',
    'active',
    5,
    0,
    NOW(),
    NOW() + INTERVAL '30 days'
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- DONE! Migration complete.
-- =====================================================
