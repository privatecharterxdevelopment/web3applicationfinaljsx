import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const LITEAPI_BASE_URL = 'https://api.liteapi.travel/v3.0';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LITEAPI_KEY = Deno.env.get('LITEAPI_KEY');

    if (!LITEAPI_KEY) {
      console.error('LITEAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'LiteAPI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, params } = await req.json();

    let endpoint = '';
    let method = 'GET';
    let body = null;

    switch (action) {
      // Search hotels by city/location
      case 'searchHotels':
        endpoint = '/hotels/rates';
        method = 'POST';
        body = JSON.stringify({
          checkin: params.checkIn,
          checkout: params.checkOut,
          currency: params.currency || 'USD',
          guestNationality: params.guestNationality || 'US',
          occupancies: params.occupancies || [{ adults: params.adults || 2, children: params.children || 0 }],
          // Location search methods
          ...(params.cityCode && { cityCode: params.cityCode }),
          ...(params.countryCode && { countryCode: params.countryCode }),
          ...(params.hotelIds && { hotelIds: params.hotelIds }),
          ...(params.latitude && params.longitude && {
            latitude: params.latitude,
            longitude: params.longitude,
            radius: params.radius || 10,
            radiusUnit: 'km'
          }),
          ...(params.placeId && { placeId: params.placeId }),
          ...(params.iataCode && { iataCode: params.iataCode }),
          // Filters
          ...(params.starRating && { starRating: params.starRating }),
          ...(params.minPrice && { minPrice: params.minPrice }),
          ...(params.maxPrice && { maxPrice: params.maxPrice }),
          limit: params.limit || 50
        });
        break;

      // Get hotel details
      case 'getHotelDetails':
        endpoint = `/data/hotel?hotelId=${params.hotelId}`;
        method = 'GET';
        break;

      // Get hotel reviews
      case 'getHotelReviews':
        endpoint = `/data/reviews?hotelId=${params.hotelId}&limit=${params.limit || 20}`;
        method = 'GET';
        break;

      // Get cities list
      case 'getCities':
        endpoint = `/data/cities?countryCode=${params.countryCode}`;
        method = 'GET';
        break;

      // Get hotels list (static data)
      case 'getHotelsList':
        endpoint = `/data/hotels?${new URLSearchParams({
          ...(params.cityCode && { cityCode: params.cityCode }),
          ...(params.countryCode && { countryCode: params.countryCode }),
          ...(params.hotelName && { hotelName: params.hotelName }),
          limit: String(params.limit || 100),
          offset: String(params.offset || 0)
        }).toString()}`;
        method = 'GET';
        break;

      // Prebook - confirm rate availability before booking
      case 'prebook':
        endpoint = '/rates/prebook';
        method = 'POST';
        body = JSON.stringify({
          rateId: params.rateId
        });
        break;

      // Create booking
      case 'createBooking':
        endpoint = '/bookings';
        method = 'POST';
        body = JSON.stringify({
          prebookId: params.prebookId,
          guestInfo: params.guestInfo,
          payment: params.payment
        });
        break;

      // Get booking details
      case 'getBooking':
        endpoint = `/bookings/${params.bookingId}`;
        method = 'GET';
        break;

      // Cancel booking
      case 'cancelBooking':
        endpoint = `/bookings/${params.bookingId}`;
        method = 'DELETE';
        break;

      // Get guest bookings
      case 'getGuestBookings':
        endpoint = `/guests/${params.guestId}/bookings`;
        method = 'GET';
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`LiteAPI Request: ${method} ${endpoint}`);

    const response = await fetch(`${LITEAPI_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'X-API-Key': LITEAPI_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...(body && { body })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('LiteAPI Error:', data);
      return new Response(
        JSON.stringify({ error: data.message || 'LiteAPI request failed', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('LiteAPI function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
