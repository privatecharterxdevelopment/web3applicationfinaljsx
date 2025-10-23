# 🚀 STO Marketplace - 5 Minute Quick Start

## You're Almost Done! Just Deploy the Database

---

## ✅ What's Already Complete

- Marketplace UI (Marketplace.jsx)
- Asset Detail Modal with investment calculator
- Smart contract service (mock, swappable tomorrow)
- Database schema (SQL file ready)
- KYC enforcement via RLS policies
- Header buttons configured
- Complete documentation

**All code is written. You just need to run 1 SQL file!**

---

## Step 1: Deploy Database (2 minutes)

### 1. Open Supabase
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **+ New query**

### 2. Copy & Paste SQL
1. Open `/database/create_sto_tables_FIXED.sql` in VSCode
2. Press `Cmd+A` (select all) → `Cmd+C` (copy)
3. Back to Supabase SQL Editor
4. Press `Cmd+V` (paste)
5. Click **RUN** button (bottom right)

### 3. Expected Result
```
✅ STO Marketplace tables created successfully!
✅ KYC enforcement enabled via RLS policies
✅ Helper functions created
```

**If you see this ✅ You're done with database!**

---

## Step 2: Verify (30 seconds)

In Supabase SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'sto_%'
ORDER BY table_name;
```

Should return 3 tables:
- `sto_investments` ✅
- `sto_listings` ✅
- `sto_trades` ✅

---

## Step 3: Create Test Asset (1 minute)

### Get Your User ID
```sql
SELECT id, email FROM auth.users WHERE email = 'YOUR-EMAIL@EXAMPLE.COM';
```
Copy the `id` (looks like: `123e4567-e89b-12d3-a456-426614174000`)

### Insert Luxury Jet
```sql
INSERT INTO user_requests (
  user_id,
  type,
  status,
  estimated_cost,
  data
) VALUES (
  'PASTE-YOUR-USER-ID-HERE',
  'tokenization',
  'approved_for_sto',
  2500000.00,
  jsonb_build_object(
    'asset_name', 'Gulfstream G650ER',
    'category', 'jet',
    'min_investment', 1000,
    'total_supply', 100,
    'price_per_token', 25000,
    'launch_date', NOW(),
    'description', 'Ultra-long-range luxury business jet. Fractional ownership opportunity.',
    'specifications', jsonb_build_object(
      'manufacturer', 'Gulfstream',
      'model', 'G650ER',
      'year', 2023,
      'range', '7500 nautical miles',
      'passengers', 19
    ),
    'images', jsonb_build_array(
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800'
    )
  )
);
```

---

## Step 4: Set Yourself KYC Verified (30 seconds)

```sql
UPDATE user_profiles
SET kyc_status = 'verified'
WHERE user_id = 'YOUR-USER-ID-HERE';
```

---

## Step 5: Test in Browser! (1 minute)

### Start Dev Server
```bash
npm run dev
```

### Test Flow
1. Open browser: http://localhost:5173
2. Log in with your account
3. **Switch to Web3.0 mode** (toggle top right)
4. **Click "STO / UTL" button** (header, right side)
5. **Should see**: Marketplace page with your Gulfstream jet!
6. **Click "View Details"** on the jet
7. **Enter $1000** in investment amount
   - Should show: 0.04 shares, 0.04% ownership
8. **Connect wallet** (if not connected)
9. **Click "Purchase Shares"**
   - Processing... (2 seconds mock delay)
   - Success! Transaction hash displayed
10. **Verify in Database**:
```sql
SELECT * FROM sto_investments
WHERE user_id = 'YOUR-USER-ID'
ORDER BY created_at DESC LIMIT 1;
```

**If you see the investment record ✅ SUCCESS!**

---

## Troubleshooting

### "Coins is not defined"
Already fixed! In tokenized-assets-glassmorphic.jsx line 8

### "user_role does not exist"
Use `create_sto_tables_FIXED.sql` (not the original)

### Marketplace page blank
Check if test asset created:
```sql
SELECT id, data->>'asset_name', status
FROM user_requests
WHERE type='tokenization';
```

### Can't purchase - "KYC required"
Check KYC status:
```sql
SELECT kyc_status FROM user_profiles
WHERE user_id = 'YOUR-USER-ID';
```
Should be `'verified'`

---

## What's Next?

### Tomorrow: Real Smart Contracts
When you get contract addresses:
1. Open `/src/services/stoContractService.ts`
2. Line 14: Update `STO_CONTRACT_ADDRESS`
3. Line 15: Add real ABI
4. Comment out lines 23-90 (mock)
5. Uncomment lines 93-280 (real)

### This Week: Admin UI
Build admin panel to approve tokenization requests (currently SQL only)

### Later: Phase 2
- P2P trading marketplace
- Portfolio/investments page
- KYC API integration
- Email notifications

---

## Documentation

Full docs in:
- `/database/STO_DEPLOYMENT_GUIDE.md` - Detailed deployment steps
- `/MARKETPLACE_TESTING_CHECKLIST.md` - 100+ test cases
- `/DEPLOYMENT_READY_SUMMARY.md` - Complete overview
- `/docs/MARKETPLACE_IMPLEMENTATION_SUMMARY.md` - Technical docs

---

## Summary

**Time**: 5 minutes
**Steps**: Run 1 SQL file → Create test asset → Test in browser
**Result**: Working STO marketplace with fractional ownership

**Start with Step 1 now! ⬆️**
