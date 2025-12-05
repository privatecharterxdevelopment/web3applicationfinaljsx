// Supabase Edge Function for Google Places API
// Fetches place details including photos, ratings, reviews, and contact info

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const PLACES_API_BASE = 'https://places.googleapis.com/v1/places';

interface PlaceSearchRequest {
  action: 'searchText' | 'getDetails' | 'getPhoto';
  query?: string;
  placeId?: string;
  photoName?: string;
  location?: { lat: number; lng: number };
  radius?: number;
  types?: string[];
  maxResults?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!GOOGLE_PLACES_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, query, placeId, photoName, location, radius, types, maxResults }: PlaceSearchRequest = await req.json();

    switch (action) {
      // Text search - find places by name/query
      case 'searchText': {
        if (!query) {
          return new Response(
            JSON.stringify({ error: 'Query is required for text search' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const requestBody: any = {
          textQuery: query,
          maxResultCount: maxResults || 5,
          languageCode: 'en'
        };

        // Add location bias if provided
        if (location) {
          requestBody.locationBias = {
            circle: {
              center: { latitude: location.lat, longitude: location.lng },
              radius: radius || 50000 // 50km default
            }
          };
        }

        // Add type filter if provided
        if (types && types.length > 0) {
          requestBody.includedType = types[0]; // API only accepts one type
        }

        console.log('Places Text Search:', query);

        const response = await fetch(`${PLACES_API_BASE}:searchText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.primaryType,places.primaryTypeDisplayName,places.photos,places.websiteUri,places.internationalPhoneNumber,places.nationalPhoneNumber,places.regularOpeningHours,places.editorialSummary,places.reviews,places.googleMapsUri'
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Places API Error:', data);
          return new Response(
            JSON.stringify({ error: data.error?.message || 'Places search failed', details: data }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Transform the response to a cleaner format
        const places = (data.places || []).map((place: any) => transformPlaceData(place, GOOGLE_PLACES_API_KEY));

        return new Response(
          JSON.stringify({ success: true, places }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get detailed place info by ID
      case 'getDetails': {
        if (!placeId) {
          return new Response(
            JSON.stringify({ error: 'Place ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Places Get Details:', placeId);

        const response = await fetch(`${PLACES_API_BASE}/${placeId}`, {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,types,primaryType,primaryTypeDisplayName,photos,websiteUri,internationalPhoneNumber,nationalPhoneNumber,regularOpeningHours,editorialSummary,reviews,googleMapsUri,addressComponents,adrFormatAddress,businessStatus,currentOpeningHours,delivery,dineIn,reservable,servesBeer,servesBreakfast,servesBrunch,servesDinner,servesLunch,servesVegetarianFood,servesWine,takeout'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Places API Error:', data);
          return new Response(
            JSON.stringify({ error: data.error?.message || 'Failed to get place details', details: data }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const place = transformPlaceData(data, GOOGLE_PLACES_API_KEY);

        return new Response(
          JSON.stringify({ success: true, place }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get photo URL
      case 'getPhoto': {
        if (!photoName) {
          return new Response(
            JSON.stringify({ error: 'Photo name is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Construct photo URL with API key
        const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&key=${GOOGLE_PLACES_API_KEY}`;

        return new Response(
          JSON.stringify({ success: true, photoUrl }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Google Places function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Transform Google Places API response to a cleaner format
function transformPlaceData(place: any, apiKey: string) {
  // Generate photo URLs
  const photos = (place.photos || []).slice(0, 5).map((photo: any) => ({
    name: photo.name,
    url: `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&maxWidthPx=600&key=${apiKey}`,
    attributions: photo.authorAttributions || []
  }));

  // Transform reviews
  const reviews = (place.reviews || []).slice(0, 3).map((review: any) => ({
    author: review.authorAttribution?.displayName || 'Anonymous',
    authorPhoto: review.authorAttribution?.photoUri,
    rating: review.rating,
    text: review.text?.text || review.originalText?.text || '',
    time: review.relativePublishTimeDescription || review.publishTime,
    language: review.originalText?.languageCode || 'en'
  }));

  // Format opening hours
  let openingHours = null;
  if (place.regularOpeningHours) {
    openingHours = {
      openNow: place.currentOpeningHours?.openNow ?? null,
      weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions || [],
      periods: place.regularOpeningHours.periods || []
    };
  }

  // Price level mapping
  const priceLevelMap: Record<string, string> = {
    'PRICE_LEVEL_FREE': 'Free',
    'PRICE_LEVEL_INEXPENSIVE': '$',
    'PRICE_LEVEL_MODERATE': '$$',
    'PRICE_LEVEL_EXPENSIVE': '$$$',
    'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$'
  };

  return {
    id: place.id,
    name: place.displayName?.text || place.displayName,
    address: place.formattedAddress,
    location: place.location ? {
      lat: place.location.latitude,
      lng: place.location.longitude
    } : null,
    rating: place.rating || null,
    reviewCount: place.userRatingCount || 0,
    priceLevel: priceLevelMap[place.priceLevel] || null,
    priceLevelRaw: place.priceLevel || null,
    types: place.types || [],
    primaryType: place.primaryTypeDisplayName?.text || place.primaryType || null,
    category: place.primaryTypeDisplayName?.text || formatType(place.primaryType) || 'Place',
    photos,
    mainPhoto: photos[0]?.url || null,
    website: place.websiteUri || null,
    phone: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
    googleMapsUrl: place.googleMapsUri || null,
    openingHours,
    description: place.editorialSummary?.text || null,
    reviews,
    // Restaurant-specific attributes
    features: {
      dineIn: place.dineIn ?? null,
      takeout: place.takeout ?? null,
      delivery: place.delivery ?? null,
      reservable: place.reservable ?? null,
      servesBreakfast: place.servesBreakfast ?? null,
      servesBrunch: place.servesBrunch ?? null,
      servesLunch: place.servesLunch ?? null,
      servesDinner: place.servesDinner ?? null,
      servesVegetarianFood: place.servesVegetarianFood ?? null,
      servesBeer: place.servesBeer ?? null,
      servesWine: place.servesWine ?? null
    },
    businessStatus: place.businessStatus || null
  };
}

// Format type string to readable format
function formatType(type: string | undefined): string | null {
  if (!type) return null;
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
