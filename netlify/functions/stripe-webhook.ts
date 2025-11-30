import Stripe from 'stripe';
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!sig || !webhookSecret) {
    return {
      statusCode: 400,
      body: 'Missing signature or webhook secret',
    };
  }

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      webhookSecret
    );

    console.log(`Webhook received: ${stripeEvent.type}`);

    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(stripeEvent.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object as Stripe.Invoice);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session);
        break;
    }

    return { 
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error: any) {
    console.error('Webhook error:', error);
    return { 
      statusCode: 400,
      body: `Webhook Error: ${error.message}`
    };
  }
};

// Chat limits for each tier
const TIER_CHAT_LIMITS: Record<string, number | null> = {
  explorer: 1,
  starter: 15,
  pro: 30,
  elite: null, // unlimited
};

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const metadata = subscription.metadata;

    if (!metadata.user_id) {
      console.error('No user_id in subscription metadata');
      return;
    }

    const tier = metadata.tier || 'starter';
    const chatsLimit = TIER_CHAT_LIMITS[tier] ?? 15;
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end * 1000);

    // Update user_subscriptions table
    const { error: subError } = await supabase.from('user_subscriptions').upsert({
      user_id: metadata.user_id,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      tier: tier,
      status: subscription.status,
      billing_cycle: metadata.billing_cycle || 'monthly',
      price_eur: (subscription.items.data[0].price.unit_amount || 0) / 100,
      commission_rate: parseFloat(metadata.commission_rate || '0.15'),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: now.toISOString(),
    });

    if (subError) {
      console.error('user_subscriptions upsert error:', subError);
    }

    // Also update user_profiles table for chat limits (used by AI Chat)
    const { error: profileError } = await supabase.from('user_profiles').upsert({
      user_id: metadata.user_id,
      subscription_tier: tier,
      subscription_status: subscription.status,
      chats_limit: chatsLimit,
      chats_used: 0, // Reset chat count on subscription update
      chats_reset_date: periodEnd.toISOString(),
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    });

    if (profileError) {
      console.error('user_profiles upsert error:', profileError);
    }

    // Record subscription transaction for history
    const { error: txError } = await supabase.from('subscription_transactions').insert({
      user_id: metadata.user_id,
      type: subscription.status === 'active' ? 'subscription_created' : 'subscription_updated',
      tier: tier,
      amount: (subscription.items.data[0].price.unit_amount || 0) / 100,
      currency: 'USD',
      stripe_subscription_id: subscription.id,
      status: 'completed',
      period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      period_end: periodEnd.toISOString(),
      description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription`,
    });

    if (txError) {
      console.error('Transaction record error:', txError);
    }

    console.log(`Subscription ${subscription.id} synced to database for user ${metadata.user_id}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const now = new Date().toISOString();

    // Update user_subscriptions
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: now,
        updated_at: now,
      })
      .eq('stripe_subscription_id', subscription.id);

    if (subError) {
      console.error('user_subscriptions update error:', subError);
    }

    // Also downgrade user_profiles to explorer tier
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: 'explorer',
        subscription_status: 'canceled',
        chats_limit: 1, // Explorer tier limit
        chats_reset_date: null, // No reset for explorer
        updated_at: now,
      })
      .eq('stripe_subscription_id', subscription.id);

    if (profileError) {
      console.error('user_profiles update error:', profileError);
    }

    // Record cancellation transaction
    const metadata = subscription.metadata;
    if (metadata?.user_id) {
      await supabase.from('subscription_transactions').insert({
        user_id: metadata.user_id,
        type: 'subscription_canceled',
        tier: 'explorer',
        previous_tier: metadata.tier,
        amount: 0,
        currency: 'USD',
        stripe_subscription_id: subscription.id,
        status: 'completed',
        description: 'Subscription canceled',
      });
    }

    console.log(`Subscription ${subscription.id} marked as canceled`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  
  // Update subscription status to active if it was past_due
  if (invoice.subscription) {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription as string)
      .eq('status', 'past_due');

    if (!error) {
      console.log(`Subscription ${invoice.subscription} reactivated after payment`);
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice: ${invoice.id}`);
  
  // Update subscription status to past_due
  if (invoice.subscription) {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription as string);

    if (!error) {
      console.log(`Subscription ${invoice.subscription} marked as past_due`);
    }
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`Checkout completed: ${session.id}`);
  
  // Subscription will be handled by customer.subscription.created webhook
  // This is just for logging/tracking
}
