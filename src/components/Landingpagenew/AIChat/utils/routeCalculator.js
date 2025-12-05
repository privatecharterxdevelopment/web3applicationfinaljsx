// Route Calculator Utilities
// Multi-stop flight routing logic

import { calculateDistance } from './priceCalculator';

/**
 * Calculate leg distance between two points
 * @param {Object} from - { lat, lng, name, code }
 * @param {Object} to - { lat, lng, name, code }
 * @returns {number} Distance in km
 */
export function calculateLegDistance(from, to) {
  if (!from?.lat || !to?.lat) return 0;
  return calculateDistance(from, to);
}

/**
 * Calculate multi-stop route details
 * @param {Object} item - Cart item with origin/destination
 * @param {Array} stops - Array of stop points
 * @returns {Object} { legs, totalDistance, totalFlightTime, totalPrice }
 */
export function calculateMultiStopRoute(item, stops = []) {
  const legs = [];
  let totalDistance = 0;
  let totalFlightTime = 0;

  // Speed in km/h (convert from knots if needed)
  const speedKmh = (item.speed_kts || 450) * 1.852;
  const hourlyRate = item.hourly_rate_eur || item.hourly_rate || 5000;

  // Get origin coordinates
  const origin = {
    name: item.from || item.origin || item.from_city,
    code: item.from_iata || item.originIata || '',
    lat: item.originLat || item.from_lat || 0,
    lng: item.originLng || item.from_lng || 0
  };

  // Get destination coordinates
  const destination = {
    name: item.to || item.destination || item.to_city,
    code: item.to_iata || item.destinationIata || '',
    lat: item.destLat || item.to_lat || 0,
    lng: item.destLng || item.to_lng || 0
  };

  // Build waypoints: origin -> stops -> destination
  const waypoints = [origin, ...stops, destination];

  // Calculate each leg
  let currentTime = item.departure_time
    ? new Date(`2000-01-01T${item.departure_time}`)
    : new Date();

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    const legDistance = calculateLegDistance(from, to);
    const legFlightTime = legDistance > 0 ? legDistance / speedKmh : 0; // hours

    const departureTime = new Date(currentTime);
    const arrivalTime = new Date(currentTime.getTime() + legFlightTime * 60 * 60 * 1000);

    legs.push({
      from: from.name || from.city,
      fromCode: from.code || '',
      to: to.name || to.city,
      toCode: to.code || '',
      distance: Math.round(legDistance),
      flightTime: legFlightTime,
      departureTime: departureTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      arrivalTime: arrivalTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      stopDuration: to.stopDuration || 0
    });

    totalDistance += legDistance;
    totalFlightTime += legFlightTime;

    // Add stop duration to current time for next leg departure
    currentTime = new Date(arrivalTime.getTime() + (to.stopDuration || 0) * 60 * 1000);
  }

  // Calculate total price (billed hours × hourly rate)
  const billedHours = Math.ceil(totalFlightTime);
  const totalPrice = billedHours * hourlyRate;

  return {
    legs,
    totalDistance: Math.round(totalDistance),
    totalFlightTime,
    totalPrice,
    billedHours
  };
}

/**
 * Format duration from hours to readable string
 * @param {number} hours - Duration in hours
 * @returns {string} Formatted duration
 */
export function formatDuration(hours) {
  if (!hours || hours <= 0) return '0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Format multi-stop route string
 * @param {string} origin - Origin name
 * @param {Array} stops - Array of stops
 * @param {string} destination - Destination name
 * @returns {string} Formatted route string
 */
export function formatMultiStopRoute(origin, stops = [], destination) {
  const stopNames = stops
    .map(s => s.code || s.name?.substring(0, 3).toUpperCase() || 'STOP')
    .join(' → ');

  if (stopNames) {
    return `${origin} → ${stopNames} → ${destination}`;
  }
  return `${origin} → ${destination}`;
}

/**
 * Update cart item with recalculated multi-stop route
 * @param {Object} item - Original cart item
 * @param {Array} stops - Updated stops array
 * @returns {Object} Updated cart item
 */
export function updateItemWithRoute(item, stops) {
  if (!stops || stops.length === 0) {
    // No stops - calculate direct route
    const origin = {
      lat: item.originLat || item.from_lat || 0,
      lng: item.originLng || item.from_lng || 0
    };
    const dest = {
      lat: item.destLat || item.to_lat || 0,
      lng: item.destLng || item.to_lng || 0
    };

    const directDistance = calculateLegDistance(origin, dest);
    const speedKmh = (item.speed_kts || 450) * 1.852;
    const flightTime = directDistance / speedKmh;
    const billedHours = Math.ceil(flightTime);
    const price = billedHours * (item.hourly_rate_eur || item.hourly_rate || 0);

    return {
      ...item,
      stops: [],
      legs: null,
      totalDistance: directDistance,
      flightTimeHours: flightTime,
      estimatedDuration: formatDuration(flightTime),
      billedHours,
      estimatedPrice: price,
      price,
      basePrice: price,
      totalWithFee: price,
      priceCalculation: `${billedHours}h × €${(item.hourly_rate_eur || 0).toLocaleString()}/hr`,
      route: `${item.from || item.origin} → ${item.to || item.destination}`,
      isMultiStop: false
    };
  }

  // Calculate with stops
  const { totalDistance, totalFlightTime, legs, totalPrice, billedHours } = calculateMultiStopRoute(item, stops);

  return {
    ...item,
    stops,
    legs,
    totalDistance,
    flightDistanceNm: totalDistance * 0.539957, // Convert km to nm
    flightTimeHours: totalFlightTime,
    estimatedDuration: formatDuration(totalFlightTime),
    billedHours,
    estimatedPrice: totalPrice,
    price: totalPrice,
    basePrice: totalPrice,
    totalWithFee: totalPrice,
    priceCalculation: `${billedHours}h × €${(item.hourly_rate_eur || 0).toLocaleString()}/hr`,
    route: formatMultiStopRoute(item.from || item.origin, stops, item.to || item.destination),
    isMultiStop: true
  };
}

/**
 * Convert kilometers to nautical miles
 * @param {number} km - Distance in kilometers
 * @returns {number} Distance in nautical miles
 */
export function kmToNm(km) {
  return km * 0.539957;
}

/**
 * Convert nautical miles to kilometers
 * @param {number} nm - Distance in nautical miles
 * @returns {number} Distance in kilometers
 */
export function nmToKm(nm) {
  return nm * 1.852;
}
