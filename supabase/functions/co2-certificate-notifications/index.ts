import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// AWS SES v3 client for HTTP API
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CO2CertificateRequest {
  id: string;
  request_id: string;
  user_id: string;
  contact_email: string;
  service_type: string;
  origin: string;
  destination: string;
  first_flight_date: string;
  aircraft_type: string;
  passenger_count: number;
  total_emissions_kg: number;
  certification_type: string;
  carbon_offset_cost: number;
  total_cost: number;
  urgency: string;
  wants_blockchain_nft: boolean;
  wants_email_pdf: boolean;
  company_name: string;
  wallet_address?: string;
  status: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
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

    // Parse the request ID from webhook request body
    const body = await req.json();
    const certificate_request_id = body.record?.id;

    if (!certificate_request_id) {
      return new Response(
        JSON.stringify({ error: 'No CO2 certificate request ID provided in record' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing CO2 certificate email notifications for:', certificate_request_id);

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

    // Fetch CO2 certificate request data from database
    const { data: record, error } = await supabase
      .from('co2_certificate_requests')
      .select('*')
      .eq('id', certificate_request_id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch CO2 certificate request data', details: error.message }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!record) {
      return new Response(
        JSON.stringify({ error: 'CO2 certificate request not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch user profile for additional info
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, email, name, phone')
      .eq('id', record.user_id)
      .single();

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

    // Format helper functions
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

    const formatEmissions = (emissionsKg: number): string => {
      const emissionsTonnes = emissionsKg / 1000;
      return `${emissionsTonnes.toFixed(1)} tCO₂`;
    };

    // Determine user contact info (prioritize record fields, fallback to profile)
    const userEmail = record.contact_email || userProfile?.email;
    const userName = record.metadata?.form_data?.contactName || userProfile?.name || 'Valued Customer';
    const userPhone = record.metadata?.form_data?.phone || userProfile?.phone;
    const companyName = record.company_name || record.metadata?.form_data?.companyName;

    if (!userEmail) {
      console.error('No email found for user');
      return new Response(
        JSON.stringify({ error: 'No email found for user notification' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract additional details from metadata
    const formData = record.metadata?.form_data || {};
    const calculatedEmissions = record.metadata?.calculated_emissions || {};

    // User confirmation email template
    const userEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>CO₂ Certificate Request Confirmation - PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #000; color: white; padding: 32px; text-align: center; }
        .content { padding: 32px; }
        .certificate-card { background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #000; }
        .detail-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; min-width: 120px; }
        .detail-value { font-weight: 600; color: #111827; text-align: right; flex: 1; }
        .emissions-highlight { background-color: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
        .total-row { border-top: 2px solid #000; margin-top: 16px; padding-top: 16px; font-size: 18px; }
        .button { display: inline-block; background-color: #000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0; }
        .footer { padding: 32px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; }
        .iso-badge { display: inline-block; background-color: #1e40af; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-weight: 300;">🌱 PrivateCharterX</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.8;">Your CO₂ certificate request has been received</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>Thank you for taking responsibility for your flight's environmental impact. We have received your CO₂ certificate request and will process it with the highest standards of accuracy and transparency.</p>
          
          <div class="certificate-card">
            <h3 style="margin-top: 0;">Certificate Request Details</h3>
            
            <div class="detail-row">
              <span class="detail-label">Request Reference</span>
              <span class="detail-value">#${record.request_id || record.id.slice(-8).toUpperCase()}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Flight Route</span>
              <span class="detail-value">${record.origin} → ${record.destination}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Flight Date</span>
              <span class="detail-value">${formatDate(record.first_flight_date)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Aircraft Category</span>
              <span class="detail-value">${record.aircraft_type}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Passengers</span>
              <span class="detail-value">${record.passenger_count}</span>
            </div>
            
            ${formData.flightDuration ? `
            <div class="detail-row">
              <span class="detail-label">Flight Duration</span>
              <span class="detail-value">${formData.flightDuration} hours</span>
            </div>
            ` : ''}
            
            ${formData.tailNumber ? `
            <div class="detail-row">
              <span class="detail-label">Tail Number</span>
              <span class="detail-value">${formData.tailNumber}</span>
            </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="detail-label">Certificate Type</span>
              <span class="detail-value">${record.certification_type === 'standard' ? 'Standard Certificate' : 'Premium Certificate with NFT'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Processing Time</span>
              <span class="detail-value">${record.urgency === 'rush' ? '24 hours (Rush)' : '2-5 business days'}</span>
            </div>
            
            ${formData.offsetPercentage && formData.offsetPercentage !== '100' ? `
            <div class="detail-row">
              <span class="detail-label">Offset Percentage</span>
              <span class="detail-value">${formData.offsetPercentage}%</span>
            </div>
            ` : ''}
            
            ${record.wants_blockchain_nft ? `
            <div class="detail-row">
              <span class="detail-label">Blockchain NFT</span>
              <span class="detail-value">✅ Included</span>
            </div>
            ` : ''}
            
            ${record.wallet_address ? `
            <div class="detail-row">
              <span class="detail-label">Wallet Address</span>
              <span class="detail-value">${record.wallet_address.slice(0, 6)}...${record.wallet_address.slice(-4)}</span>
            </div>
            ` : ''}
            
            ${companyName ? `
            <div class="detail-row">
              <span class="detail-label">Company</span>
              <span class="detail-value">${companyName}</span>
            </div>
            ` : ''}
            
            <div class="detail-row total-row">
              <span class="detail-label">Total Cost</span>
              <span class="detail-value">${formatPrice(record.total_cost)}</span>
            </div>
          </div>
          
          <div class="emissions-highlight">
            <h3 style="margin-top: 0; color: #166534;">🌍 Estimated Emissions to Offset</h3>
            <div style="font-size: 24px; font-weight: bold; color: #166534; margin: 8px 0;">
              ${formatEmissions(record.total_emissions_kg)}
            </div>
          </div>
          
          <h3>What happens next?</h3>
          <ol>
            <li>Our carbon offset specialists will review your flight details within ${record.urgency === 'rush' ? '2 hours' : '4-8 hours'}</li>
            <li>We'll verify emission calculations using our proprietary algorithms</li>
            <li>High-quality carbon offset certificates will be sourced from verified projects</li>
            <li>Your personalized certificate will be generated and ${record.wants_blockchain_nft ? 'minted as an NFT plus ' : ''}sent via email</li>
            <li>All certificates are permanently retired to prevent double-counting</li>
          </ol>
          
          <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1e40af;">🎯 Quality Guarantee</h4>
            <p style="margin-bottom: 0; color: #1e40af; font-size: 14px;">
              Your offset certificates are sourced exclusively from licensed NGOs and verified projects with measurable environmental benefits. Every certificate includes blockchain verification for complete transparency.
            </p>
          </div>
          
          <p><strong>Questions?</strong> Contact our support team at <a href="mailto:support@privatecharterx.com">support@privatecharterx.com</a>.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated confirmation. Please do not reply to this email.</p>
          <p>PrivateCharterX - Responsible aviation with verified carbon offsetting</p>
          <p>Reference: #${record.request_id || record.id.slice(-8).toUpperCase()}</p>
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
      <title>New CO₂ Certificate Request - PrivateCharterX Admin</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #000; color: white; padding: 32px; text-align: center; }
        .content { padding: 32px; }
        .certificate-card { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 4px 0; }
        .detail-label { color: #6b7280; min-width: 140px; }
        .detail-value { font-weight: 600; color: #111827; }
        .urgent { background-color: #dc2626; color: white; padding: 12px; border-radius: 8px; margin: 16px 0; text-align: center; }
        .rush-alert { background-color: #fbbf24; color: #92400e; padding: 12px; border-radius: 8px; margin: 16px 0; text-align: center; font-weight: 600; }
        .contact-info { background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .emissions-box { background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
        .metadata-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 12px 0; font-size: 12px; }
        .button { display: inline-block; background-color: #000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 8px 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-weight: 600;">🌱 NEW CO₂ CERTIFICATE REQUEST</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Carbon offset certificate processing required</p>
        </div>
        
        <div class="content">
          <div class="urgent">
            <strong>⏰ ACTION REQUIRED:</strong> New CO₂ certificate request - Process within ${record.urgency === 'rush' ? '24 hours' : '2-5 business days'}
          </div>
          
          ${record.urgency === 'rush' ? `
          <div class="rush-alert">
            ⚡ RUSH PROCESSING REQUESTED - Customer paid extra €100 for 24-hour delivery
          </div>
          ` : ''}
          
          <div class="certificate-card">
            <h3 style="margin-top: 0; color: #dc2626;">Certificate Request Details</h3>
            
            <div class="detail-row">
              <span class="detail-label">Full Request ID:</span>
              <span class="detail-value">${record.id}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Reference:</span>
              <span class="detail-value">#${record.request_id || record.id.slice(-8).toUpperCase()}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Submitted:</span>
              <span class="detail-value">${formatDateTime(record.created_at)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Service Type:</span>
              <span class="detail-value">${record.service_type.replace('_', ' ').toUpperCase()}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Flight Route:</span>
              <span class="detail-value">${record.origin} → ${record.destination}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Flight Date:</span>
              <span class="detail-value">${formatDate(record.first_flight_date)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Aircraft Category:</span>
              <span class="detail-value">${record.aircraft_type}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Passengers:</span>
              <span class="detail-value">${record.passenger_count}</span>
            </div>
            
            ${formData.flightDuration ? `
            <div class="detail-row">
              <span class="detail-label">Flight Duration:</span>
              <span class="detail-value">${formData.flightDuration} hours</span>
            </div>
            ` : ''}
            
            ${formData.tailNumber ? `
            <div class="detail-row">
              <span class="detail-label">Tail Number:</span>
              <span class="detail-value">${formData.tailNumber}</span>
            </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="detail-label">Certificate Type:</span>
              <span class="detail-value">${record.certification_type === 'standard' ? 'Standard' : 'Premium + NFT'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Processing:</span>
              <span class="detail-value">${record.urgency === 'rush' ? 'RUSH (24h)' : 'Standard (2-5 days)'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Blockchain NFT:</span>
              <span class="detail-value">${record.wants_blockchain_nft ? '✅ Yes' : '❌ No'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Email PDF:</span>
              <span class="detail-value">${record.wants_email_pdf ? '✅ Yes' : '❌ No'}</span>
            </div>
            
            ${record.wallet_address ? `
            <div class="detail-row">
              <span class="detail-label">Wallet Address:</span>
              <span class="detail-value">${record.wallet_address}</span>
            </div>
            ` : ''}
            
            ${companyName ? `
            <div class="detail-row">
              <span class="detail-label">Company:</span>
              <span class="detail-value">${companyName}</span>
            </div>
            ` : ''}
            
            <div class="detail-row" style="border-top: 2px solid #000; margin-top: 16px; padding-top: 16px; font-size: 18px;">
              <span class="detail-label">Total Revenue:</span>
              <span class="detail-value">${formatPrice(record.total_cost)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Offset Cost:</span>
              <span class="detail-value">${formatPrice(record.carbon_offset_cost)}</span>
            </div>
          </div>
          
          <div class="emissions-box">
            <h3 style="margin-top: 0; color: #059669;">🌍 Emissions Calculation</h3>
            <div style="font-size: 24px; font-weight: bold; color: #059669; margin: 8px 0;">
              ${formatEmissions(record.total_emissions_kg)}
            </div>
            ${formData.offsetPercentage && formData.offsetPercentage !== '100' ? `
            <p style="margin: 4px 0; color: #059669; font-size: 12px;">
              Offset percentage: ${formData.offsetPercentage}%
            </p>
            ` : ''}
          </div>
          
          <div class="contact-info">
            <h3 style="margin-top: 0; color: #1d4ed8;">Customer Contact Information</h3>
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
            <div class="detail-row">
              <span class="detail-label">User ID:</span>
              <span class="detail-value">${record.user_id}</span>
            </div>
          </div>
          
          ${Object.keys(record.metadata?.uploaded_documents || []).length > 0 ? `
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h4 style="margin-top: 0; color: #0369a1;">📄 Uploaded Documents</h4>
            <p style="margin-bottom: 8px; color: #0369a1; font-size: 14px;">
              Customer uploaded ${Object.keys(record.metadata?.uploaded_documents || []).length} document(s): ${(record.metadata?.uploaded_documents || []).join(', ')}
            </p>
            <p style="margin-bottom: 0; color: #0369a1; font-size: 12px;">
              ✅ Use actual flight data for enhanced calculation accuracy
            </p>
          </div>
          ` : ''}
          
          ${record.metadata ? `
          <div class="metadata-box">
            <h4 style="margin-top: 0; color: #64748b;">Debug Info - Form Metadata</h4>
            <pre style="white-space: pre-wrap; font-size: 11px; color: #475569; margin: 0; max-height: 200px; overflow-y: auto;">${JSON.stringify(record.metadata, null, 2)}</pre>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="mailto:${userEmail}" class="button">Reply to Customer</a>
            ${userPhone ? `<a href="tel:${userPhone}" class="button">Call Customer</a>` : ''}
            <a href="https://dashboard.privatecharterx.com/admin/co2-certificates" class="button">View in Admin</a>
          </div>
          
          <h3>Processing Steps:</h3>
          <ol>
            <li><strong>Verify flight details</strong> and emission calculations</li>
            <li><strong>Source carbon offset certificates</strong> from verified projects (VCS/Gold Standard)</li>
            <li><strong>Generate personalized certificate</strong> with customer and flight details</li>
            ${record.wants_blockchain_nft ? '<li><strong>Mint NFT</strong> on blockchain and transfer to wallet</li>' : ''}
            <li><strong>Send certificate via email</strong> and update request status</li>
            <li><strong>Permanently retire certificates</strong> to prevent double-counting</li>
          </ol>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send user confirmation email via AWS SES
    const userEmailParams = {
      FromEmailAddress: `PrivateCharterX CO₂ Certificates <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [userEmail],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `🌱 CO₂ Certificate Request Confirmed - ${record.origin}→${record.destination} - ${formatEmissions(record.total_emissions_kg)}`,
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
      FromEmailAddress: `PrivateCharterX CO₂ Certificates <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [ADMIN_EMAIL],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `🌱 ${record.urgency === 'rush' ? 'RUSH' : 'NEW'} CO₂ Certificate: ${record.origin}→${record.destination} - ${formatPrice(record.total_cost)} - ${userName}`,
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
      console.log('User CO₂ certificate confirmation email sent:', userEmailResult.MessageId);
    } catch (error) {
      console.error('Failed to send user email:', error);
      userEmailError = error.message;
    }

    try {
      const adminCommand = new SendEmailCommand(adminEmailParams);
      adminEmailResult = await sesClient.send(adminCommand);
      console.log('Admin CO₂ certificate notification email sent:', adminEmailResult.MessageId);
    } catch (error) {
      console.error('Failed to send admin email:', error);
      adminEmailError = error.message;
    }

    const result = {
      success: !userEmailError && !adminEmailError,
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
      certificateRequestId: record.id,
      requestReference: record.request_id,
      userName: userName,
      emissionsOffset: formatEmissions(record.total_emissions_kg),
      totalCost: formatPrice(record.total_cost),
      urgency: record.urgency
    };

    console.log('CO₂ certificate email notifications result:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: result.success ? 200 : 207 // 207 Multi-Status for partial success
    });

  } catch (error) {
    console.error('Error in co2-certificate-notifications function:', error);

    // Handle specific AWS SES errors
    let errorMessage = 'Failed to send CO₂ certificate email notifications';
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