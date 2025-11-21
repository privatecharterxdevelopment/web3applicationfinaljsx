-- Insert 1 demo campaign: DAO-driven car fleet
-- Run this after 003b_insert_demo_users.sql

-- Campaign 1: Lead Company GmbH - DAO Car Fleet
INSERT INTO campaigns (
  id, creator_wallet, title, short_description, description,
  category, goal_amount, raised_amount, currency, duration_days,
  status, pricing_tier, transaction_fee_percentage,
  logo_image_url, header_image_url,
  company_name, company_location, company_description,
  dao_purpose, contributor_benefits, utility_type,
  risk_factors, legal_structure,
  backer_count, view_count,
  tags, created_at, published_at, start_date, end_date,
  safe_address
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  'Lead Company - DAO Car Fleet',
  'Community-owned autonomous vehicle fleet managed entirely by DAO governance',
  'Lead Company GmbH is building Switzerland''s first fully DAO-driven car fleet. Every vehicle purchase, maintenance decision, and operational choice is voted on by token holders.

Our fleet will serve as a transparent, community-owned transportation service where profits are distributed back to DAO members. All vehicles are equipped with IoT sensors providing real-time data to the blockchain.

Key Features:
• 100% DAO governance - every decision is community-driven
• Smart contract-based profit distribution
• Real-time fleet monitoring on-chain
• Transparent operational costs
• Democratic vehicle selection process
• Automated maintenance scheduling
• Revenue sharing with token holders

The DAO will initially acquire 10 premium vehicles for the Swiss market, expanding based on community votes. Token holders receive governance rights and revenue share from fleet operations.',
  'dao',
  500000, 8500, 'USDC', 90,
  'active', 'enterprise', 2,
  'https://via.placeholder.com/200/2563EB/FFFFFF?text=Lead',
  'https://via.placeholder.com/1200x400/2563EB/FFFFFF?text=Lead+Company+Car+Fleet',
  'Lead Company GmbH',
  'Zurich, Switzerland',
  'Lead Company GmbH is a Swiss transportation innovation company pioneering DAO-governed vehicle fleets. Founded in 2024, we combine traditional fleet management expertise with decentralized governance.',
  'Democratize vehicle fleet ownership through transparent DAO governance, making transportation services truly community-owned and operated',
  'DAO governance tokens with voting rights on all fleet decisions, proportional revenue sharing from fleet operations, priority access to vehicles, quarterly profit distributions',
  'governance',
  'Regulatory uncertainty around DAO structures, vehicle maintenance costs, operational complexity, market adoption risk, insurance requirements',
  'Swiss GmbH (Limited Liability Company)',
  3, 124,
  ARRAY['DAO', 'Transportation', 'Fleet Management', 'Community Owned'],
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day' + INTERVAL '90 days',
  '0x1234567890123456789012345678901234567890'
);

-- Summary: 1 campaign created
-- Lead Company GmbH - DAO Car Fleet (ACTIVE)
-- Fully community-governed vehicle fleet in Switzerland
