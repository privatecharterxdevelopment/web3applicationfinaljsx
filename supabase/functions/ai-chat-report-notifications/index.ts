import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// AWS SES v3 client for HTTP API
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportData {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  chatId?: string;
  rating: number;
  message: string;
  chatContext?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the report data from request body
    const reportData: ReportData = await req.json();

    if (!reportData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: message' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing AI chat report from:', reportData.userEmail || 'unknown');

    // Get environment variables for AWS SES
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@privatecharterx.com';
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@www.privatecharterx.com';

    // Initialize AWS SES client
    const sesClient = new SESv2Client({
      region: Deno.env.get('AWS_REGION') || 'eu-north-1',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
      defaultsMode: 'legacy',
      maxAttempts: 3,
      requestHandler: {
        requestTimeout: 30000,
        httpsAgent: undefined
      }
    });

    // Generate unique report ID
    const reportId = `RPT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Generate star rating display
    const starRating = '★'.repeat(reportData.rating) + '☆'.repeat(5 - reportData.rating);
    const ratingText = reportData.rating > 0 ? `${reportData.rating}/5` : 'Not rated';

    // Admin notification email template
    const adminEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>AI Chat Report - PrivateCharterX Admin</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #1f2937; color: white; padding: 24px; text-align: center; }
        .content { padding: 24px; }
        .report-card { background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 4px 0; }
        .detail-label { color: #6b7280; min-width: 100px; }
        .detail-value { font-weight: 600; color: #111827; }
        .user-info { background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .message-content { background-color: #f9fafb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; }
        .rating { font-size: 24px; color: #f59e0b; letter-spacing: 2px; }
        .button { display: inline-block; background-color: #1f2937; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 8px 8px 8px 0; }
        .footer { padding: 20px; background-color: #f9fafb; color: #6b7280; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-weight: 500;">AI Chat Report</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.8;">User feedback received</p>
        </div>

        <div class="content">
          <div class="report-card">
            <h3 style="margin-top: 0; color: #92400e;">Report Details</h3>

            <div class="detail-row">
              <span class="detail-label">Report ID:</span>
              <span class="detail-value">${reportId}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Rating:</span>
              <span class="detail-value"><span class="rating">${starRating}</span> ${ratingText}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Submitted:</span>
              <span class="detail-value">${new Date().toLocaleString()}</span>
            </div>

            ${reportData.chatId ? `
            <div class="detail-row">
              <span class="detail-label">Chat ID:</span>
              <span class="detail-value" style="font-family: monospace; font-size: 12px;">${reportData.chatId}</span>
            </div>
            ` : ''}
          </div>

          <div class="user-info">
            <h3 style="margin-top: 0; color: #1d4ed8;">User Information</h3>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${reportData.userName || 'Not provided'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${reportData.userEmail ? `<a href="mailto:${reportData.userEmail}">${reportData.userEmail}</a>` : 'Not provided'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${reportData.userPhone || 'Not provided'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">User ID:</span>
              <span class="detail-value" style="font-family: monospace; font-size: 11px;">${reportData.userId || 'Not logged in'}</span>
            </div>
          </div>

          <div class="message-content">
            <h3 style="margin-top: 0; color: #92400e;">User Message</h3>
            <p style="white-space: pre-wrap; margin-bottom: 0; line-height: 1.6;">${reportData.message}</p>
          </div>

          ${reportData.chatContext ? `
          <details style="margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 8px;">
            <summary style="cursor: pointer; font-weight: 600; color: #374151;">View Chat Context (last 5 messages)</summary>
            <pre style="margin-top: 12px; font-size: 11px; overflow-x: auto; white-space: pre-wrap;">${reportData.chatContext}</pre>
          </details>
          ` : ''}

          <div style="text-align: center; margin: 24px 0;">
            ${reportData.userEmail ? `<a href="mailto:${reportData.userEmail}?subject=Re: AI Chat Report ${reportId}" class="button">Reply to User</a>` : ''}
          </div>
        </div>

        <div class="footer">
          <p>PrivateCharterX AI Chat Report System</p>
          <p>Report Reference: ${reportId}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send admin notification email via AWS SES
    const adminEmailParams = {
      FromEmailAddress: `PrivateCharterX AI Chat <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [ADMIN_EMAIL],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `🚨 AI Chat Report - ${ratingText} - ${reportData.userName || reportData.userEmail || 'Anonymous'} #${reportId}`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: adminEmailHTML,
              Charset: 'UTF-8',
            },
          },
        },
      },
      ReplyToAddresses: reportData.userEmail ? [reportData.userEmail] : [ADMIN_EMAIL],
    };

    // Send email
    let adminEmailResult;
    let adminEmailError = null;

    try {
      const adminCommand = new SendEmailCommand(adminEmailParams);
      adminEmailResult = await sesClient.send(adminCommand);
      console.log('Admin notification email sent:', adminEmailResult.MessageId);
    } catch (error) {
      console.error('Failed to send admin email:', error);
      adminEmailError = error.message;
    }

    const result = {
      success: !adminEmailError,
      reportId: reportId,
      adminEmail: {
        sent: !adminEmailError,
        messageId: adminEmailResult?.MessageId || null,
        error: adminEmailError,
        to: ADMIN_EMAIL
      }
    };

    console.log('AI chat report email notification result:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: result.success ? 200 : 500
    });

  } catch (error) {
    console.error('Error in ai-chat-report-notifications function:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to send report notification',
        details: Deno.env.get('ENVIRONMENT') === 'development' ? error.toString() : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
