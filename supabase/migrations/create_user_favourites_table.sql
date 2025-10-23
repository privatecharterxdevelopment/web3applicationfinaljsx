-- Create user_favourites table
CREATE TABLE IF NOT EXISTS user_favourites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  category TEXT,
  image_url TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favourites_user_id ON user_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favourites_created_at ON user_favourites(created_at DESC);

-- Enable RLS
ALTER TABLE user_favourites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favourites"
  ON user_favourites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favourites"
  ON user_favourites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favourites"
  ON user_favourites FOR DELETE
  USING (auth.uid() = user_id);
