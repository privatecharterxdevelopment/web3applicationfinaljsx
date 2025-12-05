-- =====================================================
-- ENABLE REALTIME REPLICATION FOR KEY TABLES
-- =====================================================
-- This enables Supabase Realtime so the app can receive
-- live updates when data changes (subscriptions, transactions, etc.)
-- =====================================================

-- =====================================================
-- 1. ENABLE REPLICATION FOR user_profiles
-- =====================================================
-- This is the single source of truth for subscription data
-- When Stripe webhook updates subscription, UI should update instantly

ALTER TABLE user_profiles REPLICA IDENTITY FULL;

-- Add to realtime publication (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'user_profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
        RAISE NOTICE 'Added user_profiles to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'user_profiles already in supabase_realtime publication';
    END IF;
END $$;

-- =====================================================
-- 2. ENABLE REPLICATION FOR wallet_transactions
-- =====================================================
-- For real-time transaction updates on profile/dashboard

-- First check if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
        ALTER TABLE wallet_transactions REPLICA IDENTITY FULL;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND tablename = 'wallet_transactions'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE wallet_transactions;
            RAISE NOTICE 'Added wallet_transactions to supabase_realtime publication';
        ELSE
            RAISE NOTICE 'wallet_transactions already in supabase_realtime publication';
        END IF;
    ELSE
        RAISE NOTICE 'wallet_transactions table does not exist';
    END IF;
END $$;

-- =====================================================
-- 3. ENABLE REPLICATION FOR subscription_transactions
-- =====================================================
-- For tracking subscription payment history

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_transactions') THEN
        ALTER TABLE subscription_transactions REPLICA IDENTITY FULL;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND tablename = 'subscription_transactions'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE subscription_transactions;
            RAISE NOTICE 'Added subscription_transactions to supabase_realtime publication';
        ELSE
            RAISE NOTICE 'subscription_transactions already in supabase_realtime publication';
        END IF;
    ELSE
        RAISE NOTICE 'subscription_transactions table does not exist - creating it';

        CREATE TABLE subscription_transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('subscription_created', 'subscription_updated', 'subscription_renewed', 'subscription_canceled', 'payment_succeeded', 'payment_failed', 'refund')),
            tier TEXT NOT NULL,
            amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
            currency TEXT DEFAULT 'USD',
            stripe_subscription_id TEXT,
            stripe_invoice_id TEXT,
            stripe_payment_intent_id TEXT,
            status TEXT DEFAULT 'completed',
            period_start TIMESTAMP WITH TIME ZONE,
            period_end TIMESTAMP WITH TIME ZONE,
            description TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_subscription_transactions_user ON subscription_transactions(user_id);
        CREATE INDEX idx_subscription_transactions_created ON subscription_transactions(created_at);

        ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own subscription transactions"
            ON subscription_transactions FOR SELECT
            USING (auth.uid() = user_id);

        ALTER TABLE subscription_transactions REPLICA IDENTITY FULL;
        ALTER PUBLICATION supabase_realtime ADD TABLE subscription_transactions;

        RAISE NOTICE 'Created subscription_transactions table with replication enabled';
    END IF;
END $$;

-- =====================================================
-- 4. ENABLE REPLICATION FOR chat_requests (if exists)
-- =====================================================
-- For real-time booking request updates

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_requests') THEN
        ALTER TABLE chat_requests REPLICA IDENTITY FULL;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND tablename = 'chat_requests'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE chat_requests;
            RAISE NOTICE 'Added chat_requests to supabase_realtime publication';
        ELSE
            RAISE NOTICE 'chat_requests already in supabase_realtime publication';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 5. VERIFY REPLICATION STATUS
-- =====================================================

SELECT
    schemaname,
    tablename,
    'ENABLED' as realtime_status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- =====================================================
-- DONE!
-- =====================================================
-- After running this:
-- 1. user_profiles changes will broadcast to all connected clients
-- 2. wallet_transactions changes will broadcast in real-time
-- 3. subscription_transactions will track payment history
-- 4. chat_requests will update in real-time
--
-- The frontend AuthContext already has real-time listeners set up
-- for user_profiles, so subscription upgrades/downgrades will
-- automatically update the UI without page refresh.
-- =====================================================
