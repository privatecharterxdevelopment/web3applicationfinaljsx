# 🚀 Quick Deploy - Demo Asset

## Step 1: Deploy Waitlist Table (30 seconds)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy **entire contents** of `/database/create_waitlist_table.sql`
3. Paste and click **RUN**

Expected: ✅ Table `asset_waitlist` created

---

## Step 2: Get Your User ID (10 seconds)

In Supabase SQL Editor, run:

```sql
SELECT id, email FROM auth.users WHERE email = 'YOUR-EMAIL@EXAMPLE.COM';
```

Copy the `id` (looks like: `123e4567-e89b-12d3-a456-426614174000`)

---

## Step 3: Create Demo Asset (1 minute)

1. Open `/database/create_demo_asset.sql`
2. Find line 19: `user_id` field
3. Replace `'YOUR-USER-ID-HERE'` with your actual user_id from Step 2
4. Copy **entire SQL** (all 300+ lines)
5. Paste in Supabase SQL Editor
6. Click **RUN**

Expected: ✅ Returns an asset ID

---

## Step 4: Verify (10 seconds)

```sql
SELECT
  id,
  data->>'asset_name' as name,
  status,
  estimated_cost
FROM user_requests
WHERE type = 'tokenization'
ORDER BY created_at DESC
LIMIT 1;
```

Should see: Gulfstream G650ER with status 'coming_soon'

---

## Step 5: Test in Browser! 🎉

```bash
npm run dev
```

1. Open browser: http://localhost:5177
2. **Switch to Web3.0 mode**
3. Click **"Tokenized Assets"** (sidebar or top tabs)
4. **You should see**: Gulfstream G650ER card!
5. **Click the card**
6. **Detail page opens** with all specs, images, etc.
7. **Click "Join Waitlist"**
8. Fill form → Submit
9. Check database:

```sql
SELECT * FROM asset_waitlist ORDER BY created_at DESC LIMIT 1;
```

**DONE!** ✅

---

## Troubleshooting

### Issue: No asset showing
**Check status**:
```sql
UPDATE user_requests
SET status = 'coming_soon'
WHERE data->>'asset_name' = 'Gulfstream G650ER';
```

### Issue: Images not loading
Images use Unsplash - should work. If not, replace URLs in SQL with your own.

### Issue: "user_id does not exist"
Make sure you replaced `YOUR-USER-ID-HERE` with actual UUID from Step 2.

---

## Change Asset Status

```sql
-- Open waitlist
UPDATE user_requests
SET status = 'waitlist_open'
WHERE data->>'asset_name' = 'Gulfstream G650ER';

-- Make live for investment
UPDATE user_requests
SET status = 'live_on_marketplace'
WHERE data->>'asset_name' = 'Gulfstream G650ER';
```

Button changes automatically based on status! 🎯
