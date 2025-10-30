/**
 * Stripe Connect Partner Marketplace API
 *
 * Handles:
 * - Partner Connect account creation (Express accounts)
 * - Onboarding flow for multi-region partners (EU, US, Asia)
 * - Escrow payments with manual capture
 * - Commission-based transfers (10% taxi, 12% luxury car, 15% adventure)
 * - Daily automatic payouts
 * - Partner earnings tracking
 *
 * Supported Regions: Switzerland, EU, USA, Asia
 * Commission Structure: Taxi 10%, Luxury Car 12%, Adventure 15%
 * Payout Schedule: Daily (every 24 hours)
 */

// Lazy initialization to prevent crashes if env vars not set
let stripe;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

const { createClient } = require('@supabase/supabase-js');

// Lazy Supabase initialization
let supabase;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL || 'https://oubecmstqtzdnevyqavu.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key_for_startup'
    );
  }
  return supabase;
}

// Commission rates by service type
const COMMISSION_RATES = {
  'taxi': 0.10,        // 10%
  'luxury-car': 0.12,  // 12%
  'adventure': 0.15,   // 15%
  'auto': 0.12,        // 12%
  'limousine': 0.12,   // 12%
  'other': 0.10        // 10% default
};

/**
 * 1. CREATE STRIPE CONNECT EXPRESS ACCOUNT
 * Called during partner registration
 * Creates a Stripe Connect Express account for the partner
 */
async function createConnectAccount(req, res) {
  try {
    const { partnerId, email, country, businessType } = req.body;

    // Validate input
    if (!partnerId || !email || !country) {
      return res.status(400).json({
        error: 'Missing required fields: partnerId, email, country'
      });
    }

    // Get partner details from database
    const { data: partner, error: partnerError } = await supabase
      .from('users')
      .select('first_name, last_name, company_name')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', partnerId)
      .single();

    if (existingAccount?.stripe_connect_account_id) {
      return res.status(409).json({
        error: 'Stripe Connect account already exists',
        accountId: existingAccount.stripe_connect_account_id
      });
    }

    // Create Stripe Connect Express account
    const account = await getStripe().accounts.create({
      type: 'express',
      country: country.toUpperCase(), // CH, US, DE, etc.
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: businessType || 'individual', // individual or company
      metadata: {
        partner_id: partnerId,
        partner_name: partner.company_name || `${partner.first_name} ${partner.last_name}`,
        platform: 'PrivateCharterX'
      }
    });

    // Save account ID to database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_connect_account_id: account.id,
        stripe_account_type: 'express',
        stripe_country: country.toUpperCase(),
        stripe_verification_status: 'unverified',
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId);

    if (updateError) {
      console.error('Failed to save Stripe account ID:', updateError);
      // Account created but DB update failed - log for manual fix
    }

    // Create detailed tracking record
    await supabase
      .from('partner_stripe_accounts')
      .insert({
        partner_id: partnerId,
        stripe_account_id: account.id,
        account_type: 'express',
        country: country.toUpperCase(),
        currency: getCurrencyForCountry(country),
        onboarding_completed: false,
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        verification_status: 'unverified',
        payout_schedule: 'daily',
        payout_delay_days: 2
      });

    res.json({
      success: true,
      accountId: account.id,
      message: 'Stripe Connect account created successfully'
    });

  } catch (error) {
    console.error('Error creating Connect account:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 2. GET ONBOARDING LINK
 * Generate Stripe onboarding URL for partner to complete verification
 */
async function getOnboardingLink(req, res) {
  try {
    const { partnerId } = req.body;

    // Get partner's Stripe account ID
    const { data: partner, error } = await supabase
      .from('users')
      .select('stripe_connect_account_id, email')
      .eq('id', partnerId)
      .single();

    if (error || !partner?.stripe_connect_account_id) {
      return res.status(404).json({ error: 'Stripe Connect account not found' });
    }

    // Create account link for onboarding
    const accountLink = await getStripe().accountLinks.create({
      account: partner.stripe_connect_account_id,
      refresh_url: `${process.env.FRONTEND_URL}/partner-dashboard?onboarding=refresh`,
      return_url: `${process.env.FRONTEND_URL}/partner-dashboard?onboarding=complete`,
      type: 'account_onboarding'
    });

    res.json({
      success: true,
      url: accountLink.url,
      expiresAt: accountLink.expires_at
    });

  } catch (error) {
    console.error('Error creating onboarding link:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 3. GET PARTNER ACCOUNT STATUS
 * Check verification and capabilities status
 */
async function getAccountStatus(req, res) {
  try {
    const { partnerId } = req.query;

    const { data: partner, error } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', partnerId)
      .single();

    if (error || !partner?.stripe_connect_account_id) {
      return res.status(404).json({ error: 'Stripe Connect account not found' });
    }

    // Fetch account details from Stripe
    const account = await getStripe().accounts.retrieve(partner.stripe_connect_account_id);

    // Update database with latest status
    await supabase
      .from('users')
      .update({
        stripe_onboarding_completed: account.details_submitted || false,
        stripe_charges_enabled: account.charges_enabled || false,
        stripe_payouts_enabled: account.payouts_enabled || false,
        stripe_details_submitted: account.details_submitted || false,
        stripe_verification_status: getVerificationStatus(account),
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId);

    // Update detailed tracking
    await supabase
      .from('partner_stripe_accounts')
      .update({
        onboarding_completed: account.details_submitted || false,
        details_submitted: account.details_submitted || false,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        card_payments_enabled: account.capabilities?.card_payments === 'active',
        transfers_enabled: account.capabilities?.transfers === 'active',
        verification_status: getVerificationStatus(account),
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('partner_id', partnerId);

    res.json({
      success: true,
      status: {
        accountId: account.id,
        onboardingComplete: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        verificationStatus: getVerificationStatus(account),
        requirements: account.requirements,
        capabilities: account.capabilities
      }
    });

  } catch (error) {
    console.error('Error fetching account status:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 4. CREATE PARTNER BOOKING PAYMENT (Escrow)
 * Customer pays, money held in escrow (manual capture)
 * Called when customer confirms booking
 */
async function createPartnerBookingPayment(req, res) {
  try {
    const {
      bookingId,
      partnerId,
      customerId,
      amount,
      currency,
      serviceType,
      description
    } = req.body;

    // Validate
    if (!bookingId || !partnerId || !customerId || !amount || !serviceType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get partner's Stripe account ID
    const { data: partner, error: partnerError } = await supabase
      .from('users')
      .select('stripe_connect_account_id, stripe_charges_enabled')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner?.stripe_connect_account_id) {
      return res.status(404).json({ error: 'Partner Stripe account not found' });
    }

    if (!partner.stripe_charges_enabled) {
      return res.status(403).json({ error: 'Partner account not yet verified to receive payments' });
    }

    // Calculate commission
    const commissionRate = COMMISSION_RATES[serviceType] || COMMISSION_RATES['other'];
    const commissionAmount = Math.round(amount * commissionRate * 100) / 100;
    const partnerEarnings = Math.round((amount - commissionAmount) * 100) / 100;

    // Create Payment Intent with manual capture (escrow)
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: (currency || 'EUR').toLowerCase(),
      capture_method: 'manual', // ESCROW: Hold payment, don't transfer yet
      payment_method_types: ['card'],
      metadata: {
        booking_id: bookingId,
        partner_id: partnerId,
        customer_id: customerId,
        service_type: serviceType,
        commission_rate: commissionRate.toString(),
        commission_amount: commissionAmount.toString(),
        partner_earnings: partnerEarnings.toString()
      },
      description: description || `PrivateCharterX ${serviceType} booking`
    });

    // Update booking in database
    await supabase
      .from('partner_bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'held_escrow',
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        partner_earnings: partnerEarnings,
        service_type: serviceType,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Send notification to partner about new booking
    await supabase
      .from('partner_notifications')
      .insert({
        partner_id: partnerId,
        booking_id: bookingId,
        type: 'new_booking',
        title: 'New Booking Request',
        message: `You have a new ${serviceType} booking request for ${currency} ${amount.toFixed(2)}. Payment is held in escrow.`,
        read: false
      });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      commission: {
        rate: commissionRate,
        amount: commissionAmount,
        partnerEarnings: partnerEarnings
      }
    });

  } catch (error) {
    console.error('Error creating partner booking payment:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 5. PARTNER ACCEPTS BOOKING
 * Update booking status when partner accepts
 */
async function acceptBooking(req, res) {
  try {
    const { bookingId, partnerId } = req.body;

    // Get booking details
    const { data: booking, error } = await supabase
      .from('partner_bookings')
      .select('*, users!customer_id(first_name, email)')
      .eq('id', bookingId)
      .eq('partner_id', partnerId)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not in pending status' });
    }

    // Update booking status
    await supabase
      .from('partner_bookings')
      .update({
        status: 'confirmed',
        partner_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Notify customer
    await supabase
      .from('notifications')
      .insert({
        user_id: booking.customer_id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your ${booking.service_type || 'service'} booking has been confirmed! Your driver is on the way.`,
        metadata: { booking_id: bookingId },
        is_read: false
      });

    res.json({
      success: true,
      message: 'Booking accepted and customer notified'
    });

  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 6. PARTNER REJECTS BOOKING
 * Cancel booking and release escrow
 */
async function rejectBooking(req, res) {
  try {
    const { bookingId, partnerId, reason } = req.body;

    const { data: booking, error } = await supabase
      .from('partner_bookings')
      .select('*, users!customer_id(first_name, email)')
      .eq('id', bookingId)
      .eq('partner_id', partnerId)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Cancel payment intent (release escrow)
    if (booking.stripe_payment_intent_id) {
      await getStripe().paymentIntents.cancel(booking.stripe_payment_intent_id);
    }

    // Update booking
    await supabase
      .from('partner_bookings')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
        cancellation_reason: reason || 'Partner declined',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Notify customer
    await supabase
      .from('notifications')
      .insert({
        user_id: booking.customer_id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Your booking has been cancelled. ${reason ? `Reason: ${reason}` : 'The partner is unavailable.'}`,
        metadata: { booking_id: bookingId, reason },
        is_read: false
      });

    res.json({
      success: true,
      message: 'Booking rejected and payment released'
    });

  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 7. CAPTURE PAYMENT & TRANSFER TO PARTNER
 * Called when partner confirms arrival (taxi) or service completion
 * Captures escrow payment and transfers to partner minus commission
 */
async function captureAndTransferToPartner(req, res) {
  try {
    const { bookingId, partnerId } = req.body;

    // Get booking details
    const { data: booking, error } = await supabase
      .from('partner_bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('partner_id', partnerId)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.payment_status !== 'held_escrow') {
      return res.status(400).json({ error: 'Payment not in escrow status' });
    }

    // Get partner's Stripe account
    const { data: partner, error: partnerError } = await supabase
      .from('users')
      .select('stripe_connect_account_id, stripe_payouts_enabled')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner?.stripe_connect_account_id) {
      return res.status(404).json({ error: 'Partner Stripe account not found' });
    }

    if (!partner.stripe_payouts_enabled) {
      return res.status(403).json({ error: 'Partner account not yet verified for payouts' });
    }

    // 1. Capture the payment intent (money goes to platform account)
    const paymentIntent = await getStripe().paymentIntents.capture(
      booking.stripe_payment_intent_id
    );

    // 2. Calculate transfer amount (total - commission)
    const transferAmount = Math.round(booking.partner_earnings * 100); // Convert to cents

    // 3. Transfer to partner's Connect account
    const transfer = await getStripe().transfers.create({
      amount: transferAmount,
      currency: booking.currency.toLowerCase(),
      destination: partner.stripe_connect_account_id,
      description: `Booking ${bookingId} - ${booking.service_type}`,
      metadata: {
        booking_id: bookingId,
        partner_id: partnerId,
        service_type: booking.service_type,
        commission_rate: booking.commission_rate.toString(),
        commission_amount: booking.commission_amount.toString()
      }
    });

    // 4. Update booking status
    await supabase
      .from('partner_bookings')
      .update({
        status: 'in_progress',
        payment_status: 'released',
        stripe_transfer_id: transfer.id,
        stripe_transfer_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // 5. Record in partner_earnings
    await supabase
      .from('partner_earnings')
      .insert({
        partner_id: partnerId,
        booking_id: bookingId,
        gross_amount: booking.total_amount,
        commission_rate: booking.commission_rate,
        commission_amount: booking.commission_amount,
        net_amount: booking.partner_earnings,
        currency: booking.currency,
        stripe_transfer_id: transfer.id,
        stripe_transfer_status: 'completed',
        service_type: booking.service_type,
        service_description: `${booking.service_type} booking`,
        status: 'paid',
        paid_at: new Date().toISOString()
      });

    // 6. Notify partner
    await supabase
      .from('partner_notifications')
      .insert({
        partner_id: partnerId,
        booking_id: bookingId,
        type: 'payment_received',
        title: 'Payment Received',
        message: `You've received ${booking.currency} ${booking.partner_earnings.toFixed(2)} for booking #${bookingId.slice(0, 8)}. Commission: ${booking.currency} ${booking.commission_amount.toFixed(2)} (${(booking.commission_rate * 100).toFixed(0)}%)`,
        read: false
      });

    // 7. Notify customer
    await supabase
      .from('notifications')
      .insert({
        user_id: booking.customer_id,
        type: 'ride_started',
        title: booking.service_type === 'taxi' ? 'Driver Confirmed Arrival' : 'Service Started',
        message: booking.service_type === 'taxi'
          ? 'Your driver has arrived. Payment has been processed. Enjoy your ride!'
          : 'Your service has started. Payment has been processed.',
        metadata: { booking_id: bookingId },
        is_read: false
      });

    res.json({
      success: true,
      paymentCaptured: true,
      transferCompleted: true,
      transfer: {
        id: transfer.id,
        amount: booking.partner_earnings,
        currency: booking.currency,
        commission: booking.commission_amount
      }
    });

  } catch (error) {
    console.error('Error capturing and transferring payment:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 8. GET PARTNER EARNINGS
 * Fetch earnings history for partner dashboard
 */
async function getPartnerEarnings(req, res) {
  try {
    const { partnerId } = req.query;

    const { data: earnings, error } = await supabase
      .from('partner_earnings')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate totals
    const totalEarnings = earnings
      ?.filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + parseFloat(e.net_amount), 0) || 0;

    const pendingEarnings = earnings
      ?.filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + parseFloat(e.net_amount), 0) || 0;

    res.json({
      success: true,
      earnings: earnings || [],
      totals: {
        total: totalEarnings,
        pending: pendingEarnings,
        count: earnings?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching partner earnings:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 9. GENERATE STRIPE EXPRESS DASHBOARD LINK
 * Creates a login link for partner to access their Stripe Express Dashboard
 * Partners can manage: IBAN, payouts, tax forms, business details
 */
async function getExpressDashboardLink(req, res) {
  try {
    const { partnerId } = req.body;

    // Get partner's Stripe account ID
    const { data: partner, error } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', partnerId)
      .single();

    if (error || !partner?.stripe_connect_account_id) {
      return res.status(404).json({ error: 'Stripe Connect account not found' });
    }

    // Create login link for Express Dashboard
    // This is a short-lived URL (valid for a few minutes)
    const loginLink = await getStripe().accounts.createLoginLink(
      partner.stripe_connect_account_id
    );

    res.json({
      success: true,
      url: loginLink.url,
      created: loginLink.created
    });

  } catch (error) {
    console.error('Error creating Express Dashboard link:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 10. GET ADMIN STRIPE DASHBOARD LINKS
 * Provides direct links to Stripe Dashboard for admin management
 */
async function getAdminStripeDashboardLinks(req, res) {
  try {
    // These are direct links to Stripe Dashboard sections
    const dashboardLinks = {
      transfers: 'https://dashboard.stripe.com/connect/transfers',
      payouts: 'https://dashboard.stripe.com/payouts',
      disputes: 'https://dashboard.stripe.com/disputes',
      connectedAccounts: 'https://dashboard.stripe.com/connect/accounts/overview',
      payments: 'https://dashboard.stripe.com/payments',
      balances: 'https://dashboard.stripe.com/balance/overview',
      reports: 'https://dashboard.stripe.com/reports/overview',
      // For test mode, prepend /test
      testMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test')
    };

    // If in test mode, update all URLs to include /test
    if (dashboardLinks.testMode) {
      Object.keys(dashboardLinks).forEach(key => {
        if (key !== 'testMode' && typeof dashboardLinks[key] === 'string') {
          dashboardLinks[key] = dashboardLinks[key].replace(
            'https://dashboard.stripe.com',
            'https://dashboard.stripe.com/test'
          );
        }
      });
    }

    res.json({
      success: true,
      links: dashboardLinks
    });

  } catch (error) {
    console.error('Error getting admin dashboard links:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 11. ADMIN APPROVE PAYMENT
 * Admin reviews and approves payment to be captured and transferred to partner
 * Called after partner confirms service completion
 */
async function adminApprovePayment(req, res) {
  try {
    const { bookingId, partnerId, adminId } = req.body;

    // Validate admin authorization
    const { data: admin, error: adminError } = await getSupabase()
      .from('users')
      .select('user_role')
      .eq('id', adminId)
      .single();

    if (adminError || admin?.user_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await getSupabase()
      .from('partner_bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('partner_id', partnerId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.payment_status !== 'held_escrow') {
      return res.status(400).json({ error: 'Payment not in escrow status' });
    }

    // Get partner's Stripe account
    const { data: partner, error: partnerError } = await getSupabase()
      .from('users')
      .select('stripe_connect_account_id, stripe_payouts_enabled, first_name, last_name, company_name')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner?.stripe_connect_account_id) {
      return res.status(404).json({ error: 'Partner Stripe account not found' });
    }

    if (!partner.stripe_payouts_enabled) {
      return res.status(403).json({ error: 'Partner account not yet verified for payouts' });
    }

    // 1. Update booking approval status
    await getSupabase()
      .from('partner_bookings')
      .update({
        payment_approval_status: 'approved',
        payment_approved_by: adminId,
        payment_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // 2. Capture the payment intent (money goes to platform account)
    const paymentIntent = await getStripe().paymentIntents.capture(
      booking.stripe_payment_intent_id
    );

    // 3. Calculate transfer amount (total - commission)
    const transferAmount = Math.round(booking.partner_earnings * 100); // Convert to cents

    // 4. Transfer to partner's Connect account
    const transfer = await getStripe().transfers.create({
      amount: transferAmount,
      currency: (booking.currency || 'EUR').toLowerCase(),
      destination: partner.stripe_connect_account_id,
      description: `Booking ${bookingId.slice(0, 8)} - ${booking.service_type}`,
      metadata: {
        booking_id: bookingId,
        partner_id: partnerId,
        service_type: booking.service_type,
        commission_rate: booking.commission_rate.toString(),
        commission_amount: booking.commission_amount.toString(),
        approved_by: adminId
      }
    });

    // 5. Update booking status
    await getSupabase()
      .from('partner_bookings')
      .update({
        status: 'completed',
        payment_status: 'captured_transferred',
        stripe_transfer_id: transfer.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // 6. Record in partner_earnings
    await getSupabase()
      .from('partner_earnings')
      .insert({
        partner_id: partnerId,
        booking_id: bookingId,
        gross_amount: booking.total_amount,
        commission_rate: booking.commission_rate,
        commission_amount: booking.commission_amount,
        net_earnings: booking.partner_earnings,
        currency: booking.currency || 'EUR',
        service_type: booking.service_type,
        service_title: `${booking.service_type} booking`,
        stripe_transfer_id: transfer.id,
        transfer_date: new Date().toISOString(),
        status: 'paid'
      });

    // 7. Notify partner
    await getSupabase()
      .from('partner_notifications')
      .insert({
        partner_id: partnerId,
        booking_id: bookingId,
        type: 'payment_received',
        title: 'Payment Approved & Transferred',
        message: `Your payment of ${booking.currency} ${booking.partner_earnings.toFixed(2)} has been approved by admin and transferred to your account. Commission: ${booking.currency} ${booking.commission_amount.toFixed(2)} (${(booking.commission_rate * 100).toFixed(0)}%)`,
        read: false
      });

    // 8. Notify customer
    await getSupabase()
      .from('notifications')
      .insert({
        user_id: booking.customer_id,
        type: 'booking_completed',
        title: 'Service Completed',
        message: 'Your booking has been completed. Payment has been processed. Thank you for using PrivateCharterX!',
        metadata: { booking_id: bookingId },
        is_read: false
      });

    res.json({
      success: true,
      message: 'Payment approved and transferred to partner',
      transfer: {
        id: transfer.id,
        amount: booking.partner_earnings,
        currency: booking.currency,
        commission: booking.commission_amount,
        partnerName: partner.company_name || `${partner.first_name} ${partner.last_name}`
      }
    });

  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 12. ADMIN REJECT PAYMENT
 * Admin rejects payment and refunds customer
 */
async function adminRejectPayment(req, res) {
  try {
    const { bookingId, adminId, reason } = req.body;

    // Validate admin authorization
    const { data: admin, error: adminError } = await getSupabase()
      .from('users')
      .select('user_role')
      .eq('id', adminId)
      .single();

    if (adminError || admin?.user_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await getSupabase()
      .from('partner_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.payment_status !== 'held_escrow') {
      return res.status(400).json({ error: 'Payment not in escrow status' });
    }

    // Cancel payment intent (releases authorization, no charge to customer)
    if (booking.stripe_payment_intent_id) {
      await getStripe().paymentIntents.cancel(booking.stripe_payment_intent_id);
    }

    // Update booking status
    await getSupabase()
      .from('partner_bookings')
      .update({
        status: 'cancelled',
        payment_status: 'refunded',
        payment_approval_status: 'rejected',
        payment_approved_by: adminId,
        payment_approved_at: new Date().toISOString(),
        payment_rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Notify partner
    await getSupabase()
      .from('partner_notifications')
      .insert({
        partner_id: booking.partner_id,
        booking_id: bookingId,
        type: 'payment_rejected',
        title: 'Payment Rejected by Admin',
        message: `Payment for booking #${bookingId.slice(0, 8)} has been rejected. Reason: ${reason}. Customer has been refunded.`,
        read: false
      });

    // Notify customer
    await getSupabase()
      .from('notifications')
      .insert({
        user_id: booking.customer_id,
        type: 'booking_refunded',
        title: 'Booking Cancelled - Refund Issued',
        message: `Your booking has been cancelled and you have been refunded. ${reason ? `Reason: ${reason}` : ''}`,
        metadata: { booking_id: bookingId },
        is_read: false
      });

    res.json({
      success: true,
      message: 'Payment rejected and customer refunded'
    });

  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================================
// Helper Functions
// ============================================================

function getVerificationStatus(account) {
  if (!account.details_submitted) return 'unverified';
  if (account.requirements?.currently_due?.length > 0) return 'pending';
  if (account.charges_enabled && account.payouts_enabled) return 'verified';
  return 'pending';
}

function getCurrencyForCountry(country) {
  const currencyMap = {
    'CH': 'CHF',
    'US': 'USD',
    'DE': 'EUR',
    'FR': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
    'GB': 'GBP',
    'JP': 'JPY',
    'CN': 'CNY',
    'SG': 'SGD',
    'HK': 'HKD'
  };
  return currencyMap[country.toUpperCase()] || 'EUR';
}

// ============================================================
// Export Functions
// ============================================================

module.exports = {
  createConnectAccount,
  getOnboardingLink,
  getAccountStatus,
  createPartnerBookingPayment,
  acceptBooking,
  rejectBooking,
  captureAndTransferToPartner,
  getPartnerEarnings,
  getExpressDashboardLink,
  getAdminStripeDashboardLinks,
  adminApprovePayment,
  adminRejectPayment
};

// ============================================================
// Example Express.js Routes
// ============================================================
/*
const express = require('express');
const router = express.Router();

// Partner account management
router.post('/partners/create-connect-account', createConnectAccount);
router.post('/partners/onboarding-link', getOnboardingLink);
router.get('/partners/account-status', getAccountStatus);
router.post('/partners/express-dashboard-link', getExpressDashboardLink);

// Booking management
router.post('/partners/accept-booking', acceptBooking);
router.post('/partners/reject-booking', rejectBooking);

// Payment flow (DEPRECATED - replaced by admin approval)
// router.post('/partners/capture-and-transfer', captureAndTransferToPartner);
router.post('/partners/create-booking-payment', createPartnerBookingPayment);

// Earnings
router.get('/partners/earnings', getPartnerEarnings);

// Admin payment approvals (NEW)
router.post('/admin/approve-payment', adminApprovePayment);
router.post('/admin/reject-payment', adminRejectPayment);

// Admin Stripe Dashboard
router.get('/admin/stripe-dashboard-links', getAdminStripeDashboardLinks);

module.exports = router;
*/
