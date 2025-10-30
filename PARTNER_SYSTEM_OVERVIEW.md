# Partner System Overview - PrivateCharterX

## How Partner Onboarding Works

### Step 1: Partner Registration
**[PartnerRegistrationModal.tsx](src/components/PartnerRegistrationModal.tsx)**

Partners fill out a comprehensive registration form with:

**Basic Information:**
- Email & Password
- First Name & Last Name
- Company Name
- Phone Number
- Company Logo Upload (max 2MB)

**Company Details:**
- Partner Type: Taxi / Limousine / Adventure / Auto Rental / Other
- Business Registration Number
- Tax ID
- Company Biography

**Payment Method (Choose One):**
- **IBAN** (Bank Transfer):
  - IBAN Number
  - Bank Name
  - Account Holder Name
- **Crypto Wallet**:
  - Wallet Address (for crypto payments)

**KYC (Know Your Customer):**
- ID Document Type: Passport / ID Card / Driver's License
- ID Document Number
- Date of Birth
- Nationality
- Full Address (Street, City, Postal Code, Country)

### Step 2: Stripe Connect Account Creation
**[api/stripe-connect-partners.cjs](api/stripe-connect-partners.cjs:createConnectAccount)**

Upon registration submission:
1. User account created in Supabase `auth.users`
2. Profile created in `user_profiles` with `role: 'partner'`
3. **Stripe Connect Express Account** automatically created via backend API
4. Partner receives `stripe_connect_account_id` in database
5. Partner status set to `partner_verified: false` (pending admin approval)

### Step 3: Stripe Onboarding Link
**Backend API:** `POST /api/partners/onboarding-link`

Partner must complete Stripe identity verification:
- Partner receives onboarding link in email or clicks "Complete Verification" in dashboard
- Stripe guides partner through:
  - Identity verification (passport/ID upload)
  - Business information verification
  - Bank account connection for payouts
- Stripe webhooks notify system when verification complete
- Database updated: `stripe_charges_enabled: true`, `stripe_payouts_enabled: true`

### Step 4: Admin Approval
**[PartnerVerificationManagement.tsx](src/pages/admin/components/PartnerVerificationManagement.tsx)**

Admin reviews partner application:
- Checks business registration documents
- Verifies Stripe account status (must show "verified")
- Reviews company information
- **Approves or Rejects** application

Once approved:
- `partner_verified: true` in database
- Partner receives notification
- Partner can now create services and receive bookings

---

## What Partners Can Do

### 1. Dashboard Overview
**[PartnerDashboard.tsx](src/components/PartnerDashboard.tsx)**

Partners see real-time stats:
- **Active Services** - Number of approved services
- **Pending Bookings** - Bookings awaiting partner response
- **Completed Bookings** - Successfully completed jobs
- **Total Earnings** - Lifetime earnings (after commissions)
- **Pending Payouts** - Money waiting to be paid out
- **Partner Points** - Loyalty points (10% of earnings)

### 2. Manage Services
**[PartnerServiceManagement.tsx](src/components/PartnerServiceManagement.tsx)**

Partners can create and manage their services:

**Service Types:**
- 🚕 Taxi / Driver Service
- 🚗 Luxury Car / Limousine
- 🏔️ Adventure Package
- 🚙 Vehicle Rental
- 📦 Other Service

**For Each Service, Partners Can Set:**
- **Title & Description**
- **Pricing**:
  - Amount
  - Currency (EUR, USD, CHF, etc.)
  - Type: Per Hour / Per Day / Per Trip / Fixed Price
- **Location**:
  - Service Address
  - City, Postal Code, Country
  - Coordinates (latitude/longitude)
- **Availability**:
  - Days of week (Monday-Sunday)
  - Time range (available_from / available_to)
- **Features** - List of service features/amenities
- **Images** - Multiple photos of the service
- **Status**: Draft / Pending Approval / Approved / Rejected

**Service Actions:**
- ✅ Create new service
- ✏️ Edit existing service
- 🗑️ Delete service
- 👁️ View service details

### 3. Handle Bookings
**Booking Flow for Partners:**

#### A. Receive Booking Request
- Customer books service → Payment held in escrow (NOT captured yet)
- Partner receives notification
- Booking status: `pending`
- Payment status: `held_escrow`

#### B. Accept or Reject Booking
**Accept:**
- Backend API: `POST /api/partners/accept-booking`
- Booking status → `confirmed`
- Customer notified: "Booking confirmed! Partner is on the way"
- Partner can see pickup details

**Reject:**
- Backend API: `POST /api/partners/reject-booking`
- Booking status → `cancelled`
- Payment authorization released (customer NOT charged)
- Customer notified with rejection reason

#### C. Confirm Arrival & Get Paid
**When partner arrives/completes service:**
- Partner clicks **"Confirm Arrival"** button
- Backend API: `POST /api/partners/capture-and-transfer`
- Payment captured from customer
- Commission calculated and deducted
- Money transferred to partner's Stripe account
- Booking status → `completed`
- Payment status → `captured_transferred`

**Commission Structure:**
- Taxi: 10% platform commission → Partner keeps 90%
- Luxury Car: 12% platform commission → Partner keeps 88%
- Adventure: 15% platform commission → Partner keeps 85%

**Example:**
```
Customer pays: €100
Commission (10%): €10
Partner receives: €90
```

### 4. Stripe Dashboard Access
**Button:** "Manage Account" in partner dashboard

Partners can access their Stripe Express Dashboard to:
- Update bank account (IBAN)
- View payout history
- Download tax forms (1099, etc.)
- Update business information
- View transaction history
- Manage payment methods
- See upcoming payouts

**How it works:**
1. Partner clicks "Manage Account"
2. Backend generates short-lived Stripe login link (valid 5 minutes)
3. Partner redirected to Stripe Express Dashboard
4. Changes sync automatically with PrivateCharterX

### 5. View Earnings
**Backend API:** `GET /api/partners/earnings`

Partners can see detailed earnings breakdown:
- **Per Booking:**
  - Booking ID
  - Service name
  - Customer name
  - Total amount
  - Commission deducted
  - Net earnings
  - Payment date
  - Stripe Transfer ID
- **Aggregate Stats:**
  - Daily earnings
  - Weekly earnings
  - Monthly earnings
  - Total lifetime earnings

### 6. Payouts
**Automatic Daily Payouts:**
- Stripe automatically transfers earnings to partner's bank account
- Default schedule: **Daily** (2-day delay)
- Partners receive notification when payout is sent
- Payout record created in `partner_payouts` table

**Payout Information:**
- Amount
- Currency
- Status: Pending / Paid / Failed
- Stripe Payout ID
- Estimated arrival date
- Actual paid date

---

## Payment Flow (Uber-like Escrow System)

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│  Customer   │       │  PrivateChX  │       │   Partner    │
│   Books     │──────>│   Platform   │──────>│  (Receives   │
│  Service    │       │   (Escrow)   │       │  Booking)    │
└─────────────┘       └──────────────┘       └──────────────┘
       │                      │                       │
       │ 1. Authorize         │                       │
       │    Payment           │                       │
       │    (NOT captured)    │                       │
       │─────────────────────>│                       │
       │                      │                       │
       │                      │ 2. Send Booking       │
       │                      │    Request            │
       │                      │──────────────────────>│
       │                      │                       │
       │                      │ 3a. Accept or Reject  │
       │                      │<──────────────────────│
       │                      │                       │
       │ 4. If Rejected:      │                       │
       │    Release Auth      │                       │
       │<─────────────────────│                       │
       │    (NOT charged)     │                       │
       │                      │                       │
       │                      │ 3b. If Accepted:      │
       │                      │     Service Provided  │
       │                      │                       │
       │                      │ 5. Confirm Arrival    │
       │                      │<──────────────────────│
       │                      │                       │
       │ 6. Capture Payment   │                       │
       │<─────────────────────│                       │
       │                      │                       │
       │                      │ 7. Transfer Earnings  │
       │                      │    (minus commission) │
       │                      │──────────────────────>│
       │                      │                       │
       │                      │                       │
       │                      │ 8. Daily Payout       │
       │                      │    (Stripe → Bank)    │
       │                      │──────────────────────>│
```

---

## Database Tables

### Main Tables:
1. **`user_profiles`** - Partner account info
   - `role: 'partner'`
   - `stripe_connect_account_id`
   - `stripe_charges_enabled`
   - `stripe_payouts_enabled`
   - `partner_verified`
   - `company_name`
   - `business_registration`
   - `tax_id`
   - IBAN or wallet_address

2. **`partner_details`** - Extended partner info
   - KYC documents
   - Verification status
   - Logo URL

3. **`partner_services`** - Services offered by partners
   - Service type, title, description
   - Pricing info
   - Location, availability
   - Images, features
   - Status (approved/pending/rejected)

4. **`partner_bookings`** - Customer bookings
   - Customer ID, Partner ID, Service ID
   - Pickup/dropoff locations
   - Start/end times
   - Total amount
   - Commission rate & amount
   - Status (pending/confirmed/completed/cancelled)
   - Payment status (held_escrow/captured_transferred)
   - Stripe Payment Intent ID

5. **`partner_earnings`** - Transaction history
   - Booking ID
   - Gross amount (before commission)
   - Commission amount
   - Net earnings (partner receives)
   - Stripe Transfer ID
   - Stripe Payout ID
   - Status (paid/pending)

6. **`partner_payouts`** - Payout history
   - Partner ID
   - Amount
   - Status
   - Stripe Payout ID
   - Paid date

7. **`partner_notifications`** - Real-time notifications
   - Booking requests
   - Payment confirmations
   - Payout notifications
   - Verification updates

---

## API Endpoints

### Partner Management:
- `POST /api/partners/create-connect-account` - Create Stripe Connect account
- `POST /api/partners/onboarding-link` - Get Stripe onboarding URL
- `GET /api/partners/account-status` - Check Stripe verification status
- `POST /api/partners/express-dashboard-link` - Open Stripe Dashboard

### Booking Operations:
- `POST /api/partners/create-booking-payment` - Create escrow payment
- `POST /api/partners/accept-booking` - Partner accepts booking
- `POST /api/partners/reject-booking` - Partner rejects booking
- `POST /api/partners/capture-and-transfer` - Complete service & pay partner

### Earnings:
- `GET /api/partners/earnings` - View earnings history

### Webhooks:
- `POST /webhooks/stripe-connect` - Stripe webhook events
  - `account.updated` - Verification status changed
  - `transfer.created` - Payment sent to partner
  - `payout.paid` - Partner received payout
  - `payout.failed` - Payout failed

---

## Current Status

✅ **Fully Implemented:**
- Partner registration with comprehensive KYC
- Stripe Connect Express account creation
- Service creation and management
- Booking request system
- Accept/Reject booking flow
- Escrow payment system
- Automatic commission calculation
- Payment capture and transfer
- Daily automatic payouts
- Stripe Dashboard integration
- Admin approval workflow
- Real-time notifications
- Earnings tracking

📋 **Pending / Not Yet Implemented:**
- Partner ratings & reviews
- Multi-currency automatic conversion
- Partner analytics dashboard
- Automated tax reporting
- Dispute resolution system
- Partner insurance verification
- Background check integration
- Real-time GPS tracking
- In-app messaging between customer and partner
- Scheduled bookings (future dates)
- Recurring bookings
- Partner rewards program details

---

## Security & Compliance

✅ **Implemented:**
- Stripe Connect for PCI compliance
- RLS (Row Level Security) on all tables
- KYC/Identity verification via Stripe
- Business registration verification
- Secure webhook signature verification
- HTTPS-only API communication
- JWT authentication

📋 **Recommended for Production:**
- GDPR compliance for EU partners
- Data retention policies
- Partner agreement/terms of service
- Insurance verification
- Background checks for drivers
- Vehicle inspection for auto services
- Business license verification per region

---

## Support & Resources

**For Partners:**
- Email: partners@privatecharterx.com
- Help Center: https://help.privatecharterx.com/partners
- Stripe Support: https://support.stripe.com

**For Admins:**
- Partner Verification Dashboard
- Stripe Dashboard links
- Partner activity logs
- Commission reports
- Payout history

**Documentation:**
- [STRIPE_CONNECT_IMPLEMENTATION_GUIDE.md](STRIPE_CONNECT_IMPLEMENTATION_GUIDE.md) - Full technical guide
- [API Documentation](docs/API.md) - API endpoint reference
- [Database Schema](database/partner_system.sql) - Database structure
