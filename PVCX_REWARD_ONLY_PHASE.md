# $PVCX Token - Reward-Only Phase (Pre-Deployment)

## 🎁 Current Strategy: Build to 1,000 Users FIRST

### **No Liquidity Pool. No Trading. Reward-Only Until 1,000 Token Holders.**

---

## The Plan:

### **Phase 1: Reward-Only (CURRENT)**
**Goal:** Reach 1,000 token holders

✅ Users earn PVCX through bookings (km × 1.5)
✅ Users earn PVCX through CO₂ certificates (tons × 2.0)
✅ Balances tracked **off-chain** in Supabase database
✅ Users can see their balance grow
❌ NO withdrawals
❌ NO trading
❌ NO smart contract deployed yet

**Why?**
- Build a loyal user base BEFORE launching token
- Accumulate demand/holders before liquidity
- More efficient than deploying contract first

---

### **Phase 2: Deployment (At 1,000 Users)**
**Trigger:** When 1,000 unique users have PVCX balance > 0

When you're ready:
1. Deploy ERC-20 smart contract to Ethereum Mainnet
2. Update contract address in code
3. Create liquidity pool on Uniswap (ETH/PVCX pair)
4. Change `isLiquidityPoolLive = true`
5. Enable withdrawals + trading

**Result:**
- Users can withdraw to wallets
- Token tradable on Uniswap
- Market price discovery begins
- PVCX becomes a real asset

---

## What Users See Now:

### **Top Banner:**
```
🎁 Reward-Only Phase - Building Token Holder Base

Current Goal: Reach 1,000 token holders before enabling trading.

Earn PVCX tokens through every booking and CO₂ certificate.
Your balance is tracked and secured in our system.

Once we reach 1,000 users, the token will be deployed on-chain,
liquidity pool created, and trading enabled on DEX (Uniswap).
```

### **Balance Card:**
```
Your PVCX Balance
150.000 $PVCX

From Bookings: 120.00
From CO₂ Certificates: 30.00

[ 🎁 Reward-Only Phase ]  (Gray button, disabled)
Trading & withdrawals enabled at 1,000 users
```

### **Token Info Card:**
```
Token Info

🎁 Reward-Only Phase
ERC-20 contract will be deployed after reaching 1,000 token holders.
Currently tracking balances off-chain.

Symbol: PVCX
Decimals: 18
Future Network: Ethereum Mainnet

Contract Address:
[ Not deployed yet ]
Available at 1,000 users

[ Add to MetaMask (Soon) ]  (Disabled)
Will support Ethereum & Base networks
```

### **Tokenomics Card:**
```
🎁 Current Phase: Reward-Only
Building Token Holder Base - Goal: 1,000 Users

Earn and accumulate PVCX tokens through platform usage.
Your balance is securely tracked off-chain in our system.

Once we reach 1,000 token holders:
Contract deployment → Liquidity pool → DEX trading on Uniswap ✨
```

### **How to Earn Card:**
```
1. Book Services ✅
Every taxi/concierge or private jet booking earns PVCX.

2. Earn CO₂ Credits ✅
Get certified CO₂ savings at 2x multiplier.

3. Trade & Withdraw (At 1,000 Users) 🔒
Currently reward-only. Tokens safely tracked in your account
until we reach 1,000 holders.

🎯 Roadmap: 1,000 Users
Deploy ERC-20 contract → Create liquidity pool
→ Enable DEX trading on Uniswap
```

---

## Technical Implementation:

### **Current Setup:**
- All balances stored in Supabase (`user_pvcx_balances` table)
- No smart contract deployed
- No on-chain transactions
- Completely off-chain reward tracking
- `isLiquidityPoolLive = false` (hardcoded)

### **Database Tables Active:**
✅ `user_pvcx_balances` - Tracks user balances
✅ `pvcx_transactions` - Logs all earning events
❌ `pvcx_withdrawal_requests` - Not used yet (empty table)

### **When Ready to Deploy:**

**Step 1: Deploy Smart Contract**
```solidity
// ERC-20 standard contract
contract PVCX is ERC20 {
    constructor() ERC20("PrivateCharterX", "PVCX") {
        _mint(msg.sender, 10000000 * 10**18); // 10M total supply
    }
}
```

**Step 2: Update Code**
```javascript
// In PVCXTokenView.jsx
const tokenDetails = {
  contractAddress: '0xYourDeployedContractAddress', // ADD THIS
  // ...
};

const isLiquidityPoolLive = true; // CHANGE THIS
```

**Step 3: Create Liquidity Pool**
- Add initial liquidity on Uniswap (ETH + PVCX)
- Set initial price based on tokenomics
- Lock liquidity or use vesting

**Step 4: Enable Withdrawals**
- Users can now request withdrawals
- Admin manually sends tokens from treasury wallet
- Or build automated withdrawal system

---

## User Flow (Reward-Only Phase):

### **New User Journey:**
1. User signs up for PrivateCharterX
2. User books taxi/concierge service (100km trip)
3. **Earns 150 PVCX** (100km × 1.5)
4. User sees balance in header: `150.000 $PVCX`
5. User clicks balance → Views PVCX Token page
6. Sees message: "Reward-Only Phase - Goal: 1,000 Users"
7. User understands: Tokens are accumulating, tradable later
8. User makes more bookings → Balance grows
9. User waits for 1,000 user milestone
10. **Deployment happens** → User can now withdraw/trade

### **Why This Works:**
✅ No upfront smart contract costs
✅ No liquidity needed until 1,000 users
✅ Builds anticipation and engagement
✅ Users invested in reaching milestone
✅ Lower risk (test demand before deploying)
✅ More control over launch timing

---

## Messaging Strategy:

### **Positive Framing:**
Instead of: ❌ "Withdrawals locked/restricted"
We say: ✅ "Reward-Only Phase - Building holder base"

Instead of: ❌ "Contract not deployed yet"
We say: ✅ "Accumulating tokens for future trading"

Instead of: ❌ "You can't do anything with these tokens"
We say: ✅ "Your balance is growing - trading at 1,000 users"

### **Builds Excitement:**
- "Goal: 1,000 Users" → Community target
- "Once we reach..." → Clear milestone
- Roadmap visual → Shows what's coming
- Progress tracking → "500/1,000 users" (future feature)

---

## Tracking Progress to 1,000:

### **SQL Query to Check:**
```sql
SELECT COUNT(DISTINCT user_id) as total_holders
FROM user_pvcx_balances
WHERE balance > 0;
```

### **Future Enhancement:**
Add progress bar to PVCX Token page:
```
🎯 Progress to Launch: 347/1,000 Users
[████████░░░░░░░░░░░] 34.7%

Only 653 more token holders until deployment!
```

---

## FAQ for Users:

### **Q: When can I withdraw my PVCX tokens?**
A: Once we reach 1,000 token holders, we'll deploy the smart contract, create the liquidity pool, and enable withdrawals. Your balance is safely tracked until then.

### **Q: Are my tokens real?**
A: Yes! Your balance is securely stored in our system. Once the contract is deployed at 1,000 users, your tokens will be available on-chain for trading and withdrawal.

### **Q: What if I want to sell now?**
A: PVCX is currently in the reward-only phase. Trading will be enabled after we reach 1,000 token holders and deploy the contract to Uniswap.

### **Q: Will my balance transfer when the contract is deployed?**
A: Yes! When we deploy the contract, all accumulated balances will be honored. You'll be able to claim your tokens to your wallet.

### **Q: Why wait for 1,000 users?**
A: We're building a strong holder base before launching on DEX. This ensures better liquidity, more engaged community, and sustainable token economics.

---

## When You Deploy the Contract:

### **Announcement Email:**
```
🚀 PVCX Token Launch - We Hit 1,000 Users!

Thanks to our amazing community, we've reached the milestone.
The PVCX token is now LIVE on Ethereum Mainnet!

✅ Smart contract deployed: 0x...
✅ Liquidity pool live on Uniswap
✅ Withdrawals NOW ENABLED
✅ Start trading PVCX/ETH

Your accumulated balance: 150.000 PVCX
→ Request withdrawal to your wallet
→ Trade on Uniswap
→ HODL for future growth

[Visit PVCX Token Page]
```

---

## Summary:

**RIGHT NOW:**
- No contract deployed ❌
- No liquidity pool ❌
- No trading ❌
- No withdrawals ❌
- Users earn & accumulate ✅
- Balances tracked off-chain ✅
- Goal: 1,000 users ✅

**AT 1,000 USERS:**
- Deploy ERC-20 contract ✅
- Create Uniswap liquidity pool ✅
- Enable withdrawals ✅
- Enable trading ✅
- Change one line of code (`isLiquidityPoolLive = true`) ✅

**BENEFITS:**
- Lower upfront costs
- Build demand first
- Test reward mechanics
- Engaged community
- Strategic launch timing
- Professional launch when ready

---

You're building smart! Get to 1,000 holders with real engagement, THEN launch the token with actual demand. 🚀
