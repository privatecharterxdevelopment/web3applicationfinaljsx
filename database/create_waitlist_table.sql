-- =====================================================
-- ASSET WAITLIST TABLE
-- Tracks users interested in upcoming token offerings
-- =====================================================

CREATE TABLE IF NOT EXISTS asset_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES user_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  interested_tokens INTEGER NOT NULL DEFAULT 1,
  accredited_investor BOOLEAN NOT NULL DEFAULT false,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT positive_tokens CHECK (interested_tokens > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_asset ON asset_waitlist(asset_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user ON asset_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON asset_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON asset_waitlist(notified) WHERE notified = false;

-- RLS
ALTER TABLE asset_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
DROP POLICY IF EXISTS "Users can view own waitlist" ON asset_waitlist;
CREATE POLICY "Users can view own waitlist"
  ON asset_waitlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Anyone can join waitlist (even non-auth users via email)
DROP POLICY IF EXISTS "Anyone can join waitlist" ON asset_waitlist;
CREATE POLICY "Anyone can join waitlist"
  ON asset_waitlist FOR INSERT
  WITH CHECK (true);

-- Only user can update their own entry
DROP POLICY IF EXISTS "Users can update own entry" ON asset_waitlist;
CREATE POLICY "Users can update own entry"
  ON asset_waitlist FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE asset_waitlist IS 'Waitlist for upcoming tokenized asset offerings';
