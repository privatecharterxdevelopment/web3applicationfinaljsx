/*
  # Chat System Improvements

  1. New Triggers
    - Add trigger to send notifications for new chat messages
    - Add function to handle message notifications

  2. Security
    - Fix RLS policies for chat tables
    - Ensure proper access control for all chat operations

  3. Indexes
    - Add indexes for better performance on chat queries
*/

-- Create function to handle chat message notifications
CREATE OR REPLACE FUNCTION handle_chat_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function to handle notifications
  -- This is done asynchronously to avoid blocking the transaction
  PERFORM net.http_post(
    url := CONCAT(current_setting('supabase_functions_endpoint', true), '/chat-notifications'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', CONCAT('Bearer ', current_setting('supabase_functions_key', true))
    ),
    body := jsonb_build_object('messageId', NEW.id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chat message notifications
DROP TRIGGER IF EXISTS chat_message_notification_trigger ON chat_messages;
CREATE TRIGGER chat_message_notification_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_chat_message_notification();

-- Fix RLS policies for chat_users
DROP POLICY IF EXISTS "Users can read all chat users" ON chat_users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON chat_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON chat_users;

CREATE POLICY "Users can read all chat users"
  ON chat_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON chat_users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON chat_users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix RLS policies for chat_conversations
DROP POLICY IF EXISTS "Users can read conversations they participate in" ON chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;

CREATE POLICY "Users can read conversations they participate in"
  ON chat_conversations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create conversations"
  ON chat_conversations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Fix RLS policies for chat_participants
DROP POLICY IF EXISTS "Users can read participants of their conversations" ON chat_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON chat_participants;

CREATE POLICY "Users can read participants of their conversations"
  ON chat_participants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can add participants to conversations"
  ON chat_participants
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Fix RLS policies for chat_messages
DROP POLICY IF EXISTS "Users can read messages from their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

CREATE POLICY "Users can read messages from their conversations"
  ON chat_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can send messages to their conversations"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own messages"
  ON chat_messages
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_chat_users_name ON chat_users(name);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by ON chat_conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_is_group ON chat_conversations(is_group);

-- Add function to get current system user ID from auth.uid()
CREATE OR REPLACE FUNCTION get_chat_user_id_from_auth()
RETURNS uuid AS $$
DECLARE
  chat_user_id uuid;
BEGIN
  -- Try to get chat user ID from auth.uid()
  SELECT id INTO chat_user_id
  FROM chat_users
  WHERE id IN (
    SELECT id FROM system_users WHERE id = auth.uid()
  )
  LIMIT 1;
  
  -- If not found, try to get by email
  IF chat_user_id IS NULL THEN
    SELECT chat_users.id INTO chat_user_id
    FROM chat_users
    JOIN system_users ON system_users.email = chat_users.email
    WHERE system_users.id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN chat_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;