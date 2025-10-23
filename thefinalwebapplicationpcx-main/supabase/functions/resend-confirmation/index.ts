import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface ResendRequest {
  email: string;
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
    const resendData: ResendRequest = await req.json();
    const { email } = resendData;

    // Validate email
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email is required'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find user by email (unverified users only)
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, email_confirmation_sent_at, is_active, email_verified')
      .eq('email', email.trim())
      .eq('is_active', false)
      .eq('email_verified', false)
      .limit(1);

    if (userError) {
      console.error('Error finding user by email:', userError);
      // Don't reveal database errors for security
      return new Response(JSON.stringify({
        success: true,
        message: 'If the email exists and is unverified, a confirmation email has been sent.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!users || users.length === 0) {
      // Don't reveal if email exists or not for security
      return new Response(JSON.stringify({
        success: true,
        message: 'If the email exists and is unverified, a confirmation email has been sent.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    // Rate limiting: Check if confirmation email was sent recently (5 minutes)
    if (user.email_confirmation_sent_at) {
      const lastSentAt = new Date(user.email_confirmation_sent_at);
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      if (lastSentAt > fiveMinutesAgo) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Please wait 5 minutes before requesting another confirmation email.'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate new confirmation token
    const confirmationToken = crypto.randomUUID();

    // Update user with new token
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_confirmation_token: confirmationToken,
        email_confirmation_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user confirmation token:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to generate confirmation email'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send confirmation email
    const sesClient = new SESv2Client({
      region: Deno.env.get('AWS_REGION') || 'eu-north-1',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || ''
      },
      defaultsMode: 'legacy',
      maxAttempts: 3
    });

    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@www.privatecharterx.com';
    const siteUrl = Deno.env.get('SITE_URL') || 'https://privatecharterx.com';
    const verificationUrl = `${siteUrl}/verify-email?token=${confirmationToken}`;

    const emailParams = {
      FromEmailAddress: `PrivateCharterX <${fromEmail}>`,
      Destination: {
        ToAddresses: [email.trim()]
      },
      Content: {
        Simple: {
          Subject: {
            Data: 'PrivateCharterX - Email Verification',
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
                    <h2>Email Verification Required</h2>
                    <p>Hello ${user.first_name || ''},</p>
                    <p>Please verify your email address to activate your PrivateCharterX account. Click the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${verificationUrl}" 
                        style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Verify Email Address
                      </a>
                    </div>
                    <p>This verification link will expire in 24 hours.</p>
                    <p>If you did not request this email, you can safely ignore it.</p>
                    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
                    <p style="word-break: break-all;">${verificationUrl}</p>
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
      ReplyToAddresses: ['support@privatecharterx.com']
    };

    const command = new SendEmailCommand(emailParams);
    const emailResult = await sesClient.send(command);

    // Log activity
    const { error: activityError } = await supabaseAdmin
      .from('user_activity')
      .insert({
        user_id: user.id,
        action: 'confirmation_email_resent',
        description: 'User requested confirmation email resend',
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.warn('Failed to log user activity (non-critical):', activityError);
    }

    console.log(`Confirmation email resent for user: ${user.id}`, {
      messageId: emailResult.MessageId,
      email: email,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Confirmation email sent successfully.',
      confirmation_url: verificationUrl
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Resend confirmation email error:', error);
    
    let errorMessage = 'Failed to send confirmation email';
    let statusCode = 500;

    if (error.name === 'MessageRejected') {
      errorMessage = 'Email was rejected by the server';
      statusCode = 400;
    } else if (error.name === 'SendingPausedException') {
      errorMessage = 'Email service temporarily unavailable';
      statusCode = 503;
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: Deno.env.get('ENVIRONMENT') === 'development' ? error.toString() : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});