import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface RegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  recaptchaToken?: string; // Optional - reCAPTCHA removed
}

// Function to send email to existing users
async function sendExistingUserEmail(email: string, firstName: string) {
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
    const siteUrl = Deno.env.get('SITE_URL') || 'https://web3applicationfinaljsx.vercel.app';
    const resetUrl = `${siteUrl}/login`;

    const emailParams = {
      FromEmailAddress: `PrivateCharterX <${fromEmail}>`,
      Destination: {
        ToAddresses: [email]
      },
      Content: {
        Simple: {
          Subject: {
            Data: 'Account Already Exists - PrivateCharterX',
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
                    <h2>Welcome back, ${firstName}!</h2>
                    <p>You tried to create a new account, but we already have an account with this email address.</p>
                    <p>If you forgot your password, you can reset it using the link below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${siteUrl}/forgot-password" 
                        style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Reset Password
                      </a>
                    </div>
                    <p>Or you can <a href="${resetUrl}" style="color: #000;">sign in here</a>.</p>
                    <p>If you didn't try to create an account, you can safely ignore this email.</p>
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
    await sesClient.send(command);

    console.log('Existing user notification sent:', email);
  } catch (error) {
    console.error('Failed to send existing user email:', error);
    // Don't throw - we don't want this to break the main flow
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  // Record start time for consistent response timing
  const startTime = Date.now();

  // Helper function to ensure minimum response time (prevent time-based attacks)
  const ensureMinimumDelay = async (minDelayMs: number = 1500) => {
    const elapsed = Date.now() - startTime;
    const remaining = minDelayMs - elapsed;
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
  };

  try {
    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const registrationData: RegistrationRequest = await req.json();
    const { email, password, firstName, lastName, phone, recaptchaToken } = registrationData;

    // Validate required fields (reCAPTCHA no longer required)
    if (!email || !password || !firstName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email format'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate password strength (must match frontend requirements)
    const passwordRequirements = [
      { test: password.length >= 8, label: 'At least 8 characters' },
      { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
      { test: /[a-z]/.test(password), label: 'One lowercase letter' },
      { test: /\d/.test(password), label: 'One number' },
      { test: /[^a-zA-Z0-9]/.test(password), label: 'One special character' }
    ];

    const failedRequirements = passwordRequirements.filter(req => !req.test);
    if (failedRequirements.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Password must meet all requirements: ${failedRequirements.map(req => req.label).join(', ')}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name')
      .eq('email', email.trim())
      .limit(1);

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      // Don't reveal the error, return generic success message for security
      await ensureMinimumDelay();
      return new Response(JSON.stringify({
        success: true,
        message: 'Thank you for registering! Please check your email for verification instructions.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (existingUsers && existingUsers.length > 0) {
      // User already exists - send them an email notification instead of revealing this
      const existingUser = existingUsers[0];
      console.log('Registration attempted for existing email:', email);

      await sendExistingUserEmail(existingUser.email, existingUser.first_name);

      // Return same success message to prevent enumeration
      await ensureMinimumDelay();
      return new Response(JSON.stringify({
        success: true,
        message: 'Thank you for registering! Please check your email for verification instructions.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create user in auth.users (auto-verified - no email verification required)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Auto-verify email - no verification required
      user_metadata: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null
      }
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      await ensureMinimumDelay();

      // Provide more specific error messages
      let errorMessage = 'Failed to create user account';
      if (authError?.message?.includes('already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (authError?.message?.includes('password')) {
        errorMessage = 'Password does not meet requirements.';
      } else if (authError?.message) {
        errorMessage = authError.message;
      }

      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create user record in public.users table (auto-verified, active immediately)
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        email_verified: true,
        is_active: true,
        is_admin: false,
        user_role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (userInsertError) {
      console.error('Error creating user record:', userInsertError);
      // Clean up auth user if public user creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await ensureMinimumDelay();
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create user profile'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create user profile with phone if provided
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        phone: phone?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.warn('Failed to create user profile (non-critical):', profileError);
    }

    // Send welcome email (non-blocking - don't wait for it)
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
    const siteUrl = Deno.env.get('SITE_URL') || 'https://web3applicationfinaljsx.vercel.app';

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
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a2e 100%); color: white; padding: 40px 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
        .header p { margin: 12px 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 32px; }
        .welcome-badge { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; display: inline-block; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
        .intro-text { font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; }
        .features-section { background: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; }
        .features-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .feature-item { background: white; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .feature-icon { font-size: 24px; margin-bottom: 8px; }
        .feature-name { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 4px; }
        .feature-desc { font-size: 12px; color: #64748b; margin: 0; }
        .tier-info { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center; }
        .tier-badge { background: #0ea5e9; color: white; display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
        .tier-name { font-size: 20px; font-weight: 700; color: #0c4a6e; margin: 8px 0; }
        .tier-feature { font-size: 14px; color: #0369a1; }
        .upgrade-hint { font-size: 12px; color: #64748b; margin-top: 12px; }
        .upgrade-hint a { color: #0ea5e9; text-decoration: none; font-weight: 600; }
        .pvcx-reward { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center; }
        .pvcx-title { font-size: 14px; font-weight: 600; color: #92400e; margin: 0 0 4px; }
        .pvcx-amount { font-size: 28px; font-weight: 700; color: #d97706; margin: 0; }
        .pvcx-desc { font-size: 12px; color: #b45309; margin: 8px 0 0; }
        .support-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
        .support-title { font-size: 16px; font-weight: 600; color: #166534; margin: 0 0 8px; }
        .support-text { font-size: 14px; color: #15803d; margin: 0; }
        .support-text a { color: #166534; text-decoration: none; font-weight: 600; }
        .button { display: inline-block; background: #000; color: white; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 8px 4px; }
        .button.secondary { background: white; color: #000; border: 2px solid #e2e8f0; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .social-links { margin: 16px 0; }
        .social-links a { display: inline-block; margin: 0 8px; color: #64748b; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to PrivateCharterX</h1>
          <p>Your gateway to luxury private aviation</p>
        </div>

        <div class="content">
          <div style="text-align: center;">
            <span class="welcome-badge">Account Created Successfully</span>
          </div>

          <h2 style="text-align: center; font-size: 24px; color: #1e293b; margin: 16px 0;">Hello ${firstName}!</h2>

          <p class="intro-text">
            Welcome to the world of exclusive private aviation. Your PrivateCharterX account is now active and ready to use.
            Experience seamless booking, competitive pricing, and white-glove service for all your travel needs.
          </p>

          <div class="features-section">
            <div class="features-title">What You Can Do</div>
            <div class="feature-grid">
              <div class="feature-item">
                <div class="feature-icon">&#9992;</div>
                <p class="feature-name">Private Jets</p>
                <p class="feature-desc">Charter flights worldwide</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">&#128296;</div>
                <p class="feature-name">Empty Legs</p>
                <p class="feature-desc">Save up to 75% on flights</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">&#128661;</div>
                <p class="feature-name">Helicopters</p>
                <p class="feature-desc">City transfers & tours</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">&#128663;</div>
                <p class="feature-name">Ground Transport</p>
                <p class="feature-desc">Luxury car service</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">&#128674;</div>
                <p class="feature-name">Yachts</p>
                <p class="feature-desc">Charter & experiences</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">&#127956;</div>
                <p class="feature-name">Adventures</p>
                <p class="feature-desc">Curated luxury trips</p>
              </div>
            </div>
          </div>

          <div class="tier-info">
            <span class="tier-badge">YOUR PLAN</span>
            <h3 class="tier-name">Explorer (Free)</h3>
            <p class="tier-feature">1 AI Chat per month included</p>
            <p class="upgrade-hint">
              Want more? <a href="${siteUrl}/subscriptions/plans">Upgrade to unlock unlimited features</a>
            </p>
          </div>

          <div class="pvcx-reward">
            <p class="pvcx-title">Welcome Bonus!</p>
            <p class="pvcx-amount">+10 $PVCX</p>
            <p class="pvcx-desc">Reward tokens credited to your account</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${siteUrl}/login" class="button">Start Exploring</a>
            <a href="${siteUrl}/subscriptions/plans" class="button secondary">View Plans</a>
          </div>

          <div class="support-box">
            <p class="support-title">Need Assistance?</p>
            <p class="support-text">
              Our concierge team is available 24/7<br/>
              <a href="mailto:support@privatecharterx.com">support@privatecharterx.com</a> | <a href="tel:+41445118888">+41 44 511 88 88</a>
            </p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 8px;"><strong>PrivateCharterX</strong></p>
          <p style="margin: 0;">Private Aviation & Luxury Services Excellence</p>
          <div class="social-links">
            <a href="#">LinkedIn</a> | <a href="#">Instagram</a> | <a href="#">Twitter</a>
          </div>
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
        ToAddresses: [email.trim()]
      },
      Content: {
        Simple: {
          Subject: {
            Data: 'Welcome to PrivateCharterX - Your Account is Ready!',
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

    // Send email in background (don't block registration)
    const command = new SendEmailCommand(emailParams);
    sesClient.send(command).catch((err: Error) => {
      console.warn('Welcome email failed to send:', err);
    });

    // Log successful registration
    console.log(`User registered successfully: ${authData.user.id}`, {
      email: email,
      timestamp: new Date().toISOString()
    });

    await ensureMinimumDelay();
    return new Response(JSON.stringify({
      success: true,
      message: 'Account created successfully! You can now sign in.',
      userId: authData.user.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Registration error:', error);

    let errorMessage = 'Registration failed. Please try again.';

    if (error.name === 'MessageRejected') {
      errorMessage = 'Email verification could not be sent';
    } else if (error.name === 'SendingPausedException') {
      errorMessage = 'Email service temporarily unavailable';
    }

    await ensureMinimumDelay();
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