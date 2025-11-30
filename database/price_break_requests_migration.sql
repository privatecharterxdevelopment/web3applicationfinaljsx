-- =====================================================
-- PRICE BREAK REQUESTS TABLE
-- =====================================================
-- For "Break the Price" feature where users upload competitor quotes
-- and coordinators respond with better prices
-- =====================================================

-- =====================================================
-- 1. PRICE BREAK REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS price_break_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chat_id TEXT NOT NULL,

    -- Request details
    service_type TEXT NOT NULL, -- 'flight', 'hotel', 'yacht', 'jet', 'car', 'experience'
    service_details JSONB DEFAULT '{}', -- parsed details from quote

    -- Uploaded quote
    quote_file_url TEXT NOT NULL,
    quote_file_type TEXT NOT NULL, -- 'pdf', 'image'
    quote_extracted_data JSONB DEFAULT '{}', -- AI-extracted data from quote

    -- Pricing
    competitor_price DECIMAL(12, 2),
    competitor_currency TEXT DEFAULT 'USD',
    our_offer_price DECIMAL(12, 2),
    our_offer_currency TEXT DEFAULT 'USD',
    savings_amount DECIMAL(12, 2),
    savings_percentage DECIMAL(5, 2),

    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Just submitted
        'analyzing',    -- AI is analyzing the quote
        'reviewed',     -- Coordinator has reviewed
        'offer_made',   -- We've made a counter-offer
        'accepted',     -- User accepted our offer
        'declined',     -- User declined our offer
        'expired'       -- No response within time limit
    )),

    -- Coordinator response
    coordinator_id UUID REFERENCES auth.users(id),
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

-- Indexes
CREATE INDEX idx_price_break_user_id ON price_break_requests(user_id);
CREATE INDEX idx_price_break_chat_id ON price_break_requests(chat_id);
CREATE INDEX idx_price_break_status ON price_break_requests(status);
CREATE INDEX idx_price_break_created ON price_break_requests(created_at);
CREATE INDEX idx_price_break_service ON price_break_requests(service_type);

-- Enable RLS
ALTER TABLE price_break_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own price break requests"
    ON price_break_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create price break requests"
    ON price_break_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coordinators can view all requests"
    ON price_break_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND (subscription_tier = 'admin' OR metadata->>'is_coordinator' = 'true')
        )
    );

CREATE POLICY "Coordinators can update requests"
    ON price_break_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND (subscription_tier = 'admin' OR metadata->>'is_coordinator' = 'true')
        )
    );

CREATE POLICY "Service role can manage all"
    ON price_break_requests FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 2. UPDATE SUBSCRIPTION TIERS WITH NEW PRICING
-- =====================================================
-- Update existing tiers with new pricing structure
UPDATE subscription_tiers SET
    price_monthly_usd = 0,
    chats_limit = 1,
    features = '[
        "1 AI Conversation (lifetime)",
        "20 messages per chat",
        "Text Only",
        "Browse all services",
        "View prices"
    ]'::jsonb
WHERE id = 'explorer';

UPDATE subscription_tiers SET
    price_monthly_usd = 20,
    chats_limit = 15,
    features = '[
        "15 AI Conversations/month",
        "20 messages per chat",
        "Break the Price (costs 1 chat)",
        "Voice & Text Support",
        "Email Support"
    ]'::jsonb
WHERE id = 'starter';

UPDATE subscription_tiers SET
    price_monthly_usd = 40,
    chats_limit = 30,
    features = '[
        "30 AI Conversations/month",
        "20 messages per chat",
        "Break the Price (costs 1 chat)",
        "Priority Support",
        "Dedicated Manager"
    ]'::jsonb
WHERE id = 'pro';

UPDATE subscription_tiers SET
    price_monthly_usd = 130,
    chats_limit = NULL,
    features = '[
        "Unlimited AI Conversations",
        "Unlimited messages per chat",
        "Unlimited Break the Price",
        "24/7 Live Broker Assistance",
        "White Glove Treatment"
    ]'::jsonb
WHERE id = 'elite';

-- =====================================================
-- 3. SUBSCRIPTION CHECK FUNCTIONS
-- =====================================================

-- Function to check if user can start a new chat
CREATE OR REPLACE FUNCTION can_start_chat(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    -- Get user profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

    -- If no profile, user needs to create one first
    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'can_start', FALSE,
            'error', 'NO_PROFILE',
            'message', 'User profile not found'
        );
    END IF;

    -- Elite tier has unlimited chats
    IF v_profile.chats_limit IS NULL THEN
        RETURN jsonb_build_object(
            'can_start', TRUE,
            'unlimited', TRUE,
            'tier', v_profile.subscription_tier,
            'chats_used', v_profile.chats_used
        );
    END IF;

    -- Check if limit reached
    IF v_profile.chats_used >= v_profile.chats_limit THEN
        RETURN jsonb_build_object(
            'can_start', FALSE,
            'error', 'LIMIT_REACHED',
            'message', 'Monthly chat limit reached',
            'tier', v_profile.subscription_tier,
            'chats_used', v_profile.chats_used,
            'chats_limit', v_profile.chats_limit,
            'reset_date', v_profile.chats_reset_date
        );
    END IF;

    -- Can start
    RETURN jsonb_build_object(
        'can_start', TRUE,
        'unlimited', FALSE,
        'tier', v_profile.subscription_tier,
        'chats_used', v_profile.chats_used,
        'chats_limit', v_profile.chats_limit,
        'chats_remaining', v_profile.chats_limit - v_profile.chats_used
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get chat limits for a user
CREATE OR REPLACE FUNCTION get_chat_limits(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_tier RECORD;
BEGIN
    -- Get user profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'NO_PROFILE',
            'tier', 'explorer',
            'chats_limit', 1,
            'chats_used', 0,
            'messages_per_chat', 20,
            'break_the_price', FALSE
        );
    END IF;

    -- Get tier details
    SELECT * INTO v_tier FROM subscription_tiers WHERE id = v_profile.subscription_tier;

    RETURN jsonb_build_object(
        'tier', v_profile.subscription_tier,
        'tier_name', v_tier.name,
        'chats_limit', v_profile.chats_limit,
        'chats_used', v_profile.chats_used,
        'chats_remaining', CASE
            WHEN v_profile.chats_limit IS NULL THEN NULL
            ELSE v_profile.chats_limit - v_profile.chats_used
        END,
        'unlimited_chats', v_profile.chats_limit IS NULL,
        'messages_per_chat', CASE
            WHEN v_profile.subscription_tier = 'elite' THEN NULL
            ELSE 20
        END,
        'unlimited_messages', v_profile.subscription_tier = 'elite',
        'break_the_price', v_profile.subscription_tier IN ('starter', 'pro', 'elite'),
        'break_the_price_cost', CASE
            WHEN v_profile.subscription_tier = 'elite' THEN 0
            WHEN v_profile.subscription_tier IN ('starter', 'pro') THEN 1
            ELSE NULL
        END,
        'reset_date', v_profile.chats_reset_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use Break the Price (costs 1 chat for non-Elite)
CREATE OR REPLACE FUNCTION use_break_the_price(p_user_id UUID, p_chat_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    -- Get user profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

    -- Check if user has Break the Price access
    IF v_profile.subscription_tier NOT IN ('starter', 'pro', 'elite') THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NO_ACCESS',
            'message', 'Break the Price is not available on your plan. Upgrade to Starter or higher.'
        );
    END IF;

    -- Elite users get unlimited Break the Price
    IF v_profile.subscription_tier = 'elite' THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'cost', 0,
            'message', 'Break the Price used (Elite - unlimited)'
        );
    END IF;

    -- For Starter/Pro, check if they have chats remaining
    IF v_profile.chats_limit IS NOT NULL AND v_profile.chats_used >= v_profile.chats_limit THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NO_CHATS',
            'message', 'No chats remaining. Break the Price costs 1 chat.',
            'chats_used', v_profile.chats_used,
            'chats_limit', v_profile.chats_limit
        );
    END IF;

    -- Deduct 1 chat for using Break the Price
    UPDATE user_profiles
    SET chats_used = chats_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Get updated profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'cost', 1,
        'message', 'Break the Price used (1 chat deducted)',
        'chats_used', v_profile.chats_used,
        'chats_limit', v_profile.chats_limit,
        'chats_remaining', v_profile.chats_limit - v_profile.chats_used
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. STORAGE BUCKET FOR QUOTE FILES
-- =====================================================
-- Run this in Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('price-break-quotes', 'price-break-quotes', false);

-- Storage policies (run in Supabase dashboard):
-- CREATE POLICY "Users can upload quotes" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'price-break-quotes'
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );
--
-- CREATE POLICY "Users can view own quotes" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'price-break-quotes'
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
COMMENT ON TABLE price_break_requests IS 'Stores Break the Price quote submissions and coordinator responses';
COMMENT ON FUNCTION can_start_chat IS 'Check if user can start a new chat based on subscription limits';
COMMENT ON FUNCTION get_chat_limits IS 'Get all chat limit info for a user';
COMMENT ON FUNCTION use_break_the_price IS 'Deduct chat for Break the Price usage (free for Elite)';
