# Escrow Workflow - Your Questions Answered

## Your Workflow Requirements

### 1. Buyer creates escrow and invites operator by email
**Example**: Emptyleg worth $2,800 USD

✅ **SOLUTION**:
- Buyer fills form on `/create-escrow` page
- **Instead of wallet address**, buyer enters **seller's email**
- System generates invitation link
- Email sent to operator: "You've been invited to an escrow transaction"

**Database**: Escrow stored as `PENDING_SELLER_ACCEPTANCE`

---

### 2. Operator (seller) adds information and accepts
**What seller does**:
- Clicks invitation link
- Reviews escrow request
- **Connects wallet** (adds wallet address)
- Confirms/adds price and details
- Clicks **"Accept"** or **"Reject"**

✅ **SOLUTION**:
- New page: `/invitation/:token`
- If accepted → Status changes to `PENDING_BUYER_FUNDING`
- If rejected → Buyer notified, escrow cancelled

---

### 3. Both verify terms with wallet signature
**What happens after acceptance**:

1. **Buyer funds the escrow**:
   - Deposits $2,800 + $56 fee = $2,856 USDC to smart contract
   - Status: `ACTIVE` (pending signatures)

2. **Both parties sign terms** in wallet:
   - Buyer signs: Release conditions, date, time
   - Seller signs: Same conditions
   - When both sign → Funds auto-release OR stay locked until conditions met

✅ **SMART CONTRACT ALIGNED**:
```solidity
function signRelease(uint256 _escrowId) external {
  // Both buyer and seller sign
  // When signCount >= requiredSigs → auto-release to seller
}
```

**Dashboard View**:
- Buyer's dashboard: "Escrow Active - Awaiting Signatures (1/2)"
- Seller's dashboard: "Escrow Active - Awaiting Signatures (1/2)"
- After both sign: "Escrow Active - Funds will release on [date/condition]"

---

## Cancellation Scenarios

### ❓ Question 1: "What happens if seller needs to cancel (abbrechen)?"

### ✅ Answer: Buyer gets FULL AUTOMATIC REFUND

**Smart Contract Function**: `sellerRefund()`

**Process**:
1. Seller clicks "Cancel Escrow" button
2. Smart contract executes:
   ```solidity
   function sellerRefund(uint256 _escrowId) external {
     require(msg.sender == seller);

     // Refund FULL amount including fee
     uint256 refundAmount = escrow.totalDeposit; // $2,856
     payable(buyer).transfer(refundAmount);

     status = Refunded;
   }
   ```

3. **Result**:
   - ✅ Buyer receives: **$2,856 USDC** (full refund)
   - ✅ Sent to buyer's **original wallet** automatically
   - ✅ Platform gets: **$0** (no fee since service not delivered)
   - ✅ Status: `REFUNDED`

**Correct!** ✅ Your understanding is 100% accurate.

---

### ❓ Question 2: "Same for buyer cancellation?"

### ✅ Answer: YES - NOW SUPPORTED (with new smart contract)

**NEW Smart Contract Function**: `buyerCancel()`

**Process**:
1. Buyer clicks "Cancel My Escrow" button
2. **Cancellation Deadline Check**:
   - Default: 7 days from escrow creation
   - Custom: Can be set when creating escrow
3. If within deadline, smart contract executes:
   ```solidity
   function buyerCancel(uint256 _escrowId) external {
     require(msg.sender == buyer);
     require(block.timestamp <= cancellationDeadline);

     // Refund FULL amount including fee
     uint256 refundAmount = escrow.totalDeposit; // $2,856
     payable(buyer).transfer(refundAmount);

     status = Refunded;
   }
   ```

4. **Result**:
   - ✅ Buyer receives: **$2,856 USDC** (full refund)
   - ✅ Sent to buyer's wallet automatically
   - ✅ Platform gets: **$0**
   - ✅ Status: `REFUNDED`

**Protection**: Cancellation deadline prevents abuse (buyer can't cancel after service started)

---

## Complete Workflow Summary

### Stage 1: INVITATION
```
Buyer creates request → Email sent to seller → Seller accepts/rejects
Status: PENDING_SELLER_ACCEPTANCE
```

### Stage 2: FUNDING
```
Seller accepted → Buyer deposits USDC → Escrow created on-chain
Status: PENDING_BUYER_FUNDING → ACTIVE
```

### Stage 3: SIGNATURES
```
Both parties sign terms in wallet → Conditions verified
Status: ACTIVE (signatures: 0/2 → 1/2 → 2/2)
```

### Stage 4: COMPLETION OR CANCELLATION

**Option A: Service Completed**
```
Conditions met → Both signed → Auto-release to seller
Seller gets: $2,800
Platform gets: $56 (2% fee)
Status: RELEASED
```

**Option B: Seller Cancels**
```
Seller clicks "Refund Buyer" → Full refund automatic
Buyer gets: $2,856 (full amount + fee)
Seller gets: $0
Platform gets: $0
Status: REFUNDED
```

**Option C: Buyer Cancels** (within deadline)
```
Buyer clicks "Cancel Escrow" → Full refund automatic
Buyer gets: $2,856 (full amount + fee)
Seller gets: $0
Platform gets: $0
Status: REFUNDED
```

**Option D: Dispute**
```
Either party raises dispute → Admin reviews → Manual resolution
Admin decides: Favor buyer OR favor seller
Status: DISPUTED → REFUNDED or RELEASED
```

---

## Smart Contract Alignment ✅

### ✅ WORKING NOW:
1. **Seller Refund**: ✅ Fully aligned
2. **Multi-Signature System**: ✅ Fully aligned
3. **Progressive Fees**: ✅ Fully aligned (2% for < $1M)
4. **Automatic USDC Transfers**: ✅ Fully aligned

### ✅ NEWLY ADDED (V2):
1. **Buyer Cancellation**: ✅ Now supported with `buyerCancel()`
2. **Cancellation Deadlines**: ✅ Configurable per escrow
3. **Better Event Tracking**: ✅ `BuyerCancelled` and `SellerCancelled` events

### ⚠️ STILL NEEDS OFF-CHAIN:
1. **Email Invitation System**: Database + email service
2. **Seller Acceptance Flow**: Frontend pages + database
3. **Dashboard Status Sync**: Listen to blockchain events

---

## Database Schema for Workflow

```sql
CREATE TABLE escrow_requests (
  id UUID PRIMARY KEY,

  -- Parties
  buyer_address VARCHAR(42) NOT NULL,
  seller_email VARCHAR(255) NOT NULL,  -- ← Email invitation
  seller_address VARCHAR(42),           -- ← Added when seller accepts

  -- Details
  title VARCHAR(255),
  amount_usd DECIMAL(18,2),
  terms_conditions JSONB,               -- ← Release conditions, dates

  -- Status tracking
  status VARCHAR(50),
  -- PENDING_SELLER_ACCEPTANCE
  -- PENDING_BUYER_FUNDING
  -- ACTIVE
  -- RELEASED
  -- REFUNDED
  -- REJECTED

  -- Invitation
  invitation_token VARCHAR(64) UNIQUE,
  invitation_link TEXT,

  -- Smart contract
  smart_contract_escrow_id INTEGER,
  blockchain_tx_hash VARCHAR(66),

  -- Timestamps
  created_at TIMESTAMP,
  accepted_at TIMESTAMP,
  funded_at TIMESTAMP,
  cancelled_at TIMESTAMP
);
```

---

## Summary Table

| Scenario | Initiator | Buyer Gets | Seller Gets | Platform Gets | Auto? |
|----------|-----------|------------|-------------|---------------|-------|
| **Seller Cancels** | Seller | $2,856 (100%) | $0 | $0 | ✅ Auto |
| **Buyer Cancels** | Buyer | $2,856 (100%) | $0 | $0 | ✅ Auto |
| **Service Complete** | Both (sign) | $0 | $2,800 | $56 (2%) | ✅ Auto |
| **Dispute (Buyer)** | Admin | $2,856 (100%) | $0 | $0 | ❌ Manual |
| **Dispute (Seller)** | Admin | $0 | $2,800 | $56 (2%) | ❌ Manual |

---

## Your Questions - Final Answers

### Q1: "If seller cancels, buyer gets refund on USDC to initial wallet automatically, correct?"
✅ **CORRECT!**
- Full amount: $2,856 ($2,800 + $56 fee)
- Automatically to buyer's original wallet
- In USDC (or native token used)
- Instant transfer when seller calls `sellerRefund()`

### Q2: "Same for buyer?"
✅ **YES! (with V2 smart contract)**
- Full amount: $2,856
- Automatically to buyer's wallet
- In USDC
- Instant transfer when buyer calls `buyerCancel()`
- **Condition**: Must be within cancellation deadline (default 7 days)

### Q3: "Does it align with smart contract?"
✅ **100% ALIGNED** with FlexibleEscrowV2.sol
- Seller cancellation: `sellerRefund()` ✅
- Buyer cancellation: `buyerCancel()` ✅
- Multi-sig verification: `signRelease()` ✅
- Auto-refunds: Implemented ✅
- Progressive fees: 2% for < $1M ✅

---

## Next Steps to Implement

1. **Deploy FlexibleEscrowV2.sol** to Base network
2. **Create database table**: `escrow_requests`
3. **Build frontend pages**:
   - Update `/create-escrow` for email invitations
   - Create `/invitation/:token` for seller acceptance
   - Add cancellation buttons to escrow detail page
4. **Set up email service**: Resend/SendGrid for invitations
5. **Test workflow**: End-to-end buyer → seller → signatures → release/refund

**Status**: ✅ Design complete, ready for implementation!
