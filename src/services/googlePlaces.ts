/**
 * Google Places API Service for Luxury Travel Planning
 *
 * Provides venue verification and search capabilities for:
 * - 5-star hotels
 * - Michelin-star restaurants
 * - Luxury experiences and attractions
 */

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number; // 0-4 (4 being most expensive)
  types?: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  website?: string;
  formatted_phone_number?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  business_status?: string;
}

export interface PlaceSearchParams {
  query: string;
  location?: { lat: number; lng: number };
  radius?: number; // in meters
  type?: string;
  minRating?: number;
  openNow?: boolean;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  price_level: number;
  website?: string;
  phone?: string;
  photos: string[];
  verified: boolean;
  google_place_id: string;
}

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

/**
 * Search for places using Google Places Text Search API
 */
export async function searchPlaces(params: PlaceSearchParams): Promise<PlaceResult[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured - using fallback search');
    return [];
  }

  try {
    const searchParams = new URLSearchParams({
      query: params.query,
      key: GOOGLE_PLACES_API_KEY,
    });

    if (params.location) {
      searchParams.append('location', `${params.location.lat},${params.location.lng}`);
      searchParams.append('radius', String(params.radius || 50000)); // 50km default
    }

    if (params.type) {
      searchParams.append('type', params.type);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return [];
    }

    // Filter by minimum rating if specified
    let results = data.results || [];
    if (params.minRating) {
      results = results.filter((place: PlaceResult) =>
        place.rating && place.rating >= params.minRating!
      );
    }

    return results;
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

/**
 * Get detailed information about a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return null;
  }

  try {
    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'geometry',
      'rating',
      'price_level',
      'website',
      'formatted_phone_number',
      'photos',
      'opening_hours',
      'business_status'
    ].join(',');

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places Details API error:', data.status);
      return null;
    }

    const place = data.result;
    const photos = place.photos?.map((photo: any) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
    ) || [];

    return {
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating || 0,
      price_level: place.price_level || 3,
      website: place.website,
      phone: place.formatted_phone_number,
      photos,
      verified: place.business_status === 'OPERATIONAL',
      google_place_id: place.place_id
    };
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
}

/**
 * Search for luxury hotels (5-star only)
 */
export async function searchLuxuryHotels(
  destination: string,
  location?: { lat: number; lng: number }
): Promise<PlaceResult[]> {
  const query = `5 star luxury hotel ${destination}`;
  const results = await searchPlaces({
    query,
    location,
    type: 'lodging',
    minRating: 4.5, // Only highly rated hotels
  });

  // Filter for high-end properties
  return results.filter(place =>
    place.price_level === undefined || place.price_level >= 3
  );
}

/**
 * Search for fine dining restaurants
 */
export async function searchFineDining(
  destination: string,
  location?: { lat: number; lng: number }
): Promise<PlaceResult[]> {
  const queries = [
    `Michelin star restaurant ${destination}`,
    `fine dining restaurant ${destination}`,
    `luxury restaurant ${destination}`
  ];

  const allResults: PlaceResult[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    const results = await searchPlaces({
      query,
      location,
      type: 'restaurant',
      minRating: 4.3,
    });

    for (const place of results) {
      if (!seenIds.has(place.place_id)) {
        seenIds.add(place.place_id);
        allResults.push(place);
      }
    }
  }

  // Sort by rating
  return allResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
}

/**
 * Search for luxury experiences and activities
 */
export async function searchLuxuryExperiences(
  destination: string,
  activityType: string,
  location?: { lat: number; lng: number }
): Promise<PlaceResult[]> {
  const query = `${activityType} ${destination}`;
  return searchPlaces({
    query,
    location,
    minRating: 4.0,
  });
}

/**
 * Verify a venue exists and is operational
 */
export async function verifyVenue(
  venueName: string,
  destination: string
): Promise<PlaceDetails | null> {
  const results = await searchPlaces({
    query: `${venueName} ${destination}`,
  });

  if (results.length === 0) {
    return null;
  }

  // Get details of best match
  const bestMatch = results[0];
  return getPlaceDetails(bestMatch.place_id);
}

/**
 * Get photo URL for a place
 */
export function getPlacePhotoUrl(photoReference: string, maxWidth: number = 800): string {
  if (!GOOGLE_PLACES_API_KEY) {
    return '';
  }
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Search for luxury yacht charter companies
 */
export async function searchYachtCharters(
  destination: string,
  location?: { lat: number; lng: number }
): Promise<PlaceResult[]> {
  const queries = [
    `luxury yacht charter ${destination}`,
    `private yacht rental ${destination}`,
    `superyacht charter ${destination}`
  ];

  const allResults: PlaceResult[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    const results = await searchPlaces({
      query,
      location,
      minRating: 4.0,
    });

    for (const place of results) {
      if (!seenIds.has(place.place_id)) {
        seenIds.add(place.place_id);
        allResults.push(place);
      }
    }
  }

  return allResults;
}

/**
 * Search for helicopter tour operators
 */
export async function searchHelicopterTours(
  destination: string,
  location?: { lat: number; lng: number }
): Promise<PlaceResult[]> {
  return searchPlaces({
    query: `helicopter tour ${destination}`,
    location,
    minRating: 4.0,
  });
}

/**
 * Search for luxury spa and wellness centers
 */
export async function searchLuxurySpas(
  destination: string,
  location?: { lat: number; lng: number }
): Promise<PlaceResult[]> {
  const queries = [
    `luxury spa ${destination}`,
    `5 star spa resort ${destination}`,
    `wellness retreat ${destination}`
  ];

  const allResults: PlaceResult[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    const results = await searchPlaces({
      query,
      location,
      type: 'spa',
      minRating: 4.3,
    });

    for (const place of results) {
      if (!seenIds.has(place.place_id)) {
        seenIds.add(place.place_id);
        allResults.push(place);
      }
    }
  }

  return allResults;
}

export default {
  searchPlaces,
  getPlaceDetails,
  searchLuxuryHotels,
  searchFineDining,
  searchLuxuryExperiences,
  verifyVenue,
  getPlacePhotoUrl,
  searchYachtCharters,
  searchHelicopterTours,
  searchLuxurySpas,
};
