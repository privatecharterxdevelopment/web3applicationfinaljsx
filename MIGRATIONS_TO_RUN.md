# 🗄️ Database Migrations - Required Setup

## Overview

This document lists ALL database migrations you need to run to make the complete RWS request and notification system work.

---

## ✅ Migrations to Run (In Order)

### Migration 1: Add RWS Request Types
**File:** `supabase/migrations/20251029000000_add_rws_request_types.sql`

**What it does:**
- Removes old restrictive type constraint on `user_requests` table
- Adds ALL RWS service types:
  - `taxi_concierge`
  - `private_jet_charter`
  - `helicopter_charter`
  - `empty_leg`
  - `adventure_package`
  - `luxury_car_rental`
  - `fixed_offer`
  - `event_booking`
  - `co2_certificate`
  - `spv_formation`
  - `tokenization`
- Creates index on `type` column for better performance

**Why it's needed:**
Without this, the database will REJECT any request that's not in the old list (flight_quote, support, document, etc.)

**Status:** ✅ REQUIRED - Without this, Jets/Helis/EmptyLegs/Adventures bookings will fail

---

### Migration 2: User Request Notifications (Bell Notifications)
**File:** `supabase/migrations/20251029000001_user_requests_notifications.sql`

**What it does:**
- Creates database trigger `notify_user_request_placed()`
  - Fires when user submits ANY request
  - Creates bell notification for ALL admins
  - Creates confirmation bell notification for user

- Creates database trigger `notify_user_request_response()`
  - Fires when admin updates request status OR adds admin notes
  - Creates bell notification for user with update
  - Detects status changes (pending → in_progress → completed/cancelled)

**Why it's needed:**
Without this, users and admins won't get in-app bell notifications when requests are submitted or responded to.

**Status:** ✅ REQUIRED - Without this, bell notifications won't work

---

## 🔧 Additional Setup (Not SQL Migrations)

### Setup 1: Email Webhook Configuration
**Location:** Supabase Dashboard → Database → Webhooks

**What it does:**
- Calls Edge Function when row is inserted into `user_requests`
- Edge Function sends email to user (confirmation)
- Edge Function sends email to bookings@privatecharterx.com (admin notification)

**Why it's needed:**
Without this, EMAIL notifications won't be sent (bell notifications will still work)

**Status:** ✅ REQUIRED for emails - See `SETUP_EMAIL_WEBHOOKS.md` for instructions

**How to configure:**
```
Name: user-request-email-notifications
Table: user_requests
Events: Insert
Type: HTTP Request
Method: POST
URL: https://[YOUR-PROJECT-REF].supabase.co/functions/v1/user-request-notifications
Headers:
  Authorization: Bearer [YOUR-SERVICE-ROLE-KEY]
  Content-Type: application/json
```

---

## 📋 How to Run Migrations

### Option A: Supabase CLI (Recommended)
```bash
# Navigate to project directory
cd /Users/x/Downloads/finalweb3-main/web3applicationfinaljsx

# Run all pending migrations
supabase migration up

# Verify migrations were applied
supabase migration list
```

### Option B: Supabase Dashboard SQL Editor

**For Migration 1 (RWS Request Types):**
1. Open Supabase Dashboard → SQL Editor
2. Click "New query"
3. Copy entire contents of `supabase/migrations/20251029000000_add_rws_request_types.sql`
4. Paste into editor
5. Click "Run"
6. Verify: `Query executed successfully`

**For Migration 2 (Bell Notifications):**
1. Open Supabase Dashboard → SQL Editor
2. Click "New query"
3. Copy entire contents of `supabase/migrations/20251029000001_user_requests_notifications.sql`
4. Paste into editor
5. Click "Run"
6. Verify: `Query executed successfully`

---

## ✅ Verification Steps

### After Migration 1 (RWS Request Types):
```sql
-- Check constraint was updated
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'valid_type' AND conrelid = 'user_requests'::regclass;

-- Should return constraint with all RWS types listed
```

### After Migration 2 (Bell Notifications):
```sql
-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
  'user_request_placed_notification',
  'user_request_response_notification'
);

-- Should return 2 rows
```

### After Email Webhook Setup:
1. Submit a test request (book any service)
2. Go to Supabase Dashboard → Database → Webhooks
3. Click on your webhook
4. Check "Recent webhook calls" → Should see HTTP 200
5. Go to Edge Functions → user-request-notifications → Logs
6. Should see: "Processing user request notification"
7. Check email inboxes (user + bookings@privatecharterx.com)

---

## 🎯 Complete Setup Checklist

### Database Migrations:
- [ ] Migration 1: `20251029000000_add_rws_request_types.sql` applied
- [ ] Migration 2: `20251029000001_user_requests_notifications.sql` applied
- [ ] Verified constraints updated (SQL query above)
- [ ] Verified triggers created (SQL query above)

### Email Webhook:
- [ ] Database webhook created in Supabase Dashboard
- [ ] Webhook configured with correct URL
- [ ] Webhook configured with service_role key
- [ ] Webhook status shows "Active"
- [ ] Edge Function environment variables set
- [ ] Test request submitted
- [ ] Webhook logs show HTTP 200
- [ ] Edge Function logs show processing
- [ ] Emails received (user + admin)

### Code Updates:
- [ ] Jets booking fixed (JetDetail.jsx)
- [ ] Helicopters booking fixed (HelicopterDetail.jsx)
- [ ] Admin panel updated (UserRequestManagement.tsx)
- [ ] Ground Transport renamed to "Ground Transport"
- [ ] Luxury Cars category hidden
- [ ] Success notification component created

---

## 🚨 Critical Dependencies

**Migration Order Matters:**
1. **FIRST:** Run Migration 1 (RWS Request Types)
2. **SECOND:** Run Migration 2 (Bell Notifications)
3. **THIRD:** Configure Email Webhook

**Why this order:**
- Migration 2 depends on `user_requests` table existing (from Migration 1)
- Email webhook depends on Edge Function being deployed
- Triggers need to be in place before testing

---

## 📊 What Each Component Does

| Component | What It Does | Status |
|-----------|--------------|--------|
| **user_requests table** | Stores all service requests | ✅ Exists |
| **Type constraint** | Allows RWS service types | ⚠️ Needs Migration 1 |
| **Bell notification triggers** | Creates in-app notifications | ⚠️ Needs Migration 2 |
| **Email webhook** | Sends confirmation emails | ⚠️ Needs Dashboard setup |
| **Edge Function** | Handles email sending via AWS SES | ✅ Exists |
| **NotificationBell UI** | Shows bell icon with notifications | ✅ Exists |
| **Admin panel** | Manages and responds to requests | ✅ Updated |

---

## 🎉 Expected Result After All Setup

### When User Books Service:
1. Request saved to database ✅
2. Bell notification to all admins ✅
3. Bell notification confirmation to user ✅
4. Email confirmation to user ✅
5. Email notification to bookings@privatecharterx.com ✅
6. Success popup shows ✅

### When Admin Responds:
1. Admin updates status or adds notes ✅
2. Bell notification to user ✅
3. User clicks bell → sees update ✅
4. User clicks notification → goes to request details ✅

### Services Covered:
✅ Private Jets
✅ Helicopters
✅ Empty Legs
✅ Adventures/Fixed Offers
✅ Ground Transport (Taxi/Concierge/Luxury Cars)
✅ Events & Sports
✅ CO₂ Certificates
✅ All other RWS services

---

## 🆘 Troubleshooting

### "Error: new row violates check constraint valid_type"
**Problem:** Migration 1 not applied
**Solution:** Run Migration 1 first

### Bell notifications not appearing
**Problem:** Migration 2 not applied
**Solution:** Run Migration 2

### Emails not sending
**Problem:** Email webhook not configured
**Solution:** Follow `SETUP_EMAIL_WEBHOOKS.md`

### Webhook shows "Failed" status
**Problem:** Incorrect URL or service_role key
**Solution:** Verify project ref and copy correct service_role key from Settings → API

---

## 📞 Support

If you encounter issues:
1. Check migration was applied: `SELECT * FROM supabase_migrations.schema_migrations;`
2. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname LIKE 'user_request%';`
3. Check Edge Function logs for errors
4. Check Database webhook logs
5. Verify environment variables in Edge Function settings

---

## Summary

**Required Migrations:** 2 SQL files
**Required Setup:** 1 Dashboard webhook
**Total Time:** ~15 minutes
**Result:** Complete end-to-end request and notification system ✅
