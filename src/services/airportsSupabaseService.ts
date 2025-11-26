/**
 * Airport service that queries airports from Supabase database
 * Contains ~9,500+ airports worldwide from OpenFlights data
 */

import { supabase } from '../lib/supabase';

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

// Cache for frequently accessed airports
const airportCache = new Map<string, AirportSearchResult>();

export const airportsSupabaseService = {
  /**
   * Search airports by query string
   * Searches across code, name, city, and country
   * Returns up to 15 results, prioritizing exact code matches
   */
  async searchAirports(query: string): Promise<AirportSearchResult[]> {
    try {
      // If no query, return popular airports
      if (!query || query.trim().length === 0) {
        const { data, error } = await supabase
          .from('airports')
          .select('code, name, city, country, state, lat, lon, icao, type')
          .in('code', ['JFK', 'LAX', 'LHR', 'DXB', 'CDG', 'SIN', 'HKG', 'FRA', 'AMS', 'MIA', 'SFO', 'ZRH'])
          .limit(12);

        if (error) {
          console.error('Error fetching popular airports:', error);
          return [];
        }

        return (data || []).map(a => ({
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
      }

      const searchTerm = query.trim().toUpperCase();

      // First, check for exact code match
      if (searchTerm.length === 3) {
        const { data: exactMatch } = await supabase
          .from('airports')
          .select('code, name, city, country, state, lat, lon, icao, type')
          .eq('code', searchTerm)
          .single();

        if (exactMatch) {
          // Get additional results that match the query
          const { data: additionalResults } = await supabase
            .from('airports')
            .select('code, name, city, country, state, lat, lon, icao, type')
            .or(`city.ilike.%${query}%,name.ilike.%${query}%,country.ilike.%${query}%`)
            .neq('code', searchTerm)
            .limit(14);

          const results = [exactMatch, ...(additionalResults || [])];
          return results.map(a => ({
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
        }
      }

      // Search by code, city, name, or country
      const { data, error } = await supabase
        .from('airports')
        .select('code, name, city, country, state, lat, lon, icao, type')
        .or(`code.ilike.${searchTerm}%,city.ilike.%${query}%,name.ilike.%${query}%,country.ilike.%${query}%`)
        .order('direct_flights', { ascending: false, nullsFirst: false })
        .limit(15);

      if (error) {
        console.error('Error searching airports:', error);
        return [];
      }

      return (data || []).map(a => ({
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

    } catch (error) {
      console.error('Airport search error:', error);
      return [];
    }
  },

  /**
   * Get airport by IATA code
   */
  async getAirportByCode(code: string): Promise<AirportSearchResult | null> {
    // Check cache first
    const cached = airportCache.get(code.toUpperCase());
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('airports')
        .select('code, name, city, country, state, lat, lon, icao, type')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !data) {
        return null;
      }

      const airport: AirportSearchResult = {
        code: data.code,
        name: data.name || '',
        city: data.city || '',
        country: data.country || '',
        state: data.state || undefined,
        lat: parseFloat(data.lat) || 0,
        lng: parseFloat(data.lon) || 0,
        icao: data.icao || undefined,
        type: data.type || undefined
      };

      // Cache for future lookups
      airportCache.set(code.toUpperCase(), airport);

      return airport;
    } catch (error) {
      console.error('Error getting airport by code:', error);
      return null;
    }
  },

  /**
   * Get multiple airports by codes
   */
  async getAirportsByCodes(codes: string[]): Promise<AirportSearchResult[]> {
    if (!codes.length) return [];

    try {
      const upperCodes = codes.map(c => c.toUpperCase());

      const { data, error } = await supabase
        .from('airports')
        .select('code, name, city, country, state, lat, lon, icao, type')
        .in('code', upperCodes);

      if (error) {
        console.error('Error fetching airports by codes:', error);
        return [];
      }

      return (data || []).map(a => ({
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
    } catch (error) {
      console.error('Error fetching airports by codes:', error);
      return [];
    }
  },

  /**
   * Get total airport count (for debugging)
   */
  async getAirportCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('airports')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error counting airports:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error counting airports:', error);
      return 0;
    }
  }
};

// Also export as default for convenience
export default airportsSupabaseService;
