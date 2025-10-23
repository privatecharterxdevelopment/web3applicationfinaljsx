# $PVCX Token - Withdrawal Restriction Notice

## 🔒 Current Status: Pre-Liquidity Phase

### **Withdrawals are RESTRICTED until liquidity pool creation**

---

## What Users See:

### 1. **Top Banner - Warning Message**
```
🔒 Pre-Liquidity Reward Phase - Withdrawals Restricted

Current Status: Earn PVCX tokens through bookings and CO₂ certificates.
Your balance is tracked and secured in our system.

Withdrawals will be enabled once the liquidity pool is created
and the token is listed on DEX (Uniswap).
```
- **Color:** Yellow/Orange gradient (warning style)
- **Icon:** Lock icon + Info icon

---

### 2. **Balance Card - Locked Withdrawal Button**

**Before Liquidity Pool:**
```
[ Withdrawals Locked ]  (Gray, disabled button)
Withdrawals available after liquidity pool creation
```

**After Liquidity Pool (when you flip the switch):**
```
[ Request Withdrawal ]  (Purple/Blue gradient, active)
```

---

### 3. **Tokenomics Card - Current Phase**
```
🔒 Current Phase

Pre-Liquidity Reward System - Withdrawals Restricted

Earn and accumulate PVCX tokens through platform usage.
Your balance is securely tracked in our system.

Withdrawals & DEX trading (Uniswap) will be enabled
after liquidity pool creation.
```

---

### 4. **How to Earn Card - Step 3 Locked**
```
3. Withdraw Tokens (Coming Soon)
🔒 Locked until liquidity pool creation.
Tokens are safely stored in your account.
```
- **Appearance:** Grayed out, low opacity

---

## How It Works:

### **Configuration Variable:**
Located in `src/components/PVCXTokenView.jsx` (Line ~27):

```javascript
// Liquidity pool status (set to true when DEX listing is live)
const isLiquidityPoolLive = false;
```

### **To Enable Withdrawals:**
Simply change to:
```javascript
const isLiquidityPoolLive = true;
```

This single toggle controls:
- ✅ Withdrawal button activation
- ✅ Warning banner visibility
- ✅ Modal access
- ✅ UI messaging

---

## User Experience During Restriction:

### **What Users CAN Do:**
✅ View their PVCX balance in real-time
✅ See breakdown (bookings vs CO₂ earnings)
✅ View potential earnings (estimated)
✅ See token information and tokenomics
✅ Add token to MetaMask (when contract deployed)
✅ Understand earning mechanics

### **What Users CANNOT Do:**
❌ Request withdrawals
❌ Transfer tokens to wallets
❌ Trade tokens on DEX
❌ Click withdrawal button (disabled)

### **Key Messages Displayed:**
- "Withdrawals Locked"
- "Available after liquidity pool creation"
- "Tokens safely stored in your account"
- "Pre-Liquidity Reward Phase"
- "Coming Soon" for withdrawals

---

## Database Impact:

### **Tables Still Active:**
- ✅ `user_pvcx_balances` - Tracks balances
- ✅ `pvcx_transactions` - Records earnings
- ❌ `pvcx_withdrawal_requests` - NOT used until enabled

### **What Happens:**
1. Users earn PVCX tokens (recorded in database)
2. Balances update automatically via triggers
3. Users see their balance grow
4. Withdrawal requests table remains empty
5. Once liquidity pool is live → flip switch → users can withdraw

---

## Timeline:

### **Phase 1: Current (Pre-Liquidity)**
- Earn tokens ✅
- View balance ✅
- Track earnings ✅
- Withdrawals ❌

### **Phase 2: After Liquidity Pool Creation**
- Change `isLiquidityPoolLive = true`
- Deploy ERC-20 contract
- Add contract address
- Enable withdrawals ✅
- DEX trading available ✅

---

## Communication to Users:

### **Transparent Messaging:**
All restriction messaging is clear and prominent:
- 🔒 Lock icons throughout UI
- Yellow/Orange warning colors
- "Coming Soon" labels
- Explicit timeline (after liquidity pool)
- Reassurance: "safely stored in your account"

### **No Surprises:**
Users are informed from the moment they visit the page:
1. Top banner warns immediately
2. Withdrawal button clearly states "Locked"
3. Current Phase section explains status
4. How to Earn shows step 3 disabled

---

## When to Enable:

### **Checklist Before Flipping Switch:**
- [ ] ERC-20 contract deployed to Ethereum Mainnet
- [ ] Contract verified on Etherscan
- [ ] Liquidity pool created on Uniswap
- [ ] Initial liquidity added (ETH/PVCX pair)
- [ ] DEX trading is live and functional
- [ ] Admin dashboard ready to process withdrawals
- [ ] Withdrawal process tested end-to-end
- [ ] Support team briefed on new flow

### **Then:**
1. Update `isLiquidityPoolLive = true`
2. Update contract address in code
3. Deploy updated frontend
4. Announce to users via email/notification
5. Monitor withdrawal requests
6. Process manually as they come in

---

## Technical Implementation:

### **File:** `src/components/PVCXTokenView.jsx`

**Conditional Rendering:**
```javascript
{isLiquidityPoolLive ? (
  <button onClick={() => setShowWithdrawalModal(true)}>
    Request Withdrawal
  </button>
) : (
  <div>
    <button disabled>Withdrawals Locked</button>
    <p>Withdrawals available after liquidity pool creation</p>
  </div>
)}
```

**No Changes Needed To:**
- Database schema
- Balance tracking
- Earning calculations
- Transaction logging
- Admin dashboard (when built)

---

## Benefits of This Approach:

✅ **Builds Token Holders** - Users accumulate tokens before trading is available
✅ **Transparent** - Clear messaging prevents confusion
✅ **Flexible** - One-line code change to enable
✅ **Secure** - Balances tracked safely in database
✅ **Engaging** - Users can still see growth and potential
✅ **Trust** - Reassures tokens are "safely stored"

---

## Summary:

**Current Implementation:**
- Users earn and view PVCX balance ✅
- Withdrawals locked until liquidity pool 🔒
- Clear messaging throughout UI 📢
- One-variable toggle to enable later 🎯

**When you're ready:**
- Change `isLiquidityPoolLive = true`
- Add contract address
- Deploy contract + liquidity
- Withdrawals activate immediately ✅

---

No user confusion. No surprises. Just transparent, professional messaging about the token roadmap. 🚀
