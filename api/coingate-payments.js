// CoinGate Crypto Payment Integration
// Handles BTC, ETH, USDT, USDC payments via CoinGate API
// Deploy this to your backend (Node.js/Express, Vercel, or Netlify Functions)

const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// CoinGate API Configuration
const COINGATE_API_KEY = process.env.COINGATE_API_KEY;
const COINGATE_ENVIRONMENT = process.env.COINGATE_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'live'
const COINGATE_API_URL = COINGATE_ENVIRONMENT === 'live'
  ? 'https://api.coingate.com/v2'
  : 'https://api-sandbox.coingate.com/v2';

/**
 * CREATE CRYPTO PAYMENT ORDER
 * Called when user selects crypto payment (BTC, ETH, USDT, USDC)
 * Returns payment URL to redirect user to CoinGate checkout
 */
async function createCryptoPayment(req, res) {
  try {
    const { bookingId, amount, currency, cryptoCurrency, userId } = req.body;

    // Validate inputs
    if (!bookingId || !amount || !cryptoCurrency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get booking from database
    const { data: booking, error: fetchError } = await supabase
      .from('user_requests')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Create CoinGate order
    const orderData = {
      order_id: bookingId, // Your internal booking ID
      price_amount: amount, // Amount to charge
      price_currency: currency || 'CHF', // Fiat currency (CHF, USD, EUR)
      receive_currency: cryptoCurrency.toUpperCase(), // BTC, ETH, USDT, USDC
      title: `Taxi Booking #${bookingId.substring(0, 8)}`,
      description: `${booking.data?.carType?.name || 'Taxi'} from ${booking.data?.locationA} to ${booking.data?.locationB}`,
      callback_url: `${process.env.APP_URL}/api/coingate-webhook`, // Webhook for payment status
      cancel_url: `${process.env.APP_URL}/booking-cancelled?id=${bookingId}`,
      success_url: `${process.env.APP_URL}/booking-confirmed?id=${bookingId}`,
      token: bookingId // Additional identifier
    };

    const response = await fetch(`${COINGATE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${COINGATE_API_KEY}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinGate API Error:', errorText);
      return res.status(response.status).json({ error: 'Failed to create crypto payment' });
    }

    const order = await response.json();

    // Update booking with CoinGate order info
    await supabase
      .from('user_requests')
      .update({
        coingate_order_id: order.id,
        coingate_payment_url: order.payment_url,
        payment_method: `crypto_${cryptoCurrency.toLowerCase()}`,
        payment_status: 'pending_crypto',
        estimated_price: amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Notify user
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'crypto_payment_created',
      title: 'Complete Crypto Payment',
      message: `Please complete your ${cryptoCurrency.toUpperCase()} payment to confirm your booking.`,
      metadata: {
        bookingId,
        orderId: order.id,
        paymentUrl: order.payment_url
      },
      is_read: false,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      orderId: order.id,
      paymentUrl: order.payment_url,
      expiresAt: order.expire_at
    });

  } catch (error) {
    console.error('Error creating crypto payment:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * WEBHOOK: COINGATE PAYMENT STATUS
 * CoinGate calls this when payment status changes
 * Statuses: pending, confirming, paid, invalid, expired, canceled, refunded
 */
async function handleCoinGateWebhook(req, res) {
  try {
    const payload = req.body;

    console.log('CoinGate Webhook Received:', payload);

    const {
      id: orderId,
      order_id: bookingId,
      status,
      price_amount,
      price_currency,
      receive_currency,
      receive_amount,
      payment_address,
      created_at
    } = payload;

    // Get booking
    const { data: booking, error: fetchError } = await supabase
      .from('user_requests')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      console.error('Booking not found for webhook:', bookingId);
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking based on payment status
    let updateData = {
      coingate_status: status,
      updated_at: new Date().toISOString()
    };

    let notificationData = null;

    switch (status) {
      case 'paid':
        // Payment confirmed! Capture the booking
        updateData.payment_status = 'captured';
        updateData.status = 'confirmed';
        updateData.paid_at = new Date().toISOString();
        updateData.receive_amount = receive_amount;
        updateData.receive_currency = receive_currency;

        notificationData = {
          user_id: booking.user_id,
          type: 'crypto_payment_confirmed',
          title: 'Payment Confirmed!',
          message: `Your ${receive_currency} payment has been confirmed. Your booking is now confirmed!`,
          metadata: {
            bookingId,
            orderId,
            amount: receive_amount,
            currency: receive_currency
          },
          is_read: false,
          created_at: new Date().toISOString()
        };
        break;

      case 'confirming':
        // Payment received, waiting for blockchain confirmations
        updateData.payment_status = 'confirming';

        notificationData = {
          user_id: booking.user_id,
          type: 'crypto_payment_confirming',
          title: 'Payment Received',
          message: 'Your payment is being confirmed on the blockchain. This may take a few minutes.',
          metadata: { bookingId, orderId },
          is_read: false,
          created_at: new Date().toISOString()
        };
        break;

      case 'expired':
      case 'canceled':
        // Payment window expired or user cancelled
        updateData.payment_status = 'cancelled';
        updateData.status = 'cancelled';
        updateData.cancellation_reason = status === 'expired' ? 'Payment expired' : 'Payment cancelled by user';

        notificationData = {
          user_id: booking.user_id,
          type: 'crypto_payment_cancelled',
          title: 'Payment Cancelled',
          message: `Your payment has been ${status}. Please create a new booking if you'd like to try again.`,
          metadata: { bookingId, orderId },
          is_read: false,
          created_at: new Date().toISOString()
        };
        break;

      case 'invalid':
        // Payment failed (wrong amount, wrong address, etc.)
        updateData.payment_status = 'failed';

        notificationData = {
          user_id: booking.user_id,
          type: 'crypto_payment_failed',
          title: 'Payment Failed',
          message: 'Your crypto payment could not be processed. Please contact support.',
          metadata: { bookingId, orderId },
          is_read: false,
          created_at: new Date().toISOString()
        };
        break;

      case 'refunded':
        // Payment was refunded
        updateData.payment_status = 'refunded';
        updateData.status = 'cancelled';

        notificationData = {
          user_id: booking.user_id,
          type: 'crypto_payment_refunded',
          title: 'Payment Refunded',
          message: 'Your payment has been refunded.',
          metadata: { bookingId, orderId },
          is_read: false,
          created_at: new Date().toISOString()
        };
        break;

      default:
        // pending or other statuses
        updateData.payment_status = status;
    }

    // Update booking in database
    await supabase
      .from('user_requests')
      .update(updateData)
      .eq('id', bookingId);

    // Send notification if applicable
    if (notificationData) {
      await supabase.from('notifications').insert(notificationData);
    }

    // Log webhook event
    await supabase.from('webhook_logs').insert({
      type: 'coingate_webhook',
      payload: payload,
      booking_id: bookingId,
      status: status,
      created_at: new Date().toISOString()
    });

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error handling CoinGate webhook:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * CHECK PAYMENT STATUS
 * Manually check the status of a CoinGate order
 */
async function checkPaymentStatus(req, res) {
  try {
    const { orderId } = req.params;

    const response = await fetch(`${COINGATE_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${COINGATE_API_KEY}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch payment status' });
    }

    const order = await response.json();

    res.json({
      success: true,
      status: order.status,
      paymentUrl: order.payment_url,
      createdAt: order.created_at,
      expiresAt: order.expire_at,
      receiveAmount: order.receive_amount,
      receiveCurrency: order.receive_currency
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * CANCEL CRYPTO PAYMENT
 * Cancel a pending crypto payment order
 */
async function cancelCryptoPayment(req, res) {
  try {
    const { bookingId } = req.body;

    // Get booking
    const { data: booking, error: fetchError } = await supabase
      .from('user_requests')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.coingate_order_id) {
      return res.status(400).json({ error: 'No crypto payment found for this booking' });
    }

    // Update booking status
    await supabase
      .from('user_requests')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
        cancellation_reason: 'Cancelled by user',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    res.json({
      success: true,
      message: 'Crypto payment cancelled'
    });

  } catch (error) {
    console.error('Error cancelling crypto payment:', error);
    res.status(500).json({ error: error.message });
  }
}

// Export functions
module.exports = {
  createCryptoPayment,
  handleCoinGateWebhook,
  checkPaymentStatus,
  cancelCryptoPayment
};

// Example Express.js routes:
/*
const express = require('express');
const router = express.Router();
const coingate = require('./api/coingate-payments');

router.post('/create-crypto-payment', coingate.createCryptoPayment);
router.post('/coingate-webhook', coingate.handleCoinGateWebhook);
router.get('/check-payment-status/:orderId', coingate.checkPaymentStatus);
router.post('/cancel-crypto-payment', coingate.cancelCryptoPayment);

module.exports = router;
*/
