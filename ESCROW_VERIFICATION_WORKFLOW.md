# Complete Escrow Workflow with Verification & Cancellation Fee

## Updated Workflow Requirements

### Key Points:
1. ✅ **$99 USD cancellation fee** if buyer cancels
2. ✅ **Verification is CRUCIAL** - Buyer must verify after inspecting asset
3. ✅ **Email notifications** at each step
4. ✅ **Funds release** only after buyer verification

---

## Complete Workflow: Example - $2,800 Car Purchase

### Step 1: Buyer Creates Escrow & Invites Seller
**Page**: `/create-escrow`

**Buyer Actions**:
1. Fills in details:
   - Title: "Used Tesla Model S Purchase"
   - Amount: $2,800 USD
   - Description: "2018 Tesla Model S, VIN: 5YJ3E1..."
   - Seller Email: seller@example.com
2. Reviews fees:
   - Escrow Amount: $2,800
   - Platform Fee (2%): $56
   - **Total to Deposit**: $2,856
3. Clicks "Send Invitation"

**System Actions**:
- Creates escrow request (status: `PENDING_SELLER_ACCEPTANCE`)
- Sends email to seller

**Email to Seller**:
```
Subject: You've been invited to an escrow transaction

[Seller Name],

You've been invited to participate in a secured escrow transaction:

Transaction: Used Tesla Model S Purchase
Amount: $2,800 USD
Buyer: [email protected]

[Accept Invitation] [Reject Invitation]

This escrow is secured by smart contracts on the Base blockchain.

- PrivateCharterX Escrow
```

---

### Step 2: Seller Accepts & Adds Wallet
**Page**: `/invitation/:token`

**Seller Actions**:
1. Clicks "Accept Invitation" in email
2. Reviews transaction details
3. Connects Web3 wallet
4. Adds wallet address
5. Clicks "Accept Escrow Request"

**System Actions**:
- Updates status: `PENDING_BUYER_FUNDING`
- Sends email to buyer

**Email to Buyer**:
```
Subject: Seller accepted your escrow request - Fund now

Great news! The seller has accepted your escrow request.

Transaction: Used Tesla Model S Purchase
Amount: $2,800 USD
Total to deposit: $2,856 USD (incl. 2% platform fee)

Next step: Fund your escrow to activate it.

[Fund Escrow Now]

⚠️ Note: A $99 cancellation fee applies if you cancel after funding.
```

---

### Step 3: Buyer Funds Escrow
**Page**: `/escrow/:id/fund`

**Buyer Actions**:
1. Connects wallet
2. Reviews final terms
3. Sees cancellation fee notice:
   ```
   ⚠️ Cancellation Policy
   - Before funding: Free cancellation
   - After funding: $99 cancellation fee
   - After verification: No refunds (funds released to seller)
   ```
4. Deposits **$2,856 USDC** to smart contract

**Smart Contract**:
```solidity
// Escrow funded with $2,800 + $56 fee + $99 cancellation insurance
totalDeposit = $2,955 // $2,800 + $56 + $99
escrowAmount = $2,800
platformFee = $56
cancellationFee = $99
status = ACTIVE (AWAITING_BUYER_VERIFICATION)
```

**System Actions**:
- Updates status: `ACTIVE_AWAITING_VERIFICATION`
- Sends emails to both parties

**Email to Buyer**:
```
Subject: Escrow funded - Next: Inspect and verify

Your escrow has been funded successfully!

Transaction: Used Tesla Model S Purchase
Amount deposited: $2,955 USD
Status: Awaiting your verification

Next steps:
1. Inspect the asset (see the car, test drive, etc.)
2. Once satisfied, verify to release funds to seller

[View Escrow Details]

⚠️ Remember: Verify only AFTER you've inspected the asset.
```

**Email to Seller**:
```
Subject: Buyer has funded the escrow

The buyer has deposited funds into escrow!

Transaction: Used Tesla Model S Purchase
Amount: $2,800 USD
Status: Awaiting buyer verification

The buyer will now inspect the asset. Once they verify,
funds will be released to your wallet automatically.

[View Escrow Details]
```

---

### Step 4: Buyer Inspects Asset (CRUCIAL STEP)
**Physical Action**: Buyer goes to see the car, test drives, inspects condition

**This happens OFF-CHAIN**:
- Buyer and seller meet
- Buyer inspects the Tesla
- Buyer test drives the car
- Buyer checks VIN, paperwork, condition

---

### Step 5: Buyer Verifies & Releases Funds (CRITICAL)
**Page**: `/escrow/:id`

**UI for Buyer**:
```
┌─────────────────────────────────────────────────────┐
│  ⚠️  CRITICAL ACTION REQUIRED                        │
│                                                      │
│  Have you inspected the asset and confirmed it      │
│  matches the description?                            │
│                                                      │
│  Used Tesla Model S Purchase                         │
│  Amount: $2,800 USD                                  │
│                                                      │
│  ⚠️  WARNING:                                        │
│  Once you click "Verify & Release Funds", the       │
│  $2,800 will be immediately and irreversibly        │
│  transferred to the seller's wallet.                │
│                                                      │
│  Only verify if you have:                           │
│  ✅ Inspected the car in person                     │
│  ✅ Confirmed condition matches description         │
│  ✅ Checked VIN and paperwork                       │
│  ✅ Are satisfied with the purchase                 │
│                                                      │
│  [ ] I have inspected the asset and confirm         │
│      everything is as described                     │
│                                                      │
│  [Cancel] [Verify & Release Funds →]                │
└─────────────────────────────────────────────────────┘
```

**Buyer Actions**:
1. Checks confirmation checkbox
2. Clicks **"Verify & Release Funds"**
3. Signs transaction in wallet

**Smart Contract Execution**:
```solidity
function buyerVerifyAndRelease(uint256 _escrowId) external {
  require(msg.sender == buyer);
  require(status == ACTIVE);

  // Release funds
  payable(seller).transfer(escrowAmount); // $2,800 to seller
  totalFeesCollected += platformFee;       // $56 to platform
  totalFeesCollected += cancellationFee;   // $99 to platform (unused)

  status = RELEASED;
}
```

**System Actions**:
- Status: `RELEASED`
- Sends emails to both parties

**Email to Buyer**:
```
Subject: ✅ Funds released - Transaction complete

You have successfully verified and released funds!

Transaction: Used Tesla Model S Purchase
Amount released: $2,800 USD
Recipient: [seller wallet]

Your escrow transaction is now complete.

[View Transaction Receipt]

Thank you for using PrivateCharterX Escrow!
```

**Email to Seller**:
```
Subject: 🎉 Payment received - $2,800 USD

Congratulations! The buyer has verified and released funds.

Transaction: Used Tesla Model S Purchase
Amount received: $2,800 USD
To wallet: 0xYourWallet...

The funds are now in your wallet. Transaction complete!

[View Transaction Receipt]

Thank you for using PrivateCharterX Escrow!
```

---

## Cancellation Scenarios (UPDATED)

### Scenario A: Buyer Cancels BEFORE Funding
**When**: Before Step 3 (before depositing money)
**Fee**: **$0** (FREE)

**Process**:
1. Buyer clicks "Cancel Request"
2. Email sent to seller: "Buyer cancelled the escrow request"
3. Status: `CANCELLED_BY_BUYER`

**Result**:
- Buyer pays: $0
- Seller gets: $0
- Platform gets: $0

---

### Scenario B: Buyer Cancels AFTER Funding
**When**: After Step 3, before Step 5 (money deposited, but not verified)
**Fee**: **$99 USD**

**Process**:
1. Buyer clicks "Cancel Escrow"
2. Warning shown:
   ```
   ⚠️ Cancellation Fee Applies

   You deposited: $2,955
   Cancellation fee: $99
   Refund amount: $2,856

   Are you sure you want to cancel?
   [No, Keep Active] [Yes, Cancel & Refund]
   ```
3. Buyer confirms cancellation
4. Smart contract executes:
   ```solidity
   function buyerCancelWithFee(uint256 _escrowId) external {
     require(msg.sender == buyer);
     require(status == ACTIVE && !verified);

     // Refund = deposit - cancellation fee
     uint256 refund = totalDeposit - cancellationFee;
     payable(buyer).transfer(refund); // $2,856 refund

     totalFeesCollected += cancellationFee; // $99 to platform
     status = REFUNDED;
   }
   ```

**Result**:
- Buyer gets: **$2,856** (refund minus $99 fee)
- Seller gets: **$0**
- Platform gets: **$99** (cancellation fee)

**Email to Buyer**:
```
Subject: Escrow cancelled - Refund processed

Your escrow has been cancelled.

Original deposit: $2,955
Cancellation fee: -$99
Refund amount: $2,856

The refund has been sent to your wallet.
```

**Email to Seller**:
```
Subject: Buyer cancelled the escrow

The buyer has cancelled the escrow transaction.

Transaction: Used Tesla Model S Purchase
Status: Cancelled

No action required on your part.
```

---

### Scenario C: Seller Cancels
**When**: Any time before buyer verification
**Fee**: **$0** (seller doesn't pay, buyer gets full refund)

**Process**:
1. Seller clicks "Cancel & Refund Buyer"
2. Smart contract:
   ```solidity
   function sellerRefund(uint256 _escrowId) external {
     require(msg.sender == seller);

     // Full refund to buyer (including cancellation insurance)
     payable(buyer).transfer(totalDeposit); // $2,955 full refund

     status = REFUNDED;
   }
   ```

**Result**:
- Buyer gets: **$2,955** (FULL refund including cancellation insurance)
- Seller gets: **$0**
- Platform gets: **$0**

**Emails**: Same as before, buyer notified of full refund.

---

### Scenario D: Buyer Tries to Cancel AFTER Verification
**When**: After clicking "Verify & Release Funds"
**Result**: **NOT ALLOWED** ⛔

**UI**:
```
❌ Cannot Cancel

Funds have been released to the seller.
This transaction is complete and cannot be cancelled.

If you have an issue, please contact support.
```

---

## Updated Smart Contract Requirements

### New Function: `buyerVerifyAndRelease()`
```solidity
/**
 * @notice Buyer verifies asset and releases funds to seller
 * @dev This is the CRUCIAL step - only after buyer inspection
 * @param _escrowId Escrow ID
 */
function buyerVerifyAndRelease(uint256 _escrowId)
    external
    escrowExists(_escrowId)
    whenNotPaused
    nonReentrant
{
    CustomEscrow storage escrow = escrows[_escrowId];
    require(escrow.status == EscrowStatus.Active, "Escrow not active");
    require(msg.sender == escrow.buyer, "Only buyer can verify");
    require(!escrow.verified, "Already verified");

    // Mark as verified
    escrow.verified = true;
    escrow.status = EscrowStatus.Released;
    escrow.releasedAt = block.timestamp;

    // Release to seller
    uint256 sellerAmount = escrow.amount;
    uint256 totalFees = escrow.platformFee + escrow.cancellationFee;

    totalFeesCollected += totalFees;

    (bool success, ) = payable(escrow.seller).call{value: sellerAmount}("");
    require(success, "Transfer to seller failed");

    emit BuyerVerified(_escrowId, msg.sender, block.timestamp);
    emit EscrowReleased(_escrowId, escrow.seller, sellerAmount, totalFees);
}
```

### Updated Function: `buyerCancelWithFee()`
```solidity
/**
 * @notice Buyer cancels with $99 fee (only before verification)
 */
function buyerCancelWithFee(uint256 _escrowId)
    external
    escrowExists(_escrowId)
    whenNotPaused
    nonReentrant
{
    CustomEscrow storage escrow = escrows[_escrowId];
    require(escrow.status == EscrowStatus.Active, "Escrow not active");
    require(msg.sender == escrow.buyer, "Only buyer can cancel");
    require(!escrow.verified, "Cannot cancel after verification");

    // Refund = total - cancellation fee
    uint256 refundAmount = escrow.totalDeposit - escrow.cancellationFee;
    address buyer = escrow.buyer;

    // Update state
    escrow.status = EscrowStatus.Refunded;
    escrow.releasedAt = block.timestamp;

    // Collect cancellation fee
    totalFeesCollected += escrow.cancellationFee;

    // Refund to buyer
    (bool success, ) = payable(buyer).call{value: refundAmount}("");
    require(success, "Refund failed");

    emit BuyerCancelled(_escrowId, buyer, refundAmount, escrow.cancellationFee);
}
```

---

## Summary Table

| Scenario | When | Buyer Gets | Seller Gets | Platform Gets | Reversible? |
|----------|------|------------|-------------|---------------|-------------|
| **Cancel Before Funding** | Before Step 3 | $0 | $0 | $0 | N/A |
| **Cancel After Funding** | After Step 3, Before Step 5 | $2,856 | $0 | $99 | ✅ Yes |
| **Seller Cancels** | Before Step 5 | $2,955 (full) | $0 | $0 | N/A |
| **Buyer Verifies** | Step 5 | $0 | $2,800 | $155 | ❌ No |
| **After Verification** | After Step 5 | Cannot cancel | $2,800 | $155 | ❌ No |

---

## Email Notification Triggers

| Event | Recipient | Subject |
|-------|-----------|---------|
| Escrow Created | Seller | "You've been invited to an escrow transaction" |
| Seller Accepts | Buyer | "Seller accepted - Fund now" |
| Buyer Funds | Both | "Escrow funded" / "Buyer funded escrow" |
| Buyer Verifies | Both | "Funds released" / "Payment received" |
| Buyer Cancels (with fee) | Both | "Escrow cancelled" / "Buyer cancelled" |
| Seller Cancels | Both | "Full refund processed" / "You cancelled" |

---

## Critical UI Requirements

### 1. Verification Page (`/escrow/:id`)
Must show:
- ⚠️ **BIG WARNING** that funds will be released immediately
- Checkbox: "I have inspected the asset"
- Clear explanation of what verification means
- Prominent "Verify & Release Funds" button

### 2. Cancellation Confirmation
Must show:
- Cancellation fee amount ($99)
- Refund calculation
- Two-step confirmation
- Warning about irreversibility

### 3. Status Indicators
- `PENDING_SELLER_ACCEPTANCE`: "Waiting for seller"
- `PENDING_BUYER_FUNDING`: "Ready to fund"
- `ACTIVE_AWAITING_VERIFICATION`: "Awaiting your verification"
- `RELEASED`: "Funds released"
- `REFUNDED`: "Refunded"

---

## Next Steps

1. **Update Smart Contract** - Add `buyerVerifyAndRelease()` and `buyerCancelWithFee()`
2. **Add $99 to deposit calculation** in CreateEscrow page
3. **Create Verification UI** on EscrowDetail page
4. **Implement email service** with all notification triggers
5. **Update database schema** to track verification status
6. **Test complete workflow** end-to-end

This workflow ensures buyer protection while preventing abuse with the cancellation fee! 🚀
