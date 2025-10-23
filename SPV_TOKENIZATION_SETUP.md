# SPV Formation & Tokenization - Database Setup

## ⚠️ IMPORTANT: You MUST run this SQL migration!

Your forms are ready, but the database needs to be updated to accept the new request types.

## Quick Setup (2 minutes)

### Step 1: Run SQL Migration
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste this file: `database/add_spv_tokenization_types.sql`
4. Click **RUN**

### Step 2: Test It
1. Go to SPV Formation page
2. Fill out form and submit
3. Check your Profile page - should see it!

---

## What This Does

Your `user_requests` table currently has a constraint that ONLY allows these types:
```
✅ flight_quote
✅ support
✅ document
✅ private_jet_charter
✅ empty_leg
✅ helicopter_charter
✅ luxury_car_rental
✅ nft_discount_empty_leg
✅ nft_free_flight
```

The migration adds:
```
➕ spv_formation
➕ tokenization
```

Plus optional helper columns:
```
➕ service_type - "Cayman Islands SPV Formation"
➕ details - "My Company Ltd - Private Jet Management"
➕ estimated_cost - 8300.00
➕ client_name - (if not exists)
➕ client_email - (if not exists)
```

---

## What Happens If You Don't Run It?

❌ **Form submission will FAIL with error:**
```
new row for relation "user_requests" violates check constraint "valid_type"
```

The forms will show an error and data won't be saved.

---

## How to Verify It Worked

Run this in Supabase SQL Editor:
```sql
-- Check the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'user_requests'::regclass
AND conname = 'valid_type';
```

You should see `spv_formation` and `tokenization` in the constraint definition.

Or just submit a test SPV formation and check if it appears in your profile!

---

## Files Modified

### Backend (Database)
- ✅ `database/add_spv_tokenization_types.sql` - SQL migration to run

### Frontend (Already Done)
- ✅ `src/components/SPVFormation/SPVFormationFlow_NEW.jsx` - Saves to database
- ✅ `src/components/Landingpagenew/TokenizeAssetFlow_NEW.jsx` - Saves to database
- ✅ `src/components/Landingpagenew/ProfileOverview.jsx` - Shows the data
- ✅ `src/services/requests.ts` - TypeScript types updated

---

## Data Structure

### SPV Formation Request
```json
{
  "user_id": "uuid",
  "type": "spv_formation",
  "status": "pending",
  "service_type": "Cayman Islands SPV Formation",
  "details": "My Company Ltd - Private Jet Management",
  "estimated_cost": 8300.00,
  "data": {
    "tier": "standard",
    "jurisdiction": "Cayman Islands",
    "company_name": "My Company Ltd",
    "business_activity": "Private Jet Management",
    "planning_to_tokenize": true,
    "asset_type": "jet",
    "contact_email": "user@example.com",
    "contact_phone": "+1234567890"
  }
}
```

### Tokenization Request
```json
{
  "user_id": "uuid",
  "type": "tokenization",
  "status": "pending",
  "service_type": "Private Jet Tokenization",
  "details": "Gulfstream G650 - security token",
  "estimated_cost": 5000000.00,
  "data": {
    "asset_type": "jet",
    "token_type": "security",
    "asset_name": "Gulfstream G650",
    "asset_value": 5000000,
    "token_symbol": "G650",
    "total_supply": 1000,
    "expected_apy": 8.5
  }
}
```

---

## Support

If you encounter issues:
1. Check Supabase logs for constraint errors
2. Verify the migration ran successfully
3. Check browser console for JavaScript errors
4. Make sure user is logged in before submitting

---

**Status**: ⚠️ Requires database migration to work
**Time to setup**: 2 minutes
**Risk**: Zero - just adds new types to existing constraint
