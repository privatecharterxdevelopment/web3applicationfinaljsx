-- =====================================================
-- LAUNCHPAD SYSTEM - Complete Database Schema
-- =====================================================
-- This schema handles the 3-phase launchpad system:
-- Phase 1: Waitlist (Wallet Signature Required)
-- Phase 2: Fundraising (Pre-buy with Blockchain Refund)
-- Phase 3: SPV Formation, Asset Purchase, Tokenization
-- =====================================================

-- =====================================================
-- 1. LAUNCHPAD PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS launchpad_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'private-jet', 'yacht', 'real-estate', etc.

  -- Images
  image_url TEXT,
  hero_image_url TEXT,
  gallery_images JSONB DEFAULT '[]',

  -- Asset Details
  asset_type TEXT, -- 'Phenom 300', 'Gulfstream G550', etc.
  asset_location TEXT,
  asset_year INT,
  asset_specifications JSONB, -- Technical specs, features, etc.

  -- Tokenization Details
  token_standard TEXT DEFAULT 'ERC1400', -- Security Token Standard
  token_symbol TEXT,
  token_price DECIMAL(20, 2),
  total_supply BIGINT,
  tokens_available BIGINT,

  -- Financial Information
  target_amount DECIMAL(20, 2) NOT NULL, -- Total fundraising goal
  raised_amount DECIMAL(20, 2) DEFAULT 0, -- Current raised amount
  min_investment DECIMAL(20, 2) DEFAULT 1000,
  max_investment DECIMAL(20, 2),

  -- Returns & APY
  estimated_apy DECIMAL(5, 2), -- Expected annual percentage yield
  revenue_model TEXT, -- 'charter', 'rental', 'appreciation', etc.
  revenue_split_percentage DECIMAL(5, 2), -- % of revenue to token holders

  -- Phase & Status
  current_phase TEXT DEFAULT 'waitlist', -- 'waitlist', 'fundraising', 'spv_formation', 'completed'
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'cancelled'

  -- Waitlist Phase
  current_waitlist INT DEFAULT 0,
  target_waitlist INT DEFAULT 100,
  waitlist_start_date TIMESTAMP,
  waitlist_end_date TIMESTAMP,

  -- Fundraising Phase
  fundraising_start_date TIMESTAMP,
  fundraising_end_date TIMESTAMP,
  fundraising_deadline_days INT DEFAULT 90, -- Auto-refund if not reached
  smart_contract_address TEXT, -- For refunds

  -- SPV & Asset Purchase Phase
  spv_formation_date TIMESTAMP,
  spv_entity_name TEXT,
  spv_jurisdiction TEXT,
  asset_purchase_date TIMESTAMP,
  asset_purchase_price DECIMAL(20, 2),
  tokenization_date TIMESTAMP,

  -- Dates
  launch_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Additional Info
  documents JSONB DEFAULT '[]', -- Legal docs, prospectus, etc.
  team_members JSONB DEFAULT '[]',
  risk_factors TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Index for performance
CREATE INDEX idx_launchpad_projects_status ON launchpad_projects(status);
CREATE INDEX idx_launchpad_projects_phase ON launchpad_projects(current_phase);
CREATE INDEX idx_launchpad_projects_category ON launchpad_projects(category);

-- =====================================================
-- 2. WAITLIST ENTRIES TABLE (Phase 1)
-- =====================================================
CREATE TABLE IF NOT EXISTS launchpad_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  launch_id UUID NOT NULL REFERENCES launchpad_projects(id) ON DELETE CASCADE,
  user_id UUID, -- From auth.users if logged in

  -- User Info
  wallet_address TEXT NOT NULL, -- REQUIRED - Used for signature
  email TEXT NOT NULL,

  -- Signature Proof (Phase 1 Requirement)
  signature TEXT NOT NULL, -- Wallet signature proving ownership
  signature_message TEXT NOT NULL, -- Message that was signed
  signature_timestamp TIMESTAMP DEFAULT NOW(),

  -- Transaction Record
  transaction_hash TEXT, -- On-chain transaction if applicable

  -- Metadata
  joined_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- 'active', 'converted', 'removed'

  -- Notifications
  notified_fundraising BOOLEAN DEFAULT FALSE,
  notified_launch BOOLEAN DEFAULT FALSE,

  UNIQUE(launch_id, wallet_address)
);

CREATE INDEX idx_waitlist_launch ON launchpad_waitlist(launch_id);
CREATE INDEX idx_waitlist_user ON launchpad_waitlist(user_id);
CREATE INDEX idx_waitlist_wallet ON launchpad_waitlist(wallet_address);

-- =====================================================
-- 3. INVESTMENTS TABLE (Phase 2 - Fundraising)
-- =====================================================
CREATE TABLE IF NOT EXISTS launchpad_investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  launch_id UUID NOT NULL REFERENCES launchpad_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  waitlist_entry_id UUID REFERENCES launchpad_waitlist(id),

  -- Investment Details
  wallet_address TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  tokens_allocated BIGINT,
  token_price DECIMAL(20, 2),

  -- Payment & Blockchain
  payment_method TEXT, -- 'crypto', 'fiat', 'wire'
  transaction_hash TEXT, -- Blockchain tx hash
  smart_contract_address TEXT, -- For refunds

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'refunded', 'converted_to_tokens'

  -- Refund Protection
  refund_eligible BOOLEAN DEFAULT TRUE,
  refund_deadline TIMESTAMP,
  refund_transaction_hash TEXT,
  refunded_at TIMESTAMP,

  -- Timestamps
  invested_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,

  -- Agreement
  agreement_signed BOOLEAN DEFAULT FALSE,
  agreement_signature TEXT,
  agreement_document_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_investments_launch ON launchpad_investments(launch_id);
CREATE INDEX idx_investments_user ON launchpad_investments(user_id);
CREATE INDEX idx_investments_wallet ON launchpad_investments(wallet_address);
CREATE INDEX idx_investments_status ON launchpad_investments(status);

-- =====================================================
-- 4. SPV FORMATION TABLE (Phase 3)
-- =====================================================
CREATE TABLE IF NOT EXISTS launchpad_spv_formations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  launch_id UUID NOT NULL REFERENCES launchpad_projects(id) ON DELETE CASCADE,

  -- SPV Details
  spv_name TEXT NOT NULL,
  spv_type TEXT, -- 'LLC', 'LTD', 'AG', etc.
  jurisdiction TEXT,
  registration_number TEXT,

  -- Formation Details
  formation_date TIMESTAMP,
  formation_cost DECIMAL(20, 2),
  legal_firm TEXT,

  -- Asset Purchase
  asset_purchased BOOLEAN DEFAULT FALSE,
  asset_purchase_date TIMESTAMP,
  asset_purchase_price DECIMAL(20, 2),
  asset_title_document_url TEXT,

  -- Tokenization
  tokenization_completed BOOLEAN DEFAULT FALSE,
  tokenization_date TIMESTAMP,
  security_token_contract_address TEXT,
  tokens_issued BIGINT,

  -- Distribution
  tokens_distributed BOOLEAN DEFAULT FALSE,
  distribution_date TIMESTAMP,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'

  -- Documents
  documents JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_spv_launch ON launchpad_spv_formations(launch_id);

-- =====================================================
-- 5. TOKEN HOLDERS TABLE (Post Phase 3)
-- =====================================================
CREATE TABLE IF NOT EXISTS launchpad_token_holders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  launch_id UUID NOT NULL REFERENCES launchpad_projects(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES launchpad_investments(id),
  user_id UUID NOT NULL,

  -- Token Details
  wallet_address TEXT NOT NULL,
  token_contract_address TEXT NOT NULL,
  tokens_owned BIGINT NOT NULL,
  token_standard TEXT DEFAULT 'ERC1400',

  -- Cost Basis
  initial_investment DECIMAL(20, 2),
  average_token_price DECIMAL(20, 2),

  -- Current Value (updated regularly)
  current_token_price DECIMAL(20, 2),
  current_value DECIMAL(20, 2),

  -- Revenue Share
  total_revenue_received DECIMAL(20, 2) DEFAULT 0,
  last_revenue_payment TIMESTAMP,

  -- Timestamps
  received_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_token_holders_launch ON launchpad_token_holders(launch_id);
CREATE INDEX idx_token_holders_user ON launchpad_token_holders(user_id);
CREATE INDEX idx_token_holders_wallet ON launchpad_token_holders(wallet_address);

-- =====================================================
-- 6. TRANSACTIONS LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS launchpad_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  launch_id UUID REFERENCES launchpad_projects(id),
  user_id UUID NOT NULL,

  -- Transaction Details
  wallet_address TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'waitlist_join', 'investment', 'refund', 'token_distribution', 'revenue_payment'

  -- Amounts
  amount DECIMAL(20, 2),

  -- Blockchain
  transaction_hash TEXT,
  block_number BIGINT,
  gas_used BIGINT,

  -- Signature (for waitlist joins)
  signature TEXT,
  signature_message TEXT,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_transactions_user ON launchpad_transactions(user_id);
CREATE INDEX idx_transactions_wallet ON launchpad_transactions(wallet_address);
CREATE INDEX idx_transactions_type ON launchpad_transactions(transaction_type);
CREATE INDEX idx_transactions_launch ON launchpad_transactions(launch_id);

-- =====================================================
-- 7. ENABLE REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE launchpad_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE launchpad_waitlist;
ALTER PUBLICATION supabase_realtime ADD TABLE launchpad_investments;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE launchpad_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_token_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_transactions ENABLE ROW LEVEL SECURITY;

-- Projects: Public Read
CREATE POLICY "Projects are viewable by everyone" ON launchpad_projects
  FOR SELECT USING (true);

-- Waitlist: Users can read their own entries
CREATE POLICY "Users can view their own waitlist entries" ON launchpad_waitlist
  FOR SELECT USING (auth.uid() = user_id OR wallet_address = current_setting('request.jwt.claim.wallet_address', true));

-- Waitlist: Users can insert their own entries
CREATE POLICY "Users can join waitlist" ON launchpad_waitlist
  FOR INSERT WITH CHECK (true);

-- Investments: Users can view their own investments
CREATE POLICY "Users can view their own investments" ON launchpad_investments
  FOR SELECT USING (auth.uid() = user_id);

-- Token Holders: Users can view their own holdings
CREATE POLICY "Users can view their own token holdings" ON launchpad_token_holders
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions: Users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON launchpad_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 9. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update project's raised amount
CREATE OR REPLACE FUNCTION update_project_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE launchpad_projects
  SET raised_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM launchpad_investments
    WHERE launch_id = NEW.launch_id
    AND status = 'confirmed'
  )
  WHERE id = NEW.launch_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_raised_amount_trigger
AFTER INSERT OR UPDATE ON launchpad_investments
FOR EACH ROW
EXECUTE FUNCTION update_project_raised_amount();

-- Function to update waitlist count
CREATE OR REPLACE FUNCTION update_waitlist_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE launchpad_projects
  SET current_waitlist = (
    SELECT COUNT(*)
    FROM launchpad_waitlist
    WHERE launch_id = NEW.launch_id
    AND status = 'active'
  )
  WHERE id = NEW.launch_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_waitlist_count_trigger
AFTER INSERT OR DELETE ON launchpad_waitlist
FOR EACH ROW
EXECUTE FUNCTION update_waitlist_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_launchpad_projects_updated_at
BEFORE UPDATE ON launchpad_projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. SEED DATA - 3 DUMMY PROJECTS
-- =====================================================

-- Project 1: Phenom 300
INSERT INTO launchpad_projects (
  name,
  description,
  category,
  asset_type,
  asset_location,
  asset_year,
  image_url,
  hero_image_url,
  token_standard,
  token_symbol,
  token_price,
  total_supply,
  tokens_available,
  target_amount,
  min_investment,
  max_investment,
  estimated_apy,
  revenue_model,
  revenue_split_percentage,
  current_phase,
  status,
  target_waitlist,
  fundraising_deadline_days,
  asset_specifications,
  risk_factors
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
  'PHEN300-GVA',
  5000,
  2000,
  2000,
  10000000,
  5000,
  500000,
  14.5,
  'Charter Revenue + Asset Appreciation',
  70,
  'waitlist',
  'active',
  50,
  90,
  jsonb_build_object(
    'range', '2010 nm',
    'speed', '453 kts',
    'passengers', '6-8',
    'crew', '2 pilots',
    'engines', '2x Pratt & Whitney Canada PW535E',
    'avionics', 'Garmin G3000',
    'features', jsonb_build_array(
      'WiFi connectivity',
      'Full galley',
      'Enclosed lavatory',
      'Baggage capacity: 84 cu ft'
    )
  ),
  'Aviation investments carry inherent risks including operational costs, maintenance requirements, regulatory changes, and market volatility. Past performance does not guarantee future returns.'
) ON CONFLICT DO NOTHING;

-- Project 2: Gulfstream G550
INSERT INTO launchpad_projects (
  name,
  description,
  category,
  asset_type,
  asset_location,
  asset_year,
  image_url,
  hero_image_url,
  token_standard,
  token_symbol,
  token_price,
  total_supply,
  tokens_available,
  target_amount,
  min_investment,
  max_investment,
  estimated_apy,
  revenue_model,
  revenue_split_percentage,
  current_phase,
  status,
  target_waitlist,
  fundraising_deadline_days,
  asset_specifications,
  risk_factors
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
  2000000,
  12.8,
  'Charter Revenue + Asset Appreciation',
  65,
  'waitlist',
  'active',
  100,
  90,
  jsonb_build_object(
    'range', '6750 nm',
    'speed', '516 kts',
    'passengers', '14-19',
    'crew', '2-4',
    'engines', '2x Rolls-Royce BR710',
    'avionics', 'Honeywell PlaneView',
    'features', jsonb_build_array(
      'Cabin altitude: 6000 ft',
      'Full galley',
      'Private stateroom',
      'Entertainment system',
      'Satellite communications'
    )
  ),
  'Aviation investments carry inherent risks including operational costs, maintenance requirements, regulatory changes, and market volatility. Past performance does not guarantee future returns.'
) ON CONFLICT DO NOTHING;

-- Project 3: Luxury Yacht Malta
INSERT INTO launchpad_projects (
  name,
  description,
  category,
  asset_type,
  asset_location,
  asset_year,
  image_url,
  hero_image_url,
  token_standard,
  token_symbol,
  token_price,
  total_supply,
  tokens_available,
  target_amount,
  min_investment,
  max_investment,
  estimated_apy,
  revenue_model,
  revenue_split_percentage,
  current_phase,
  status,
  target_waitlist,
  fundraising_deadline_days,
  asset_specifications,
  risk_factors
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
  75,
  'waitlist',
  'active',
  75,
  90,
  jsonb_build_object(
    'length', '72 ft / 22 m',
    'beam', '17.3 ft / 5.3 m',
    'draft', '4.9 ft / 1.5 m',
    'guests', '8',
    'crew', '3',
    'cabins', '4',
    'engines', '2x MAN V12',
    'speed', 'Max 32 kts, Cruise 28 kts',
    'features', jsonb_build_array(
      'Flybridge',
      'Beach club',
      'Water toys included',
      'Full air conditioning',
      'Stabilizers',
      'Tender garage'
    )
  ),
  'Maritime investments involve risks including seasonal demand variations, maintenance costs, mooring fees, crew expenses, insurance, and regulatory compliance. Weather and market conditions may impact charter bookings.'
) ON CONFLICT DO NOTHING;

-- Project 4: Ferrari F50
INSERT INTO launchpad_projects (
  id,
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
  waitlist_target_days,
  specifications,
  risk_disclosure
) VALUES (
  '550e8400-e29b-41d4-a716-449655440004',
  'Ferrari F50 - Ready to Buy',
  'Rare 1996 Ferrari F50 in pristine condition, ready for immediate purchase. One of only 349 units ever produced, this iconic supercar combines Formula 1 technology with road car usability. The vehicle is verified, serviced, and available for fractional ownership investment.

Phase 1: Join Waitlist (Wallet Signature Required)
Phase 2: Immediate Funding Round - Asset is already identified and ready to purchase for €4.6M
Phase 3: Purchase completion and security token distribution (ERC1400)',
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
  50,
  'waitlist',
  'active',
  12,
  60,
  jsonb_build_object(
    'make', 'Ferrari',
    'model', 'F50',
    'year', '1996',
    'vin', 'ZFFPA40B000******',
    'mileage', '15,400 km',
    'engine', '4.7L V12 naturally aspirated',
    'power', '520 HP @ 8,500 RPM',
    'transmission', '6-speed manual',
    'drivetrain', 'RWD',
    'color', 'Rosso Corsa',
    'interior', 'Black Leather',
    'production', 'Unit 127 of 349',
    'condition', 'Excellent',
    'service_history', 'Full Ferrari main dealer service history',
    'features', jsonb_build_array(
      'Carbon fiber chassis',
      'Removable hardtop',
      'Original F1-derived V12',
      'Sequential lighting',
      'Factory Tubi exhaust',
      'Books and tools',
      'Ferrari Classiche certified'
    )
  ),
  'Collectible car investments involve market volatility, maintenance and storage costs, insurance premiums, and potential depreciation. Values are subject to collector demand, economic conditions, and authenticity verification.'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
