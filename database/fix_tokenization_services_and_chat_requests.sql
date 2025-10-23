-- =====================================================
-- FIX: Tokenization Services Table & Chat Requests System
-- This fixes the admin policy error and creates proper chat requests
-- =====================================================

-- ========================================
-- PART 1: Fix Tokenization Services Table
-- ========================================

-- Drop the broken admin policy that references non-existent user_profiles.role column
DROP POLICY IF EXISTS "Admins can manage tokenization services" ON public.tokenization_services;

-- Recreate correct admin policy using users.is_admin instead
CREATE POLICY "Admins can manage tokenization services"
ON public.tokenization_services
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.is_admin = true
    )
);

-- ========================================
-- PART 2: Create Chat Requests Table
-- ========================================

-- Drop table if exists (clean slate)
DROP TABLE IF EXISTS public.chat_requests CASCADE;

-- Create chat_requests table for storing ALL user requests from Sphera AI Chat
CREATE TABLE public.chat_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Original Request Info
    query TEXT NOT NULL, -- Original user question/request
    confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Extracted Search Parameters
    service_type TEXT, -- 'jets', 'empty_legs', 'helicopters', 'yachts', 'luxury_cars', 'tokenization'
    from_location TEXT,
    to_location TEXT,
    date_start DATE,
    date_end DATE,
    passengers INTEGER,
    budget DECIMAL(12, 2),
    pets INTEGER DEFAULT 0,
    special_requirements TEXT,
    
    -- Conversation Context
    conversation_history JSONB, -- Full chat conversation as JSON array
    
    -- Search Results
    has_results BOOLEAN DEFAULT FALSE,
    results_count INTEGER DEFAULT 0,
    results_summary JSONB, -- Summary of results found by category
    
    -- Cart Items (if user added items to cart)
    cart_items JSONB, -- Array of bookable items user selected
    cart_total DECIMAL(12, 2),
    
    -- Request Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES auth.users(id), -- Admin who's handling this
    notes TEXT, -- Admin notes
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_requests_user_id ON public.chat_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_status ON public.chat_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_created_at ON public.chat_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_requests_service_type ON public.chat_requests(service_type);
CREATE INDEX IF NOT EXISTS idx_chat_requests_has_results ON public.chat_requests(has_results);

-- Enable Row Level Security
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own requests
CREATE POLICY "Users can view own chat requests"
    ON public.chat_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own requests
CREATE POLICY "Users can create chat requests"
    ON public.chat_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own requests
CREATE POLICY "Users can update own chat requests"
    ON public.chat_requests
    FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all requests
CREATE POLICY "Admins can view all chat requests"
    ON public.chat_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- RLS Policy: Admins can manage all requests
CREATE POLICY "Admins can manage all chat requests"
    ON public.chat_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_chat_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_requests_updated_at_trigger
    BEFORE UPDATE ON public.chat_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_requests_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.chat_requests IS 'Stores ALL user travel requests from Sphera AI chat (with and without results)';
COMMENT ON COLUMN public.chat_requests.query IS 'Original user query in natural language';
COMMENT ON COLUMN public.chat_requests.confidence_score IS 'AI confidence score for extracted intent (0-100)';
COMMENT ON COLUMN public.chat_requests.conversation_history IS 'Full conversation history as JSON';
COMMENT ON COLUMN public.chat_requests.has_results IS 'Whether the search found matching results';
COMMENT ON COLUMN public.chat_requests.results_count IS 'Total number of results found';
COMMENT ON COLUMN public.chat_requests.results_summary IS 'Summary of results by category (JSON)';
COMMENT ON COLUMN public.chat_requests.cart_items IS 'Items user added to cart (JSON array)';
COMMENT ON COLUMN public.chat_requests.status IS 'Request status: pending (awaiting review), in_progress (team working), completed, cancelled';

-- ========================================
-- PART 3: Helper Functions
-- ========================================

-- Function to get user's recent chat requests
CREATE OR REPLACE FUNCTION get_user_recent_chat_requests(
    user_uuid UUID,
    request_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    query TEXT,
    service_type TEXT,
    from_location TEXT,
    to_location TEXT,
    passengers INTEGER,
    has_results BOOLEAN,
    results_count INTEGER,
    cart_total DECIMAL,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.query,
        cr.service_type,
        cr.from_location,
        cr.to_location,
        cr.passengers,
        cr.has_results,
        cr.results_count,
        cr.cart_total,
        cr.status,
        cr.created_at
    FROM public.chat_requests cr
    WHERE cr.user_id = user_uuid
    ORDER BY cr.created_at DESC
    LIMIT request_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count pending requests for user
CREATE OR REPLACE FUNCTION count_pending_chat_requests(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    pending_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pending_count
    FROM public.chat_requests
    WHERE user_id = user_uuid
    AND status = 'pending';
    
    RETURN COALESCE(pending_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Success Message
-- ========================================
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Database migration completed successfully!';
    RAISE NOTICE '   - Fixed tokenization_services admin policy';
    RAISE NOTICE '   - Created chat_requests table with RLS';
    RAISE NOTICE '   - Added helper functions';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '   1. Update AIChat.jsx to save requests to Supabase';
    RAISE NOTICE '   2. Add Chat Requests to dashboard sidebar';
    RAISE NOTICE '   3. Test by making a request in Sphera AI chat';
END $$;
