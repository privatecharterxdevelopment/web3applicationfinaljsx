-- =====================================================
-- POLYMESH INTEGRATION - Standalone Database Migration
-- =====================================================
-- WICHTIG: Komplett eigenständige Tabellen!
-- Keine Abhängigkeiten zu bestehenden Tabellen.
-- =====================================================

-- =====================================================
-- 1. POLYMESH_USERS - Polymesh Identity für User
-- =====================================================

CREATE TABLE IF NOT EXISTS polymesh_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Verknüpfung zu bestehendem User (optional, falls auth.users existiert)
  user_id UUID,
  user_email TEXT, -- Backup für Zuordnung

  -- Polymesh Identity
  polymesh_did TEXT UNIQUE, -- Decentralized Identifier
  polymesh_primary_key TEXT, -- Primary signing key

  -- CDD (Customer Due Diligence) Status
  cdd_provider TEXT, -- z.B. 'netki', 'jumio', 'fractal'
  cdd_claim_id TEXT,
  cdd_verified_at TIMESTAMP,
  cdd_expiry_date TIMESTAMP,

  -- Investor Status
  investor_type TEXT DEFAULT 'retail', -- 'retail', 'accredited', 'institutional'
  accredited_investor BOOLEAN DEFAULT FALSE,
  accreditation_verified_at TIMESTAMP,
  accreditation_expiry_date TIMESTAMP,

  -- Jurisdiction
  jurisdiction_country TEXT, -- ISO 3166-1 alpha-2 (z.B. 'US', 'CH', 'DE')
  jurisdiction_verified BOOLEAN DEFAULT FALSE,

  -- Wallet Address (für EVM Verknüpfung)
  wallet_address TEXT,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'revoked'

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polymesh_users_user_id ON polymesh_users(user_id);
CREATE INDEX IF NOT EXISTS idx_polymesh_users_did ON polymesh_users(polymesh_did);
CREATE INDEX IF NOT EXISTS idx_polymesh_users_email ON polymesh_users(user_email);
CREATE INDEX IF NOT EXISTS idx_polymesh_users_wallet ON polymesh_users(wallet_address);

-- =====================================================
-- 2. POLYMESH_ASSETS - Tokenized Assets
-- =====================================================

CREATE TABLE IF NOT EXISTS polymesh_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Optional: Verknüpfung zu bestehendem Projekt
  external_project_id UUID, -- Kann launchpad_projects.id sein, aber keine FK

  -- Polymesh Asset Details
  ticker TEXT UNIQUE NOT NULL, -- Polymesh Ticker (max 12 chars)
  asset_id TEXT UNIQUE, -- On-chain Asset UUID
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT DEFAULT 'EquityCommon', -- Polymesh Asset Type
  category TEXT, -- 'private-jet', 'yacht', 'luxury-car', 'real-estate'

  -- Issuer
  issuer_did TEXT NOT NULL,
  issuer_name TEXT,

  -- Token Details
  total_supply BIGINT DEFAULT 0,
  divisible BOOLEAN DEFAULT TRUE,
  token_price DECIMAL(20, 6),

  -- Financial Info
  target_amount DECIMAL(20, 2),
  raised_amount DECIMAL(20, 2) DEFAULT 0,
  min_investment DECIMAL(20, 2),
  max_investment DECIMAL(20, 2),
  estimated_apy DECIMAL(5, 2),

  -- Images
  image_url TEXT,
  cover_image_url TEXT,

  -- Location
  location TEXT,

  -- Compliance Configuration
  compliance_requirements JSONB DEFAULT '[]',
  transfer_restrictions JSONB DEFAULT '[]',
  allowed_jurisdictions TEXT[] DEFAULT ARRAY['CH', 'DE', 'GB', 'FR'],
  blocked_jurisdictions TEXT[] DEFAULT ARRAY['KP', 'IR', 'CU'],
  requires_accreditation BOOLEAN DEFAULT FALSE,
  requires_kyc BOOLEAN DEFAULT TRUE,

  -- Lock-up
  lock_up_period_days INT DEFAULT 0,
  lock_up_end_date TIMESTAMP,

  -- Offering Details
  offering_status TEXT DEFAULT 'upcoming', -- 'upcoming', 'open', 'closed', 'paused'
  current_phase TEXT DEFAULT 'waitlist', -- 'waitlist', 'fundraising', 'trading'
  offering_start_date TIMESTAMP,
  offering_end_date TIMESTAMP,
  funding_round TEXT,

  -- On-chain Status
  is_frozen BOOLEAN DEFAULT FALSE,
  frozen_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polymesh_assets_ticker ON polymesh_assets(ticker);
CREATE INDEX IF NOT EXISTS idx_polymesh_assets_issuer ON polymesh_assets(issuer_did);
CREATE INDEX IF NOT EXISTS idx_polymesh_assets_status ON polymesh_assets(offering_status);
CREATE INDEX IF NOT EXISTS idx_polymesh_assets_category ON polymesh_assets(category);

-- =====================================================
-- 3. POLYMESH_INVESTMENTS - Investment Tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS polymesh_investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Verknüpfungen (keine FKs, nur IDs)
  asset_id UUID, -- polymesh_assets.id
  user_id UUID, -- auth.users.id oder polymesh_users.user_id

  -- Investor Identity
  investor_did TEXT NOT NULL,
  investor_email TEXT,
  wallet_address TEXT,

  -- Investment Details
  ticker TEXT NOT NULL,
  tokens_amount BIGINT NOT NULL,
  price_per_token DECIMAL(20, 6),
  total_value DECIMAL(20, 2),
  currency TEXT DEFAULT 'USDC',

  -- Polymesh Settlement
  instruction_id TEXT, -- Settlement instruction ID
  venue_id TEXT, -- Polymesh Venue ID
  leg_id TEXT,

  -- Settlement Status
  settlement_status TEXT DEFAULT 'pending',
  -- 'pending', 'instruction_created', 'affirmed', 'rejected', 'executed', 'failed'

  sender_affirmed BOOLEAN DEFAULT FALSE,
  receiver_affirmed BOOLEAN DEFAULT FALSE,

  affirmed_at TIMESTAMP,
  executed_at TIMESTAMP,

  -- Blockchain Details
  block_number BIGINT,
  transaction_hash TEXT,

  -- Error Handling
  error_message TEXT,
  retry_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polymesh_investments_user ON polymesh_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_polymesh_investments_asset ON polymesh_investments(asset_id);
CREATE INDEX IF NOT EXISTS idx_polymesh_investments_did ON polymesh_investments(investor_did);
CREATE INDEX IF NOT EXISTS idx_polymesh_investments_status ON polymesh_investments(settlement_status);
CREATE INDEX IF NOT EXISTS idx_polymesh_investments_ticker ON polymesh_investments(ticker);

-- =====================================================
-- 4. POLYMESH_HOLDINGS - Token Balance Tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS polymesh_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Verknüpfungen (keine FKs)
  user_id UUID,
  asset_id UUID,

  -- Identity
  holder_did TEXT NOT NULL,
  holder_email TEXT,
  wallet_address TEXT,

  -- Balance
  ticker TEXT NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0,
  locked_balance BIGINT DEFAULT 0,

  -- Value Tracking
  average_cost_basis DECIMAL(20, 6),
  total_invested DECIMAL(20, 2),
  current_value DECIMAL(20, 2),

  -- Compliance
  compliance_status TEXT DEFAULT 'compliant', -- 'compliant', 'non_compliant', 'under_review'
  last_compliance_check TIMESTAMP,

  -- Sync Status
  last_synced_at TIMESTAMP,
  sync_status TEXT DEFAULT 'synced', -- 'synced', 'pending', 'error'

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ein Holding-Eintrag pro User pro Asset
  UNIQUE(holder_did, ticker)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polymesh_holdings_user ON polymesh_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_polymesh_holdings_did ON polymesh_holdings(holder_did);
CREATE INDEX IF NOT EXISTS idx_polymesh_holdings_ticker ON polymesh_holdings(ticker);

-- =====================================================
-- 5. POLYMESH_COMPLIANCE_CLAIMS - CDD/Attestation Claims
-- =====================================================

CREATE TABLE IF NOT EXISTS polymesh_compliance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User Reference
  polymesh_user_id UUID,

  -- Claim Details
  target_did TEXT NOT NULL,
  claim_type TEXT NOT NULL, -- 'CustomerDueDiligence', 'Accredited', 'Jurisdiction', 'Exempted', 'Affiliate'
  claim_issuer_did TEXT NOT NULL,

  -- Scope (optional)
  scope_type TEXT,
  scope_value TEXT,

  -- Claim Value
  claim_value JSONB,

  -- Validity
  is_valid BOOLEAN DEFAULT TRUE,
  issued_at TIMESTAMP,
  expiry_date TIMESTAMP,
  revoked_at TIMESTAMP,

  -- On-chain Reference
  claim_id TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_claims_user ON polymesh_compliance_claims(polymesh_user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_claims_did ON polymesh_compliance_claims(target_did);
CREATE INDEX IF NOT EXISTS idx_compliance_claims_type ON polymesh_compliance_claims(claim_type);

-- =====================================================
-- 6. POLYMESH_DOCUMENTS - Asset Documents
-- =====================================================

CREATE TABLE IF NOT EXISTS polymesh_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Asset Reference
  asset_id UUID,
  ticker TEXT,

  -- Document Info
  name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  description TEXT,

  -- File
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INT,
  mime_type TEXT DEFAULT 'application/pdf',

  -- Polymesh Document Link
  content_hash TEXT,
  polymesh_document_uri TEXT,

  -- Access Control
  is_public BOOLEAN DEFAULT FALSE,
  requires_kyc BOOLEAN DEFAULT TRUE,
  requires_investment BOOLEAN DEFAULT FALSE,

  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polymesh_documents_asset ON polymesh_documents(asset_id);
CREATE INDEX IF NOT EXISTS idx_polymesh_documents_ticker ON polymesh_documents(ticker);
CREATE INDEX IF NOT EXISTS idx_polymesh_documents_type ON polymesh_documents(document_type);

-- =====================================================
-- 7. POLYMESH_TRANSACTIONS - Transaction Log
-- =====================================================

CREATE TABLE IF NOT EXISTS polymesh_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User Reference
  user_id UUID,
  polymesh_did TEXT,

  -- Transaction Details
  transaction_type TEXT NOT NULL,

  -- References
  asset_ticker TEXT,
  instruction_id TEXT,

  -- Blockchain Details
  transaction_hash TEXT,
  block_number BIGINT,
  block_hash TEXT,

  -- Status
  status TEXT DEFAULT 'pending',

  -- Error Handling
  error_code TEXT,
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polymesh_tx_user ON polymesh_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_polymesh_tx_did ON polymesh_transactions(polymesh_did);
CREATE INDEX IF NOT EXISTS idx_polymesh_tx_type ON polymesh_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_polymesh_tx_hash ON polymesh_transactions(transaction_hash);

-- =====================================================
-- 8. POLYMESH_WAITLIST - Waitlist für Assets
-- =====================================================

CREATE TABLE IF NOT EXISTS polymesh_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Asset Reference
  asset_id UUID,
  ticker TEXT NOT NULL,

  -- User Info
  user_id UUID,
  email TEXT NOT NULL,
  wallet_address TEXT,
  polymesh_did TEXT,

  -- Signature (für Wallet-Verifizierung)
  signature TEXT,
  signature_message TEXT,

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'converted', 'removed'
  notified_at TIMESTAMP,

  -- Timestamps
  joined_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(ticker, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polymesh_waitlist_asset ON polymesh_waitlist(asset_id);
CREATE INDEX IF NOT EXISTS idx_polymesh_waitlist_ticker ON polymesh_waitlist(ticker);
CREATE INDEX IF NOT EXISTS idx_polymesh_waitlist_email ON polymesh_waitlist(email);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE polymesh_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymesh_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymesh_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymesh_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymesh_compliance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymesh_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymesh_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymesh_waitlist ENABLE ROW LEVEL SECURITY;

-- Polymesh Users: Users see their own data
CREATE POLICY "polymesh_users_select" ON polymesh_users
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "polymesh_users_insert" ON polymesh_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "polymesh_users_update" ON polymesh_users
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Polymesh Assets: Public read
CREATE POLICY "polymesh_assets_select" ON polymesh_assets
  FOR SELECT USING (true);

-- Polymesh Investments: Users see their own
CREATE POLICY "polymesh_investments_select" ON polymesh_investments
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "polymesh_investments_insert" ON polymesh_investments
  FOR INSERT WITH CHECK (true);

-- Polymesh Holdings: Users see their own
CREATE POLICY "polymesh_holdings_select" ON polymesh_holdings
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Compliance Claims: All can view
CREATE POLICY "polymesh_claims_select" ON polymesh_compliance_claims
  FOR SELECT USING (true);

-- Documents: Public docs viewable
CREATE POLICY "polymesh_documents_select" ON polymesh_documents
  FOR SELECT USING (is_public = TRUE OR auth.uid() IS NOT NULL);

-- Transactions: Users see their own
CREATE POLICY "polymesh_tx_select" ON polymesh_transactions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Waitlist: Public insert, own select
CREATE POLICY "polymesh_waitlist_select" ON polymesh_waitlist
  FOR SELECT USING (true);

CREATE POLICY "polymesh_waitlist_insert" ON polymesh_waitlist
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 10. SEED DATA - Demo Assets
-- =====================================================

INSERT INTO polymesh_assets (
  ticker, name, description, asset_type, category,
  issuer_did, issuer_name, total_supply, token_price,
  target_amount, raised_amount, min_investment, max_investment,
  estimated_apy, image_url, cover_image_url, location,
  offering_status, current_phase, funding_round,
  allowed_jurisdictions, requires_kyc
) VALUES
(
  'JET001',
  'Gulfstream G650ER Fractional',
  'Fractional ownership in a 2023 Gulfstream G650ER based in Geneva. Long-range luxury business jet with intercontinental capability.',
  'EquityCommon', 'private-jet',
  '0x1234567890abcdef1234567890abcdef12345678', 'PrivateCharterX AG',
  10000, 1000,
  10000000, 4500000, 10000, 1000000,
  12.5,
  'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
  'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1920',
  'Geneva, Switzerland',
  'open', 'fundraising', 'Series A',
  ARRAY['CH', 'DE', 'FR', 'GB', 'AT'], TRUE
),
(
  'YCT001',
  'Azimut 72 Mediterranean',
  'Luxury 72-foot yacht based in Monaco. Prime Mediterranean charter revenue with proven track record.',
  'EquityCommon', 'yacht',
  '0xabcdef1234567890abcdef1234567890abcdef12', 'PCX Maritime SA',
  5000, 500,
  2500000, 1800000, 5000, 500000,
  15.2,
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1920',
  'Monaco',
  'open', 'fundraising', 'Seed',
  ARRAY['MC', 'FR', 'IT', 'ES', 'GB'], TRUE
),
(
  'F50MCO',
  'Ferrari F50 Collector Edition',
  'Rare 1996 Ferrari F50 in pristine condition. One of only 349 units produced. Ferrari Classiche certified.',
  'EquityCommon', 'luxury-car',
  '0x9876543210fedcba9876543210fedcba98765432', 'PCX Collectibles',
  4600, 1000,
  4600000, 920000, 10000, 460000,
  8.5,
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920',
  'Monaco',
  'open', 'fundraising', 'Private Sale',
  ARRAY['MC', 'CH', 'DE', 'GB', 'FR'], TRUE
),
(
  'HY15NYC',
  '15 Hudson Yards Penthouse',
  'Fractional ownership in a luxury penthouse at 15 Hudson Yards, NYC. Prime Manhattan real estate.',
  'EquityCommon', 'real-estate',
  '0xfedcba0987654321fedcba0987654321fedcba09', 'PCX Real Estate LLC',
  100000, 100,
  10000000, 7500000, 1000, 2000000,
  6.8,
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920',
  'New York, USA',
  'open', 'fundraising', 'Series A',
  ARRAY['US'], TRUE
),
(
  'PHE300',
  'Embraer Phenom 300E',
  'World''s best-selling light business jet. 2024 model based in London City Airport with EU charter license.',
  'EquityCommon', 'private-jet',
  '0x1111222233334444555566667777888899990000', 'PCX Aviation UK',
  8000, 750,
  6000000, 0, 7500, 600000,
  14.2,
  'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800',
  'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=1920',
  'London, UK',
  'upcoming', 'waitlist', 'Pre-Seed',
  ARRAY['GB', 'CH', 'DE', 'FR', 'NL'], TRUE
),
(
  'SUN105',
  'Sunseeker 105 Sport Yacht',
  '105-foot Sunseeker sport yacht based in Ibiza. Premium summer charter destination with high demand.',
  'EquityCommon', 'yacht',
  '0x5555666677778888999900001111222233334444', 'PCX Yachting ES',
  12000, 400,
  4800000, 0, 4000, 480000,
  16.8,
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920',
  'Ibiza, Spain',
  'upcoming', 'waitlist', 'Seed',
  ARRAY['ES', 'FR', 'IT', 'GB', 'DE'], TRUE
)
ON CONFLICT (ticker) DO NOTHING;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
