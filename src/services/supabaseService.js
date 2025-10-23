import { supabase } from '../lib/supabase';

// Normalize images that might be stored as array, JSON object, or single string
export const ImageUtils = {
  getAllImageUrls(images) {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(Boolean).map(String);
    if (typeof images === 'string') return [images];
    if (typeof images === 'object') return Object.values(images).filter(Boolean).map(String);
    return [];
  },
  getPrimaryImage(images) {
    const all = ImageUtils.getAllImageUrls(images);
    return all[0] || null;
  }
};

// Map DB rows to the shapes AIChat expects
function mapJetToAircraft(jet) {
  return {
    id: jet.id,
    name: jet.name || jet.model || jet.title || 'Private Jet',
    model: jet.model || jet.name || jet.aircraft_type,
    aircraft_type: jet.aircraft_type || jet.type || jet.category,
    type: jet.category || jet.type || 'Jet',
    max_passengers: jet.passenger_capacity || jet.capacity || jet.max_passengers || jet.pax_capacity || null,
    pax_capacity: jet.pax_capacity || jet.passenger_capacity || jet.capacity || jet.max_passengers || null,
    range_km: jet.range_km || jet.range || null,
    range_nm: jet.range_nm || (jet.range_km ? Math.round(jet.range_km * 0.539957) : null),
    speed_kmh: jet.speed_kmh || jet.speed || null,
    speed_kts: jet.speed_kts || (jet.speed_kmh ? Math.round(jet.speed_kmh * 0.539957) : null),
    hourly_rate_eur: jet.hourly_rate || jet.price_per_hour || jet.hourly_rate_eur || jet.price || null,
    base_location: jet.base_location || jet.base || jet.location || null,
    images: ImageUtils.getAllImageUrls(jet.images || jet.image_url || jet.photo_url),
    // Additional fields for better display
    category: jet.category || jet.type,
    operator: jet.operator || null,
    registration: jet.registration || jet.tail_number || null
  };
}

function mapEmptyLeg(leg) {
  return {
    id: leg.id,
    departure_city: leg.from_city || leg.from || leg.departure_city || null,
    arrival_city: leg.to_city || leg.to || leg.arrival_city || null,
    departure_date: leg.departure_date,
    departure_time: leg.departure_time || null,
    price_eur: leg.price_eur || leg.price_usd || leg.price || null,
    discount_percentage: leg.discount_percentage || leg.discount || null,
    available_seats: leg.available_seats || leg.passengers || leg.max_passengers || leg.passenger_capacity || 8,
    // AIChat looks for leg.aircraft?.images; provide a minimal wrapper if we have images
    aircraft: {
      images: ImageUtils.getAllImageUrls(leg.images || leg.image_url || leg.photo_url)
    }
  };
}

function mapHelicopter(heli) {
  return {
    ...heli,
    max_passengers: heli.passenger_capacity || heli.max_passengers || null,
    hourly_rate_eur: heli.hourly_rate || heli.price_per_hour || heli.hourly_rate_eur || null,
    images: ImageUtils.getAllImageUrls(heli.images || heli.image_url || heli.photo_url)
  };
}

function mapYacht(yacht) {
  return {
    ...yacht,
    length_ft: yacht.length_ft || yacht.length || null,
    max_passengers: yacht.max_guests || yacht.guests || yacht.max_passengers || null,
    daily_rate_eur: yacht.daily_rate || yacht.price_per_day || yacht.daily_rate_eur || null,
    images: ImageUtils.getAllImageUrls(yacht.images || yacht.image_url || yacht.photo_url)
  };
}

function mapCar(car) {
  return {
    ...car,
    brand: car.brand || car.make || null,
    model: car.model || car.variant || null,
    hourly_rate_eur: car.hourly_rate || car.price_per_hour || car.daily_rate || car.hourly_rate_eur || null,
    images: ImageUtils.getAllImageUrls(car.images || car.image_url || car.photo_url)
  };
}

function mapTokenizationService(service) {
  return {
    ...service,
    name: service.name || service.title || 'Tokenization Service',
    price: service.price_eur || service.price_usd || null,
    currency: service.currency || 'EUR',
    images: ImageUtils.getAllImageUrls(service.images || service.image_url || service.photo_url),
    type: 'tokenization',
    includes: service.includes || [],
    deliverables: service.deliverables || [],
    jurisdictions: service.jurisdictions || []
  };
}

export const UnifiedSearchService = {
  async searchAll({ passengers, location, fromLocation, dateFrom, dateTo, q, serviceTypes } = {}) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Expand location variants (e.g., UK -> United Kingdom)
      const buildLocationVariants = (loc) => {
        if (!loc) return [];
        const l = String(loc).trim();
        if (!l || l.toLowerCase() === 'anywhere' || l.toLowerCase() === 'any') return [];
        const variants = [l];
        const low = l.toLowerCase();
        if (low === 'uk' || low === 'u.k.' || low === 'u.k') variants.push('United Kingdom', 'Great Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland');
        if (low === 'usa' || low === 'us' || low === 'u.s.' || low === 'u.s.a') variants.push('United States', 'United States of America', 'America');
        return variants;
      };
  const locationVariants = buildLocationVariants(location);
  const fromVariants = buildLocationVariants(fromLocation);
  const qVariants = buildLocationVariants(q);

      // Only query the services that were requested (if serviceTypes specified)
      const shouldSearchAll = !serviceTypes;
      const searchEmptyLegs = shouldSearchAll || serviceTypes?.emptyLegs;
      const searchJets = shouldSearchAll || serviceTypes?.jets;
      const searchHelicopters = shouldSearchAll || serviceTypes?.helicopters;
      const searchYachts = shouldSearchAll || serviceTypes?.yachts;
      const searchCars = shouldSearchAll || serviceTypes?.cars;

      // Build queries only for requested services
      // Query limits: fetch 10 max (show 5 by default, 10 if user asks for more)

      // Jets query - filter by location if provided
      let jetsQ = Promise.resolve({ data: [], error: null });
      if (searchJets) {
        jetsQ = supabase.from('jets').select('*');
        if (fromVariants.length > 0) {
          jetsQ = jetsQ.or(fromVariants.map(v => `base_location.ilike.%${v}%`).join(','));
        }
        if (passengers) {
          jetsQ = jetsQ.gte('passenger_capacity', passengers);
        }
        jetsQ = jetsQ.limit(10);
      }

      // Empty Legs query - filter by departure/arrival cities and dates (CRITICAL)
      let emptyLegsQ = Promise.resolve({ data: [], error: null });
      if (searchEmptyLegs) {
        emptyLegsQ = supabase.from('EmptyLegs_').select('*');

        // Filter by departure city (fromLocation or q)
        if (fromVariants.length > 0) {
          emptyLegsQ = emptyLegsQ.or(fromVariants.map(v => `from_city.ilike.%${v}%,departure_city.ilike.%${v}%`).join(','));
        } else if (qVariants.length > 0) {
          // If no fromLocation, search both departure and arrival for general location
          emptyLegsQ = emptyLegsQ.or(qVariants.map(v => `from_city.ilike.%${v}%,departure_city.ilike.%${v}%,to_city.ilike.%${v}%,arrival_city.ilike.%${v}%`).join(','));
        }

        // Filter by arrival city (location)
        if (locationVariants.length > 0 && fromVariants.length > 0) {
          // If we have both from and to, filter arrival city
          emptyLegsQ = emptyLegsQ.or(locationVariants.map(v => `to_city.ilike.%${v}%,arrival_city.ilike.%${v}%`).join(','));
        }

        // Filter by departure date if provided
        if (dateFrom) {
          emptyLegsQ = emptyLegsQ.gte('departure_date', dateFrom);
        }
        if (dateTo) {
          emptyLegsQ = emptyLegsQ.lte('departure_date', dateTo);
        } else if (dateFrom) {
          // If only dateFrom provided, show next 30 days
          const endDate = new Date(dateFrom);
          endDate.setDate(endDate.getDate() + 30);
          emptyLegsQ = emptyLegsQ.lte('departure_date', endDate.toISOString().split('T')[0]);
        } else {
          // No date filter - show future flights only
          emptyLegsQ = emptyLegsQ.gte('departure_date', today);
        }

        emptyLegsQ = emptyLegsQ.limit(10);
      }

      // Helicopters query - filter by location and passengers
      let helicoptersQ = Promise.resolve({ data: [], error: null });
      if (searchHelicopters) {
        helicoptersQ = supabase.from('helicopter_charters').select('*');
        if (fromVariants.length > 0 || locationVariants.length > 0) {
          const allLocations = [...fromVariants, ...locationVariants];
          helicoptersQ = helicoptersQ.or(allLocations.map(v => `base_location.ilike.%${v}%,location.ilike.%${v}%`).join(','));
        }
        if (passengers) {
          helicoptersQ = helicoptersQ.gte('passenger_capacity', passengers);
        }
        helicoptersQ = helicoptersQ.limit(10);
      }

      const yachtsQ = searchYachts ? supabase.from('fixed_offers').select('*').limit(10) : Promise.resolve({ data: [], error: null });
      const carsQ = searchCars ? supabase.from('taxi_cars').select('*').limit(10) : Promise.resolve({ data: [], error: null });

      // Adventures query - fetch from fixed_offers where is_empty_leg = false
      const adventuresQ = shouldSearchAll
        ? supabase.from('fixed_offers').select('*').eq('is_empty_leg', false).limit(10)
        : Promise.resolve({ data: [], error: null });

      const [jetsRes, emptyLegsRes, helicoptersRes, yachtsRes, carsRes, adventuresRes] = await Promise.all([
        jetsQ, emptyLegsQ, helicoptersQ, yachtsQ, carsQ, adventuresQ
      ]);

      // Handle errors individually and map data to UI shapes
      if (jetsRes.error) console.error('Supabase jets error:', jetsRes.error);
      if (emptyLegsRes.error) console.error('Supabase EmptyLegs_ error:', emptyLegsRes.error);
      if (helicoptersRes.error) console.error('Supabase helicopter_charters error:', helicoptersRes.error);
      if (yachtsRes.error) console.error('Supabase fixed_offers (yachts) error:', yachtsRes.error);
      if (carsRes.error) console.error('Supabase taxi_cars error:', carsRes.error);
      if (adventuresRes.error) console.error('Supabase fixed_offers (adventures) error:', adventuresRes.error);

      const aircraft = (jetsRes.data || []).map(mapJetToAircraft);
      const emptyLegs = (emptyLegsRes.data || []).map(mapEmptyLeg);
      const helicopters = (helicoptersRes.data || []).map(mapHelicopter);
      const yachts = (yachtsRes.data || []).map(mapYacht);
      const luxuryCars = (carsRes.data || []).map(mapCar);
      const adventures = (adventuresRes.data || []).map(adv => ({
        ...adv,
        name: adv.title || adv.name,
        images: ImageUtils.getAllImageUrls(adv.images || adv.image_url)
      }));

      const totalResults =
        aircraft.length + emptyLegs.length + helicopters.length + yachts.length + luxuryCars.length + adventures.length;

      return { totalResults, aircraft, emptyLegs, helicopters, yachts, luxuryCars, adventures };
    } catch (error) {
      console.error('Unified search error:', error);
      return { totalResults: 0, aircraft: [], emptyLegs: [], helicopters: [], yachts: [], luxuryCars: [], tokenizationServices: [] };
    }
  }
};
