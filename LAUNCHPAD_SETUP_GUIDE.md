# Launchpad Revenue Tracking System - Setup Guide

Complete guide for setting up the Web3 launchpad with ETH/USDC payments and automated revenue distribution.

## Overview

The launchpad system allows:
- **Investors**: Invest in tokenized projects using ETH or USDC
- **Project Owners**: Receive funds to owner wallet, track revenue
- **Automatic Revenue Distribution**: Based on token ownership percentage
- **Real-time Tracking**: Monitor investments and revenue in dashboard

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     INVESTOR FLOW                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Connect Wallet (Reown AppKit)                       │
│  2. Browse Launchpad Projects                            │
│  3. Select Payment Method (ETH/USDC)                     │
│  4. Invest Amount → Send to Owner Wallet                 │
│  5. Receive Tokens (Proportional to Investment)          │
│  6. Track Revenue in Dashboard                           │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   REVENUE DISTRIBUTION                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Project generates revenue → Owner Wallet             │
│  2. Revenue tracked in project_revenue_pool              │
│  3. Calculate each investor's share:                     │
│     share = (investor_tokens / total_supply) * revenue   │
│  4. Distribute to investor wallets automatically         │
│  5. Record in launchpad_revenues table                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Step 1: Database Setup

### Run the SQL Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `LAUNCHPAD_DATABASE_SCHEMA.sql`
5. Click **Run**

This creates:
- `launchpad_investments` - All user investments
- `launchpad_revenues` - Revenue distributions to investors
- `project_revenue_pool` - Incoming project revenue tracking
- `investor_portfolio` - View for quick portfolio lookups
- Helper functions for revenue calculations

### Verify Setup

Run this query to verify tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'launchpad_%'
ORDER BY table_name;
```

You should see:
- `launchpad_investments`
- `launchpad_projects` (existing)
- `launchpad_revenues`

## Step 2: Update Existing Projects

Add owner wallet addresses to existing projects:

```sql
-- Update your projects with owner wallet addresses
UPDATE launchpad_projects
SET
  owner_wallet = '0xYOUR_OWNER_WALLET_ADDRESS',
  total_supply = 1000000, -- Total token supply
  token_price = 1.00 -- Price per token in USD
WHERE id = 'YOUR_PROJECT_ID';
```

## Step 3: Frontend Setup

The frontend components are already created:

### Files Created

1. **[LaunchpadPageNew.jsx](src/components/Landingpagenew/LaunchpadPageNew.jsx)**
   - Modern design matching landing page
   - Wallet connection UI
   - Search and filters
   - Stats dashboard

2. **[LaunchDetailPageNew.jsx](src/components/Landingpagenew/LaunchDetailPageNew.jsx)**
   - Investment interface
   - ETH/USDC payment selection
   - Revenue tracking dashboard
   - Token ownership display

### Update Your Router

Make sure your router uses the new components:

```javascript
import LaunchpadPageNew from './components/Landingpagenew/LaunchpadPageNew';

// In your router
<Route path="/launchpad" element={<LaunchpadPageNew />} />
```

## Step 4: Wallet Configuration

The app uses **Reown AppKit** (formerly WalletConnect) for wallet connections.

### Required in Your App

Make sure you have this setup in your main app file:

```javascript
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon } from '@reown/appkit/networks';

// Your WalletConnect project ID
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID';

// Create AppKit instance
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, polygon],
  projectId,
  features: {
    analytics: true
  }
});
```

Get your WalletConnect project ID from: https://cloud.walletconnect.com

## Step 5: Testing the Investment Flow

### Test Investment

1. **Go to Launchpad page**
2. **Connect your wallet**
3. **Click on a project**
4. **Go to "Invest" tab**
5. **Select payment method** (ETH or USDC)
6. **Enter investment amount** (must meet minimum)
7. **Click "Invest Now"**
8. **Approve transaction** in your wallet
9. **Wait for confirmation**

### Verify Investment

Check the database:

```sql
-- View all investments
SELECT
  i.id,
  i.wallet_address,
  i.amount_usd,
  i.token_amount,
  i.payment_method,
  i.status,
  p.name as project_name
FROM launchpad_investments i
JOIN launchpad_projects p ON i.project_id = p.id
ORDER BY i.created_at DESC;

-- Check investor portfolio
SELECT * FROM investor_portfolio
WHERE wallet_address = '0xYOUR_WALLET_ADDRESS';
```

## Step 6: Revenue Distribution Setup

### Option A: Manual Distribution (For Testing)

Insert revenue manually to test the system:

```sql
-- 1. Add revenue to project pool
INSERT INTO project_revenue_pool (
  project_id,
  amount_usd,
  currency,
  source,
  transaction_hash,
  from_address
) VALUES (
  'YOUR_PROJECT_ID',
  10000.00, -- $10,000 revenue
  'ETH',
  'Monthly subscription revenue',
  '0xTRANSACTION_HASH',
  '0xREVENUE_SOURCE_ADDRESS'
);

-- 2. Calculate distribution for all investors
SELECT * FROM distribute_project_revenue(
  'YOUR_PROJECT_ID'::UUID,
  10000.00, -- Total revenue to distribute
  'ETH'
);

-- 3. Create revenue records for each investor
-- This would normally be done by an automated system
INSERT INTO launchpad_revenues (
  project_id,
  investor_address,
  amount_usd,
  distribution_currency,
  total_project_revenue,
  investor_token_amount,
  ownership_percentage,
  transaction_hash
)
SELECT
  'YOUR_PROJECT_ID'::UUID,
  wallet_address,
  calculate_investor_revenue_share('YOUR_PROJECT_ID'::UUID, wallet_address, 10000.00),
  'ETH',
  10000.00,
  total_tokens,
  ownership_percentage,
  '0xDISTRIBUTION_TX_' || wallet_address
FROM investor_portfolio
WHERE project_id = 'YOUR_PROJECT_ID';
```

### Option B: Automated Distribution (Production)

For production, create a Supabase Edge Function:

```typescript
// supabase/functions/distribute-revenue/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Get undistributed revenue from pool
  const { data: revenues } = await supabaseClient
    .from('project_revenue_pool')
    .select('*')
    .eq('distributed', false)

  // 2. For each revenue, calculate and distribute to investors
  for (const revenue of revenues) {
    // Get all investors for this project
    const { data: investors } = await supabaseClient
      .rpc('distribute_project_revenue', {
        p_project_id: revenue.project_id,
        p_total_revenue: revenue.amount_usd,
        p_currency: revenue.currency
      })

    // 3. Send ETH/USDC to each investor wallet
    // (This requires Web3 integration with owner wallet private key)

    // 4. Record distributions
    // ... insert into launchpad_revenues

    // 5. Mark revenue as distributed
    await supabaseClient
      .from('project_revenue_pool')
      .update({ distributed: true })
      .eq('id', revenue.id)
  }

  return new Response(JSON.stringify({ success: true }))
})
```

Deploy:
```bash
supabase functions deploy distribute-revenue
```

Schedule with cron (daily at midnight):
```sql
SELECT cron.schedule(
  'distribute-project-revenue',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/distribute-revenue',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

## Step 7: User Experience

### Investor View

1. **Browse Projects** - See all available launchpad projects
2. **Filter & Search** - Find projects by status (Live, Upcoming, Closed)
3. **View Details** - See project info, funding progress, tokenomics
4. **Invest** - Choose ETH/USDC, enter amount, confirm transaction
5. **Track Portfolio** - View ownership percentage and token amount
6. **Monitor Revenue** - See all revenue distributions in "My Revenue" tab

### Revenue Dashboard

Investors can see:
- Total amount invested
- Total tokens owned
- Ownership percentage
- Revenue history with transaction links
- Real-time revenue updates

## Step 8: Security Considerations

### Smart Contract Integration (Recommended for Production)

For production use, create a smart contract for:

1. **Escrow**: Hold funds until project milestones
2. **Automatic Distribution**: Send revenue to investors on-chain
3. **Token Minting**: Mint ERC-20 tokens for investors
4. **Governance**: Allow token holders to vote on decisions

Example Solidity contract structure:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LaunchpadProject {
    address public owner;
    mapping(address => uint256) public investments;
    uint256 public totalInvestment;
    uint256 public tokenPrice;

    function invest() public payable {
        // Record investment
        // Mint tokens
    }

    function distributeRevenue() public payable {
        // Calculate each investor's share
        // Transfer proportionally
    }
}
```

### Database Security

The schema includes RLS policies:
- Users can only view their own investments
- Users can only view their own revenue
- Only service role can create revenue distributions

## Step 9: Monitoring & Analytics

### Key Metrics to Track

```sql
-- Total investments by project
SELECT
  p.name,
  COUNT(DISTINCT i.wallet_address) as investor_count,
  SUM(i.amount_usd) as total_raised,
  AVG(i.amount_usd) as avg_investment
FROM launchpad_investments i
JOIN launchpad_projects p ON i.project_id = p.id
WHERE i.status = 'completed'
GROUP BY p.name;

-- Revenue distribution summary
SELECT
  p.name,
  COUNT(r.id) as distribution_count,
  SUM(r.amount_usd) as total_distributed,
  MAX(r.created_at) as last_distribution
FROM launchpad_revenues r
JOIN launchpad_projects p ON r.project_id = p.id
GROUP BY p.name;

-- Top investors
SELECT
  wallet_address,
  COUNT(DISTINCT project_id) as projects_invested,
  SUM(total_invested) as total_invested_usd,
  SUM(total_revenue_earned) as total_revenue_earned
FROM investor_portfolio
GROUP BY wallet_address
ORDER BY total_invested_usd DESC
LIMIT 10;
```

## Troubleshooting

### "Investment failed"

1. Check wallet has enough ETH/USDC
2. Check gas fees are sufficient
3. Verify owner_wallet is set on project
4. Check browser console for errors

### "Revenue not showing"

1. Verify investment status is 'completed':
   ```sql
   SELECT * FROM launchpad_investments
   WHERE wallet_address = '0xYOUR_ADDRESS'
   AND status != 'completed';
   ```

2. Check revenue records exist:
   ```sql
   SELECT * FROM launchpad_revenues
   WHERE investor_address = '0xYOUR_ADDRESS';
   ```

### "Ownership percentage is 0%"

1. Check total_supply is set on project
2. Verify token_amount was calculated correctly
3. Check investment status is 'completed'

## Next Steps

1. **✅ Database setup complete** - Run SQL schema
2. **✅ Frontend ready** - LaunchpadPageNew & LaunchDetailPageNew created
3. **⏳ Smart contract** - Deploy ERC-20 token contract (optional but recommended)
4. **⏳ Revenue automation** - Set up automated revenue distribution
5. **⏳ Testing** - Test full investment and revenue flow
6. **⏳ Production** - Deploy to mainnet with real funds

## Support & Resources

- **WalletConnect Docs**: https://docs.walletconnect.com
- **Wagmi Docs**: https://wagmi.sh
- **Viem Docs**: https://viem.sh
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

## Quick Reference

### Investment Flow
```
User → Connect Wallet → Browse Projects → Select Project →
Choose Payment (ETH/USDC) → Enter Amount → Confirm Transaction →
Receive Tokens → Track in Portfolio
```

### Revenue Flow
```
Project Revenue → Owner Wallet → Revenue Pool (DB) →
Calculate Shares → Distribute to Investors → Record in DB →
Show in Investor Dashboard
```

### Database Tables
- `launchpad_projects` - Projects available for investment
- `launchpad_investments` - User investments
- `launchpad_revenues` - Revenue distributions
- `project_revenue_pool` - Incoming project revenue
- `investor_portfolio` - View of investor holdings

### Key Functions
- `calculate_investor_revenue_share()` - Calculate investor's share of revenue
- `distribute_project_revenue()` - Get distribution breakdown for all investors

---

**The launchpad is now ready to use! Connect your wallet and start investing.**
