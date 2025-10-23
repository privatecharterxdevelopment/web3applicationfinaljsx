import airportsData from '../data/airports.json';

export interface AirportSearchResult {
  code: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  lat: number;
  lng: number;
  region?: string;
  continent?: string;
  icao?: string;
  directFlights?: number;
}

interface RawAirport {
  code: string;
  lat: string | null;
  lon: string | null;
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
  runway_length: string | null;
  elev: string | null;
  icao: string | null;
  direct_flights: string | null;
  carriers: string | null;
  continent?: string;
}

class AirportsStaticService {
  private airports: AirportSearchResult[] = [];
  private cache: Map<string, AirportSearchResult[]> = new Map();

  constructor() {
    this.initializeAirports();
  }

  private initializeAirports(): void {
    this.airports = (airportsData as RawAirport[])
      .filter(airport => airport.lat && airport.lon && airport.name && airport.city)
      .map(airport => ({
        code: airport.code,
        name: airport.name || '',
        city: airport.city || '',
        state: airport.state || undefined,
        country: airport.country || '',
        lat: parseFloat(airport.lat || '0'),
        lng: parseFloat(airport.lon || '0'),
        region: this.getRegionByCountry(airport.country),
        continent: airport.continent,
        icao: airport.icao || undefined,
        directFlights: parseInt(airport.direct_flights || '0')
      }));

    console.log(`Initialized ${this.airports.length} airports from JSON`);
  }

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
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const searchTerm = query.toLowerCase();

    const results = this.airports
      .filter(airport =>
        airport.name.toLowerCase().includes(searchTerm) ||
        airport.city.toLowerCase().includes(searchTerm) ||
        airport.country.toLowerCase().includes(searchTerm) ||
        airport.code.toLowerCase().includes(searchTerm) ||
        (airport.icao && airport.icao.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => {
        // Prioritize exact code matches (IATA)
        if (a.code.toLowerCase() === searchTerm) return -1;
        if (b.code.toLowerCase() === searchTerm) return 1;

        // Then prioritize exact ICAO matches
        if (a.icao?.toLowerCase() === searchTerm) return -1;
        if (b.icao?.toLowerCase() === searchTerm) return 1;

        // Then prioritize matches at the beginning of codes
        const aCodeStartsWith = a.code.toLowerCase().startsWith(searchTerm);
        const bCodeStartsWith = b.code.toLowerCase().startsWith(searchTerm);
        if (aCodeStartsWith && !bCodeStartsWith) return -1;
        if (!aCodeStartsWith && bCodeStartsWith) return 1;

        // Then prioritize matches at the beginning of ICAO
        const aIcaoStartsWith = a.icao?.toLowerCase().startsWith(searchTerm);
        const bIcaoStartsWith = b.icao?.toLowerCase().startsWith(searchTerm);
        if (aIcaoStartsWith && !bIcaoStartsWith) return -1;
        if (!aIcaoStartsWith && bIcaoStartsWith) return 1;

        // Then prioritize matches at the beginning of names
        const aNameStartsWith = a.name.toLowerCase().startsWith(searchTerm);
        const bNameStartsWith = b.name.toLowerCase().startsWith(searchTerm);
        if (aNameStartsWith && !bNameStartsWith) return -1;
        if (!aNameStartsWith && bNameStartsWith) return 1;

        // Then prioritize matches at the beginning of cities
        // const aCityStartsWith = a.city.toLowerCase().startsWith(searchTerm);
        // const bCityStartsWith = b.city.toLowerCase().startsWith(searchTerm);
        // if (aCityStartsWith && !bCityStartsWith) return -1;
        // if (!aCityStartsWith && bCityStartsWith) return 1;

        // Finally sort by direct flights (most flights first), then alphabetically by name
        const aFlights = a.directFlights || 0;
        const bFlights = b.directFlights || 0;
        if (aFlights !== bFlights) return bFlights - aFlights;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);

    // Cache the results
    this.cache.set(cacheKey, results);

    return results;
  }

  /**
   * Get airport by code (IATA or ICAO)
   */
  async getAirportByCode(code: string): Promise<AirportSearchResult | null> {
    if (!code) return null;

    const codeLower = code.toLowerCase();
    const airport = this.airports.find(a =>
      a.code.toLowerCase() === codeLower ||
      a.icao?.toLowerCase() === codeLower
    );
    return airport || null;
  }

  /**
   * Get popular airports (by direct flights)
   */
  async getPopularAirports(limit = 20): Promise<AirportSearchResult[]> {
    const cacheKey = `popular_${limit}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Get airports with coordinates and prioritize major hubs
    const majorHubs = [
      'LHR', 'CDG', 'JFK', 'LAX', 'DXB', 'SIN', 'HND', 'FRA', 'AMS', 'MAD',
      'FCO', 'MUC', 'BER', 'ZRH', 'GVA', 'ORD', 'MIA', 'SFO', 'BOS', 'ATL'
    ];

    const results = this.airports
      .filter(airport => majorHubs.includes(airport.code))
      .sort((a, b) => {
        const aIndex = majorHubs.indexOf(a.code);
        const bIndex = majorHubs.indexOf(b.code);
        return aIndex - bIndex;
      })
      .slice(0, limit);

    // If we don't have enough major hubs, fill with other airports
    if (results.length < limit) {
      const additionalAirports = this.airports
        .filter(airport => !majorHubs.includes(airport.code))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, limit - results.length);

      results.push(...additionalAirports);
    }

    this.cache.set(cacheKey, results);
    return results;
  }

  /**
   * Get airports by region
   */
  async getAirportsByRegion(region: string, limit = 100): Promise<AirportSearchResult[]> {
    const cacheKey = `region_${region}_${limit}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const results = this.airports
      .filter(airport => airport.region === region)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);

    this.cache.set(cacheKey, results);
    return results;
  }

  /**
   * Get airports by continent
   */
  async getAirportsByContinent(continent: string, limit = 100): Promise<AirportSearchResult[]> {
    const cacheKey = `continent_${continent}_${limit}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const results = this.airports
      .filter(airport => {
        return airport.continent && airport.continent.toLowerCase() === continent.toLowerCase();
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);

    this.cache.set(cacheKey, results);
    return results;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all airports (for debugging)
   */
  getAllAirports(): AirportSearchResult[] {
    return this.airports;
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
}

export const airportsStaticService = new AirportsStaticService();