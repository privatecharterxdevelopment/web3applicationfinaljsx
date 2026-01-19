// Marqeta Webhook Handler
// Processes transaction events from Marqeta (JIT funding, authorizations, etc.)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Marqeta webhook signature verification
const MARQETA_WEBHOOK_SECRET = Deno.env.get('MARQETA_WEBHOOK_SECRET')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client for webhook processing
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()

    // TODO: Verify webhook signature
    // const signature = req.headers.get('x-marqeta-signature')
    // if (!verifySignature(payload, signature, MARQETA_WEBHOOK_SECRET)) {
    //   throw new Error('Invalid webhook signature')
    // }

    console.log('Marqeta webhook received:', payload.type)

    const eventType = payload.type
    const data = payload.data || payload

    switch (eventType) {
      // ==========================================
      // AUTHORIZATION EVENTS
      // ==========================================
      case 'transaction.authorization':
      case 'transaction.authorization.advice': {
        const cardToken = data.card_token
        const amount = data.amount
        const merchantName = data.merchant?.name || 'Unknown Merchant'
        const merchantCity = data.merchant?.city
        const merchantCountry = data.merchant?.country
        const mcc = data.merchant?.mcc

        // Find the card in our database
        const { data: card } = await supabaseAdmin
          .from('user_cards')
          .select('id, user_id')
          .eq('marqeta_card_token', cardToken)
          .single()

        if (!card) {
          console.error('Card not found for token:', cardToken)
          break
        }

        // Check spending limits
        // This is where JIT (Just-In-Time) funding decisions are made
        const { data: limits } = await supabaseAdmin
          .from('card_spending_limits')
          .select('*')
          .eq('card_id', card.id)
          .eq('is_active', true)

        // Check daily limit
        const dailyLimit = limits?.find(l => l.limit_type === 'DAILY')
        if (dailyLimit && (dailyLimit.current_usage + amount) > dailyLimit.amount) {
          console.log('Daily limit exceeded')
          // Return decline response to Marqeta
          // Note: For JIT, you'd return the funding decision in the response
        }

        // Insert transaction record
        await supabaseAdmin
          .from('card_transactions')
          .insert({
            card_id: card.id,
            user_id: card.user_id,
            marqeta_transaction_token: data.token,
            amount: -Math.abs(amount), // Negative for purchases
            currency: data.currency_code || 'USD',
            transaction_type: 'PURCHASE',
            status: 'PENDING',
            merchant_name: merchantName,
            merchant_city: merchantCity,
            merchant_country: merchantCountry,
            merchant_category_code: mcc,
            authorization_code: data.approval_code,
            raw_payload: data,
          })

        // Update daily spending limit usage
        if (dailyLimit) {
          await supabaseAdmin
            .from('card_spending_limits')
            .update({
              current_usage: dailyLimit.current_usage + amount,
            })
            .eq('id', dailyLimit.id)
        }

        break
      }

      // ==========================================
      // CLEARING/SETTLEMENT EVENTS
      // ==========================================
      case 'transaction.clearing': {
        const transactionToken = data.preceding_related_transaction_token || data.token

        // Update existing transaction to COMPLETED
        await supabaseAdmin
          .from('card_transactions')
          .update({
            status: 'COMPLETED',
            settled_at: new Date().toISOString(),
            amount: -Math.abs(data.amount), // Final settled amount
          })
          .eq('marqeta_transaction_token', transactionToken)

        break
      }

      // ==========================================
      // REFUND EVENTS
      // ==========================================
      case 'transaction.refund': {
        const cardToken = data.card_token
        const amount = data.amount

        const { data: card } = await supabaseAdmin
          .from('user_cards')
          .select('id, user_id')
          .eq('marqeta_card_token', cardToken)
          .single()

        if (card) {
          await supabaseAdmin
            .from('card_transactions')
            .insert({
              card_id: card.id,
              user_id: card.user_id,
              marqeta_transaction_token: data.token,
              amount: Math.abs(amount), // Positive for refunds
              currency: data.currency_code || 'USD',
              transaction_type: 'REFUND',
              status: 'COMPLETED',
              merchant_name: data.merchant?.name || 'Refund',
              raw_payload: data,
            })
        }

        break
      }

      // ==========================================
      // DECLINE EVENTS
      // ==========================================
      case 'transaction.authorization.decline': {
        const cardToken = data.card_token

        const { data: card } = await supabaseAdmin
          .from('user_cards')
          .select('id, user_id')
          .eq('marqeta_card_token', cardToken)
          .single()

        if (card) {
          await supabaseAdmin
            .from('card_transactions')
            .insert({
              card_id: card.id,
              user_id: card.user_id,
              marqeta_transaction_token: data.token,
              amount: -Math.abs(data.amount),
              currency: data.currency_code || 'USD',
              transaction_type: 'PURCHASE',
              status: 'DECLINED',
              merchant_name: data.merchant?.name || 'Unknown',
              decline_reason: data.response?.memo || 'Declined',
              raw_payload: data,
            })
        }

        break
      }

      // ==========================================
      // CARD STATE CHANGE EVENTS
      // ==========================================
      case 'card.state.activated':
      case 'card.state.suspended':
      case 'card.state.terminated': {
        const cardToken = data.card_token
        const newState = data.state

        await supabaseAdmin
          .from('user_cards')
          .update({
            card_status: newState,
            updated_at: new Date().toISOString(),
            ...(newState === 'TERMINATED' && {
              terminated_at: new Date().toISOString(),
            }),
            ...(newState === 'ACTIVE' && {
              activated_at: new Date().toISOString(),
            }),
          })
          .eq('marqeta_card_token', cardToken)

        break
      }

      // ==========================================
      // GPA (FUNDING) EVENTS
      // ==========================================
      case 'gpa.credit':
      case 'gpa.debit': {
        // GPA balance changes - useful for tracking card balance
        console.log('GPA event:', eventType, data)
        break
      }

      default:
        console.log('Unhandled webhook event type:', eventType)
    }

    // Always return 200 to acknowledge receipt
    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    // Still return 200 to prevent Marqeta from retrying
    // Log the error for investigation
    return new Response(
      JSON.stringify({ received: true, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
