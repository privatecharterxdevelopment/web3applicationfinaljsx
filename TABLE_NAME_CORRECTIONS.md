# Table Name Corrections - Migration Update

## Problem Identified

The RLS migration file (`20251020210000_fix_rls_policies.sql`) was using **incorrect table names** that don't match your actual database schema.

---

## Incorrect vs Correct Table Names

| ❌ Incorrect (Old) | ✅ Correct (Updated) | Status |
|-------------------|---------------------|---------|
| `adventures` | `fixed_offers` (with `is_empty_leg = false`) | ✅ Fixed |
| `helicopters` | `helicopters` | ✅ Correct (table created) |
| `co2_certificates` | `co2_certificates` | ✅ Correct (table created) |

---

## What Changed

### 1. Migration File Updated ✅

**File:** `supabase/migrations/20251020210000_fix_rls_policies.sql`

**Changes:**

#### Section 8 - BEFORE (❌ Wrong):
```sql
-- 8. FIX ADVENTURES TABLE
CREATE TABLE IF NOT EXISTS adventures (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  ...
);
```

#### Section 8 - AFTER (✅ Correct):
```sql
-- 8. FIX FIXED_OFFERS TABLE (NOT ADVENTURES)
-- Note: The 'adventures' table doesn't exist
-- The correct table is 'fixed_offers' (created in migration 20250227184607)

ALTER TABLE IF EXISTS fixed_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public to read fixed offers" ON fixed_offers;
DROP POLICY IF EXISTS "Allow authenticated users to manage fixed offers" ON fixed_offers;

CREATE POLICY "Allow public to read fixed offers"
  ON fixed_offers FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated users to manage fixed offers"
  ON fixed_offers FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage fixed offers"
  ON fixed_offers FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

**Why this change?**
- `adventures` table **doesn't exist** in your database
- `fixed_offers` table **already exists** (created in migration `20250227184607_stark_night.sql`)
- `fixed_offers` stores both:
  - **Fixed offer packages** (`is_empty_leg = false`)
  - **Empty leg flights** (`is_empty_leg = true`)

---

### 2. SearchIndexPage.jsx Updated ✅

**File:** `src/components/SearchIndexPage.jsx`

**Changes:**

#### BEFORE (❌ Wrong):
```javascript
// Search Adventures
try {
  const { data: advData } = await supabase
    .from('adventures')  // ❌ Table doesn't exist
    .select('*')
    .or(`title.ilike.%${keywords}%,description.ilike.%${keywords}%,location.ilike.%${keywords}%`)
    .limit(5);
  allResults.adventures = advData || [];
} catch (error) {
  console.error('Error searching adventures:', error);
}
```

#### AFTER (✅ Correct):
```javascript
// Search Fixed Offers (Adventures/Packages)
// Note: The 'adventures' table doesn't exist - we use 'fixed_offers' instead
// Filter by is_empty_leg = false to get only fixed offer packages
try {
  const { data: fixedOffersData } = await supabase
    .from('fixed_offers')  // ✅ Correct table
    .select('*')
    .eq('is_empty_leg', false)  // ✅ Only fixed offers, not empty legs
    .or(`title.ilike.%${keywords}%,description.ilike.%${keywords}%,origin.ilike.%${keywords}%,destination.ilike.%${keywords}%`)
    .limit(5);
  allResults.adventures = fixedOffersData || [];
} catch (error) {
  console.error('Error searching fixed offers:', error);
}
```

**Key improvements:**
- ✅ Uses correct table: `fixed_offers`
- ✅ Filters by `is_empty_leg = false` (only packages, not empty legs)
- ✅ Searches in correct fields: `origin`, `destination` (instead of `location`)
- ✅ Keeps backward compatibility: still returns as `allResults.adventures`

---

### 3. Additional Indexes Added ✅

**New indexes for better performance:**

```sql
CREATE INDEX IF NOT EXISTS idx_fixed_offers_origin ON fixed_offers(origin);
CREATE INDEX IF NOT EXISTS idx_fixed_offers_destination ON fixed_offers(destination);
CREATE INDEX IF NOT EXISTS idx_fixed_offers_is_empty_leg ON fixed_offers(is_empty_leg);
CREATE INDEX IF NOT EXISTS idx_helicopters_name ON helicopters(name);
CREATE INDEX IF NOT EXISTS idx_co2_certificates_name ON co2_certificates(name);
```

**Why these indexes?**
- `fixed_offers(origin, destination)` → Faster search by route
- `fixed_offers(is_empty_leg)` → Faster filtering of fixed offers vs empty legs
- `helicopters(name)` → Faster helicopter search
- `co2_certificates(name)` → Faster CO2 certificate search

---

## Database Schema Clarity

### Fixed Offers Table Structure

The `fixed_offers` table (created in migration `20250227184607_stark_night.sql`) has:

```sql
CREATE TABLE fixed_offers (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  origin TEXT NOT NULL,           -- Departure city (e.g., "London (LTN)")
  destination TEXT NOT NULL,       -- Arrival city (e.g., "Paris (LBG)")
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT '€',
  departure_date DATE NOT NULL,
  return_date DATE,                -- NULL for one-way (empty legs)
  image_url TEXT,
  aircraft_type TEXT NOT NULL,
  passengers INTEGER NOT NULL,
  duration TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  is_empty_leg BOOLEAN DEFAULT false,  -- FALSE = fixed offer package
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Sample data:**
1. **Fixed Offer Package** (`is_empty_leg = false`):
   - "Luxury Weekend in Paris" - London to Paris, round-trip
   - "Swiss Alps Ski Adventure" - London to Sion, 7 days

2. **Empty Leg** (`is_empty_leg = true`):
   - "Empty Leg: Zurich to London" - One-way, discounted
   - "Empty Leg: Nice to Paris" - One-way, repositioning flight

---

## Why "Adventures" Doesn't Exist

You mentioned: *"adventures = fixed_offers"*

**This is correct!** Your codebase was designed to use `fixed_offers` for what are essentially "adventure packages" or "fixed price travel packages."

The migration I created earlier mistakenly assumed a separate `adventures` table existed, but it doesn't. The `fixed_offers` table serves this purpose.

---

## What About Helicopters & CO2 Certificates?

### Helicopters Table ✅
- **Status:** Created by migration (if not exists)
- **Used by:** Code queries `helicopters` table
- **Purpose:** Store helicopter charter listings

### CO2 Certificates Table ✅
- **Status:** Created by migration (if not exists)
- **Used by:** Code has `CO2CertificateDetail.jsx` component
- **Purpose:** Store carbon offset certificate products

Both of these tables were correctly included in the migration and will be created if they don't already exist.

---

## Summary of Fixes

| Component | Issue | Fix | Status |
|-----------|-------|-----|--------|
| Migration SQL | Referenced non-existent `adventures` table | Changed to `fixed_offers` with proper RLS | ✅ Fixed |
| SearchIndexPage.jsx | Queried non-existent `adventures` table | Changed to query `fixed_offers` with `is_empty_leg = false` | ✅ Fixed |
| Helicopters | Table might not exist | Migration creates it if not exists | ✅ Fixed |
| CO2 Certificates | Table might not exist | Migration creates it if not exists | ✅ Fixed |
| Indexes | Missing performance indexes | Added indexes for all searchable fields | ✅ Fixed |

---

## How to Run the Corrected Migration

**The migration is now ready to run!**

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/oubecmstqtzdnevyqavu/sql/new)
2. Copy the entire contents of `supabase/migrations/20251020210000_fix_rls_policies.sql`
3. Paste into the SQL Editor
4. Click "Run"
5. Verify success (should see green checkmarks)

**Expected results:**
- ✅ No more 404 errors for `helicopters` or `co2_certificates`
- ✅ Search for "adventure packages" will work (queries `fixed_offers`)
- ✅ All RLS policies correctly applied
- ✅ Performance indexes created
- ✅ Console errors resolved

---

## Testing After Migration

1. **Test helicopter search:**
   - Search for "helicopter" in the search bar
   - Should return results from `helicopters` table

2. **Test CO2 certificate search:**
   - Search for "carbon" or "CO2" in the search bar
   - Should return results from `co2_certificates` table

3. **Test fixed offers search:**
   - Search for "Paris" or "ski" in the search bar
   - Should return results from `fixed_offers` (with `is_empty_leg = false`)

4. **Check console:**
   - No more 404 errors for missing tables
   - No more 403/406 errors for RLS blocking

---

## Files Modified

1. ✅ `supabase/migrations/20251020210000_fix_rls_policies.sql`
   - Section 8: Changed from `adventures` to `fixed_offers`
   - Added indexes for `fixed_offers`, `helicopters`, `co2_certificates`
   - Updated summary section

2. ✅ `src/components/SearchIndexPage.jsx` (lines 112-125)
   - Changed query from `adventures` to `fixed_offers`
   - Added filter: `is_empty_leg = false`
   - Updated search fields to match `fixed_offers` schema

---

**Created:** 2025-01-20
**Status:** ✅ Ready to deploy
**Impact:** Fixes all table name mismatches and 404 errors
