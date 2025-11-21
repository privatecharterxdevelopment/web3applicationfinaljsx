# Gnosis Safe Setup Guide for DexRais.funds

This guide explains how to set up Gnosis Safe escrow wallets for campaigns on Base network.

## Overview

Each campaign requires a **Gnosis Safe** (multi-signature wallet) to hold contributor funds securely. Funds are released to the campaign creator only after milestones are completed and approved by backers through DAO voting.

## Why Gnosis Safe?

- **Security**: Multi-signature protection prevents unilateral fund access
- **Transparency**: All transactions visible on-chain at [app.safe.global](https://app.safe.global)
- **Milestone-based**: Funds released incrementally as project progresses
- **DAO Governance**: Backers vote on milestone completion before release

## Prerequisites

1. **Wallet**: MetaMask or compatible wallet with funds on Base network
2. **Base ETH**: Small amount (~$5) for gas fees on Base
3. **Campaign Creator**: Connected wallet that will create the campaign

## Step-by-Step Setup

### 1. Create Your Campaign (Without Safe)

1. Go to [DexRais.funds Pricing](/pricing)
2. Select your tier (Starter, Pro, Enterprise, etc.)
3. Fill in campaign details
4. Upload logo and header images
5. **Leave Safe Address blank for now**
6. Click "Create Campaign" and pay the launch fee
7. **Note your campaign ID** from the URL (e.g., `/campaign/abc-123`)

### 2. Create Gnosis Safe

#### Option A: Automatic (Coming Soon)
*Automated Safe creation will be implemented in a future update*

#### Option B: Manual Creation (Current Method)

1. **Visit Safe Creation Page**
   ```
   https://app.safe.global/new-safe?chain=base
   ```

2. **Connect Your Wallet**
   - Click "Connect Wallet"
   - Select MetaMask or your preferred wallet
   - Ensure you're on **Base network**

3. **Configure Safe Owners**
   - Add **your wallet address** (campaign creator)
   - Add **platform signer address**: `TBD` (will be provided)
   - Total: 2 owners

4. **Set Threshold**
   - Set to **2** (requires both signatures)
   - This ensures platform oversight and backer protection

5. **Deploy Safe**
   - Review configuration
   - Click "Create Safe"
   - Approve transaction in wallet
   - Wait for confirmation (~5-30 seconds on Base)
   - **Copy the Safe address** (starts with `0x...`)

### 3. Add Safe Address to Campaign

1. **Go to your Creator Dashboard**
   ```
   https://localhost:5174/dashboard
   ```

2. **Find your campaign** and click "Edit"

3. **Paste Safe Address**
   - Enter the Safe address from step 2.5
   - Format: `0x1234567890abcdef...` (42 characters)
   - Click "Save"

4. **Verify Safe Integration**
   - Visit your campaign page
   - Check that "Gnosis Safe Escrow" section appears
   - Click "View on Safe" to verify

### 4. Test Contribution Flow

#### Prerequisites for Testing
- Test wallet with USDC on Base
- Visit [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerkin-faucet) for testnet
- Or bridge USDC to Base Mainnet

#### Steps to Contribute

1. **Go to Campaign Page**
   ```
   http://localhost:5174/campaign/[your-campaign-id]
   ```

2. **Connect Wallet**
   - Click "Connect Wallet" in header
   - Select wallet and connect

3. **Check USDC Balance**
   - Sidebar shows "Your USDC Balance"
   - Ensure you have sufficient USDC

4. **Enter Contribution Amount**
   - Enter amount in USDC (e.g., 10.00)
   - Must be greater than 0

5. **Approve USDC** (First Time Only)
   - Click "Approve USDC" button
   - Approve transaction in wallet
   - Wait for confirmation

6. **Contribute**
   - After approval, button changes to "Contribute Now"
   - Click "Contribute Now"
   - Approve transfer transaction
   - Wait for confirmation

7. **Verify Contribution**
   - Success message appears
   - Campaign stats update (raised amount, backer count)
   - Your contribution appears in "Backers" tab
   - Check Safe balance on app.safe.global

## Campaign Safe Configuration

### Multi-Sig Setup

Each campaign Safe is configured with:

- **Owners**: 2
  1. Campaign Creator (deployer wallet)
  2. Platform Signer (platform-controlled wallet)

- **Threshold**: 2/2 signatures required

- **Purpose**:
  - Creator cannot withdraw funds unilaterally
  - Platform ensures milestone completion before release
  - Protects backers from rug pulls

### Safe Address Storage

Safe addresses are stored in the `campaigns` table:

```sql
CREATE TABLE campaigns (
  ...
  safe_address TEXT NULL,
  ...
);
```

### Viewing Safe Transactions

Visit Safe on Base:
```
https://app.safe.global/base:[SAFE_ADDRESS]
```

Example:
```
https://app.safe.global/base:0x1234567890abcdef1234567890abcdef12345678
```

## Milestone-Based Fund Release

### How It Works

1. **Contribution Phase**
   - Backers send USDC directly to Safe
   - Funds locked in Safe escrow
   - Campaign tracks raised_amount in database

2. **Milestone Creation**
   - Creator defines milestones during campaign setup
   - Each milestone has target percentage (e.g., 25%, 50%, 100%)
   - Description of deliverables

3. **Milestone Completion**
   - Creator marks milestone as complete
   - Provides evidence/updates
   - Backers notified

4. **DAO Voting** (Future Implementation)
   - Backers vote on milestone completion
   - Voting weight based on contribution amount
   - Requires majority approval (e.g., 51%)

5. **Fund Release**
   - After approval, both Safe owners sign transaction
   - USDC transferred from Safe to creator wallet
   - Amount: Milestone percentage of total raised
   - Transaction recorded on-chain

### Example Milestone Structure

```typescript
Campaign: $100,000 USDC raised

Milestone 1: Product MVP (25%)
- Release: $25,000 USDC
- Deliverable: Working prototype
- Status: Completed ✓

Milestone 2: Beta Launch (50%)
- Release: $50,000 USDC
- Deliverable: Public beta with 100 users
- Status: In Progress...

Milestone 3: Full Launch (100%)
- Release: $25,000 USDC
- Deliverable: Production release
- Status: Pending
```

## Troubleshooting

### Safe Creation Failed
- **Issue**: Transaction reverted
- **Solution**: Ensure sufficient Base ETH for gas (~$2-5)
- **Check**: Using Base network (not Ethereum Mainnet)

### Cannot Contribute
- **Issue**: "Campaign Safe not configured yet"
- **Solution**: Add Safe address to campaign (see Step 3)

### Approval Failed
- **Issue**: USDC approval transaction reverted
- **Solution**:
  - Check USDC balance is sufficient
  - Ensure on Base network
  - Try increasing gas limit

### Contribution Not Recorded
- **Issue**: Transaction succeeded but database not updated
- **Solution**:
  - Check transaction on [BaseScan](https://basescan.org)
  - Contact support with TX hash
  - Database trigger may have failed

### Wrong Network
- **Issue**: Using Ethereum mainnet instead of Base
- **Solution**:
  - Switch to Base network in wallet
  - Base Chain ID: 8453
  - RPC: https://mainnet.base.org

## Platform Signer Address

**IMPORTANT**: The platform signer address must be configured before production use.

Current address (placeholder):
```
0x0000000000000000000000000000000000000000
```

**To configure**:
1. Create secure wallet for platform
2. Store private key in secure vault (AWS Secrets Manager, etc.)
3. Update environment variable:
   ```bash
   NEXT_PUBLIC_PLATFORM_SIGNER_ADDRESS=0x...
   ```
4. Update this documentation with real address

## Security Best Practices

### For Campaign Creators
- ✅ Never share your private key
- ✅ Use hardware wallet for large campaigns
- ✅ Verify Safe address before sharing with backers
- ✅ Double-check transaction details before signing
- ❌ Never approve unknown tokens in Safe
- ❌ Don't share Safe URL publicly until campaign is live

### For Platform
- ✅ Use dedicated signer wallet (not personal)
- ✅ Store private key in secure vault
- ✅ Implement multi-person approval for releases
- ✅ Monitor all Safe transactions
- ✅ Audit milestone completion before signing
- ❌ Never auto-sign releases without verification

### For Backers
- ✅ Verify Safe address matches campaign page
- ✅ Check Safe on app.safe.global before contributing
- ✅ Review milestone structure before backing
- ✅ Participate in DAO votes
- ❌ Don't contribute to campaigns without Safe
- ❌ Don't trust campaigns with suspicious ownership

## Advanced Features (Roadmap)

### Coming Soon
- [ ] Automated Safe creation during campaign setup
- [ ] On-chain milestone voting via smart contracts
- [ ] Kleros dispute resolution integration
- [ ] Automatic fund release on vote approval
- [ ] Safe balance tracking in real-time
- [ ] Multi-token support (ETH, USDT, DAI)
- [ ] Refund mechanism for failed campaigns

### Future Enhancements
- [ ] Safe module for automated releases
- [ ] Integration with Safe Transaction Service API
- [ ] Mobile app with Safe integration
- [ ] NFT receipts for contributions
- [ ] Governance token distribution

## Smart Contract Integration (Phase 2)

### Current Implementation
- Direct USDC transfers to Safe
- Manual milestone approval
- Off-chain voting

### Planned Smart Contracts

#### CampaignFactory.sol
```solidity
// Creates campaigns and associated Safes
// Manages milestone configuration
// Tracks campaign state
```

#### MilestoneGovernor.sol
```solidity
// Implements DAO voting for milestones
// Weighted by contribution amount
// Timelock for security
```

#### SafeModule.sol
```solidity
// Safe module for automated fund releases
// Triggered by successful votes
// Implements dispute resolution
```

## Support

For issues or questions:
- GitHub Issues: [dexrais-funds/issues](https://github.com/...)
- Discord: [DexRais Community](#)
- Email: support@dexrais.funds

## Resources

- [Gnosis Safe Docs](https://docs.safe.global/)
- [Base Network Docs](https://docs.base.org/)
- [Safe SDK](https://github.com/safe-global/safe-core-sdk)
- [USDC on Base](https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)

---

Last Updated: November 21, 2025
Version: 1.0.0
