import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// AWS SES v3 client for HTTP API
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3";
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
    // Initialize Supabase Admin client (with service role key for secure operations)
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Parse request body
    const resetRequest = await req.json();
    const { email } = resetRequest;
    // Validate required fields
    if (!email) {
      return new Response(JSON.stringify({
        error: 'Email is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        error: 'Invalid email format'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Rate limiting: Check if user has requested reset recently (prevent spam)
    const recentThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const { data: recentTokens, error: recentError } = await supabaseAdmin.from('password_reset_tokens').select('created_at').eq('user_id', (await supabaseAdmin.from('users').select('id').eq('email', email.trim()).single()).data?.id).gte('created_at', recentThreshold.toISOString()).limit(1);
    if (!recentError && recentTokens && recentTokens.length > 0) {
      return new Response(JSON.stringify({
        error: 'Password reset already requested recently. Please wait before requesting again.'
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if user exists (using admin client to bypass RLS)
    const { data: users, error: userError } = await supabaseAdmin.from('users').select('id, email').eq('email', email.trim()).limit(1);
    if (userError) {
      console.error('Error checking user:', userError);
      // Don't reveal the error, just return success for security
      return new Response(JSON.stringify({
        success: true,
        message: 'If an account with that email exists, you will receive password reset instructions.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!users || users.length === 0) {
      // Don't reveal if user exists or not for security - still return success
      console.log('Password reset requested for non-existent email:', email);
      return new Response(JSON.stringify({
        success: true,
        message: 'If an account with that email exists, you will receive password reset instructions.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const user = users[0];
    // Generate a cryptographically secure reset token server-side
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    // Invalidate any existing unused tokens for this user
    await supabaseAdmin.from('password_reset_tokens').update({
      used: true,
      used_at: new Date().toISOString()
    }).eq('user_id', user.id).eq('used', false);
    // Store the reset token in database
    const { error: tokenError } = await supabaseAdmin.from('password_reset_tokens').insert({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      used: false
    });
    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      return new Response(JSON.stringify({
        error: 'Failed to generate password reset token'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Initialize AWS SES client with explicit configuration
    const sesClient = new SESv2Client({
      region: Deno.env.get('AWS_REGION') || 'eu-north-1',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || ''
      },
      // Explicitly disable config file loading and auto-discovery
      defaultsMode: 'legacy',
      maxAttempts: 3,
      requestHandler: {
        requestTimeout: 30000,
        httpsAgent: undefined
      }
    });
    // Prepare email parameters
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@www.privatecharterx.com'; //'ipsunlorem@gmail.com'; //'no-reply@privatecharterx.com'; // must be verified in aws first
    const resetUrl = `${Deno.env.get('SITE_URL') || 'https://privatecharterx.com'}/reset-password?token=${resetToken}`;
    const emailParams = {
      FromEmailAddress: `PrivateCharterX <${fromEmail}>`,
      Destination: {
        ToAddresses: [
          email.trim()
        ]
      },
      Content: {
        Simple: {
          Subject: {
            Data: 'Reset Your Password - PrivateCharterX',
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background-color: #000; padding: 20px; text-align: center;">
                    <h1 style="color: #fff; margin: 0;">PrivateCharterX</h1>
                  </div>
                  <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
                    <h2>Reset Your Password</h2>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetUrl}" 
                        style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Reset Password
                      </a>
                    </div>
                    <p>If you did not request a password reset, you can safely ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
                    <p style="word-break: break-all;">${resetUrl}</p>
                  </div>
                  <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                    <p>&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
                  </div>
                </div>
              `,
              Charset: 'UTF-8'
            }
          }
        }
      },
      ReplyToAddresses: [
        'support@privatecharterx.com'
      ]
    };
    // Send email via AWS SES
    const command = new SendEmailCommand(emailParams);
    const result = await sesClient.send(command);
    // Log successful reset request for audit trail
    console.log(`Password reset requested for user ${user.id}`, {
      messageId: result.MessageId,
      userId: user.id,
      email: email,
      timestamp: new Date().toISOString()
    });
    return new Response(JSON.stringify({
      success: true,
      message: 'If an account with that email exists, you will receive password reset instructions.',
      messageId: result.MessageId
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    // Handle specific AWS SES errors
    let errorMessage = 'Failed to process password reset request';
    let statusCode = 500;
    if (error.name === 'MessageRejected') {
      errorMessage = 'Email was rejected by the server';
      statusCode = 400;
    } else if (error.name === 'SendingPausedException') {
      errorMessage = 'Email sending is temporarily unavailable';
      statusCode = 503;
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
