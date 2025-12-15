import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionEmailRequest {
  to: string;
  subject: string;
  subscriptionData: {
    id: string;
    tier: string;
    plan_name: string;
    price: number;
    currency: string;
    billing_period: string;
    status: string;
    start_date: string;
    features: string[];
    user: {
      name: string;
      email: string;
    };
    payment_method: string;
  };
  pdfBase64: string;
  pdfFilename: string;
}

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

    const body: SubscriptionEmailRequest = await req.json();
    const { to, subject, subscriptionData, pdfBase64, pdfFilename } = body;

    if (!to || !subscriptionData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to or subscriptionData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing subscription email with PDF for:', to);

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

    // Format price
    const formatPrice = (amt: number, curr: string = 'USD'): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: curr.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amt);
    };

    // Format date
    const formatDate = (dateStr: string): string => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Tier colors
    const tierColors: Record<string, string> = {
      starter: '#1a1a1a',
      pro: '#1a1a1a',
      elite: '#1a1a1a'
    };

    const tierColor = tierColors[subscriptionData.tier] || '#1a1a1a';

    // Email HTML template - monochromatic luxury design
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Subscription Confirmation - PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: #ffffff; padding: 40px 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 3px; }
        .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
        .content { padding: 40px 32px; }
        .greeting { font-size: 18px; color: #1a1a1a; margin-bottom: 24px; }
        .plan-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .plan-badge { background: #1a1a1a; color: #ffffff; display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 1px; margin-bottom: 12px; }
        .plan-name { font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px; }
        .plan-price { font-size: 18px; color: #4b5563; }
        .features-list { margin: 20px 0 0; padding: 0; list-style: none; }
        .features-list li { padding: 8px 0; color: #4b5563; display: flex; align-items: center; gap: 10px; font-size: 14px; }
        .features-list li::before { content: "✓"; color: #1a1a1a; font-weight: bold; }
        .pdf-notice { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0; display: flex; align-items: center; gap: 12px; }
        .pdf-icon { width: 40px; height: 40px; background: #1a1a1a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; }
        .pdf-text { flex: 1; }
        .pdf-text strong { display: block; color: #1a1a1a; font-size: 14px; }
        .pdf-text span { color: #6b7280; font-size: 12px; }
        .button { display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; margin-top: 24px; }
        .button:hover { background: #000000; }
        .footer { background: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; }
        .footer .company { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
        .footer .address { margin-top: 12px; }
        .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PRIVATECHARTERX</h1>
          <p>Luxury Travel Concierge</p>
        </div>

        <div class="content">
          <div class="greeting">
            Dear ${subscriptionData.user.name},
          </div>

          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for subscribing to PrivateCharterX. Your subscription has been activated and you now have access to all premium features.
          </p>

          <div class="plan-card">
            <span class="plan-badge">${subscriptionData.plan_name.toUpperCase()} PLAN</span>
            <h3 class="plan-name">${subscriptionData.plan_name}</h3>
            <p class="plan-price">${formatPrice(subscriptionData.price, subscriptionData.currency)} / ${subscriptionData.billing_period}</p>
            <ul class="features-list">
              ${subscriptionData.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>

          <div class="pdf-notice">
            <div class="pdf-icon">📄</div>
            <div class="pdf-text">
              <strong>PDF Confirmation Attached</strong>
              <span>Your subscription confirmation document is attached to this email</span>
            </div>
          </div>

          <div class="divider"></div>

          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            You can start using your premium features immediately. Access the AI Chat, Break the Price, and all exclusive benefits from your dashboard.
          </p>

          <div style="text-align: center;">
            <a href="${SITE_URL}/dashboard" class="button">Go to Dashboard</a>
          </div>
        </div>

        <div class="footer">
          <p class="company">PRIVATECHARTERX</p>
          <p>Private Aviation & Luxury Services Excellence</p>
          <p class="address">
            1000 Brickell Ave, Ste 715<br>
            Miami, FL 33131<br>
            United States of America
          </p>
          <p style="margin-top: 16px;">
            Questions? Contact us at <a href="mailto:bookings@privatecharterx.com" style="color: #1a1a1a;">bookings@privatecharterx.com</a>
          </p>
          <p style="margin-top: 16px;">&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Plain text version
    const plainText = `
PRIVATECHARTERX - Subscription Confirmation

Dear ${subscriptionData.user.name},

Thank you for subscribing to PrivateCharterX. Your ${subscriptionData.plan_name} subscription has been activated.

Subscription Details:
- Plan: ${subscriptionData.plan_name}
- Price: ${formatPrice(subscriptionData.price, subscriptionData.currency)} / ${subscriptionData.billing_period}
- Status: Active
- Start Date: ${formatDate(subscriptionData.start_date)}

Your Benefits:
${subscriptionData.features.map(f => `- ${f}`).join('\n')}

A PDF confirmation document is attached to this email.

Visit your dashboard: ${SITE_URL}/dashboard

Questions? Contact us at bookings@privatecharterx.com

---
PRIVATECHARTERX
1000 Brickell Ave, Ste 715
Miami, FL 33131
United States of America

© ${new Date().getFullYear()} PrivateCharterX. All rights reserved.
    `;

    // Create MIME email with PDF attachment
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const rawEmail = [
      `From: PrivateCharterX <${FROM_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: multipart/alternative; boundary="alt_boundary"',
      '',
      '--alt_boundary',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      plainText,
      '',
      '--alt_boundary',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      emailHTML,
      '',
      '--alt_boundary--',
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${pdfFilename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${pdfFilename}"`,
      '',
      pdfBase64,
      '',
      `--${boundary}--`
    ].join('\r\n');

    // Send email with attachment using SES raw email
    const command = new SendEmailCommand({
      FromEmailAddress: `PrivateCharterX <${FROM_EMAIL}>`,
      Destination: { ToAddresses: [to] },
      Content: {
        Raw: {
          Data: new TextEncoder().encode(rawEmail)
        }
      },
      ReplyToAddresses: ['bookings@privatecharterx.com'],
    });

    const result = await sesClient.send(command);
    console.log('Subscription email with PDF sent:', result.MessageId);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.MessageId,
        to
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending subscription email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send subscription email', details: error.toString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
