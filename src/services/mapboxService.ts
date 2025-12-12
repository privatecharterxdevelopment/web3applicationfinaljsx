/**
 * Mapbox Service for Luxury Travel Planning
 *
 * Provides map generation and route calculation for travel itineraries:
 * - Static map images for itinerary overview
 * - Route calculations with drive times
 * - Marker placement for venues
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapMarker {
  coordinates: Coordinates;
  label?: string;
  color?: string;
  size?: 'small' | 'large';
}

export interface RouteSegment {
  from: Coordinates;
  to: Coordinates;
  distance_km: number;
  duration_minutes: number;
  mode: 'driving' | 'walking' | 'cycling';
}

export interface MapData {
  overview_map_url: string;
  center: Coordinates;
  zoom: number;
  daily_routes: DailyRoute[];
  markers: MapMarker[];
}

export interface DailyRoute {
  day: number;
  date: string;
  map_url: string;
  total_distance_km: number;
  total_duration_minutes: number;
  segments: RouteSegment[];
}

export interface ItineraryVenue {
  name: string;
  coordinates: Coordinates;
  type: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const MAPBOX_STYLE = 'mapbox/streets-v12'; // Clean style for luxury

/**
 * Generate a static map URL with markers
 */
export function generateStaticMapUrl(
  center: Coordinates,
  markers: MapMarker[],
  width: number = 800,
  height: number = 500,
  zoom: number = 12
): string {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token not configured');
    return '';
  }

  // Build marker overlay string
  const markerOverlays = markers.map((marker, index) => {
    const color = marker.color || (index === 0 ? 'ff0000' : '0066ff'); // Red for first, blue for others
    const size = marker.size || 'small';
    const label = marker.label || String.fromCharCode(65 + index); // A, B, C, etc.
    return `pin-${size === 'large' ? 'l' : 's'}-${label.toLowerCase()}+${color}(${marker.coordinates.lng},${marker.coordinates.lat})`;
  }).join(',');

  const overlay = markerOverlays ? `${markerOverlays}/` : '';

  return `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/${overlay}${center.lng},${center.lat},${zoom},0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}&logo=false&attribution=false`;
}

/**
 * Generate a static map URL with a route path
 */
export function generateRouteMapUrl(
  path: Coordinates[],
  markers: MapMarker[],
  width: number = 800,
  height: number = 400
): string {
  if (!MAPBOX_TOKEN || path.length < 2) {
    return '';
  }

  // Create GeoJSON path
  const pathCoords = path.map(p => `${p.lng},${p.lat}`).join(';');

  // Calculate bounding box for auto-zoom
  const lngs = path.map(p => p.lng);
  const lats = path.map(p => p.lat);
  const bbox = [
    Math.min(...lngs) - 0.02,
    Math.min(...lats) - 0.02,
    Math.max(...lngs) + 0.02,
    Math.max(...lats) + 0.02
  ].join(',');

  // Build marker overlay
  const markerOverlays = markers.map((marker, index) => {
    const color = marker.color || '0066ff';
    const label = marker.label || String.fromCharCode(65 + index);
    return `pin-s-${label.toLowerCase()}+${color}(${marker.coordinates.lng},${marker.coordinates.lat})`;
  }).join(',');

  // Create path overlay (blue line)
  const pathOverlay = `path-4+0066ff-0.7(${encodeURIComponent(pathCoords)})`;

  const overlays = [pathOverlay, markerOverlays].filter(Boolean).join(',');

  return `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/${overlays}/auto/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}&logo=false`;
}

/**
 * Get directions between two points
 */
export async function getDirections(
  from: Coordinates,
  to: Coordinates,
  mode: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<RouteSegment | null> {
  if (!MAPBOX_TOKEN) {
    // Return estimated values if no token
    const distance = calculateDistance(from, to);
    return {
      from,
      to,
      distance_km: distance,
      duration_minutes: Math.round(distance * 2), // Rough estimate: 30 km/h average
      mode
    };
  }

  try {
    const profile = mode === 'driving' ? 'mapbox/driving' :
                    mode === 'walking' ? 'mapbox/walking' : 'mapbox/cycling';

    const response = await fetch(
      `https://api.mapbox.com/directions/v5/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?access_token=${MAPBOX_TOKEN}&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error(`Mapbox Directions API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    return {
      from,
      to,
      distance_km: Math.round(route.distance / 1000 * 10) / 10, // Convert to km with 1 decimal
      duration_minutes: Math.round(route.duration / 60),
      mode
    };
  } catch (error) {
    console.error('Error getting directions:', error);
    // Fallback to estimation
    const distance = calculateDistance(from, to);
    return {
      from,
      to,
      distance_km: distance,
      duration_minutes: Math.round(distance * 2),
      mode
    };
  }
}

/**
 * Calculate straight-line distance between two coordinates (Haversine formula)
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate center point of multiple coordinates
 */
export function calculateCenter(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length
  };
}

/**
 * Calculate optimal zoom level for given coordinates
 */
export function calculateZoom(coordinates: Coordinates[]): number {
  if (coordinates.length <= 1) return 14;

  const lngs = coordinates.map(c => c.lng);
  const lats = coordinates.map(c => c.lat);

  const maxLng = Math.max(...lngs);
  const minLng = Math.min(...lngs);
  const maxLat = Math.max(...lats);
  const minLat = Math.min(...lats);

  const lngDiff = maxLng - minLng;
  const latDiff = maxLat - minLat;
  const maxDiff = Math.max(lngDiff, latDiff);

  // Approximate zoom levels based on span
  if (maxDiff > 10) return 5;
  if (maxDiff > 5) return 7;
  if (maxDiff > 2) return 9;
  if (maxDiff > 1) return 10;
  if (maxDiff > 0.5) return 11;
  if (maxDiff > 0.2) return 12;
  if (maxDiff > 0.1) return 13;
  return 14;
}

/**
 * Generate complete map data for an itinerary
 */
export async function generateItineraryMaps(
  days: Array<{
    day: number;
    date: string;
    venues: ItineraryVenue[];
  }>
): Promise<MapData> {
  const allVenues: ItineraryVenue[] = [];
  const dailyRoutes: DailyRoute[] = [];

  // Collect all venues
  for (const day of days) {
    allVenues.push(...day.venues);
  }

  // Calculate center and zoom for overview
  const allCoords = allVenues.map(v => v.coordinates);
  const center = calculateCenter(allCoords);
  const zoom = calculateZoom(allCoords);

  // Generate overview markers
  const overviewMarkers: MapMarker[] = allVenues.map((venue, index) => ({
    coordinates: venue.coordinates,
    label: String.fromCharCode(65 + (index % 26)), // A-Z
    color: getColorForType(venue.type),
    size: 'small'
  }));

  // Generate overview map
  const overviewMapUrl = generateStaticMapUrl(center, overviewMarkers, 1000, 600, zoom);

  // Generate daily route maps
  for (const day of days) {
    if (day.venues.length === 0) continue;

    const dayCoords = day.venues.map(v => v.coordinates);
    const dayCenter = calculateCenter(dayCoords);
    const dayMarkers: MapMarker[] = day.venues.map((venue, index) => ({
      coordinates: venue.coordinates,
      label: String(index + 1),
      color: getColorForType(venue.type)
    }));

    // Calculate route segments
    const segments: RouteSegment[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < day.venues.length - 1; i++) {
      const segment = await getDirections(
        day.venues[i].coordinates,
        day.venues[i + 1].coordinates
      );
      if (segment) {
        segments.push(segment);
        totalDistance += segment.distance_km;
        totalDuration += segment.duration_minutes;
      }
    }

    const dayMapUrl = dayCoords.length > 1
      ? generateRouteMapUrl(dayCoords, dayMarkers)
      : generateStaticMapUrl(dayCenter, dayMarkers, 800, 400, 13);

    dailyRoutes.push({
      day: day.day,
      date: day.date,
      map_url: dayMapUrl,
      total_distance_km: Math.round(totalDistance * 10) / 10,
      total_duration_minutes: totalDuration,
      segments
    });
  }

  return {
    overview_map_url: overviewMapUrl,
    center,
    zoom,
    daily_routes: dailyRoutes,
    markers: overviewMarkers
  };
}

/**
 * Get color based on venue type
 */
function getColorForType(type: string): string {
  const colors: Record<string, string> = {
    accommodation: 'ff6b35',  // Orange
    hotel: 'ff6b35',
    dining: 'e91e63',        // Pink
    restaurant: 'e91e63',
    activity: '2196f3',      // Blue
    experience: '2196f3',
    transport: '4caf50',     // Green
    transfer: '4caf50',
    spa: '9c27b0',          // Purple
    wellness: '9c27b0',
    yacht: '00bcd4',        // Cyan
    helicopter: '607d8b',   // Grey-blue
    default: '000000'       // Black
  };

  return colors[type.toLowerCase()] || colors.default;
}

/**
 * Geocode an address to coordinates
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token not configured for geocoding');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Mapbox Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const [lng, lat] = data.features[0].center;
    return { lat, lng };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Get destination coordinates from city name
 */
export async function getDestinationCoordinates(destination: string): Promise<Coordinates | null> {
  return geocodeAddress(destination);
}

export default {
  generateStaticMapUrl,
  generateRouteMapUrl,
  getDirections,
  calculateDistance,
  calculateCenter,
  calculateZoom,
  generateItineraryMaps,
  geocodeAddress,
  getDestinationCoordinates,
};
