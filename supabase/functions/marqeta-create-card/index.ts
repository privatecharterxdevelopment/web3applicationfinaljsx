// Marqeta Create Card Edge Function
// Creates a new virtual card for a user via Marqeta API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Marqeta API configuration
const MARQETA_BASE_URL = Deno.env.get('MARQETA_BASE_URL') || 'https://sandbox-api.marqeta.com/v3'
const MARQETA_APP_TOKEN = Deno.env.get('MARQETA_APP_TOKEN')
const MARQETA_ADMIN_TOKEN = Deno.env.get('MARQETA_ADMIN_TOKEN')
const MARQETA_CARD_PRODUCT_TOKEN = Deno.env.get('MARQETA_CARD_PRODUCT_TOKEN')

// Create basic auth header for Marqeta
const getMarqetaAuth = () => {
  const credentials = `${MARQETA_APP_TOKEN}:${MARQETA_ADMIN_TOKEN}`
  return `Basic ${btoa(credentials)}`
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from auth header
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

    const { card_type = 'VIRTUAL' } = await req.json()

    // Step 1: Check if user already has a Marqeta user token
    const { data: existingCard } = await supabaseClient
      .from('user_cards')
      .select('marqeta_user_token')
      .eq('user_id', user.id)
      .single()

    let marqetaUserToken = existingCard?.marqeta_user_token

    // Step 2: If no Marqeta user exists, create one
    if (!marqetaUserToken) {
      // Get user profile for KYC data
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: kyc } = await supabaseClient
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single()

      if (!kyc) {
        throw new Error('KYC verification required before card issuance')
      }

      // Create Marqeta user
      const createUserResponse = await fetch(`${MARQETA_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': getMarqetaAuth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: kyc.first_name,
          last_name: kyc.last_name,
          email: user.email,
          address1: profile?.address || kyc.address,
          city: profile?.city || kyc.city,
          country: profile?.country || kyc.country,
          postal_code: profile?.postal_code || kyc.postal_code,
          birth_date: kyc.date_of_birth,
          // Add more fields as required by Marqeta
        }),
      })

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json()
        console.error('Marqeta user creation failed:', errorData)
        throw new Error('Failed to create Marqeta user')
      }

      const marqetaUser = await createUserResponse.json()
      marqetaUserToken = marqetaUser.token
    }

    // Step 3: Create the card
    const createCardResponse = await fetch(`${MARQETA_BASE_URL}/cards`, {
      method: 'POST',
      headers: {
        'Authorization': getMarqetaAuth(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_token: marqetaUserToken,
        card_product_token: MARQETA_CARD_PRODUCT_TOKEN,
        // For physical cards, add fulfillment info
        ...(card_type === 'PHYSICAL' && {
          fulfillment: {
            shipping: {
              method: 'STANDARD',
              // Add address from profile
            },
          },
        }),
      }),
    })

    if (!createCardResponse.ok) {
      const errorData = await createCardResponse.json()
      console.error('Marqeta card creation failed:', errorData)
      throw new Error('Failed to create card')
    }

    const marqetaCard = await createCardResponse.json()

    // Step 4: Store card in database
    const { data: newCard, error: insertError } = await supabaseClient
      .from('user_cards')
      .insert({
        user_id: user.id,
        marqeta_user_token: marqetaUserToken,
        marqeta_card_token: marqetaCard.token,
        last_four: marqetaCard.last_four,
        card_type: card_type,
        card_status: marqetaCard.state,
        expiration_date: marqetaCard.expiration_time,
        card_product_token: MARQETA_CARD_PRODUCT_TOKEN,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing card:', insertError)
      throw new Error('Failed to store card')
    }

    return new Response(
      JSON.stringify({
        success: true,
        card: {
          id: newCard.id,
          last_four: newCard.last_four,
          card_type: newCard.card_type,
          card_status: newCard.card_status,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating card:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
