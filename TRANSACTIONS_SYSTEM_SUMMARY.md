# Transactions System - Complete Overview

## ✅ What Was Implemented

### **1. Created Unified `transactions` Table**
**File:** `supabase/migrations/20251020100000_create_transactions_table.sql`

This is a **NEW unified activity log** that shows ALL user activity in one place (sidebar "Transactions").

#### Purpose:
- Single source of truth for user's activity feed
- Shows wallet signatures, tokenizations, launchpad joins, blog comments, Stripe payments, etc.
- Separate from domain-specific tables like `launchpad_transactions`, `pvcx_transactions`

#### Schema:
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),      -- User from auth
  wallet_address TEXT,                          -- Wallet address (if applicable)
  transaction_type TEXT NOT NULL,               -- Type of activity
  category TEXT NOT NULL,                       -- Category: wallet_signature, fiat_payment, crypto_payment, platform_action
  amount DECIMAL(20, 2) DEFAULT 0,             -- Amount (if monetary)
  currency TEXT DEFAULT 'USD',                  -- Currency
  status TEXT NOT NULL DEFAULT 'completed',     -- Status
  description TEXT,                             -- Human-readable description
  signature TEXT,                               -- Wallet signature (if applicable)
  tx_hash TEXT,                                 -- Blockchain tx hash (if on-chain)
  metadata JSONB,                               -- Additional context
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 📊 Transaction Types Being Recorded

### **✅ Already Implemented:**

1. **Blog Comments** (`blog_comment`)
   - File: `src/components/Landingpagenew/BlogPostDetail.jsx` (line 219)
   - Category: `wallet_signature`
   - When: User signs wallet and posts comment
   - Includes: Wallet signature, comment preview, blog post info

2. **Tokenization Submissions** (`tokenization_submission`)
   - File: `src/services/tokenizationService.ts` (line 340)
   - Category: `wallet_signature`
   - When: User submits UTO/STO tokenization request
   - Includes: Asset details, token info, issuer wallet, signature

3. **Launchpad Waitlist Joins** (`launchpad_waitlist_join`)
   - File: `src/components/Landingpagenew/LaunchDetailPage.jsx` (line 133)
   - Category: `wallet_signature`
   - When: User joins launchpad waitlist with wallet signature
   - Includes: Launch details, signature, timestamp

---

### **⏳ Still Need to Add:**

4. **Stripe Payments** (`stripe_payment`)
   - Category: `fiat_payment`
   - When: User makes payment via Stripe
   - Currently stored ONLY in `user_requests.stripe_payment_intent_id`
   - **Need to add:** Transaction record when payment completes
   - Files to update: Where Stripe webhooks/payment completion happens

5. **Crypto Payments** (`crypto_payment`)
   - Category: `crypto_payment`
   - When: User pays with crypto (CoinGate)
   - Currently stored in `user_requests.coingate_order_id`
   - **Need to add:** Transaction record when payment confirms

6. **SPV Formation Submissions** (`spv_submission`)
   - Category: `wallet_signature`
   - When: User submits SPV formation request with wallet signature
   - Currently saved to `user_requests` table
   - **Need to add:** Transaction record with signature

7. **STO Investments** (`sto_investment`)
   - Category: `crypto_payment` or `fiat_payment` (depends on payment method)
   - When: User invests in security tokens
   - Currently saved to `sto_investments` table
   - **Need to add:** Transaction record with amount and signature

8. **P2P Trades** (`p2p_trade`)
   - Category: `crypto_payment`
   - When: User lists or buys STO on P2P marketplace
   - Currently saved to `sto_listings` table
   - **Need to add:** Transaction record

---

### **❌ NOT in Transactions Table:**

**Booking Requests** (flights, taxis, charter jets)
- **Location:** "My Requests" sidebar section ONLY
- **Why:** These are service requests, not financial transactions
- **Storage:** `user_requests` or `booking_requests` tables only
- They have their own dedicated management interface and should NOT clutter the transactions activity feed

---

## 🗄️ Relationship with Other Tables

### Domain-Specific Tables (Keep These):
- `launchpad_transactions` - Launchpad-specific data
- `pvcx_transactions` - PVCX token rewards
- `user_requests` - Booking/request data with Stripe IDs
- `ride_disputes` - Dispute management
- `sto_investments` - Investment tracking

### Unified Table (New):
- `transactions` - **User's activity feed** (shown in sidebar)

**Pattern:** Write to BOTH tables:
1. Domain-specific table (for feature functionality)
2. Unified `transactions` table (for user's activity feed)

---

## 📱 Sidebar "Transactions" View

The sidebar should query the `transactions` table to show:
- User's complete activity history
- **Filterable by category:**
  - All Activity (default)
  - Payments (fiat_payment + crypto_payment)
  - Signatures (wallet_signature)
  - Platform Actions (platform_action)
- Sortable by date
- Shows amount, description, status
- **UI Logic:** Hide amount when = 0 (typically signatures)
- Links to related items (click to view tokenization, launchpad, etc.)

**Example Queries:**
```sql
-- All transactions
SELECT * FROM transactions
WHERE user_id = :user_id
OR wallet_address IN (
  SELECT wallet_address FROM user_profiles WHERE user_id = :user_id
)
ORDER BY created_at DESC
LIMIT 50;

-- Filter by category
SELECT * FROM transactions
WHERE (user_id = :user_id OR wallet_address = :wallet_address)
  AND category = 'wallet_signature'  -- or 'fiat_payment', 'crypto_payment', 'platform_action'
ORDER BY created_at DESC;
```

---

## 🔐 Security & RLS

Row Level Security is enabled:
- Users can only see their OWN transactions
- Matched by `user_id` OR `wallet_address`
- Service role has full access for backend operations

---

## 📋 Next Steps

### 1. **Run the Migration** ✅ (Already done)
```bash
# Already applied: 20251020100000_create_transactions_table.sql
```

### 2. **Update Existing Transaction Inserts** ✅ (COMPLETED)
All existing transaction recording code has been updated with `category` field:
- [x] Blog comments → `category: 'wallet_signature'`
- [x] Tokenization submissions → `category: 'wallet_signature'`
- [x] Launchpad waitlist joins → `category: 'wallet_signature'`

### 3. **Add Missing Transaction Types**
Need to add transaction recording for:
- [ ] Stripe payment completion → `category: 'fiat_payment'`
- [ ] Crypto payment confirmation → `category: 'crypto_payment'`
- [ ] SPV submissions → `category: 'wallet_signature'`
- [ ] STO investments → `category: 'fiat_payment'` or `'crypto_payment'`
- [ ] P2P trades → `category: 'crypto_payment'`

**Note:** Booking requests (flights, taxis) stay ONLY in "My Requests" - they are NOT financial transactions and should NOT appear in the Transactions table.

### 4. **Update Sidebar to Show Transactions**
- [ ] Create/update transactions view component
- [ ] Query `transactions` table
- [ ] Display with proper formatting
- [ ] Add category filters:
  - [ ] All Activity (default)
  - [ ] Payments (fiat + crypto)
  - [ ] Signatures
  - [ ] Platform Actions
- [ ] Implement UI logic to hide amount when = 0

### 5. **Add Transaction Details Modal**
- [ ] Click transaction to see full details
- [ ] Show metadata
- [ ] Link to related items

---

## 🎯 Benefits

✅ **Unified Activity Log**: All user actions in one place
✅ **Transparency**: Users see everything they've done
✅ **Audit Trail**: Complete record with signatures
✅ **Dispute Resolution**: Clear history for support
✅ **User Engagement**: Users can track their activity
✅ **Compliance**: Blockchain transparency for all actions

---

## 📞 Support

If transactions aren't showing up:
1. Check migration was applied: Run query `SELECT * FROM transactions LIMIT 1;`
2. Check RLS policies allow user to see their data
3. Verify user_id or wallet_address matches auth.users
4. Check browser console for errors when creating transactions
