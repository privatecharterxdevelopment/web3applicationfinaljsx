// Marqeta Card Status Edge Function
// Freeze, unfreeze, or terminate a card

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

    const { card_id, state, reason_code = 'USER_REQUESTED' } = await req.json()

    // Validate state
    const validStates = ['ACTIVE', 'SUSPENDED', 'TERMINATED']
    if (!validStates.includes(state)) {
      throw new Error(`Invalid state. Must be one of: ${validStates.join(', ')}`)
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

    // Call Marqeta API to transition card state
    const transitionResponse = await fetch(
      `${MARQETA_BASE_URL}/cardtransitions`,
      {
        method: 'POST',
        headers: {
          'Authorization': getMarqetaAuth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_token: card.marqeta_card_token,
          state: state,
          reason_code: reason_code,
          channel: 'API',
        }),
      }
    )

    if (!transitionResponse.ok) {
      const errorData = await transitionResponse.json()
      console.error('Marqeta card transition failed:', errorData)
      throw new Error('Failed to update card status')
    }

    const transitionResult = await transitionResponse.json()

    // Update card status in database
    const updateData: any = {
      card_status: state,
      updated_at: new Date().toISOString(),
    }

    if (state === 'TERMINATED') {
      updateData.terminated_at = new Date().toISOString()
    }

    const { error: updateError } = await supabaseClient
      .from('user_cards')
      .update(updateData)
      .eq('id', card_id)

    if (updateError) {
      console.error('Error updating card status in DB:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        card_status: state,
        message: state === 'SUSPENDED'
          ? 'Card has been frozen'
          : state === 'ACTIVE'
            ? 'Card has been unfrozen'
            : 'Card has been terminated',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error updating card status:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
