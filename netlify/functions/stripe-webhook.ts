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

// Chat limits for each tier - MUST match Subscriptionplans.jsx
const TIER_CHAT_LIMITS: Record<string, number | null> = {
  explorer: 1,
  starter: 5,    // $20/mo - 5 AI conversations
  pro: 20,       // $40/mo - 20 AI conversations
  elite: null,   // $130/mo - unlimited
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

    // Send receipt email for new subscriptions
    if (subscription.status === 'active') {
      await sendNewSubscriptionReceiptEmail(subscription);
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function sendNewSubscriptionReceiptEmail(subscription: Stripe.Subscription) {
  try {
    const metadata = subscription.metadata;
    if (!metadata?.user_id) {
      console.log('No user_id in subscription metadata, skipping receipt email');
      return;
    }

    const tier = metadata.tier || 'starter';
    const amount = (subscription.items.data[0]?.price?.unit_amount || 0) / 100;
    const currency = subscription.items.data[0]?.price?.currency?.toUpperCase() || 'USD';

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase URL or anon key for receipt email');
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/subscription-receipt-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        userId: metadata.user_id,
        tier: tier,
        amount: amount,
        currency: currency,
        billingCycle: metadata.billing_cycle || 'monthly',
        stripeSubscriptionId: subscription.id,
        periodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('New subscription receipt email sent:', result);
    } else {
      const errorText = await response.text();
      console.error('Failed to send new subscription receipt email:', errorText);
    }
  } catch (error) {
    console.error('Error sending new subscription receipt email:', error);
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

    // Send receipt email for subscription payments
    await sendSubscriptionReceiptEmail(invoice);
  }
}

async function sendSubscriptionReceiptEmail(invoice: Stripe.Invoice) {
  try {
    // Only send for subscription invoices
    if (!invoice.subscription || invoice.billing_reason === 'manual') {
      return;
    }

    // Retrieve the subscription to get metadata
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const metadata = subscription.metadata;

    if (!metadata?.user_id) {
      console.log('No user_id in subscription metadata, skipping receipt email');
      return;
    }

    const tier = metadata.tier || 'starter';
    const amount = (invoice.amount_paid || 0) / 100;
    const currency = invoice.currency?.toUpperCase() || 'USD';

    // Call Supabase Edge Function to send receipt email
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase URL or anon key for receipt email');
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/subscription-receipt-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        userId: metadata.user_id,
        tier: tier,
        amount: amount,
        currency: currency,
        billingCycle: metadata.billing_cycle || 'monthly',
        stripeSubscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        periodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Subscription receipt email sent:', result);
    } else {
      const errorText = await response.text();
      console.error('Failed to send subscription receipt email:', errorText);
    }
  } catch (error) {
    console.error('Error sending subscription receipt email:', error);
    // Don't throw - receipt email failure shouldn't break the webhook
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

  // Extract user_id and tier from client_reference_id (format: "userId:tierId")
  const clientRefId = session.client_reference_id;
  if (!clientRefId) {
    console.log('No client_reference_id in checkout session');
    return;
  }

  const [userId, tierId] = clientRefId.split(':');
  if (!userId) {
    console.log('Could not extract user_id from client_reference_id:', clientRefId);
    return;
  }

  console.log(`Checkout completed for user ${userId}, tier ${tierId || 'unknown'}`);

  // If this is a subscription checkout, update the subscription metadata
  if (session.subscription) {
    try {
      // Update subscription metadata with user_id and tier
      await stripe.subscriptions.update(session.subscription as string, {
        metadata: {
          user_id: userId,
          tier: tierId || 'starter',
        }
      });
      console.log(`Updated subscription ${session.subscription} metadata with user_id: ${userId}, tier: ${tierId}`);

      // Also directly update the database since subscription.updated will fire
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const chatsLimit = TIER_CHAT_LIMITS[tierId || 'starter'] ?? 15;
      const now = new Date();
      const periodEnd = new Date(subscription.current_period_end * 1000);

      // Update user_profiles table immediately
      const { error: profileError } = await supabase.from('user_profiles').upsert({
        user_id: userId,
        subscription_tier: tierId || 'starter',
        subscription_status: 'active',
        chats_limit: chatsLimit,
        chats_used: 0,
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
        console.error('Error updating user_profiles from checkout:', profileError);
      } else {
        console.log(`User profile updated for ${userId} with tier ${tierId}, chats_limit: ${chatsLimit}`);
      }
    } catch (error) {
      console.error('Error updating subscription metadata:', error);
    }
  }

  // Also look up user by email if no client_reference_id worked
  if (session.customer_email && !userId) {
    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', session.customer_email)
        .single();

      if (userProfile?.user_id) {
        console.log(`Found user by email ${session.customer_email}: ${userProfile.user_id}`);
        // Update the subscription metadata
        if (session.subscription) {
          await stripe.subscriptions.update(session.subscription as string, {
            metadata: {
              user_id: userProfile.user_id,
              tier: tierId || 'starter',
            }
          });
        }
      }
    } catch (error) {
      console.error('Error looking up user by email:', error);
    }
  }
}
