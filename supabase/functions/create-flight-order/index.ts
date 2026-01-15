import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface Passenger {
  id?: string;
  type: 'adult' | 'child' | 'infant_without_seat';
  givenName: string;
  familyName: string;
  gender: 'male' | 'female';
  email?: string;
  phone?: string;
  bornOn: string;            // YYYY-MM-DD
  passportNumber?: string;
  passportExpiryDate?: string;
  nationality?: string;
}

interface SeatSelection {
  passengerId: string;
  segmentId: string;
  seatId: string;
  seatDesignator: string;
  price?: number;
}

interface OrderRequest {
  offerId: string;
  passengers: Passenger[];
  userId: string;
  email: string;
  phone?: string;
  selectedSeats?: SeatSelection[];
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const duffelApiToken = Deno.env.get('DUFFEL_API_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!duffelApiToken) {
      throw new Error('Duffel API token not configured');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const orderData: OrderRequest = await req.json();
    const { offerId, passengers, userId, email, phone, selectedSeats, metadata } = orderData;

    console.log('=== CREATE FLIGHT ORDER ===');
    console.log(`Offer ID: ${offerId}`);
    console.log(`Passengers: ${passengers.length}`);
    console.log(`User: ${userId}`);
    console.log('===========================');

    // Validate required fields
    if (!offerId || !passengers || passengers.length === 0 || !userId || !email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: offerId, passengers, userId, email'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // First, get the offer details to confirm it's still valid
    const offerResponse = await fetch(`https://api.duffel.com/air/offers/${offerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${duffelApiToken}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        'Accept': 'application/json'
      }
    });

    const offerResult = await offerResponse.json();

    if (!offerResponse.ok) {
      console.error('Error fetching offer:', offerResult);
      throw new Error(`Offer not found or expired: ${offerResult.errors?.[0]?.message || 'Unknown error'}`);
    }

    const offer = offerResult.data;

    // Check if offer has expired
    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      throw new Error('This flight offer has expired. Please search again for current prices.');
    }

    console.log(`Offer valid until: ${offer.expires_at}`);
    console.log(`Total price: ${offer.total_currency} ${offer.total_amount}`);

    // Format passengers for Duffel API
    const duffelPassengers = passengers.map((passenger, index) => ({
      id: offer.passengers[index]?.id, // Use passenger ID from the offer
      type: passenger.type,
      given_name: passenger.givenName,
      family_name: passenger.familyName,
      gender: passenger.gender === 'male' ? 'm' : 'f',
      email: passenger.email || email,
      phone_number: passenger.phone || phone || undefined,
      born_on: passenger.bornOn,
      identity_documents: passenger.passportNumber ? [{
        type: 'passport',
        unique_identifier: passenger.passportNumber,
        expires_on: passenger.passportExpiryDate || undefined,
        issuing_country_code: passenger.nationality || undefined
      }] : undefined
    }));

    // Create order with Duffel
    const orderRequestBody = {
      data: {
        type: 'instant',
        selected_offers: [offerId],
        passengers: duffelPassengers,
        payments: [{
          type: 'balance',
          amount: offer.total_amount,
          currency: offer.total_currency
        }],
        metadata: {
          user_id: userId,
          booking_source: 'privatecharterx',
          ...metadata
        }
      }
    };

    console.log('Creating Duffel order...');

    const orderResponse = await fetch('https://api.duffel.com/air/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${duffelApiToken}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderRequestBody)
    });

    const orderResult = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('Duffel order creation error:', orderResult);
      const errorMessage = orderResult.errors?.map((e: any) => e.message).join(', ') || 'Failed to create order';
      throw new Error(`Duffel order error: ${errorMessage}`);
    }

    const order = orderResult.data;
    console.log(`Order created: ${order.id}`);
    console.log(`Booking reference: ${order.booking_reference}`);

    // Process seat selections if any
    let seatServiceOrders = [];
    if (selectedSeats && selectedSeats.length > 0) {
      console.log(`Processing ${selectedSeats.length} seat selections...`);

      for (const seat of selectedSeats) {
        try {
          const seatServiceBody = {
            data: {
              offer_id: offerId,
              payment: {
                type: 'balance',
                amount: seat.price?.toString() || '0',
                currency: offer.total_currency
              },
              services: [{
                id: seat.seatId,
                quantity: 1
              }]
            }
          };

          const seatResponse = await fetch('https://api.duffel.com/air/order_services', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${duffelApiToken}`,
              'Content-Type': 'application/json',
              'Duffel-Version': 'v2'
            },
            body: JSON.stringify(seatServiceBody)
          });

          if (seatResponse.ok) {
            const seatResult = await seatResponse.json();
            seatServiceOrders.push(seatResult.data);
            console.log(`Seat ${seat.seatDesignator} booked successfully`);
          } else {
            console.warn(`Failed to book seat ${seat.seatDesignator}:`, await seatResponse.text());
          }
        } catch (seatError) {
          console.warn(`Error booking seat ${seat.seatDesignator}:`, seatError);
        }
      }
    }

    // Extract flight details for storage
    const firstSlice = order.slices?.[0];
    const lastSlice = order.slices?.[order.slices.length - 1];
    const firstSegment = firstSlice?.segments?.[0];

    // Store booking in database
    const bookingData = {
      user_id: userId,
      booking_type: 'commercial_flight',
      service_id: order.id,
      service_title: `${firstSlice?.origin?.iata_code} → ${firstSlice?.destination?.iata_code}`,
      service_description: `Flight on ${firstSegment?.operating_carrier?.name || 'Airline'} - ${order.booking_reference}`,
      origin: firstSlice?.origin?.iata_code,
      destination: lastSlice?.destination?.iata_code || firstSlice?.destination?.iata_code,
      departure_date: firstSegment?.departing_at,
      return_date: order.slices?.length > 1 ? order.slices[1]?.segments?.[0]?.departing_at : null,
      passengers: passengers.length,
      aircraft_type: firstSegment?.operating_carrier?.name,
      base_price: parseFloat(order.total_amount),
      platform_fee: 0,
      processing_fee: Math.round(parseFloat(order.total_amount) * 0.081 * 100) / 100, // 8.1% VAT
      total_amount: Math.round(parseFloat(order.total_amount) * 1.081 * 100) / 100,
      currency: order.total_currency,
      payment_method: 'crypto',
      payment_status: 'pending',
      booking_status: 'confirmed', // Duffel order is confirmed
      contact_name: `${passengers[0].givenName} ${passengers[0].familyName}`,
      contact_email: email,
      contact_phone: phone,
      metadata: {
        duffel_order_id: order.id,
        booking_reference: order.booking_reference,
        offer_id: offerId,
        passengers: passengers.map(p => ({
          name: `${p.givenName} ${p.familyName}`,
          type: p.type,
          email: p.email
        })),
        selected_seats: selectedSeats || [],
        seat_service_orders: seatServiceOrders.map(s => s.id),
        slices: order.slices?.map((slice: any) => ({
          origin: slice.origin?.iata_code,
          destination: slice.destination?.iata_code,
          departure: slice.segments?.[0]?.departing_at,
          arrival: slice.segments?.[slice.segments.length - 1]?.arriving_at,
          duration: slice.duration,
          segments: slice.segments?.map((seg: any) => ({
            flight_number: `${seg.marketing_carrier?.iata_code}${seg.marketing_carrier_flight_number}`,
            aircraft: seg.aircraft?.name,
            departure_airport: seg.origin?.iata_code,
            arrival_airport: seg.destination?.iata_code,
            departure_time: seg.departing_at,
            arrival_time: seg.arriving_at,
            cabin_class: seg.passengers?.[0]?.cabin_class
          }))
        })),
        conditions: order.conditions,
        created_at: order.created_at
      }
    };

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('user_bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('Error saving booking to database:', bookingError);
      // Don't throw - the Duffel order is created, we just failed to save locally
    } else {
      console.log(`Booking saved to database: ${booking.id}`);
    }

    // Return success with order details
    return new Response(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        bookingReference: order.booking_reference,
        status: order.status,
        totalAmount: order.total_amount,
        totalCurrency: order.total_currency,
        passengers: order.passengers?.map((p: any) => ({
          id: p.id,
          name: `${p.given_name} ${p.family_name}`,
          type: p.type
        })),
        slices: order.slices?.map((slice: any) => ({
          origin: slice.origin?.iata_code,
          originCity: slice.origin?.city_name,
          destination: slice.destination?.iata_code,
          destinationCity: slice.destination?.city_name,
          departure: slice.segments?.[0]?.departing_at,
          arrival: slice.segments?.[slice.segments.length - 1]?.arriving_at,
          duration: slice.duration,
          segments: slice.segments?.length || 1
        })),
        documents: order.documents || [],
        conditions: order.conditions
      },
      bookingId: booking?.id,
      seatSelections: seatServiceOrders.length,
      priceBreakdown: {
        basePrice: parseFloat(order.total_amount),
        vatAmount: Math.round(parseFloat(order.total_amount) * 0.081 * 100) / 100,
        totalAmount: Math.round(parseFloat(order.total_amount) * 1.081 * 100) / 100,
        currency: order.total_currency
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create flight order error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create flight order'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
