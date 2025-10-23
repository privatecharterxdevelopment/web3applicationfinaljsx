# Testing Checklist for Tokenization Timeline & Notifications

## ✅ Migration Status: COMPLETED

The database migration has been successfully applied. All new columns are now in the `tokenization_drafts` table.

---

## 📝 Features to Test

### 1. **Tokenization Form - Wallet Address Field**

**UTO (Utility Token):**
- [ ] Navigate to: Dashboard → Tokenize Asset → Select "Utility Token"
- [ ] Fill out Steps 1-2 (Token Type & Asset Info)
- [ ] On Step 3 (Token Configuration), verify you see:
  - ✅ "Issuer Wallet Address *" field
  - ✅ "(Use Connected Wallet)" button if wallet is connected
  - ✅ Field accepts 0x... format
  - ✅ Cannot proceed to next step without filling it
- [ ] Complete form and submit

**STO (Security Token):**
- [ ] Navigate to: Dashboard → Tokenize Asset → Select "Security Token"
- [ ] Fill out Steps 1-2 (Token Type & Asset Info)
- [ ] On Step 3 (Token Configuration), verify you see:
  - ✅ "Issuer Wallet Address *" field
  - ✅ "(Use Connected Wallet)" button if wallet is connected
  - ✅ Field accepts 0x... format
  - ✅ Cannot proceed to next step without filling it
- [ ] Complete form and submit

---

### 2. **Submission Notification**

After submitting tokenization:
- [ ] Check notifications (bell icon in header)
- [ ] Should see notification with:
  - ✅ Title: "UTO/STO Tokenization Request Submitted"
  - ✅ Message mentions: "Review within 24-48 hours"
  - ✅ Message mentions timeline: "14 days" (UTO) or "14-30 days" (STO)

---

### 3. **My Tokenized Assets Page**

- [ ] Navigate to: Dashboard → Tokenize Asset → My Tokenized Assets
- [ ] Should see your submitted tokenization with:
  - ✅ Asset name and logo
  - ✅ Status badge: "submitted" (yellow/orange)
  - ✅ Token symbol (e.g., $SYMBOL)
  - ✅ Supply and price info
  - ✅ Issuer wallet address (truncated: 0x1234...5678)
  - ✅ Submission date

---

### 4. **Admin Panel - Review Tokenization**

**Access Admin Panel:**
- [ ] Navigate to: `/admin` or Admin Dashboard
- [ ] Click on "Tokenizations" tab (Web3 & DeFi section)
- [ ] Should see submitted tokenizations with:
  - ✅ Asset card with logo
  - ✅ Status: "submitted"
  - ✅ All asset details visible
  - ✅ Issuer wallet address shown (truncated)
  - ✅ Two buttons: "Approve" (green) and "Reject" (red)

**Test Approval Flow:**
- [ ] Click "Approve" button
- [ ] Should see success alert: "Tokenization approved successfully!"
- [ ] Card should update to show:
  - ✅ Status badge: "approved" (green)
  - ✅ New "Timeline" section appears with:
    - Approved date (today)
    - Waitlist Opens (tomorrow, 24h from now - UTO only)
    - Launch Date (14 days from now for UTO, 14-21 days for STO)

**Test Rejection Flow:**
- [ ] Submit another tokenization
- [ ] Click "Reject" button
- [ ] Should see success alert: "Tokenization rejected successfully!"
- [ ] Status should change to "rejected" (red)

---

### 5. **Approval Notification (User Side)**

After admin approves:
- [ ] Check notifications as the user who submitted
- [ ] Should see notification with:
  - ✅ Title: "UTO/STO Request Approved"
  - ✅ Message mentions: "Great news! Your request has been approved"
  - ✅ For UTO: "Waitlist opens in 24 hours. Launch date: [DATE]"
  - ✅ For STO: "Estimated launch: 14-30 days"

---

### 6. **Rejection Notification (User Side)**

After admin rejects:
- [ ] Check notifications as the user who submitted
- [ ] Should see notification with:
  - ✅ Title: "UTO/STO Request Rejected"
  - ✅ Message: "Your tokenization request has been rejected"
  - ✅ Message mentions: "Contact support for more information"

---

### 7. **My Tokenized Assets - Timeline Display**

After approval, return to "My Tokenized Assets":
- [ ] Find the approved tokenization
- [ ] Should see new green timeline card with:
  - ✅ Clock icon + "Launch Timeline" header
  - ✅ Approved date
  - ✅ Waitlist Opens date (UTO only)
  - ✅ Launch Date (bold, emphasized)
  - ✅ Bottom text:
    - UTO: "🎯 14-day timeline to NFT marketplace"
    - STO: "⏱️ Estimated 14-30 days depending on partner approvals"

---

## 🎯 Timeline Validation

**For UTO (Utility Token):**
- [ ] Approval date = Today
- [ ] Waitlist opens = Tomorrow (24 hours from now)
- [ ] Launch date = Today + 14 days
- [ ] Goes to NFT Marketplace

**For STO (Security Token):**
- [ ] Approval date = Today
- [ ] No waitlist phase
- [ ] Launch date = Today + 21 days (default, can be 14-30)
- [ ] Individual timeline based on partner approvals

---

## 🐛 Known Issues to Watch For

- [ ] If "Issuer Wallet Address" field doesn't show → Clear cache, refresh page
- [ ] If notifications don't appear → Check Supabase RLS policies for notifications table
- [ ] If timeline shows wrong dates → Check timezone settings in browser/database
- [ ] If "Use Connected Wallet" button doesn't work → Ensure wallet is connected via WalletConnect

---

## 📊 Database Verification Queries

Run these in Supabase SQL Editor to verify data:

```sql
-- Check if submission created notification
SELECT * FROM notifications
WHERE type = 'tokenization_submitted'
ORDER BY created_at DESC
LIMIT 5;

-- Check if approval/rejection created notification
SELECT * FROM notifications
WHERE type IN ('tokenization_approved', 'tokenization_rejected')
ORDER BY created_at DESC
LIMIT 5;

-- Check timeline data in tokenization_drafts
SELECT
    id,
    asset_name,
    token_type,
    status,
    approved_at,
    waitlist_opens_at,
    marketplace_launch_at,
    estimated_launch_days
FROM tokenization_drafts
WHERE status = 'approved'
ORDER BY approved_at DESC;

-- Check issuer wallet addresses
SELECT
    asset_name,
    issuer_wallet_address,
    token_type
FROM tokenization_drafts
WHERE issuer_wallet_address IS NOT NULL;
```

---

## ✅ Success Criteria

All features are working correctly if:
1. ✅ Wallet address field is required and saves correctly
2. ✅ Submission notification sent immediately
3. ✅ Admin can approve/reject with proper buttons
4. ✅ Approval triggers timeline calculation (correct dates)
5. ✅ Approval/rejection notification sent to user
6. ✅ Timeline displays in both admin panel and user dashboard
7. ✅ UTO has 24h waitlist, STO does not
8. ✅ UTO = 14 days, STO = 14-30 days

---

## 📞 Support

If anything doesn't work as expected:
1. Check browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify RLS policies allow reads/writes
4. Check that user_id matches between tables

**Everything should be working now!** 🎉
