-- Create user_favourites table for storing user's favorite items across all services
CREATE TABLE IF NOT EXISTS user_favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('event', 'jet', 'helicopter', 'emptyleg', 'adventure', 'co2certificate', 'communitypost', 'luxurycar')),
  event_name TEXT,
  event_date TIMESTAMP,
  location TEXT,
  image_url TEXT,
  category TEXT,
  source TEXT,
  price TEXT,
  url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id, item_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_favourites_user_id ON user_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favourites_item_type ON user_favourites(item_type);
CREATE INDEX IF NOT EXISTS idx_user_favourites_created_at ON user_favourites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_favourites ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own favourites"
  ON user_favourites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favourites"
  ON user_favourites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favourites"
  ON user_favourites FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_favourites TO authenticated;
GRANT SELECT ON user_favourites TO anon;
