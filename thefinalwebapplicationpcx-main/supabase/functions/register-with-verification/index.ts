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
  recaptchaToken: string;
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
    const siteUrl = Deno.env.get('SITE_URL') || 'https://privatecharterx.com';
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

    // Validate required fields
    if (!email || !password || !firstName || !recaptchaToken) {
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

    // Verify reCAPTCHA token
    const recaptchaSecretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!recaptchaSecretKey) {
      console.error('reCAPTCHA secret key not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'reCAPTCHA configuration error'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${recaptchaSecretKey}&response=${recaptchaToken}`
    });

    const recaptchaResult = await recaptchaResponse.json();

    // For reCAPTCHA v3, verify success, score, and action
    if (!recaptchaResult.success) {
      console.warn('reCAPTCHA verification failed:', recaptchaResult['error-codes']);
      return new Response(JSON.stringify({
        success: false,
        error: 'reCAPTCHA verification failed. Please try again.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify score (reCAPTCHA v3 specific)
    if (recaptchaResult.score && recaptchaResult.score < 0.5) {
      console.warn('reCAPTCHA score too low:', recaptchaResult.score);
      return new Response(JSON.stringify({
        success: false,
        error: 'reCAPTCHA verification failed. Please try again.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify action matches expected value
    if (recaptchaResult.action && recaptchaResult.action !== 'register') {
      console.warn('reCAPTCHA action mismatch:', recaptchaResult.action);
      return new Response(JSON.stringify({
        success: false,
        error: 'reCAPTCHA verification failed. Please try again.'
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

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: false, // User must verify email
      user_metadata: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null
      }
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      await ensureMinimumDelay();
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create user account'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate email confirmation token
    const confirmationToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user record in public.users table
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        email_verified: false,
        is_active: false,
        is_admin: false,
        user_role: 'user',
        email_confirmation_token: confirmationToken,
        email_confirmation_sent_at: new Date().toISOString(),
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
            Data: 'Welcome to PrivateCharterX - Please verify your email',
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
                    <h2>Welcome ${firstName}!</h2>
                    <p>Thank you for creating an account with PrivateCharterX. To complete your registration, please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${verificationUrl}" 
                        style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Verify Email Address
                      </a>
                    </div>
                    <p>This verification link will expire in 24 hours.</p>
                    <p>If you did not create this account, you can safely ignore this email.</p>
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

    // Log successful registration
    console.log(`User registered successfully: ${authData.user.id}`, {
      messageId: emailResult.MessageId,
      email: email,
      timestamp: new Date().toISOString()
    });

    await ensureMinimumDelay();
    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for registering! Please check your email for verification instructions.',
      user_id: authData.user.id
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