import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatSupportRequest {
  ticketId: string;
  message: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const body: ChatSupportRequest = await req.json();
    const { ticketId, message, userName, userEmail, userPhone, userId } = body;

    if (!ticketId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ticketId and message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing chat support notification for ticket:', ticketId);

    // Get environment variables
    const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') || 'support@privatecharterx.com';
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
    });

    const formatDateTime = (date: Date): string => {
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    // Support team email template
    const supportEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New Chat Support Ticket - PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: black; color: white; padding: 24px; text-align: center; }
        .content { padding: 24px; }
        .user-details { background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .message-box { background-color: #f9fafb; border-left: 4px solid black; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .detail-label { color: #6b7280; font-weight: 500; }
        .detail-value { color: #111827; font-weight: 600; }
        .footer { padding: 24px; background-color: #f9fafb; color: #6b7280; font-size: 12px; text-align: center; }
        .button { display: inline-block; background-color: black; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 8px 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">💬 New Chat Support Ticket #${ticketId}</h2>
        </div>

        <div class="content">
          <h3>User Details</h3>
          <div class="user-details">
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${userName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value"><a href="mailto:${userEmail}">${userEmail}</a></span>
            </div>
            ${userPhone ? `
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value"><a href="tel:${userPhone}">${userPhone}</a></span>
            </div>
            ` : ''}
            ${userId ? `
            <div class="detail-row">
              <span class="detail-label">User ID:</span>
              <span class="detail-value">${userId}</span>
            </div>
            ` : ''}
          </div>

          <h3>Message</h3>
          <div class="message-box">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="mailto:${userEmail}" class="button">Reply to Customer</a>
            ${userPhone ? `<a href="tel:${userPhone}" class="button">Call Customer</a>` : ''}
          </div>

          <div class="footer">
            <p>PrivateCharterX Support System</p>
            <p>Received: ${formatDateTime(new Date())}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    // User confirmation email template
    const userEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Support Request Received - PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: black; color: white; padding: 24px; text-align: center; }
        .content { padding: 24px; }
        .info-box { background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .message-box { background-color: #f9fafb; border-left: 4px solid black; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
        .footer { padding: 24px; background-color: #f9fafb; color: #6b7280; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">PrivateCharterX</h2>
          <p style="margin: 8px 0 0 0; opacity: 0.8;">Support Request Received</p>
        </div>

        <div class="content">
          <p>Hi ${userName},</p>
          <p>Thank you for contacting PrivateCharterX support. We have received your request and our team will respond within 24 hours.</p>

          <div class="info-box">
            <p style="margin: 0;"><strong>Your Ticket Number:</strong> #${ticketId}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px;">Please reference this number in any follow-up communications.</p>
          </div>

          <h3>Your Message</h3>
          <div class="message-box">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <p>If you have any urgent inquiries, please contact us directly at <a href="mailto:support@privatecharterx.com">support@privatecharterx.com</a></p>
        </div>

        <div class="footer">
          <p>PrivateCharterX - Private Aviation Excellence</p>
          <p>© ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send email to support team
    let supportEmailResult, userEmailResult;
    let supportEmailError = null;
    let userEmailError = null;

    try {
      const supportCommand = new SendEmailCommand({
        FromEmailAddress: `PrivateCharterX Support <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [SUPPORT_EMAIL] },
        Content: {
          Simple: {
            Subject: {
              Data: `💬 [Ticket #${ticketId}] New Chat Support Request from ${userName}`,
              Charset: 'UTF-8',
            },
            Body: { Html: { Data: supportEmailHTML, Charset: 'UTF-8' } },
          },
        },
        ReplyToAddresses: [userEmail],
      });
      supportEmailResult = await sesClient.send(supportCommand);
      console.log('✅ Support email sent:', supportEmailResult.MessageId);
    } catch (error) {
      console.error('Failed to send support email:', error);
      supportEmailError = error.message;
    }

    // Send confirmation to user (if they have email)
    if (userEmail && userEmail !== 'guest@privatecharterx.com') {
      try {
        const userCommand = new SendEmailCommand({
          FromEmailAddress: `PrivateCharterX <${FROM_EMAIL}>`,
          Destination: { ToAddresses: [userEmail] },
          Content: {
            Simple: {
              Subject: {
                Data: `[PrivateCharterX] Your Support Request #${ticketId}`,
                Charset: 'UTF-8',
              },
              Body: { Html: { Data: userEmailHTML, Charset: 'UTF-8' } },
            },
          },
          ReplyToAddresses: ['support@privatecharterx.com'],
        });
        userEmailResult = await sesClient.send(userCommand);
        console.log('✅ User confirmation email sent:', userEmailResult.MessageId);
      } catch (error) {
        console.error('Failed to send user email:', error);
        userEmailError = error.message;
      }
    }

    const result = {
      success: !supportEmailError,
      supportEmail: {
        sent: !supportEmailError,
        messageId: supportEmailResult?.MessageId || null,
        error: supportEmailError,
        to: SUPPORT_EMAIL
      },
      userEmail: {
        sent: !userEmailError,
        messageId: userEmailResult?.MessageId || null,
        error: userEmailError,
        to: userEmail
      },
      ticketId
    };

    console.log('Chat support notification result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 207
    });

  } catch (error) {
    console.error('Error in chat-support-notifications function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send chat support notifications', details: error.toString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
