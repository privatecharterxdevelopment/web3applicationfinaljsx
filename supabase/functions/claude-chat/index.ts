// Supabase Edge Function for Claude AI Chat
// This keeps the API key secure on the server side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; source?: any }>
}

interface ChatRequest {
  messages: ChatMessage[]
  system?: string
  model?: string
  max_tokens?: number
  temperature?: number
  tools?: any[]
  tool_choice?: any
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the API key from Supabase secrets
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found in secrets')
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is authenticated (optional but recommended)
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      })

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Parse request body
    const body: ChatRequest = await req.json()

    const {
      messages,
      system,
      model = 'claude-sonnet-4-20250514',
      max_tokens = 4096,
      temperature = 0.7,
      tools,
      tool_choice
    } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build the request to Claude API
    const claudeRequest: any = {
      model,
      max_tokens,
      temperature,
      messages
    }

    if (system) {
      claudeRequest.system = system
    }

    if (tools && tools.length > 0) {
      claudeRequest.tools = tools
    }

    if (tool_choice) {
      claudeRequest.tool_choice = tool_choice
    }

    console.log('Sending request to Claude API...')

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      return new Response(
        JSON.stringify({
          error: 'Claude API error',
          status: response.status,
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    console.log('Claude response received successfully')

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
