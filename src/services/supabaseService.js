import { supabase } from '../lib/supabase';
import { calculateFlightPrice } from '../components/Landingpagenew/AIChat/utils/priceCalculator';

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

// Helper: Parse range from string like "13,890 km" or numeric values
function parseRange(rangeValue) {
  if (!rangeValue) return null;
  if (typeof rangeValue === 'number') return rangeValue;
  // Parse string like "13,890 km" or "7,500km"
  const numMatch = String(rangeValue).replace(/,/g, '').match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1]) : null;
}

// Helper: Parse capacity from string or number
function parseCapacity(capacityValue) {
  if (!capacityValue) return null;
  if (typeof capacityValue === 'number') return capacityValue;
  const numMatch = String(capacityValue).match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1]) : null;
}

// Helper: Parse price from string like "€8,500/hr" or "€3,200/h"
function parsePrice(priceValue) {
  if (!priceValue) return null;
  if (typeof priceValue === 'number') return priceValue;
  const numMatch = String(priceValue).replace(/,/g, '').match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1]) : null;
}

// Helper: Parse speed from string like "800 km/h" or "450 kts"
function parseSpeed(speedValue) {
  if (!speedValue) return null;
  if (typeof speedValue === 'number') return speedValue;
  const numMatch = String(speedValue).replace(/,/g, '').match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1]) : null;
}

// Map DB rows to the shapes AIChat expects
function mapJetToAircraft(jet) {
  // Collect images from multiple image_url columns (jets table format)
  const allImages = [];
  if (jet.image_url) allImages.push(jet.image_url);
  if (jet.image_url_1) allImages.push(jet.image_url_1);
  if (jet.image_url_2) allImages.push(jet.image_url_2);
  if (jet.image_url_3) allImages.push(jet.image_url_3);
  if (jet.image_url_4) allImages.push(jet.image_url_4);
  if (jet.image_url_5) allImages.push(jet.image_url_5);
  // Fallback to images array if no individual columns
  if (allImages.length === 0) {
    const fallbackImages = ImageUtils.getAllImageUrls(jet.images || jet.photo_url);
    allImages.push(...fallbackImages);
  }

  // DEBUG: Log raw jet fields
  console.log('🔍 RAW JET FROM DB:', {
    id: jet.id,
    aircraft_model: jet.aircraft_model,
    capacity: jet.capacity,
    range: jet.range,
    price_range: jet.price_range,
    aircraft_category: jet.aircraft_category
  });

  // Parse range - handle string format like "13,890 km" or numeric
  // jets table uses 'range' column (string like "13,890 km")
  const rangeKm = parseRange(jet.range) || parseRange(jet.range_km) || null;
  const rangeNm = jet.range_nm || (rangeKm ? Math.round(rangeKm * 0.539957) : null);

  // Parse capacity - jets table uses 'capacity' column (can be "8" or "8 pax")
  const capacity = parseCapacity(jet.capacity) || parseCapacity(jet.passenger_capacity) || parseCapacity(jet.max_passengers) || null;

  // Parse hourly rate from price_range (jets table format: "€8,500/hr")
  const hourlyRate = parsePrice(jet.price_range) || parsePrice(jet.hourly_rate) || parsePrice(jet.price_per_hour) || null;

  // Parse speed - handle string format like "850 km/h" or numeric
  const speedKmh = parseSpeed(jet.speed) || parseSpeed(jet.speed_kmh) || null;
  const speedKts = jet.speed_kts || (speedKmh ? Math.round(speedKmh * 0.539957) : null);

  // DEBUG: Log parsed values
  console.log('🔍 PARSED JET VALUES:', {
    capacity,
    rangeKm,
    hourlyRate,
    speedKmh
  });

  return {
    id: jet.id,
    // Name: jets table uses 'aircraft_model' column
    name: jet.aircraft_model || jet.name || jet.model || jet.title || 'Private Jet',
    model: jet.aircraft_model || jet.model || jet.name || jet.aircraft_type,
    aircraft_type: jet.aircraft_type || jet.aircraft_category,
    // IMPORTANT: 'type' must be literal 'jets' for SearchResults component to render correctly
    type: 'jets',
    // Passengers: jets table uses 'capacity' column
    max_passengers: capacity,
    pax_capacity: capacity,
    passenger_capacity: capacity,
    // Range: store both km and nm for calculations + display
    range_km: rangeKm,
    range_nm: rangeNm,
    range: rangeKm, // numeric value in km for calculations
    range_display: jet.range || (rangeKm ? `${rangeKm.toLocaleString()} km` : null), // original display format
    // Speed: parsed numeric values
    speed_kmh: speedKmh,
    speed_kts: speedKts,
    // Price: jets table uses 'price_range' column (keep original format for display)
    hourly_rate_eur: hourlyRate,
    price_range: jet.price_range || null,
    base_location: jet.base_location || jet.base || jet.location || null,
    images: allImages,
    primaryImage: allImages[0] || null,
    // Category: jets table uses 'aircraft_category' column
    category: jet.aircraft_category || jet.category || jet.type,
    aircraft_category: jet.aircraft_category || jet.category,
    // Manufacturer (from jets table)
    manufacturer: jet.manufacturer || null,
    // operator: HIDDEN - never expose operator to users
    registration: jet.registration || jet.tail_number || null,
    description: jet.description || null
  };
}

function mapEmptyLeg(leg) {
  // Collect images from multiple possible columns
  const allImages = [];
  if (leg.image_url) allImages.push(leg.image_url);
  if (leg.image_url_1) allImages.push(leg.image_url_1);
  if (leg.image_url_2) allImages.push(leg.image_url_2);
  if (leg.image_url_3) allImages.push(leg.image_url_3);
  if (allImages.length === 0) {
    const fallbackImages = ImageUtils.getAllImageUrls(leg.images || leg.photo_url);
    allImages.push(...fallbackImages);
  }

  // Parse capacity
  const capacity = parseCapacity(leg.capacity) || parseCapacity(leg.available_seats) || parseCapacity(leg.passengers) || parseCapacity(leg.max_passengers) || null;

  // Parse price
  const price = parsePrice(leg.price) || leg.price_eur || leg.price_usd || null;

  return {
    id: leg.id,
    type: 'empty_legs', // CRITICAL: Set type for SearchResults display
    // Location fields - include "from" and "to" for compatibility
    from: leg.from || leg.from_city || leg.departure_city || leg.origin || null,
    to: leg.to || leg.to_city || leg.arrival_city || leg.destination || null,
    from_city: leg.from_city || leg.departure_city || leg.from || leg.origin || null,
    to_city: leg.to_city || leg.arrival_city || leg.to || leg.destination || null,
    departure_city: leg.from_city || leg.departure_city || leg.from || leg.origin || null,
    arrival_city: leg.to_city || leg.arrival_city || leg.to || leg.destination || null,
    from_iata: leg.from_iata || leg.departure_iata || null,
    to_iata: leg.to_iata || leg.arrival_iata || null,
    from_country: leg.from_country || null,
    to_country: leg.to_country || null,
    // Date/time
    departure_date: leg.departure_date || null,
    departure_time: leg.departure_time || null,
    arrival_time: leg.arrival_time || null,
    // Aircraft info
    aircraft_type: leg.aircraft_type || leg.aircraft_model || leg.model || null,
    aircraft_type_original: leg.aircraft_type_original || leg.aircraft_type || null,
    category: leg.category || leg.aircraft_category || null,
    registration: leg.registration || leg.tail_number || null,
    // operator: HIDDEN - never expose operator to users
    // Capacity and pricing
    available_seats: capacity,
    capacity: capacity,
    max_passengers: capacity,
    price: leg.price_usd || price, // Default to USD price
    price_eur: leg.price_eur || price,
    price_usd: leg.price_usd || leg.price || null, // Prioritize USD
    currency: 'USD', // Always USD for empty legs
    discount_percentage: leg.discount_percentage || leg.discount || null,
    // Booking
    booking_link: leg.booking_link || null,
    // Images - include image_url and image_url_1 directly for SearchResults
    image_url: allImages[0] || null,
    image_url_1: allImages[1] || null,
    images: allImages,
    primaryImage: allImages[0] || null,
    // AIChat looks for leg.aircraft?.images
    aircraft: {
      images: allImages
    }
  };
}

function mapHelicopter(heli) {
  // DEBUG: Log ALL raw helicopter fields to identify correct column names
  console.log('🚁 RAW HELICOPTER FROM DB:', {
    id: heli.id,
    name: heli.name,
    model: heli.model,
    // Price columns - check all variations
    price: heli.price,
    hourly_rate: heli.hourly_rate,
    hourly_rate_eur: heli.hourly_rate_eur,
    price_range: heli.price_range,
    price_per_hour: heli.price_per_hour,
    rate: heli.rate,
    cost: heli.cost,
    // All keys for inspection
    allKeys: Object.keys(heli)
  });

  // Collect images from multiple possible columns
  const allImages = [];
  if (heli.image_url) allImages.push(heli.image_url);
  if (heli.image_url_1) allImages.push(heli.image_url_1);
  if (heli.image_url_2) allImages.push(heli.image_url_2);
  if (heli.image_url_3) allImages.push(heli.image_url_3);
  if (allImages.length === 0) {
    const fallbackImages = ImageUtils.getAllImageUrls(heli.images || heli.photo_url);
    allImages.push(...fallbackImages);
  }

  // Parse capacity from string or number
  const capacity = parseCapacity(heli.capacity) || parseCapacity(heli.passenger_capacity) || parseCapacity(heli.max_passengers) || null;

  // Parse hourly rate - 'helicopters' table uses 'hourly_rate' column
  // Try direct numeric value first, then parse strings
  const hourlyRate =
    heli.hourly_rate ||      // 'helicopters' table uses this column
    heli.hourly_rate_eur ||
    heli.price ||
    heli.rate ||
    parsePrice(heli.hourly_rate) ||
    parsePrice(heli.price_range) ||
    parsePrice(heli.price_per_hour) ||
    parsePrice(heli.cost) ||
    null;

  console.log('🚁 PARSED hourlyRate for', heli.name, ':', hourlyRate);

  // Parse range
  const rangeKm = parseRange(heli.range) || parseRange(heli.range_km) || null;

  // Parse speed
  const speedKmh = parseSpeed(heli.speed) || parseSpeed(heli.speed_kmh) || null;

  const mappedHeli = {
    id: heli.id,
    name: heli.name || heli.model || heli.aircraft_model || 'Helicopter',
    model: heli.model || heli.aircraft_model || heli.name,
    type: 'helicopters',
    max_passengers: capacity,
    passenger_capacity: capacity,
    range_km: rangeKm,
    speed_kmh: speedKmh,
    hourly_rate_eur: hourlyRate,
    hourly_rate: hourlyRate,  // Keep original column name too
    price: hourlyRate,
    category: heli.category || heli.aircraft_category || 'Helicopter',
    manufacturer: heli.manufacturer || null,
    year_of_manufacture: heli.year_of_manufacture || heli.year || null,
    // operator: HIDDEN - never expose operator to users
    base_location: heli.base_location || heli.location || null,
    description: heli.description || null,
    images: allImages,
    primaryImage: allImages[0] || null
  };

  console.log('🚁 MAPPED helicopter:', mappedHeli.name, 'price:', mappedHeli.hourly_rate_eur);
  return mappedHeli;
}

function mapYacht(yacht) {
  // Collect images from multiple possible columns
  const allImages = [];
  if (yacht.image_url) allImages.push(yacht.image_url);
  if (yacht.image_url_1) allImages.push(yacht.image_url_1);
  if (yacht.image_url_2) allImages.push(yacht.image_url_2);
  if (yacht.image_url_3) allImages.push(yacht.image_url_3);
  if (allImages.length === 0) {
    const fallbackImages = ImageUtils.getAllImageUrls(yacht.images || yacht.photo_url);
    allImages.push(...fallbackImages);
  }

  // Parse numeric values
  const lengthFt = parseCapacity(yacht.length_ft) || parseCapacity(yacht.length) || null;
  const guests = parseCapacity(yacht.max_guests) || parseCapacity(yacht.guests) || parseCapacity(yacht.max_passengers) || parseCapacity(yacht.capacity) || null;
  const cabins = parseCapacity(yacht.cabins) || null;
  const dailyRate = parsePrice(yacht.daily_rate) || parsePrice(yacht.price_per_day) || yacht.daily_rate_eur || null;

  return {
    id: yacht.id,
    name: yacht.name || yacht.model || yacht.title || 'Yacht',
    model: yacht.model || yacht.name,
    type: 'yachts',
    length_ft: lengthFt,
    max_passengers: guests,
    cabins: cabins,
    daily_rate_eur: dailyRate,
    price: dailyRate,
    category: yacht.category || yacht.type || 'Motor Yacht',
    location: yacht.location || yacht.base_location || null,
    description: yacht.description || null,
    images: allImages,
    primaryImage: allImages[0] || null
  };
}

function mapCar(car) {
  // Collect images from multiple possible columns
  const allImages = [];
  if (car.image_url) allImages.push(car.image_url);
  if (car.image_url_1) allImages.push(car.image_url_1);
  if (car.image_url_2) allImages.push(car.image_url_2);
  if (car.image_url_3) allImages.push(car.image_url_3);
  if (allImages.length === 0) {
    const fallbackImages = ImageUtils.getAllImageUrls(car.images || car.photo_url);
    allImages.push(...fallbackImages);
  }

  // Parse price
  const hourlyRate = parsePrice(car.hourly_rate) || parsePrice(car.price_per_hour) || parsePrice(car.price_range) || car.hourly_rate_eur || null;
  const dailyRate = parsePrice(car.daily_rate) || parsePrice(car.price_per_day) || car.daily_rate_eur || null;

  return {
    id: car.id,
    name: car.name || `${car.brand || car.make || ''} ${car.model || ''}`.trim() || 'Luxury Car',
    brand: car.brand || car.make || null,
    model: car.model || car.variant || null,
    year: car.year || null,
    type: 'luxury_cars',
    hourly_rate_eur: hourlyRate,
    daily_rate_eur: dailyRate,
    price: hourlyRate || dailyRate,
    category: car.category || car.type || 'Luxury',
    location: car.location || car.city || null,
    description: car.description || null,
    images: allImages,
    primaryImage: allImages[0] || null
  };
}

function mapTokenizationService(service) {
  const allImages = ImageUtils.getAllImageUrls(service.images || service.image_url || service.photo_url);
  return {
    ...service,
    name: service.name || service.title || 'Tokenization Service',
    price: service.price_eur || service.price_usd || null,
    currency: service.currency || 'EUR',
    images: allImages,
    primaryImage: allImages[0] || null,
    type: 'tokenization',
    includes: service.includes || [],
    deliverables: service.deliverables || [],
    jurisdictions: service.jurisdictions || []
  };
}

export const UnifiedSearchService = {
  async searchAll({ passengers, location, fromLocation, toLocation, country, dateFrom, dateTo, q, serviceTypes, aircraftModel, category, originCoords, destinationCoords } = {}) {
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
        if (low === 'uae') variants.push('United Arab Emirates', 'Dubai', 'Abu Dhabi');
        if (low === 'germany' || low === 'de') variants.push('Deutschland', 'Munich', 'Frankfurt', 'Berlin');
        if (low === 'france' || low === 'fr') variants.push('Paris', 'Nice', 'Lyon');
        if (low === 'switzerland' || low === 'ch') variants.push('Zurich', 'Geneva', 'Basel');
        if (low === 'italy' || low === 'it') variants.push('Milan', 'Rome', 'Naples');
        if (low === 'spain' || low === 'es') variants.push('Madrid', 'Barcelona', 'Ibiza', 'Mallorca');
        // Continent mappings
        if (low === 'europe' || low === 'european') variants.push(
          'Germany', 'France', 'Italy', 'Spain', 'United Kingdom', 'Switzerland', 'Austria', 'Belgium',
          'Netherlands', 'Portugal', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Czechia', 'Czech Republic',
          'Greece', 'Ireland', 'Luxembourg', 'Monaco', 'Liechtenstein', 'Malta', 'Cyprus', 'Croatia', 'Slovenia',
          'Paris', 'London', 'Berlin', 'Munich', 'Frankfurt', 'Zurich', 'Geneva', 'Vienna', 'Amsterdam', 'Brussels',
          'Milan', 'Rome', 'Madrid', 'Barcelona', 'Lisbon', 'Nice', 'Cannes', 'Monaco', 'Stockholm', 'Copenhagen'
        );
        if (low === 'middle east' || low === 'middleeast') variants.push(
          'Dubai', 'Abu Dhabi', 'United Arab Emirates', 'UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait',
          'Oman', 'Jordan', 'Israel', 'Tel Aviv', 'Riyadh', 'Jeddah', 'Doha'
        );
        if (low === 'asia' || low === 'asian') variants.push(
          'Japan', 'Tokyo', 'Singapore', 'Hong Kong', 'Thailand', 'Bangkok', 'Malaysia', 'Kuala Lumpur',
          'Indonesia', 'Vietnam', 'Philippines', 'Taiwan', 'South Korea', 'Seoul'
        );
        if (low === 'africa' || low === 'african') variants.push(
          'South Africa', 'Johannesburg', 'Cape Town', 'Morocco', 'Egypt', 'Kenya', 'Nigeria', 'Tanzania',
          'Mauritius', 'Seychelles', 'Mozambique'
        );
        return variants;
      };
  const locationVariants = buildLocationVariants(location);
  const fromVariants = buildLocationVariants(fromLocation);
  const toVariants = buildLocationVariants(toLocation);
  const countryVariants = buildLocationVariants(country);
  const qVariants = buildLocationVariants(q);

      // Only query the services that were requested (if serviceTypes specified)
      const shouldSearchAll = !serviceTypes;
      const searchEmptyLegs = shouldSearchAll || serviceTypes?.emptyLegs;
      const searchJets = shouldSearchAll || serviceTypes?.jets;
      const searchHelicopters = shouldSearchAll || serviceTypes?.helicopters;
      const searchYachts = shouldSearchAll || serviceTypes?.yachts;
      const searchLuxuryCars = shouldSearchAll || serviceTypes?.luxuryCars || serviceTypes?.cars;
      const searchGroundTransport = shouldSearchAll || serviceTypes?.groundTransport || serviceTypes?.taxi;

      // Build queries only for requested services
      // Query limits: fetch 10 max (show 5 by default, 10 if user asks for more)

      // Jets query - no location filter (jets table doesn't have location column)
      // Jets are shown based on capacity, user specifies route in request
      // Note: jets table uses 'capacity' column (as string like "8")
      // Search jets from database - include all aircraft when user requests specific model
      let jetsQ = Promise.resolve({ data: [], error: null });
      if (searchJets) {
        let query = supabase.from('jets').select('*');

        // If user is searching for a specific aircraft model, don't exclude anything
        // ALL aircraft are available upon operator confirmation
        if (!aircraftModel) {
          // Only exclude low-priority aircraft when doing general browsing
          query = query
            .not('aircraft_model', 'ilike', '%caravan%');  // Exclude Cessna Caravan from general results
        }

        // Filter by specific aircraft model if provided (e.g., "Gulfstream G650", "Citation X", "PC-12")
        if (aircraftModel) {
          // Use ilike for case-insensitive partial matching
          query = query.ilike('aircraft_model', `%${aircraftModel}%`);
        }

        // Filter by category if provided (e.g., "Light Jet", "Heavy Jet")
        if (category) {
          const categoryMap = {
            'light': 'Light Jet',
            'midsize': 'Midsize Jet',
            'super-midsize': 'Super Midsize Jet',
            'heavy': 'Heavy Jet',
            'ultra-long-range': 'Ultra Long Range'
          };
          const dbCategory = categoryMap[category.toLowerCase()] || category;
          query = query.ilike('aircraft_category', `%${dbCategory}%`);
        }

        // Increase limit when searching for specific model to ensure we get all matching jets
        jetsQ = query.limit(aircraftModel ? 50 : 15);
      }

      // Empty Legs query - FETCH ALL and filter client-side for worldwide search
      let emptyLegsQ = Promise.resolve({ data: [], error: null });
      if (searchEmptyLegs) {
        // Fetch ALL empty legs, filter client-side
        emptyLegsQ = supabase.from('EmptyLegs_').select('*')
          .gte('departure_date', today)
          .order('departure_date', { ascending: true });
      }

      // Helicopters query - use 'helicopters' table (has hourly_rate column)
      let helicoptersQ = Promise.resolve({ data: [], error: null });
      if (searchHelicopters) {
        // Use 'helicopters' table which has correct schema with hourly_rate
        let heliQuery = supabase.from('helicopters').select('*');

        // Filter by specific helicopter model if provided (e.g., "EC135", "AS350", "AW139")
        if (aircraftModel) {
          // Try to match against name, model, or aircraft_model columns
          heliQuery = heliQuery.or(`name.ilike.%${aircraftModel}%,model.ilike.%${aircraftModel}%,aircraft_model.ilike.%${aircraftModel}%`);
        }

        // Increase limit when searching for specific model
        helicoptersQ = heliQuery.limit(aircraftModel ? 50 : 15);
      }

      // YACHTS: Not in database - always return empty (yacht requests are handled conversationally)
      const yachtsQ = Promise.resolve({ data: [], error: null });

      // Luxury Cars query - from luxury_cars table (supercars, exotic rentals)
      const luxuryCarsQ = searchLuxuryCars ? supabase.from('luxury_cars').select('*').limit(10) : Promise.resolve({ data: [], error: null });

      // Ground Transport query - from taxi_cars table (chauffeur, transfers)
      const groundTransportQ = searchGroundTransport ? supabase.from('taxi_cars').select('*').limit(10) : Promise.resolve({ data: [], error: null });

      // Adventures query - fetch from fixed_offers where is_empty_leg = false
      const adventuresQ = shouldSearchAll
        ? supabase.from('fixed_offers').select('*').eq('is_empty_leg', false).limit(10)
        : Promise.resolve({ data: [], error: null });

      const [jetsRes, emptyLegsRes, helicoptersRes, yachtsRes, luxuryCarsRes, groundTransportRes, adventuresRes] = await Promise.all([
        jetsQ, emptyLegsQ, helicoptersQ, yachtsQ, luxuryCarsQ, groundTransportQ, adventuresQ
      ]);

      // Handle errors individually and map data to UI shapes
      if (jetsRes.error) console.error('Supabase jets error:', jetsRes.error);
      if (emptyLegsRes.error) console.error('Supabase EmptyLegs_ error:', emptyLegsRes.error);
      if (helicoptersRes.error) console.error('Supabase helicopters table error:', helicoptersRes.error);
      // DEBUG: Log raw helicopter data from database
      if (helicoptersRes.data?.length > 0) {
        console.log('🚁 RAW helicoptersRes.data (first item):', helicoptersRes.data[0]);
        console.log('🚁 Helicopter columns:', Object.keys(helicoptersRes.data[0]));
      } else {
        console.log('🚁 No helicopters found in database');
      }
      if (yachtsRes.error) console.error('Supabase fixed_offers (yachts) error:', yachtsRes.error);
      if (luxuryCarsRes.error) console.error('Supabase luxury_cars error:', luxuryCarsRes.error);
      if (groundTransportRes.error) console.error('Supabase taxi_cars (ground transport) error:', groundTransportRes.error);
      if (adventuresRes.error) console.error('Supabase fixed_offers (adventures) error:', adventuresRes.error);

      // Map jets and calculate estimated prices if route coordinates are available
      let aircraft = (jetsRes.data || []).map(mapJetToAircraft);

      // If origin and destination coordinates are provided, calculate estimated prices
      if (originCoords && destinationCoords) {
        aircraft = aircraft.map(jet => {
          const hourlyRate = jet.hourly_rate || jet.price_per_hour || jet.hourly_rate_eur || 0;
          const speed = jet.speed_kmh || jet.cruise_speed || 800; // Default 800 km/h for jets

          const priceInfo = calculateFlightPrice({
            origin: originCoords,
            destination: destinationCoords,
            hourlyRate,
            speed
          });

          return {
            ...jet,
            estimated_price: priceInfo.estimatedPrice,
            estimated_flight_hours: priceInfo.billedHours,
            flight_distance_km: priceInfo.distance
          };
        });
      }

      // Empty legs - fetch all and filter client-side by from/to location, country, IATA, date
      let emptyLegs = (emptyLegsRes.data || []).map(mapEmptyLeg);

      // Client-side filtering for empty legs based on user's search
      const searchTerms = [...fromVariants, ...toVariants, ...qVariants, ...locationVariants, ...countryVariants]
        .map(s => s.toLowerCase().trim())
        .filter(s => s.length > 0);

      if (searchTerms.length > 0) {
        emptyLegs = emptyLegs.filter(leg => {
          const legText = [
            leg.from_city, leg.to_city, leg.from, leg.to,
            leg.from_iata, leg.to_iata, leg.from_country, leg.to_country,
            leg.departure_city, leg.arrival_city
          ].filter(Boolean).join(' ').toLowerCase();

          return searchTerms.some(term => legText.includes(term));
        });
      }

      // Filter by date range if provided
      if (dateFrom) {
        emptyLegs = emptyLegs.filter(leg => leg.departure_date >= dateFrom);
      }
      if (dateTo) {
        emptyLegs = emptyLegs.filter(leg => leg.departure_date <= dateTo);
      }
      const helicopters = (helicoptersRes.data || []).map(mapHelicopter);
      const yachts = (yachtsRes.data || []).map(mapYacht);
      const luxuryCars = (luxuryCarsRes.data || []).map(mapCar);
      const groundTransport = (groundTransportRes.data || []).map(car => ({
        ...mapCar(car),
        type: 'ground_transport' // Override type for ground transport
      }));
      const adventures = (adventuresRes.data || []).map(adv => {
        const allImages = ImageUtils.getAllImageUrls(adv.images || adv.image_url);
        return {
          ...adv,
          name: adv.title || adv.name,
          images: allImages,
          primaryImage: allImages[0] || null
        };
      });

      const totalResults =
        aircraft.length + emptyLegs.length + helicopters.length + yachts.length + luxuryCars.length + groundTransport.length + adventures.length;

      return { totalResults, aircraft, emptyLegs, helicopters, yachts, luxuryCars, groundTransport, adventures };
    } catch (error) {
      console.error('Unified search error:', error);
      return { totalResults: 0, aircraft: [], emptyLegs: [], helicopters: [], yachts: [], luxuryCars: [], groundTransport: [], adventures: [] };
    }
  }
};
