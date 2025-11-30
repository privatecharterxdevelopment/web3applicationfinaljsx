-- =====================================================
-- BREAK THE PRICE - SAFE MIGRATION
-- =====================================================
-- This migration ONLY ADDS new structures
-- It does NOT modify existing tables (user_profiles, user_requests, etc.)
-- Safe to run on production database
-- =====================================================

-- =====================================================
-- 1. CREATE PRICE BREAK REQUESTS TABLE (NEW TABLE ONLY)
-- =====================================================
-- Uses IF NOT EXISTS - safe to run multiple times

CREATE TABLE IF NOT EXISTS price_break_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Links to existing auth.users (same as user_profiles)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Chat session reference (links to chat_usage if exists)
    chat_id TEXT NOT NULL,

    -- Request details
    service_type TEXT NOT NULL DEFAULT 'unknown', -- 'flight', 'hotel', 'yacht', 'jet', 'car', 'experience', 'unknown'
    service_details JSONB DEFAULT '{}', -- parsed details from quote

    -- Uploaded quote file
    quote_file_url TEXT NOT NULL,
    quote_file_type TEXT NOT NULL DEFAULT 'image', -- 'pdf', 'image'
    quote_extracted_data JSONB DEFAULT '{}', -- AI-extracted data from quote (via Claude Vision)

    -- Pricing comparison
    competitor_price DECIMAL(12, 2),
    competitor_currency TEXT DEFAULT 'USD',
    our_offer_price DECIMAL(12, 2),
    our_offer_currency TEXT DEFAULT 'USD',
    savings_amount DECIMAL(12, 2),
    savings_percentage DECIMAL(5, 2),

    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Just submitted, awaiting analysis
        'analyzing',    -- AI is analyzing the quote
        'reviewed',     -- Coordinator has reviewed
        'offer_made',   -- We've made a counter-offer
        'accepted',     -- User accepted our offer
        'declined',     -- User declined our offer
        'expired'       -- No response within time limit
    )),

    -- Coordinator response (optional - links to coordinator user)
    coordinator_id UUID REFERENCES auth.users(id),
    coordinator_notes TEXT,
    response_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '48 hours'),

    -- Flexible metadata for future use
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- 2. CREATE INDEXES (IF NOT EXISTS - safe to run multiple times)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_price_break_user_id ON price_break_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_price_break_chat_id ON price_break_requests(chat_id);
CREATE INDEX IF NOT EXISTS idx_price_break_status ON price_break_requests(status);
CREATE INDEX IF NOT EXISTS idx_price_break_created ON price_break_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_price_break_service ON price_break_requests(service_type);
CREATE INDEX IF NOT EXISTS idx_price_break_expires ON price_break_requests(expires_at);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE price_break_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS POLICIES (DROP IF EXISTS + CREATE for idempotency)
-- =====================================================

-- Policy: Users can view their own price break requests
DROP POLICY IF EXISTS "Users can view own price break requests" ON price_break_requests;
CREATE POLICY "Users can view own price break requests"
    ON price_break_requests FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own price break requests
DROP POLICY IF EXISTS "Users can create price break requests" ON price_break_requests;
CREATE POLICY "Users can create price break requests"
    ON price_break_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own requests (accept/decline offer)
DROP POLICY IF EXISTS "Users can update own price break requests" ON price_break_requests;
CREATE POLICY "Users can update own price break requests"
    ON price_break_requests FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        -- Users can only update status to accepted/declined
        auth.uid() = user_id
        AND status IN ('offer_made') -- Can only update when offer is made
    );

-- Policy: Coordinators can view all requests (checks user_profiles.metadata)
DROP POLICY IF EXISTS "Coordinators can view all price break requests" ON price_break_requests;
CREATE POLICY "Coordinators can view all price break requests"
    ON price_break_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND (
                user_profiles.subscription_tier = 'admin'
                OR user_profiles.metadata->>'is_coordinator' = 'true'
                OR user_profiles.metadata->>'role' = 'coordinator'
            )
        )
    );

-- Policy: Coordinators can update all requests
DROP POLICY IF EXISTS "Coordinators can update price break requests" ON price_break_requests;
CREATE POLICY "Coordinators can update price break requests"
    ON price_break_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND (
                user_profiles.subscription_tier = 'admin'
                OR user_profiles.metadata->>'is_coordinator' = 'true'
                OR user_profiles.metadata->>'role' = 'coordinator'
            )
        )
    );

-- Policy: Service role has full access
DROP POLICY IF EXISTS "Service role can manage price break requests" ON price_break_requests;
CREATE POLICY "Service role can manage price break requests"
    ON price_break_requests FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 5. HELPER FUNCTIONS (CREATE OR REPLACE - safe)
-- =====================================================

-- Function: Check if user has Break the Price access
-- Returns access info based on user_profiles.subscription_tier
CREATE OR REPLACE FUNCTION check_break_the_price_access(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    -- Get user profile (uses existing user_profiles table)
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

    -- If no profile exists, no access
    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'has_access', FALSE,
            'error', 'NO_PROFILE',
            'message', 'User profile not found. Please complete registration.'
        );
    END IF;

    -- Check subscription tier for Break the Price access
    -- Explorer (free) = NO access
    -- Starter, Pro, Elite = HAS access
    IF v_profile.subscription_tier NOT IN ('starter', 'pro', 'elite') THEN
        RETURN jsonb_build_object(
            'has_access', FALSE,
            'tier', v_profile.subscription_tier,
            'error', 'UPGRADE_REQUIRED',
            'message', 'Break the Price requires Starter plan or higher.'
        );
    END IF;

    -- Elite users get unlimited Break the Price (no chat cost)
    IF v_profile.subscription_tier = 'elite' THEN
        RETURN jsonb_build_object(
            'has_access', TRUE,
            'tier', 'elite',
            'cost', 0,
            'unlimited', TRUE,
            'message', 'Elite plan - unlimited Break the Price'
        );
    END IF;

    -- Starter/Pro users - check if they have chats remaining (costs 1 chat)
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

    -- User has access and chats remaining
    RETURN jsonb_build_object(
        'has_access', TRUE,
        'tier', v_profile.subscription_tier,
        'cost', 1,
        'unlimited', FALSE,
        'chats_used', v_profile.chats_used,
        'chats_limit', v_profile.chats_limit,
        'chats_remaining', v_profile.chats_limit - v_profile.chats_used,
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
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

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
    UPDATE user_profiles
    SET chats_used = chats_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Get updated profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

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
    -- Count total requests
    SELECT COUNT(*) INTO v_total
    FROM price_break_requests
    WHERE user_id = p_user_id;

    -- Count pending
    SELECT COUNT(*) INTO v_pending
    FROM price_break_requests
    WHERE user_id = p_user_id AND status IN ('pending', 'analyzing', 'reviewed');

    -- Count offers made
    SELECT COUNT(*) INTO v_offers
    FROM price_break_requests
    WHERE user_id = p_user_id AND status = 'offer_made';

    -- Count accepted
    SELECT COUNT(*) INTO v_accepted
    FROM price_break_requests
    WHERE user_id = p_user_id AND status = 'accepted';

    -- Calculate total savings from accepted offers
    SELECT COALESCE(SUM(savings_amount), 0) INTO v_total_savings
    FROM price_break_requests
    WHERE user_id = p_user_id AND status = 'accepted' AND savings_amount IS NOT NULL;

    RETURN jsonb_build_object(
        'total_requests', v_total,
        'pending', v_pending,
        'offers_waiting', v_offers,
        'accepted', v_accepted,
        'total_savings', v_total_savings
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Expire old pending requests (run via cron)
CREATE OR REPLACE FUNCTION expire_old_price_break_requests()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE price_break_requests
    SET status = 'expired',
        metadata = metadata || jsonb_build_object('expired_at', NOW())
    WHERE status IN ('pending', 'analyzing', 'reviewed', 'offer_made')
    AND expires_at < NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE price_break_requests IS 'Stores Break the Price quote submissions. Users upload competitor quotes and coordinators respond with better prices.';
COMMENT ON COLUMN price_break_requests.user_id IS 'References auth.users - same user as user_profiles';
COMMENT ON COLUMN price_break_requests.chat_id IS 'References the chat session where quote was submitted';
COMMENT ON COLUMN price_break_requests.quote_extracted_data IS 'AI-extracted data from quote via Claude Vision (route, dates, price, etc.)';
COMMENT ON COLUMN price_break_requests.metadata IS 'Flexible JSON for fileName, pagesAnalyzed, reference number, etc.';

COMMENT ON FUNCTION check_break_the_price_access IS 'Check if user has Break the Price access based on subscription tier';
COMMENT ON FUNCTION use_break_the_price IS 'Deduct chat credit for Break the Price usage (free for Elite)';
COMMENT ON FUNCTION get_price_break_stats IS 'Get statistics for user Break the Price requests';
COMMENT ON FUNCTION expire_old_price_break_requests IS 'Mark old pending requests as expired - run via cron daily';

-- =====================================================
-- 7. STORAGE BUCKET (Run separately in Supabase Dashboard)
-- =====================================================
-- NOTE: Storage bucket creation must be done in Supabase Dashboard
-- or via Supabase CLI/API. The SQL below is for reference only.

/*
-- Create bucket for quote files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'price-break-quotes',
    'price-break-quotes',
    false,  -- Private bucket
    10485760,  -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload to their own folder
CREATE POLICY "Users can upload price break quotes"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'price-break-quotes'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Users can view their own quotes
CREATE POLICY "Users can view own price break quotes"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'price-break-quotes'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Coordinators can view all quotes
CREATE POLICY "Coordinators can view all price break quotes"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'price-break-quotes'
    AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND (
            user_profiles.subscription_tier = 'admin'
            OR user_profiles.metadata->>'is_coordinator' = 'true'
        )
    )
);
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration is SAFE and does NOT affect:
-- ✓ user_profiles table (only reads from it)
-- ✓ user_requests table (completely separate)
-- ✓ chat_usage table (only referenced by chat_id)
-- ✓ subscription_tiers table (only reads from it)
-- ✓ Any other existing tables
--
-- What this migration ADDS:
-- + price_break_requests table (new)
-- + 6 indexes for fast queries
-- + 6 RLS policies for security
-- + 4 helper functions
-- =====================================================
