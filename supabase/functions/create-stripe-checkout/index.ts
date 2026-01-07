import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chat limits for each tier - MUST match Subscriptionplans.jsx and SubscriptionModal.jsx
// Updated 2025 pricing: Essential ($19), Explorer ($99), Traveller ($199), Elite ($999)
const TIER_CONFIG: Record<string, { chats: number | null; price: number; messagesPerChat: number }> = {
  essential: { chats: 10, price: 19, messagesPerChat: 5 },      // $19/mo - 10 chats, 5 msgs/chat, Haiku AI
  starter: { chats: 10, price: 19, messagesPerChat: 5 },        // Alias for essential
  explorer: { chats: 5, price: 99, messagesPerChat: 10 },       // $99/mo - 5 chats, 10 msgs/chat
  traveller: { chats: 10, price: 199, messagesPerChat: 25 },    // $199/mo - 10 chats, 25 msgs/chat
  elite: { chats: null, price: 999, messagesPerChat: Infinity }, // $999/mo - unlimited
};

// Normalize tier name - handle 'starter' as 'essential'
const normalizeTier = (tier: string): string => {
  const lower = tier.toLowerCase();
  if (lower === 'starter') return 'essential';
  return lower;
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

    const { priceId, userId, userEmail, tier, successUrl, cancelUrl } = await req.json();

    if (!priceId || !userId || !tier) {
      throw new Error('Missing required parameters: priceId, userId, or tier');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          email: userEmail,
        }, { onConflict: 'user_id' });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.get('origin')}/subscription/success?tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/subscriptions/plans?subscription=cancelled`,
      subscription_data: {
        metadata: {
          user_id: userId,
          tier: tier,
          billing_cycle: 'monthly',
        },
      },
      metadata: {
        user_id: userId,
        tier: tier,
      },
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
