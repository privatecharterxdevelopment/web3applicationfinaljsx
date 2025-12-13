import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Fallback exchange rates if API fails (updated Dec 2024)
const FALLBACK_RATES = {
  GBP: 0.79,  // 1 USD = 0.79 GBP
  EUR: 0.92,  // 1 USD = 0.92 EUR
};

// Fetch current exchange rates from ExchangeRate-API
async function getExchangeRate(fromCurrency: string): Promise<number> {
  const API_KEY = Deno.env.get('EXCHANGERATE_API_KEY') || 'f51793adf9d3c8de77732b07';

  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`);
    const data = await response.json();

    if (data.result === 'success' && data.conversion_rates) {
      const rate = data.conversion_rates[fromCurrency.toUpperCase()];
      if (rate) {
        console.log(`Exchange rate fetched: 1 USD = ${rate} ${fromCurrency}`);
        return rate;
      }
    }
    throw new Error('Invalid API response');
  } catch (error) {
    console.error('Error fetching exchange rate, using fallback:', error);
    return FALLBACK_RATES[fromCurrency.toUpperCase() as keyof typeof FALLBACK_RATES] || 1;
  }
}

// Convert amount from source currency to USD
function convertToUSD(amount: number, fromCurrency: string, rate: number): number {
  if (fromCurrency.toUpperCase() === 'USD') return amount;
  // Rate is USD→fromCurrency, so to get fromCurrency→USD we divide
  return amount / rate;
}

interface PaymentRequest {
  serviceType: 'empty_leg' | 'adventure_package' | 'co2_certificate' | 'hotel_booking';
  serviceId: string;
  userId: string;
  walletAddress?: string;
  email: string;
  contactName?: string;
  contactPhone?: string;
  passengers?: number;
  specialRequests?: string;
  // Hotel-specific fields
  hotelData?: {
    hotelId: string;
    hotelName: string;
    hotelAddress?: string;
    hotelCity?: string;
    hotelImage?: string;
    roomType?: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
    pricePerNight: number;
    totalPrice: number;
    boardType?: string;
  };
}

interface ServiceDetails {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  price: number;
  currency: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  aircraft_type?: string;
  duration?: string;
  co2_tons?: number;
  certification_type?: string;
}

// Fee structure
const PLATFORM_FEE_PERCENT = 0.025; // 2.5%
const COINGATE_FEE_PERCENT = 0.01;  // 1%

// No manual currency conversion - CoinGate handles all conversions automatically

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const paymentData: PaymentRequest = await req.json();
    const { serviceType, serviceId, userId, walletAddress, email, contactName, contactPhone, passengers, specialRequests, hotelData } = paymentData;

    // Validate required fields
    if (!serviceType || !serviceId || !userId || !email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: serviceType, serviceId, userId, email'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get service details based on type
    let serviceDetails: ServiceDetails | null = null;
    let tableName = '';

    switch (serviceType) {
      case 'empty_leg':
        tableName = 'EmptyLegs_';
        const { data: emptyLeg, error: elError } = await supabaseAdmin
          .from('EmptyLegs_')
          .select('*')
          .eq('id', serviceId)
          .single();

        if (elError || !emptyLeg) {
          throw new Error(`Empty leg not found: ${serviceId}`);
        }

        // Empty Legs prices are stored in GBP in the database
        // We need to convert to USD for CoinGate payment
        const priceGBP = parseFloat(emptyLeg.price || emptyLeg.discounted_price || 0);

        // Fetch current GBP→USD exchange rate
        const gbpRate = await getExchangeRate('GBP');
        const priceUSD = convertToUSD(priceGBP, 'GBP', gbpRate);

        console.log(`EmptyLeg price conversion: £${priceGBP} GBP → $${priceUSD.toFixed(2)} USD (rate: ${gbpRate})`);

        serviceDetails = {
          id: emptyLeg.id,
          title: `${emptyLeg.departure_airport || emptyLeg.from_iata} → ${emptyLeg.arrival_airport || emptyLeg.to_iata}`,
          description: emptyLeg.description || `Empty leg flight on ${emptyLeg.aircraft_type}`,
          image_url: emptyLeg.image_url || emptyLeg.aircraft_image,
          price: Math.round(priceUSD), // Rounded USD price
          currency: 'USD',
          origin: emptyLeg.departure_airport || emptyLeg.from_iata,
          destination: emptyLeg.arrival_airport || emptyLeg.to_iata,
          departure_date: emptyLeg.departure_date,
          aircraft_type: emptyLeg.aircraft_type
        };
        break;

      case 'adventure_package':
        tableName = 'adventure_packages';
        const { data: adventure, error: apError } = await supabaseAdmin
          .from('adventure_packages')
          .select('*')
          .eq('id', serviceId)
          .single();

        if (apError || !adventure) {
          throw new Error(`Adventure package not found: ${serviceId}`);
        }

        // Adventure packages prices are stored in EUR in the database
        // Convert to USD for CoinGate payment
        const adventurePriceEUR = parseFloat(adventure.price || adventure.base_price || 0);
        const eurRate = await getExchangeRate('EUR');
        const adventurePriceUSD = convertToUSD(adventurePriceEUR, 'EUR', eurRate);

        console.log(`Adventure price conversion: €${adventurePriceEUR} EUR → $${adventurePriceUSD.toFixed(2)} USD (rate: ${eurRate})`);

        serviceDetails = {
          id: adventure.id,
          title: adventure.title || adventure.name,
          description: adventure.description,
          image_url: adventure.image_url || adventure.cover_image,
          price: Math.round(adventurePriceUSD), // Rounded USD price
          currency: 'USD',
          origin: adventure.departure_location || adventure.origin,
          destination: adventure.destination,
          departure_date: adventure.start_date,
          return_date: adventure.end_date,
          duration: adventure.duration
        };
        break;

      case 'co2_certificate':
        tableName = 'co2_certificates';
        const { data: co2, error: co2Error } = await supabaseAdmin
          .from('co2_certificates')
          .select('*')
          .eq('id', serviceId)
          .single();

        if (co2Error || !co2) {
          throw new Error(`CO2 certificate not found: ${serviceId}`);
        }

        serviceDetails = {
          id: co2.id,
          title: co2.title || `CO2 Offset Certificate - ${co2.tons} tons`,
          description: co2.description || `Carbon offset certificate`,
          image_url: co2.image_url,
          price: parseFloat(co2.price || co2.amount),
          currency: 'USD', // All prices now in USD
          co2_tons: parseFloat(co2.tons || co2.co2_tons),
          certification_type: co2.certification_type || co2.type
        };
        break;

      case 'hotel_booking':
        tableName = 'hotel_bookings';
        // Hotel bookings get their data from the request (from AI Chat or HotelDetail)
        if (!hotelData) {
          throw new Error('Hotel booking data is required');
        }

        serviceDetails = {
          id: hotelData.hotelId || serviceId,
          title: `${hotelData.hotelName} - ${hotelData.roomType || 'Room'}`,
          description: `${hotelData.hotelCity || ''} · ${hotelData.checkIn} to ${hotelData.checkOut} · ${hotelData.guests} guest${hotelData.guests > 1 ? 's' : ''}`,
          image_url: hotelData.hotelImage,
          price: hotelData.totalPrice,
          currency: 'USD',
          origin: hotelData.hotelCity,
          departure_date: hotelData.checkIn,
          return_date: hotelData.checkOut
        };

        // Create hotel booking record in hotel_bookings table
        const { data: hotelBooking, error: hotelBookingError } = await supabaseAdmin
          .from('hotel_bookings')
          .insert({
            user_id: userId,
            hotel_id: hotelData.hotelId,
            hotel_name: hotelData.hotelName,
            hotel_address: hotelData.hotelAddress,
            hotel_city: hotelData.hotelCity,
            hotel_image: hotelData.hotelImage,
            check_in_date: hotelData.checkIn,
            check_out_date: hotelData.checkOut,
            room_type: hotelData.roomType,
            room_count: hotelData.rooms || 1,
            guests: hotelData.guests,
            total_price: hotelData.totalPrice,
            currency: 'USD',
            payment_method: 'crypto',
            payment_status: 'pending',
            booking_status: 'pending',
            guest_name: contactName,
            guest_email: email,
            guest_phone: contactPhone,
            special_requests: specialRequests,
            wallet_address: walletAddress
          })
          .select()
          .single();

        if (hotelBookingError) {
          console.error('Error creating hotel booking:', hotelBookingError);
          throw new Error('Failed to create hotel booking record');
        }

        // Use hotel booking ID as the service ID for the rest of the flow
        serviceDetails.id = hotelBooking.id;
        break;

      default:
        throw new Error(`Invalid service type: ${serviceType}`);
    }

    if (!serviceDetails) {
      throw new Error('Failed to load service details');
    }

    // Calculate fees including Swiss VAT 8.1%
    const VAT_RATE = 0.081; // 8.1% Swiss VAT
    const basePrice = serviceDetails.price;
    const platformFee = Math.round(basePrice * PLATFORM_FEE_PERCENT * 100) / 100;
    const vatAmount = Math.round(basePrice * VAT_RATE * 100) / 100;
    const coingateFee = Math.round(basePrice * COINGATE_FEE_PERCENT * 100) / 100;
    const totalAmount = Math.round((basePrice + platformFee + vatAmount + coingateFee) * 100) / 100;

    console.log('=== PRICE CALCULATION DEBUG ===');
    console.log(`Service: ${serviceType}, ID: ${serviceId}`);
    console.log(`Base Price: ${basePrice} ${serviceDetails.currency}`);
    console.log(`Platform Fee (2.5%): ${platformFee}`);
    console.log(`VAT (8.1%): ${vatAmount}`);
    console.log(`CoinGate Fee (1%): ${coingateFee}`);
    console.log(`Total Amount: ${totalAmount} ${serviceDetails.currency}`);
    console.log('================================');

    let booking: any;

    // For hotel bookings, we already created the record in hotel_bookings table
    // For other types, create in user_bookings
    if (serviceType === 'hotel_booking') {
      // The booking record was already created in the switch case above
      // serviceDetails.id contains the hotel booking ID
      booking = { id: serviceDetails.id };

      // Update the hotel booking with fee information
      await supabaseAdmin
        .from('hotel_bookings')
        .update({
          platform_fee: platformFee,
          vat_amount: vatAmount,
          coingate_fee: coingateFee,
          total_with_fees: totalAmount
        })
        .eq('id', serviceDetails.id);
    } else {
      // Create booking record in user_bookings for non-hotel services
      // Note: vat_amount is stored in processing_fee field (table doesn't have vat_amount column)
      const { data: userBooking, error: bookingError } = await supabaseAdmin
        .from('user_bookings')
        .insert({
          user_id: userId,
          booking_type: serviceType,
          service_id: serviceId,
          service_title: serviceDetails.title,
          service_description: serviceDetails.description,
          service_image_url: serviceDetails.image_url,
          origin: serviceDetails.origin,
          destination: serviceDetails.destination,
          departure_date: serviceDetails.departure_date,
          return_date: serviceDetails.return_date,
          passengers: passengers || 1,
          duration: serviceDetails.duration,
          aircraft_type: serviceDetails.aircraft_type,
          co2_tons_offset: serviceDetails.co2_tons,
          certification_type: serviceDetails.certification_type,
          base_price: basePrice,
          platform_fee: platformFee,
          processing_fee: vatAmount,  // Store VAT in processing_fee field
          coingate_fee: coingateFee,
          total_amount: totalAmount,
          currency: serviceDetails.currency,
          payment_method: 'crypto',
          payment_status: 'pending',
          booking_status: 'pending',
          wallet_address: walletAddress,
          contact_name: contactName,
          contact_email: email,
          contact_phone: contactPhone,
          special_requests: specialRequests,
          metadata: {
            source_table: tableName,
            created_via: 'coingate_payment',
            vat_rate: VAT_RATE,
            vat_amount: vatAmount
          }
        })
        .select()
        .single();

      if (bookingError || !userBooking) {
        console.error('Error creating booking:', bookingError);
        throw new Error('Failed to create booking record');
      }

      booking = userBooking;
    }

    // Get CoinGate API configuration
    const coingateApiToken = Deno.env.get('COINGATE_API_TOKEN');
    const coingateApiUrl = Deno.env.get('COINGATE_API_URL') || 'https://api-sandbox.coingate.com/v2';
    const appUrl = Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || 'https://privatecharterx.com';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!coingateApiToken) {
      throw new Error('CoinGate API token not configured');
    }

    // Create CoinGate order
    const coingateOrderData = {
      order_id: booking.id,
      price_amount: totalAmount,
      price_currency: serviceDetails.currency,
      receive_currency: 'EUR', // Receive in EUR
      title: serviceDetails.title,
      description: `PrivateCharterX - ${serviceType.replace('_', ' ')} booking`,
      callback_url: `${supabaseUrl}/functions/v1/coingate-webhook`,
      success_url: `${appUrl}/payment/success?booking_id=${booking.id}`,
      cancel_url: `${appUrl}/payment/cancel?booking_id=${booking.id}`,
      token: booking.id // For verification
    };

    console.log('Creating CoinGate order:', coingateOrderData);

    const coingateResponse = await fetch(`${coingateApiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${coingateApiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(coingateOrderData)
    });

    const coingateResult = await coingateResponse.json();

    if (!coingateResponse.ok) {
      console.error('CoinGate API error:', coingateResult);

      // Delete the booking record since payment creation failed
      if (serviceType === 'hotel_booking') {
        await supabaseAdmin
          .from('hotel_bookings')
          .delete()
          .eq('id', booking.id);
      } else {
        await supabaseAdmin
          .from('user_bookings')
          .delete()
          .eq('id', booking.id);
      }

      throw new Error(`CoinGate error: ${coingateResult.message || coingateResult.reason || 'Unknown error'}`);
    }

    console.log('CoinGate order created:', coingateResult);

    // Update booking with CoinGate details
    if (serviceType === 'hotel_booking') {
      const { error: updateError } = await supabaseAdmin
        .from('hotel_bookings')
        .update({
          coingate_order_id: coingateResult.id.toString(),
          coingate_payment_url: coingateResult.payment_url
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Error updating hotel booking with CoinGate details:', updateError);
      }
    } else {
      const { error: updateError } = await supabaseAdmin
        .from('user_bookings')
        .update({
          coingate_order_id: coingateResult.id.toString(),
          coingate_payment_url: coingateResult.payment_url,
          coingate_token: coingateResult.token,
          metadata: {
            ...booking.metadata,
            coingate_created_at: coingateResult.created_at,
            coingate_expire_at: coingateResult.expire_at
          }
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Error updating booking with CoinGate details:', updateError);
      }
    }

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      bookingId: booking.id,
      paymentUrl: coingateResult.payment_url,
      coingateOrderId: coingateResult.id,
      expiresAt: coingateResult.expire_at,
      priceBreakdown: {
        basePrice,
        platformFee,
        vatAmount,
        coingateFee,
        totalAmount,
        currency: serviceDetails.currency
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create payment error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create payment'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
