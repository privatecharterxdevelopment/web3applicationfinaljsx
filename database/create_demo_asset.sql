-- =====================================================
-- CREATE DEMO ASSET - Gulfstream G650ER
-- Real tokenized asset with full details for showcase
-- =====================================================

-- First, get your user_id (replace with your actual user_id)
-- Run this to find your user_id:
-- SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Insert the demo asset
INSERT INTO user_requests (
  user_id,
  type,
  status,
  estimated_cost,
  data,
  created_at
) VALUES (
  'YOUR-USER-ID-HERE', -- Replace with your actual user_id
  'tokenization',
  'coming_soon', -- Can be: 'coming_soon', 'waitlist_open', 'approved_for_sto', 'live_on_marketplace'
  75000000.00, -- $75M total value
  jsonb_build_object(
    -- Basic Info
    'asset_name', 'Gulfstream G650ER',
    'asset_type', 'aircraft',
    'category', 'jet',
    'description', 'Ultra-long-range business jet offering unparalleled luxury, performance, and global reach. Perfect for fractional ownership and charter operations.',

    -- Tokenomics
    'token_type', 'security',
    'token_standard', 'ERC-1400',
    'total_supply', 1000,
    'price_per_token', 75000,
    'min_investment', 75000,
    'max_investment', 7500000,

    -- Financial Details
    'estimated_apy', 8.5,
    'revenue_distribution', 'quarterly',
    'revenue_currency', 'USDC',
    'expected_annual_revenue', 6375000,
    'management_fee', 2.5,
    'platform_fee', 2.5,

    -- Asset Specifications
    'specifications', jsonb_build_object(
      'manufacturer', 'Gulfstream Aerospace',
      'model', 'G650ER',
      'year', 2023,
      'registration', 'N650GS',
      'serial_number', '6500',
      'total_time', '250 hours',
      'range', '7,500 nautical miles',
      'max_speed', '610 mph (Mach 0.925)',
      'cruise_speed', '516 mph (Mach 0.85)',
      'max_altitude', '51,000 feet',
      'passengers', 19,
      'crew', 4,
      'engines', '2x Rolls-Royce BR725 A1-12',
      'fuel_capacity', '44,200 lbs',
      'baggage_capacity', '195 cubic feet',
      'cabin_length', '53.6 feet',
      'cabin_width', '8.2 feet',
      'cabin_height', '6.5 feet'
    ),

    -- Features & Amenities
    'features', jsonb_build_array(
      'Full galley with oven and microwave',
      'Enclosed lavatory with shower',
      'Advanced Honeywell Primus Epic avionics',
      'Enhanced Vision System (EVS)',
      'Synthetic Vision System (SVS)',
      'Cabin Management System',
      'High-speed WiFi and satellite phone',
      'Full entertainment system',
      'Climate control zones',
      'Sound-proof cabin',
      'Lie-flat sleeping accommodations',
      'Conference seating area',
      'Full bar service'
    ),

    -- Location & Operator
    'location', 'Teterboro Airport (KTEB), New Jersey, USA',
    'home_base', 'KTEB',
    'operator', 'PrivateCharterX Partners',
    'operator_type', 'third-party',
    'management_company', 'Executive Jet Management',

    -- Legal & Compliance
    'jurisdiction', 'Delaware, USA',
    'spv_entity', 'G650ER Holdings LLC',
    'has_spv', true,
    'spv_details', 'Delaware LLC established for aircraft ownership and charter operations',
    'sec_compliant', true,
    'accredited_only', true,
    'reg_d_506c', true,

    -- Tokenization Details
    'lockup_period', 12, -- months
    'is_transferable', true,
    'secondary_market_enabled', true,
    'minimum_holding_period', 6, -- months
    'is_burnable', false,

    -- Revenue Model
    'revenue_model', 'Charter operations and fractional ownership leasing',
    'revenue_split', jsonb_build_object(
      'token_holders', 75,
      'operator', 20,
      'platform', 2.5,
      'reserve_fund', 2.5
    ),

    -- Images (use real Unsplash URLs or your own)
    'images', jsonb_build_array(
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200',
      'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1200',
      'https://images.unsplash.com/photo-1583792297139-efe07e2f1a5b?w=1200',
      'https://images.unsplash.com/photo-1583792297139-efe07e2f1a5b?w=1200'
    ),

    -- Documents (URLs to real or placeholder documents)
    'documents', jsonb_build_array(
      jsonb_build_object(
        'name', 'Private Placement Memorandum',
        'type', 'ppm',
        'url', 'https://example.com/docs/g650-ppm.pdf',
        'description', 'Complete offering details and risk disclosures'
      ),
      jsonb_build_object(
        'name', 'Aircraft Appraisal Report',
        'type', 'valuation',
        'url', 'https://example.com/docs/g650-appraisal.pdf',
        'description', 'Independent third-party valuation by Aircraft Bluebook'
      ),
      jsonb_build_object(
        'name', 'Operating Agreement',
        'type', 'legal',
        'url', 'https://example.com/docs/g650-operating-agreement.pdf',
        'description', 'LLC operating agreement and token holder rights'
      ),
      jsonb_build_object(
        'name', 'Financial Projections',
        'type', 'financial',
        'url', 'https://example.com/docs/g650-projections.pdf',
        'description', '5-year revenue and expense projections'
      ),
      jsonb_build_object(
        'name', 'Insurance Certificate',
        'type', 'insurance',
        'url', 'https://example.com/docs/g650-insurance.pdf',
        'description', 'Comprehensive hull and liability coverage'
      )
    ),

    -- Waitlist Settings
    'waitlist_enabled', true,
    'waitlist_launch_date', '2025-02-01',
    'early_access_discount', 5, -- 5% discount for waitlist members

    -- Timeline
    'launch_date', '2025-02-15T00:00:00Z',
    'funding_deadline', '2025-04-15T00:00:00Z',

    -- Risk Factors
    'risk_factors', jsonb_build_array(
      'Aircraft depreciation and market value fluctuations',
      'Charter demand variability',
      'Maintenance and operational costs',
      'Regulatory changes affecting aviation industry',
      'Weather and operational disruptions',
      'Insurance cost increases',
      'Token liquidity on secondary market not guaranteed'
    ),

    -- Highlights
    'highlights', jsonb_build_array(
      'Industry-leading 7,500 nm range',
      'Fastest certified civilian aircraft',
      'Premium cabin with full amenities',
      'Proven charter demand in ultra-long-range segment',
      'Managed by top-tier aviation management company',
      'Quarterly revenue distributions in USDC',
      'SEC-compliant security token offering',
      'Secondary market trading after 6-month lockup'
    ),

    -- Investment Tiers
    'investment_tiers', jsonb_build_array(
      jsonb_build_object(
        'name', 'Silver',
        'min_tokens', 1,
        'max_tokens', 13,
        'benefits', jsonb_build_array('Quarterly dividends', 'Access to investor portal', 'Annual report')
      ),
      jsonb_build_object(
        'name', 'Gold',
        'min_tokens', 14,
        'max_tokens', 66,
        'benefits', jsonb_build_array('All Silver benefits', 'Priority customer support', '10 complimentary flight hours per year')
      ),
      jsonb_build_object(
        'name', 'Platinum',
        'min_tokens', 67,
        'max_tokens', 1000,
        'benefits', jsonb_build_array('All Gold benefits', 'Governance voting rights', '50 complimentary flight hours per year', 'VIP event invitations')
      )
    ),

    -- FAQ
    'faq', jsonb_build_array(
      jsonb_build_object(
        'question', 'How are dividends calculated?',
        'answer', 'Dividends are distributed quarterly based on net charter revenue after operating costs and reserves. Token holders receive 75% of net profits proportional to their holdings.'
      ),
      jsonb_build_object(
        'question', 'Can I use the aircraft personally?',
        'answer', 'Token holders receive complimentary flight hours based on their tier (Gold: 10hrs/year, Platinum: 50hrs/year). Additional hours can be purchased at preferred rates.'
      ),
      jsonb_build_object(
        'question', 'What happens if the aircraft is damaged?',
        'answer', 'The aircraft is fully insured for hull damage and liability. Insurance proceeds would either repair the aircraft or compensate token holders for their proportional value.'
      ),
      jsonb_build_object(
        'question', 'Can I sell my tokens?',
        'answer', 'Yes, after a 6-month lockup period, tokens can be traded on our P2P marketplace to other accredited investors.'
      )
    )
  ),
  NOW()
) RETURNING id;

-- =====================================================
-- NOTES:
-- 1. Replace 'YOUR-USER-ID-HERE' with your actual user_id
-- 2. Status options:
--    - 'coming_soon' = Teaser only, no investment
--    - 'waitlist_open' = Users can join waitlist
--    - 'approved_for_sto' = Ready for investment
--    - 'live_on_marketplace' = Live and accepting investments
-- 3. Images: Replace with real URLs from your CDN/storage
-- 4. Documents: Upload real PDFs and update URLs
-- =====================================================
