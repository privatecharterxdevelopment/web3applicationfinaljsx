/**
 * Stripe Subscription Webhook Handler
 *
 * Handles subscription-related Stripe events:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - checkout.session.completed
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

// Lazy initialization
let stripe;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

const { createClient } = require('@supabase/supabase-js');

let supabase;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

// Chat limits for each tier - MUST match Subscriptionplans.jsx and SubscriptionModal.jsx
// Updated 2025 pricing: Essential ($19), Explorer ($99), Traveller ($199), Elite ($999)
const TIER_CHAT_LIMITS = {
  essential: 10,   // $19/mo - 10 AI chats, 5 messages per chat (uses Haiku)
  explorer: 5,     // $99/mo - 5 AI chats, 10 messages per chat
  traveller: 10,   // $199/mo - 10 AI chats, 25 messages per chat
  elite: null,     // $999/mo - unlimited chats and messages
  // Legacy tiers (for backwards compatibility)
  starter: 5,
  pro: 10,
};

// Price amounts to tier mapping (in cents) for Payment Links
// This maps the subscription price to the correct tier
const PRICE_TO_TIER = {
  1900: 'essential',   // $19.00 - Essential Basic (Haiku)
  9900: 'explorer',    // $99.00
  19900: 'traveller',  // $199.00
  99900: 'elite',      // $999.00
  // Legacy prices
  4900: 'explorer',    // $49.00 (old explorer price)
  39900: 'elite',      // $399.00 (old elite price)
  2000: 'starter',     // $20.00
  4000: 'pro',         // $40.00
};

const WEBHOOK_SECRET = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Main webhook handler
 */
async function handleStripeSubscriptionWebhook(req, res) {
  console.log('[Subscription Webhook] Received webhook request');
  console.log('[Subscription Webhook] Webhook secret configured:', !!WEBHOOK_SECRET);
  console.log('[Subscription Webhook] Stripe key configured:', !!process.env.STRIPE_SECRET_KEY);

  const sig = req.headers['stripe-signature'];
  let event;

  if (!sig) {
    console.error('[Subscription Webhook] No stripe-signature header');
    return res.status(400).send('No stripe-signature header');
  }

  if (!WEBHOOK_SECRET) {
    console.error('[Subscription Webhook] STRIPE_SUBSCRIPTION_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  try {
    // On Vercel/Express with express.raw(), the raw body is in req.body as a Buffer
    // We need to use the raw body (Buffer) for signature verification
    const rawBody = req.rawBody || req.body;

    if (!rawBody) {
      console.error('[Subscription Webhook] No request body received');
      return res.status(400).send('No request body');
    }

    event = getStripe().webhooks.constructEvent(
      rawBody,
      sig,
      WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Subscription webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Subscription Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`[Subscription Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`[Subscription Webhook] Error handling ${event.type}:`, error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdate(subscription) {
  const metadata = subscription.metadata;

  if (!metadata?.user_id) {
    console.error('[Subscription Webhook] No user_id in subscription metadata');
    return;
  }

  const tier = metadata.tier || 'explorer'; // Default to explorer if no tier specified
  const chatsLimit = TIER_CHAT_LIMITS[tier] ?? 5;
  const now = new Date();
  const periodEnd = new Date(subscription.current_period_end * 1000);

  console.log(`[Subscription Webhook] Updating user ${metadata.user_id} to ${tier} tier`);

  // Update user_profiles table (single source of truth for subscriptions)
  const { error: profileError } = await getSupabase()
    .from('user_profiles')
    .upsert({
      user_id: metadata.user_id,
      subscription_tier: tier,
      subscription_status: subscription.status,
      chats_limit: chatsLimit,
      chats_used: 0, // Reset chat count on subscription update
      chats_reset_date: periodEnd.toISOString(),
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    });

  if (profileError) {
    console.error('[Subscription Webhook] user_profiles upsert error:', profileError);
  } else {
    console.log(`[Subscription Webhook] User ${metadata.user_id} updated to ${tier} with ${chatsLimit === null ? 'unlimited' : chatsLimit} chats`);
  }

  // Record subscription transaction
  await getSupabase()
    .from('subscription_transactions')
    .insert({
      user_id: metadata.user_id,
      type: subscription.status === 'active' ? 'subscription_created' : 'subscription_updated',
      tier: tier,
      amount: (subscription.items.data[0]?.price?.unit_amount || 0) / 100,
      currency: 'USD',
      stripe_subscription_id: subscription.id,
      status: 'completed',
      period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      period_end: periodEnd.toISOString(),
      description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription`,
    });
}

/**
 * Handle subscription deleted/canceled
 */
async function handleSubscriptionDeleted(subscription) {
  const now = new Date().toISOString();

  // Remove subscription access - user must resubscribe
  const { error } = await getSupabase()
    .from('user_profiles')
    .update({
      subscription_tier: null,
      subscription_status: 'canceled',
      chats_limit: 0,
      chats_reset_date: null,
      updated_at: now,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[Subscription Webhook] Error downgrading user:', error);
  }

  console.log(`[Subscription Webhook] Subscription ${subscription.id} canceled, user downgraded to explorer`);
}

/**
 * Handle checkout.session.completed
 * This fires when a user completes a Stripe Checkout or Payment Link
 *
 * Payment Links: Don't have client_reference_id, so we look up user by email
 * Checkout Sessions: Have client_reference_id with userId
 */
async function handleCheckoutCompleted(session) {
  console.log(`[Subscription Webhook] Checkout completed: ${session.id}`);
  console.log(`[Subscription Webhook] Session mode: ${session.mode}, amount: ${session.amount_total}`);

  // Skip if not a subscription
  if (!session.subscription) {
    console.log('[Subscription Webhook] Not a subscription checkout, skipping');
    return;
  }

  try {
    // Get the subscription details from Stripe
    const subscription = await getStripe().subscriptions.retrieve(session.subscription);
    const priceAmount = subscription.items.data[0]?.price?.unit_amount || session.amount_total;

    // Determine tier from price amount or metadata
    let tier = session.metadata?.tier || subscription.metadata?.tier;

    if (!tier) {
      // Map price to tier for Payment Links
      tier = PRICE_TO_TIER[priceAmount];
      console.log(`[Subscription Webhook] Mapped price ${priceAmount} to tier: ${tier}`);
    }

    if (!tier) {
      // Fallback: estimate tier from amount
      const amount = priceAmount / 100;
      if (amount >= 500) tier = 'elite';
      else if (amount >= 150) tier = 'traveller';
      else if (amount >= 50) tier = 'explorer';
      else tier = 'essential';  // $19 Essential tier
      console.log(`[Subscription Webhook] Estimated tier from amount $${amount}: ${tier}`);
    }

    // Try to find user_id from multiple sources
    let userId = null;

    // 1. Check client_reference_id (from Checkout Sessions)
    if (session.client_reference_id) {
      const [uid, tid] = session.client_reference_id.includes(':')
        ? session.client_reference_id.split(':')
        : [session.client_reference_id, null];
      userId = uid;
      if (tid && !tier) tier = tid;
      console.log(`[Subscription Webhook] Found user_id from client_reference_id: ${userId}`);
    }

    // 2. Check subscription metadata
    if (!userId && subscription.metadata?.user_id) {
      userId = subscription.metadata.user_id;
      console.log(`[Subscription Webhook] Found user_id from subscription metadata: ${userId}`);
    }

    // 3. Look up user by customer email (for Payment Links)
    if (!userId && session.customer_details?.email) {
      const customerEmail = session.customer_details.email;
      console.log(`[Subscription Webhook] Looking up user by email: ${customerEmail}`);

      // First check auth.users via Supabase
      const { data: authUser } = await getSupabase()
        .from('user_profiles')
        .select('user_id')
        .eq('email', customerEmail)
        .single();

      if (authUser?.user_id) {
        userId = authUser.user_id;
        console.log(`[Subscription Webhook] Found user_id from user_profiles by email: ${userId}`);
      } else {
        // Try to find in auth.users (if we have service role access)
        const { data: { users } } = await getSupabase().auth.admin.listUsers();
        const foundUser = users?.find(u => u.email === customerEmail);
        if (foundUser) {
          userId = foundUser.id;
          console.log(`[Subscription Webhook] Found user_id from auth.users: ${userId}`);
        }
      }
    }

    // 4. Look up by Stripe customer ID
    if (!userId && session.customer) {
      const { data: profileByCustomer } = await getSupabase()
        .from('user_profiles')
        .select('user_id')
        .eq('stripe_customer_id', session.customer)
        .single();

      if (profileByCustomer?.user_id) {
        userId = profileByCustomer.user_id;
        console.log(`[Subscription Webhook] Found user_id from stripe_customer_id: ${userId}`);
      }
    }

    if (!userId) {
      console.error('[Subscription Webhook] Could not determine user_id for checkout session');
      console.error('[Subscription Webhook] Session details:', {
        customer: session.customer,
        email: session.customer_details?.email,
        client_reference_id: session.client_reference_id
      });
      return;
    }

    // Update subscription metadata with user_id and tier
    await getStripe().subscriptions.update(session.subscription, {
      metadata: {
        user_id: userId,
        tier: tier,
      }
    });

    // Update user_profiles
    const chatsLimit = TIER_CHAT_LIMITS[tier] ?? 5;
    const periodEnd = new Date(subscription.current_period_end * 1000);

    const { error } = await getSupabase()
      .from('user_profiles')
      .upsert({
        user_id: userId,
        email: session.customer_details?.email, // Store email for future lookups
        subscription_tier: tier,
        subscription_status: 'active',
        chats_limit: chatsLimit,
        chats_used: 0,
        chats_reset_date: periodEnd.toISOString(),
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('[Subscription Webhook] Error updating user_profiles:', error);
    } else {
      console.log(`[Subscription Webhook] SUCCESS: User ${userId} subscribed to ${tier} with ${chatsLimit === null ? 'unlimited' : chatsLimit} chats`);
    }
  } catch (error) {
    console.error('[Subscription Webhook] Error in checkout completion:', error);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice) {
  console.log(`[Subscription Webhook] Payment succeeded for invoice: ${invoice.id}`);

  if (invoice.subscription) {
    // Reactivate subscription if it was past_due
    await getSupabase()
      .from('user_profiles')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription)
      .eq('subscription_status', 'past_due');
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice) {
  console.error(`[Subscription Webhook] Payment failed for invoice: ${invoice.id}`);

  if (invoice.subscription) {
    await getSupabase()
      .from('user_profiles')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription);
  }
}

module.exports = {
  handleStripeSubscriptionWebhook
};
