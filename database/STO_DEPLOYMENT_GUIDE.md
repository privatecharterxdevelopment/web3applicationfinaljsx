# STO Marketplace Database Deployment Guide

## Step 1: Deploy the Fixed SQL Schema

### Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New query"

### Run the Migration
1. Open `/database/create_sto_tables_FIXED.sql`
2. Copy the **entire contents** (all 263 lines)
3. Paste into Supabase SQL Editor
4. Click **RUN**

### Expected Result
You should see output like:
```
✅ STO Marketplace tables created successfully!
✅ KYC enforcement enabled via RLS policies
✅ Helper functions created

Next steps:
1. Verify tables: SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'sto_%';
2. Test KYC function: SELECT is_user_kyc_verified('your-user-id');
3. Check marketplace in Web3.0 mode
```

---

## Step 2: Verify Tables Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name,
       pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::text)) AS size
FROM information_schema.tables
WHERE table_name LIKE 'sto_%'
  AND table_schema = 'public'
ORDER BY table_name;
```

### Expected Output:
```
table_name         | size
-------------------+-------
sto_investments    | 8192 bytes
sto_listings       | 8192 bytes
sto_trades         | 8192 bytes
```

---

## Step 3: Verify RLS Policies

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('sto_investments', 'sto_listings', 'sto_trades')
ORDER BY tablename, policyname;
```

### Expected Policies:
- **sto_investments**:
  - "Users can view their own investments" (SELECT)
  - "Verified users can create investments" (INSERT) ✅ KYC check

- **sto_listings**:
  - "Anyone can view active listings" (SELECT)
  - "Verified users can create listings" (INSERT) ✅ KYC check
  - "Users can update their own listings" (UPDATE)

- **sto_trades**:
  - "Users can view their trades" (SELECT)
  - "System can create trades" (INSERT)

---

## Step 4: Verify Helper Functions

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'get_user_share_balance',
  'get_asset_sold_shares',
  'is_user_kyc_verified',
  'update_sto_investment_timestamp'
)
ORDER BY routine_name;
```

### Expected Functions:
- `get_user_share_balance` (function)
- `get_asset_sold_shares` (function)
- `is_user_kyc_verified` (function)
- `update_sto_investment_timestamp` (function)

---

## Step 5: Verify user_requests Status Values

```sql
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'user_requests'
  AND con.conname = 'user_requests_status_check';
```

Should show status constraint includes:
- `approved_for_sto`
- `live_on_marketplace`
- `fully_funded`
- `closed`

---

## Step 6: Test KYC Function (Optional)

Get your user ID first:
```sql
SELECT id, email FROM auth.users LIMIT 1;
```

Then test the KYC function:
```sql
SELECT is_user_kyc_verified('YOUR-USER-ID-HERE');
```

Returns:
- `true` if kyc_status = 'verified'
- `false` otherwise

---

## Step 7: Insert Test Data (Optional)

### Create a test tokenization asset:
```sql
-- First, get your user_id
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Insert test asset
INSERT INTO user_requests (
  user_id,
  type,
  status,
  estimated_cost,
  data
) VALUES (
  'YOUR-USER-ID-HERE',
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
    'description', 'Luxury private jet fractional ownership',
    'specifications', jsonb_build_object(
      'manufacturer', 'Gulfstream',
      'model', 'G650ER',
      'year', 2023,
      'range', '7500 nm',
      'passengers', 19
    ),
    'images', jsonb_build_array(
      'https://example.com/jet1.jpg'
    )
  )
);
```

---

## Step 8: Check Marketplace in UI

1. Start your dev server: `npm run dev`
2. Navigate to Web3.0 mode
3. Click "STO / UTL" button in header
4. You should see the marketplace page with:
   - KYC/AML mandatory banner
   - Category filters
   - Asset cards (if you inserted test data)
   - Click any asset to open investment modal

---

## Common Issues

### Issue: "column user_role does not exist"
**Solution**: You're running the OLD SQL file. Use `create_sto_tables_FIXED.sql` instead.

### Issue: "relation auth.users does not exist"
**Solution**: Your auth schema might be different. Check if users table is in `public` schema:
```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'users';
```

If in public schema, change all `auth.users` to `public.users` in the SQL file.

### Issue: "permission denied for schema public"
**Solution**: Run as database owner or grant permissions:
```sql
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### Issue: No assets showing in marketplace
**Possible causes**:
1. No assets with status `approved_for_sto` or `live_on_marketplace`
2. User not logged in (some queries require auth)
3. Check browser console for errors

**Debug query**:
```sql
SELECT id, data->>'asset_name' as name, status, type
FROM user_requests
WHERE type = 'tokenization'
ORDER BY created_at DESC;
```

---

## Next Steps After Successful Deployment

1. **Admin Approval Section**: Add UI to approve pending tokenization requests
2. **Test Investment Flow**: Try purchasing shares (will use mock contract for now)
3. **Tomorrow**: Swap mock smart contract with real STO contracts
4. **Phase 2**: Implement P2P trading (sto_listings table ready)

---

## Rollback (if needed)

If something goes wrong, you can rollback:

```sql
DROP TABLE IF EXISTS sto_trades CASCADE;
DROP TABLE IF EXISTS sto_listings CASCADE;
DROP TABLE IF EXISTS sto_investments CASCADE;

DROP FUNCTION IF EXISTS get_user_share_balance(UUID, UUID);
DROP FUNCTION IF EXISTS get_asset_sold_shares(UUID);
DROP FUNCTION IF EXISTS is_user_kyc_verified(UUID);
DROP FUNCTION IF EXISTS update_sto_investment_timestamp();

-- Restore old status constraint
ALTER TABLE user_requests DROP CONSTRAINT IF EXISTS user_requests_status_check;
ALTER TABLE user_requests ADD CONSTRAINT user_requests_status_check
CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'cancelled'));
```

Then fix the issue and re-run the FIXED SQL file.
