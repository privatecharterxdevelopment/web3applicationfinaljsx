// Marqeta Top-Up Edge Function
// Fund a card via GPA Order (General Purpose Account)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MARQETA_BASE_URL = Deno.env.get('MARQETA_BASE_URL') || 'https://sandbox-api.marqeta.com/v3'
const MARQETA_APP_TOKEN = Deno.env.get('MARQETA_APP_TOKEN')
const MARQETA_ADMIN_TOKEN = Deno.env.get('MARQETA_ADMIN_TOKEN')
const MARQETA_FUNDING_SOURCE_TOKEN = Deno.env.get('MARQETA_FUNDING_SOURCE_TOKEN')

const getMarqetaAuth = () => {
  const credentials = `${MARQETA_APP_TOKEN}:${MARQETA_ADMIN_TOKEN}`
  return `Basic ${btoa(credentials)}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const {
      card_id,
      amount,
      source_type, // 'BANK', 'CRYPTO', 'CARD'
      source_details = {},
      currency = 'USD',
    } = await req.json()

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount')
    }

    // Get card from database
    const { data: card, error: cardError } = await supabaseClient
      .from('user_cards')
      .select('*')
      .eq('id', card_id)
      .eq('user_id', user.id)
      .single()

    if (cardError || !card) {
      throw new Error('Card not found')
    }

    if (card.card_status !== 'ACTIVE') {
      throw new Error('Card is not active. Please unfreeze the card first.')
    }

    // Calculate fee based on source type
    let fee_amount = 0
    if (source_type === 'CARD') {
      fee_amount = amount * 0.015 // 1.5% for card top-ups
    }
    // Bank and Crypto typically have no or lower fees

    // Create topup record in pending state
    const { data: topupRecord, error: topupError } = await supabaseClient
      .from('card_topups')
      .insert({
        card_id: card_id,
        user_id: user.id,
        amount: amount,
        fee_amount: fee_amount,
        currency: currency,
        source_type: source_type,
        source_details: source_details,
        status: 'PROCESSING',
      })
      .select()
      .single()

    if (topupError) {
      throw new Error('Failed to create topup record')
    }

    // For crypto top-ups, we'd wait for blockchain confirmation
    // For now, proceed with GPA order for bank/card top-ups
    if (source_type === 'CRYPTO') {
      // Return payment address for user to send crypto
      // This would integrate with your crypto payment processor
      return new Response(
        JSON.stringify({
          success: true,
          topup_id: topupRecord.id,
          status: 'AWAITING_PAYMENT',
          payment_address: 'YOUR_TREASURY_WALLET_ADDRESS',
          amount_crypto: amount, // Would convert to crypto amount
          currency: 'USDC', // Or selected crypto
          message: 'Please send the specified amount to the payment address',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Create GPA Order in Marqeta to fund the card
    const gpaOrderResponse = await fetch(`${MARQETA_BASE_URL}/gpaorders`, {
      method: 'POST',
      headers: {
        'Authorization': getMarqetaAuth(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_token: card.marqeta_user_token,
        amount: amount - fee_amount, // Net amount after fees
        currency_code: currency,
        funding_source_token: MARQETA_FUNDING_SOURCE_TOKEN,
        tags: `topup:${topupRecord.id}`,
      }),
    })

    if (!gpaOrderResponse.ok) {
      const errorData = await gpaOrderResponse.json()
      console.error('Marqeta GPA order failed:', errorData)

      // Update topup record as failed
      await supabaseClient
        .from('card_topups')
        .update({
          status: 'FAILED',
          failure_reason: errorData.error_message || 'GPA order failed',
        })
        .eq('id', topupRecord.id)

      throw new Error('Failed to fund card')
    }

    const gpaOrder = await gpaOrderResponse.json()

    // Update topup record with Marqeta reference
    await supabaseClient
      .from('card_topups')
      .update({
        status: 'COMPLETED',
        marqeta_gpa_order_token: gpaOrder.token,
        completed_at: new Date().toISOString(),
      })
      .eq('id', topupRecord.id)

    // Also create a transaction record
    await supabaseClient
      .from('card_transactions')
      .insert({
        card_id: card_id,
        user_id: user.id,
        marqeta_transaction_token: gpaOrder.token,
        amount: amount - fee_amount,
        currency: currency,
        transaction_type: 'TOP_UP',
        status: 'COMPLETED',
        merchant_name: `Top-up via ${source_type}`,
        merchant_category: 'topup',
      })

    return new Response(
      JSON.stringify({
        success: true,
        topup_id: topupRecord.id,
        amount_funded: amount - fee_amount,
        fee: fee_amount,
        new_balance: gpaOrder.gpa.available_balance,
        message: 'Card funded successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error processing top-up:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
