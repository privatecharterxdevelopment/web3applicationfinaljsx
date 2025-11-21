# DexRais.funds - Decentralized Fundraising Platform

A fully decentralized fundraising platform built on Base Chain for DAOs and Web3 projects. Features all-or-nothing fundraising with automatic fund escrow via Gnosis Safe.

## 🚀 Features

- **Decentralized Fundraising** - 100% on-chain USDC campaigns
- **Gnosis Safe Escrow** - Automated fund management and refunds
- **All-or-Nothing Funding** - Funds locked until goal reached (100%)
- **Automatic Refunds** - Smart contract refunds if goal not met
- **Creator Dashboard** - Track campaigns, analytics, and backers
- **Launchpad** - Browse and fund live campaigns
- **Transaction History** - Beautiful transaction list with status badges
- **3D Globe Hero** - Stunning landing page with Three.js globe
- **Mobile Responsive** - Works perfectly on all devices

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (DM Sans font, monochromatic design)
- **Web3**: Wagmi v2 + Viem + Reown AppKit (WalletConnect)
- **Blockchain**: Base Chain (low fees, fast transactions)
- **Database**: Supabase (PostgreSQL)
- **Smart Contracts**: Solidity + Gnosis Safe SDK
- **Escrow**: Gnosis Safe (battle-tested multisig)

## 📦 Installation

```bash
# Clone or download this folder
cd dexrais-funds

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env
```

## ⚙️ Environment Setup

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the database migration (see `database/schema.sql`)
3. Copy your project URL and anon key to `.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. WalletConnect Setup

1. Create a project at https://cloud.walletconnect.com
2. Copy your project ID to `.env`

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. Smart Contract Deployment

After deploying contracts to Base Chain:

```env
VITE_CAMPAIGN_FACTORY_ADDRESS=0x...
VITE_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
VITE_TREASURY_ADDRESS=0x...
```

## 🗄️ Database Schema

Run this SQL in your Supabase project:

```sql
-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_wallet TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  header_image_url TEXT,
  cover_image_url TEXT,
  goal_amount DECIMAL(20, 2) NOT NULL,
  raised_amount DECIMAL(20, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USDC',
  duration_days INT DEFAULT 30,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT DEFAULT 'draft',
  campaign_contract_address TEXT,
  safe_address TEXT,
  launch_fee_paid BOOLEAN DEFAULT FALSE,
  launch_fee_tx_hash TEXT,
  backer_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Backers table
CREATE TABLE backers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USDC',
  tx_hash TEXT NOT NULL,
  block_number BIGINT,
  status TEXT DEFAULT 'confirmed',
  contributed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, wallet_address, tx_hash)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  block_number BIGINT,
  status TEXT DEFAULT 'pending',
  type TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

-- Campaign updates table
CREATE TABLE campaign_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_wallet TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaigns_creator ON campaigns(creator_wallet);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_backers_campaign ON backers(campaign_id);
CREATE INDEX idx_transactions_campaign ON transactions(campaign_id);
```

## 🎨 Design System

### Colors
- Monochromatic gray palette (gray-25 to gray-900)
- Success: `#10b981`
- Warning: `#f59e0b`
- Error: `#ef4444`

### Typography
- Font: DM Sans (300, 400, 500, 600, 700)
- H1: 42px, font-weight 300
- H2: 32px, font-weight 400
- Body: 16px, font-weight 400

### Components
- Glassmorphic cards: `bg-white/35 backdrop-blur-xl`
- Buttons: Rounded-xl with smooth transitions
- Status badges: Colored backgrounds with icons

## 🛠️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚢 Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd dexrais-funds
vercel

# Production deployment
vercel --prod
```

### Vercel Environment Variables

Add these in Vercel dashboard → Settings → Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WALLETCONNECT_PROJECT_ID`
- `VITE_CAMPAIGN_FACTORY_ADDRESS`
- `VITE_USDC_ADDRESS`
- `VITE_TREASURY_ADDRESS`

## 📝 Smart Contracts

### CampaignFactory.sol

Creates campaigns and collects 299 USDC launch fee.

```solidity
function createCampaign(
  string memory _title,
  uint256 _goal,
  uint256 _durationDays
) external returns (address safe, address campaign)
```

### Campaign.sol

Handles contributions with all-or-nothing logic.

```solidity
// Contribute USDC to campaign
function contribute(uint256 _amount) external

// Finalize: unlock or refund
function finalize() external
```

### Integration with Gnosis Safe

Each campaign deploys a Gnosis Safe that holds all contributed USDC. When the campaign ends:

- **Goal reached (100%)**: Funds unlock to creator
- **Goal NOT reached**: Automatic refunds to ALL backers

## 📂 Project Structure

```
dexrais-funds/
├── public/               # Static assets
├── src/
│   ├── components/
│   │   ├── Landing/     # Landing page components
│   │   ├── Creator/     # Creator dashboard
│   │   ├── Investor/    # Launchpad & campaign views
│   │   └── Shared/      # Reusable components
│   ├── contracts/       # Smart contract ABIs
│   ├── lib/            # Utilities (Supabase, Wagmi, Safe)
│   ├── pages/          # Route pages
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 🔒 Security

- Smart contracts audited by [Certik/OpenZeppelin]
- Gnosis Safe battle-tested escrow
- Row-level security (RLS) on Supabase
- Wallet signature verification
- Input sanitization (XSS protection)

## 💰 Fee Structure

- **Campaign Launch Fee**: 299 USDC (one-time)
- **Platform Fee**: 2.5% of successful raises
- **Minimum Goal**: $1,000 USDC
- **Campaign Durations**: 30, 60, or 90 days

## 🎯 Campaign Flow

### For Creators:

1. Connect wallet
2. Fill campaign form (title, description, images, goal, duration)
3. Pay 299 USDC launch fee
4. Campaign goes live on Launchpad
5. Track progress in dashboard
6. Withdraw funds when goal reached

### For Backers:

1. Browse Launchpad
2. View campaign details
3. Connect wallet
4. Contribute USDC (min 10 USDC)
5. Track contributions
6. Get automatic refund if goal not met

## 📊 Transaction Statuses

- ✅ **Confirmed**: Transaction mined on-chain
- ⏳ **Pending**: Transaction submitted, awaiting confirmation
- ❌ **Rejected**: Transaction failed or reverted

## 🌐 Supported Networks

- **Base Chain (8453)** - Primary
  - Low gas fees (~$0.01)
  - Fast blocks (2 seconds)
  - EVM-compatible

## 🤝 Contributing

This is a proprietary project. For issues or feature requests, contact the team.

## 📄 License

Proprietary - All rights reserved

## 🔗 Links

- **Website**: https://dexrais.funds
- **Twitter**: @dexrais
- **Discord**: https://discord.gg/dexrais
- **Docs**: https://docs.dexrais.funds

## 🆘 Support

For support, email support@dexrais.funds or join our Discord.

---

Built with ❤️ for the Web3 community
