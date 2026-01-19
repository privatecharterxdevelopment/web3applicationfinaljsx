-- =====================================================
-- LIVE SUPPORT CHAT SYSTEM
-- Real-time chat between users and admins
-- SAFE: Creates only NEW tables, no modifications to existing
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: Check if user is admin
-- (Creates only if it doesn't exist)
-- =====================================================
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_user_id
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;

-- =====================================================
-- TABLE 1: Live Support Chat Sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS live_support_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subject TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'waiting')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    unread_user INT DEFAULT 0,      -- Unread count for user
    unread_admin INT DEFAULT 0,     -- Unread count for admin
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 2: Live Support Messages
-- =====================================================
CREATE TABLE IF NOT EXISTS live_support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES live_support_chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_live_support_chats_user_id ON live_support_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_live_support_chats_admin_id ON live_support_chats(admin_id);
CREATE INDEX IF NOT EXISTS idx_live_support_chats_status ON live_support_chats(status);
CREATE INDEX IF NOT EXISTS idx_live_support_chats_created_at ON live_support_chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_support_chats_last_message ON live_support_chats(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_support_messages_chat_id ON live_support_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_live_support_messages_created_at ON live_support_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_live_support_messages_sender_id ON live_support_messages(sender_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE live_support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_support_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES for live_support_chats
-- =====================================================

-- Users can view their own chats
CREATE POLICY "Users can view their own live chats"
ON live_support_chats FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all chats
CREATE POLICY "Admins can view all live chats"
ON live_support_chats FOR SELECT
USING (is_user_admin(auth.uid()));

-- Users can create their own chats
CREATE POLICY "Users can create live chats"
ON live_support_chats FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own chats (e.g., mark as read)
CREATE POLICY "Users can update their own live chats"
ON live_support_chats FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can update any chat (e.g., close chat, assign admin)
CREATE POLICY "Admins can update all live chats"
ON live_support_chats FOR UPDATE
USING (is_user_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES for live_support_messages
-- =====================================================

-- Users can view messages in their chats
CREATE POLICY "Users can view messages in their live chats"
ON live_support_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM live_support_chats
        WHERE live_support_chats.id = live_support_messages.chat_id
        AND live_support_chats.user_id = auth.uid()
    )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all live chat messages"
ON live_support_messages FOR SELECT
USING (is_user_admin(auth.uid()));

-- Users can send messages in their chats
CREATE POLICY "Users can send messages in their live chats"
ON live_support_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM live_support_chats
        WHERE live_support_chats.id = live_support_messages.chat_id
        AND live_support_chats.user_id = auth.uid()
    )
);

-- Admins can send messages in any chat
CREATE POLICY "Admins can send messages in any live chat"
ON live_support_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    is_user_admin(auth.uid())
);

-- Users can update their own messages (mark as read)
CREATE POLICY "Users can update messages in their live chats"
ON live_support_messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM live_support_chats
        WHERE live_support_chats.id = live_support_messages.chat_id
        AND live_support_chats.user_id = auth.uid()
    )
);

-- Admins can update any message
CREATE POLICY "Admins can update any live chat message"
ON live_support_messages FOR UPDATE
USING (is_user_admin(auth.uid()));

-- =====================================================
-- TRIGGER: Update last_message_at and unread counts
-- =====================================================
CREATE OR REPLACE FUNCTION update_live_chat_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_message_at
    UPDATE live_support_chats
    SET
        last_message_at = NEW.created_at,
        -- Increment unread count for the OTHER party
        unread_user = CASE
            WHEN NEW.sender_type = 'admin' THEN unread_user + 1
            ELSE unread_user
        END,
        unread_admin = CASE
            WHEN NEW.sender_type = 'user' THEN unread_admin + 1
            ELSE unread_admin
        END
    WHERE id = NEW.chat_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_live_support_message_insert ON live_support_messages;
CREATE TRIGGER on_live_support_message_insert
    AFTER INSERT ON live_support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_live_chat_on_message();

-- =====================================================
-- FUNCTION: Mark chat as read (reset unread count)
-- =====================================================
CREATE OR REPLACE FUNCTION mark_live_chat_as_read(p_chat_id UUID, p_is_admin BOOLEAN)
RETURNS VOID AS $$
BEGIN
    IF p_is_admin THEN
        UPDATE live_support_chats
        SET unread_admin = 0
        WHERE id = p_chat_id;

        UPDATE live_support_messages
        SET is_read = true
        WHERE chat_id = p_chat_id AND sender_type = 'user';
    ELSE
        UPDATE live_support_chats
        SET unread_user = 0
        WHERE id = p_chat_id AND user_id = auth.uid();

        UPDATE live_support_messages
        SET is_read = true
        WHERE chat_id = p_chat_id AND sender_type = 'admin';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Close a chat
-- =====================================================
CREATE OR REPLACE FUNCTION close_live_chat(p_chat_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE live_support_chats
    SET
        status = 'closed',
        closed_at = NOW(),
        closed_by = auth.uid()
    WHERE id = p_chat_id
    AND (user_id = auth.uid() OR is_user_admin(auth.uid()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Reopen a chat
-- =====================================================
CREATE OR REPLACE FUNCTION reopen_live_chat(p_chat_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE live_support_chats
    SET
        status = 'open',
        closed_at = NULL,
        closed_by = NULL
    WHERE id = p_chat_id
    AND (user_id = auth.uid() OR is_user_admin(auth.uid()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON live_support_chats TO authenticated;
GRANT ALL ON live_support_messages TO authenticated;
GRANT EXECUTE ON FUNCTION mark_live_chat_as_read(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION close_live_chat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reopen_live_chat(UUID) TO authenticated;

-- =====================================================
-- ENABLE REALTIME for live updates
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE live_support_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE live_support_messages;

-- =====================================================
-- MIGRATION COMPLETE
-- Run this in Supabase SQL Editor
-- =====================================================
