import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Initialize Supabase Admin client (with service role key)
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Parse request body
    const updateRequest = await req.json();
    const { userId, newPassword, resetToken } = updateRequest;
    // Validate required fields
    if (!userId || !newPassword || !resetToken) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId, newPassword, resetToken'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate password strength
    if (newPassword.length < 8) {
      return new Response(JSON.stringify({
        error: 'Password must be at least 8 characters long'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Double-check that the reset token is valid and unused
    const { data: tokenData, error: tokenError } = await supabaseAdmin.from('password_reset_tokens').select('user_id, used, expires_at').eq('token', resetToken).eq('user_id', userId).eq('used', false).single();
    if (tokenError || !tokenData) {
      console.error('Invalid reset token validation:', tokenError);
      return new Response(JSON.stringify({
        error: 'Invalid or expired reset token'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if token has expired (extra security)
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    if (now > expiresAt) {
      return new Response(JSON.stringify({
        error: 'Reset token has expired'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Update the user's password using admin privileges
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });
    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(JSON.stringify({
        error: 'Failed to update password'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Optional: Delete all other reset tokens for this user for security
    try {
      await supabaseAdmin.from('password_reset_tokens').delete().eq('user_id', userId);
    } catch (cleanupError) {
      console.warn('Failed to cleanup other reset tokens:', cleanupError);
      // Don't fail the request if cleanup fails
    }
    // Log the password reset for security audit
    console.log(`Password successfully reset for user ${userId}`, {
      userId,
      timestamp: new Date().toISOString(),
      resetToken: resetToken.substring(0, 8) + '...' // Log only first 8 chars for security
    });
    return new Response(JSON.stringify({
      success: true,
      message: 'Password updated successfully'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Update password error:', error);
    let errorMessage = 'Failed to update password';
    let statusCode = 500;
    if (error.message?.includes('Invalid password')) {
      errorMessage = 'Password does not meet security requirements';
      statusCode = 400;
    } else if (error.message?.includes('User not found')) {
      errorMessage = 'User account not found';
      statusCode = 404;
    }
    return new Response(JSON.stringify({
      error: errorMessage,
      details: Deno.env.get('ENVIRONMENT') === 'development' ? error.toString() : undefined
    }), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
