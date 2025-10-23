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

// Create a lookup map for quick access
const airportLookupMap = new Map<string, Airport>();

// Initialize the lookup map
airportsData.forEach((airport: Airport) => {
  if (airport.code) {
    airportLookupMap.set(airport.code.toUpperCase(), airport);
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