# Taxi/Concierge Booking Features - Implementation Guide

## ✅ Completed Features

### 1. Long Distance Validation (>1 hour)
- **Location:** `TaxiConciergeView.jsx` lines 942-981
- **Behavior:** When ETA > 60 minutes, shows amber notice box
- **Message:** "This trip is longer than 1 hour. Please contact us directly at bookings@privatecharterx.com"
- **Button:** Hides "Continue" button, forces user to contact via email

---

## 🚧 Pending Implementation

### 2. Ongoing Booking Card (Overview Page)

**Location:** Replace "Analytica ideas" card in `tokenized-assets-glassmorphic.jsx` line 3284

**Requirements:**
- Position: Third card from left (after Empty Legs, Events cards)
- Shows two states:

#### State 1: No Ongoing Booking
```jsx
<h4>No Ongoing Booking</h4>
<p>Book a ride to get started</p>
```

#### State 2: Active Booking
```jsx
<h4>{carType} - {pickupTime}</h4>
<p>{pickupDate} • Timer: {countdown}</p>
<Badge status="pending" or "confirmed" />
```

**Data Source:**
- Fetch from `user_requests` table
- Filter by: `type = 'taxi_concierge'` AND `status IN ('pending', 'confirmed')`
- Order by: `pickup_datetime ASC`
- Limit: 1 (show next upcoming booking)

**Implementation Steps:**

1. Add state:
```javascript
const [ongoingBooking, setOngoingBooking] = useState(null);
const [bookingCountdown, setBookingCountdown] = useState('00:00');
```

2. Add fetch function:
```javascript
const fetchOngoingBooking = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('user_requests')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'taxi_concierge')
    .in('status', ['pending', 'confirmed'])
    .gte('data->>pickup_datetime', new Date().toISOString())
    .order('data->>pickup_datetime', { ascending: true })
    .limit(1)
    .single();

  if (data) {
    setOngoingBooking(data);
  }
};
```

3. Add countdown timer:
```javascript
useEffect(() => {
  if (!ongoingBooking) return;

  const interval = setInterval(() => {
    const now = new Date();
    const pickup = new Date(ongoingBooking.data.pickup_datetime);
    const diff = pickup - now;

    if (diff <= 0) {
      setBookingCountdown('00:00');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setBookingCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }, 1000);

  return () => clearInterval(interval);
}, [ongoingBooking]);
```

4. Replace Analytica card:
```jsx
{/* Ongoing Booking Card */}
<button
  onClick={() => setActiveCategory('favourites')}
  className="border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50"
  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
>
  <div className="mb-2">
    <span className="text-[10px] font-bold font-['DM_Sans'] text-gray-500 uppercase tracking-wider">
      Upcoming Ride
    </span>
  </div>
  {ongoingBooking ? (
    <>
      <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">
        {ongoingBooking.data.carType?.name || 'Taxi'} - {ongoingBooking.data.pickupTime}
      </h4>
      <p className="text-[10px] font-['DM_Sans'] text-gray-600 mb-2">
        {new Date(ongoingBooking.data.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {bookingCountdown}
      </p>
      <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-medium ${
        ongoingBooking.status === 'confirmed'
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}>
        {ongoingBooking.status}
      </span>
    </>
  ) : (
    <>
      <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">No Ongoing Booking</h4>
      <p className="text-[10px] font-['DM_Sans'] text-gray-600">Book a ride to get started</p>
    </>
  )}
</button>
```

---

### 3. Stripe Escrow/Hold Payment System

**How It Works:**

#### Payment Flow:
1. **Authorization** (when user books)
   - Create Payment Intent with `capture_method: 'manual'`
   - Stripe holds the amount on user's card
   - Money is NOT transferred yet
   - Status: "requires_capture"

2. **Admin Price Adjustment** (if needed)
   - Admin can update Payment Intent amount
   - Only possible BEFORE capture
   - API: `stripe.paymentIntents.update()`

3. **Capture** (when driver confirms arrival)
   - Call `stripe.paymentIntents.capture()`
   - Can capture less than authorized amount
   - Money transfers to your account
   - Status: "succeeded"

4. **Cancel** (if ride doesn't happen)
   - Call `stripe.paymentIntents.cancel()`
   - Hold is released from user's card
   - No money transferred

#### Database Schema Required:

```sql
-- Add to user_requests table
ALTER TABLE user_requests ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE user_requests ADD COLUMN estimated_price NUMERIC;
ALTER TABLE user_requests ADD COLUMN final_price NUMERIC;
ALTER TABLE user_requests ADD COLUMN admin_adjusted BOOLEAN DEFAULT FALSE;
ALTER TABLE user_requests ADD COLUMN payment_status TEXT; -- 'authorized', 'captured', 'cancelled'
```

#### Implementation:

**Backend Endpoint:** `/api/admin/adjust-booking-price`
```javascript
app.post('/api/admin/adjust-booking-price', async (req, res) => {
  const { bookingId, newPrice } = req.body;

  // Get booking from database
  const { data: booking } = await supabase
    .from('user_requests')
    .select('*')
    .eq('id', bookingId)
    .single();

  // Update Payment Intent with new amount
  const paymentIntent = await stripe.paymentIntents.update(
    booking.stripe_payment_intent_id,
    { amount: Math.round(newPrice * 100) } // Convert to cents
  );

  // Update database
  await supabase
    .from('user_requests')
    .update({
      final_price: newPrice,
      admin_adjusted: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  // Notify user of price adjustment
  await supabase.from('notifications').insert({
    user_id: booking.user_id,
    type: 'price_adjusted',
    title: 'Booking Price Updated',
    message: `Your booking price has been adjusted to ${newPrice} CHF`,
    metadata: { bookingId, oldPrice: booking.estimated_price, newPrice }
  });

  res.json({ success: true, paymentIntent });
});
```

**Backend Endpoint:** `/api/driver/confirm-arrival`
```javascript
app.post('/api/driver/confirm-arrival', async (req, res) => {
  const { bookingId } = req.body;

  const { data: booking } = await supabase
    .from('user_requests')
    .select('*')
    .eq('id', bookingId)
    .single();

  // Capture the payment
  const paymentIntent = await stripe.paymentIntents.capture(
    booking.stripe_payment_intent_id
  );

  // Update database
  await supabase
    .from('user_requests')
    .update({
      status: 'in_progress',
      payment_status: 'captured',
      driver_confirmed_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  res.json({ success: true, paymentIntent });
});
```

---

### 4. Currency Selection by Location

**Implementation:**

1. In `PaymentPage.jsx`, detect user's country via Stripe:
```javascript
// Use Stripe's automatic currency detection
const { data: { user } } = await supabase.auth.getUser();
const userProfile = await supabase
  .from('profiles')
  .select('country, currency')
  .eq('id', user.id)
  .single();

// Allow manual override
const [selectedCurrency, setSelectedCurrency] = useState(
  userProfile.currency || detectedCurrency || 'CHF'
);
```

2. Add currency dropdown:
```jsx
<select
  value={selectedCurrency}
  onChange={(e) => setSelectedCurrency(e.target.value)}
  className="..."
>
  <option value="CHF">CHF (Swiss Franc)</option>
  <option value="EUR">EUR (Euro)</option>
  <option value="USD">USD (US Dollar)</option>
  <option value="GBP">GBP (British Pound)</option>
</select>
```

---

### 5. Review & Dispute System

**After Ride Completion:**

#### Database Schema:
```sql
CREATE TABLE ride_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES user_requests(id),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ride_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES user_requests(id),
  user_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'in_review', 'resolved', 'rejected'
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

#### UI in "My Requests" Tab:

```jsx
{/* After completed ride */}
{booking.status === 'completed' && !booking.reviewed && (
  <div className="mt-4 space-y-2">
    <button
      onClick={() => setShowReviewModal(true)}
      className="w-full py-2 bg-green-600 text-white rounded-lg"
    >
      Leave a Review
    </button>
    <button
      onClick={() => setShowDisputeModal(true)}
      className="w-full py-2 bg-red-600 text-white rounded-lg"
    >
      Dispute Payment
    </button>
  </div>
)}
```

#### Dispute Opens Support Ticket:
```javascript
const handleDispute = async () => {
  // Create dispute record
  await supabase.from('ride_disputes').insert({
    booking_id: booking.id,
    user_id: user.id,
    reason: disputeReason,
    description: disputeDescription
  });

  // Create support ticket
  await supabase.from('support_tickets').insert({
    user_id: user.id,
    type: 'ride_dispute',
    priority: 'high',
    subject: `Ride Dispute - Booking #${booking.id}`,
    description: disputeDescription,
    related_booking_id: booking.id
  });

  // Notify admin
  await sendAdminNotification({
    type: 'dispute_created',
    bookingId: booking.id,
    userId: user.id
  });
};
```

---

## Summary Checklist

- [x] Long distance trips (>1hr) show contact message
- [ ] Ongoing Booking card on overview page
- [ ] Countdown timer for upcoming bookings
- [ ] Status badges (pending/confirmed)
- [ ] Stripe escrow/hold payment implementation
- [ ] Admin price adjustment backend
- [ ] Currency selection by location
- [ ] Review system after completed rides
- [ ] Dispute system that creates support tickets

---

## Next Steps

1. Implement Ongoing Booking card
2. Set up Stripe Payment Intent backend endpoints
3. Create admin panel for price adjustments
4. Add review/dispute modals to "My Requests" page
5. Test full payment flow with escrow
