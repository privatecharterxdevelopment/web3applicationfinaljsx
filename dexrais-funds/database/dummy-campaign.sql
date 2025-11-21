-- Insert a dummy campaign for testing
INSERT INTO campaigns (
  id,
  creator_wallet,
  title,
  description,
  short_description,
  category,
  logo_image_url,
  header_image_url,
  cover_image_url,
  goal_amount,
  raised_amount,
  currency,
  duration_days,
  start_date,
  end_date,
  status,
  safe_address,
  launch_fee_paid,
  backer_count,
  view_count,
  tags,
  video_url,
  company_name,
  company_description,
  company_location,
  company_website,
  dao_purpose,
  dao_governance,
  contributor_benefits,
  utility_type,
  risk_factors,
  legal_structure,
  team_description,
  pricing_tier,
  transaction_fee_percentage,
  created_at,
  published_at
) VALUES (
  'c1e5a8b0-1234-4567-89ab-123456789abc',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  'DeFi Yield Optimizer - Next Generation Smart Contracts',
  '## About the Project

DeFi Yield Optimizer is a revolutionary protocol that automatically optimizes yield farming strategies across multiple DeFi protocols. Our smart contracts analyze real-time market conditions and automatically reallocate your assets to maximize returns while minimizing risk.

## Key Features

- **Automated Strategy Optimization**: AI-powered algorithms continuously monitor and adjust your portfolio
- **Multi-Chain Support**: Works seamlessly across Ethereum, Polygon, Arbitrum, and Base
- **Gas-Efficient**: Advanced batching techniques reduce transaction costs by up to 80%
- **Security First**: Audited by leading security firms with $10M bug bounty program
- **DAO Governance**: Community-driven decision making through token holders

## Technology Stack

Built on cutting-edge blockchain technology:
- Solidity 0.8.20 smart contracts
- Chainlink oracles for price feeds
- The Graph for indexing
- IPFS for decentralized storage

## Roadmap

**Q1 2025**: Protocol launch on Base testnet
**Q2 2025**: Mainnet deployment with initial strategies
**Q3 2025**: Multi-chain expansion (Arbitrum, Optimism)
**Q4 2025**: Advanced features and mobile app launch

## Team

Our team consists of experienced blockchain developers, DeFi researchers, and security experts from top companies including Uniswap, Aave, and Compound.

## Use of Funds

- 40% Development and Engineering
- 25% Security Audits and Bug Bounties
- 20% Marketing and Community Growth
- 15% Operations and Legal',
  'Automated yield optimization protocol maximizing DeFi returns across multiple chains with AI-powered strategies and DAO governance.',
  'defi',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1600&h=900&fit=crop',
  500000,
  287500,
  'USDC',
  90,
  NOW() - INTERVAL '15 days',
  NOW() + INTERVAL '75 days',
  'live',
  '0x1234567890123456789012345678901234567890',
  true,
  156,
  3247,
  ARRAY['DeFi', 'Yield Farming', 'Multi-Chain', 'DAO', 'Base Chain'],
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'DeFi Yield Labs Inc.',
  'DeFi Yield Labs is a blockchain technology company focused on building innovative DeFi protocols that make crypto investing accessible and profitable for everyone.',
  'San Francisco, CA, USA',
  'https://defiyield.example',
  'The DAO governs protocol parameters, strategy whitelisting, fee structures, and treasury management. All major decisions require community voting.',
  'Token-based voting with 1 token = 1 vote. Proposals require 100,000 tokens to create and 4% quorum to pass. Voting period: 7 days.',
  'Contributors receive governance tokens proportional to their contribution. Additional benefits include early access to new strategies, reduced fees, and participation in revenue sharing.',
  'governance',
  'Smart contract risks, market volatility, regulatory uncertainty, dependency on third-party protocols, potential for impermanent loss.',
  'Delaware C-Corp with proper legal structure for DAO operations.',
  'Led by Alex Chen (ex-Uniswap), Sarah Martinez (ex-Aave Security), and Dr. James Wilson (PhD in Cryptography from MIT). 15+ years combined experience in DeFi.',
  'pro',
  3.5,
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
) ON CONFLICT (id) DO NOTHING;
