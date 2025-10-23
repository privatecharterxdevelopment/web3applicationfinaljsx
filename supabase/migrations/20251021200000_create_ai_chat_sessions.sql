-- AI Chat Sessions Table
-- Stores user chat conversations with AI

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS ai_chat_sessions_user_id_idx ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS ai_chat_sessions_created_at_idx ON ai_chat_sessions(created_at DESC);

-- RLS Policies
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own chats
CREATE POLICY "Users can view own chats"
  ON ai_chat_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own chats
CREATE POLICY "Users can create own chats"
  ON ai_chat_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own chats
CREATE POLICY "Users can update own chats"
  ON ai_chat_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own chats
CREATE POLICY "Users can delete own chats"
  ON ai_chat_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_chat_sessions_updated_at
  BEFORE UPDATE ON ai_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_chat_sessions_updated_at();

-- Comment
COMMENT ON TABLE ai_chat_sessions IS 'Stores AI chat conversations for users';
