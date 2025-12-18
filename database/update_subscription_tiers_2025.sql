-- =====================================================
-- UPDATE SUBSCRIPTION TIERS - 2025 PRICING
-- =====================================================
-- New tiers: Explorer ($49), Traveller ($99), Elite ($399)
-- All tiers require subscription - no free tier
-- =====================================================

-- First, update the user_profiles table to allow new tier values
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_subscription_tier_check;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_subscription_tier_check
CHECK (subscription_tier IN ('explorer', 'traveller', 'elite') OR subscription_tier IS NULL);

-- Update the subscription_tiers table
DELETE FROM subscription_tiers;

INSERT INTO subscription_tiers (id, name, description, price_monthly_usd, chats_limit, features, active) VALUES
(
    'explorer',
    'Explorer',
    'Get started with luxury travel AI',
    49,
    5,
    '[
        "5 AI Chats/month",
        "10 Messages/chat",
        "Empty Legs Access",
        "Restaurant Reservations",
        "Ground Transport",
        "Delicacies & Cigars",
        "Winery Access",
        "Catering Services",
        "Luxury Travel Designer",
        "Email Support"
    ]',
    TRUE
),
(
    'traveller',
    'Traveller',
    'Most popular for regular travelers',
    99,
    10,
    '[
        "10 AI Chats/month",
        "25 Messages/chat",
        "All Explorer features",
        "MEDEVAC Services",
        "Concierge Services",
        "Group Charter",
        "Event Booking",
        "Break the Price",
        "Priority Support"
    ]',
    TRUE
),
(
    'elite',
    'Elite Club',
    'Unlimited VIP access',
    399,
    NULL,
    '[
        "Unlimited Chats",
        "Unlimited Messages/chat",
        "All Traveller features",
        "2 Free Airport Transfers/month",
        "MembershipX Card",
        "VIP Event Invites",
        "24/7 Phone Support"
    ]',
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly_usd = EXCLUDED.price_monthly_usd,
    chats_limit = EXCLUDED.chats_limit,
    features = EXCLUDED.features,
    active = EXCLUDED.active;

-- Update the user_profiles default values for new subscriptions
-- New users start with NO subscription (must subscribe to use AI)
ALTER TABLE user_profiles
ALTER COLUMN subscription_tier DROP DEFAULT;

ALTER TABLE user_profiles
ALTER COLUMN subscription_status SET DEFAULT 'inactive';

ALTER TABLE user_profiles
ALTER COLUMN chats_limit SET DEFAULT 0;

-- Create function to set up new subscription
CREATE OR REPLACE FUNCTION setup_subscription(
    p_user_id UUID,
    p_tier TEXT,
    p_stripe_customer_id TEXT DEFAULT NULL,
    p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_tier_config RECORD;
    v_profile RECORD;
BEGIN
    -- Get tier configuration
    SELECT * INTO v_tier_config FROM subscription_tiers WHERE id = p_tier;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Invalid tier');
    END IF;

    -- Update or insert user profile
    INSERT INTO user_profiles (
        user_id,
        subscription_tier,
        subscription_status,
        chats_limit,
        chats_used,
        chats_reset_date,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_start,
        current_period_end
    ) VALUES (
        p_user_id,
        p_tier,
        'active',
        v_tier_config.chats_limit,
        0,
        NOW() + INTERVAL '1 month',
        p_stripe_customer_id,
        p_stripe_subscription_id,
        NOW(),
        NOW() + INTERVAL '1 month'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        subscription_tier = p_tier,
        subscription_status = 'active',
        chats_limit = v_tier_config.chats_limit,
        chats_used = 0,
        chats_reset_date = NOW() + INTERVAL '1 month',
        stripe_customer_id = COALESCE(p_stripe_customer_id, user_profiles.stripe_customer_id),
        stripe_subscription_id = COALESCE(p_stripe_subscription_id, user_profiles.stripe_subscription_id),
        current_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW();

    -- Get updated profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'tier', v_profile.subscription_tier,
        'chats_limit', v_profile.chats_limit,
        'chats_used', v_profile.chats_used,
        'status', v_profile.subscription_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION setup_subscription(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Update increment_chat_usage to handle null (no subscription) case
CREATE OR REPLACE FUNCTION increment_chat_usage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    -- Get current profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

    -- Check if user has a profile
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NO_SUBSCRIPTION',
            'message', 'Subscription required to use AI chat'
        );
    END IF;

    -- Check if subscription is active
    IF v_profile.subscription_status != 'active' OR v_profile.subscription_tier IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NO_SUBSCRIPTION',
            'message', 'Active subscription required to use AI chat'
        );
    END IF;

    -- Check if chat limit reached (NULL means unlimited for Elite)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_chat_usage(UUID) TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify:
-- SELECT * FROM subscription_tiers;
-- SELECT * FROM user_profiles WHERE subscription_tier IS NOT NULL;
