-- Insert 28 diverse demo campaigns with comprehensive transparency information
-- Run this after 003_add_transparency_fields.sql

-- Note: Using placeholder images from https://via.placeholder.com
-- Replace with actual hosted images in production

-- Campaign 1: DeFi Lending Protocol
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
  NOW(),
  NOW() + INTERVAL '60 days',
  '0x1234567890123456789012345678901234567890'
);

-- Campaign 2: NFT Marketplace for Artists
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
  '00000000-0000-0000-0000-000000000002',
  '0x8' || repeat('0', 39),
  'ArtChain - Creator Economy Platform',
  'Zero-fee NFT marketplace empowering digital artists worldwide',
  'ArtChain is building the future of digital art ownership. Our platform charges 0% marketplace fees and gives creators 100% of their sales, funded entirely by our DAO treasury.',
  'nft',
  250000, 87500, 'USDC', 45,
  'active', 'pro', 3,
  'https://via.placeholder.com/200/F59E0B/FFFFFF?text=ArtChain',
  'https://via.placeholder.com/1200x400/F59E0B/FFFFFF?text=ArtChain+Marketplace',
  'ArtChain Ltd',
  'London, United Kingdom',
  'ArtChain is revolutionizing how artists monetize their work through NFT technology.',
  'Create a fair, transparent marketplace for digital creators',
  'NFT membership pass, revenue sharing from platform fees, voting rights on platform features',
  'nft',
  'Market adoption risk, competition from established platforms, royalty enforcement challenges',
  'UK Limited Company',
  156, 892,
  ARRAY['NFT', 'Art', 'Marketplace', 'Creators'],
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days',
  NOW() + INTERVAL '25 days',
  '0x2' || repeat('0', 39)
);

-- Campaign 3: Gaming DAO
INSERT INTO campaigns (
  id, creator_wallet, title, short_description, description,
  category, goal_amount, raised_amount, currency, duration_days,
  status, pricing_tier, transaction_fee_percentage,
  logo_image_url, header_image_url,
  company_name, company_location, company_description,
  dao_purpose, contributor_benefits, utility_type,
  backer_count, view_count,
  tags, created_at, published_at, start_date, end_date,
  safe_address
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '0x3' || repeat('0', 39),
  'MetaQuest Gaming DAO',
  'Community-owned gaming ecosystem with play-to-earn mechanics',
  'MetaQuest is developing a suite of blockchain games with true asset ownership and competitive gaming.',
  'gaming',
  1000000, 425000, 'USDC', 90,
  'active', 'enterprise', 2,
  'https://via.placeholder.com/200/8B5CF6/FFFFFF?text=MetaQuest',
  'https://via.placeholder.com/1200x400/8B5CF6/FFFFFF?text=MetaQuest+Gaming',
  'MetaQuest Interactive',
  'Los Angeles, USA',
  'Leading Web3 gaming studio with multiple successful launches.',
  'Build the premier community-governed gaming ecosystem',
  'Early access to games, in-game assets, tournament entries, revenue share',
  'token',
  'Game development delays, competition, token price volatility',
  'Delaware C-Corp',
  721, 3456,
  ARRAY['Gaming', 'Play-to-Earn', 'Metaverse'],
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days',
  NOW() + INTERVAL '60 days',
  '0x3' || repeat('0', 39)
);

-- Campaign 4: Real Estate Tokenization
INSERT INTO campaigns (
  id, creator_wallet, title, short_description, description,
  category, goal_amount, raised_amount, currency, duration_days,
  status, pricing_tier, transaction_fee_percentage,
  logo_image_url, header_image_url,
  company_name, company_location, company_description,
  dao_purpose, contributor_benefits, utility_type,
  rwa_details,
  backer_count, view_count,
  tags, created_at, published_at, start_date, end_date,
  safe_address
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  '0x4' || repeat('0', 39),
  'PropToken - Fractional Real Estate',
  'Invest in premium real estate with as little as $100',
  'PropToken enables fractional ownership of commercial real estate through blockchain tokenization.',
  'infrastructure',
  2000000, 550000, 'USDC', 60,
  'active', 'enterprise_audit', 1.5,
  'https://via.placeholder.com/200/10B981/FFFFFF?text=PropToken',
  'https://via.placeholder.com/1200x400/10B981/FFFFFF?text=PropToken+RWA',
  'PropToken Securities LLC',
  'New York, USA',
  'SEC-registered real estate tokenization platform.',
  'Democratize access to commercial real estate investment',
  'Fractional property ownership, quarterly rental income, property appreciation',
  'rwa',
  '{"asset_type": "Commercial Real Estate", "properties": 12, "total_value": "$50M", "avg_yield": "8.5%"}',
  218, 1567,
  ARRAY['RWA', 'Real Estate', 'Investment'],
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '50 days',
  '0x4' || repeat('0', 39)
);

-- Campaign 5: DeSci Research Funding
INSERT INTO campaigns (
  id, creator_wallet, title, short_description, description,
  category, goal_amount, raised_amount, currency, duration_days,
  status, pricing_tier, transaction_fee_percentage,
  logo_image_url, header_image_url,
  company_name, company_location, company_description,
  dao_purpose, contributor_benefits,
  backer_count, view_count,
  tags, created_at, published_at, start_date, end_date
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  '0x5' || repeat('0', 39),
  'BioDAO - Decentralized Science',
  'Funding breakthrough medical research through community governance',
  'BioDAO democratizes scientific research funding by enabling global communities to fund and benefit from medical breakthroughs.',
  'dao',
  750000, 180000, 'USDC', 90,
  'active', 'pro', 2.5,
  'https://via.placeholder.com/200/EF4444/FFFFFF?text=BioDAO',
  'https://via.placeholder.com/1200x400/EF4444/FFFFFF?text=BioDAO+Research',
  'BioDAO Foundation',
  'Zug, Switzerland',
  'Non-profit foundation advancing decentralized science.',
  'Accelerate medical research through decentralized funding',
  'IP-NFTs for research ownership, governance rights, royalty sharing on successful discoveries',
  89, 654,
  ARRAY['DeSci', 'Research', 'Medical', 'Governance'],
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days',
  NOW() + INTERVAL '65 days'
);

-- Add 23 more campaigns with diverse categories, funding amounts, and statuses
-- Campaigns 6-28 will follow similar pattern with varied data

-- Campaign 6: Carbon Credit Marketplace
INSERT INTO campaigns (
  id, creator_wallet, title, short_description, description,
  category, goal_amount, raised_amount, currency, duration_days,
  status, pricing_tier, transaction_fee_percentage,
  logo_image_url, header_image_url,
  company_name, company_location,
  dao_purpose, contributor_benefits, utility_type,
  backer_count, view_count,
  tags, created_at, published_at, start_date, end_date,
  safe_address
) VALUES (
  '00000000-0000-0000-0000-000000000006',
  '0x6' || repeat('0', 39),
  'EarthChain - Carbon Credit Trading',
  'Transparent blockchain-based carbon credit marketplace',
  'EarthChain brings transparency to carbon offset trading using blockchain technology and satellite verification.',
  'infrastructure',
  500000, 325000, 'USDC', 60,
  'active', 'enterprise', 2,
  'https://via.placeholder.com/200/059669/FFFFFF?text=EarthChain',
  'https://via.placeholder.com/1200x400/059669/FFFFFF?text=EarthChain+Carbon',
  'EarthChain Foundation',
  'Geneva, Switzerland',
  'Create transparent, verifiable carbon credit marketplace',
  'Carbon credit tokens, trading fee discounts, impact reports',
  'token',
  278, 1823,
  ARRAY['Climate', 'Carbon Credits', 'Sustainability'],
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days',
  NOW() + INTERVAL '48 days',
  '0x6' || repeat('0', 39)
);

-- Campaign 7-28: Quick insert of remaining campaigns
INSERT INTO campaigns (id, creator_wallet, title, short_description, description, category, goal_amount, raised_amount, currency, duration_days, status, pricing_tier, transaction_fee_percentage, logo_image_url, header_image_url, company_name, company_location, backer_count, view_count, tags, created_at, published_at, start_date, end_date, safe_address) VALUES
('00000000-0000-0000-0000-000000000007', '0x7' || repeat('0', 39), 'MusicDAO - Artist Royalties', 'Decentralized music rights and royalty distribution', 'Revolutionary platform for musicians to tokenize and trade song royalties.', 'nft', 350000, 145000, 'USDC', 45, 'active', 'pro', 3, 'https://via.placeholder.com/200/EC4899/FFFFFF?text=MusicDAO', 'https://via.placeholder.com/1200x400/EC4899/FFFFFF?text=MusicDAO', 'MusicDAO Inc', 'Nashville, USA', 94, 567, ARRAY['Music', 'NFT', 'Royalties'], NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() + INTERVAL '27 days', '0x7' || repeat('0', 39)),

('00000000-0000-0000-0000-000000000008', '0x8' || repeat('0', 39), 'CryptoInsure - DeFi Insurance', 'Decentralized insurance protocol for smart contracts', 'Protect your DeFi investments with community-backed insurance coverage.', 'defi', 800000, 280000, 'USDC', 75, 'active', 'enterprise', 2, 'https://via.placeholder.com/200/3B82F6/FFFFFF?text=CryptoInsure', 'https://via.placeholder.com/1200x400/3B82F6/FFFFFF?text=CryptoInsure', 'CryptoInsure DAO', 'Cayman Islands', 167, 1092, ARRAY['DeFi', 'Insurance', 'Risk Management'], NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW() + INTERVAL '53 days', '0x8' || repeat('0', 39)),

('00000000-0000-0000-0000-000000000009', '0x9' || repeat('0', 39), 'MetaOffice - Virtual Workspaces', 'VR-powered remote work collaboration platform', 'Next-generation virtual office spaces for distributed teams.', 'metaverse', 600000, 195000, 'USDC', 60, 'active', 'pro', 2.5, 'https://via.placeholder.com/200/F97316/FFFFFF?text=MetaOffice', 'https://via.placeholder.com/1200x400/F97316/FFFFFF?text=MetaOffice', 'MetaOffice Ltd', 'Dublin, Ireland', 132, 876, ARRAY['Metaverse', 'VR', 'Remote Work'], NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() + INTERVAL '52 days', '0x9' || repeat('0', 39)),

('00000000-0000-0000-0000-000000000010', '0xa' || repeat('0', 39), 'ChainVault - Crypto Custody', 'Institutional-grade cryptocurrency custody solution', 'Bank-level security for digital asset storage with insurance.', 'infrastructure', 1500000, 625000, 'USDC', 90, 'active', 'enterprise_audit', 1.5, 'https://via.placeholder.com/200/6366F1/FFFFFF?text=ChainVault', 'https://via.placeholder.com/1200x400/6366F1/FFFFFF?text=ChainVault', 'ChainVault Security Inc', 'Luxembourg', 89, 1245, ARRAY['Custody', 'Security', 'Institutional'], NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days', NOW() + INTERVAL '55 days', '0xa' || repeat('0', 39)),

('00000000-0000-0000-0000-000000000011', '0xb' || repeat('0', 39), 'FarmDAO - Agricultural Tech', 'Blockchain-powered supply chain for organic farming', 'Connecting consumers directly with sustainable farms.', 'dao', 400000, 98000, 'USDC', 60, 'active', 'starter', 4, 'https://via.placeholder.com/200/84CC16/FFFFFF?text=FarmDAO', 'https://via.placeholder.com/1200x400/84CC16/FFFFFF?text=FarmDAO', 'FarmDAO Collective', 'Amsterdam, Netherlands', 67, 432, ARRAY['Agriculture', 'Supply Chain', 'Sustainability'], NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() + INTERVAL '46 days', '0xb' || repeat('0', 39)),

('00000000-0000-0000-0000-000000000012', '0xc' || repeat('0', 39), 'LegalChain - Smart Legal Contracts', 'Automated legal agreements on blockchain', 'Digitize and automate legal processes with smart contracts.', 'infrastructure', 550000, 287000, 'USDC', 75, 'active', 'enterprise', 2, 'https://via.placeholder.com/200/0891B2/FFFFFF?text=LegalChain', 'https://via.placeholder.com/1200x400/0891B2/FFFFFF?text=LegalChain', 'LegalChain Technologies', 'Toronto, Canada', 156, 1098, ARRAY['Legal Tech', 'Smart Contracts', 'Automation'], NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NOW() + INTERVAL '47 days', '0xc' || repeat('0', 39)),

('00000000-0000-0000-0000-000000000013', '0xd' || repeat('0', 39), 'EduToken - Learn to Earn Platform', 'Blockchain-based education with token rewards', 'Get paid to learn new skills through verified certifications.', 'social', 300000, 125000, 'USDC', 45, 'active', 'pro', 3, 'https://via.placeholder.com/200/FBBF24/FFFFFF?text=EduToken', 'https://via.placeholder.com/1200x400/FBBF24/FFFFFF?text=EduToken', 'EduToken Foundation', 'Singapore', 234, 1567, ARRAY['Education', 'Learn-to-Earn', 'Certifications'], NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', NOW() + INTERVAL '26 days', '0xd' || repeat('0', 39)),

('00000000-0000-0000-0000-000000000014', '0xe' || repeat('0', 39), 'HealthDAO - Medical Records', 'Patient-owned encrypted medical record system', 'Take control of your health data with blockchain security.', 'infrastructure', 900000, 412000, 'USDC', 90, 'active', 'enterprise', 2, 'https://via.placeholder.com/200/DC2626/FFFFFF?text=HealthDAO', 'https://via.placeholder.com/1200x400/DC2626/FFFFFF?text=HealthDAO', 'HealthDAO Ltd', 'Estonia', 178, 934, ARRAY['Healthcare', 'Privacy', 'Medical Records'], NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', NOW() + INTERVAL '50 days', '0xe' || repeat('0', 39)),

('00000000-0000-0000-0000-000000000015', '0xf' || repeat('0', 39), 'SportsDAO - Athlete Funding', 'Crowdfund promising athletes for revenue sharing', 'Invest in athletes early-career and share in their success.', 'dao', 650000, 175000, 'USDC', 60, 'active', 'pro', 2.5, 'https://via.placeholder.com/200/F97316/FFFFFF?text=SportsDAO', 'https://via.placeholder.com/1200x400/F97316/FFFFFF?text=SportsDAO', 'SportsDAO International', 'Barcelona, Spain', 287, 2134, ARRAY['Sports', 'Crowdfunding', 'Revenue Share'], NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', NOW() + INTERVAL '49 days', '0xf' || repeat('0', 39));

-- Add 13 more campaigns (16-28) with completed/successful status for variety
INSERT INTO campaigns (id, creator_wallet, title, short_description, description, category, goal_amount, raised_amount, currency, duration_days, status, pricing_tier, transaction_fee_percentage, logo_image_url, header_image_url, company_name, company_location, backer_count, view_count, tags, created_at, published_at, start_date, end_date, safe_address) VALUES
('00000000-0000-0000-0000-000000000016', '0x10' || repeat('0', 38), 'TokenSwap DEX', 'Next-gen decentralized exchange with zero slippage', 'Advanced AMM with concentrated liquidity and optimal routing.', 'defi', 1200000, 1200000, 'USDC', 60, 'funded', 'enterprise', 1.5, 'https://via.placeholder.com/200/8B5CF6/FFFFFF?text=TokenSwap', 'https://via.placeholder.com/1200x400/8B5CF6/FFFFFF?text=TokenSwap+DEX', 'TokenSwap Protocol', 'Singapore', 892, 4567, ARRAY['DeFi', 'DEX', 'Trading'], NOW() - INTERVAL '95 days', NOW() - INTERVAL '95 days', NOW() - INTERVAL '95 days', NOW() - INTERVAL '35 days', '0x10' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000017', '0x11' || repeat('0', 38), 'MetaLand Virtual Plots', 'Own virtual land in the fastest-growing metaverse', 'Prime virtual real estate with development tools.', 'gaming', 800000, 800000, 'USDC', 45, 'funded', 'enterprise', 2, 'https://via.placeholder.com/200/10B981/FFFFFF?text=MetaLand', 'https://via.placeholder.com/1200x400/10B981/FFFFFF?text=MetaLand', 'MetaLand Inc', 'San Francisco, USA', 1234, 8976, ARRAY['Metaverse', 'Virtual Land', 'Gaming'], NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days', NOW() - INTERVAL '75 days', '0x11' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000018', '0x12' || repeat('0', 38), 'AIArt Generator', 'AI-powered NFT creation tool for artists', 'Turn your ideas into unique NFTs with AI assistance.', 'nft', 250000, 250000, 'USDC', 30, 'funded', 'pro', 3, 'https://via.placeholder.com/200/EC4899/FFFFFF?text=AIArt', 'https://via.placeholder.com/1200x400/EC4899/FFFFFF?text=AIArt+Generator', 'AIArt Studio', 'Seoul, South Korea', 567, 3421, ARRAY['AI', 'NFT', 'Art Generation'], NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days', NOW() - INTERVAL '55 days', '0x12' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000019', '0x13' || repeat('0', 38), 'StreamDAO - Content Creation', 'Decentralized video streaming with creator rewards', 'YouTube alternative where creators own their content.', 'social', 1500000, 725000, 'USDC', 90, 'active', 'enterprise_audit', 1.5, 'https://via.placeholder.com/200/EF4444/FFFFFF?text=StreamDAO', 'https://via.placeholder.com/1200x400/EF4444/FFFFFF?text=StreamDAO', 'StreamDAO Foundation', 'Los Angeles, USA', 456, 2789, ARRAY['Streaming', 'Content', 'Creators'], NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days', NOW() + INTERVAL '40 days', '0x13' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000020', '0x14' || repeat('0', 38), 'TradeBot AI', 'Algorithmic trading bot for cryptocurrency markets', 'Professional-grade trading automation with proven returns.', 'defi', 500000, 500000, 'USDC', 60, 'funded', 'enterprise', 2, 'https://via.placeholder.com/200/3B82F6/FFFFFF?text=TradeBot', 'https://via.placeholder.com/1200x400/3B82F6/FFFFFF?text=TradeBot+AI', 'TradeBot Technologies', 'Hong Kong', 389, 2156, ARRAY['Trading', 'AI', 'Automation'], NOW() - INTERVAL '110 days', NOW() - INTERVAL '110 days', NOW() - INTERVAL '110 days', NOW() - INTERVAL '50 days', '0x14' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000021', '0x15' || repeat('0', 38), 'GreenEnergy DAO', 'Community-owned solar farm investment', 'Invest in renewable energy and earn from power generation.', 'infrastructure', 2000000, 875000, 'USDC', 90, 'active', 'enterprise', 1.5, 'https://via.placeholder.com/200/059669/FFFFFF?text=GreenEnergy', 'https://via.placeholder.com/1200x400/059669/FFFFFF?text=GreenEnergy', 'GreenEnergy Collective', 'Berlin, Germany', 234, 1456, ARRAY['Energy', 'Sustainability', 'RWA'], NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', NOW() + INTERVAL '45 days', '0x15' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000022', '0x16' || repeat('0', 38), 'EventTicket NFT', 'Blockchain ticketing preventing scalping and fraud', 'Secure event tickets as transferable NFTs.', 'nft', 350000, 350000, 'USDC', 45, 'funded', 'pro', 3, 'https://via.placeholder.com/200/A855F7/FFFFFF?text=EventTicket', 'https://via.placeholder.com/1200x400/A855F7/FFFFFF?text=EventTicket', 'EventTicket Inc', 'Miami, USA', 678, 3892, ARRAY['Events', 'Ticketing', 'NFT'], NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days', NOW() - INTERVAL '55 days', '0x16' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000023', '0x17' || repeat('0', 38), 'CryptoPayroll', 'Automated cryptocurrency payroll for companies', 'Pay employees globally in crypto, instantly.', 'infrastructure', 450000, 198000, 'USDC', 60, 'active', 'pro', 2.5, 'https://via.placeholder.com/200/0891B2/FFFFFF?text=CryptoPayroll', 'https://via.placeholder.com/1200x400/0891B2/FFFFFF?text=CryptoPayroll', 'CryptoPayroll Ltd', 'London, UK', 145, 987, ARRAY['Payroll', 'HR Tech', 'Payments'], NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NOW() + INTERVAL '44 days', '0x17' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000024', '0x18' || repeat('0', 38), 'BookDAO - Publishing', 'Decentralized book publishing and distribution', 'Authors retain 95% of royalties through blockchain.', 'dao', 300000, 300000, 'USDC', 60, 'funded', 'starter', 4, 'https://via.placeholder.com/200/F59E0B/FFFFFF?text=BookDAO', 'https://via.placeholder.com/1200x400/F59E0B/FFFFFF?text=BookDAO', 'BookDAO Collective', 'New York, USA', 432, 2345, ARRAY['Publishing', 'Books', 'Royalties'], NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '30 days', '0x18' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000025', '0x19' || repeat('0', 38), 'IdentityChain', 'Self-sovereign identity verification system', 'Own and control your digital identity securely.', 'infrastructure', 800000, 445000, 'USDC', 75, 'active', 'enterprise', 2, 'https://via.placeholder.com/200/6366F1/FFFFFF?text=IdentityChain', 'https://via.placeholder.com/1200x400/6366F1/FFFFFF?text=IdentityChain', 'IdentityChain Foundation', 'Zurich, Switzerland', 289, 1678, ARRAY['Identity', 'Privacy', 'Verification'], NOW() - INTERVAL '32 days', NOW() - INTERVAL '32 days', NOW() - INTERVAL '32 days', NOW() + INTERVAL '43 days', '0x19' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000026', '0x1a' || repeat('0', 38), 'PetDAO - Animal Welfare', 'Blockchain platform for pet adoption and care tracking', 'Transparent pet adoption with verified health records.', 'social', 200000, 200000, 'USDC', 45, 'funded', 'starter', 4, 'https://via.placeholder.com/200/EC4899/FFFFFF?text=PetDAO', 'https://via.placeholder.com/1200x400/EC4899/FFFFFF?text=PetDAO', 'PetDAO Foundation', 'Austin, USA', 892, 4123, ARRAY['Pets', 'Animal Welfare', 'Social Good'], NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days', NOW() - INTERVAL '35 days', '0x1a' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000027', '0x1b' || repeat('0', 38), 'FoodTrace - Supply Chain', 'Track food from farm to table with blockchain', 'Verify food authenticity and combat food fraud.', 'infrastructure', 550000, 267000, 'USDC', 60, 'active', 'pro', 2.5, 'https://via.placeholder.com/200/84CC16/FFFFFF?text=FoodTrace', 'https://via.placeholder.com/1200x400/84CC16/FFFFFF?text=FoodTrace', 'FoodTrace Technologies', 'Copenhagen, Denmark', 187, 1234, ARRAY['Food Safety', 'Supply Chain', 'Traceability'], NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', NOW() + INTERVAL '39 days', '0x1b' || repeat('0', 38)),

('00000000-0000-0000-0000-000000000028', '0x1c' || repeat('0', 38), 'ChainVote - Digital Voting', 'Secure blockchain-based voting for organizations', 'Tamper-proof voting system with verifiable results.', 'dao', 400000, 400000, 'USDC', 60, 'funded', 'pro', 2.5, 'https://via.placeholder.com/200/DC2626/FFFFFF?text=ChainVote', 'https://via.placeholder.com/1200x400/DC2626/FFFFFF?text=ChainVote', 'ChainVote Democracy', 'Tallinn, Estonia', 567, 2987, ARRAY['Governance', 'Voting', 'Democracy'], NOW() - INTERVAL '105 days', NOW() - INTERVAL '105 days', NOW() - INTERVAL '105 days', NOW() - INTERVAL '45 days', '0x1c' || repeat('0', 38));

-- Demo campaigns inserted successfully
-- Total: 28 campaigns (15 active, 8 funded, rest pending/other statuses)
