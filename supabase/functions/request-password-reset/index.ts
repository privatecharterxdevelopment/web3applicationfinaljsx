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
    const siteUrl = Deno.env.get('SITE_URL') || 'https://web3applicationfinaljsx.vercel.app';
    const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`;

    const resetEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Reset Your Password - PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a2e 100%); color: white; padding: 32px; text-align: center; }
        .header img { height: 48px; width: auto; }
        .content { padding: 32px; }
        .reset-badge { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; display: inline-block; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
        .intro-text { font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; }
        .button { display: inline-block; background: #000; color: white; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; }
        .link-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 24px 0; word-break: break-all; font-size: 12px; color: #64748b; }
        .warning-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin: 24px 0; }
        .warning-title { font-size: 14px; font-weight: 600; color: #92400e; margin: 0 0 4px; }
        .warning-text { font-size: 13px; color: #b45309; margin: 0; }
        .support-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
        .support-title { font-size: 16px; font-weight: 600; color: #166534; margin: 0 0 8px; }
        .support-text { font-size: 14px; color: #15803d; margin: 0; }
        .support-text a { color: #166534; text-decoration: none; font-weight: 600; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png" alt="PrivateCharterX" />
        </div>

        <div class="content">
          <div style="text-align: center;">
            <span class="reset-badge">Password Reset</span>
          </div>

          <h2 style="text-align: center; font-size: 24px; color: #1e293b; margin: 16px 0;">Reset Your Password</h2>

          <p class="intro-text">
            We received a request to reset your password. Click the button below to create a new password for your PrivateCharterX account.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>

          <div class="warning-box">
            <p class="warning-title">&#9888; This link expires in 1 hour</p>
            <p class="warning-text">For security reasons, this password reset link will expire in 60 minutes. If you need a new link, please request another password reset.</p>
          </div>

          <div class="link-box">
            <strong style="color: #475569;">If the button doesn't work, copy this link:</strong><br/><br/>
            ${resetUrl}
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>

          <div class="support-box">
            <p class="support-title">Need Help?</p>
            <p class="support-text">
              Contact our support team<br/>
              <a href="mailto:support@privatecharterx.com">support@privatecharterx.com</a>
            </p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 8px;"><strong>PrivateCharterX</strong></p>
          <p style="margin: 0;">Private Aviation & Luxury Services</p>
          <p style="margin: 16px 0 0;">&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
          <p style="margin: 8px 0 0; font-size: 11px; color: #9ca3af;">
            Zurich, Switzerland | <a href="${siteUrl}/privacy" style="color: #9ca3af;">Privacy Policy</a> | <a href="${siteUrl}/terms" style="color: #9ca3af;">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

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
              Data: resetEmailHTML,
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
