-- Insert 28 diverse demo campaigns with comprehensive transparency information
-- Run this after 003_add_transparency_fields.sql and 003b_insert_demo_users.sql

-- Note: Using placeholder images from https://via.placeholder.com
-- Replace with actual hosted images in production

-- For active campaigns: start_date is in the past, end_date = start_date + duration_days
-- For funded campaigns: Both start_date and end_date are in the past

-- Campaign 1: DeFi Lending Protocol (Active)
INSERT INTO campaigns (
  id, creator_wallet, title, short_description, description,
  category, goal_amount, raised_amount, currency, duration_days,
  status, pricing_tier, transaction_fee_percentage,
  logo_image_url, header_image_url,
  company_name, company_location, company_description,
  dao_purpose, contributor_benefits, utility_type,
  risk_factors, legal_structure,
  backer_count, view_count,
  tags, github_url, whitepaper_url,
  created_at, published_at, start_date, end_date,
  safe_address
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  'DeFiMax - Decentralized Lending Protocol',
  'Next-generation peer-to-peer lending with AI-powered risk assessment',
  'DeFiMax revolutionizes decentralized lending by combining traditional credit scoring with blockchain transparency. Our protocol enables users to lend and borrow digital assets with competitive rates powered by machine learning algorithms that assess creditworthiness in real-time.

Key Features:
• AI-Powered Risk Assessment
• Multi-chain Support (Ethereum, Base, Polygon)
• Flash Loan Protection
• Automated Liquidation System
• Governance Token Rewards

Technical Stack:
• Solidity Smart Contracts (audited by CertiK)
• Chainlink Oracles for price feeds
• The Graph for indexing
• React + Web3.js frontend',
  'defi',
  500000, 125000, 'USDC', 60,
  'active', 'enterprise', 2,
  'https://via.placeholder.com/200/4F46E5/FFFFFF?text=DeFiMax',
  'https://via.placeholder.com/1200x400/4F46E5/FFFFFF?text=DeFiMax+Protocol',
  'DeFiMax Foundation',
  'Singapore',
  'DeFiMax Foundation is a Singapore-based blockchain company specializing in decentralized finance solutions. Founded in 2023 by former Goldman Sachs quants and blockchain developers.',
  'To democratize access to credit and lending globally through transparent, algorithmic risk assessment',
  'Contributors receive DFMX governance tokens with voting rights, protocol fee sharing (10% APY), early access to new features, and NFT membership badges',
  'governance',
  'Smart contract risk, regulatory uncertainty, market volatility, oracle manipulation risk, liquidation cascades',
  'Singapore Foundation Limited (Non-profit)',
  342, 1234,
  ARRAY['DeFi', 'Lending', 'AI', 'Governance'],
  'https://github.com/defimax/protocol',
  'https://docs.defimax.io/whitepaper.pdf',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days' + INTERVAL '60 days',
  '0x1234567890123456789012345678901234567890'
);
