-- =====================================================
-- COMPLETE LAUNCHPAD SETUP
-- Run this ENTIRE file in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE LAUNCHPAD_PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS launchpad_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'private-jet', 'yacht', 'luxury-car', 'real-estate', etc.
  asset_type TEXT,
  location TEXT,
  year INTEGER,

  -- Media
  image_url TEXT,
  cover_image_url TEXT,

  -- Token Details
  token_standard TEXT DEFAULT 'ERC1400',
  token_symbol TEXT,
  token_price DECIMAL(20, 2),
  total_supply BIGINT,
  available_supply BIGINT,

  -- Financials
  target_amount DECIMAL(20, 2),
  raised_amount DECIMAL(20, 2) DEFAULT 0,
  min_investment DECIMAL(20, 2),
  max_investment DECIMAL(20, 2),
  estimated_apy DECIMAL(5, 2),
  revenue_model TEXT,

  -- Phase & Status
  current_phase TEXT DEFAULT 'waitlist', -- 'waitlist', 'fundraising', 'spv_formation', 'completed'
  status TEXT DEFAULT 'active', -- 'active', 'upcoming', 'completed', 'cancelled'

  -- Waitlist
  current_waitlist INTEGER DEFAULT 0,
  target_waitlist INTEGER DEFAULT 100,
  waitlist_target_days INTEGER DEFAULT 90,

  -- Fundraising
  fundraising_start_date TIMESTAMP,
  fundraising_end_date TIMESTAMP,
  fundraising_deadline_days INTEGER DEFAULT 90,

  -- Dates
  launch_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE LAUNCHPAD_WAITLIST TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS launchpad_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  launch_id UUID NOT NULL REFERENCES launchpad_projects(id) ON DELETE CASCADE,
  user_id UUID,
  wallet_address TEXT NOT NULL,
  email TEXT NOT NULL,

  -- Signature (wallet proof)
  signature TEXT NOT NULL,
  signature_message TEXT NOT NULL,
  signature_timestamp TIMESTAMP DEFAULT NOW(),

  -- Status
  notified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(launch_id, wallet_address)
);

-- =====================================================
-- 3. CREATE LAUNCHPAD_TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS launchpad_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  launch_id UUID REFERENCES launchpad_projects(id),
  user_id UUID,
  wallet_address TEXT NOT NULL,

  transaction_type TEXT NOT NULL, -- 'waitlist_join', 'investment', 'refund', 'token_distribution'

  amount DECIMAL(20, 2),
  transaction_hash TEXT,

  signature TEXT,
  signature_message TEXT,

  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'

  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_launchpad_projects_status ON launchpad_projects(status);
CREATE INDEX IF NOT EXISTS idx_launchpad_projects_phase ON launchpad_projects(current_phase);
CREATE INDEX IF NOT EXISTS idx_launchpad_waitlist_launch ON launchpad_waitlist(launch_id);
CREATE INDEX IF NOT EXISTS idx_launchpad_waitlist_wallet ON launchpad_waitlist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_launchpad_transactions_launch ON launchpad_transactions(launch_id);
CREATE INDEX IF NOT EXISTS idx_launchpad_transactions_wallet ON launchpad_transactions(wallet_address);

-- =====================================================
-- 5. INSERT 4 DUMMY PROJECTS
-- NOTE: Only these 4 projects will be visible on launchpad
-- All start at 0/target - progress bar updates LIVE with each wallet signature
-- =====================================================

-- Project 1: Embraer Phenom 300 (Smaller Jet)
INSERT INTO launchpad_projects (
  name,
  description,
  category,
  asset_type,
  location,
  year,
  image_url,
  cover_image_url,
  token_standard,
  token_symbol,
  token_price,
  total_supply,
  available_supply,
  target_amount,
  min_investment,
  max_investment,
  estimated_apy,
  revenue_model,
  target_waitlist,
  current_phase,
  status,
  current_waitlist,
  waitlist_target_days
) VALUES (
  'Embraer Phenom 300',
  'Fractional ownership of a 2021 Embraer Phenom 300 light jet based in Geneva. This aircraft offers exceptional performance for European routes with best-in-class cabin comfort. Perfect for business travelers seeking flexibility and luxury.

Phase 1: Join Waitlist (Wallet Signature Required)
Phase 2: Fundraising with pre-buy agreement and automatic blockchain refund if target not reached within 90 days
Phase 3: SPV formation, aircraft acquisition, and security token distribution (ERC1400)',
  'private-jet',
  'Embraer Phenom 300',
  'Geneva, Switzerland',
  2021,
  'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
  'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1920',
  'ERC1400',
  'PHEN300',
  5000,
  2000,
  2000,
  10000000,
  5000,
  500000,
  14.5,
  'Charter Revenue',
  450,
  'waitlist',
  'active',
  0,
  90
) ON CONFLICT DO NOTHING;

-- Project 2: Gulfstream G550 (Large Jet)
INSERT INTO launchpad_projects (
  name,
  description,
  category,
  asset_type,
  location,
  year,
  image_url,
  cover_image_url,
  token_standard,
  token_symbol,
  token_price,
  total_supply,
  available_supply,
  target_amount,
  min_investment,
  max_investment,
  estimated_apy,
  revenue_model,
  target_waitlist,
  current_phase,
  status,
  current_waitlist,
  waitlist_target_days
) VALUES (
  'Gulfstream G550',
  'Ultra-long-range business jet with global reach. This 2019 Gulfstream G550 offers unmatched comfort and capability, serving routes from Dubai to the Americas and Asia. Ideal for high-net-worth individuals and corporations.

Phase 1: Join Waitlist (Wallet Signature Required)
Phase 2: Fundraising with pre-buy agreement and automatic blockchain refund if target not reached within 90 days
Phase 3: SPV formation, aircraft acquisition, and security token distribution (ERC1400)',
  'private-jet',
  'Gulfstream G550',
  'Dubai, UAE',
  2019,
  'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800',
  'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=1920',
  'ERC1400',
  'G550-DXB',
  10000,
  6500,
  6500,
  65000000,
  10000,
  1000000,
  12.8,
  'Charter Revenue',
  500,
  'waitlist',
  'active',
  0,
  90
) ON CONFLICT DO NOTHING;

-- Project 3: Azimut 72 Yacht
INSERT INTO launchpad_projects (
  name,
  description,
  category,
  asset_type,
  location,
  year,
  image_url,
  cover_image_url,
  token_standard,
  token_symbol,
  token_price,
  total_supply,
  available_supply,
  target_amount,
  min_investment,
  max_investment,
  estimated_apy,
  revenue_model,
  target_waitlist,
  current_phase,
  status,
  current_waitlist,
  waitlist_target_days
) VALUES (
  'Mediterranean Yacht - Azimut 72',
  '72-foot luxury yacht based in Malta, perfect for Mediterranean charters. This stunning Azimut offers exceptional comfort and performance, with a proven charter track record generating consistent returns.

Phase 1: Join Waitlist (Wallet Signature Required)
Phase 2: Fundraising with pre-buy agreement and automatic blockchain refund if target not reached within 90 days
Phase 3: SPV formation, yacht acquisition, and security token distribution (ERC1400)',
  'yacht',
  'Azimut 72',
  'Malta',
  2022,
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1920',
  'ERC1400',
  'AZI72-MLT',
  2500,
  600,
  600,
  1500000,
  2500,
  150000,
  16.2,
  'Charter Revenue',
  500,
  'waitlist',
  'active',
  0,
  90
) ON CONFLICT DO NOTHING;

-- Project 4: Ferrari F50
INSERT INTO launchpad_projects (
  name,
  description,
  category,
  asset_type,
  location,
  year,
  image_url,
  cover_image_url,
  token_standard,
  token_symbol,
  token_price,
  total_supply,
  available_supply,
  target_amount,
  min_investment,
  max_investment,
  estimated_apy,
  revenue_model,
  target_waitlist,
  current_phase,
  status,
  current_waitlist,
  waitlist_target_days
) VALUES (
  'Ferrari F50',
  'Rare 1996 Ferrari F50 in pristine condition. One of only 349 units ever produced, this iconic supercar combines Formula 1 technology with road car usability. Fractional ownership opportunity for this collectible automotive masterpiece.

Phase 1: Join Waitlist (Wallet Signature Required)
Phase 2: Fundraising with pre-buy agreement and automatic blockchain refund if target not reached within 90 days
Phase 3: SPV formation, vehicle acquisition, and security token distribution (ERC1400)',
  'luxury-car',
  'Ferrari F50',
  'Monaco',
  1996,
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920',
  'ERC1400',
  'F50-MCO',
  10000,
  460,
  460,
  4600000,
  10000,
  500000,
  8.5,
  'Appreciation + Rental',
  100,
  'waitlist',
  'active',
  0,
  60
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. VERIFY SETUP
-- =====================================================
SELECT
  name,
  category,
  status,
  current_waitlist || '/' || target_waitlist as waitlist_progress,
  '$' || (target_amount/1000000)::text || 'M' as target,
  estimated_apy || '%' as apy
FROM launchpad_projects
ORDER BY created_at DESC;
