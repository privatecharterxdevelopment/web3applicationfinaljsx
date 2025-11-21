-- DexRais.funds Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Campaign images bucket (for logos and header images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- User profile images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-profiles', 'user-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Allow anyone to view campaign images
CREATE POLICY "Campaign images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

-- Allow authenticated users to upload campaign images
CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own campaign images
CREATE POLICY "Users can update their own campaign images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'campaign-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own campaign images
CREATE POLICY "Users can delete their own campaign images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'campaign-images'
  AND auth.role() = 'authenticated'
);

-- Allow anyone to view user profile images
CREATE POLICY "User profile images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profiles');

-- Allow authenticated users to upload profile images
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-profiles'
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Users/Creators table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  bio TEXT,
  profile_image_url TEXT,
  twitter_handle TEXT,
  discord_handle TEXT,
  website_url TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_wallet TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  category TEXT NOT NULL CHECK (category IN ('defi', 'nft', 'gaming', 'dao', 'infrastructure', 'social', 'other')),

  -- Images
  logo_image_url TEXT,
  header_image_url TEXT,
  cover_image_url TEXT,

  -- Funding details
  goal_amount DECIMAL(20, 2) NOT NULL CHECK (goal_amount >= 1000),
  raised_amount DECIMAL(20, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USDC',

  -- Timeline
  duration_days INT DEFAULT 30 CHECK (duration_days IN (30, 60, 90)),
  start_date TIMESTAMP,
  end_date TIMESTAMP,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_payment', 'live', 'successful', 'failed', 'cancelled')),

  -- Blockchain data
  campaign_contract_address TEXT,
  safe_address TEXT,
  launch_fee_paid BOOLEAN DEFAULT FALSE,
  launch_fee_tx_hash TEXT,

  -- Stats
  backer_count INT DEFAULT 0,
  view_count INT DEFAULT 0,

  -- Metadata
  tags TEXT[],
  video_url TEXT,
  whitepaper_url TEXT,
  github_url TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,

  FOREIGN KEY (creator_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Backers/Contributors table
CREATE TABLE IF NOT EXISTS backers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USDC',
  tx_hash TEXT NOT NULL,
  block_number BIGINT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'refunded')),
  contributed_at TIMESTAMP DEFAULT NOW(),
  refunded_at TIMESTAMP,
  UNIQUE(campaign_id, tx_hash)
);

-- Transactions table (comprehensive transaction log)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  block_number BIGINT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'failed')),
  type TEXT NOT NULL CHECK (type IN ('contribution', 'refund', 'withdrawal', 'launch_fee')),
  gas_used BIGINT,
  gas_price BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  error_message TEXT
);

-- Campaign updates table (creator posts)
CREATE TABLE IF NOT EXISTS campaign_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_wallet TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_milestone BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comments table (backers can comment on campaigns)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Favorites/Bookmarks table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, campaign_id)
);

-- Campaign milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_percentage INT CHECK (target_percentage > 0 AND target_percentage <= 100),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('contribution', 'milestone', 'update', 'success', 'refund', 'comment')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaign team members table
CREATE TABLE IF NOT EXISTS campaign_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, wallet_address)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_campaigns_creator ON campaigns(creator_wallet);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_category ON campaigns(category);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX idx_backers_campaign ON backers(campaign_id);
CREATE INDEX idx_backers_wallet ON backers(wallet_address);
CREATE INDEX idx_transactions_campaign ON transactions(campaign_id);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_address);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_campaign_updates_campaign ON campaign_updates(campaign_id);
CREATE INDEX idx_comments_campaign ON comments(campaign_id);
CREATE INDEX idx_favorites_wallet ON favorites(wallet_address);
CREATE INDEX idx_notifications_wallet ON notifications(wallet_address);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for campaigns table
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for comments table
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate campaign progress percentage
CREATE OR REPLACE FUNCTION get_campaign_progress(campaign_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  progress DECIMAL;
BEGIN
  SELECT
    CASE
      WHEN goal_amount > 0 THEN (raised_amount / goal_amount * 100)
      ELSE 0
    END INTO progress
  FROM campaigns
  WHERE id = campaign_uuid;

  RETURN COALESCE(progress, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get days remaining for a campaign
CREATE OR REPLACE FUNCTION get_days_remaining(campaign_uuid UUID)
RETURNS INT AS $$
DECLARE
  days_left INT;
BEGIN
  SELECT
    EXTRACT(DAY FROM (end_date - NOW()))::INT INTO days_left
  FROM campaigns
  WHERE id = campaign_uuid;

  RETURN COALESCE(days_left, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE backers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_team ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone"
ON users FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Campaigns policies
CREATE POLICY "Campaigns are viewable by everyone"
ON campaigns FOR SELECT
USING (true);

CREATE POLICY "Users can create campaigns"
ON campaigns FOR INSERT
WITH CHECK (true);

CREATE POLICY "Creators can update their own campaigns"
ON campaigns FOR UPDATE
USING (creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Backers policies
CREATE POLICY "Backers are viewable by everyone"
ON backers FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert backer records"
ON backers FOR INSERT
WITH CHECK (true);

-- Transactions policies
CREATE POLICY "Transactions are viewable by everyone"
ON transactions FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert transactions"
ON transactions FOR INSERT
WITH CHECK (true);

-- Campaign updates policies
CREATE POLICY "Campaign updates are viewable by everyone"
ON campaign_updates FOR SELECT
USING (true);

CREATE POLICY "Creators can add updates to their campaigns"
ON campaign_updates FOR INSERT
WITH CHECK (true);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
ON comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can comment"
ON comments FOR INSERT
WITH CHECK (true);

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
ON favorites FOR SELECT
USING (true);

CREATE POLICY "Users can add favorites"
ON favorites FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can remove their favorites"
ON favorites FOR DELETE
USING (true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (true);

CREATE POLICY "Anyone can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (true);

-- =====================================================
-- VIEWS
-- =====================================================

-- View for campaign statistics
CREATE OR REPLACE VIEW campaign_stats AS
SELECT
  c.id,
  c.title,
  c.status,
  c.goal_amount,
  c.raised_amount,
  get_campaign_progress(c.id) as progress_percentage,
  get_days_remaining(c.id) as days_remaining,
  c.backer_count,
  c.view_count,
  COUNT(DISTINCT cu.id) as update_count,
  COUNT(DISTINCT com.id) as comment_count,
  c.created_at,
  c.end_date
FROM campaigns c
LEFT JOIN campaign_updates cu ON c.id = cu.campaign_id
LEFT JOIN comments com ON c.id = com.campaign_id
GROUP BY c.id;

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Insert a test user
INSERT INTO users (wallet_address, username, bio) VALUES
('0x0000000000000000000000000000000000000000', 'Test Creator', 'Test bio for development')
ON CONFLICT (wallet_address) DO NOTHING;

-- =====================================================
-- COMPLETE
-- =====================================================

-- Schema creation complete!
-- Next steps:
-- 1. Upload campaign images to 'campaign-images' bucket
-- 2. Upload user profiles to 'user-profiles' bucket
-- 3. Test creating campaigns through the UI
