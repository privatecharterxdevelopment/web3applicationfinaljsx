import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface SeatMapRequest {
  offerId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const duffelApiToken = Deno.env.get('DUFFEL_API_TOKEN');

    if (!duffelApiToken) {
      throw new Error('Duffel API token not configured');
    }

    const { offerId }: SeatMapRequest = await req.json();

    console.log('=== GET SEAT MAP ===');
    console.log(`Offer ID: ${offerId}`);
    console.log('====================');

    if (!offerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required field: offerId'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get seat maps from Duffel
    const seatMapResponse = await fetch(`https://api.duffel.com/air/seat_maps?offer_id=${offerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${duffelApiToken}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        'Accept': 'application/json'
      }
    });

    const seatMapResult = await seatMapResponse.json();

    if (!seatMapResponse.ok) {
      console.error('Duffel seat map error:', seatMapResult);

      // Check if seat maps are not available for this airline
      if (seatMapResult.errors?.[0]?.code === 'seat_maps_not_supported') {
        return new Response(JSON.stringify({
          success: true,
          available: false,
          message: 'Seat selection is not available for this airline',
          seatMaps: []
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      throw new Error(`Duffel API error: ${seatMapResult.errors?.[0]?.message || 'Failed to get seat maps'}`);
    }

    const seatMaps = seatMapResult.data || [];

    console.log(`Found ${seatMaps.length} seat map(s)`);

    // Transform seat maps to frontend format
    const transformedSeatMaps = seatMaps.map((seatMap: any) => {
      const segment = seatMap.segment;
      const cabins = seatMap.cabins || [];

      // Process each cabin
      const processedCabins = cabins.map((cabin: any) => {
        const rows = cabin.rows || [];

        // Process rows
        const processedRows = rows.map((row: any) => {
          const sections = row.sections || [];

          // Process sections (left, middle, right)
          const processedSections = sections.map((section: any) => {
            const elements = section.elements || [];

            // Process seat elements
            const processedElements = elements.map((element: any) => {
              if (element.type === 'seat') {
                const seat = element;
                const availableService = seat.available_services?.[0];

                return {
                  type: 'seat',
                  designator: seat.designator,
                  available: !!availableService,
                  serviceId: availableService?.id || null,
                  price: availableService ? {
                    amount: parseFloat(availableService.total_amount || '0'),
                    currency: availableService.total_currency || 'USD'
                  } : null,
                  characteristics: seat.name ? [seat.name] : [],
                  isWindow: seat.designator?.endsWith('A') || seat.designator?.endsWith('F') || seat.designator?.endsWith('K'),
                  isAisle: seat.designator?.endsWith('C') || seat.designator?.endsWith('D') || seat.designator?.endsWith('G') || seat.designator?.endsWith('H'),
                  isMiddle: seat.designator?.endsWith('B') || seat.designator?.endsWith('E'),
                  isExtraLegroom: seat.name?.toLowerCase().includes('extra') || seat.name?.toLowerCase().includes('legroom'),
                  isExitRow: seat.name?.toLowerCase().includes('exit'),
                  disclosures: seat.disclosures || []
                };
              } else if (element.type === 'empty') {
                return {
                  type: 'empty'
                };
              } else if (element.type === 'bassinet') {
                return {
                  type: 'bassinet'
                };
              } else if (element.type === 'galley') {
                return {
                  type: 'galley'
                };
              } else if (element.type === 'lavatory') {
                return {
                  type: 'lavatory'
                };
              } else if (element.type === 'closet') {
                return {
                  type: 'closet'
                };
              } else if (element.type === 'stairs') {
                return {
                  type: 'stairs'
                };
              }

              return {
                type: element.type || 'unknown'
              };
            });

            return {
              elements: processedElements
            };
          });

          return {
            rowNumber: row.sections?.[0]?.elements?.find((e: any) => e.type === 'seat')?.designator?.replace(/[A-Z]/g, '') || '',
            sections: processedSections
          };
        });

        return {
          cabinClass: cabin.cabin_class,
          deckNumber: cabin.deck || 1,
          wingsStart: cabin.wings?.first_row_designator,
          wingsEnd: cabin.wings?.last_row_designator,
          rows: processedRows
        };
      });

      return {
        segmentId: segment?.id,
        flightNumber: `${segment?.marketing_carrier?.iata_code || ''}${segment?.marketing_carrier_flight_number || ''}`,
        departure: {
          airport: segment?.origin?.iata_code,
          city: segment?.origin?.city_name,
          time: segment?.departing_at
        },
        arrival: {
          airport: segment?.destination?.iata_code,
          city: segment?.destination?.city_name,
          time: segment?.arriving_at
        },
        aircraft: segment?.aircraft?.name,
        cabins: processedCabins
      };
    });

    // Count available seats
    let totalAvailableSeats = 0;
    let totalSeats = 0;

    transformedSeatMaps.forEach((seatMap: any) => {
      seatMap.cabins.forEach((cabin: any) => {
        cabin.rows.forEach((row: any) => {
          row.sections.forEach((section: any) => {
            section.elements.forEach((element: any) => {
              if (element.type === 'seat') {
                totalSeats++;
                if (element.available) {
                  totalAvailableSeats++;
                }
              }
            });
          });
        });
      });
    });

    console.log(`Total seats: ${totalSeats}, Available: ${totalAvailableSeats}`);

    return new Response(JSON.stringify({
      success: true,
      available: transformedSeatMaps.length > 0,
      seatMaps: transformedSeatMaps,
      summary: {
        totalSegments: transformedSeatMaps.length,
        totalSeats,
        availableSeats: totalAvailableSeats
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get seat map error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to get seat map',
      available: false,
      seatMaps: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
