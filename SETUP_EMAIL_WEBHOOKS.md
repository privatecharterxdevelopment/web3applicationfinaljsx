# 📧 Email Webhooks Setup Guide

## Current Status

### ✅ What's Working:
- Database saves to `user_requests` table
- Bell notifications (in-app)
- Email Edge Function exists and is ready
- AWS SES configured

### ❌ What's Missing:
- Database webhook to trigger email Edge Function when requests are created

---

## 🔧 Required Setup

### Step 1: Configure Database Webhook in Supabase Dashboard

**This CANNOT be done via SQL migration** - Supabase webhooks must be configured in the Dashboard.

#### Instructions:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open Database Webhooks**
   - Go to: **Database** → **Webhooks**
   - Click **"Enable webhooks"** if not already enabled

3. **Create New Webhook**
   - Click **"Create a new webhook"**

4. **Configure Webhook Settings:**
   ```
   Name: user-request-email-notifications
   Table: user_requests
   Events: ✅ Insert (check this box)
   Type: HTTP Request
   Method: POST
   URL: https://[YOUR-PROJECT-REF].supabase.co/functions/v1/user-request-notifications
   HTTP Headers:
     Authorization: Bearer [YOUR-SERVICE-ROLE-KEY]
     Content-Type: application/json
   ```

5. **Get Your Values:**
   - **Project Ref**: Found in your project URL (e.g., `abcdefghijklmnop`)
   - **Service Role Key**:
     - Go to **Settings** → **API**
     - Copy the `service_role` key (NOT the `anon` key)
     - ⚠️ **Keep this secret!**

6. **Save Webhook**
   - Click **"Create webhook"**
   - Status should show as **"Active"**

---

## 📊 What This Webhook Does

When a user submits ANY request (jets, helis, taxi, adventures, etc.):

```
1. Request inserted into user_requests table
   ↓
2. Database webhook fires
   ↓
3. Calls Edge Function: user-request-notifications
   ↓
4. Edge Function sends 2 emails via AWS SES:
   - Customer confirmation email
   - Admin notification to bookings@privatecharterx.com
```

---

## ✅ Verification Steps

### Test the Webhook:

1. **Submit a test request** (book any service as a user)

2. **Check Supabase Edge Functions Logs:**
   - Go to **Edge Functions** → **user-request-notifications**
   - Click **"Logs"**
   - Should see: `"Processing user request notification for type: [service_type]"`

3. **Check Email Inbox:**
   - **User should receive:** Confirmation email for their request
   - **Admin should receive:** Notification at bookings@privatecharterx.com

4. **Check Database Webhook Logs:**
   - Go back to **Database** → **Webhooks**
   - Click on your webhook
   - Check **"Recent webhook calls"**
   - Should see successful calls (HTTP 200)

### Troubleshooting:

**Webhook shows "Failed" status:**
- Check the URL is correct (including your project ref)
- Verify service_role key is correct
- Check Edge Function logs for errors

**Emails not received:**
- Check Edge Function logs for email sending errors
- Verify AWS SES credentials in Edge Function environment variables
- Check spam/junk folders
- Verify email addresses are correct

**Webhook not firing:**
- Ensure "Insert" event is checked
- Verify webhook is "Active" status
- Test by manually inserting a row into user_requests

---

## 🎯 Email Templates Included

The Edge Function already has templates for ALL service types:

✅ Private Jet Charter
✅ Helicopter Charter
✅ Empty Legs
✅ Adventures / Fixed Offers
✅ Ground Transport (Taxi/Concierge)
✅ Luxury Car Rental
✅ Event Booking
✅ CO₂ Certificate
✅ SPV Formation
✅ Tokenization

Each service gets a custom email template with relevant details.

---

## 📝 Environment Variables Required

The Edge Function needs these environment variables (already configured):

```
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=eu-north-1
FROM_EMAIL=noreply@www.privatecharterx.com
ADMIN_EMAIL=bookings@privatecharterx.com
```

To verify:
1. Go to **Edge Functions** → **user-request-notifications**
2. Click **"Settings"**
3. Check **"Environment variables"**

---

## 🚀 Complete Setup Checklist

- [ ] Database webhook created in Supabase Dashboard
- [ ] Webhook configured with correct URL and service_role key
- [ ] Webhook status shows "Active"
- [ ] Edge Function environment variables are set
- [ ] Test request submitted
- [ ] Edge Function logs show processing
- [ ] User received confirmation email
- [ ] Admin received notification email
- [ ] Database webhook logs show HTTP 200 success

---

## 📧 Email Content Preview

### User Confirmation Email:
```
Subject: [Service Type] Request Received

Hi [User Name],

Thank you for your request! We've received your [Service Type] booking request.

Request Details:
- Type: [Service Type]
- Date: [Request Date]
- [Additional service-specific details]

What happens next?
Our team will review your request and get back to you within 24 hours with pricing, availability, and next steps.

View your request: [Link to Dashboard]

Best regards,
PrivateCharterX Team
```

### Admin Notification Email:
```
To: bookings@privatecharterx.com
Subject: New [Service Type] Request

New request submitted:

User: [User Name] ([Email])
Request Type: [Service Type]
Date: [Request Date]
Status: Pending

[Full request details including all data fields]

View in admin panel: [Link to Admin Dashboard]
```

---

## 🔧 Alternative: Manual Email Trigger (Not Recommended)

If you cannot configure Dashboard webhooks, you can add manual email sending in the code:

**File:** `src/services/requests.ts` (Line 35)

Change from:
```typescript
await sendEmailNotification(type, data, userEmail);
```

To:
```typescript
// Call Edge Function directly
await supabase.functions.invoke('user-request-notifications', {
  body: { record: request }
});
```

**Issues with this approach:**
- Less reliable than webhooks
- Doesn't retry on failure
- Can be blocked by RLS policies
- Not recommended for production

---

## Summary

**Required:** Configure Database Webhook in Supabase Dashboard (5 minutes)
**Optional:** Verify email sending with test request (2 minutes)
**Result:** Automatic email notifications for ALL service requests ✅
