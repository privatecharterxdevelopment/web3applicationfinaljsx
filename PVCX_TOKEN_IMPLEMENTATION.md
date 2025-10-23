# $PVCX Token System - Complete Implementation Guide

## 🎯 Overview

The $PVCX Token system has been fully implemented as a reward-based cryptocurrency for PrivateCharterX. This system operates in a **pre-liquidity phase** where tokens are earned through platform usage and can be withdrawn to user wallets for future DEX trading.

---

## ✅ Implementation Summary

### **1. Database Schema** ([supabase/migrations/add_pvcx_token_system.sql](supabase/migrations/add_pvcx_token_system.sql))

Three new tables created:

#### `user_pvcx_balances`
- Tracks each user's PVCX token balance
- Columns: `balance`, `earned_from_bookings`, `earned_from_co2`, `pending_withdrawal`, `wallet_address`
- Auto-updates via triggers when transactions occur

#### `pvcx_withdrawal_requests`
- Stores user withdrawal requests for manual admin processing
- Columns: `wallet_address`, `network` (Ethereum/Base), `amount`, `status`, `tx_hash`
- Statuses: pending → approved → sent

#### `pvcx_transactions`
- Complete transaction history for all PVCX movements
- Types: `booking_reward`, `co2_certificate`, `withdrawal`, `admin_bonus`, `ngo_contribution`
- Linked to bookings via `booking_id`

#### Updates to `user_requests`
- Added: `pvcx_earned`, `pvcx_credited`, `distance_km`, `co2_saved_tons`
- Tracks which bookings have had PVCX rewards credited

---

### **2. Main PVCX Token Page** ([src/components/PVCXTokenView.jsx](src/components/PVCXTokenView.jsx))

Full-featured token management dashboard with:

#### **Cards Implemented:**

1. **PVCX Balance Card**
   - Shows current token balance (fetched from Supabase)
   - Breakdown: earnings from bookings vs CO₂ certificates
   - "Request Withdrawal" button

2. **Earning Potential Card**
   - Estimated booking rewards (km × 1.5 multiplier)
   - Estimated CO₂ rewards (tons × 2.0 multiplier)
   - Total potential earnings display

3. **Add Token to Wallet Card**
   - Token contract address (placeholder for now)
   - One-click "Add to MetaMask" button
   - Network support: Ethereum Mainnet & Base
   - Copy contract address functionality

4. **ICO & Tokenomics Card**
   - Total supply: 10,000,000 $PVCX
   - Distribution breakdown:
     - Presale Investors: 30% (3M)
     - Customer Rewards: 25% (2.5M)
     - Operational Growth: 45% (4.5M)
   - Reward mechanics explanation
   - Current phase: Pre-liquidity

5. **How to Earn Card**
   - Step-by-step guide for earning tokens
   - Booking → CO₂ credits → Withdrawal flow

#### **Design Features:**
- Glassmorphic cards matching luxury asset marketplace
- Black/gray gradient color scheme
- Token logo prominently displayed
- Responsive grid layout
- Smooth hover animations

---

### **3. Withdrawal System** ([src/components/Modals/PVCXWithdrawalModal.jsx](src/components/Modals/PVCXWithdrawalModal.jsx))

**Manual withdrawal flow:**
1. User enters wallet address (ETH/Base network)
2. Selects network (Ethereum Mainnet or Base)
3. Enters amount (max = current balance)
4. Form validates wallet address (0x... format)
5. Creates withdrawal request in database
6. Admin processes manually within 24-48 hours
7. User receives confirmation notification

**Key Features:**
- Wallet address validation (Ethereum address regex)
- MAX button for quick full withdrawal
- Network selection (Ethereum/Base)
- Error handling with user-friendly messages
- Success state with processing timeline

---

### **4. Header Integration** ([src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx](src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx))

#### **PVCX Balance Widget** (Line ~2547)
- Displays real-time balance in header
- Format: `0.000 $PVCX`
- Clickable → navigates to PVCX Token page
- Synced with balance state across app
- Purple coin icon for visual identification

#### **Tokenize Asset Button** (Line ~2564)
- Small black button with Plus icon
- Same size as other header icons
- Opens tokenization form modal
- Located between PVCX balance and notifications

---

### **5. Sidebar Navigation** ([src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx](src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx))

Added to Web3.0 section (Line ~2182):
- **$PVCX Token** - Navigate to token dashboard
- **Tokenize Asset** - Launch tokenization form

Both menu items are `web3Only` (only visible in Web3.0 mode)

---

### **6. Token Earning Mechanics**

#### **Booking Rewards:**
- Formula: `distance_km × 1.5 = PVCX earned`
- Example: 100km trip = 150 PVCX tokens
- Automatically calculated after ride completion

#### **CO₂ Certificate Rewards:**
- Formula: `co2_saved_tons × 2.0 = PVCX earned`
- Example: 5 tons saved = 10 PVCX tokens
- Requires manual admin certification

#### **Platform Contribution:**
- 2% of every booking → PVCX liquidity pool
- 2% of every booking → verified NGO projects
- Creates self-reinforcing token economy

---

### **7. Token Information**

#### **ERC-20 Details:**
- **Name:** PrivateCharterX
- **Symbol:** PVCX
- **Decimals:** 18 (standard)
- **Total Supply:** 10,000,000 PVCX
- **Contract Address:** To be announced (placeholder)
- **Networks:** Ethereum Mainnet, Base Network

#### **Logo URL:**
```
https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/Title-removebg-preview.png
```

---

### **8. Database Functions**

#### `calculate_potential_pvcx_earnings(user_id)`
Returns:
- `total_km` - Total kilometers from all completed trips
- `km_reward` - Estimated PVCX from distance (km × 1.5)
- `co2_tons` - Total CO₂ tons saved
- `co2_reward` - Estimated PVCX from CO₂ (tons × 2.0)
- `total_potential` - Sum of all potential earnings

Only counts **completed, non-credited** bookings.

#### `update_pvcx_balance_on_transaction()` (Trigger)
Automatically updates user balance when:
- New transaction inserted (booking reward, CO₂ certificate, admin bonus)
- Withdrawal processed
- Maintains accurate running balance

---

## 📋 Next Steps for You

### **1. Run Database Migration**
```sql
-- Execute in Supabase SQL Editor
-- File: supabase/migrations/add_pvcx_token_system.sql
```

### **2. Deploy ERC-20 Token Contract**
When ready to deploy the token:
1. Deploy ERC-20 contract to Ethereum Mainnet
2. Update contract address in `PVCXTokenView.jsx` (line ~17)
3. Update in `.env`:
```env
VITE_PVCX_CONTRACT_ADDRESS=0x...
```

### **3. Test Withdrawal Flow**
1. Add test balance to user account:
```sql
INSERT INTO pvcx_transactions (user_id, type, amount, description)
VALUES ('user-uuid', 'admin_bonus', 100, 'Test tokens');
```
2. Test withdrawal request submission
3. Verify admin can see withdrawal requests
4. Process test withdrawal manually

### **4. Admin Dashboard Integration**
Create admin panel to:
- View all withdrawal requests
- Approve/reject requests
- Send tokens manually to wallet addresses
- Mark as "sent" with transaction hash
- Track PVCX distribution analytics

### **5. Implement Earning Automation**
Create background job/function to:
- Calculate PVCX earnings after ride completion
- Insert transaction records
- Credit user balances automatically
- For bookings: `distance_km × 1.5`
- For CO₂: requires admin certification first

---

## 🔧 Configuration Required

### **Environment Variables**
Add to `.env`:
```env
# PVCX Token Configuration
VITE_PVCX_CONTRACT_ADDRESS=0x... # To be added after deployment
VITE_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
VITE_BASE_RPC_URL=https://mainnet.base.org
```

### **MetaMask Integration**
The "Add to MetaMask" button uses:
```javascript
window.ethereum.request({
  method: 'wallet_watchAsset',
  params: {
    type: 'ERC20',
    options: {
      address: contractAddress,
      symbol: 'PVCX',
      decimals: 18,
      image: logoUrl
    }
  }
});
```

---

## 🎨 Design Consistency

All components follow the **luxury asset marketplace** design:
- Glassmorphic cards with backdrop blur
- Black/gray gradient backgrounds
- Purple accent color for PVCX branding
- Responsive grid layouts
- Smooth transitions and hover effects
- Light-framed elements for important info

---

## 💡 Key Features Implemented

✅ Real-time balance display in header
✅ Comprehensive token dashboard
✅ Manual withdrawal request system
✅ Wallet address validation
✅ Earning potential calculator
✅ MetaMask integration (Add Token)
✅ Multi-network support (ETH + Base)
✅ Tokenomics information display
✅ Transaction history tracking
✅ Auto-balance updates via triggers
✅ Navigation integration (sidebar + header)
✅ Glassmorphic design matching platform

---

## 🚀 Future Enhancements

1. **DEX Listing** - When XY wallets threshold reached
   - Add liquidity pool on Uniswap
   - Enable public trading
   - Update token page messaging

2. **On-Chain Balance Reading** - Optional
   - Connect Web3 wallet
   - Read balance from blockchain
   - Show comparison: Off-chain vs On-chain

3. **Automatic Earning Credits** - Currently manual
   - Auto-calculate after ride completion
   - Auto-credit booking rewards
   - Admin approval for CO₂ credits only

4. **Referral Bonuses** - Extend token rewards
   - Earn PVCX for referrals
   - Bonus multipliers for active users

5. **Staking System** - Future utility
   - Stake PVCX for platform benefits
   - Earn additional rewards
   - Tiered membership access

---

## 📊 Token Distribution Strategy

**Current Phase: Pre-Liquidity Reward System**

- No public sale yet
- Tokens earned through platform usage only
- Manual withdrawals to build holder base
- Goal: Reach XY wallets before DEX listing

**Distribution Allocation:**
- 30% Presale Investors (3M PVCX) - Future round
- 25% Customer Rewards (2.5M PVCX) - Active distribution
- 45% Operational Growth (4.5M PVCX) - Reserved

**Revenue Flow:**
- 2% per booking → PVCX liquidity (creates buying pressure)
- 2% per booking → NGO contributions (social impact)

---

## 🔒 Security Considerations

1. **Wallet Address Validation** - Regex check for valid Ethereum addresses
2. **Balance Checks** - Cannot withdraw more than available
3. **Manual Processing** - Admin review prevents fraud
4. **RLS Policies** - Users can only see their own data
5. **Transaction Logging** - Complete audit trail
6. **Network Validation** - Prevents wrong-network sends

---

## 📞 Support & Contact

For PVCX token questions:
- Email: bookings@privatecharterx.com
- Support tickets via chat support
- Admin dashboard for manual processing

---

## ✨ Implementation Complete!

All requested features have been implemented:
- ✅ $PVCX Token page in Web3.0
- ✅ Balance cards with earning breakdowns
- ✅ Withdrawal system with form
- ✅ Add token to wallet functionality
- ✅ ICO/Tokenomics information
- ✅ Header balance widget (synced)
- ✅ Sidebar navigation items
- ✅ "Tokenize Asset" button in header
- ✅ Glassmorphic design matching platform
- ✅ Database schema with triggers
- ✅ Earning mechanics (km × 1.5, CO₂ × 2.0)

**Ready for:**
1. Database migration execution
2. Token contract deployment
3. Admin dashboard development
4. Testing and refinement

---

**Tokens Remaining: ~115,000** 💪
