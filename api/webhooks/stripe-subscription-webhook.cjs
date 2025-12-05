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

// Chat limits for each tier - MUST match Subscriptionplans.jsx
const TIER_CHAT_LIMITS = {
  explorer: 1,
  starter: 5,    // $20/mo - 5 AI conversations
  pro: 20,       // $40/mo - 20 AI conversations
  elite: null,   // $130/mo - unlimited
};

const WEBHOOK_SECRET = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Main webhook handler
 */
async function handleStripeSubscriptionWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.rawBody || req.body,
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

  const tier = metadata.tier || 'starter';
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

  // Downgrade to explorer tier
  const { error } = await getSupabase()
    .from('user_profiles')
    .update({
      subscription_tier: 'explorer',
      subscription_status: 'canceled',
      chats_limit: 1,
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
 */
async function handleCheckoutCompleted(session) {
  console.log(`[Subscription Webhook] Checkout completed: ${session.id}`);

  // Extract user_id from client_reference_id (format: "userId" or "userId:tierId")
  const clientRefId = session.client_reference_id;
  if (!clientRefId) {
    console.log('[Subscription Webhook] No client_reference_id in checkout session');
    return;
  }

  const [userId, tierId] = clientRefId.includes(':') ? clientRefId.split(':') : [clientRefId, null];

  if (!userId) {
    console.log('[Subscription Webhook] Could not extract user_id');
    return;
  }

  // If this is a subscription checkout, update metadata and profile
  if (session.subscription) {
    try {
      // Determine tier from metadata, session, or price
      let tier = tierId;

      if (!tier && session.metadata?.tier) {
        tier = session.metadata.tier;
      }

      // Fallback: try to determine from price
      if (!tier && session.amount_total) {
        const amount = session.amount_total / 100;
        if (amount >= 100) tier = 'elite';
        else if (amount >= 30) tier = 'pro';
        else tier = 'starter';
      }

      tier = tier || 'starter';

      // Update subscription metadata with user_id and tier
      await getStripe().subscriptions.update(session.subscription, {
        metadata: {
          user_id: userId,
          tier: tier,
        }
      });

      // Update user_profiles immediately
      const subscription = await getStripe().subscriptions.retrieve(session.subscription);
      const chatsLimit = TIER_CHAT_LIMITS[tier] ?? 5;
      const periodEnd = new Date(subscription.current_period_end * 1000);

      const { error } = await getSupabase()
        .from('user_profiles')
        .upsert({
          user_id: userId,
          subscription_tier: tier,
          subscription_status: 'active',
          chats_limit: chatsLimit,
          chats_used: 0,
          chats_reset_date: periodEnd.toISOString(),
          stripe_customer_id: subscription.customer,
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
        console.log(`[Subscription Webhook] User ${userId} subscribed to ${tier} with ${chatsLimit === null ? 'unlimited' : chatsLimit} chats`);
      }
    } catch (error) {
      console.error('[Subscription Webhook] Error in checkout completion:', error);
    }
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
