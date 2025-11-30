import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// AWS SES v3 client for HTTP API
import { SESv2Client, SendEmailCommand } from "npm:@aws-sdk/client-sesv2@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserRequest {
  id: string;
  user_id: string;
  type: string;
  status: string;
  data: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  admin_notes?: string;
  admin_id?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  aircraft_model?: string;
  aircraft_type?: string;
  capacity?: string;
  range?: string;
  speed?: string;
  email_recipient?: string;
  timestamp?: string;
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
    const request_id = body.record?.id;

    if (!request_id) {
      return new Response(
        JSON.stringify({ error: 'No request ID provided in record' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing user request email notifications for:', request_id);

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

    // Fetch request data from database
    const { data: record, error } = await supabase
      .from('user_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch request data', details: error.message }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!record) {
      return new Response(
        JSON.stringify({ error: 'Request not found' }),
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

    // Get request type display names and emojis
    const getRequestTypeInfo = (type: string) => {
      const typeMap: Record<string, { name: string; emoji: string; color: string }> = {
        'flight_quote': { name: 'Flight Quote Request', emoji: '✈️', color: '#3b82f6' },
        'empty_leg': { name: 'Empty Leg Request', emoji: '🛩️', color: '#8b5cf6' },
        'nft_discount_empty_leg': { name: 'NFT Discount Empty Leg', emoji: '🎫', color: '#8b5cf6' },
        'nft_free_flight': { name: 'NFT Free Flight', emoji: '🎁', color: '#10b981' },
        'support': { name: 'Support Request', emoji: '🆘', color: '#f59e0b' },
        'document': { name: 'Document Request', emoji: '📄', color: '#10b981' },
        'yacht_charter': { name: 'Yacht Charter Request', emoji: '🛥️', color: '#06b6d4' },
        'luxury_car': { name: 'Luxury Car Rental', emoji: '🚗', color: '#ec4899' },
        'helicopter': { name: 'Helicopter Charter', emoji: '🚁', color: '#f97316' },
        'adventure_package': { name: 'Adventure Package', emoji: '🏔️', color: '#84cc16' },
        'ai_chat_bulk': { name: 'AI Concierge Bulk Request', emoji: '🤖', color: '#8b5cf6' }
      };

      return typeMap[type] || { name: type.replace('_', ' ').toUpperCase(), emoji: '📋', color: '#6b7280' };
    };

    const typeInfo = getRequestTypeInfo(record.type);

    // Determine user contact info (prioritize record fields, fallback to profile)
    const userEmail = record.client_email || userProfile?.email;
    const userName = record.client_name || userProfile?.name || 'Valued Customer';
    const userPhone = record.client_phone || userProfile?.phone;

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

    // Generate request details based on type and data
    const generateRequestDetails = (record: UserRequest): string => {
      const data = record.data || {};
      let details = '';

      // Common details for all types
      details += `<div class="detail-row">
        <span class="detail-label">Request Type</span>
        <span class="detail-value">${typeInfo.name}</span>
      </div>`;

      details += `<div class="detail-row">
        <span class="detail-label">Request ID</span>
        <span class="detail-value">#${record.id.slice(-8).toUpperCase()}</span>
      </div>`;

      details += `<div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value">${record.status.replace('_', ' ').toUpperCase()}</span>
      </div>`;

      // Type-specific details
      switch (record.type) {
        case 'flight_quote':
        case 'empty_leg':
        case 'nft_discount_empty_leg':
        case 'nft_free_flight':
          // Route Information
          if (data.route) details += `<div class="detail-row"><span class="detail-label">Route</span><span class="detail-value">${data.route}</span></div>`;
          if (data.departure && !data.route) details += `<div class="detail-row"><span class="detail-label">From</span><span class="detail-value">${data.departure}</span></div>`;
          if (data.destination && !data.route) details += `<div class="detail-row"><span class="detail-label">To</span><span class="detail-value">${data.destination}</span></div>`;
          if (data.origin && !data.departure && !data.route) details += `<div class="detail-row"><span class="detail-label">From</span><span class="detail-value">${data.origin}</span></div>`;
          if (data.departure_airport && data.arrival_airport) {
            details += `<div class="detail-row"><span class="detail-label">Airports</span><span class="detail-value">${data.departure_airport} → ${data.arrival_airport}</span></div>`;
          } else if (data.departure_airport) {
            details += `<div class="detail-row"><span class="detail-label">Departure Airport</span><span class="detail-value">${data.departure_airport}</span></div>`;
          }
          if (data.arrival_airport && !data.departure_airport) {
            details += `<div class="detail-row"><span class="detail-label">Arrival Airport</span><span class="detail-value">${data.arrival_airport}</span></div>`;
          }

          // Date & Time Information
          if (data.departure_date) details += `<div class="detail-row"><span class="detail-label">Departure Date</span><span class="detail-value">${formatDate(data.departure_date)}</span></div>`;
          if (data.departure_time) details += `<div class="detail-row"><span class="detail-label">Departure Time</span><span class="detail-value">${data.departure_time}</span></div>`;
          if (data.return_date) details += `<div class="detail-row"><span class="detail-label">Return Date</span><span class="detail-value">${formatDate(data.return_date)}</span></div>`;
          if (data.arrival_time) details += `<div class="detail-row"><span class="detail-label">Arrival Time</span><span class="detail-value">${data.arrival_time}</span></div>`;

          // Passenger & Aircraft Information
          if (data.passengers || data.passenger_count) details += `<div class="detail-row"><span class="detail-label">Passengers</span><span class="detail-value">${data.passengers || data.passenger_count}</span></div>`;
          if (data.aircraft_type || data.aircraft) details += `<div class="detail-row"><span class="detail-label">Aircraft Type</span><span class="detail-value">${data.aircraft_type || data.aircraft}</span></div>`;
          if (data.manufacturer) details += `<div class="detail-row"><span class="detail-label">Manufacturer</span><span class="detail-value">${data.manufacturer}</span></div>`;
          if (data.capacity) details += `<div class="detail-row"><span class="detail-label">Aircraft Capacity</span><span class="detail-value">${data.capacity} passengers</span></div>`;
          if (data.category) details += `<div class="detail-row"><span class="detail-label">Aircraft Category</span><span class="detail-value">${data.category}</span></div>`;
          if (data.range) details += `<div class="detail-row"><span class="detail-label">Range</span><span class="detail-value">${data.range}</span></div>`;
          if (data.aircraft_registration) details += `<div class="detail-row"><span class="detail-label">Aircraft Registration</span><span class="detail-value">${data.aircraft_registration}</span></div>`;

          // Pricing Information
          if (data.final_price && data.currency) details += `<div class="detail-row"><span class="detail-label">Final Price</span><span class="detail-value">${formatPrice(data.final_price, data.currency)}</span></div>`;
          if (data.original_price && data.currency && data.original_price !== data.final_price) details += `<div class="detail-row"><span class="detail-label">Original Price</span><span class="detail-value">${formatPrice(data.original_price, data.currency)}</span></div>`;
          if (data.estimated_cost) details += `<div class="detail-row"><span class="detail-label">Estimated Cost</span><span class="detail-value">${formatPrice(data.estimated_cost, data.currency)}</span></div>`;
          if (data.payment_method) details += `<div class="detail-row"><span class="detail-label">Payment Method</span><span class="detail-value">${data.payment_method.charAt(0).toUpperCase() + data.payment_method.slice(1)}</span></div>`;

          // Service Information
          // if (data.operator) details += `<div class="detail-row"><span class="detail-label">Operator</span><span class="detail-value">${data.operator}</span></div>`;
          if (data.booking_reference) details += `<div class="detail-row"><span class="detail-label">Booking Reference</span><span class="detail-value">${data.booking_reference}</span></div>`;
          if (data.empty_leg_id) details += `<div class="detail-row"><span class="detail-label">Empty Leg ID</span><span class="detail-value">${data.empty_leg_id}</span></div>`;
          if (data.additional_services && data.additional_services.length > 0) {
            details += `<div class="detail-row"><span class="detail-label">Additional Services</span><span class="detail-value">${data.additional_services.map(s => s.replace('_', ' ').replace('-', ' ')).join(', ')}</span></div>`;
          }
          if (data.special_requests) details += `<div class="detail-row"><span class="detail-label">Special Requests</span><span class="detail-value">${data.special_requests}</span></div>`;

          // NFT-specific information for discount and free flight bookings
          if (record.type === 'nft_discount_empty_leg' || record.type === 'nft_free_flight') {
            details += `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">`;
            details += `<div class="detail-row"><span class="detail-label">NFT Benefit Type</span><span class="detail-value">${record.type === 'nft_free_flight' ? 'Free Flight' : '10% Discount'}</span></div>`;
            
            if (data.nft_contract_address) details += `<div class="detail-row"><span class="detail-label">NFT Contract</span><span class="detail-value">${data.nft_contract_address}</span></div>`;
            if (data.wallet_address) details += `<div class="detail-row"><span class="detail-label">Wallet Address</span><span class="detail-value">${data.wallet_address}</span></div>`;
            if (data.signature_hash) details += `<div class="detail-row"><span class="detail-label">Signature Hash</span><span class="detail-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">${data.signature_hash}</span></div>`;
            if (data.signature_message) details += `<div class="detail-row"><span class="detail-label">Signature Message</span><span class="detail-value">${data.signature_message}</span></div>`;
            if (data.original_price && data.final_price && data.original_price !== data.final_price) {
              const savings = data.original_price - data.final_price;
              details += `<div class="detail-row"><span class="detail-label">NFT Savings</span><span class="detail-value">${formatPrice(savings, data.currency)}</span></div>`;
            }
            details += `</div>`;
          }
          break;

        case 'private_jet_charter':
          // Route Information
          if (data.departure) details += `<div class="detail-row"><span class="detail-label">From</span><span class="detail-value">${data.departure}</span></div>`;
          if (data.destination) details += `<div class="detail-row"><span class="detail-label">To</span><span class="detail-value">${data.destination}</span></div>`;

          // Date & Time Information
          if (data.departure_date) details += `<div class="detail-row"><span class="detail-label">Departure Date</span><span class="detail-value">${formatDate(data.departure_date)}</span></div>`;
          if (data.departure_time) details += `<div class="detail-row"><span class="detail-label">Departure Time</span><span class="detail-value">${data.departure_time}</span></div>`;
          if (data.return_date) details += `<div class="detail-row"><span class="detail-label">Return Date</span><span class="detail-value">${formatDate(data.return_date)}</span></div>`;

          // Passenger & Aircraft Information
          if (data.passengers) details += `<div class="detail-row"><span class="detail-label">Passengers</span><span class="detail-value">${data.passengers}</span></div>`;
          if (data.aircraft) details += `<div class="detail-row"><span class="detail-label">Aircraft</span><span class="detail-value">${data.aircraft}</span></div>`;
          if (data.manufacturer) details += `<div class="detail-row"><span class="detail-label">Manufacturer</span><span class="detail-value">${data.manufacturer}</span></div>`;
          if (data.capacity) details += `<div class="detail-row"><span class="detail-label">Aircraft Capacity</span><span class="detail-value">${data.capacity} passengers</span></div>`;
          if (data.category) details += `<div class="detail-row"><span class="detail-label">Aircraft Category</span><span class="detail-value">${data.category}</span></div>`;
          if (data.range) details += `<div class="detail-row"><span class="detail-label">Range</span><span class="detail-value">${data.range}</span></div>`;

          // Additional Services
          if (data.additional_services && data.additional_services.length > 0) {
            details += `<div class="detail-row"><span class="detail-label">Additional Services</span><span class="detail-value">${data.additional_services.map(s => s.replace('_', ' ').replace('-', ' ')).join(', ')}</span></div>`;
          }

          // Contact Information
          if (data.customer_name) details += `<div class="detail-row"><span class="detail-label">Customer Name</span><span class="detail-value">${data.customer_name}</span></div>`;
          if (data.customer_email) details += `<div class="detail-row"><span class="detail-label">Customer Email</span><span class="detail-value">${data.customer_email}</span></div>`;
          if (data.customer_phone) details += `<div class="detail-row"><span class="detail-label">Customer Phone</span><span class="detail-value">${data.customer_phone}</span></div>`;
          break;

        case 'helicopter_charter':
          // Search Criteria
          if (data.search_criteria) {
            const criteria = data.search_criteria;
            if (criteria.departure) details += `<div class="detail-row"><span class="detail-label">Departure</span><span class="detail-value">${criteria.departure}</span></div>`;
            if (criteria.arrival) details += `<div class="detail-row"><span class="detail-label">Arrival</span><span class="detail-value">${criteria.arrival}</span></div>`;
            if (criteria.date) details += `<div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatDate(criteria.date)}</span></div>`;
            if (criteria.time) details += `<div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${criteria.time}</span></div>`;
            if (criteria.duration) details += `<div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">${criteria.duration} hours</span></div>`;
            if (criteria.passengers) details += `<div class="detail-row"><span class="detail-label">Passengers</span><span class="detail-value">${criteria.passengers}</span></div>`;
          }

          // Helicopter Information
          if (data.helicopter_name) details += `<div class="detail-row"><span class="detail-label">Helicopter</span><span class="detail-value">${data.helicopter_name}</span></div>`;
          if (data.helicopter_type) details += `<div class="detail-row"><span class="detail-label">Helicopter Type</span><span class="detail-value">${data.helicopter_type}</span></div>`;
          if (data.capacity) details += `<div class="detail-row"><span class="detail-label">Capacity</span><span class="detail-value">${data.capacity} passengers</span></div>`;
          if (data.location) details += `<div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">${data.location}</span></div>`;
          if (data.price) details += `<div class="detail-row"><span class="detail-label">Price</span><span class="detail-value">$${data.price.toLocaleString()}</span></div>`;

          // Contact Information
          if (data.customer_name) details += `<div class="detail-row"><span class="detail-label">Customer Name</span><span class="detail-value">${data.customer_name}</span></div>`;
          if (data.customer_email) details += `<div class="detail-row"><span class="detail-label">Customer Email</span><span class="detail-value">${data.customer_email}</span></div>`;
          if (data.customer_phone) details += `<div class="detail-row"><span class="detail-label">Customer Phone</span><span class="detail-value">${data.customer_phone}</span></div>`;
          break;

        case 'fixed_offer':
          // Offer Details
          if (data.offer_title) details += `<div class="detail-row"><span class="detail-label">Offer Title</span><span class="detail-value">${data.offer_title}</span></div>`;
          if (data.origin) details += `<div class="detail-row"><span class="detail-label">Origin</span><span class="detail-value">${data.origin}</span></div>`;
          if (data.destination) details += `<div class="detail-row"><span class="detail-label">Destination</span><span class="detail-value">${data.destination}</span></div>`;
          if (data.duration) details += `<div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">${data.duration}</span></div>`;
          if (data.passengers) details += `<div class="detail-row"><span class="detail-label">Passengers</span><span class="detail-value">${data.passengers}</span></div>`;
          if (data.departure_date) details += `<div class="detail-row"><span class="detail-label">Departure Date</span><span class="detail-value">${formatDate(data.departure_date)}</span></div>`;

          // Pricing
          if (data.converted_price && data.selected_currency) details += `<div class="detail-row"><span class="detail-label">Price</span><span class="detail-value">${formatPrice(data.converted_price, data.selected_currency)}</span></div>`;
          if (data.original_price && data.original_currency && data.original_price !== data.converted_price) {
            details += `<div class="detail-row"><span class="detail-label">Original Price</span><span class="detail-value">${formatPrice(data.original_price, data.original_currency)}</span></div>`;
          }
          if (data.price_on_request) details += `<div class="detail-row"><span class="detail-label">Pricing</span><span class="detail-value">Price on Request</span></div>`;

          // Booking Information
          if (data.booking_source) details += `<div class="detail-row"><span class="detail-label">Booking Source</span><span class="detail-value">${data.booking_source.replace('_', ' ')}</span></div>`;
          if (data.view_mode) details += `<div class="detail-row"><span class="detail-label">View Mode</span><span class="detail-value">${data.view_mode}</span></div>`;
          if (data.offer_id) details += `<div class="detail-row"><span class="detail-label">Offer ID</span><span class="detail-value">${data.offer_id}</span></div>`;

          // Client Information
          if (data.client_info) {
            const client = data.client_info;
            if (client.name) details += `<div class="detail-row"><span class="detail-label">Client Name</span><span class="detail-value">${client.name}</span></div>`;
            if (client.email) details += `<div class="detail-row"><span class="detail-label">Client Email</span><span class="detail-value">${client.email}</span></div>`;
          }
          break;

        case 'yacht_charter':
          if (data.location) details += `<div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">${data.location}</span></div>`;
          if (data.charter_dates) details += `<div class="detail-row"><span class="detail-label">Charter Dates</span><span class="detail-value">${data.charter_dates}</span></div>`;
          if (data.guests) details += `<div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">${data.guests}</span></div>`;
          if (data.yacht_size) details += `<div class="detail-row"><span class="detail-label">Yacht Size</span><span class="detail-value">${data.yacht_size}</span></div>`;
          break;

        case 'luxury_car':
          if (data.pickup_location) details += `<div class="detail-row"><span class="detail-label">Pickup Location</span><span class="detail-value">${data.pickup_location}</span></div>`;
          if (data.dropoff_location) details += `<div class="detail-row"><span class="detail-label">Drop-off Location</span><span class="detail-value">${data.dropoff_location}</span></div>`;
          if (data.rental_dates) details += `<div class="detail-row"><span class="detail-label">Rental Period</span><span class="detail-value">${data.rental_dates}</span></div>`;
          if (data.car_type) details += `<div class="detail-row"><span class="detail-label">Vehicle Type</span><span class="detail-value">${data.car_type}</span></div>`;
          break;

        case 'ai_chat_bulk':
          // AI Chat Bulk Request - contains multiple services
          if (data.summary) {
            const summary = data.summary;
            details += `<div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 16px; border-radius: 12px; margin: 16px 0;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 20px;">🤖</span>
                <span style="font-weight: 600; font-size: 16px;">AI Concierge Request</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px;">
                  <div style="font-size: 12px; opacity: 0.9;">Services</div>
                  <div style="font-size: 20px; font-weight: 700;">${summary.services_count || 0}</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px;">
                  <div style="font-size: 12px; opacity: 0.9;">Custom Extras</div>
                  <div style="font-size: 20px; font-weight: 700;">${summary.extras_count || 0}</div>
                </div>
              </div>
            </div>`;
          }

          // List all items in the bulk request
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            details += `<div style="margin-top: 20px;"><h4 style="margin: 0 0 12px 0; color: #374151;">Requested Services</h4>`;

            data.items.forEach((item: any, index: number) => {
              const itemEmoji = item.type === 'empty_legs' ? '🛩️' :
                               item.type === 'jets' || item.type === 'aircraft' ? '✈️' :
                               item.type === 'helicopters' ? '🚁' :
                               item.type === 'luxury_cars' || item.type === 'cars' ? '🚗' :
                               item.type === 'yachts' ? '🛥️' :
                               item.type === 'transfers' ? '🚐' :
                               item.isCustomRequest ? '🍷' : '📦';

              const isEstimate = item.isEstimate || item.requiresConfirmation;
              const priceLabel = isEstimate ? '~' : '';

              details += `<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span style="font-size: 18px;">${itemEmoji}</span>
                      <span style="font-weight: 600; color: #111827;">${item.name || item.model || 'Service'}</span>
                      ${isEstimate ? '<span style="background: #fef3c7; color: #92400e; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">TBC</span>' : ''}
                    </div>
                    ${item.from && item.to ? `<div style="color: #6b7280; font-size: 13px;">${item.from} → ${item.to}</div>` : ''}
                    ${item.date ? `<div style="color: #6b7280; font-size: 13px;">📅 ${item.date}${item.time ? ' at ' + item.time : ''}</div>` : ''}
                    ${item.passengers ? `<div style="color: #6b7280; font-size: 13px;">👥 ${item.passengers} passengers</div>` : ''}
                    ${item.quantity && item.quantity > 1 ? `<div style="color: #6b7280; font-size: 13px;">Qty: ${item.quantity}</div>` : ''}
                    ${item.category ? `<div style="color: #6b7280; font-size: 13px; text-transform: capitalize;">${item.category}</div>` : ''}
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: 700; font-size: 16px; color: #111827;">${priceLabel}€${(item.price || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>`;
            });

            details += `</div>`;
          }

          // Payment preference
          if (data.payment_method || data.preferred_payment) {
            const paymentMethod = data.payment_method || data.preferred_payment;
            const paymentEmoji = paymentMethod === 'crypto' ? '₿' : paymentMethod === 'card' ? '💳' : '🏦';
            details += `<div class="detail-row">
              <span class="detail-label">Preferred Payment</span>
              <span class="detail-value">${paymentEmoji} ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</span>
            </div>`;
          }

          // Totals summary
          if (data.summary) {
            const summary = data.summary;
            details += `<div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin-top: 16px;">
              <h4 style="margin: 0 0 12px 0; color: #166534;">Pricing Summary</h4>
              ${summary.services_subtotal ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="color: #6b7280;">Services</span><span>€${summary.services_subtotal.toLocaleString()}</span></div>` : ''}
              ${summary.extras_subtotal ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="color: #6b7280;">Custom Extras</span><span>~€${summary.extras_subtotal.toLocaleString()}</span></div>` : ''}
              ${summary.catering_total ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="color: #6b7280;">Catering</span><span>€${summary.catering_total.toLocaleString()}</span></div>` : ''}
              ${summary.airport_fees ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="color: #6b7280;">Airport Fees</span><span>€${summary.airport_fees.toLocaleString()}</span></div>` : ''}
              ${summary.vat_amount ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="color: #6b7280;">VAT (8.1%)</span><span>€${summary.vat_amount.toLocaleString()}</span></div>` : ''}
              <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #86efac;">
                <span style="font-weight: 700; color: #166534;">Estimated Total</span>
                <span style="font-weight: 700; font-size: 18px; color: #166534;">€${(summary.grand_total || 0).toLocaleString()}</span>
              </div>
              ${summary.has_estimates || summary.has_custom_requests ? '<div style="font-size: 11px; color: #6b7280; margin-top: 8px;">* Some items require confirmation - final pricing may vary</div>' : ''}
            </div>`;
          }
          break;

        case 'support':
          if (data.subject) details += `<div class="detail-row"><span class="detail-label">Subject</span><span class="detail-value">${data.subject}</span></div>`;
          if (data.priority) details += `<div class="detail-row"><span class="detail-label">Priority</span><span class="detail-value">${data.priority.toUpperCase()}</span></div>`;
          if (data.category) details += `<div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${data.category}</span></div>`;
          break;

        case 'document':
          if (data.document_type) details += `<div class="detail-row"><span class="detail-label">Document Type</span><span class="detail-value">${data.document_type}</span></div>`;
          if (data.purpose) details += `<div class="detail-row"><span class="detail-label">Purpose</span><span class="detail-value">${data.purpose}</span></div>`;
          break;
      }

      // Add description/message if available
      if (data.message || data.description || data.notes) {
        const message = data.message || data.description || data.notes;
        details += `<div class="detail-row">
          <span class="detail-label">Message</span>
          <span class="detail-value" style="white-space: pre-wrap;">${message}</span>
        </div>`;
      }

      return details;
    };

    // User confirmation email template
    const userEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Request Confirmation - PrivateCharterX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: black; color: white; padding: 32px; text-align: center; }
        .content { padding: 32px; }
        .request-card { background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid black; }
        .detail-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; min-width: 120px; }
        .detail-value { font-weight: 600; color: #111827; text-align: right; flex: 1; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; background-color: black; color: white; }
        .button { display: inline-block; background-color: black; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0; }
        .footer { padding: 32px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-weight: 300;">${typeInfo.emoji} PrivateCharterX</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.8;">Your ${typeInfo.name.toLowerCase()} has been received</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>Thank you for choosing PrivateCharterX. We have received your ${typeInfo.name.toLowerCase()} and our team will review it shortly.</p>
          
          <div class="request-card">
            <h3 style="margin-top: 0;">Request Details</h3>
            ${generateRequestDetails(record)}
            
            <div class="detail-row" style="border: none; margin-top: 16px;">
              <span class="detail-label">Submitted</span>
              <span class="detail-value">${formatDateTime(record.created_at)}</span>
            </div>
          </div>
          
          <h3>What happens next?</h3>
          <ol>
            <li>Our specialists will review your request within 2-4 hours</li>
            <li>We'll contact you ${userPhone ? `at ${userPhone} or ` : ''}at ${userEmail} with updates</li>
            <li>You'll receive detailed information and next steps</li>
            <li>We'll coordinate all arrangements to your satisfaction</li>
          </ol>
          
          <p><strong>Questions?</strong> Contact our 24/7 support team at <a href="mailto:support@privatecharterx.com">support@privatecharterx.com</a>.</p>
          
          <div style="text-align: center;">
            <a href="mailto:support@privatecharterx.com" class="button">Contact Support</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated confirmation. Please do not reply to this email.</p>
          <p>PrivateCharterX - Blockchain powered premium aviation services</p>
          <p>Reference: #${record.id.slice(-8).toUpperCase()}</p>
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
      <title>New ${typeInfo.name} - PrivateCharterX Admin</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: black; color: white; padding: 32px; text-align: center; }
        .content { padding: 32px; }
        .request-card { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 4px 0; }
        .detail-label { color: #6b7280; min-width: 140px; }
        .detail-value { font-weight: 600; color: #111827; }
        .urgent { background-color: #dc2626; color: white; padding: 12px; border-radius: 8px; margin: 16px 0; text-align: center; }
        .contact-info { background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .button { display: inline-block; background-color: black; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 8px 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-weight: 600;">${typeInfo.emoji} NEW ${typeInfo.name.toUpperCase()}</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Requires attention</p>
        </div>
        
        <div class="content">
          <div class="urgent">
            <strong>⏰ ACTION REQUIRED:</strong> New ${typeInfo.name.toLowerCase()} received - Review and respond promptly
          </div>
          
          ${record.type === 'nft_discount_empty_leg' || record.type === 'nft_free_flight' ? `
          <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #92400e;">🎫 NFT BENEFIT USAGE ALERT</h3>
            <p style="margin: 0; color: #92400e; font-weight: 600;">
              Customer is using NFT for ${record.type === 'nft_free_flight' ? 'FREE FLIGHT benefit' : '10% DISCOUNT benefit'}
            </p>
            <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">
              ⚠️ Verify NFT ownership and signature before confirming booking
            </p>
          </div>
          ` : ''}
          
          <div class="request-card">
            <h3 style="margin-top: 0; color: #dc2626;">Request Details</h3>
            
            <div class="detail-row">
              <span class="detail-label">Full Request ID:</span>
              <span class="detail-value">${record.id}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Submitted:</span>
              <span class="detail-value">${formatDateTime(record.created_at)}</span>
            </div>
            
            ${generateRequestDetails(record)}
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
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="mailto:${userEmail}" class="button">Reply to Customer</a>
            ${userPhone ? `<a href="tel:${userPhone}" class="button">Call Customer</a>` : ''}
            <a href="https://dashboard.privatecharterx.com/admin/requests" class="button">View in Admin</a>
          </div>
          
          <h3>Next Steps:</h3>
          <ol>
            <li><strong>Review request details</strong> and verify requirements</li>
            <li><strong>Contact customer</strong> ${userPhone ? `at ${userPhone} or ` : ''}${userEmail}</li>
            <li><strong>Provide quote/information</strong> based on request type</li>
            <li><strong>Update request status</strong> in admin dashboard</li>
            <li><strong>Follow up</strong> to ensure customer satisfaction</li>
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
        ToAddresses: [userEmail],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `${typeInfo.emoji} Request Confirmation - ${typeInfo.name} #${record.id.slice(-8).toUpperCase()}`,
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
      FromEmailAddress: `PrivateCharterX Requests <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [ADMIN_EMAIL],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `${typeInfo.emoji} NEW ${typeInfo.name.toUpperCase()} - ${userName} - #${record.id.slice(-8).toUpperCase()}`,
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
        error: userEmailError,
        to: userEmail
      },
      adminEmail: {
        sent: !adminEmailError,
        messageId: adminEmailResult?.MessageId || null,
        error: adminEmailError,
        to: ADMIN_EMAIL
      },
      requestId: record.id,
      requestType: record.type,
      userName: userName
    };

    console.log('User request email notifications result:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: result.success ? 200 : 207 // 207 Multi-Status for partial success
    });

  } catch (error) {
    console.error('Error in user-request-notifications function:', error);

    // Handle specific AWS SES errors
    let errorMessage = 'Failed to send user request email notifications';
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