# Payment Dispute System - Summary

## Overview
Users can dispute completed rides. All disputes are handled manually by the admin team via support tickets.

## User Flow

1. **After Ride Completion**
   - User sees "Dispute Payment" button in My Requests page
   - Button only appears for completed rides that haven't been disputed yet

2. **Filing a Dispute**
   - User clicks "Dispute Payment"
   - Modal opens with:
     - Booking details (car type, route, date)
     - Dropdown to select reason (Driver was late, Overcharged, etc.)
     - Text area for detailed description
   - Both fields are required

3. **What Happens**
   - Creates record in `ride_disputes` table with status "open"
   - Creates high-priority support ticket automatically
   - Updates booking to mark `disputed = true`
   - Sends notification to admin (if notifications table exists)
   - User sees success message: "Admin will contact you within 24 hours"

4. **Admin Handling**
   - Admin sees high-priority support ticket in admin dashboard
   - Admin reviews dispute details and booking information
   - Admin contacts user via email or support ticket system
   - Admin manually processes refund/adjustment if needed
   - Admin updates dispute status in database

## Database Changes

### New Columns in `user_requests`:
- `disputed` (boolean) - Prevents duplicate disputes
- `stripe_payment_intent_id` - For Stripe escrow
- `coingate_order_id` - For crypto payments
- `payment_status` - Tracks payment lifecycle
- `admin_note` - Admin can add notes about adjustments

### New Tables:
- **`ride_disputes`** - Stores dispute details
  - booking_id, user_id, reason, description
  - status: open, in_review, resolved, rejected
  - resolution notes and timestamps

- **`support_tickets`** - High-priority tickets auto-created
  - type: 'ride_dispute'
  - priority: 'high'
  - related_booking_id for easy lookup

## Files Modified

1. **MyRequestsView.jsx** - Shows dispute button for completed rides
2. **ReviewDisputeModal.jsx** - Dispute form UI (removed review functionality)
3. **add_review_dispute_tables.sql** - Database migration (dispute-only, no reviews)

## Next Steps

1. Run database migration in Supabase SQL Editor
2. Build admin dashboard to view/manage disputes
3. Set up email notifications for new disputes
4. Test dispute flow end-to-end
5. Add CoinGate API key when ready (tomorrow)

## Admin Dashboard TODO

Admin needs ability to:
- [ ] View all open disputes
- [ ] See related booking details
- [ ] Add resolution notes
- [ ] Update dispute status
- [ ] Process refunds via Stripe/CoinGate
- [ ] Close support tickets when resolved
