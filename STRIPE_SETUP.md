# Stripe Payment Integration Setup

## 1. Install Stripe Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## 2. Add Stripe Publishable Key to .env

Add this to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

You can get your Stripe keys from: https://dashboard.stripe.com/apikeys

**Important:**
- Use `pk_test_...` keys for development/testing
- Use `pk_live_...` keys for production
- NEVER commit your secret key to version control

## 3. Server-Side Payment Intent Creation

The current implementation uses a white-label UI with Stripe SDK. To complete the integration, you'll need to create a backend endpoint that creates Stripe Payment Intents.

### Example Backend Endpoint (Node.js/Express):

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      capture_method: 'manual', // Important: This holds the payment
      metadata: {
        booking_id: req.body.bookingId,
        // Add other booking details
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Capture Payment When Driver Confirms:

```javascript
app.post('/api/capture-payment', async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    res.json({ success: true, paymentIntent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## 4. CoinGate Integration (for Crypto Payments)

For cryptocurrency payments via CoinGate:

1. Sign up at https://coingate.com/
2. Get your API credentials
3. Add to `.env`:

```env
VITE_COINGATE_API_KEY=your_coingate_api_key
```

CoinGate will handle BTC, ETH, USDT, and USDC payments automatically.

## 5. Payment Flow

1. **User selects car** → Goes to payment page
2. **User adds baggage** (optional)
3. **User selects payment method:**
   - **Crypto (CoinGate):** Redirects to CoinGate payment page
   - **Card (Stripe):** Shows inline card form
4. **Payment is authorized but NOT captured** (hold on card)
5. **Driver confirms arrival** → Backend captures the payment
6. **User is charged** only after driver confirmation

## 6. Testing

### Stripe Test Cards:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0027 6000 3184`

Use any future expiry date and any 3-digit CVC.

## 7. Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Set up Stripe webhooks for payment events
- [ ] Implement proper error handling
- [ ] Add receipt/invoice generation
- [ ] Set up refund handling
- [ ] Configure CoinGate for live payments
- [ ] Test payment capture on driver confirmation
- [ ] Set up payment failure notifications

## Security Notes

- ✅ Payment is held (not captured) until driver confirms
- ✅ All card data is handled by Stripe (PCI-compliant)
- ✅ No sensitive payment data stored on your servers
- ✅ Crypto payments handled by CoinGate
- ✅ White-label UI maintains your brand
