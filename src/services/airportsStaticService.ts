// Mock airport service for the redesigned landing page
export interface AirportSearchResult {
  code: string;
  name: string;
  city: string;
  country: string;
  state?: string;
  lat: number;
  lng: number;
}

// Comprehensive airport data - covers major worldwide airports
const mockAirports: AirportSearchResult[] = [
  // United States
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', state: 'NY', lat: 40.6413, lng: -73.7781 },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', state: 'CA', lat: 33.9425, lng: -118.4081 },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', state: 'FL', lat: 25.7959, lng: -80.2870 },
  { code: 'ORD', name: 'Chicago O\'Hare International Airport', city: 'Chicago', country: 'United States', state: 'IL', lat: 41.9742, lng: -87.9073 },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', state: 'GA', lat: 33.6407, lng: -84.4277 },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', state: 'CA', lat: 37.6213, lng: -122.3790 },
  { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'United States', state: 'NV', lat: 36.0840, lng: -115.1537 },
  { code: 'BOS', name: 'Logan International Airport', city: 'Boston', country: 'United States', state: 'MA', lat: 42.3656, lng: -71.0096 },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States', state: 'TX', lat: 32.8998, lng: -97.0403 },
  { code: 'BUR', name: 'Hollywood Burbank Airport', city: 'Burbank', country: 'United States', state: 'CA', lat: 34.2007, lng: -118.3585 },
  { code: 'SJC', name: 'Norman Y. Mineta San Jose International Airport', city: 'San Jose', country: 'United States', state: 'CA', lat: 37.3639, lng: -121.9289 },
  { code: 'OPF', name: 'Opa-locka Executive Airport', city: 'Miami', country: 'United States', state: 'FL', lat: 25.9070, lng: -80.2784 },

  // United Kingdom
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lng: -0.4543 },
  { code: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom', lat: 51.1537, lng: -0.1821 },
  { code: 'LCY', name: 'London City Airport', city: 'London', country: 'United Kingdom', lat: 51.5048, lng: 0.0495 },
  { code: 'LCI', name: 'Laconia Municipal Airport', city: 'Laconia', country: 'United States', state: 'NH', lat: 43.5727, lng: -71.4189 },
  { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom', lat: 53.3657, lng: -2.2730 },
  { code: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom', lat: 55.9500, lng: -3.3725 },

  // France
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479 },
  { code: 'NCE', name: 'Nice Côte d\'Azur Airport', city: 'Nice', country: 'France', lat: 43.6584, lng: 7.2159 },
  { code: 'ORY', name: 'Paris Orly Airport', city: 'Paris', country: 'France', lat: 48.7252, lng: 2.3597 },
  { code: 'LYS', name: 'Lyon-Saint Exupéry Airport', city: 'Lyon', country: 'France', lat: 45.7256, lng: 5.0811 },
  { code: 'MRS', name: 'Marseille Provence Airport', city: 'Marseille', country: 'France', lat: 43.4393, lng: 5.2214 },

  // Switzerland
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4647, lng: 8.5492 },
  { code: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'Switzerland', lat: 46.2381, lng: 6.1089 },

  // Germany
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622 },
  { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3537, lng: 11.7750 },
  { code: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany', lat: 52.3667, lng: 13.5033 },
  { code: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Germany', lat: 51.2895, lng: 6.7668 },
  { code: 'HAM', name: 'Hamburg Airport', city: 'Hamburg', country: 'Germany', lat: 53.6304, lng: 9.9882 },
  { code: 'MGL', name: 'Mönchengladbach Airport', city: 'Mönchengladbach', country: 'Germany', lat: 51.2303, lng: 6.5044 },

  // Netherlands
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lng: 4.7683 },

  // Spain
  { code: 'BCN', name: 'Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain', lat: 41.2974, lng: 2.0833 },
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'Spain', lat: 40.4983, lng: -3.5676 },
  { code: 'AGP', name: 'Málaga-Costa del Sol Airport', city: 'Málaga', country: 'Spain', lat: 36.6749, lng: -4.4991 },
  { code: 'PMI', name: 'Palma de Mallorca Airport', city: 'Palma', country: 'Spain', lat: 39.5517, lng: 2.7388 },
  { code: 'IBZ', name: 'Ibiza Airport', city: 'Ibiza', country: 'Spain', lat: 38.8729, lng: 1.3731 },

  // Italy
  { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport', city: 'Rome', country: 'Italy', lat: 41.8003, lng: 12.2389 },
  { code: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venice', country: 'Italy', lat: 45.5053, lng: 12.3519 },
  { code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', lat: 45.6306, lng: 8.7231 },
  { code: 'NAP', name: 'Naples International Airport', city: 'Naples', country: 'Italy', lat: 40.8860, lng: 14.2908 },
  { code: 'PSA', name: 'Pisa International Airport', city: 'Pisa', country: 'Italy', lat: 43.6839, lng: 10.3927 },

  // Austria
  { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', lat: 48.1103, lng: 16.5697 },

  // Portugal
  { code: 'LIS', name: 'Lisbon Portela Airport', city: 'Lisbon', country: 'Portugal', lat: 38.7742, lng: -9.1342 },
  { code: 'OPO', name: 'Francisco Sá Carneiro Airport', city: 'Porto', country: 'Portugal', lat: 41.2481, lng: -8.6814 },
  { code: 'FAO', name: 'Faro Airport', city: 'Faro', country: 'Portugal', lat: 37.0144, lng: -7.9659 },

  // Greece
  { code: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', lat: 37.9364, lng: 23.9445 },
  { code: 'HER', name: 'Heraklion International Airport', city: 'Heraklion', country: 'Greece', lat: 35.3397, lng: 25.1803 },
  { code: 'SKG', name: 'Thessaloniki Airport', city: 'Thessaloniki', country: 'Greece', lat: 40.5197, lng: 22.9709 },

  // Turkey
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lng: 28.7519 },
  { code: 'SAW', name: 'Sabiha Gökçen International Airport', city: 'Istanbul', country: 'Turkey', lat: 40.8986, lng: 29.3092 },

  // Middle East
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lng: 55.3657 },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6086 },
  { code: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4330, lng: 54.6511 },

  // Asia
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', lat: 35.7647, lng: 140.3864 },
  { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798 },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', lat: 22.3080, lng: 113.9185 },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', lat: 37.4602, lng: 126.4407 },

  // Oceania
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', lat: -33.9399, lng: 151.1753 },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lng: 144.8410 },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lng: 174.7850 },

  // Canada
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', lat: 43.6777, lng: -79.6248 },
  { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', lat: 49.1939, lng: -123.1844 },
  { code: 'YUL', name: 'Montréal-Pierre Elliott Trudeau International Airport', city: 'Montreal', country: 'Canada', lat: 45.4657, lng: -73.7455 }
];

export const airportsStaticService = {
  async searchAirports(query: string): Promise<AirportSearchResult[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!query || query.length < 1) {
      return mockAirports.slice(0, 8);
    }

    const searchTerm = query.toLowerCase();
    return mockAirports.filter(airport =>
      airport.name.toLowerCase().includes(searchTerm) ||
      airport.code.toLowerCase().includes(searchTerm) ||
      airport.city.toLowerCase().includes(searchTerm) ||
      airport.country.toLowerCase().includes(searchTerm)
    ).slice(0, 8);
  },

  async getAirportByCode(code: string): Promise<AirportSearchResult | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockAirports.find(airport => airport.code.toLowerCase() === code.toLowerCase()) || null;
  }
};