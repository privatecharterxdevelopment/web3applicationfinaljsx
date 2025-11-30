import airportsData from '../data/airports.json';

export interface Airport {
  code: string;
  lat: string;
  lon: string;
  name: string;
  city: string;
  state: string;
  country: string;
  continent: string;
  runway_length?: string;
  elev?: string;
  icao?: string;
}

// Create a lookup map for quick access by IATA code
const airportLookupMap = new Map<string, Airport>();

// Create a lookup map by city name (lowercase for case-insensitive search)
const cityToAirportsMap = new Map<string, Airport[]>();

// Initialize the lookup maps
airportsData.forEach((airport: Airport) => {
  if (airport.code) {
    airportLookupMap.set(airport.code.toUpperCase(), airport);
  }
  if (airport.city) {
    const cityKey = airport.city.toLowerCase();
    if (!cityToAirportsMap.has(cityKey)) {
      cityToAirportsMap.set(cityKey, []);
    }
    cityToAirportsMap.get(cityKey)!.push(airport);
  }
});

/**
 * Look up airport information by IATA code
 */
export const getAirportByCode = (code: string): Airport | null => {
  if (!code) return null;
  return airportLookupMap.get(code.toUpperCase()) || null;
};

/**
 * Get formatted airport display name
 */
export const getAirportDisplayName = (code: string): string => {
  const airport = getAirportByCode(code);
  if (!airport) return code;
  
  return `${airport.name} (${airport.code})`;
};

/**
 * Get formatted airport location
 */
export const getAirportLocation = (code: string): string => {
  const airport = getAirportByCode(code);
  if (!airport) return '';
  
  return `${airport.city}, ${airport.country}`;
};

/**
 * Get airport coordinates for mapping
 */
export const getAirportCoordinates = (code: string): { lat: number; lng: number } | null => {
  const airport = getAirportByCode(code);
  if (!airport) return null;
  
  const lat = parseFloat(airport.lat);
  const lng = parseFloat(airport.lon);
  
  if (isNaN(lat) || isNaN(lng)) return null;
  
  return { lat, lng };
};

/**
 * Get route coordinates for mapping
 */
export const getRouteCoordinates = (originCode: string, destinationCode: string): {
  origin: { lat: number; lng: number; name: string; city: string; country: string } | null;
  destination: { lat: number; lng: number; name: string; city: string; country: string } | null;
} => {
  const originAirport = getAirportByCode(originCode);
  const destinationAirport = getAirportByCode(destinationCode);
  
  const origin = originAirport ? {
    lat: parseFloat(originAirport.lat),
    lng: parseFloat(originAirport.lon),
    name: originAirport.name,
    city: originAirport.city,
    country: originAirport.country
  } : null;
  
  const destination = destinationAirport ? {
    lat: parseFloat(destinationAirport.lat),
    lng: parseFloat(destinationAirport.lon),
    name: destinationAirport.name,
    city: destinationAirport.city,
    country: destinationAirport.country
  } : null;
  
  return { origin, destination };
};

/**
 * Calculate approximate distance between two airports in kilometers
 */
export const calculateDistance = (originCode: string, destinationCode: string): number | null => {
  const origin = getAirportCoordinates(originCode);
  const destination = getAirportCoordinates(destinationCode);

  if (!origin || !destination) return null;

  // Haversine formula
  const R = 6371; // Earth's radius in kilometers
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLon = (destination.lng - origin.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return Math.round(distance);
};

/**
 * Get airports by city name (case-insensitive)
 * Returns airports in the city, sorted by number of direct flights (most popular first)
 */
export const getAirportsByCity = (city: string): Airport[] => {
  if (!city) return [];
  const airports = cityToAirportsMap.get(city.toLowerCase()) || [];
  // Sort by number of direct flights (most popular first)
  return airports.sort((a, b) => {
    const flightsA = parseInt(a.direct_flights || '0') || 0;
    const flightsB = parseInt(b.direct_flights || '0') || 0;
    return flightsB - flightsA;
  });
};

/**
 * Get the main/primary airport for a city
 * Returns the airport with most direct flights
 */
export const getMainAirportByCity = (city: string): Airport | null => {
  const airports = getAirportsByCity(city);
  return airports.length > 0 ? airports[0] : null;
};

/**
 * Search airports by partial city name or code
 */
export const searchAirports = (query: string, limit: number = 10): Airport[] => {
  if (!query || query.length < 2) return [];

  const queryLower = query.toLowerCase();
  const results: Airport[] = [];

  // First, check for exact IATA code match
  const exactCode = airportLookupMap.get(query.toUpperCase());
  if (exactCode) {
    results.push(exactCode);
  }

  // Then search by city name
  airportsData.forEach((airport: Airport) => {
    if (results.length >= limit) return;
    if (results.includes(airport)) return;

    const cityMatch = airport.city?.toLowerCase().includes(queryLower);
    const nameMatch = airport.name?.toLowerCase().includes(queryLower);
    const countryMatch = airport.country?.toLowerCase().includes(queryLower);

    if (cityMatch || nameMatch || countryMatch) {
      results.push(airport);
    }
  });

  // Sort by relevance (exact city matches first, then by direct flights)
  return results.sort((a, b) => {
    const aExact = a.city?.toLowerCase() === queryLower ? 1 : 0;
    const bExact = b.city?.toLowerCase() === queryLower ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;

    const flightsA = parseInt(a.direct_flights || '0') || 0;
    const flightsB = parseInt(b.direct_flights || '0') || 0;
    return flightsB - flightsA;
  }).slice(0, limit);
};

/**
 * Format a city name to include IATA code
 * E.g., "Zurich" -> "Zurich (ZRH)"
 */
export const formatCityWithIATA = (city: string): string => {
  if (!city) return '';

  // Check if it's already an IATA code
  const exactAirport = getAirportByCode(city);
  if (exactAirport) {
    return `${exactAirport.city} (${exactAirport.code})`;
  }

  // Get main airport for the city
  const mainAirport = getMainAirportByCity(city);
  if (mainAirport) {
    return `${mainAirport.city} (${mainAirport.code})`;
  }

  // Return original if no airport found
  return city;
};

/**
 * Get IATA code from city name
 */
export const getIATAFromCity = (city: string): string | null => {
  if (!city) return null;

  // Check if it's already an IATA code
  const exactAirport = getAirportByCode(city);
  if (exactAirport) {
    return exactAirport.code;
  }

  // Get main airport for the city
  const mainAirport = getMainAirportByCity(city);
  return mainAirport ? mainAirport.code : null;
};

// Add direct_flights to the Airport interface extension
declare module '../data/airports.json' {
  interface AirportData {
    direct_flights?: string;
  }
}