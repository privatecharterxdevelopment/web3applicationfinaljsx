import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chat limits for each tier - MUST match other subscription configs
const TIER_CONFIG: Record<string, { chats: number | null; messagesPerChat: number }> = {
  explorer: { chats: 5, messagesPerChat: 10 },
  traveller: { chats: 10, messagesPerChat: 25 },
  elite: { chats: null, messagesPerChat: Infinity },
};

// Price amounts to tier mapping (in cents)
const PRICE_TO_TIER: Record<number, string> = {
  4900: 'explorer',
  9900: 'traveller',
  39900: 'elite',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const { sessionId, userId } = await req.json();

    if (!sessionId) {
      throw new Error('Missing sessionId parameter');
    }

    console.log(`Verifying subscription session: ${sessionId} for user: ${userId || 'unknown'}`);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      throw new Error('Session not found');
    }

    console.log(`Session status: ${session.status}, mode: ${session.mode}, payment_status: ${session.payment_status}`);

    // Check if it's a completed subscription checkout
    if (session.mode !== 'subscription' || session.status !== 'complete') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Session is not a completed subscription checkout',
          status: session.status,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Get subscription details
    const subscription = typeof session.subscription === 'string'
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;

    if (!subscription) {
      throw new Error('No subscription found in session');
    }

    // Determine tier from metadata or price
    let tier = session.metadata?.tier || subscription.metadata?.tier;
    const priceAmount = subscription.items.data[0]?.price?.unit_amount || session.amount_total;

    if (!tier && priceAmount) {
      tier = PRICE_TO_TIER[priceAmount];
      console.log(`Mapped price ${priceAmount} to tier: ${tier}`);
    }

    if (!tier) {
      const amount = (priceAmount || 0) / 100;
      if (amount >= 300) tier = 'elite';
      else if (amount >= 80) tier = 'traveller';
      else tier = 'explorer';
      console.log(`Estimated tier from amount $${amount}: ${tier}`);
    }

    // Determine user ID
    let finalUserId = userId;

    // Try client_reference_id first
    if (!finalUserId && session.client_reference_id) {
      const parts = session.client_reference_id.split(':');
      finalUserId = parts[0];
      console.log(`Found user_id from client_reference_id: ${finalUserId}`);
    }

    // Try subscription metadata
    if (!finalUserId && subscription.metadata?.user_id) {
      finalUserId = subscription.metadata.user_id;
      console.log(`Found user_id from subscription metadata: ${finalUserId}`);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up user by email if still no user ID
    if (!finalUserId && session.customer_details?.email) {
      const customerEmail = session.customer_details.email;
      console.log(`Looking up user by email: ${customerEmail}`);

      // Check user_profiles table
      const { data: profileByEmail } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', customerEmail)
        .single();

      if (profileByEmail?.user_id) {
        finalUserId = profileByEmail.user_id;
        console.log(`Found user_id from user_profiles by email: ${finalUserId}`);
      } else {
        // Try auth.users
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const foundUser = users?.find((u: any) => u.email === customerEmail);
        if (foundUser) {
          finalUserId = foundUser.id;
          console.log(`Found user_id from auth.users: ${finalUserId}`);
        }
      }
    }

    // Look up by Stripe customer ID
    if (!finalUserId && session.customer) {
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
      const { data: profileByCustomer } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profileByCustomer?.user_id) {
        finalUserId = profileByCustomer.user_id;
        console.log(`Found user_id from stripe_customer_id: ${finalUserId}`);
      }
    }

    if (!finalUserId) {
      console.error('Could not determine user_id for session');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not determine user for this subscription',
          sessionDetails: {
            customer: session.customer,
            email: session.customer_details?.email,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Update subscription metadata with user_id if missing
    if (!subscription.metadata?.user_id) {
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          user_id: finalUserId,
          tier: tier,
        },
      });
    }

    // Calculate chat limits and period dates
    const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.explorer;
    const periodEnd = new Date(subscription.current_period_end * 1000);
    const periodStart = new Date(subscription.current_period_start * 1000);
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    // Upsert user_profiles with subscription data
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: finalUserId,
        email: session.customer_details?.email,
        subscription_tier: tier,
        subscription_status: 'active',
        chats_limit: tierConfig.chats,
        chats_used: 0,
        chats_reset_date: periodEnd.toISOString(),
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error updating user_profiles:', profileError);
      throw new Error(`Failed to update subscription: ${profileError.message}`);
    }

    console.log(`SUCCESS: User ${finalUserId} subscribed to ${tier} tier`);

    // Record transaction
    const amount = (priceAmount || 0) / 100;
    await supabase
      .from('subscription_transactions')
      .insert({
        user_id: finalUserId,
        type: 'subscription_created',
        tier: tier,
        amount: amount,
        currency: 'USD',
        stripe_subscription_id: subscription.id,
        status: 'completed',
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription activated`,
        metadata: {
          session_id: sessionId,
          customer_email: session.customer_details?.email,
          verified_via: 'success_page',
        },
      });

    console.log(`Transaction recorded for user ${finalUserId}`);

    return new Response(
      JSON.stringify({
        success: true,
        tier: tier,
        subscription: {
          tier: tier,
          status: 'active',
          chatsLimit: tierConfig.chats,
          periodEnd: periodEnd.toISOString(),
        },
        message: `Successfully activated ${tier} subscription`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Verify subscription session error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to verify subscription session',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
