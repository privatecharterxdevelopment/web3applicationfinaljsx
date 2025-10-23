// Stripe Escrow Payment API Endpoints
// These endpoints handle payment authorization, admin adjustments, and capture
// Deploy this to your backend (Node.js/Express, Vercel, or Netlify Functions)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * CREATE PAYMENT INTENT (Authorization Hold)
 * Called when user completes payment page
 * Money is held on card, NOT transferred yet
 */
async function createPaymentIntent(req, res) {
  try {
    const { bookingId, amount, currency, userId } = req.body;

    // Create Payment Intent with manual capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      capture_method: 'manual', // IMPORTANT: This holds the payment
      payment_method_types: ['card'],
      metadata: {
        booking_id: bookingId,
        user_id: userId,
        type: 'taxi_concierge'
      }
    });

    // Update booking in database with Payment Intent ID
    await supabase
      .from('user_requests')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        estimated_price: amount,
        payment_status: 'authorized',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * ADMIN: ADJUST BOOKING PRICE
 * Admin can update price BEFORE capture
 * User is notified of price change
 */
async function adjustBookingPrice(req, res) {
  try {
    const { bookingId, newPrice, adminNote } = req.body;

    // Get booking from database
    const { data: booking, error: fetchError } = await supabase
      .from('user_requests')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if payment is already captured
    if (booking.payment_status === 'captured') {
      return res.status(400).json({ error: 'Cannot adjust price after payment is captured' });
    }

    // Update Payment Intent with new amount
    const paymentIntent = await stripe.paymentIntents.update(
      booking.stripe_payment_intent_id,
      {
        amount: Math.round(newPrice * 100), // Convert to cents
        metadata: {
          ...booking.metadata,
          admin_adjusted: 'true',
          admin_note: adminNote,
          original_price: booking.estimated_price
        }
      }
    );

    // Update database
    await supabase
      .from('user_requests')
      .update({
        final_price: newPrice,
        admin_adjusted: true,
        admin_note: adminNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Notify user of price adjustment
    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      type: 'price_adjusted',
      title: 'Booking Price Updated',
      message: `Your booking price has been adjusted to ${newPrice} ${booking.data?.currency || 'CHF'}. ${adminNote ? `Note: ${adminNote}` : ''}`,
      metadata: {
        bookingId,
        oldPrice: booking.estimated_price,
        newPrice,
        adminNote
      },
      is_read: false,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      paymentIntent,
      newPrice,
      message: 'Price adjusted successfully and user notified'
    });

  } catch (error) {
    console.error('Error adjusting price:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * DRIVER: CONFIRM ARRIVAL & CAPTURE PAYMENT
 * Called when driver confirms arrival
 * Money is transferred from user's card to your account
 */
async function confirmArrivalAndCapture(req, res) {
  try {
    const { bookingId, driverId } = req.body;

    // Get booking
    const { data: booking, error: fetchError } = await supabase
      .from('user_requests')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if already captured
    if (booking.payment_status === 'captured') {
      return res.status(400).json({ error: 'Payment already captured' });
    }

    // Capture the payment
    const paymentIntent = await stripe.paymentIntents.capture(
      booking.stripe_payment_intent_id
    );

    // Update booking status
    await supabase
      .from('user_requests')
      .update({
        status: 'in_progress',
        payment_status: 'captured',
        driver_id: driverId,
        driver_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Notify user
    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      type: 'driver_arrived',
      title: 'Driver Has Arrived',
      message: 'Your driver has confirmed arrival. Payment has been processed. Enjoy your ride!',
      metadata: { bookingId, driverId },
      is_read: false,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      paymentIntent,
      message: 'Payment captured successfully'
    });

  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * CANCEL BOOKING & REFUND
 * Releases the hold on user's card
 * No money is transferred
 */
async function cancelBookingAndRefund(req, res) {
  try {
    const { bookingId, reason } = req.body;

    // Get booking
    const { data: booking, error: fetchError } = await supabase
      .from('user_requests')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if already captured
    if (booking.payment_status === 'captured') {
      // If captured, issue a refund
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        reason: 'requested_by_customer'
      });

      await supabase
        .from('user_requests')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      return res.json({
        success: true,
        refund,
        message: 'Booking cancelled and refunded'
      });
    }

    // If not captured, just cancel the Payment Intent
    const paymentIntent = await stripe.paymentIntents.cancel(
      booking.stripe_payment_intent_id
    );

    await supabase
      .from('user_requests')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Notify user
    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      metadata: { bookingId, reason },
      is_read: false,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      paymentIntent,
      message: 'Booking cancelled and payment released'
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * COMPLETE RIDE
 * Mark ride as completed
 * User can now leave review or dispute
 */
async function completeRide(req, res) {
  try {
    const { bookingId } = req.body;

    await supabase
      .from('user_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Get booking for user notification
    const { data: booking } = await supabase
      .from('user_requests')
      .select('*')
      .eq('id', bookingId)
      .single();

    // Notify user
    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      type: 'ride_completed',
      title: 'Ride Completed',
      message: 'Thank you for riding with us! Please leave a review.',
      metadata: { bookingId },
      is_read: false,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Ride marked as completed'
    });

  } catch (error) {
    console.error('Error completing ride:', error);
    res.status(500).json({ error: error.message });
  }
}

// Export functions for different backend frameworks
module.exports = {
  createPaymentIntent,
  adjustBookingPrice,
  confirmArrivalAndCapture,
  cancelBookingAndRefund,
  completeRide
};

// Example Express.js routes:
/*
const express = require('express');
const router = express.Router();

router.post('/create-payment-intent', createPaymentIntent);
router.post('/admin/adjust-price', adjustBookingPrice);
router.post('/driver/confirm-arrival', confirmArrivalAndCapture);
router.post('/cancel-booking', cancelBookingAndRefund);
router.post('/complete-ride', completeRide);

module.exports = router;
*/
