-- Create chat_requests table for storing ALL user requests from AI chat
CREATE TABLE IF NOT EXISTS chat_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    service_type TEXT,
    from_location TEXT,
    to_location TEXT,
    date_start DATE,
    date_end DATE,
    passengers INTEGER,
    budget DECIMAL(10, 2),
    pets INTEGER DEFAULT 0,
    special_requirements TEXT,
    confidence_score INTEGER,
    conversation_history JSONB,
    has_results BOOLEAN DEFAULT FALSE,
    results_count INTEGER DEFAULT 0,
    results_summary JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_to UUID,
    notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_requests_user_id ON chat_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_status ON chat_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_created_at ON chat_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_requests_service_type ON chat_requests(service_type);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own chat requests"
    ON chat_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own requests
CREATE POLICY "Users can create chat requests"
    ON chat_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own requests
CREATE POLICY "Users can update own chat requests"
    ON chat_requests
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
CREATE TRIGGER chat_requests_updated_at_trigger
    BEFORE UPDATE ON chat_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_requests_updated_at();

-- Comments for documentation
COMMENT ON TABLE chat_requests IS 'Stores ALL user travel requests from AI chat (both with and without results)';
COMMENT ON COLUMN chat_requests.query IS 'Original user query in natural language';
COMMENT ON COLUMN chat_requests.service_type IS 'Type of service requested (jets, helicopters, etc.)';
COMMENT ON COLUMN chat_requests.confidence_score IS 'AI confidence score for extracted intent (0-100)';
COMMENT ON COLUMN chat_requests.conversation_history IS 'Full conversation history as JSON';
COMMENT ON COLUMN chat_requests.has_results IS 'Whether the search found matching results';
COMMENT ON COLUMN chat_requests.results_count IS 'Total number of results found';
COMMENT ON COLUMN chat_requests.results_summary IS 'Summary of results by category (JSON)';
COMMENT ON COLUMN chat_requests.status IS 'Request status: pending (no results), in_progress (team working on it), completed (resolved), cancelled';
