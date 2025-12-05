-- =====================================================
-- FIX ELTESTO ELITE SUBSCRIPTION
-- =====================================================
-- Run this in Supabase SQL Editor to grant elite subscription to eltesto@gmail.com
-- and fix the subscription tier chat limits

-- =====================================================
-- 1. FIX SUBSCRIPTION TIERS CHAT LIMITS
-- =====================================================
-- Update to match Subscriptionplans.jsx pricing:
-- Explorer: 1 chat (free), Starter: 5 chats ($20), Pro: 20 chats ($40), Elite: unlimited ($130)

UPDATE subscription_tiers
SET chats_limit = 1, price_monthly_usd = 0, features = '["1 AI Conversation (lifetime)", "20 messages per chat", "Text Only", "Browse all services"]'
WHERE id = 'explorer';

UPDATE subscription_tiers
SET chats_limit = 5, price_monthly_usd = 20, features = '["5 AI Conversations/month", "50 messages per chat", "Break the Price feature", "Email Support"]'
WHERE id = 'starter';

UPDATE subscription_tiers
SET chats_limit = 20, price_monthly_usd = 40, features = '["20 AI Conversations/month", "100 messages per chat", "Break the Price feature", "Priority Support", "Dedicated Manager"]'
WHERE id = 'pro';

UPDATE subscription_tiers
SET chats_limit = NULL, price_monthly_usd = 130, features = '["Unlimited AI Conversations", "Unlimited messages per chat", "Unlimited Break the Price", "24/7 Concierge Service"]'
WHERE id = 'elite';

-- =====================================================
-- 2. GRANT ELITE TO ELTESTO@GMAIL.COM
-- =====================================================
-- First, find the user ID for eltesto@gmail.com

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'eltesto@gmail.com'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User eltesto@gmail.com not found in auth.users';
        RETURN;
    END IF;

    RAISE NOTICE 'Found user eltesto@gmail.com with ID: %', v_user_id;

    -- Upsert user_profiles with elite subscription
    INSERT INTO user_profiles (
        user_id,
        email,
        subscription_tier,
        subscription_status,
        chats_limit,
        chats_used,
        chats_reset_date,
        updated_at
    ) VALUES (
        v_user_id,
        'eltesto@gmail.com',
        'elite',
        'active',
        NULL,  -- NULL = unlimited for elite
        0,
        NULL,  -- No reset date for elite (unlimited)
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        subscription_tier = 'elite',
        subscription_status = 'active',
        chats_limit = NULL,
        chats_used = 0,
        updated_at = NOW();

    RAISE NOTICE 'Successfully granted ELITE subscription to eltesto@gmail.com!';
END $$;

-- =====================================================
-- 3. VERIFY THE UPDATE
-- =====================================================
-- Check the user_profiles for eltesto

SELECT
    up.user_id,
    up.email,
    up.subscription_tier,
    up.subscription_status,
    up.chats_limit,
    up.chats_used,
    CASE WHEN up.chats_limit IS NULL THEN 'UNLIMITED' ELSE up.chats_limit::TEXT END as chats_display
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'eltesto@gmail.com';

-- Verify subscription_tiers are correct
SELECT id, name, price_monthly_usd, chats_limit,
       CASE WHEN chats_limit IS NULL THEN 'UNLIMITED' ELSE chats_limit::TEXT END as chats_display
FROM subscription_tiers
ORDER BY price_monthly_usd;

-- =====================================================
-- DONE!
-- =====================================================
-- After running this:
-- 1. eltesto@gmail.com will have ELITE subscription with unlimited chats
-- 2. Subscription tiers will be: Explorer=1, Starter=5, Pro=20, Elite=unlimited
-- 3. Refresh the app or sign out/in for eltesto to see the changes
