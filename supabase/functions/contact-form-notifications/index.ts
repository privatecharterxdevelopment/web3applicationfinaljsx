import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// AWS SES v3 client for HTTP API
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
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

    // Parse the contact form data from request body
    const formData: ContactFormData = await req.json();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, subject, message' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing contact form submission from:', formData.email);

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

    // Generate unique ticket ID
    const ticketId = `PCX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Map subject codes to display names
    const subjectMapping: Record<string, string> = {
      'booking': 'Booking Inquiry',
      'payment': 'Payment Issue',
      'nft': 'NFT Membership',
      'technical': 'Technical Support',
      'complaint': 'File a Complaint',
      'feedback': 'General Feedback',
      'other': 'Other'
    };

    const subjectDisplay = subjectMapping[formData.subject] || formData.subject;

    // User confirmation email template
    const userEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Support Ticket Created - PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #000; color: white; padding: 32px; text-align: center; }
        .content { padding: 32px; }
        .ticket-card { background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; }
        .detail-value { font-weight: 600; color: #111827; }
        .message-content { background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .button { display: inline-block; background-color: #000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0; }
        .footer { padding: 32px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-weight: 300;">🎫 PrivateCharterX</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.8;">Support ticket created successfully</p>
        </div>
        
        <div class="content">
          <h2>Hello ${formData.name},</h2>
          <p>Thank you for contacting PrivateCharterX support. We have received your message and created a support ticket for you. Our team will review your inquiry and respond as soon as possible.</p>
          
          <div class="ticket-card">
            <h3 style="margin-top: 0;">Ticket Details</h3>
            
            <div class="detail-row">
              <span class="detail-label">Ticket ID</span>
              <span class="detail-value">${ticketId}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Subject</span>
              <span class="detail-value">${subjectDisplay}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Submitted</span>
              <span class="detail-value">${new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value">Under Review</span>
            </div>
            
            <div class="message-content">
              <h4 style="margin-top: 0; color: #374151;">Your Message:</h4>
              <p style="white-space: pre-wrap; margin-bottom: 0;">${formData.message}</p>
            </div>
          </div>
          
          <h3>What happens next?</h3>
          <ol>
            <li>Our support team will review your inquiry within 2 hours</li>
            <li>We'll contact you at <strong>${formData.email}</strong> with our response</li>
            <li>You can reference your ticket using ID: <strong>${ticketId}</strong></li>
            <li>For urgent matters, you can call our support line if you have NFT membership</li>
          </ol>
          
          <p><strong>Need immediate assistance?</strong> For urgent matters, NFT members can call our priority support line at +41 44 797 88 53.</p>
          
          <div style="text-align: center;">
            <a href="mailto:admin@privatecharterx.com?subject=Re: ${ticketId}" class="button">Reply to this Ticket</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated confirmation. You can reply to this email to add to your ticket.</p>
          <p>PrivateCharterX - Blockchain powered premium aviation services</p>
          <p>Ticket Reference: ${ticketId}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Admin notification email template
    const adminEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New Support Ticket - PrivateCharterX Admin</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #dc2626; color: white; padding: 32px; text-align: center; }
        .content { padding: 32px; }
        .ticket-card { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 4px 0; }
        .detail-label { color: #6b7280; min-width: 140px; }
        .detail-value { font-weight: 600; color: #111827; }
        .urgent { background-color: #dc2626; color: white; padding: 12px; border-radius: 8px; margin: 16px 0; text-align: center; }
        .contact-info { background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .message-content { background-color: #f9fafb; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 8px 8px 8px 0; }
        .priority-high { background-color: #dc2626; }
        .priority-medium { background-color: #f59e0b; }
        .priority-low { background-color: #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-weight: 600;">🎫 NEW SUPPORT TICKET</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Requires attention</p>
        </div>
        
        <div class="content">
          <div class="urgent">
            <strong>📞 ACTION REQUIRED:</strong> New support ticket received - Respond within 2 hours
          </div>
          
          <div class="ticket-card">
            <h3 style="margin-top: 0; color: #dc2626;">Ticket Information</h3>
            
            <div class="detail-row">
              <span class="detail-label">Ticket ID:</span>
              <span class="detail-value">${ticketId}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Subject:</span>
              <span class="detail-value">${subjectDisplay}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Submitted:</span>
              <span class="detail-value">${new Date().toLocaleString()}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Priority:</span>
              <span class="detail-value">${formData.subject === 'complaint' || formData.subject === 'technical' ? 'HIGH' :
        formData.subject === 'booking' || formData.subject === 'payment' ? 'MEDIUM' : 'NORMAL'
      }</span>
            </div>
          </div>
          
          <div class="contact-info">
            <h3 style="margin-top: 0; color: #1d4ed8;">Customer Information</h3>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${formData.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value"><a href="mailto:${formData.email}">${formData.email}</a></span>
            </div>
          </div>
          
          <div class="message-content">
            <h3 style="margin-top: 0; color: #dc2626;">Customer Message</h3>
            <p style="white-space: pre-wrap; margin-bottom: 0; line-height: 1.6;">${formData.message}</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="mailto:${formData.email}?subject=Re: ${ticketId} - ${subjectDisplay}" class="button">Reply to Customer</a>
            <a href="mailto:${formData.email}?cc=admin@privatecharterx.com&subject=Re: ${ticketId} - ${subjectDisplay}" class="button">Reply with CC</a>
          </div>
          
          <h3>Suggested Actions:</h3>
          <ol>
            <li><strong>Review the message</strong> and determine appropriate response</li>
            <li><strong>Respond to customer</strong> at ${formData.email} within 2 hours</li>
            <li><strong>Use ticket ID ${ticketId}</strong> in all communications</li>
            <li><strong>Escalate if needed</strong> based on subject matter</li>
            <li><strong>Follow up</strong> to ensure customer satisfaction</li>
          </ol>
          
          <h3>Quick Response Templates:</h3>
          <ul>
            <li><strong>Booking Inquiry:</strong> Thank you for your interest. We'll provide a detailed quote within 4 hours.</li>
            <li><strong>Technical Issue:</strong> We're investigating this issue and will update you within 1 hour.</li>
            <li><strong>General Support:</strong> Thank you for contacting us. We'll respond with assistance shortly.</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send user confirmation email via AWS SES
    const userEmailParams = {
      FromEmailAddress: `PrivateCharterX Support <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [formData.email],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `🎫 Support Ticket Created - ${subjectDisplay} #${ticketId}`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: userEmailHTML,
              Charset: 'UTF-8',
            },
          },
        },
      },
      ReplyToAddresses: ['admin@privatecharterx.com'],
    };

    // Send admin notification email via AWS SES
    const adminEmailParams = {
      FromEmailAddress: `PrivateCharterX Support <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [ADMIN_EMAIL],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `🎫 NEW SUPPORT TICKET - ${subjectDisplay} - ${formData.name} #${ticketId}`,
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
      ReplyToAddresses: [formData.email],
    };

    // Send both emails
    let userEmailResult, adminEmailResult;
    let userEmailError = null;
    let adminEmailError = null;

    try {
      const userCommand = new SendEmailCommand(userEmailParams);
      userEmailResult = await sesClient.send(userCommand);
      console.log('User confirmation email sent:', userEmailResult.MessageId);
    } catch (error) {
      console.error('Failed to send user email:', error);
      userEmailError = error.message;
    }

    try {
      const adminCommand = new SendEmailCommand(adminEmailParams);
      adminEmailResult = await sesClient.send(adminCommand);
      console.log('Admin notification email sent:', adminEmailResult.MessageId);
    } catch (error) {
      console.error('Failed to send admin email:', error);
      adminEmailError = error.message;
    }

    const result = {
      success: !userEmailError && !adminEmailError,
      ticketId: ticketId,
      userEmail: {
        sent: !userEmailError,
        messageId: userEmailResult?.MessageId || null,
        error: userEmailError,
        to: formData.email
      },
      adminEmail: {
        sent: !adminEmailError,
        messageId: adminEmailResult?.MessageId || null,
        error: adminEmailError,
        to: ADMIN_EMAIL
      },
      formData: {
        name: formData.name,
        email: formData.email,
        subject: subjectDisplay
      }
    };

    console.log('Contact form email notifications result:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: result.success ? 200 : 207 // 207 Multi-Status for partial success
    });

  } catch (error) {
    console.error('Error in contact-form-notifications function:', error);

    // Handle specific AWS SES errors
    let errorMessage = 'Failed to send contact form email notifications';
    let statusCode = 500;

    if (error.name === 'MessageRejected') {
      errorMessage = 'Email was rejected by the server';
      statusCode = 400;
    } else if (error.name === 'SendingPausedException') {
      errorMessage = 'Email sending is temporarily unavailable';
      statusCode = 503;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: Deno.env.get('ENVIRONMENT') === 'development' ? error.toString() : undefined
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});