-- =====================================================
-- SUBSCRIPTION & NFT BENEFITS DATABASE MIGRATION
-- =====================================================
-- This migration creates all tables needed for:
-- 1. Stripe subscription system
-- 2. NFT benefits tracking
-- 3. Google Calendar integration
-- 4. Enhanced referral system
-- =====================================================

-- =====================================================
-- 1. USER SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    
    -- Subscription details
    tier TEXT NOT NULL CHECK (tier IN ('explorer', 'starter', 'professional', 'elite', 'nft')),
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')),
    
    -- Pricing
    price_eur DECIMAL(10, 2),
    commission_rate DECIMAL(5, 4), -- e.g., 0.1500 = 15%
    
    -- Dates
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(tier);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
    ON user_subscriptions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. NFT BENEFITS USED TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nft_benefits_used (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- NFT details
    wallet_address TEXT NOT NULL,
    nft_token_id TEXT NOT NULL,
    
    -- Service details
    service_id TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('flight', 'jet', 'yacht', 'car', 'helicopter', 'hotel', 'event')),
    service_name TEXT NOT NULL,
    service_value DECIMAL(10, 2) NOT NULL,
    
    -- Tracking
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    booking_reference TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Ensure each NFT can only be used once
    UNIQUE(nft_token_id)
);

-- Indexes
CREATE INDEX idx_nft_benefits_user_id ON nft_benefits_used(user_id);
CREATE INDEX idx_nft_benefits_wallet ON nft_benefits_used(wallet_address);
CREATE INDEX idx_nft_benefits_token_id ON nft_benefits_used(nft_token_id);
CREATE INDEX idx_nft_benefits_used_at ON nft_benefits_used(used_at);

-- Enable RLS
ALTER TABLE nft_benefits_used ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own NFT benefits"
    ON nft_benefits_used FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own NFT benefits"
    ON nft_benefits_used FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all NFT benefits"
    ON nft_benefits_used FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- =====================================================
-- 3. CALENDAR EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Google Calendar details
    google_calendar_id TEXT,
    google_event_id TEXT,
    
    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    location TEXT,
    
    -- Link to booking
    booking_reference TEXT,
    service_type TEXT,
    chat_request_id UUID REFERENCES chat_requests(id) ON DELETE SET NULL,
    
    -- Status
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'pending')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_google_id ON calendar_events(google_event_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_booking_ref ON calendar_events(booking_reference);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own calendar events"
    ON calendar_events FOR ALL
    USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. REFERRALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Referrer (person who sent invite)
    referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referrer_wallet TEXT,
    
    -- Referee (person who signed up)
    referee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referee_email TEXT,
    referee_wallet TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded', 'expired')),
    
    -- Rewards
    reward_type TEXT CHECK (reward_type IN ('chat_credits', 'discount_percentage', 'free_month')),
    reward_value DECIMAL(10, 2),
    reward_claimed_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking
    referral_code TEXT UNIQUE NOT NULL,
    signed_up_at TIMESTAMP WITH TIME ZONE,
    first_purchase_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referee ON referrals(referee_user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own referrals (as referrer)"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can view own referrals (as referee)"
    ON referrals FOR SELECT
    USING (auth.uid() = referee_user_id);

CREATE POLICY "Users can insert referrals"
    ON referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "Admins can view all referrals"
    ON referrals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Auto-update timestamp
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Get user's current subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    sub_tier TEXT;
BEGIN
    SELECT tier INTO sub_tier
    FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    LIMIT 1;
    
    RETURN COALESCE(sub_tier, 'explorer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's commission rate
CREATE OR REPLACE FUNCTION get_user_commission_rate(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    rate DECIMAL;
BEGIN
    SELECT commission_rate INTO rate
    FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    LIMIT 1;
    
    -- Default to 20% for explorer tier
    RETURN COALESCE(rate, 0.20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Count remaining NFT free benefits
CREATE OR REPLACE FUNCTION count_remaining_nft_benefits(wallet_addr TEXT)
RETURNS INTEGER AS $$
DECLARE
    total_nfts INTEGER;
    used_benefits INTEGER;
BEGIN
    -- This is a placeholder - you'll need to integrate with your web3Service
    -- For now, return 0 if any benefits have been used
    SELECT COUNT(*) INTO used_benefits
    FROM nft_benefits_used
    WHERE wallet_address = wallet_addr;
    
    -- Assuming 1 NFT = 1 benefit for now
    -- You can update this based on actual NFT count from blockchain
    IF used_benefits > 0 THEN
        RETURN 0;
    ELSE
        RETURN 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get referral stats for user
CREATE OR REPLACE FUNCTION get_referral_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_referrals', COUNT(*),
        'completed_referrals', COUNT(*) FILTER (WHERE status = 'completed'),
        'rewarded_referrals', COUNT(*) FILTER (WHERE status = 'rewarded'),
        'pending_referrals', COUNT(*) FILTER (WHERE status = 'pending'),
        'total_rewards_earned', COALESCE(SUM(reward_value) FILTER (WHERE reward_claimed_at IS NOT NULL), 0)
    ) INTO result
    FROM referrals
    WHERE referrer_user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment below to add test subscription for current user
/*
INSERT INTO user_subscriptions (
    user_id,
    tier,
    status,
    billing_cycle,
    price_eur,
    commission_rate,
    current_period_start,
    current_period_end
) VALUES (
    auth.uid(),
    'professional',
    'active',
    'monthly',
    149.00,
    0.1200,
    NOW(),
    NOW() + INTERVAL '1 month'
) ON CONFLICT (user_id) DO NOTHING;
*/

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Run these after migration to verify:
-- SELECT * FROM user_subscriptions;
-- SELECT * FROM nft_benefits_used;
-- SELECT * FROM calendar_events;
-- SELECT * FROM referrals;
-- SELECT get_user_subscription_tier(auth.uid());
-- SELECT get_user_commission_rate(auth.uid());
-- SELECT get_referral_stats(auth.uid());

COMMENT ON TABLE user_subscriptions IS 'Stores Stripe subscription data and user tier information';
COMMENT ON TABLE nft_benefits_used IS 'Tracks which NFTs have redeemed their one-time free service (≤$1,500)';
COMMENT ON TABLE calendar_events IS 'Google Calendar integration for booking management';
COMMENT ON TABLE referrals IS 'Referral program tracking with rewards';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Configure Stripe products (Starter, Professional, Elite)
-- 3. Set up Stripe webhooks
-- 4. Configure Google Calendar OAuth
-- 5. Update environment variables
-- =====================================================
