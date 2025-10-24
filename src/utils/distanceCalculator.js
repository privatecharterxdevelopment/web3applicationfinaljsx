// Distance calculator for flight range filtering
// Uses Haversine formula to calculate distance between two cities

// Major city coordinates database (airports)
const CITY_COORDINATES = {
  // Europe
  'london': { lat: 51.4700, lon: -0.4543 },
  'paris': { lat: 49.0097, lon: 2.5479 },
  'zurich': { lat: 47.4647, lon: 8.5492 },
  'geneva': { lat: 46.2378, lon: 6.1089 },
  'berlin': { lat: 52.5595, lon: 13.2877 },
  'munich': { lat: 48.3538, lon: 11.7750 },
  'rome': { lat: 41.8003, lon: 12.2389 },
  'milan': { lat: 45.6301, lon: 8.7231 },
  'madrid': { lat: 40.4719, lon: -3.5626 },
  'barcelona': { lat: 41.2971, lon: 2.0785 },
  'amsterdam': { lat: 52.3105, lon: 4.7683 },
  'brussels': { lat: 50.9010, lon: 4.4856 },
  'vienna': { lat: 48.1103, lon: 16.5697 },
  'prague': { lat: 50.1008, lon: 14.2600 },
  'warsaw': { lat: 52.1657, lon: 20.9671 },
  'athens': { lat: 37.9364, lon: 23.9445 },
  'istanbul': { lat: 41.2753, lon: 28.7519 },
  'moscow': { lat: 55.9726, lon: 37.4146 },
  'dublin': { lat: 53.4213, lon: -6.2701 },
  'lisbon': { lat: 38.7813, lon: -9.1361 },
  
  // North America
  'new york': { lat: 40.6413, lon: -73.7781 },
  'los angeles': { lat: 33.9416, lon: -118.4085 },
  'miami': { lat: 25.7959, lon: -80.2870 },
  'chicago': { lat: 41.9742, lon: -87.9073 },
  'san francisco': { lat: 37.6213, lon: -122.3790 },
  'las vegas': { lat: 36.0840, lon: -115.1537 },
  'washington': { lat: 38.8521, lon: -77.0377 },
  'toronto': { lat: 43.6777, lon: -79.6248 },
  'vancouver': { lat: 49.1939, lon: -123.1844 },
  'montreal': { lat: 45.4707, lon: -73.7408 },
  'mexico city': { lat: 19.4363, lon: -99.0721 },
  
  // Middle East
  'dubai': { lat: 25.2532, lon: 55.3657 },
  'abu dhabi': { lat: 24.4330, lon: 54.6511 },
  'doha': { lat: 25.2731, lon: 51.6080 },
  'riyadh': { lat: 24.9578, lon: 46.6980 },
  'tel aviv': { lat: 32.0114, lon: 34.8867 },
  'cairo': { lat: 30.1219, lon: 31.4056 },
  
  // Asia
  'tokyo': { lat: 35.5494, lon: 139.7798 },
  'singapore': { lat: 1.3644, lon: 103.9915 },
  'hong kong': { lat: 22.3080, lon: 113.9185 },
  'beijing': { lat: 40.0799, lon: 116.6031 },
  'shanghai': { lat: 31.1443, lon: 121.8083 },
  'bangkok': { lat: 13.6900, lon: 100.7501 },
  'seoul': { lat: 37.4602, lon: 126.4407 },
  'mumbai': { lat: 19.0896, lon: 72.8656 },
  'delhi': { lat: 28.5562, lon: 77.1000 },
  'sydney': { lat: -33.9399, lon: 151.1753 },
  'melbourne': { lat: -37.6690, lon: 144.8410 },
  
  // South America
  'sao paulo': { lat: -23.4356, lon: -46.4731 },
  'rio de janeiro': { lat: -22.8099, lon: -43.2505 },
  'buenos aires': { lat: -34.8222, lon: -58.5358 },
  
  // Africa
  'johannesburg': { lat: -26.1392, lon: 28.2460 },
  'cape town': { lat: -33.9715, lon: 18.6021 },
  'nairobi': { lat: -1.3192, lon: 36.9278 }
};

/**
 * Calculate distance between two cities in nautical miles (nm)
 * @param {string} city1 - First city name
 * @param {string} city2 - Second city name
 * @returns {number|null} - Distance in nautical miles or null if cities not found
 */
export function calculateDistance(city1, city2) {
  if (!city1 || !city2) return null;
  
  const c1 = city1.toLowerCase().trim();
  const c2 = city2.toLowerCase().trim();
  
  const coord1 = CITY_COORDINATES[c1];
  const coord2 = CITY_COORDINATES[c2];
  
  if (!coord1 || !coord2) {
    console.warn(`Coordinates not found for: ${!coord1 ? city1 : city2}`);
    return null;
  }
  
  // Haversine formula
  const R = 3440.065; // Earth radius in nautical miles
  const lat1 = coord1.lat * Math.PI / 180;
  const lat2 = coord2.lat * Math.PI / 180;
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lon - coord1.lon) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

/**
 * Filter jets by range capability for given distance
 * @param {Array} jets - Array of jet objects
 * @param {number} requiredDistance - Required distance in nautical miles
 * @param {number} buffer - Safety buffer percentage (default 20%)
 * @returns {Array} - Filtered jets that can handle the distance
 */
export function filterJetsByRange(jets, requiredDistance, buffer = 0.2) {
  if (!requiredDistance || requiredDistance <= 0) return jets;
  
  // Add buffer for reserves, headwinds, diversions
  const requiredRange = requiredDistance * (1 + buffer);
  
  return jets.filter(jet => {
    const jetRange = jet.range_nm || jet.range_km ? (jet.range_km / 1.852) : null;
    if (!jetRange) return true; // Include jets without range data
    return jetRange >= requiredRange;
  });
}

/**
 * Categorize jets by range class
 * @param {number} rangeNm - Range in nautical miles
 * @returns {string} - Jet category
 */
export function getJetCategory(rangeNm) {
  if (rangeNm < 1500) return 'Light Jet';
  if (rangeNm < 3000) return 'Midsize Jet';
  if (rangeNm < 4000) return 'Super Midsize Jet';
  if (rangeNm < 6000) return 'Heavy Jet';
  return 'Ultra Long Range';
}

/**
 * Estimate flight duration
 * @param {number} distanceNm - Distance in nautical miles
 * @param {number} speedKmh - Average cruise speed in km/h
 * @returns {string} - Formatted duration (e.g., "2h 30m")
 */
export function estimateDuration(distanceNm, speedKmh = 850) {
  const distanceKm = distanceNm * 1.852;
  const hours = distanceKm / speedKmh;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

/**
 * Estimate flight cost
 * @param {number} distanceNm - Distance in nautical miles
 * @param {number} hourlyRate - Hourly rate in EUR
 * @param {number} speedKmh - Average cruise speed in km/h
 * @returns {number} - Estimated cost in EUR
 */
export function estimateCost(distanceNm, hourlyRate, speedKmh = 850) {
  const distanceKm = distanceNm * 1.852;
  const hours = distanceKm / speedKmh;
  return Math.round(hours * hourlyRate);
}
