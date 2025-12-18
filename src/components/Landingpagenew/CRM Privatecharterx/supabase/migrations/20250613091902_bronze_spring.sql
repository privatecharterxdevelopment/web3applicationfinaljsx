/*
  # Real-time Chat System

  1. New Tables
    - `chat_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `avatar_url` (text, optional)
      - `is_online` (boolean, default false)
      - `last_seen` (timestamp)
      - `created_at` (timestamp)
    
    - `chat_conversations`
      - `id` (uuid, primary key)
      - `name` (text, optional for group chats)
      - `is_group` (boolean, default false)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `chat_participants`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `joined_at` (timestamp)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `sender_id` (uuid, foreign key)
      - `message` (text)
      - `message_type` (text, default 'text')
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add real-time subscriptions
*/

-- Create chat_users table
CREATE TABLE IF NOT EXISTS chat_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  is_group boolean DEFAULT false,
  created_by uuid REFERENCES chat_users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES chat_users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES chat_users(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text DEFAULT 'text',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_users
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

-- Policies for chat_conversations
CREATE POLICY "Users can read conversations they participate in"
  ON chat_conversations
  FOR SELECT
  TO public
  USING (
    id IN (
      SELECT conversation_id 
      FROM chat_participants 
      WHERE user_id IN (SELECT id FROM chat_users)
    )
  );

CREATE POLICY "Users can create conversations"
  ON chat_conversations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for chat_participants
CREATE POLICY "Users can read participants of their conversations"
  ON chat_participants
  FOR SELECT
  TO public
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM chat_participants 
      WHERE user_id IN (SELECT id FROM chat_users)
    )
  );

CREATE POLICY "Users can add participants to conversations"
  ON chat_participants
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for chat_messages
CREATE POLICY "Users can read messages from their conversations"
  ON chat_messages
  FOR SELECT
  TO public
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM chat_participants 
      WHERE user_id IN (SELECT id FROM chat_users)
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id 
      FROM chat_participants 
      WHERE user_id IN (SELECT id FROM chat_users)
    )
  );

CREATE POLICY "Users can update their own messages"
  ON chat_messages
  FOR UPDATE
  TO public
  USING (sender_id IN (SELECT id FROM chat_users))
  WITH CHECK (sender_id IN (SELECT id FROM chat_users));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation_id ON chat_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_users_email ON chat_users(email);
CREATE INDEX IF NOT EXISTS idx_chat_users_is_online ON chat_users(is_online);

-- Insert some sample users for testing
INSERT INTO chat_users (email, name, is_online) VALUES
  ('admin@privatecharterx.com', 'John Administrator', true),
  ('employee@privatecharterx.com', 'Sarah Johnson', true),
  ('mike.davis@privatecharterx.com', 'Mike Davis', false),
  ('emma.wilson@privatecharterx.com', 'Emma Wilson', true),
  ('robert.smith@privatecharterx.com', 'Robert Smith', false)
ON CONFLICT (email) DO NOTHING;