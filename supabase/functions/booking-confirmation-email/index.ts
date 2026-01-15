import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingConfirmationRequest {
  bookingId: string;
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

    const body: BookingConfirmationRequest = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: bookingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing booking confirmation email for:', bookingId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch booking data
    const { data: booking, error: bookingError } = await supabase
      .from('user_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user data
    const { data: userData } = await supabase
      .from('users')
      .select('email, first_name, last_name, phone')
      .eq('id', booking.user_id)
      .single();

    const userEmail = booking.contact_email || userData?.email;
    const userName = booking.contact_name || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Valued Customer';

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'No email found for booking confirmation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get environment variables
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'bookings@privatecharterx.com';
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@www.privatecharterx.com';
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://privatecharterx.com';

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

    // Format helper functions
    const formatPrice = (amount: number, currency: string = 'EUR'): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    };

    const formatDate = (dateStr: string): string => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatDateTime = (dateStr: string): string => {
      return new Date(dateStr).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const formatCryptoAmount = (amount: number, currency: string): string => {
      if (!amount) return '-';
      const decimals = currency === 'BTC' ? 8 : currency === 'ETH' ? 6 : 2;
      return `${parseFloat(amount.toString()).toFixed(decimals)} ${currency}`;
    };

    // Get booking type info
    const getBookingTypeInfo = (type: string) => {
      const types: Record<string, { name: string; emoji: string; color: string }> = {
        'empty_leg': { name: 'Empty Leg Flight', emoji: '✈️', color: '#3b82f6' },
        'adventure_package': { name: 'Adventure Package', emoji: '🏔️', color: '#f97316' },
        'co2_certificate': { name: 'CO₂ Certificate', emoji: '🌱', color: '#22c55e' },
        'commercial_flight': { name: 'Commercial Flight', emoji: '🛫', color: '#8b5cf6' },
        'flight': { name: 'Commercial Flight', emoji: '🛫', color: '#8b5cf6' }
      };
      return types[type] || { name: type, emoji: '📋', color: '#6b7280' };
    };

    // Check if this is a commercial flight booking
    const isCommercialFlight = booking.booking_type === 'commercial_flight' || booking.booking_type === 'flight';
    const bookingReference = booking.metadata?.booking_reference || booking.metadata?.duffel_booking_reference;

    const typeInfo = getBookingTypeInfo(booking.booking_type);

    // User confirmation email template
    const userEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Booking Confirmation - PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a2e 100%); color: white; padding: 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
        .content { padding: 32px; }
        .success-badge { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
        .booking-card { background: #f8fafc; border-radius: 16px; overflow: hidden; margin: 24px 0; border: 1px solid #e2e8f0; }
        .booking-image { width: 100%; height: 200px; object-fit: cover; }
        .booking-image-placeholder { width: 100%; height: 200px; background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); display: flex; align-items: center; justify-content: center; font-size: 48px; }
        .booking-details { padding: 20px; }
        .booking-type { display: inline-block; background: ${typeInfo.color}20; color: ${typeInfo.color}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
        .booking-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
        .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
        .detail-item { background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .detail-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .detail-value { font-size: 14px; font-weight: 600; color: #1e293b; }
        .route-box { background: white; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #e2e8f0; }
        .route-cities { display: flex; align-items: center; justify-content: space-between; }
        .city { text-align: center; }
        .city-name { font-size: 18px; font-weight: 700; color: #1e293b; }
        .city-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
        .route-arrow { font-size: 24px; color: #94a3b8; }
        .payment-box { background: #000; color: white; border-radius: 16px; padding: 24px; margin: 24px 0; }
        .payment-title { font-size: 16px; font-weight: 600; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        .payment-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
        .payment-row.total { font-size: 18px; font-weight: 700; border-top: 1px solid #374151; padding-top: 12px; margin-top: 12px; }
        .crypto-box { background: #1f2937; border-radius: 12px; padding: 16px; margin-top: 16px; }
        .crypto-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px; }
        .crypto-value { font-size: 16px; font-weight: 600; color: #fbbf24; }
        .tx-hash { font-family: monospace; font-size: 11px; color: #9ca3af; word-break: break-all; margin-top: 8px; background: #111827; padding: 8px; border-radius: 6px; }
        .support-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
        .support-title { font-size: 16px; font-weight: 600; color: #1e40af; margin: 0 0 8px; }
        .support-text { font-size: 14px; color: #3b82f6; margin: 0; }
        .button { display: inline-block; background: #000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 4px; }
        .button.outline { background: white; color: #000; border: 2px solid #000; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .pvcx-reward { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center; }
        .pvcx-title { font-size: 14px; font-weight: 600; color: #92400e; margin: 0 0 4px; }
        .pvcx-amount { font-size: 24px; font-weight: 700; color: #d97706; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${typeInfo.emoji} BOOKING CONFIRMED</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Thank you for your purchase, ${userName}!</p>
        </div>

        <div class="content">
          <div style="text-align: center;">
            <span class="success-badge">✓ Payment Successful</span>
          </div>

          <div class="booking-card">
            ${booking.service_image_url
              ? `<img src="${booking.service_image_url}" alt="${booking.service_title}" class="booking-image" />`
              : `<div class="booking-image-placeholder">${typeInfo.emoji}</div>`
            }
            <div class="booking-details">
              <span class="booking-type">${typeInfo.emoji} ${typeInfo.name}</span>
              <h2 class="booking-title">${booking.service_title}</h2>
              ${booking.service_description ? `<p style="color: #64748b; margin: 8px 0 0; font-size: 14px;">${booking.service_description}</p>` : ''}

              ${(booking.origin && booking.destination) ? `
              <div class="route-box">
                <div class="route-cities">
                  <div class="city">
                    <div class="city-name">${booking.origin}</div>
                    <div class="city-label">Origin</div>
                  </div>
                  <div class="route-arrow">→</div>
                  <div class="city">
                    <div class="city-name">${booking.destination}</div>
                    <div class="city-label">Destination</div>
                  </div>
                </div>
              </div>
              ` : ''}

              ${isCommercialFlight && bookingReference ? `
              <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 12px; padding: 20px; margin: 16px 0; text-align: center;">
                <div style="color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Booking Reference (PNR)</div>
                <div style="color: white; font-size: 28px; font-weight: 700; letter-spacing: 3px; font-family: monospace;">${bookingReference}</div>
                <p style="color: rgba(255,255,255,0.9); font-size: 13px; margin: 12px 0 0;">Use this code to check in online or at the airport</p>
              </div>
              <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center;">
                <div style="font-size: 14px; color: #92400e; font-weight: 600;">📧 Your e-ticket will be sent separately</div>
                <p style="font-size: 13px; color: #a16207; margin: 8px 0 0;">You will receive your flight ticket via email shortly. Please allow up to 15 minutes for processing.</p>
              </div>
              ` : ''}

              <div class="detail-grid">
                ${booking.departure_date ? `
                <div class="detail-item">
                  <div class="detail-label">📅 Date</div>
                  <div class="detail-value">${formatDate(booking.departure_date)}</div>
                </div>
                ` : ''}
                ${booking.passengers ? `
                <div class="detail-item">
                  <div class="detail-label">👥 Passengers</div>
                  <div class="detail-value">${booking.passengers}</div>
                </div>
                ` : ''}
                ${booking.aircraft_type ? `
                <div class="detail-item">
                  <div class="detail-label">✈️ Aircraft</div>
                  <div class="detail-value">${booking.aircraft_type}</div>
                </div>
                ` : ''}
                ${booking.duration ? `
                <div class="detail-item">
                  <div class="detail-label">⏱️ Duration</div>
                  <div class="detail-value">${booking.duration}</div>
                </div>
                ` : ''}
                ${booking.co2_tons_offset ? `
                <div class="detail-item" style="grid-column: span 2; background: #dcfce7;">
                  <div class="detail-label">🌱 CO₂ Offset</div>
                  <div class="detail-value" style="color: #166534;">${booking.co2_tons_offset} tonnes</div>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="payment-box">
            <div class="payment-title">💳 Payment Summary</div>
            <div class="payment-row">
              <span style="color: #9ca3af;">Base Price</span>
              <span>${formatPrice(booking.base_price, booking.currency)}</span>
            </div>
            ${booking.platform_fee > 0 ? `
            <div class="payment-row">
              <span style="color: #9ca3af;">Platform Fee</span>
              <span>${formatPrice(booking.platform_fee, booking.currency)}</span>
            </div>
            ` : ''}
            ${booking.processing_fee > 0 ? `
            <div class="payment-row">
              <span style="color: #9ca3af;">Processing Fee</span>
              <span>${formatPrice(booking.processing_fee, booking.currency)}</span>
            </div>
            ` : ''}
            ${booking.discount_amount > 0 ? `
            <div class="payment-row" style="color: #4ade80;">
              <span>Discount (${booking.discount_type || 'Applied'})</span>
              <span>-${formatPrice(booking.discount_amount, booking.currency)}</span>
            </div>
            ` : ''}
            <div class="payment-row total">
              <span>Total Paid</span>
              <span>${formatPrice(booking.total_amount, booking.currency)}</span>
            </div>

            <div class="crypto-box">
              <div class="crypto-label">Crypto Payment</div>
              <div class="crypto-value">${formatCryptoAmount(booking.crypto_amount, booking.crypto_currency)}</div>
              ${booking.transaction_hash ? `
              <div class="tx-hash">TX: ${booking.transaction_hash}</div>
              ` : ''}
              ${booking.wallet_address ? `
              <div style="margin-top: 8px;">
                <div class="crypto-label">Wallet</div>
                <div style="font-family: monospace; font-size: 12px; color: #9ca3af;">${booking.wallet_address.substring(0, 8)}...${booking.wallet_address.slice(-6)}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="pvcx-reward">
            <div class="pvcx-title">🎁 Booking Reward Earned!</div>
            <div class="pvcx-amount">+${Math.round(booking.total_amount * 0.01)} $PVCX</div>
          </div>

          <div class="support-box">
            <div class="support-title">🌍 24/7 Global Support</div>
            <p class="support-text">
              Questions? Contact us anytime at<br/>
              <strong>support@privatecharterx.com</strong> | <strong>+41 44 511 88 88</strong>
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${SITE_URL}/dashboard?category=bookings" class="button">View My Bookings</a>
          </div>

          <p style="text-align: center; color: #64748b; font-size: 12px;">
            Booking Reference: <strong>#${booking.id.slice(-8).toUpperCase()}</strong><br/>
            ${booking.coingate_order_id ? `CoinGate Order: ${booking.coingate_order_id}` : ''}
          </p>
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

    // Admin notification email template
    const adminEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New Crypto Booking - PrivateCharterX Admin</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #000; color: white; padding: 24px; text-align: center; }
        .content { padding: 24px; }
        .alert-box { background: #dcfce7; border: 2px solid #22c55e; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; }
        .alert-title { font-size: 18px; font-weight: 700; color: #166534; margin: 0; }
        .alert-subtitle { font-size: 14px; color: #15803d; margin: 4px 0 0; }
        .booking-card { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 16px 0; border: 1px solid #e2e8f0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #64748b; }
        .detail-value { font-weight: 600; color: #1e293b; }
        .customer-box { background: #eff6ff; border-radius: 12px; padding: 16px; margin: 16px 0; }
        .crypto-box { background: #1f2937; color: white; border-radius: 12px; padding: 16px; margin: 16px 0; }
        .button { display: inline-block; background: #000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 8px 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${typeInfo.emoji} NEW CRYPTO BOOKING</h1>
          <p style="margin: 8px 0 0; opacity: 0.8;">${typeInfo.name} - Payment Confirmed</p>
        </div>

        <div class="content">
          <div class="alert-box">
            <div class="alert-title">💰 Payment Received: ${formatPrice(booking.total_amount, booking.currency)}</div>
            <div class="alert-subtitle">${formatCryptoAmount(booking.crypto_amount, booking.crypto_currency)} via CoinGate</div>
          </div>

          <div class="booking-card">
            <h3 style="margin: 0 0 16px; color: #1e293b;">${booking.service_title}</h3>

            <div class="detail-row">
              <span class="detail-label">Booking ID</span>
              <span class="detail-value">${booking.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type</span>
              <span class="detail-value">${typeInfo.name}</span>
            </div>
            ${booking.origin ? `
            <div class="detail-row">
              <span class="detail-label">Route</span>
              <span class="detail-value">${booking.origin} → ${booking.destination}</span>
            </div>
            ` : ''}
            ${booking.departure_date ? `
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${formatDate(booking.departure_date)}</span>
            </div>
            ` : ''}
            ${booking.passengers ? `
            <div class="detail-row">
              <span class="detail-label">Passengers</span>
              <span class="detail-value">${booking.passengers}</span>
            </div>
            ` : ''}
            ${booking.co2_tons_offset ? `
            <div class="detail-row">
              <span class="detail-label">CO₂ Offset</span>
              <span class="detail-value">${booking.co2_tons_offset} tonnes</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Total</span>
              <span class="detail-value" style="font-size: 18px;">${formatPrice(booking.total_amount, booking.currency)}</span>
            </div>
          </div>

          ${isCommercialFlight ? `
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h4 style="margin: 0 0 12px; color: white;">🛫 Commercial Flight - Action Required</h4>
            ${bookingReference ? `
            <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
              <div style="color: rgba(255,255,255,0.8); font-size: 11px; text-transform: uppercase;">Booking Reference (PNR)</div>
              <div style="color: white; font-size: 24px; font-weight: 700; letter-spacing: 2px; font-family: monospace;">${bookingReference}</div>
            </div>
            ` : ''}
            ${booking.metadata?.duffel_order_id ? `
            <div class="detail-row" style="border-color: rgba(255,255,255,0.2);">
              <span style="color: rgba(255,255,255,0.8);">Duffel Order ID</span>
              <span style="color: white; font-family: monospace;">${booking.metadata.duffel_order_id}</span>
            </div>
            ` : ''}
            <div style="background: #fef3c7; border-radius: 8px; padding: 12px; margin-top: 12px;">
              <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 14px;">⚠️ E-Ticket must be sent manually!</p>
              <p style="margin: 8px 0 0; color: #a16207; font-size: 13px;">Download the e-ticket from Duffel Dashboard and send it to the customer.</p>
            </div>
          </div>
          ` : ''}

          <div class="customer-box">
            <h4 style="margin: 0 0 12px; color: #1e40af;">👤 Customer Details</h4>
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${userName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value"><a href="mailto:${userEmail}">${userEmail}</a></span>
            </div>
            ${booking.contact_phone ? `
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value"><a href="tel:${booking.contact_phone}">${booking.contact_phone}</a></span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">User ID</span>
              <span class="detail-value">${booking.user_id}</span>
            </div>
          </div>

          <div class="crypto-box">
            <h4 style="margin: 0 0 12px; color: #fbbf24;">₿ Crypto Transaction</h4>
            <div class="detail-row" style="border-color: #374151;">
              <span style="color: #9ca3af;">Currency</span>
              <span style="color: white;">${booking.crypto_currency}</span>
            </div>
            <div class="detail-row" style="border-color: #374151;">
              <span style="color: #9ca3af;">Amount</span>
              <span style="color: #fbbf24; font-weight: 700;">${formatCryptoAmount(booking.crypto_amount, booking.crypto_currency)}</span>
            </div>
            ${booking.transaction_hash ? `
            <div style="margin-top: 12px;">
              <span style="color: #9ca3af; font-size: 12px;">Transaction Hash</span>
              <p style="font-family: monospace; font-size: 11px; color: #9ca3af; word-break: break-all; margin: 4px 0; background: #111827; padding: 8px; border-radius: 6px;">${booking.transaction_hash}</p>
            </div>
            ` : ''}
            ${booking.wallet_address ? `
            <div style="margin-top: 12px;">
              <span style="color: #9ca3af; font-size: 12px;">Customer Wallet</span>
              <p style="font-family: monospace; font-size: 11px; color: #9ca3af; word-break: break-all; margin: 4px 0;">${booking.wallet_address}</p>
            </div>
            ` : ''}
            ${booking.coingate_order_id ? `
            <div class="detail-row" style="border-color: #374151;">
              <span style="color: #9ca3af;">CoinGate Order</span>
              <span style="color: white;">${booking.coingate_order_id}</span>
            </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="mailto:${userEmail}" class="button">Contact Customer</a>
            <a href="${SITE_URL}/admin/bookings" class="button">View in Admin</a>
          </div>

          <h3>Next Steps:</h3>
          ${isCommercialFlight ? `
          <ol style="color: #4b5563; line-height: 1.8;">
            <li>Verify payment in CoinGate dashboard</li>
            <li><strong style="color: #7c3aed;">Go to Duffel Dashboard and download the e-ticket</strong></li>
            <li><strong style="color: #7c3aed;">Send e-ticket to customer via email</strong></li>
            <li>Update booking status when complete</li>
          </ol>
          ` : `
          <ol style="color: #4b5563; line-height: 1.8;">
            <li>Verify payment in CoinGate dashboard</li>
            <li>Confirm booking details with service provider</li>
            <li>Send customer any additional documentation needed</li>
            <li>Update booking status when service is delivered</li>
          </ol>
          `}
        </div>
      </div>
    </body>
    </html>
    `;

    // Send emails
    let userEmailResult, adminEmailResult;
    let userEmailError = null;
    let adminEmailError = null;

    // Send user confirmation email
    try {
      const userCommand = new SendEmailCommand({
        FromEmailAddress: `PrivateCharterX <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [userEmail] },
        Content: {
          Simple: {
            Subject: {
              Data: `${typeInfo.emoji} Booking Confirmed - ${booking.service_title} | PrivateCharterX`,
              Charset: 'UTF-8',
            },
            Body: { Html: { Data: userEmailHTML, Charset: 'UTF-8' } },
          },
        },
        ReplyToAddresses: ['support@privatecharterx.com'],
      });
      userEmailResult = await sesClient.send(userCommand);
      console.log('✅ User booking confirmation email sent:', userEmailResult.MessageId);
    } catch (error) {
      console.error('Failed to send user email:', error);
      userEmailError = error.message;
    }

    // Send admin notification email
    try {
      const adminCommand = new SendEmailCommand({
        FromEmailAddress: `PrivateCharterX Bookings <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [ADMIN_EMAIL] },
        Content: {
          Simple: {
            Subject: {
              Data: `${typeInfo.emoji} NEW BOOKING: ${booking.service_title} - ${formatPrice(booking.total_amount, booking.currency)} - ${userName}`,
              Charset: 'UTF-8',
            },
            Body: { Html: { Data: adminEmailHTML, Charset: 'UTF-8' } },
          },
        },
        ReplyToAddresses: ['support@privatecharterx.com'],
      });
      adminEmailResult = await sesClient.send(adminCommand);
      console.log('✅ Admin booking notification email sent:', adminEmailResult.MessageId);
    } catch (error) {
      console.error('Failed to send admin email:', error);
      adminEmailError = error.message;
    }

    // Create notification for user
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: booking.user_id,
          type: 'booking_confirmed',
          title: 'Booking Confirmed!',
          message: `Your ${typeInfo.name} booking "${booking.service_title}" has been confirmed. Payment of ${formatPrice(booking.total_amount, booking.currency)} received.`,
          is_read: false,
          action_url: '/dashboard?category=bookings',
          created_at: new Date().toISOString()
        });
    } catch (notifError) {
      console.warn('Failed to create notification:', notifError);
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
      bookingId: booking.id,
      bookingType: booking.booking_type,
      totalAmount: booking.total_amount,
      currency: booking.currency
    };

    console.log('Booking confirmation email result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 207
    });

  } catch (error) {
    console.error('Error in booking-confirmation-email function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send booking confirmation email', details: error.toString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
