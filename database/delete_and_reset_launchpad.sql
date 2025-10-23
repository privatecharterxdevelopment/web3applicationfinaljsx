-- =====================================================
-- DELETE ALL LAUNCHPAD DATA AND START FRESH
-- =====================================================

-- Delete all existing data
DELETE FROM launchpad_transactions;
DELETE FROM launchpad_waitlist;
DELETE FROM launchpad_projects;

-- =====================================================
-- INSERT ONLY 4 PROJECTS - ALL STARTING AT 0
-- =====================================================

-- Project 1: Embraer Phenom 300 (0/450)
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
  'Fractional ownership of a 2021 Embraer Phenom 300 light jet based in Geneva. This aircraft offers exceptional performance for European routes with best-in-class cabin comfort.

Phase 1: Join Waitlist (Wallet Signature Required)
Phase 2: Fundraising with pre-buy agreement and automatic blockchain refund if target not reached within 90 days
Phase 3: SPV formation, aircraft acquisition, and security token distribution (ERC1400)',
  'private-jet',
  'Embraer Phenom 300',
  'Geneva, Switzerland',
  2021,
  'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
  'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1920',
  'ERC-3643',
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
  'upcoming',
  0,
  90
);

-- Project 2: Gulfstream G550 (0/500)
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
  'Ultra-long-range business jet with global reach. This 2019 Gulfstream G550 offers unmatched comfort and capability, serving routes from Dubai to the Americas and Asia.

Phase 1: Join Waitlist (Wallet Signature Required)
Phase 2: Fundraising with pre-buy agreement and automatic blockchain refund if target not reached within 90 days
Phase 3: SPV formation, aircraft acquisition, and security token distribution (ERC1400)',
  'private-jet',
  'Gulfstream G550',
  'Dubai, UAE',
  2019,
  'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800',
  'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=1920',
  'ERC-3643',
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
  'upcoming',
  0,
  90
);

-- Project 3: Azimut 72 Yacht (0/500)
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
  'Azimut 72 Yacht',
  '72-foot luxury yacht based in Malta, perfect for Mediterranean charters. This stunning Azimut offers exceptional comfort and performance with proven charter track record.

Phase 1: Join Waitlist (Wallet Signature Required)
Phase 2: Fundraising with pre-buy agreement and automatic blockchain refund if target not reached within 90 days
Phase 3: SPV formation, yacht acquisition, and security token distribution (ERC1400)',
  'yacht',
  'Azimut 72',
  'Malta',
  2022,
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1920',
  'ERC-3643',
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
  'upcoming',
  0,
  90
);

-- Project 4: Ferrari F50 (0/100)
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
  'Rare 1996 Ferrari F50 in pristine condition. One of only 349 units ever produced, this iconic supercar combines Formula 1 technology with road car usability. Fractional ownership opportunity.

Phase 1: Join Waitlist (Wallet Signature Required)
Phase 2: Fundraising with pre-buy agreement and automatic blockchain refund if target not reached within 90 days
Phase 3: SPV formation, vehicle acquisition, and security token distribution (ERC1400)',
  'luxury-car',
  'Ferrari F50',
  'Monaco',
  1996,
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920',
  'ERC-3643',
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
  'upcoming',
  0,
  60
);

-- =====================================================
-- VERIFY - Should show exactly 4 projects, all at 0
-- =====================================================
SELECT
  name,
  current_waitlist,
  target_waitlist,
  status,
  current_phase
FROM launchpad_projects
ORDER BY created_at DESC;
