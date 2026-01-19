import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface SearchRequest {
  origin: string;           // IATA code (e.g., "LHR")
  destination: string;      // IATA code (e.g., "JFK")
  departureDate: string;    // ISO date (e.g., "2024-03-15")
  returnDate?: string;      // ISO date for round trips
  passengers: number;       // Number of adult passengers
  cabinClass: string;       // "economy", "premium_economy", "business", "first"
}

interface DuffelSlice {
  origin: { iata_code: string; name: string; city_name: string };
  destination: { iata_code: string; name: string; city_name: string };
  departure_date: string;
}

interface DuffelPassenger {
  type: 'adult' | 'child' | 'infant_without_seat';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const duffelApiToken = Deno.env.get('DUFFEL_API_TOKEN');

    if (!duffelApiToken) {
      throw new Error('Duffel API token not configured. Please set DUFFEL_API_TOKEN in Supabase secrets.');
    }

    const searchData: SearchRequest = await req.json();
    const { origin, destination, departureDate, returnDate, passengers, cabinClass } = searchData;

    console.log('=== FLIGHT SEARCH REQUEST ===');
    console.log(`Route: ${origin} → ${destination}`);
    console.log(`Date: ${departureDate}${returnDate ? ` - ${returnDate}` : ' (one-way)'}`);
    console.log(`Passengers: ${passengers}, Cabin: ${cabinClass}`);
    console.log('=============================');

    // Validate required fields
    if (!origin || !destination || !departureDate || !passengers) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: origin, destination, departureDate, passengers'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build slices array for Duffel
    const slices: DuffelSlice[] = [
      {
        origin: { iata_code: origin.toUpperCase(), name: '', city_name: '' },
        destination: { iata_code: destination.toUpperCase(), name: '', city_name: '' },
        departure_date: departureDate
      }
    ];

    // Add return slice if round trip
    if (returnDate) {
      slices.push({
        origin: { iata_code: destination.toUpperCase(), name: '', city_name: '' },
        destination: { iata_code: origin.toUpperCase(), name: '', city_name: '' },
        departure_date: returnDate
      });
    }

    // Build passengers array
    const passengersList: DuffelPassenger[] = [];
    for (let i = 0; i < passengers; i++) {
      passengersList.push({ type: 'adult' });
    }

    // Map cabin class to Duffel format
    const cabinClassMap: Record<string, string> = {
      'economy': 'economy',
      'premium_economy': 'premium_economy',
      'premium-economy': 'premium_economy',
      'business': 'business',
      'first': 'first'
    };

    const duffelCabinClass = cabinClassMap[cabinClass.toLowerCase()] || 'economy';

    // Create offer request with Duffel API
    const offerRequestBody = {
      data: {
        slices: slices.map(slice => ({
          origin: slice.origin.iata_code,
          destination: slice.destination.iata_code,
          departure_date: slice.departure_date
        })),
        passengers: passengersList,
        cabin_class: duffelCabinClass,
        return_offers: true  // Return offers immediately (partial offer request)
      }
    };

    // Query param for available services (extra baggage, seats, etc.)
    const requestUrl = 'https://api.duffel.com/air/offer_requests?return_available_services=true';

    console.log('Duffel API request:', JSON.stringify(offerRequestBody, null, 2));

    // Call Duffel Offer Requests API
    const duffelResponse = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${duffelApiToken}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        'Accept': 'application/json'
      },
      body: JSON.stringify(offerRequestBody)
    });

    const duffelResult = await duffelResponse.json();

    if (!duffelResponse.ok) {
      console.error('Duffel API error:', duffelResult);

      // Check for specific error types
      if (duffelResult.errors) {
        const errorMessages = duffelResult.errors.map((e: any) => e.message || e.title).join(', ');
        throw new Error(`Duffel API error: ${errorMessages}`);
      }

      throw new Error(`Duffel API error: ${duffelResult.message || 'Unknown error'}`);
    }

    console.log(`Duffel returned ${duffelResult.data?.offers?.length || 0} offers`);

    // Transform Duffel offers to our frontend format
    const offers = (duffelResult.data?.offers || []).map((offer: any) => {
      // Get the first slice for outbound journey
      const outboundSlice = offer.slices?.[0];
      const returnSlice = offer.slices?.[1]; // May be undefined for one-way

      // Get segments from first slice
      const segments = outboundSlice?.segments || [];
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];

      // Calculate total duration
      const totalDurationMinutes = outboundSlice?.duration
        ? parseDuration(outboundSlice.duration)
        : calculateDurationMinutes(firstSegment?.departing_at, lastSegment?.arriving_at);

      // Get airline info from operating carrier
      const airline = firstSegment?.operating_carrier || firstSegment?.marketing_carrier || {};

      // Get baggage info
      const baggageAllowance = offer.passengers?.[0]?.baggages || [];
      const checkedBags = baggageAllowance.find((b: any) => b.type === 'checked')?.quantity || 0;
      const cabinBags = baggageAllowance.find((b: any) => b.type === 'carry_on')?.quantity || 1;

      return {
        id: offer.id,
        offerId: offer.id,
        offerRequestId: duffelResult.data?.id,

        // Airline info
        airline: {
          name: airline.name || 'Unknown Airline',
          iataCode: airline.iata_code || '',
          logoUrl: airline.logo_symbol_url || airline.logo_lockup_url || null
        },

        // Flight details
        flightNumber: `${firstSegment?.marketing_carrier?.iata_code || ''}${firstSegment?.marketing_carrier_flight_number || ''}`,

        // Outbound journey
        departure: {
          airport: outboundSlice?.origin?.iata_code || origin,
          airportName: outboundSlice?.origin?.name || '',
          city: outboundSlice?.origin?.city_name || '',
          time: firstSegment?.departing_at || '',
          terminal: firstSegment?.origin_terminal || null
        },
        arrival: {
          airport: outboundSlice?.destination?.iata_code || destination,
          airportName: outboundSlice?.destination?.name || '',
          city: outboundSlice?.destination?.city_name || '',
          time: lastSegment?.arriving_at || '',
          terminal: lastSegment?.destination_terminal || null
        },

        // Duration and stops
        duration: formatDuration(totalDurationMinutes),
        durationMinutes: totalDurationMinutes,
        stops: segments.length - 1,
        stopDetails: segments.slice(0, -1).map((seg: any, idx: number) => ({
          airport: segments[idx + 1]?.origin?.iata_code || '',
          city: segments[idx + 1]?.origin?.city_name || '',
          duration: seg.connection_duration || null
        })),

        // Segments for detailed view
        segments: segments.map((seg: any) => ({
          flightNumber: `${seg.marketing_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || ''}`,
          aircraft: seg.aircraft?.name || null,
          departure: {
            airport: seg.origin?.iata_code || '',
            airportName: seg.origin?.name || '',
            time: seg.departing_at || '',
            terminal: seg.origin_terminal || null
          },
          arrival: {
            airport: seg.destination?.iata_code || '',
            airportName: seg.destination?.name || '',
            time: seg.arriving_at || '',
            terminal: seg.destination_terminal || null
          },
          duration: seg.duration || null,
          cabinClass: seg.passengers?.[0]?.cabin_class_marketing_name || cabinClass
        })),

        // Return journey (if applicable)
        returnJourney: returnSlice ? {
          departure: {
            airport: returnSlice.origin?.iata_code || '',
            airportName: returnSlice.origin?.name || '',
            city: returnSlice.origin?.city_name || '',
            time: returnSlice.segments?.[0]?.departing_at || '',
            terminal: returnSlice.segments?.[0]?.origin_terminal || null
          },
          arrival: {
            airport: returnSlice.destination?.iata_code || '',
            airportName: returnSlice.destination?.name || '',
            city: returnSlice.destination?.city_name || '',
            time: returnSlice.segments?.[returnSlice.segments.length - 1]?.arriving_at || '',
            terminal: returnSlice.segments?.[returnSlice.segments.length - 1]?.destination_terminal || null
          },
          duration: returnSlice.duration ? formatDuration(parseDuration(returnSlice.duration)) : null,
          durationMinutes: returnSlice.duration ? parseDuration(returnSlice.duration) : null,
          stops: (returnSlice.segments?.length || 1) - 1,
          segments: returnSlice.segments?.map((seg: any) => ({
            flightNumber: `${seg.marketing_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || ''}`,
            aircraft: seg.aircraft?.name || null,
            departure: {
              airport: seg.origin?.iata_code || '',
              airportName: seg.origin?.name || '',
              time: seg.departing_at || '',
              terminal: seg.origin_terminal || null
            },
            arrival: {
              airport: seg.destination?.iata_code || '',
              airportName: seg.destination?.name || '',
              time: seg.arriving_at || '',
              terminal: seg.destination_terminal || null
            },
            duration: seg.duration || null,
            cabinClass: seg.passengers?.[0]?.cabin_class_marketing_name || cabinClass
          })) || []
        } : null,

        // Pricing (20% markup applied)
        price: {
          amount: Math.round(parseFloat(offer.total_amount || '0') * 1.20 * 100) / 100,
          currency: offer.total_currency || 'USD',
          perPassenger: Math.round((parseFloat(offer.total_amount || '0') * 1.20 / passengers) * 100) / 100,
          originalAmount: parseFloat(offer.total_amount || '0') // Keep original for reference
        },

        // Baggage
        baggage: {
          checkedBags,
          cabinBags,
          checkedBagWeight: baggageAllowance.find((b: any) => b.type === 'checked')?.weight || null
        },

        // Cabin class
        cabinClass: segments[0]?.passengers?.[0]?.cabin_class || duffelCabinClass,
        cabinClassName: segments[0]?.passengers?.[0]?.cabin_class_marketing_name || cabinClass,

        // Metadata
        expiresAt: offer.expires_at,

        // Available services (extra baggage, etc.)
        availableServices: (offer.available_services || []).map((service: any) => ({
          id: service.id,
          type: service.type, // 'baggage'
          passengerIds: service.passenger_ids || [],
          segmentIds: service.segment_ids || [],
          totalAmount: parseFloat(service.total_amount || '0'),
          totalCurrency: service.total_currency || 'USD',
          // Baggage specific metadata
          metadata: service.metadata ? {
            type: service.metadata.type, // 'checked' or 'carry_on'
            maximumWeightKg: service.metadata.maximum_weight_kg,
            maximumHeightCm: service.metadata.maximum_height_cm,
            maximumLengthCm: service.metadata.maximum_length_cm,
            maximumDepthCm: service.metadata.maximum_depth_cm,
          } : null
        })),

        conditions: {
          refundable: offer.conditions?.refund_before_departure?.allowed || false,
          changeable: offer.conditions?.change_before_departure?.allowed || false
        },

        // Raw data for booking
        rawOffer: offer
      };
    });

    // Sort by price (lowest first)
    offers.sort((a: any, b: any) => a.price.amount - b.price.amount);

    return new Response(JSON.stringify({
      success: true,
      offerRequestId: duffelResult.data?.id,
      offers,
      totalOffers: offers.length,
      searchParams: {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        cabinClass: duffelCabinClass
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Flight search error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to search flights',
      offers: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to parse ISO 8601 duration (PT2H30M)
function parseDuration(duration: string): number {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);

  return hours * 60 + minutes;
}

// Helper function to calculate duration from timestamps
function calculateDurationMinutes(departureTime: string, arrivalTime: string): number {
  if (!departureTime || !arrivalTime) return 0;

  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);

  return Math.round((arrival.getTime() - departure.getTime()) / (1000 * 60));
}

// Helper function to format duration as "Xh Ym"
function formatDuration(minutes: number): string {
  if (!minutes) return '';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;

  return `${hours}h ${mins}m`;
}
