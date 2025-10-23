-- =====================================================
-- Community & Blog Tables for PrivateCharterX
-- Web3 Blog Posts with Wallet-Verified Comments
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Blog Posts Table
-- Stores fetched posts from privatecharterx.blog
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author TEXT DEFAULT 'PrivateCharterX Team',
  source TEXT DEFAULT 'privatecharterx.blog',
  category TEXT DEFAULT 'web3',
  source_url TEXT,
  tags TEXT[],
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Blog Comments Table
-- Wallet-verified comments on blog posts
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  signature TEXT, -- Wallet signature for verification
  signed_message TEXT, -- Original message that was signed
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- =====================================================
-- Post Likes Table
-- Track wallet addresses that liked posts
-- =====================================================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(post_id, wallet_address)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_source ON blog_posts(source);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_wallet ON blog_comments(wallet_address);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_wallet ON post_likes(wallet_address);

-- =====================================================
-- RPC Functions
-- =====================================================

-- Increment post views
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts
  SET views = views + 1
  WHERE id = post_id;
END;
$$;

-- Increment post likes
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts
  SET likes = likes + 1
  WHERE id = post_id;
END;
$$;

-- Decrement post likes
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = post_id;
END;
$$;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Blog Posts Policies
-- Anyone can read posts
CREATE POLICY "Anyone can read blog posts"
  ON blog_posts FOR SELECT
  TO public
  USING (true);

-- Only admins can insert/update/delete posts (handled by backend)
CREATE POLICY "Service role can manage posts"
  ON blog_posts FOR ALL
  TO service_role
  USING (true);

-- Blog Comments Policies
-- Anyone can read approved comments
CREATE POLICY "Anyone can read approved comments"
  ON blog_comments FOR SELECT
  TO public
  USING (status = 'approved');

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON blog_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own pending comments
CREATE POLICY "Users can update own pending comments"
  ON blog_comments FOR UPDATE
  TO authenticated
  USING (wallet_address = lower(current_user) AND status = 'pending');

-- Service role can manage all comments
CREATE POLICY "Service role can manage comments"
  ON blog_comments FOR ALL
  TO service_role
  USING (true);

-- Post Likes Policies
-- Anyone can read likes count
CREATE POLICY "Anyone can read likes"
  ON post_likes FOR SELECT
  TO public
  USING (true);

-- Authenticated users can like/unlike
CREATE POLICY "Authenticated users can like posts"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================
INSERT INTO blog_posts (
  title,
  excerpt,
  content,
  featured_image,
  author,
  source,
  category,
  source_url,
  tags,
  published_at
) VALUES
(
  'The Future of Tokenized Aviation Assets',
  'Discover how blockchain technology is revolutionizing the private aviation industry through fractional ownership and security tokens.',
  '<h2>Introduction</h2><p>The aviation industry is experiencing a paradigm shift with the introduction of blockchain technology and tokenization...</p><h2>Key Benefits</h2><ul><li>Fractional Ownership</li><li>Increased Liquidity</li><li>Transparent Transactions</li><li>Lower Entry Barriers</li></ul><p>Read the full article to learn more about this exciting development.</p>',
  'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
  'PrivateCharterX Team',
  'privatecharterx.blog',
  'web3',
  'https://privatecharterx.blog/tokenized-aviation',
  ARRAY['Web3', 'Aviation', 'Tokenization', 'Blockchain'],
  NOW() - INTERVAL '2 days'
),
(
  'Understanding Security Tokens: A Complete Guide',
  'Security tokens represent ownership in real-world assets. Learn how they work and why they matter for luxury asset investments.',
  '<h2>What are Security Tokens?</h2><p>Security tokens are digital representations of ownership in real-world assets, regulated by securities laws...</p><h2>Advantages</h2><p>Security tokens provide unprecedented transparency, accessibility, and efficiency in asset management.</p>',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
  'PrivateCharterX Team',
  'privatecharterx.blog',
  'web3',
  'https://privatecharterx.blog/security-tokens-guide',
  ARRAY['Security Tokens', 'STO', 'Investment', 'Regulation'],
  NOW() - INTERVAL '5 days'
),
(
  'Web3 Memberships: The New Era of Exclusive Access',
  'NFT-based memberships are transforming how luxury brands offer exclusive experiences and benefits to their members.',
  '<h2>NFT Memberships</h2><p>Web3 technology enables verifiable, transferable memberships that unlock exclusive benefits...</p><h2>Use Cases</h2><ul><li>Private Jet Access</li><li>Yacht Charters</li><li>Luxury Events</li><li>Community Governance</li></ul>',
  'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800',
  'PrivateCharterX Team',
  'privatecharterx.blog',
  'web3',
  'https://privatecharterx.blog/web3-memberships',
  ARRAY['NFT', 'Memberships', 'Web3', 'Luxury'],
  NOW() - INTERVAL '7 days'
);

-- Grant necessary permissions
GRANT ALL ON blog_posts TO authenticated;
GRANT ALL ON blog_comments TO authenticated;
GRANT ALL ON post_likes TO authenticated;
GRANT ALL ON blog_posts TO anon;
GRANT ALL ON blog_comments TO anon;
GRANT ALL ON post_likes TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Community tables created successfully!';
  RAISE NOTICE '✓ blog_posts table';
  RAISE NOTICE '✓ blog_comments table';
  RAISE NOTICE '✓ post_likes table';
  RAISE NOTICE '✓ RLS policies configured';
  RAISE NOTICE '✓ Sample blog posts inserted';
END $$;
