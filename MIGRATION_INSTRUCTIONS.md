# Database Migration Instructions

## New Migration: Tokenization Timeline & Wallet Fields

**File:** `supabase/migrations/20251020000000_add_issuer_wallet_and_timeline_fields.sql`

This migration adds the following columns to the `tokenization_drafts` table:

### New Columns:
1. **issuer_wallet_address** (TEXT) - Wallet address where NFTs/tokens will be minted from
2. **approved_at** (TIMESTAMPTZ) - When admin approved the tokenization
3. **waitlist_opens_at** (TIMESTAMPTZ) - When waitlist phase opens (24h after approval for UTOs)
4. **marketplace_launch_at** (TIMESTAMPTZ) - When asset launches on marketplace
5. **estimated_launch_days** (INTEGER) - Estimated days from approval to launch (14 for UTO, 14-30 for STO)

---

## How to Apply This Migration

### Option 1: Using Supabase CLI (Recommended)

If you have Supabase CLI installed and linked to your project:

```bash
# Navigate to project directory
cd "/Users/x/Downloads/Tokenization-main 2"

# Apply migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/20251020000000_add_issuer_wallet_and_timeline_fields.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute

### Option 3: Direct SQL Execution

If you have direct database access:

```bash
# Using psql
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f supabase/migrations/20251020000000_add_issuer_wallet_and_timeline_fields.sql
```

---

## Verification

After running the migration, verify it worked:

```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tokenization_drafts'
AND column_name IN (
  'issuer_wallet_address',
  'approved_at',
  'waitlist_opens_at',
  'marketplace_launch_at',
  'estimated_launch_days'
);

-- Check indexes
SELECT indexname
FROM pg_indexes
WHERE tablename = 'tokenization_drafts'
AND indexname LIKE 'idx_tokenization_drafts%';
```

Expected output should show all 5 new columns and 3 new indexes.

---

## What This Enables

✅ **Wallet Address Requirement**: Users must provide wallet address for NFT minting
✅ **Automatic Timeline Calculation**: Admin approval triggers automatic date calculations
✅ **UTO Waitlist Phase**: 24-hour waitlist period before marketplace listing
✅ **Notifications**: Automatic notifications on submission and approval/rejection
✅ **Timeline Display**: Both admin and users see launch timelines

---

## Rollback (if needed)

If you need to undo this migration:

```sql
-- Remove columns
ALTER TABLE tokenization_drafts
DROP COLUMN IF EXISTS issuer_wallet_address,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS waitlist_opens_at,
DROP COLUMN IF EXISTS marketplace_launch_at,
DROP COLUMN IF EXISTS estimated_launch_days;

-- Remove indexes
DROP INDEX IF EXISTS idx_tokenization_drafts_issuer_wallet;
DROP INDEX IF EXISTS idx_tokenization_drafts_status_approved;
DROP INDEX IF EXISTS idx_tokenization_drafts_launch_date;
```

---

## Support

If you encounter any issues:
1. Check Supabase logs in your dashboard
2. Verify you have admin privileges on the database
3. Ensure the `tokenization_drafts` table exists before running migration
