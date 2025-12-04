import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionReceiptRequest {
  userId: string;
  tier: string;
  amount: number;
  currency: string;
  billingCycle: string;
  stripeSubscriptionId: string;
  stripeInvoiceId?: string;
  periodStart: string;
  periodEnd: string;
}

// Tier display info
const TIER_INFO: Record<string, { name: string; features: string[]; color: string }> = {
  explorer: {
    name: 'Explorer',
    features: ['1 AI Chat/Month', 'Basic Search', 'Email Support'],
    color: '#6b7280',
  },
  starter: {
    name: 'Starter',
    features: ['15 AI Chats/Month', 'Priority Search', 'Email Support', '15% Commission Rate'],
    color: '#3b82f6',
  },
  pro: {
    name: 'Pro',
    features: ['30 AI Chats/Month', 'Priority Search', 'Priority Support', '12% Commission Rate', 'Exclusive Deals'],
    color: '#8b5cf6',
  },
  elite: {
    name: 'Elite',
    features: ['Unlimited AI Chats', 'VIP Search Access', '24/7 Concierge Support', '10% Commission Rate', 'First Access to Empty Legs', 'Personal Account Manager'],
    color: '#f59e0b',
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: SubscriptionReceiptRequest = await req.json();
    const { userId, tier, amount, currency, billingCycle, stripeSubscriptionId, stripeInvoiceId, periodStart, periodEnd } = body;

    if (!userId || !tier || amount === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, tier, or amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing subscription receipt email for user:', userId);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user data
    const { data: userData } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    // Also try user_profiles if users table doesn't have email
    let userEmail = userData?.email;
    let userName = `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim();

    if (!userEmail) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('user_id', userId)
        .single();
      userEmail = profileData?.email;
    }

    if (!userEmail) {
      // Try auth.users as last resort
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      userEmail = authUser?.user?.email;
      if (!userName && authUser?.user?.user_metadata) {
        userName = authUser.user.user_metadata.full_name || authUser.user.user_metadata.name || '';
      }
    }

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'No email found for user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    userName = userName || 'Valued Customer';

    // Initialize AWS SES
    const sesClient = new SESv2Client({
      region: Deno.env.get('AWS_REGION') || 'eu-north-1',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
      defaultsMode: 'legacy',
      maxAttempts: 3,
    });

    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@www.privatecharterx.com';
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://privatecharterx.com';
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'bookings@privatecharterx.com';

    // Format helpers
    const formatPrice = (amt: number, curr: string = 'USD'): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: curr.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amt);
    };

    const formatDate = (dateStr: string): string => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const tierInfo = TIER_INFO[tier] || TIER_INFO.starter;
    const invoiceNumber = `PCX-${new Date().getFullYear()}-${stripeInvoiceId?.slice(-8).toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const receiptDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // User receipt email template
    const userEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Subscription Receipt - PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a2e 100%); color: white; padding: 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
        .content { padding: 32px; }
        .success-badge { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
        .receipt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
        .receipt-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
        .receipt-number { font-size: 12px; color: #64748b; }
        .receipt-date { text-align: right; font-size: 14px; color: #64748b; }
        .plan-card { background: linear-gradient(135deg, ${tierInfo.color}15 0%, ${tierInfo.color}05 100%); border: 2px solid ${tierInfo.color}40; border-radius: 16px; padding: 24px; margin: 24px 0; }
        .plan-badge { background: ${tierInfo.color}; color: white; display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
        .plan-name { font-size: 28px; font-weight: 700; color: #1e293b; margin: 8px 0; }
        .plan-price { font-size: 20px; color: ${tierInfo.color}; font-weight: 600; }
        .features-list { margin: 16px 0 0; padding: 0; list-style: none; }
        .features-list li { padding: 6px 0; color: #4b5563; display: flex; align-items: center; gap: 8px; }
        .features-list li::before { content: "✓"; color: ${tierInfo.color}; font-weight: bold; }
        .payment-details { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .payment-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .payment-row:last-child { border-bottom: none; }
        .payment-row.total { font-weight: 700; font-size: 18px; border-top: 2px solid #e2e8f0; padding-top: 12px; margin-top: 8px; }
        .payment-label { color: #64748b; }
        .payment-value { color: #1e293b; font-weight: 500; }
        .billing-period { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center; }
        .billing-period-title { font-size: 12px; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
        .billing-period-dates { font-size: 16px; font-weight: 600; color: #1e40af; margin: 0; }
        .next-billing { font-size: 12px; color: #64748b; margin: 8px 0 0; }
        .support-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
        .button { display: inline-block; background: #000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 4px; }
        .button.outline { background: white; color: #000; border: 2px solid #000; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .legal-text { font-size: 11px; color: #9ca3af; margin-top: 16px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SUBSCRIPTION RECEIPT</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Thank you for your subscription, ${userName}!</p>
        </div>

        <div class="content">
          <div style="text-align: center;">
            <span class="success-badge">Payment Successful</span>
          </div>

          <div style="margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <p class="receipt-number">Invoice #${invoiceNumber}</p>
                <h2 class="receipt-title">Payment Receipt</h2>
              </div>
              <div class="receipt-date">
                ${receiptDate}
              </div>
            </div>
          </div>

          <div class="plan-card">
            <span class="plan-badge">${tierInfo.name.toUpperCase()} PLAN</span>
            <h3 class="plan-name">${tierInfo.name}</h3>
            <p class="plan-price">${formatPrice(amount, currency)} / ${billingCycle === 'yearly' ? 'year' : 'month'}</p>
            <ul class="features-list">
              ${tierInfo.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>

          <div class="payment-details">
            <h4 style="margin: 0 0 16px; color: #1e293b;">Payment Details</h4>
            <div class="payment-row">
              <span class="payment-label">Plan</span>
              <span class="payment-value">${tierInfo.name} (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Payment Method</span>
              <span class="payment-value">Credit Card (Stripe)</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Subscription ID</span>
              <span class="payment-value" style="font-family: monospace; font-size: 12px;">${stripeSubscriptionId.slice(-12)}</span>
            </div>
            <div class="payment-row total">
              <span>Total Charged</span>
              <span style="color: ${tierInfo.color};">${formatPrice(amount, currency)}</span>
            </div>
          </div>

          <div class="billing-period">
            <p class="billing-period-title">Current Billing Period</p>
            <p class="billing-period-dates">${formatDate(periodStart)} - ${formatDate(periodEnd)}</p>
            <p class="next-billing">Next billing date: ${formatDate(periodEnd)}</p>
          </div>

          <div class="support-box">
            <p style="margin: 0; color: #166534;">
              <strong>Need help?</strong><br/>
              Contact our support team anytime at<br/>
              <a href="mailto:support@privatecharterx.com" style="color: #15803d;">support@privatecharterx.com</a>
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${SITE_URL}/dashboard" class="button">Go to Dashboard</a>
            <a href="${SITE_URL}/subscriptions/manage" class="button outline">Manage Subscription</a>
          </div>

          <div class="legal-text">
            <p>This receipt confirms your subscription payment to PrivateCharterX. Your subscription will automatically renew at the end of each billing period unless cancelled. You can manage or cancel your subscription at any time from your account dashboard.</p>
            <p style="margin-top: 8px;">PrivateCharterX AG | Zurich, Switzerland | VAT ID: CHE-XXX.XXX.XXX</p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 8px;"><strong>PrivateCharterX</strong></p>
          <p style="margin: 0;">Private Aviation & Luxury Services Excellence</p>
          <p style="margin: 16px 0 0;">&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Admin notification email
    const adminEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Subscription - PrivateCharterX Admin</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #000; color: white; padding: 24px; text-align: center; }
        .content { padding: 24px; }
        .alert-box { background: #dcfce7; border: 2px solid #22c55e; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #64748b; }
        .detail-value { font-weight: 600; color: #1e293b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">NEW SUBSCRIPTION</h1>
          <p style="margin: 8px 0 0; opacity: 0.8;">${tierInfo.name} Plan - Payment Confirmed</p>
        </div>

        <div class="content">
          <div class="alert-box">
            <div style="font-size: 18px; font-weight: 700; color: #166534;">Payment Received: ${formatPrice(amount, currency)}</div>
            <div style="font-size: 14px; color: #15803d;">${tierInfo.name} - ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} Subscription</div>
          </div>

          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h3 style="margin: 0 0 16px; color: #1e293b;">Subscription Details</h3>
            <div class="detail-row">
              <span class="detail-label">Customer</span>
              <span class="detail-value">${userName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value"><a href="mailto:${userEmail}">${userEmail}</a></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">User ID</span>
              <span class="detail-value" style="font-family: monospace; font-size: 12px;">${userId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Plan</span>
              <span class="detail-value" style="color: ${tierInfo.color};">${tierInfo.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Billing Cycle</span>
              <span class="detail-value">${billingCycle === 'yearly' ? 'Annual' : 'Monthly'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount</span>
              <span class="detail-value">${formatPrice(amount, currency)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Period</span>
              <span class="detail-value">${formatDate(periodStart)} - ${formatDate(periodEnd)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Subscription ID</span>
              <span class="detail-value" style="font-family: monospace; font-size: 11px;">${stripeSubscriptionId}</span>
            </div>
          </div>

          <p style="color: #666; font-size: 12px; text-align: center;">Subscription activated at ${receiptDate}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send emails
    let userEmailResult, adminEmailResult;
    let userEmailError = null;
    let adminEmailError = null;

    // Send user receipt email
    try {
      const userCommand = new SendEmailCommand({
        FromEmailAddress: `PrivateCharterX <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [userEmail] },
        Content: {
          Simple: {
            Subject: {
              Data: `Payment Receipt - ${tierInfo.name} Subscription | PrivateCharterX`,
              Charset: 'UTF-8',
            },
            Body: { Html: { Data: userEmailHTML, Charset: 'UTF-8' } },
          },
        },
        ReplyToAddresses: ['support@privatecharterx.com'],
      });
      userEmailResult = await sesClient.send(userCommand);
      console.log('User subscription receipt email sent:', userEmailResult.MessageId);
    } catch (error) {
      console.error('Failed to send user email:', error);
      userEmailError = error.message;
    }

    // Send admin notification
    try {
      const adminCommand = new SendEmailCommand({
        FromEmailAddress: `PrivateCharterX Subscriptions <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [ADMIN_EMAIL] },
        Content: {
          Simple: {
            Subject: {
              Data: `NEW SUBSCRIPTION: ${tierInfo.name} - ${formatPrice(amount, currency)} - ${userName}`,
              Charset: 'UTF-8',
            },
            Body: { Html: { Data: adminEmailHTML, Charset: 'UTF-8' } },
          },
        },
        ReplyToAddresses: ['support@privatecharterx.com'],
      });
      adminEmailResult = await sesClient.send(adminCommand);
      console.log('Admin subscription notification sent:', adminEmailResult.MessageId);
    } catch (error) {
      console.error('Failed to send admin email:', error);
      adminEmailError = error.message;
    }

    const result = {
      success: !userEmailError,
      userEmail: {
        sent: !userEmailError,
        messageId: userEmailResult?.MessageId || null,
        error: userEmailError,
        to: userEmail
      },
      adminEmail: {
        sent: !adminEmailError,
        messageId: adminEmailResult?.MessageId || null,
        error: adminEmailError,
        to: ADMIN_EMAIL
      },
      userId,
      tier,
      amount,
      invoiceNumber
    };

    console.log('Subscription receipt email result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 207
    });

  } catch (error) {
    console.error('Error in subscription-receipt-email function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send subscription receipt email', details: error.toString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
