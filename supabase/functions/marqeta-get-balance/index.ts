// Marqeta Get Balance Edge Function
// Retrieves card balance and details from Marqeta

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MARQETA_BASE_URL = Deno.env.get('MARQETA_BASE_URL') || 'https://sandbox-api.marqeta.com/v3'
const MARQETA_APP_TOKEN = Deno.env.get('MARQETA_APP_TOKEN')
const MARQETA_ADMIN_TOKEN = Deno.env.get('MARQETA_ADMIN_TOKEN')

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

    const { card_id } = await req.json()

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

    // Get balance from Marqeta
    const balanceResponse = await fetch(
      `${MARQETA_BASE_URL}/balances/${card.marqeta_user_token}`,
      {
        method: 'GET',
        headers: {
          'Authorization': getMarqetaAuth(),
          'Content-Type': 'application/json',
        },
      }
    )

    if (!balanceResponse.ok) {
      const errorData = await balanceResponse.json()
      console.error('Marqeta balance fetch failed:', errorData)
      throw new Error('Failed to fetch balance')
    }

    const balanceData = await balanceResponse.json()

    // Get card details (for PAN reveal if needed)
    const cardDetailsResponse = await fetch(
      `${MARQETA_BASE_URL}/cards/${card.marqeta_card_token}/showpan`,
      {
        method: 'GET',
        headers: {
          'Authorization': getMarqetaAuth(),
          'Content-Type': 'application/json',
        },
      }
    )

    let cardDetails = null
    if (cardDetailsResponse.ok) {
      cardDetails = await cardDetailsResponse.json()
    }

    // Get recent transactions
    const { data: recentTransactions } = await supabaseClient
      .from('card_transactions')
      .select('*')
      .eq('card_id', card_id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate this month's spending
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: monthlyTransactions } = await supabaseClient
      .from('card_transactions')
      .select('amount')
      .eq('card_id', card_id)
      .eq('status', 'COMPLETED')
      .gte('created_at', startOfMonth.toISOString())
      .lt('amount', 0) // Only purchases (negative amounts)

    const monthlySpending = monthlyTransactions?.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    ) || 0

    return new Response(
      JSON.stringify({
        success: true,
        balance: {
          available: balanceData.gpa?.available_balance || 0,
          pending: balanceData.gpa?.pending_credits || 0,
          currency: 'USD',
        },
        card: {
          id: card.id,
          last_four: card.last_four,
          status: card.card_status,
          type: card.card_type,
          expiration_date: card.expiration_date,
          // Only include full details if requested and verified
          ...(cardDetails && {
            pan: cardDetails.pan,
            cvv: cardDetails.cvv_number,
            expiration: cardDetails.expiration,
          }),
        },
        spending: {
          this_month: monthlySpending,
        },
        recent_transactions: recentTransactions || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error fetching balance:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
