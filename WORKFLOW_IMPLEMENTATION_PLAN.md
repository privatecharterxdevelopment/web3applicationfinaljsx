# Escrow Workflow Implementation Plan

## User Story: Emptyleg Charter Escrow

**Example**: Buyer wants to book an emptyleg flight worth $2,800 USD

---

## Complete Workflow

### Step 1: Buyer Creates Escrow Request
**Page**: `/create-escrow`

**Actions**:
1. Buyer fills in:
   - Title: "Emptyleg Charter - Monaco to Paris"
   - Amount: $2,800 USD
   - Description: Flight details
   - **Seller Email**: operator@aviationcompany.com (NOT wallet address yet)
   - Terms: Release conditions, dates, milestones

2. System generates:
   - Escrow draft ID in database
   - Status: `PENDING_SELLER_ACCEPTANCE`
   - Unique invitation link

3. Email sent to seller with:
   - Escrow details
   - Invitation link
   - "Accept" or "Reject" buttons

**Database Entry**:
```sql
INSERT INTO escrow_requests (
  buyer_address,
  seller_email,
  amount_usd,
  title,
  description,
  terms_conditions,
  status,
  invitation_token,
  created_at
) VALUES (
  '0xBuyer...',
  'operator@aviationcompany.com',
  2800,
  'Emptyleg Charter - Monaco to Paris',
  '...',
  '...',
  'PENDING_SELLER_ACCEPTANCE',
  'unique-token-123',
  NOW()
);
```

---

### Step 2: Seller Reviews and Accepts/Rejects
**Page**: `/invitation/:token`

**Seller Actions**:
1. Clicks invitation link from email
2. Reviews escrow request details
3. If accepting:
   - Connects wallet
   - Adds/confirms their wallet address
   - Adds additional information (if needed)
   - Clicks "Accept Escrow Request"
4. If rejecting:
   - Provides reason (optional)
   - Clicks "Reject Request"

**Accept Flow**:
```sql
UPDATE escrow_requests
SET
  seller_address = '0xSeller...',
  seller_additional_info = '...',
  status = 'PENDING_BUYER_FUNDING',
  accepted_at = NOW()
WHERE invitation_token = 'unique-token-123';
```

**Reject Flow**:
```sql
UPDATE escrow_requests
SET
  status = 'REJECTED_BY_SELLER',
  rejection_reason = 'Aircraft not available for these dates',
  rejected_at = NOW()
WHERE invitation_token = 'unique-token-123';

-- Email buyer: "Your escrow request was rejected"
```

---

### Step 3: Buyer Funds Escrow
**Page**: `/escrow/:id/fund`

**Actions**:
1. Buyer receives email: "Seller accepted! Fund your escrow"
2. Buyer connects wallet
3. Reviews final terms (now with seller's wallet address)
4. **Signs terms in wallet** (signature verification)
5. Deposits USDC + platform fee to smart contract

**Smart Contract Call**:
```solidity
function createCustomEscrow(
  address _seller,           // 0xSeller...
  string _contractCID,       // IPFS CID of terms
  string _description,       // "Emptyleg Charter..."
  address[] _signers,        // [buyer, seller]
  uint256 _requiredSigs,     // 2 (both must sign)
  string _bookingId          // escrow_request_id
) external payable;
```

**Database Update**:
```sql
UPDATE escrow_requests
SET
  status = 'ACTIVE',
  smart_contract_escrow_id = 1,
  blockchain_tx_hash = '0x...',
  funded_at = NOW()
WHERE id = escrow_request_id;
```

**Dashboard Status**:
- Buyer Dashboard: Shows "Active" escrow (pending seller signature)
- Seller Dashboard: Shows "Active" escrow (pending signature)

---

### Step 4: Both Parties Verify Terms
**Page**: `/escrow/:id`

**Both Buyer AND Seller Must**:
1. View escrow details
2. Review terms:
   - Amount: $2,800
   - Release conditions: "After flight completion"
   - Release date: "2025-12-15 18:00 UTC"
   - Milestones: "Flight completed successfully"
3. **Sign verification in wallet**
4. Click "Verify Terms"

**Smart Contract Call (by each party)**:
```solidity
function signRelease(uint256 _escrowId) external;
```

**Status Updates**:
- After Buyer signs: `signCount = 1 / 2`
- After Seller signs: `signCount = 2 / 2` → **Funds Released Automatically**

---

## Cancellation Scenarios

### Scenario A: Seller Cancels (Before Service)
**Who**: Seller or Admin
**When**: Before flight/service delivered
**Smart Contract Function**: `refund()`

**Process**:
1. Seller navigates to escrow detail page
2. Clicks "Cancel Escrow & Refund Buyer"
3. Signs cancellation in wallet
4. Smart contract executes:
   ```solidity
   function refund(uint256 _escrowId) external {
     require(msg.sender == seller || msg.sender == admin);
     require(status == Active);

     // Refund FULL amount including fee to buyer
     uint256 refundAmount = escrow.totalDeposit; // $2,800 + 2% fee = $2,856
     payable(buyer).transfer(refundAmount);

     status = Refunded;
   }
   ```

**Result**:
- ✅ Buyer receives **$2,856 USDC** (full refund including platform fee)
- ✅ Automatically sent to buyer's original wallet
- ✅ Escrow marked as "Refunded" in both dashboards

---

### Scenario B: Buyer Cancels (Before Service)
**Who**: Buyer
**When**: Before flight/service delivered
**Smart Contract Function**: `buyerCancel()` ⚠️ **NEEDS TO BE ADDED**

**Current Problem**: Smart contract doesn't have buyer cancellation function!

**Solution - Add to Smart Contract**:
```solidity
/**
 * @notice Buyer cancels escrow and receives refund
 * @dev Can only be called by buyer before service delivery
 * @param _escrowId Escrow ID to cancel
 */
function buyerCancel(uint256 _escrowId)
    external
    escrowExists(_escrowId)
    whenNotPaused
    nonReentrant
{
    CustomEscrow storage escrow = escrows[_escrowId];
    require(escrow.status == EscrowStatus.Active, "Escrow not active");
    require(msg.sender == escrow.buyer, "Only buyer can call");

    // Optional: Add cancellation deadline
    require(
        block.timestamp < escrow.createdAt + 7 days,
        "Cancellation period expired"
    );

    // Cache values
    uint256 refundAmount = escrow.totalDeposit;
    address buyer = escrow.buyer;

    // Update status
    escrow.status = EscrowStatus.Refunded;
    escrow.releasedAt = block.timestamp;

    // Refund full amount to buyer
    (bool success, ) = payable(buyer).call{value: refundAmount}("");
    require(success, "Refund failed");

    emit EscrowRefunded(_escrowId, buyer, refundAmount);
    emit BuyerCancelled(_escrowId, buyer, block.timestamp);
}
```

**Result**:
- ✅ Buyer receives **$2,856 USDC** (full refund including platform fee)
- ✅ Automatically sent to buyer's original wallet
- ✅ Escrow marked as "Refunded" in both dashboards

---

### Scenario C: Service Completed - Funds Released
**Who**: Buyer & Seller (multi-sig)
**When**: After flight completed successfully
**Smart Contract Function**: `signRelease()` → auto-releases when threshold met

**Process**:
1. Flight completes on 2025-12-15
2. **Buyer** signs release: "Flight completed successfully"
3. **Seller** signs release: "Service delivered"
4. Smart contract automatically:
   ```solidity
   if (signCount >= requiredSigs) {
     // Release funds to seller
     uint256 sellerAmount = escrow.amount; // $2,800
     uint256 feeAmount = escrow.platformFee; // $56 (2%)

     payable(seller).transfer(sellerAmount);  // $2,800 to seller
     totalFeesCollected += feeAmount;          // $56 to platform

     status = Released;
   }
   ```

**Result**:
- ✅ Seller receives **$2,800 USDC**
- ✅ Platform collects **$56 USDC** (2% fee)
- ✅ Escrow marked as "Released" in both dashboards

---

## Summary Table

| Scenario | Who Cancels | Buyer Gets | Seller Gets | Platform Gets | Status |
|----------|-------------|------------|-------------|---------------|---------|
| **Seller Cancels** | Seller | $2,856 (full) | $0 | $0 | Refunded |
| **Buyer Cancels** | Buyer | $2,856 (full) | $0 | $0 | Refunded |
| **Service Complete** | N/A (Auto) | $0 | $2,800 | $56 (2%) | Released |
| **Dispute** | Admin | Varies | Varies | $0 | Disputed |

---

## Database Schema

### Table: `escrow_requests`
```sql
CREATE TABLE escrow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parties
  buyer_address VARCHAR(42) NOT NULL,
  buyer_email VARCHAR(255),
  seller_email VARCHAR(255) NOT NULL,
  seller_address VARCHAR(42),

  -- Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount_usd DECIMAL(18,2) NOT NULL,
  terms_conditions JSONB, -- Release conditions, dates, milestones

  -- Invitation
  invitation_token VARCHAR(64) UNIQUE NOT NULL,
  invitation_expires_at TIMESTAMP,

  -- Status
  status VARCHAR(50) NOT NULL, -- PENDING_SELLER_ACCEPTANCE, PENDING_BUYER_FUNDING, ACTIVE, RELEASED, REFUNDED, REJECTED
  rejection_reason TEXT,

  -- Smart Contract
  smart_contract_escrow_id INTEGER,
  blockchain_tx_hash VARCHAR(66),
  contract_cid VARCHAR(100), -- IPFS CID

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  funded_at TIMESTAMP,
  released_at TIMESTAMP,
  refunded_at TIMESTAMP
);

CREATE INDEX idx_invitation_token ON escrow_requests(invitation_token);
CREATE INDEX idx_buyer_address ON escrow_requests(buyer_address);
CREATE INDEX idx_seller_email ON escrow_requests(seller_email);
CREATE INDEX idx_status ON escrow_requests(status);
```

---

## Required Changes

### 1. Smart Contract Update
- ✅ Add `buyerCancel()` function
- ✅ Add `BuyerCancelled` event
- ✅ Add cancellation deadline logic (optional)

### 2. Frontend Pages
- ✅ Update `/create-escrow` to support email invitation
- ✅ Create `/invitation/:token` page for seller acceptance
- ✅ Create `/escrow/:id/fund` page for buyer funding
- ✅ Update `/escrow/:id` to show signature status
- ✅ Add "Cancel & Refund" buttons to escrow detail page

### 3. Backend/Database
- ✅ Create `escrow_requests` table
- ✅ Implement email invitation system
- ✅ Create invitation acceptance endpoint
- ✅ Sync smart contract events with database

### 4. Email Templates
- ✅ Seller invitation email
- ✅ Buyer funding notification email
- ✅ Both parties: "Awaiting signature" email
- ✅ Cancellation notification emails

---

## Next Steps

1. **Update Smart Contract**: Add `buyerCancel()` function
2. **Run Database Migration**: Create `escrow_requests` table
3. **Implement Frontend Flow**: Email invitation → Acceptance → Funding → Signatures
4. **Test End-to-End**: Full workflow from invitation to release/refund

**Priority**: HIGH - This is core business logic
**Est. Time**: 4-6 hours full implementation
