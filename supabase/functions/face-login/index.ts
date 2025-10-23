// Face Login Edge Function
// Creates an auth session for users who verified via Face ID

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role (admin access)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify face authentication is active for this user
    const { data: faceData, error: faceError } = await supabaseAdmin
      .from('face_authentication')
      .select('is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (faceError || !faceData) {
      console.error('Face auth not found or inactive:', faceError)
      return new Response(
        JSON.stringify({ success: false, error: 'Face authentication not registered' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get or create Supabase Auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError) {
      console.error('Auth user lookup error:', authError)
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate session token using admin API
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.email,
    })

    if (sessionError || !sessionData) {
      console.error('Session generation error:', sessionError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract access and refresh tokens from the magic link
    const url = new URL(sessionData.properties.action_link)
    const accessToken = url.searchParams.get('access_token')
    const refreshToken = url.searchParams.get('refresh_token')

    if (!accessToken || !refreshToken) {
      console.error('Tokens not found in magic link')
      return new Response(
        JSON.stringify({ success: false, error: 'Token generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return session tokens to client
    return new Response(
      JSON.stringify({
        success: true,
        session: {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: userData.id,
            email: userData.email
          }
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Face login error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
