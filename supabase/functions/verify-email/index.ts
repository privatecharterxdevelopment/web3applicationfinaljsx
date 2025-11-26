import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface VerificationRequest {
  token: string;
}

const SIGNUP_BONUS_PVCX = 100; // Signup bonus tokens

// Function to credit PVCX signup bonus
async function creditSignupBonus(supabaseAdmin: any, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First, create or update the user's PVCX balance
    const { error: balanceError } = await supabaseAdmin
      .from('user_pvcx_balances')
      .upsert({
        user_id: userId,
        balance: SIGNUP_BONUS_PVCX,
        earned_from_bookings: 0,
        earned_from_co2: 0,
        pending_withdrawal: 0,
        total_withdrawn: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (balanceError) {
      console.error('Error creating PVCX balance:', balanceError);
      return { success: false, error: balanceError.message };
    }

    // Record the transaction
    const { error: transactionError } = await supabaseAdmin
      .from('pvcx_transactions')
      .insert({
        user_id: userId,
        type: 'signup_bonus',
        amount: SIGNUP_BONUS_PVCX,
        description: 'Welcome signup bonus - 100 $PVCX tokens',
        metadata: {
          bonus_type: 'signup',
          credited_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.warn('Failed to record PVCX transaction (non-critical):', transactionError);
    }

    console.log(`Credited ${SIGNUP_BONUS_PVCX} $PVCX signup bonus to user: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error crediting signup bonus:', error);
    return { success: false, error: error.message };
  }
}

// Function to send welcome email with services
async function sendWelcomeEmail(email: string, firstName: string) {
  try {
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

    const welcomeEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome to PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a2e 100%); color: white; padding: 40px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 32px 24px; }
        .welcome-box { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; border: 1px solid #bae6fd; }
        .welcome-box h2 { color: #0369a1; margin: 0 0 8px; }
        .services-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0; }
        .service-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
        .service-icon { font-size: 32px; margin-bottom: 8px; }
        .service-title { font-weight: 600; color: #1e293b; margin: 0 0 4px; font-size: 14px; }
        .service-desc { color: #64748b; font-size: 12px; margin: 0; }
        .support-box { background: #000; color: white; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
        .support-box h3 { margin: 0 0 16px; font-size: 18px; }
        .support-item { margin: 12px 0; }
        .support-item .label { color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .support-item .value { color: white; font-size: 16px; font-weight: 600; margin-top: 4px; }
        .support-item a { color: #60a5fa; text-decoration: none; }
        .cta-button { display: inline-block; background: #000; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 8px; }
        .cta-button.outline { background: white; color: #000; border: 2px solid #000; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .social-links { margin: 16px 0; }
        .social-links a { margin: 0 8px; color: #64748b; text-decoration: none; }
        @media (max-width: 480px) {
          .services-grid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PRIVATECHARTERX</h1>
          <p>Private Aviation & Luxury Services Excellence</p>
        </div>

        <div class="content">
          <div class="welcome-box">
            <h2>Welcome Aboard, ${firstName}! ✨</h2>
            <p style="margin: 0; color: #0369a1;">Your account is now verified and ready to explore the world of luxury travel.</p>
          </div>

          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; border: 2px solid #f59e0b;">
            <div style="font-size: 40px; margin-bottom: 8px;">🎁</div>
            <h3 style="margin: 0 0 8px; color: #92400e; font-size: 20px;">Welcome Bonus Credited!</h3>
            <div style="font-size: 36px; font-weight: bold; color: #d97706; margin: 12px 0;">100 $PVCX</div>
            <p style="margin: 0; color: #92400e; font-size: 14px;">Your signup bonus tokens have been added to your account.</p>
            <p style="margin: 8px 0 0; color: #b45309; font-size: 12px;">Earn more $PVCX with every booking and CO₂ offset!</p>
          </div>

          <h3 style="text-align: center; color: #1e293b; margin-bottom: 8px;">Our Premium Services</h3>
          <p style="text-align: center; color: #64748b; margin-top: 0;">Experience unparalleled luxury across all our offerings</p>

          <div class="services-grid">
            <div class="service-card">
              <div class="service-icon">✈️</div>
              <p class="service-title">Private Jets</p>
              <p class="service-desc">Global access to 7,000+ aircraft for any destination</p>
            </div>
            <div class="service-card">
              <div class="service-icon">🚁</div>
              <p class="service-title">Helicopters</p>
              <p class="service-desc">VIP transfers, tours & time-critical transport</p>
            </div>
            <div class="service-card">
              <div class="service-icon">🛥️</div>
              <p class="service-title">Luxury Yachts</p>
              <p class="service-desc">Charter exclusive vessels worldwide</p>
            </div>
            <div class="service-card">
              <div class="service-icon">🚗</div>
              <p class="service-title">Luxury Ground</p>
              <p class="service-desc">Supercars, chauffeurs & exclusive vehicles</p>
            </div>
            <div class="service-card">
              <div class="service-icon">🎿</div>
              <p class="service-title">Adventure & Sports</p>
              <p class="service-desc">Skiing, diving & extreme experiences</p>
            </div>
            <div class="service-card">
              <div class="service-icon">🎭</div>
              <p class="service-title">Events & Experiences</p>
              <p class="service-desc">VIP access to exclusive global events</p>
            </div>
            <div class="service-card">
              <div class="service-icon">🏨</div>
              <p class="service-title">Luxury Concierge</p>
              <p class="service-desc">Hotels, dining & personalized itineraries</p>
            </div>
            <div class="service-card">
              <div class="service-icon">💎</div>
              <p class="service-title">Asset Marketplace</p>
              <p class="service-desc">Buy & sell luxury assets securely</p>
            </div>
          </div>

          <div class="support-box">
            <h3>🌍 24/7 Global Support & Booking Assistance</h3>
            <p style="margin: 0 0 20px; opacity: 0.9; font-size: 14px;">Our dedicated team is available around the clock to assist with bookings, questions, or any special requests.</p>

            <div class="support-item">
              <div class="label">24/7 Booking Hotline</div>
              <div class="value"><a href="tel:+41445118888">+41 44 511 88 88</a></div>
            </div>
            <div class="support-item">
              <div class="label">Email Support</div>
              <div class="value"><a href="mailto:support@privatecharterx.com">support@privatecharterx.com</a></div>
            </div>
            <div class="support-item">
              <div class="label">WhatsApp</div>
              <div class="value"><a href="https://wa.me/41445118888">+41 44 511 88 88</a></div>
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${siteUrl}/dashboard" class="cta-button">Explore Dashboard</a>
            <a href="${siteUrl}/request" class="cta-button outline">Request a Quote</a>
          </div>

          <p style="text-align: center; color: #64748b; font-size: 14px;">
            Whether you're planning a last-minute trip or organizing a complex multi-destination journey,
            our expert team is here to make it seamless and extraordinary.
          </p>
        </div>

        <div class="footer">
          <p style="margin: 0 0 8px;"><strong>PrivateCharterX</strong></p>
          <p style="margin: 0;">Private Aviation & Luxury Services Excellence</p>
          <div class="social-links">
            <a href="#">Instagram</a> • <a href="#">LinkedIn</a> • <a href="#">Twitter</a>
          </div>
          <p style="margin: 16px 0 0;">&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
          <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">Zurich • Dubai • Monaco • Singapore • New York</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const emailParams = {
      FromEmailAddress: `PrivateCharterX <${fromEmail}>`,
      Destination: {
        ToAddresses: [email]
      },
      Content: {
        Simple: {
          Subject: {
            Data: `Welcome to PrivateCharterX, ${firstName}! Your Luxury Journey Begins 🌟`,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: welcomeEmailHTML,
              Charset: 'UTF-8'
            }
          }
        }
      },
      ReplyToAddresses: ['support@privatecharterx.com']
    };

    const command = new SendEmailCommand(emailParams);
    const result = await sesClient.send(command);

    console.log('Welcome email sent successfully:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
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
      .select('id, email, first_name, email_confirmation_sent_at, is_active, email_verified')
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

    // Credit 100 $PVCX signup bonus to user
    const bonusResult = await creditSignupBonus(supabaseAdmin, user.id);
    if (!bonusResult.success) {
      console.warn('Failed to credit signup bonus (non-critical):', bonusResult.error);
    }

    // Send welcome email with services and support info
    const welcomeEmailResult = await sendWelcomeEmail(user.email, user.first_name || 'Valued Member');
    if (!welcomeEmailResult.success) {
      console.warn('Failed to send welcome email (non-critical):', welcomeEmailResult.error);
    }

    // Log successful verification
    console.log(`Email verified successfully for user: ${user.id}`, {
      email: user.email,
      welcomeEmailSent: welcomeEmailResult.success,
      signupBonusCredited: bonusResult.success,
      bonusAmount: SIGNUP_BONUS_PVCX,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Email verified successfully. Your account is now active.',
      user_id: user.id,
      email: user.email,
      welcomeEmailSent: welcomeEmailResult.success,
      signupBonusCredited: bonusResult.success,
      bonusAmount: bonusResult.success ? SIGNUP_BONUS_PVCX : 0
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