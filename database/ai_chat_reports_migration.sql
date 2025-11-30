-- =====================================================
-- AI CHAT REPORTS TABLE - User Issue Reporting
-- =====================================================
-- Allows users to report issues during AI chat sessions
-- Includes star rating, message, and chat context
-- =====================================================

-- =====================================================
-- 1. CREATE AI CHAT REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_chat_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- User information
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_email TEXT,
    user_name TEXT,

    -- Chat session reference
    chat_id TEXT,

    -- Report details
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    message TEXT NOT NULL,

    -- Context from the chat (last few messages)
    chat_context JSONB DEFAULT '[]',

    -- Admin handling
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES
-- =====================================================
CREATE INDEX idx_ai_chat_reports_user_id ON ai_chat_reports(user_id);
CREATE INDEX idx_ai_chat_reports_chat_id ON ai_chat_reports(chat_id);
CREATE INDEX idx_ai_chat_reports_status ON ai_chat_reports(status);
CREATE INDEX idx_ai_chat_reports_rating ON ai_chat_reports(rating);
CREATE INDEX idx_ai_chat_reports_created_at ON ai_chat_reports(created_at);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE ai_chat_reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
    ON ai_chat_reports FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports"
    ON ai_chat_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
    ON ai_chat_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Admins can update reports (for status changes, notes)
CREATE POLICY "Admins can update reports"
    ON ai_chat_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Service role full access
CREATE POLICY "Service role can manage reports"
    ON ai_chat_reports FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 5. AUTO-UPDATE TIMESTAMP TRIGGER
-- =====================================================
CREATE TRIGGER update_ai_chat_reports_updated_at
    BEFORE UPDATE ON ai_chat_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Get report statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_ai_chat_report_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_reports', COUNT(*),
        'pending_reports', COUNT(*) FILTER (WHERE status = 'pending'),
        'in_progress_reports', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'resolved_reports', COUNT(*) FILTER (WHERE status = 'resolved'),
        'dismissed_reports', COUNT(*) FILTER (WHERE status = 'dismissed'),
        'average_rating', ROUND(AVG(rating)::numeric, 2),
        'reports_today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'reports_this_week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')
    ) INTO result
    FROM ai_chat_reports;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE ai_chat_reports IS 'User-submitted issue reports from AI chat sessions with ratings and context';
