import { supabase } from '../lib/supabase';

export interface Airport {
  id: number;
  code: string;
  lat: number | null;
  lon: number | null;
  name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  woeid: string | null;
  tz: string | null;
  phone: string | null;
  type: string | null;
  email: string | null;
  url: string | null;
  runway_length: number | null;
  elev: number | null;
  icao: string | null;
  direct_flights: number | null;
  carriers: number | null;
  created_at: string;
  updated_at: string;
}

export interface AirportSearchResult {
  code: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  lat: number;
  lng: number;
  region?: string;
  icao?: string;
}

class AirportsService {
  private cache: Map<string, AirportSearchResult[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Search airports by query string
   * Searches in name, city, country, and airport code
   */
  async searchAirports(query: string, limit = 50): Promise<AirportSearchResult[]> {
    if (!query || query.length < 2) {
      return this.getPopularAirports(limit);
    }

    const cacheKey = `search_${query.toLowerCase()}_${limit}`;
    
    // Check cache first
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > Date.now()) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase
        .from('airports')
        .select('code, name, city, state, country, lat, lon, icao')
        .or(`name.ilike.%${query}%,city.ilike.%${query}%,country.ilike.%${query}%,code.ilike.%${query}%,icao.ilike.%${query}%`)
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .limit(limit);

      if (error) {
        console.error('Error searching airports:', error);
        return [];
      }

      const results: AirportSearchResult[] = (data || []).map(airport => ({
        code: airport.code,
        name: airport.name || '',
        city: airport.city || '',
        state: airport.state || undefined,
        country: airport.country || '',
        lat: airport.lat || 0,
        lng: airport.lon || 0,
        region: this.getRegionByCountry(airport.country),
        icao: airport.icao || undefined
      }));

      // Cache the results
      this.cache.set(cacheKey, results);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return results;
    } catch (error) {
      console.error('Error in searchAirports:', error);
      return [];
    }
  }

  /**
   * Get airport by code
   */
  async getAirportByCode(code: string): Promise<AirportSearchResult | null> {
    if (!code) return null;

    try {
      const { data, error } = await supabase
        .from('airports')
        .select('code, name, city, state, country, lat, lon, icao')
        .or(`code.eq.${code.toUpperCase()},icao.eq.${code.toUpperCase()}`)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        code: data.code,
        name: data.name || '',
        city: data.city || '',
        state: data.state || undefined,
        country: data.country || '',
        lat: data.lat || 0,
        lng: data.lon || 0,
        region: this.getRegionByCountry(data.country),
        icao: data.icao || undefined
      };
    } catch (error) {
      console.error('Error getting airport by code:', error);
      return null;
    }
  }

  /**
   * Get popular airports (major hubs)
   */
  async getPopularAirports(limit = 20): Promise<AirportSearchResult[]> {
    const cacheKey = `popular_${limit}`;
    
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > Date.now()) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase
        .from('airports')
        .select('code, name, city, state, country, lat, lon, icao, direct_flights')
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .not('direct_flights', 'is', null)
        .order('direct_flights', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting popular airports:', error);
        return [];
      }

      const results: AirportSearchResult[] = (data || []).map(airport => ({
        code: airport.code,
        name: airport.name || '',
        city: airport.city || '',
        state: airport.state || undefined,
        country: airport.country || '',
        lat: airport.lat || 0,
        lng: airport.lon || 0,
        region: this.getRegionByCountry(airport.country),
        icao: airport.icao || undefined
      }));

      this.cache.set(cacheKey, results);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return results;
    } catch (error) {
      console.error('Error in getPopularAirports:', error);
      return [];
    }
  }

  /**
   * Get airports by region
   */
  async getAirportsByRegion(region: string, limit = 100): Promise<AirportSearchResult[]> {
    const regionCountries = this.getCountriesByRegion(region);
    
    try {
      const { data, error } = await supabase
        .from('airports')
        .select('code, name, city, state, country, lat, lon, icao')
        .in('country', regionCountries)
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .limit(limit);

      if (error) {
        console.error('Error getting airports by region:', error);
        return [];
      }

      return (data || []).map(airport => ({
        code: airport.code,
        name: airport.name || '',
        city: airport.city || '',
        state: airport.state || undefined,
        country: airport.country || '',
        lat: airport.lat || 0,
        lng: airport.lon || 0,
        region,
        icao: airport.icao || undefined
      }));
    } catch (error) {
      console.error('Error in getAirportsByRegion:', error);
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Map country to region (simplified mapping)
   */
  private getRegionByCountry(country: string | null): string {
    if (!country) return 'Other';
    
    const countryLower = country.toLowerCase();
    
    // Europe
    if (['united kingdom', 'france', 'germany', 'italy', 'spain', 'netherlands', 'switzerland', 'austria', 'belgium', 'denmark', 'sweden', 'norway', 'finland', 'portugal', 'ireland', 'greece', 'poland', 'czech republic', 'hungary', 'croatia', 'bulgaria', 'romania', 'iceland'].some(c => countryLower.includes(c))) {
      return 'Europe';
    }
    
    // North America
    if (['united states', 'canada', 'mexico'].some(c => countryLower.includes(c))) {
      return 'North America';
    }
    
    // Middle East
    if (['united arab emirates', 'saudi arabia', 'qatar', 'kuwait', 'bahrain', 'oman', 'jordan', 'lebanon', 'israel', 'turkey', 'iran', 'iraq', 'yemen'].some(c => countryLower.includes(c))) {
      return 'Middle East';
    }
    
    // Asia Pacific
    if (['japan', 'china', 'south korea', 'singapore', 'thailand', 'malaysia', 'indonesia', 'vietnam', 'philippines', 'india', 'australia', 'new zealand', 'taiwan', 'hong kong'].some(c => countryLower.includes(c))) {
      return 'Asia Pacific';
    }
    
    // Africa
    if (['south africa', 'egypt', 'morocco', 'kenya', 'ethiopia', 'ghana', 'nigeria', 'tunisia', 'algeria', 'rwanda', 'tanzania', 'uganda', 'mauritius'].some(c => countryLower.includes(c))) {
      return 'Africa';
    }
    
    // South America
    if (['brazil', 'argentina', 'chile', 'colombia', 'peru', 'venezuela', 'ecuador', 'uruguay', 'paraguay', 'bolivia'].some(c => countryLower.includes(c))) {
      return 'South America';
    }
    
    // Caribbean
    if (['bahamas', 'jamaica', 'dominican republic', 'puerto rico', 'barbados', 'aruba', 'curacao', 'cayman islands', 'cuba'].some(c => countryLower.includes(c))) {
      return 'Caribbean';
    }
    
    // Russia & CIS
    if (['russia', 'ukraine', 'kazakhstan', 'uzbekistan', 'belarus', 'armenia', 'georgia', 'azerbaijan'].some(c => countryLower.includes(c))) {
      return 'Russia & CIS';
    }
    
    return 'Other';
  }

  /**
   * Get countries by region
   */
  private getCountriesByRegion(region: string): string[] {
    const regionMap: Record<string, string[]> = {
      'Europe': ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Austria', 'Belgium', 'Denmark', 'Sweden', 'Norway', 'Finland', 'Portugal', 'Ireland', 'Greece', 'Poland', 'Czech Republic', 'Hungary', 'Croatia', 'Bulgaria', 'Romania', 'Iceland'],
      'North America': ['United States', 'Canada', 'Mexico'],
      'Middle East': ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Israel', 'Turkey', 'Iran', 'Iraq', 'Yemen'],
      'Asia Pacific': ['Japan', 'China', 'South Korea', 'Singapore', 'Thailand', 'Malaysia', 'Indonesia', 'Vietnam', 'Philippines', 'India', 'Australia', 'New Zealand', 'Taiwan', 'Hong Kong'],
      'Africa': ['South Africa', 'Egypt', 'Morocco', 'Kenya', 'Ethiopia', 'Ghana', 'Nigeria', 'Tunisia', 'Algeria', 'Rwanda', 'Tanzania', 'Uganda', 'Mauritius'],
      'South America': ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Uruguay', 'Paraguay', 'Bolivia'],
      'Caribbean': ['Bahamas', 'Jamaica', 'Dominican Republic', 'Puerto Rico', 'Barbados', 'Aruba', 'Curacao', 'Cayman Islands', 'Cuba'],
      'Russia & CIS': ['Russia', 'Ukraine', 'Kazakhstan', 'Uzbekistan', 'Belarus', 'Armenia', 'Georgia', 'Azerbaijan']
    };
    
    return regionMap[region] || [];
  }
}

export const airportsService = new AirportsService();