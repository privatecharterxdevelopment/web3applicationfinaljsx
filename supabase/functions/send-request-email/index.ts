import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  name?: string;
  title?: string;
  type?: string;
  price?: number;
  basePrice?: number;
  price_usd?: number;
  quantity?: number;
  from?: string;
  to?: string;
  date?: string;
}

interface RequestEmailPayload {
  to: string;
  subject?: string;
  requestData: {
    id: string;
    type: string;
    created_at: string;
    status?: string;
    user: {
      name: string;
      email: string;
    };
    details: {
      from?: string;
      to?: string;
      date?: string;
      time?: string;
      passengers?: number;
      service_type?: string;
      notes?: string;
      price?: number;
      currency?: string;
    };
    data?: {
      items?: CartItem[];
      cart_items?: CartItem[];
      summary?: {
        services_count?: number;
        extras_count?: number;
        grand_total?: number;
      };
    };
  };
  pdfBase64?: string;
  pdfFilename?: string;
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

    const body: RequestEmailPayload = await req.json();
    const { to, subject, requestData, pdfBase64, pdfFilename } = body;

    if (!to || !requestData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to or requestData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing request confirmation email for:', to);

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

    // Format date
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return '-';
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateStr;
      }
    };

    // Format request type
    const formatRequestType = (type: string): string => {
      const typeMap: Record<string, string> = {
        'ground_transport': 'Ground Transport',
        'taxi_concierge': 'Airport Transfer',
        'private_jet_charter': 'Private Jet Charter',
        'helicopter_charter': 'Helicopter Charter',
        'empty_leg': 'Empty Leg Flight',
        'luxury_car': 'Luxury Car Rental',
        'luxury_car_rental': 'Luxury Car Rental',
        'yacht_charter': 'Yacht Charter',
        'adventure_package': 'Adventure Package',
        'ai_chat_bulk': 'Concierge Request',
        'spv_formation': 'SPV Formation',
        'tokenization': 'Asset Tokenization'
      };
      return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Get service icon
    const getServiceIcon = (type: string): string => {
      const iconMap: Record<string, string> = {
        'ground_transport': '🚐',
        'taxi_concierge': '🚕',
        'private_jet_charter': '✈️',
        'helicopter_charter': '🚁',
        'empty_leg': '🛩️',
        'luxury_car': '🚗',
        'luxury_car_rental': '🚗',
        'yacht_charter': '🛥️',
        'adventure_package': '🏔️',
        'ai_chat_bulk': '💬',
        'spv_formation': '📋',
        'tokenization': '🪙'
      };
      return iconMap[type] || '📝';
    };

    const requestType = requestData.type || 'service_request';
    const formattedType = formatRequestType(requestType);
    const serviceIcon = getServiceIcon(requestType);
    const requestNumber = requestData.id?.substring(0, 8).toUpperCase() || 'N/A';
    const details = requestData.details || {};

    // Get cart items for bulk requests
    const cartItems = requestData.data?.items || requestData.data?.cart_items || [];
    const isBulkRequest = requestType === 'ai_chat_bulk' || requestType === 'cart_checkout';

    // Format cart item type
    const formatItemType = (type: string): string => {
      const typeMap: Record<string, string> = {
        'jets': '✈️ Private Jet',
        'helicopters': '🚁 Helicopter',
        'yachts': '🛥️ Yacht',
        'cars': '🚗 Luxury Car',
        'transfers': '🚐 Transfer',
        'ground_transport': '🚐 Ground Transport',
        'extras': '⭐ Extra Service',
        'custom': '📝 Custom Request'
      };
      return typeMap[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service';
    };

    const emailSubject = subject || `Request Confirmation #${requestNumber} - PrivateCharterX`;

    // Email HTML template - monochromatic luxury design
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Request Confirmation - PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: #ffffff; padding: 40px 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 3px; }
        .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
        .content { padding: 40px 32px; }
        .greeting { font-size: 18px; color: #1a1a1a; margin-bottom: 24px; }
        .status-badge { background: #4b5563; color: #ffffff; display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 1px; margin-bottom: 16px; }
        .request-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .request-type { font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px; display: flex; align-items: center; gap: 10px; }
        .request-number { font-size: 14px; color: #6b7280; margin-bottom: 16px; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-size: 13px; color: #6b7280; }
        .detail-value { font-size: 14px; color: #1a1a1a; font-weight: 500; text-align: right; max-width: 60%; }
        .timeline { margin: 24px 0; }
        .timeline-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; }
        .timeline-dot { width: 24px; height: 24px; background: #1a1a1a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; flex-shrink: 0; }
        .timeline-content { flex: 1; }
        .timeline-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
        .timeline-desc { font-size: 13px; color: #6b7280; }
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
            Dear ${requestData.user?.name || 'Valued Client'},
          </div>

          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for your request. We have received your inquiry and our team is reviewing it now.
          </p>

          <span class="status-badge">REQUEST SUBMITTED</span>

          <div class="request-card">
            <div class="request-type">${serviceIcon} ${formattedType}</div>
            <div class="request-number">Reference: #${requestNumber}</div>

            ${details.from || details.to ? `
            <div class="detail-row">
              <span class="detail-label">Route</span>
              <span class="detail-value">${details.from || '-'} → ${details.to || '-'}</span>
            </div>
            ` : ''}

            ${details.date ? `
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${formatDate(details.date)}${details.time ? ` at ${details.time}` : ''}</span>
            </div>
            ` : ''}

            ${details.passengers ? `
            <div class="detail-row">
              <span class="detail-label">Passengers</span>
              <span class="detail-value">${details.passengers}</span>
            </div>
            ` : ''}

            ${details.price && details.price > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Estimated Price</span>
              <span class="detail-value">$${details.price.toLocaleString()} ${details.currency || 'USD'}</span>
            </div>
            ` : `
            <div class="detail-row">
              <span class="detail-label">Price</span>
              <span class="detail-value">Quote Pending</span>
            </div>
            `}

            ${details.notes && !isBulkRequest ? `
            <div class="detail-row">
              <span class="detail-label">Notes</span>
              <span class="detail-value">${details.notes}</span>
            </div>
            ` : ''}
          </div>

          ${isBulkRequest && cartItems.length > 0 ? `
          <div style="margin-top: 24px;">
            <h3 style="font-size: 14px; color: #6b7280; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Requested Items</h3>
            ${cartItems.map((item: CartItem, index: number) => `
              <div style="background: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'}; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${item.name || item.title || 'Service'}</div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${formatItemType(item.type || '')}</div>
                    ${item.from && item.to ? `<div style="font-size: 12px; color: #4b5563; margin-top: 4px;">${item.from} → ${item.to}</div>` : ''}
                    ${item.date ? `<div style="font-size: 12px; color: #4b5563; margin-top: 2px;">${formatDate(item.date)}</div>` : ''}
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">$${((item.price || item.basePrice || item.price_usd || 0)).toLocaleString()}</div>
                    ${item.quantity && item.quantity > 1 ? `<div style="font-size: 11px; color: #6b7280;">Qty: ${item.quantity}</div>` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="divider"></div>

          <h3 style="font-size: 16px; color: #1a1a1a; margin-bottom: 16px;">What Happens Next</h3>

          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-dot">1</div>
              <div class="timeline-content">
                <div class="timeline-title">Request Received</div>
                <div class="timeline-desc">Your request is now in our system</div>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot">2</div>
              <div class="timeline-content">
                <div class="timeline-title">Team Review</div>
                <div class="timeline-desc">Our coordinators are reviewing your request</div>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot">3</div>
              <div class="timeline-content">
                <div class="timeline-title">Personalized Quote</div>
                <div class="timeline-desc">You'll receive a quote within 2-4 hours</div>
              </div>
            </div>
          </div>

          ${pdfBase64 ? `
          <div class="pdf-notice">
            <div class="pdf-icon">📄</div>
            <div class="pdf-text">
              <strong>PDF Confirmation Attached</strong>
              <span>Your request confirmation document is attached to this email</span>
            </div>
          </div>
          ` : ''}

          <div style="text-align: center;">
            <a href="${SITE_URL}/?category=requests" class="button">View My Requests</a>
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

    // Generate items list for plain text
    const itemsListText = isBulkRequest && cartItems.length > 0
      ? `\nREQUESTED ITEMS\n---------------\n${cartItems.map((item: CartItem, i: number) =>
          `${i + 1}. ${item.name || item.title || 'Service'}\n   Type: ${formatItemType(item.type || '')}\n   Price: $${(item.price || item.basePrice || item.price_usd || 0).toLocaleString()}${item.from && item.to ? `\n   Route: ${item.from} → ${item.to}` : ''}${item.date ? `\n   Date: ${formatDate(item.date)}` : ''}`
        ).join('\n\n')}\n`
      : '';

    // Plain text version
    const plainText = `
PRIVATECHARTERX - Request Confirmation

Dear ${requestData.user?.name || 'Valued Client'},

Thank you for your request. We have received your inquiry and our team is reviewing it now.

REQUEST DETAILS
---------------
Service: ${formattedType}
Reference: #${requestNumber}
${details.from || details.to ? `Route: ${details.from || '-'} → ${details.to || '-'}` : ''}
${details.date ? `Date: ${formatDate(details.date)}${details.time ? ` at ${details.time}` : ''}` : ''}
${details.passengers ? `Passengers: ${details.passengers}` : ''}
${details.price && details.price > 0 ? `Estimated Price: $${details.price.toLocaleString()} ${details.currency || 'USD'}` : 'Price: Quote Pending'}
${!isBulkRequest && details.notes ? `Notes: ${details.notes}` : ''}
${itemsListText}

WHAT HAPPENS NEXT
-----------------
1. Request Received - Your request is now in our system
2. Team Review - Our coordinators are reviewing your request
3. Personalized Quote - You'll receive a quote within 2-4 hours

${pdfBase64 ? 'A PDF confirmation document is attached to this email.' : ''}

View your requests: ${SITE_URL}/?category=requests

Questions? Contact us at bookings@privatecharterx.com

---
PRIVATECHARTERX
1000 Brickell Ave, Ste 715
Miami, FL 33131
United States of America

© ${new Date().getFullYear()} PrivateCharterX. All rights reserved.
    `;

    let rawEmail: string;

    if (pdfBase64 && pdfFilename) {
      // Create MIME email with PDF attachment
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      rawEmail = [
        `From: PrivateCharterX <${FROM_EMAIL}>`,
        `To: ${to}`,
        `Subject: ${emailSubject}`,
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
    } else {
      // Simple email without attachment
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      rawEmail = [
        `From: PrivateCharterX <${FROM_EMAIL}>`,
        `To: ${to}`,
        `Subject: ${emailSubject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        plainText,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        emailHTML,
        '',
        `--${boundary}--`
      ].join('\r\n');
    }

    // Send email using SES raw email
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
    console.log('Request confirmation email sent:', result.MessageId);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.MessageId,
        to
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending request email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send request email', details: error.toString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
