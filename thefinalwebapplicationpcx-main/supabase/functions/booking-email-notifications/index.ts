import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// AWS SES v3 client for HTTP API
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingData {
  id: string;
  origin_airport_code: string;
  destination_airport_code: string;
  departure_date: string;
  departure_time: string;
  passengers: number;
  luggage: number;
  pets: number;
  selected_jet_category: string;
  aviation_services: string[];
  luxury_services: string[];
  carbon_option: string;
  carbon_nft_wallet?: string;
  total_price: number;
  currency: string;
  payment_method: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_company?: string;
  wallet_address?: string;
  nft_discount_applied: boolean;
  status: string;
  created_at: string;
  user_id?: string;
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

    // Parse the booking ID from webhook request body
    const body = await req.json();
    const booking_id = body.record?.id;

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: 'No booking ID provided in record' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing booking email notifications for:', booking_id);

    // Initialize Supabase client with service role key for RLS bypass
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch booking data from database
    const { data: record, error } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch booking data', details: error.message }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!record) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get environment variables for AWS SES
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'bookings@privatecharterx.com';
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

    // Format the booking details for emails
    const formatPrice = (amount: number, currency: string = 'EUR'): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
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

    const formatTime = (timeStr: string): string => {
      return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const jetCategoryNames: Record<string, string> = {
      'very-light': 'Very Light Jet',
      'light': 'Light Jet',
      'midsize': 'Mid-Size Jet',
      'super-mid': 'Super Mid-Size Jet',
      'heavy': 'Heavy Jet',
      'robinson-r44': 'Robinson R44 Helicopter',
      'airbus-h125': 'Airbus H125 Helicopter',
      'airbus-h135': 'Airbus H135 Helicopter',
      'leonardo-aw109': 'Leonardo AW109 Helicopter'
    };

    const aircraftName = jetCategoryNames[record.selected_jet_category] || record.selected_jet_category;
    const servicesText = [...(record.aviation_services || []), ...(record.luxury_services || [])].join(', ') || 'No additional services';

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
        .header { background-color: #000; color: white; padding: 32px; text-align: center; }
        .content { padding: 32px; }
        .booking-card { background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; }
        .detail-value { font-weight: 600; color: #111827; }
        .total-row { border-top: 2px solid #000; margin-top: 16px; padding-top: 16px; font-size: 18px; }
        .button { display: inline-block; background-color: #000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0; }
        .footer { padding: 32px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-weight: 300;">PrivateCharterX</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.8;">Your charter request has been received</p>
        </div>
        
        <div class="content">
          <h2>Hello ${record.contact_name},</h2>
          <p>Thank you for choosing PrivateCharterX for your private aviation needs. We have received your charter request and our team will contact you shortly to confirm availability and finalize the details.</p>
          
          <div class="booking-card">
            <h3 style="margin-top: 0;">Booking Details</h3>
            
            <div class="detail-row">
              <span class="detail-label">Booking Reference</span>
              <span class="detail-value">#${record.id.slice(-8).toUpperCase()}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Route</span>
              <span class="detail-value">${record.origin_airport_code} → ${record.destination_airport_code}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Date & Time</span>
              <span class="detail-value">${formatDate(record.departure_date)} at ${formatTime(record.departure_time)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Aircraft</span>
              <span class="detail-value">${aircraftName}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Passengers</span>
              <span class="detail-value">${record.passengers}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Luggage</span>
              <span class="detail-value">${record.luggage} pieces</span>
            </div>
            
            ${record.pets > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Pets</span>
              <span class="detail-value">${record.pets}</span>
            </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="detail-label">Additional Services</span>
              <span class="detail-value">${servicesText}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Carbon Offset</span>
              <span class="detail-value">${record.carbon_option === 'full' ? 'Full Carbon Offset' : 'No Carbon Offset'}</span>
            </div>
            
            <div class="detail-row total-row">
              <span class="detail-label">Estimated Total</span>
              <span class="detail-value">${formatPrice(record.total_price, record.currency)}</span>
            </div>
          </div>
          
          <h3>What happens next?</h3>
          <ol>
            <li>Our charter specialists will review your request within 2 hours</li>
            <li>We'll contact you at ${record.contact_phone} or ${record.contact_email} to confirm availability</li>
            <li>Once confirmed, we'll send you detailed flight information and payment instructions</li>
            <li>Your charter will be ready for departure as scheduled</li>
          </ol>
          
          <p><strong>Questions?</strong> Contact our 24/7 support team at <a href="mailto:support@privatecharterx.com">support@privatecharterx.com</a> or call us directly.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated confirmation. Please do not reply to this email.</p>
          <p>PrivateCharterX - Blockchain powered premium aviation services</p>
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
      <title>New Booking Request - PrivateCharterX Admin</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #dc2626; color: white; padding: 32px; text-align: center; }
        .content { padding: 32px; }
        .booking-card { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 4px 0; }
        .detail-label { color: #6b7280; min-width: 140px; }
        .detail-value { font-weight: 600; color: #111827; }
        .urgent { background-color: #dc2626; color: white; padding: 12px; border-radius: 8px; margin: 16px 0; text-align: center; }
        .contact-info { background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 8px 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-weight: 600;">🚁 NEW BOOKING REQUEST</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Immediate attention required</p>
        </div>
        
        <div class="content">
          <div class="urgent">
            <strong>⏰ URGENT:</strong> New charter request received - Contact customer within 2 hours
          </div>
          
          <div class="booking-card">
            <h3 style="margin-top: 0; color: #dc2626;">Booking Details</h3>
            
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">${record.id}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Reference:</span>
              <span class="detail-value">#${record.id.slice(-8).toUpperCase()}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Submitted:</span>
              <span class="detail-value">${new Date(record.created_at).toLocaleString()}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Route:</span>
              <span class="detail-value">${record.origin_airport_code} → ${record.destination_airport_code}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Departure:</span>
              <span class="detail-value">${formatDate(record.departure_date)} at ${formatTime(record.departure_time)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Aircraft:</span>
              <span class="detail-value">${aircraftName}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">PAX/Luggage/Pets:</span>
              <span class="detail-value">${record.passengers}/${record.luggage}/${record.pets}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Services:</span>
              <span class="detail-value">${servicesText}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Carbon Offset:</span>
              <span class="detail-value">${record.carbon_option === 'full' ? 'Yes' : 'No'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${record.payment_method.toUpperCase()}</span>
            </div>
            
            <div class="detail-row" style="border-top: 2px solid #dc2626; margin-top: 16px; padding-top: 16px; font-size: 18px;">
              <span class="detail-label">Total Value:</span>
              <span class="detail-value">${formatPrice(record.total_price, record.currency)}</span>
            </div>
          </div>
          
          <div class="contact-info">
            <h3 style="margin-top: 0; color: #1d4ed8;">Customer Contact Information</h3>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${record.contact_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value"><a href="mailto:${record.contact_email}">${record.contact_email}</a></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value"><a href="tel:${record.contact_phone}">${record.contact_phone}</a></span>
            </div>
            ${record.contact_company ? `
            <div class="detail-row">
              <span class="detail-label">Company:</span>
              <span class="detail-value">${record.contact_company}</span>
            </div>
            ` : ''}
            ${record.wallet_address ? `
            <div class="detail-row">
              <span class="detail-label">Wallet:</span>
              <span class="detail-value">${record.wallet_address.slice(0, 6)}...${record.wallet_address.slice(-4)}</span>
            </div>
            ` : ''}
            ${record.nft_discount_applied ? `
            <div class="detail-row">
              <span class="detail-label">NFT Discount:</span>
              <span class="detail-value">✅ Applied</span>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="mailto:${record.contact_email}" class="button">Reply to Customer</a>
            <a href="tel:${record.contact_phone}" class="button">Call Customer</a>
          </div>
          
          <h3>Next Steps:</h3>
          <ol>
            <li><strong>Contact customer within 2 hours</strong> at ${record.contact_phone}</li>
            <li>Confirm aircraft availability for ${formatDate(record.departure_date)}</li>
            <li>Verify routing and any special requirements</li>
            <li>Send detailed quote and payment instructions</li>
            <li>Update booking status in admin dashboard</li>
          </ol>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send user confirmation email via AWS SES
    const userEmailParams = {
      FromEmailAddress: `PrivateCharterX <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [record.contact_email],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `Booking Confirmation - Flight ${record.origin_airport_code} → ${record.destination_airport_code}`,
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
      ReplyToAddresses: ['support@privatecharterx.com'],
    };

    // Send admin notification email via AWS SES
    const adminEmailParams = {
      FromEmailAddress: `PrivateCharterX Bookings <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [ADMIN_EMAIL],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `🚁 URGENT: New Charter Request ${record.origin_airport_code}→${record.destination_airport_code} - ${formatPrice(record.total_price, record.currency)}`,
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
      ReplyToAddresses: ['support@privatecharterx.com'],
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
      userEmail: {
        sent: !userEmailError,
        messageId: userEmailResult?.MessageId || null,
        error: userEmailError
      },
      adminEmail: {
        sent: !adminEmailError,
        messageId: adminEmailResult?.MessageId || null,
        error: adminEmailError
      },
      bookingId: record.id
    };

    console.log('Email notifications result:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: result.success ? 200 : 207 // 207 Multi-Status for partial success
    });

  } catch (error) {
    console.error('Error in booking-email-notifications function:', error);

    // Handle specific AWS SES errors
    let errorMessage = 'Failed to send booking email notifications';
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