-- Live Support Chat System
-- Enables real-time messaging between users and admins

-- =====================================================
-- TABLE: live_support_chats
-- =====================================================
CREATE TABLE IF NOT EXISTS live_support_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'waiting')),
  unread_user INTEGER NOT NULL DEFAULT 0,
  unread_admin INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_live_support_chats_user_id ON live_support_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_live_support_chats_status ON live_support_chats(status);
CREATE INDEX IF NOT EXISTS idx_live_support_chats_last_message ON live_support_chats(last_message_at DESC NULLS LAST);

-- =====================================================
-- TABLE: live_support_messages
-- =====================================================
CREATE TABLE IF NOT EXISTS live_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES live_support_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster message queries
CREATE INDEX IF NOT EXISTS idx_live_support_messages_chat_id ON live_support_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_live_support_messages_created_at ON live_support_messages(chat_id, created_at);

-- =====================================================
-- TRIGGER: Update last_message_at and unread counts
-- =====================================================
CREATE OR REPLACE FUNCTION update_chat_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE live_support_chats
  SET
    last_message_at = NEW.created_at,
    updated_at = NOW(),
    -- Increment unread for the other party
    unread_user = CASE WHEN NEW.sender_type = 'admin' THEN unread_user + 1 ELSE unread_user END,
    unread_admin = CASE WHEN NEW.sender_type = 'user' THEN unread_admin + 1 ELSE unread_admin END
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_support_message ON live_support_messages;
CREATE TRIGGER on_new_support_message
  AFTER INSERT ON live_support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_on_new_message();

-- =====================================================
-- RPC: Mark chat as read
-- =====================================================
CREATE OR REPLACE FUNCTION mark_live_chat_as_read(
  p_chat_id UUID,
  p_is_admin BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  IF p_is_admin THEN
    -- Admin marking as read
    UPDATE live_support_chats SET unread_admin = 0, updated_at = NOW() WHERE id = p_chat_id;
    UPDATE live_support_messages SET is_read = TRUE WHERE chat_id = p_chat_id AND sender_type = 'user';
  ELSE
    -- User marking as read
    UPDATE live_support_chats SET unread_user = 0, updated_at = NOW() WHERE id = p_chat_id;
    UPDATE live_support_messages SET is_read = TRUE WHERE chat_id = p_chat_id AND sender_type = 'admin';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE live_support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_support_messages ENABLE ROW LEVEL SECURITY;

-- Chats: Users can see their own chats
CREATE POLICY "Users can view their own chats"
  ON live_support_chats FOR SELECT
  USING (auth.uid() = user_id);

-- Chats: Users can create chats
CREATE POLICY "Users can create chats"
  ON live_support_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chats: Admins can view all chats
CREATE POLICY "Admins can view all chats"
  ON live_support_chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Chats: Admins can update any chat
CREATE POLICY "Admins can update any chat"
  ON live_support_chats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Messages: Users can see messages in their chats
CREATE POLICY "Users can view messages in their chats"
  ON live_support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM live_support_chats
      WHERE live_support_chats.id = live_support_messages.chat_id
      AND live_support_chats.user_id = auth.uid()
    )
  );

-- Messages: Users can send messages in their chats
CREATE POLICY "Users can send messages in their chats"
  ON live_support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND sender_type = 'user'
    AND EXISTS (
      SELECT 1 FROM live_support_chats
      WHERE live_support_chats.id = chat_id
      AND live_support_chats.user_id = auth.uid()
    )
  );

-- Messages: Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON live_support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Messages: Admins can send messages
CREATE POLICY "Admins can send messages"
  ON live_support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND sender_type = 'admin'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- ENABLE REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE live_support_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE live_support_messages;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON live_support_chats TO authenticated;
GRANT SELECT, INSERT ON live_support_messages TO authenticated;
GRANT EXECUTE ON FUNCTION mark_live_chat_as_read TO authenticated;
