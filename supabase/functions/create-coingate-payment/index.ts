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
  serviceType: 'empty_leg' | 'adventure_package' | 'co2_certificate' | 'hotel_booking' | 'custom_extra' | 'wine' | 'delicatesse' | 'cigars' | 'service_fee' | 'fixed_offer' | 'commercial_flight' | 'flight';
  serviceId: string;
  userId: string;
  walletAddress?: string;
  email: string;
  contactName?: string;
  contactPhone?: string;
  passengers?: number;
  specialRequests?: string;
  // Pre-calculated price from frontend (already in USD with fees)
  priceUSD?: number;
  currency?: string;
  serviceTitle?: string;
  serviceDescription?: string;
  serviceImageUrl?: string;
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

// Fee structure - NO platform fee, NO processing fee - VAT only
// CoinGate processing fees are handled by CoinGate themselves, not added by us

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
    const { serviceType, serviceId, userId, walletAddress, email, contactName, contactPhone, passengers, specialRequests, hotelData, priceUSD, currency, serviceTitle, serviceDescription, serviceImageUrl } = paymentData;

    console.log('=== PAYMENT REQUEST RECEIVED ===');
    console.log('priceUSD from frontend:', priceUSD);
    console.log('currency:', currency);
    console.log('serviceTitle:', serviceTitle);
    console.log('================================');

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

        // USE THE PRE-CALCULATED USD PRICE FROM FRONTEND OR price_usd FROM DB
        let finalPrice: number;

        if (priceUSD && priceUSD > 0) {
          // Use the price passed from frontend (already in USD with fees included)
          finalPrice = priceUSD;
          console.log(`Using frontend price: $${finalPrice} USD (pre-calculated with fees)`);
        } else {
          // Fallback: use price_usd directly from database (no conversion needed)
          const dbPriceUSD = parseFloat(emptyLeg.price_usd || emptyLeg.price_in_usd || emptyLeg.price || 0);
          // Add fees (platform 2.5% + VAT 8.1% + coingate 1%)
          finalPrice = Math.round(dbPriceUSD * 1.116);
          console.log(`Using DB price_usd: $${dbPriceUSD} → $${finalPrice} USD (with fees)`);
        }

        serviceDetails = {
          id: emptyLeg.id,
          title: serviceTitle || `${emptyLeg.departure_airport || emptyLeg.from_iata} → ${emptyLeg.arrival_airport || emptyLeg.to_iata}`,
          description: serviceDescription || emptyLeg.description || `Empty leg flight on ${emptyLeg.aircraft_type}`,
          image_url: serviceImageUrl || emptyLeg.image_url || emptyLeg.aircraft_image,
          price: finalPrice, // USE THE FRONTEND PRICE - NO MORE CONVERSION!
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

      case 'wine':
        tableName = 'winery';
        const { data: wine, error: wineError } = await supabaseAdmin
          .from('winery')
          .select('*')
          .eq('id', serviceId)
          .single();

        if (wineError || !wine) {
          // If not found in database, use frontend-provided data
          if (priceUSD && serviceTitle) {
            console.log(`Wine not in DB, using frontend data: ${serviceTitle} - $${priceUSD}`);
            serviceDetails = {
              id: serviceId,
              title: serviceTitle || 'Wine Selection',
              description: serviceDescription || 'Premium wine from curated collection',
              image_url: serviceImageUrl,
              price: priceUSD,
              currency: 'USD'
            };
          } else {
            throw new Error(`Wine not found: ${serviceId}`);
          }
        } else {
          const winePriceUSD = parseFloat(wine.price_usd || wine.price || priceUSD || 0);
          serviceDetails = {
            id: wine.id,
            title: wine.name || wine.title || serviceTitle,
            description: wine.description || `${wine.region || ''} ${wine.vintage || ''}`.trim(),
            image_url: wine.image_url || serviceImageUrl,
            price: winePriceUSD,
            currency: 'USD'
          };
        }
        break;

      case 'delicatesse':
      case 'cigars':
        tableName = 'delicacies';
        const { data: delicacy, error: delicacyError } = await supabaseAdmin
          .from('delicacies')
          .select('*')
          .eq('id', serviceId)
          .single();

        if (delicacyError || !delicacy) {
          // If not found in database, use frontend-provided data (custom extra)
          if (priceUSD && serviceTitle) {
            console.log(`Delicacy not in DB, using frontend data: ${serviceTitle} - $${priceUSD}`);
            serviceDetails = {
              id: serviceId,
              title: serviceTitle || 'Premium Item',
              description: serviceDescription || 'Luxury delicacy item',
              image_url: serviceImageUrl,
              price: priceUSD,
              currency: 'USD'
            };
          } else {
            throw new Error(`Delicacy/cigar not found: ${serviceId}`);
          }
        } else {
          const delicacyPriceUSD = parseFloat(delicacy.price_usd || delicacy.price || priceUSD || 0);
          serviceDetails = {
            id: delicacy.id,
            title: delicacy.name || delicacy.title || serviceTitle,
            description: delicacy.description || `${delicacy.category || ''} - ${delicacy.brand || ''}`.trim(),
            image_url: delicacy.image_url || serviceImageUrl,
            price: delicacyPriceUSD,
            currency: 'USD'
          };
        }
        break;

      case 'custom_extra':
      case 'service_fee':
        // Custom extras and service fees don't have a database table
        // They're created dynamically from AI Chat
        tableName = 'custom_extras';

        if (!priceUSD || !serviceTitle) {
          throw new Error(`Custom extra requires price and title: ${serviceId}`);
        }

        console.log(`Processing custom extra: ${serviceTitle} - $${priceUSD}`);
        serviceDetails = {
          id: serviceId,
          title: serviceTitle,
          description: serviceDescription || 'Custom service or extra',
          image_url: serviceImageUrl,
          price: priceUSD,
          currency: 'USD'
        };
        break;

      case 'fixed_offer':
        // Fixed offers / Adventure packages from fixed_offers table
        // Frontend sends all data, no database lookup needed
        tableName = 'fixed_offers';

        if (!priceUSD || !serviceTitle) {
          throw new Error(`Fixed offer requires price and title: ${serviceId}`);
        }

        console.log(`Processing fixed offer: ${serviceTitle} - $${priceUSD}`);
        serviceDetails = {
          id: serviceId,
          title: serviceTitle,
          description: serviceDescription || 'Adventure package booking',
          image_url: serviceImageUrl,
          price: priceUSD,
          currency: 'USD'
        };
        break;

      case 'commercial_flight':
      case 'flight':
        // Commercial flight bookings - data comes from frontend (Duffel API)
        tableName = 'user_bookings';

        if (!priceUSD || !serviceTitle) {
          throw new Error(`Commercial flight requires price and title: ${serviceId}`);
        }

        // Extract flight data from request
        const flightData = (paymentData as any).flightData || {};

        console.log(`Processing commercial flight: ${serviceTitle} - $${priceUSD}`);
        serviceDetails = {
          id: serviceId,
          title: serviceTitle,
          description: serviceDescription || `Commercial flight booking`,
          image_url: serviceImageUrl,
          price: priceUSD,
          currency: 'USD',
          origin: flightData.origin,
          destination: flightData.destination,
          departure_date: flightData.departure_date,
          return_date: flightData.return_date,
          aircraft_type: flightData.airline
        };
        break;

      default:
        throw new Error(`Invalid service type: ${serviceType}`);
    }

    if (!serviceDetails) {
      throw new Error('Failed to load service details');
    }

    // IMPORTANT: If priceUSD was passed from frontend, it ALREADY INCLUDES VAT
    // NO additional fees are added - the frontend price IS the final price
    const VAT_RATE = 0.081; // 8.1% Swiss VAT
    const priceFromFrontend = serviceDetails.price;

    let basePrice: number;
    let vatAmount: number;
    let totalAmount: number;

    if (priceUSD && priceUSD > 0) {
      // Frontend sent totalWithFee - VAT is ALREADY INCLUDED
      // priceUSD = basePrice * 1.081 (8.1% VAT only, no platform fee)
      // We need to back-calculate for the booking record
      basePrice = Math.round(priceFromFrontend / 1.081);
      vatAmount = Math.round(basePrice * VAT_RATE * 100) / 100;
      // Total = EXACTLY what frontend sent - no additional fees
      totalAmount = priceFromFrontend;

      console.log('=== USING FRONTEND PRICE (VAT included) ===');
      console.log(`Frontend totalWithFee: $${priceFromFrontend}`);
      console.log(`Back-calculated base: $${basePrice}`);
      console.log(`VAT (8.1%): $${vatAmount}`);
      console.log(`Final Total to charge: $${totalAmount}`);
      console.log('=============================================');
    } else {
      // No frontend price - calculate VAT only
      basePrice = priceFromFrontend;
      vatAmount = Math.round(basePrice * VAT_RATE * 100) / 100;
      totalAmount = Math.round((basePrice + vatAmount) * 100) / 100;

      console.log('=== PRICE CALCULATION (no frontend price) ===');
      console.log(`Base Price: $${basePrice}`);
      console.log(`VAT (8.1%): $${vatAmount}`);
      console.log(`Total Amount: $${totalAmount}`);
      console.log('==============================================');
    }

    let booking: any;

    // For hotel bookings, we already created the record in hotel_bookings table
    // For other types, create in user_bookings
    if (serviceType === 'hotel_booking') {
      // The booking record was already created in the switch case above
      // serviceDetails.id contains the hotel booking ID
      booking = { id: serviceDetails.id };

      // Update the hotel booking with fee information (VAT only)
      await supabaseAdmin
        .from('hotel_bookings')
        .update({
          platform_fee: 0,
          vat_amount: vatAmount,
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
          platform_fee: 0,  // No platform fee
          processing_fee: vatAmount,  // Store VAT in processing_fee field
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
            vat_amount: vatAmount,
            // Flight-specific data (for commercial_flight type)
            ...(serviceType === 'commercial_flight' || serviceType === 'flight' ? {
              duffel_offer_id: serviceId,
              flight_data: (paymentData as any).flightData || {},
              passengers: (paymentData as any).flightData?.passengers || [],
              segments: (paymentData as any).flightData?.segments || [],
              selected_seats: (paymentData as any).flightData?.selectedSeats || [],
              baggage: (paymentData as any).flightData?.baggage || {},
              conditions: (paymentData as any).flightData?.conditions || {},
              airline: (paymentData as any).flightData?.airline,
              flight_number: (paymentData as any).flightData?.flightNumber,
              cabin_class: (paymentData as any).flightData?.cabinClass
            } : {})
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
      success_url: `${appUrl}/dashboard/activities?payment=success&booking_id=${booking.id}`,
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
        vatAmount,
        totalAmount,
        currency: serviceDetails.currency
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create payment error:', error);

    // Ensure we always return a valid JSON response
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage || 'Failed to create payment'
    }), {
      status: 200, // Return 200 with success:false to avoid Supabase function invoke issues
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
