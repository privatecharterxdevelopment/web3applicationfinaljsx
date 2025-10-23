# Profile Overview Setup Guide

## Current Status
✅ Profile Overview page created and integrated
✅ AuthContext import fixed
✅ Code using correct state variable names
⚠️ Missing database table: `spv_formations`

## Errors Fixed

### 1. ~~AuthContext Error~~ ✅ FIXED
**Error**: `useAuth must be used within an AuthProvider`
**Fix**: Changed import path from `'../../context/AuthContext'` to `'../../../thefinalwebapplicationpcx-main/src/context/AuthContext'`

### 2. ~~State Variable Error~~ ✅ FIXED
**Error**: `setSPVs is not defined`
**Fix**: Changed `setSPVs` to `setSpvs` (lowercase 'pv') to match the state variable declaration

### 3. Database Table Missing ⚠️ NEEDS SETUP
**Error**: `GET .../spv_formations 404 (Not Found)`
**Fix**: Run the SQL migration to create the table

## Required Database Setup

### Step 1: Run SQL Migration
Open your Supabase Dashboard SQL Editor and run:
```bash
database/SETUP_PROFILE_TABLES.sql
```

This will create all required tables:
- ✅ `user_profiles` - User profile information and KYC status
- ✅ `tokenization_drafts` - Asset tokenization applications
- ✅ `booking_requests` - Flight/charter booking requests
- ✅ `spv_formations` - SPV formation requests **← MISSING TABLE**

### Step 2: Verify Tables Exist
In Supabase Dashboard > Table Editor, check that these tables exist:
- [x] users
- [x] user_profiles
- [ ] tokenization_drafts (might exist from previous migration)
- [ ] booking_requests (might exist from previous migration)
- [ ] spv_formations **← CREATE THIS**

### Step 3: Test Profile Page
1. Click User icon in top right header
2. Profile Overview page should load without errors
3. Data sections will populate as you:
   - Make booking requests
   - Submit tokenization applications
   - Create SPV formations

## Database Tables Schema

### user_profiles
Stores extended user information:
- Personal details (bio, phone, address, city, country)
- KYC status (not_started, pending, verified, rejected)
- Wallet information
- Created/updated timestamps

### tokenization_drafts
Stores asset tokenization requests:
- Asset information (name, category, description, value)
- Token configuration (standard, supply, symbol, price)
- Revenue settings (APY, distribution, currency)
- SPV details if applicable
- Status tracking (draft, submitted, approved, rejected)

### booking_requests
Stores flight/charter bookings:
- Route information (origin, destination)
- Date information (departure, return)
- Passenger count
- Status (pending, confirmed, cancelled, completed)
- Estimated price and notes

### spv_formations
Stores SPV formation requests:
- Tier selection (premium, standard, budget, usa)
- Jurisdiction details with fees
- Company information
- Directors and shareholders count
- Cost calculations
- Status tracking (submitted → completed)

## Features After Setup

Once the database is set up, the Profile Overview will show:

### 📊 Stats Dashboard
- Total Investment (from tokenized assets)
- Active Assets count
- Total Returns (calculated from APY)
- Active SPVs count

### 👤 Personal Information
- Name, email, phone
- Location and join date
- Edit profile button

### 🛡️ KYC Status
- Verification status badge
- Start/view verification button
- Status color coding

### 📝 Recent Activity
- Booking requests with routes and dates
- Tokenization applications
- SPV formation requests
- All with status indicators

### 🪙 Tokenized Assets
- Asset name with emoji icons
- Token ownership info
- Current value and APY
- Status tracking

### 🏢 SPV Formations
- Company name and jurisdiction
- Formation status
- Business activities
- Total costs and value

## Troubleshooting

### Profile page shows empty sections
✅ **Normal** - Data appears as you use the platform
✅ Create some bookings or tokenization requests to see data

### "spv_formations 404" error persists
❌ **Action needed**: Run `database/SETUP_PROFILE_TABLES.sql` in Supabase

### KYC status not showing
✅ **Normal** - Defaults to "Not Started" until verification begins

### SPV section empty
✅ **Normal** - Will populate after running the migration and creating SPV requests

## Quick Test

To quickly test with sample data, run in Supabase SQL Editor:

```sql
-- Sample booking request
INSERT INTO public.booking_requests (user_id, request_type, origin, destination, passengers, status, estimated_price)
VALUES (auth.uid(), 'jet', 'Geneva', 'London', 4, 'confirmed', 45000);

-- Sample tokenization draft
INSERT INTO public.tokenization_drafts (user_id, token_type, asset_name, asset_category, asset_value, status, expected_apy)
VALUES (auth.uid(), 'security', 'Gulfstream G650', 'jet', 5000000, 'approved', 8.5);

-- Sample SPV formation
INSERT INTO public.spv_formations (
    user_id, tier, jurisdiction, company_name, business_activity,
    jurisdiction_formation_fee, jurisdiction_annual_fee,
    total_formation_cost, total_annual_cost, total_first_year_cost,
    contact_email, contact_phone, status
)
VALUES (
    auth.uid(), 'standard', 'Cayman Islands', 'Luxury Aviation SPV Ltd.', 'Private Jet Ownership',
    5500, 2800, 5500, 2800, 8300,
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    '+1234567890', 'completed'
);
```

## File Locations

- Profile Component: `src/components/Landingpagenew/ProfileOverview.jsx`
- SQL Migration: `database/SETUP_PROFILE_TABLES.sql`
- Main App Integration: `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx`

## Support

If you encounter issues:
1. Check Supabase logs for database errors
2. Verify RLS policies are enabled
3. Ensure user is authenticated
4. Check browser console for JavaScript errors

---

**Status**: Ready to deploy after running database migration ✅
