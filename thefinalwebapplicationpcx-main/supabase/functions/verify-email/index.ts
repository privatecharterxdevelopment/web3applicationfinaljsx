import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface VerificationRequest {
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const verificationData: VerificationRequest = await req.json();
    const { token } = verificationData;

    // Validate token
    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Confirmation token is required'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find user by confirmation token
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, email_confirmation_sent_at, is_active, email_verified')
      .eq('email_confirmation_token', token)
      .eq('is_active', false)
      .eq('email_verified', false)
      .limit(1);

    if (userError) {
      console.error('Error finding user by token:', userError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Database error'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid or expired confirmation token'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    // Check if token is expired (24 hours)
    const tokenSentAt = new Date(user.email_confirmation_sent_at);
    const now = new Date();
    const expirationTime = new Date(tokenSentAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    if (now > expirationTime) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Confirmation token has expired. Please request a new one.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update user status in public.users
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verified: true,
        is_active: true,
        email_confirmation_token: null,
        email_confirmation_sent_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user status:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to verify email'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update user in auth.users (confirm email)
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (authUpdateError) {
      console.error('Error updating auth user status:', authUpdateError);
      // Non-critical error - user is still verified in public.users
    }

    // Log user activity
    const { error: activityError } = await supabaseAdmin
      .from('user_activity')
      .insert({
        user_id: user.id,
        action: 'email_verified',
        description: 'User verified their email address',
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.warn('Failed to log user activity (non-critical):', activityError);
    }

    // Log successful verification
    console.log(`Email verified successfully for user: ${user.id}`, {
      email: user.email,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Email verified successfully. Your account is now active.',
      user_id: user.id,
      email: user.email
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'An error occurred during email verification',
      details: Deno.env.get('ENVIRONMENT') === 'development' ? error.toString() : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});