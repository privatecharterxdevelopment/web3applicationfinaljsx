# STO Marketplace Testing Checklist

## Pre-Testing Setup

- [ ] Database migration successful (`create_sto_tables_FIXED.sql` executed)
- [ ] All 3 tables created: `sto_investments`, `sto_listings`, `sto_trades`
- [ ] Dev server running: `npm run dev`
- [ ] User account created and logged in
- [ ] At least one test asset inserted (status: `approved_for_sto`)

---

## 1. Navigation & UI

### Web3.0 Mode Access
- [ ] Switch to Web3.0 mode using toggle
- [ ] Header shows "Tokenize Asset" and "STO / UTL" buttons
- [ ] Click "STO / UTL" button
- [ ] Marketplace page loads without errors

### Visual Design
- [ ] Glassmorphic cards with backdrop blur
- [ ] Category filters visible: All, Jets, Yachts, Cars, Art, Helicopters
- [ ] KYC/AML banner displayed at top
- [ ] Asset cards show: image, name, total value, min investment, progress bar

---

## 2. KYC Status Banner

### Not Verified (kyc_status != 'verified')
- [ ] Banner shows: "⚠️ KYC/AML verification required to invest"
- [ ] Orange/yellow warning color
- [ ] "Complete KYC" button present

### Verified (kyc_status = 'verified')
- [ ] Banner shows: "✅ KYC Verified - Ready to invest"
- [ ] Green success color
- [ ] Checkmark icon displayed

### Update KYC Status (Test):
```sql
-- Make yourself verified
UPDATE user_profiles
SET kyc_status = 'verified'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

---

## 3. Asset Display

### Asset Cards
- [ ] Each card shows asset name
- [ ] Total value formatted as currency
- [ ] Minimum investment shown
- [ ] "X% Funded" progress bar
- [ ] Status badge (Live, Coming Soon, Fully Funded)
- [ ] Category tag (Jet, Yacht, etc.)
- [ ] "View Details" button

### Filtering
- [ ] Click "Jets" - only jets displayed
- [ ] Click "Yachts" - only yachts displayed
- [ ] Click "All" - all assets displayed
- [ ] Filter count updates in real-time

### Empty State
- [ ] Remove all assets or filter to empty category
- [ ] Shows "No assets available" message
- [ ] Friendly emoji displayed

---

## 4. Asset Detail Modal

### Opening Modal
- [ ] Click "View Details" on any asset
- [ ] Modal opens with glassmorphic overlay
- [ ] Close button (X) in top right
- [ ] Click outside modal closes it

### Asset Information Display
- [ ] Asset name and category shown
- [ ] Total value displayed
- [ ] Price per token calculated and shown
- [ ] Available shares count
- [ ] Funding progress bar
- [ ] Status badge
- [ ] Detailed description
- [ ] Specifications table (if available)
- [ ] Image gallery (if available)

---

## 5. Investment Calculator

### Input Validation
- [ ] Investment amount input accepts numbers
- [ ] Minimum investment enforced (default: $1,000)
- [ ] Cannot enter negative amounts
- [ ] Cannot enter more than available value

### Real-Time Calculations
- [ ] Enter $1,000 → Shows shares, ownership %, estimated value
- [ ] Enter $5,000 → Calculations update instantly
- [ ] Enter $10,000 → Calculations update instantly
- [ ] Ownership percentage shown (e.g., "0.04% of asset")
- [ ] Share count calculated correctly

### Expected Calculation:
```
If asset total value = $2,500,000
And total supply = 100 tokens
Then price per token = $25,000

Investment of $1,000:
- Shares: $1,000 / $25,000 = 0.04 shares
- Ownership: 0.04 / 100 = 0.0004 = 0.04%
```

---

## 6. Purchase Flow - Not Logged In

### Attempt Purchase Without Login
- [ ] Click "Purchase Shares" button
- [ ] Error message: "Please log in to invest"
- [ ] Button disabled or redirects to login
- [ ] No API call made

---

## 7. Purchase Flow - Not KYC Verified

### Attempt Purchase Without KYC
- [ ] Log in with unverified account
- [ ] Click "Purchase Shares"
- [ ] Error message: "KYC verification required"
- [ ] Button shows "Complete KYC First"
- [ ] No blockchain transaction attempted

---

## 8. Purchase Flow - No Wallet Connected

### Attempt Purchase Without Wallet
- [ ] Log in with verified account
- [ ] KYC status: verified
- [ ] Wallet NOT connected
- [ ] Click "Purchase Shares"
- [ ] Error: "Connect your wallet first"
- [ ] Prompts wallet connection

---

## 9. Successful Purchase Flow (MOCK)

### Prerequisites
- [x] User logged in
- [x] KYC verified (kyc_status = 'verified')
- [x] Wallet connected
- [x] Valid investment amount entered

### Purchase Steps
- [ ] Click "Purchase Shares" button
- [ ] Modal switches to "Processing..." state
- [ ] Loading spinner displayed
- [ ] Mock transaction simulates 2-second delay
- [ ] Success screen appears
- [ ] Shows: transaction hash, shares purchased, investment amount
- [ ] "View on BaseScan" link displayed (mock URL)
- [ ] "Close" button returns to marketplace

### Database Verification
```sql
-- Check investment was saved
SELECT
  i.id,
  u.email as investor,
  i.shares_purchased,
  i.investment_amount,
  i.status,
  i.transaction_hash,
  i.created_at
FROM sto_investments i
JOIN auth.users u ON u.id = i.user_id
ORDER BY i.created_at DESC
LIMIT 5;
```

Expected:
- New row in `sto_investments` table
- Status: 'confirmed'
- Transaction hash: starts with '0x' (mock)
- Wallet address saved
- Correct share count and amount

---

## 10. Transaction History

### View Past Investments (Future Feature)
Currently in transactionService.ts (for swaps only). STO investments stored in database but not yet shown in UI.

**TODO**: Add "My Investments" page showing:
```sql
SELECT
  ur.data->>'asset_name' as asset_name,
  i.shares_purchased,
  i.investment_amount,
  i.status,
  i.created_at,
  i.transaction_hash
FROM sto_investments i
JOIN user_requests ur ON ur.id = i.asset_id
WHERE i.user_id = auth.uid()
ORDER BY i.created_at DESC;
```

---

## 11. Error Handling

### Network Errors
- [ ] Disconnect internet
- [ ] Try to load marketplace
- [ ] Shows error message (not blank screen)
- [ ] Retry button available

### Insufficient Funds (Future - Real Contracts)
- [ ] When real contracts are connected
- [ ] Try to purchase with insufficient wallet balance
- [ ] Shows clear error: "Insufficient funds"
- [ ] Transaction not submitted

### Transaction Failure (Mock: 5% Fail Rate)
- [ ] Try multiple purchases
- [ ] ~5% should fail (mock logic)
- [ ] Shows error message
- [ ] No database record created
- [ ] User can retry

---

## 12. Smart Contract Mock Verification

### Check Console Logs
Open browser console, look for:
- [ ] `🔄 MOCK: Purchasing STO shares...` (on purchase)
- [ ] Mock transaction hash logged
- [ ] Success/failure status logged
- [ ] No real blockchain calls made (until tomorrow)

### Verify Mock Code Active
Check `/src/services/stoContractService.ts`:
- [ ] Lines 23-90 (mock implementation) are ACTIVE
- [ ] Lines 93-280 (real implementation) are COMMENTED OUT
- [ ] STO_CONTRACT_ADDRESS is mock address

---

## 13. RLS Security Test

### Try to Bypass via Direct API (Should FAIL)
```javascript
// Try in browser console (should be rejected by RLS)
const { data, error } = await supabase
  .from('sto_investments')
  .insert({
    user_id: 'DIFFERENT-USER-ID',  // Not your ID
    asset_id: 'some-asset-id',
    shares_purchased: 10,
    investment_amount: 10000,
    wallet_address: '0x123',
    status: 'confirmed'
  });

console.log(error); // Should show permission denied
```

Expected: **Permission denied** (RLS policy prevents inserting for other users)

### Test KYC Enforcement
```sql
-- Make user unverified
UPDATE user_profiles SET kyc_status = 'pending' WHERE user_id = auth.uid();

-- Try to insert investment (should fail)
INSERT INTO sto_investments (
  user_id, asset_id, shares_purchased, investment_amount, wallet_address
) VALUES (
  auth.uid(), 'some-asset-id', 1, 1000, '0x123'
);
-- Expected: ERROR - RLS policy check failed
```

---

## 14. Performance & Loading

### Page Load Speed
- [ ] Marketplace loads in < 2 seconds
- [ ] No flickering or layout shifts
- [ ] Images load progressively
- [ ] Smooth transitions

### API Queries
Check Network tab (DevTools):
- [ ] Only 1 query to `user_requests` on load
- [ ] 1 query to `user_profiles` for KYC status
- [ ] No repeated queries on re-render
- [ ] Queries complete in < 500ms

---

## 15. Responsive Design

### Desktop (1920x1080)
- [ ] Grid shows 3 columns
- [ ] All content visible without scroll
- [ ] Modal centered

### Tablet (768px)
- [ ] Grid shows 2 columns
- [ ] Touch-friendly button sizes
- [ ] Modal full-width with padding

### Mobile (375px)
- [ ] Grid shows 1 column
- [ ] Horizontal scroll disabled
- [ ] Modal full-screen
- [ ] Calculator inputs easy to tap

---

## 16. Accessibility

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter key activates buttons
- [ ] Esc key closes modal
- [ ] Focus visible on all elements

### Screen Reader
- [ ] Asset cards have descriptive labels
- [ ] Form inputs have labels
- [ ] Error messages announced
- [ ] Status changes announced

---

## 17. Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Common issues:
- Backdrop-filter not supported in old browsers (graceful fallback?)
- Number input formatting differences

---

## Tomorrow: Real Smart Contract Checklist

When you swap to real contracts:

- [ ] Get deployed contract address from team
- [ ] Update `STO_CONTRACT_ADDRESS` in stoContractService.ts (line 14)
- [ ] Add real contract ABI (line 15)
- [ ] Comment out mock implementation (lines 23-90)
- [ ] Uncomment real implementation (lines 93-280)
- [ ] Test on Base Sepolia testnet FIRST
- [ ] Verify transactions on BaseScan
- [ ] Check gas fees are reasonable
- [ ] Test failure cases (insufficient funds, etc.)
- [ ] Update transaction links to real BaseScan URLs
- [ ] Deploy to production on Base Mainnet

---

## Known Issues / Limitations (Current)

1. **Mock Transactions**: All purchases are simulated until tomorrow
2. **No Admin Panel**: Can't approve tokenization requests via UI yet (SQL only)
3. **No P2P Trading**: Secondary marketplace UI not built (tables ready)
4. **No Portfolio Page**: Can't view past investments in UI (database has data)
5. **No Notifications**: No email/push when purchase completes
6. **No Document Upload**: Asset documents not supported yet
7. **No Dividend Tracking**: Revenue sharing not implemented

---

## Test Completion Sign-Off

Once all checkboxes are complete:

**Database**: ✅ Deployed
**UI**: ✅ Rendering
**KYC**: ✅ Enforcing
**Mock Contracts**: ✅ Working
**RLS**: ✅ Secured
**Ready for**: Smart contract swap (tomorrow)

Tested by: _______________
Date: _______________
Environment: Development / Staging / Production
