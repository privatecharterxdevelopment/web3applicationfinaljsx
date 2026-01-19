import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const duffelApiToken = Deno.env.get('DUFFEL_API_TOKEN');
    if (!duffelApiToken) {
      throw new Error('DUFFEL_API_TOKEN not configured');
    }

    const { offerId } = await req.json();

    if (!offerId) {
      throw new Error('offerId is required');
    }

    console.log('Fetching available services for offer:', offerId);

    // Fetch the offer with available services
    const duffelResponse = await fetch(
      `https://api.duffel.com/air/offers/${offerId}?return_available_services=true`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${duffelApiToken}`,
          'Content-Type': 'application/json',
          'Duffel-Version': 'v2',
          'Accept': 'application/json'
        }
      }
    );

    const duffelResult = await duffelResponse.json();

    if (!duffelResponse.ok) {
      console.error('Duffel API error:', duffelResult);
      throw new Error(duffelResult.errors?.[0]?.message || 'Failed to fetch offer services');
    }

    const offer = duffelResult.data;
    const availableServices = offer.available_services || [];

    // Transform available services
    const transformedServices = availableServices.map((service: any) => ({
      id: service.id,
      type: service.type, // 'baggage'
      passengerIds: service.passenger_ids || [],
      segmentIds: service.segment_ids || [],
      totalAmount: parseFloat(service.total_amount || '0'),
      totalCurrency: service.total_currency || 'USD',
      metadata: service.metadata ? {
        type: service.metadata.type, // 'checked' or 'carry_on'
        maximumWeightKg: service.metadata.maximum_weight_kg,
        maximumHeightCm: service.metadata.maximum_height_cm,
        maximumLengthCm: service.metadata.maximum_length_cm,
        maximumDepthCm: service.metadata.maximum_depth_cm,
      } : null
    }));

    // Filter to only baggage services
    const baggageServices = transformedServices.filter(
      (s: any) => s.type === 'baggage' && s.metadata?.type === 'checked'
    );

    console.log(`Found ${baggageServices.length} baggage services for offer ${offerId}`);

    return new Response(JSON.stringify({
      success: true,
      offerId,
      availableServices: transformedServices,
      baggageServices,
      // Also return updated offer info if needed
      expiresAt: offer.expires_at
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching flight services:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch flight services'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
