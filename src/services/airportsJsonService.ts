/**
 * Airport service that loads from local JSON file
 * Contains ~9,500+ airports worldwide
 * No database or API calls needed - instant search
 */

import airportsData from '../data/airports.json';

export interface AirportSearchResult {
  code: string;
  name: string;
  city: string;
  country: string;
  state?: string;
  lat: number;
  lng: number;
  icao?: string;
  type?: string;
}

interface AirportRaw {
  code: string;
  name: string;
  city: string;
  country: string;
  state?: string;
  lat: string;
  lon: string;
  icao?: string;
  type?: string;
  direct_flights?: string;
  carriers?: string;
}

// Convert raw airport data to our format
const airports: AirportSearchResult[] = (airportsData as AirportRaw[]).map(a => ({
  code: a.code,
  name: a.name || '',
  city: a.city || '',
  country: a.country || '',
  state: a.state || undefined,
  lat: parseFloat(a.lat) || 0,
  lng: parseFloat(a.lon) || 0,
  icao: a.icao || undefined,
  type: a.type || undefined
}));

// Create lookup map for fast code searches
const airportsByCode = new Map<string, AirportSearchResult>();
airports.forEach(a => {
  airportsByCode.set(a.code.toUpperCase(), a);
});

// Popular airports for default suggestions
const popularCodes = ['JFK', 'LAX', 'LHR', 'DXB', 'CDG', 'SIN', 'HKG', 'FRA', 'AMS', 'MIA', 'SFO', 'ZRH', 'NRT', 'ICN', 'SYD'];
const popularAirports = popularCodes
  .map(code => airportsByCode.get(code))
  .filter((a): a is AirportSearchResult => a !== undefined);

export const airportsJsonService = {
  /**
   * Search airports by query string
   * Searches across code, name, city, and country
   * Returns up to 15 results, prioritizing exact code matches
   */
  async searchAirports(query: string): Promise<AirportSearchResult[]> {
    // If no query, return popular airports
    if (!query || query.trim().length === 0) {
      return popularAirports.slice(0, 12);
    }

    const searchTerm = query.trim().toLowerCase();
    const searchTermUpper = searchTerm.toUpperCase();

    // Check for exact code match first
    const exactMatch = airportsByCode.get(searchTermUpper);

    // Search across all fields
    const results: AirportSearchResult[] = [];
    const seen = new Set<string>();

    // Add exact match first if found
    if (exactMatch) {
      results.push(exactMatch);
      seen.add(exactMatch.code);
    }

    // Prioritize code starts with
    for (const airport of airports) {
      if (seen.size >= 15) break;
      if (seen.has(airport.code)) continue;

      if (airport.code.toLowerCase().startsWith(searchTerm)) {
        results.push(airport);
        seen.add(airport.code);
      }
    }

    // Then city matches
    for (const airport of airports) {
      if (seen.size >= 15) break;
      if (seen.has(airport.code)) continue;

      if (airport.city.toLowerCase().includes(searchTerm)) {
        results.push(airport);
        seen.add(airport.code);
      }
    }

    // Then name matches
    for (const airport of airports) {
      if (seen.size >= 15) break;
      if (seen.has(airport.code)) continue;

      if (airport.name.toLowerCase().includes(searchTerm)) {
        results.push(airport);
        seen.add(airport.code);
      }
    }

    // Then country matches
    for (const airport of airports) {
      if (seen.size >= 15) break;
      if (seen.has(airport.code)) continue;

      if (airport.country.toLowerCase().includes(searchTerm)) {
        results.push(airport);
        seen.add(airport.code);
      }
    }

    return results;
  },

  /**
   * Get airport by IATA code
   */
  async getAirportByCode(code: string): Promise<AirportSearchResult | null> {
    return airportsByCode.get(code.toUpperCase()) || null;
  },

  /**
   * Get multiple airports by codes
   */
  async getAirportsByCodes(codes: string[]): Promise<AirportSearchResult[]> {
    return codes
      .map(code => airportsByCode.get(code.toUpperCase()))
      .filter((a): a is AirportSearchResult => a !== undefined);
  },

  /**
   * Get total airport count
   */
  async getAirportCount(): Promise<number> {
    return airports.length;
  }
};

// Also export as default for convenience
export default airportsJsonService;
