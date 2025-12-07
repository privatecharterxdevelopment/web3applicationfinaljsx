/**
 * AI Tool Definitions for Claude Function Calling
 * These tools allow the AI to search and retrieve data from the database
 */

import { UnifiedSearchService } from './supabaseService';

// Mapbox token for geocoding and directions
const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJpdmF0ZWNoYXJ0ZXJ4IiwiYSI6ImNsdGJ2dG4zazFucGsya21tNXRldW5udjYifQ.NrWJLJuG9n6b1jhRh5AkSg';

/**
 * Geocode an address to coordinates using Mapbox
 * @param {string} address - Address to geocode
 * @returns {Promise<{lat: number, lng: number, placeName: string} | null>}
 */
async function geocodeAddress(address) {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=1&types=address,poi,place,locality,neighborhood&language=en`
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        lng: feature.center[0],
        lat: feature.center[1],
        placeName: feature.place_name,
        text: feature.text
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Get driving distance and duration between two points using Mapbox Directions API
 * @param {number} fromLng - Origin longitude
 * @param {number} fromLat - Origin latitude
 * @param {number} toLng - Destination longitude
 * @param {number} toLat - Destination latitude
 * @returns {Promise<{distanceKm: number, durationMinutes: number} | null>}
 */
async function getDirections(fromLng, fromLat, toLng, toLat) {
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false&access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distanceKm: Math.round(route.distance / 1000 * 10) / 10, // Convert meters to km, round to 1 decimal
        durationMinutes: Math.round(route.duration / 60) // Convert seconds to minutes
      };
    }
    return null;
  } catch (error) {
    console.error('Directions error:', error);
    return null;
  }
}

/**
 * Calculate transfer distance using Mapbox (geocoding + directions)
 * Falls back to predefined distances if API fails
 * @param {string} from - Pickup location
 * @param {string} to - Destination
 * @returns {Promise<{distanceKm: number, durationMinutes: number, fromCoords: object, toCoords: object} | null>}
 */
async function calculateTransferDistanceMapbox(from, to) {
  try {
    // Geocode both addresses
    const [fromCoords, toCoords] = await Promise.all([
      geocodeAddress(from),
      geocodeAddress(to)
    ]);

    if (!fromCoords || !toCoords) {
      console.log('Could not geocode addresses, falling back to predefined distances');
      return null;
    }

    // Get directions
    const directions = await getDirections(
      fromCoords.lng, fromCoords.lat,
      toCoords.lng, toCoords.lat
    );

    if (!directions) {
      console.log('Could not get directions, falling back to predefined distances');
      return null;
    }

    return {
      distanceKm: directions.distanceKm,
      durationMinutes: directions.durationMinutes,
      fromCoords: {
        lat: fromCoords.lat,
        lng: fromCoords.lng,
        placeName: fromCoords.placeName
      },
      toCoords: {
        lat: toCoords.lat,
        lng: toCoords.lng,
        placeName: toCoords.placeName
      }
    };
  } catch (error) {
    console.error('Mapbox transfer calculation error:', error);
    return null;
  }
}

/**
 * Tool Definitions for Claude
 */
export const aiToolDefinitions = [
  {
    name: "searchEmptyLegs",
    description: "Search for empty leg flights (discounted repositioning flights). Use this when users ask about empty legs, cheap flights, or mention specific departure/arrival cities, IATA codes, countries, or dates. IMPORTANT: Do NOT use this tool if you already showed empty leg results in this conversation - just reference the options already displayed above.",
    input_schema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Departure city, IATA code, or country (e.g., 'Zurich', 'ZRH', 'Switzerland', 'Dubai')"
        },
        to: {
          type: "string",
          description: "Arrival city, IATA code, or country (e.g., 'London', 'LHR', 'UK', 'France')"
        },
        location: {
          type: "string",
          description: "Generic location when 'from' or 'to' is ambiguous - can be city, IATA code, or country"
        },
        country: {
          type: "string",
          description: "Country name to filter by (e.g., 'Germany', 'France', 'UAE')"
        },
        date: {
          type: "string",
          description: "Preferred departure date in YYYY-MM-DD format"
        },
        dateFrom: {
          type: "string",
          description: "Start of date range in YYYY-MM-DD format"
        },
        dateTo: {
          type: "string",
          description: "End of date range in YYYY-MM-DD format"
        },
        passengers: {
          type: "number",
          description: "Number of passengers"
        }
      },
      required: []
    }
  },
  {
    name: "searchPrivateJets",
    description: "Search for private jet charters. Use when users ask about private jets, jet charter, or aircraft. IMPORTANT: Do NOT use this tool if you already showed jet results in this conversation - when user provides booking details (date, time, passengers), just confirm their details and reference the options already displayed above. Never search twice for the same route.",
    input_schema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Departure city or airport"
        },
        to: {
          type: "string",
          description: "Destination city or airport"
        },
        location: {
          type: "string",
          description: "Generic location for jets available in that area"
        },
        passengers: {
          type: "number",
          description: "Number of passengers"
        },
        category: {
          type: "string",
          description: "Jet category: light, midsize, heavy, ultra-long-range"
        }
      },
      required: []
    }
  },
  {
    name: "searchHelicopters",
    description: "Search for helicopter charters. Use when users ask about helicopters, heli transfers, or rotorcraft. IMPORTANT: Do NOT use this tool if you already showed helicopter results in this conversation - just reference the options already displayed above.",
    input_schema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Departure location"
        },
        to: {
          type: "string",
          description: "Destination location"
        },
        location: {
          type: "string",
          description: "Generic location for helicopters available in that area"
        },
        passengers: {
          type: "number",
          description: "Number of passengers"
        }
      },
      required: []
    }
  },
  {
    name: "searchYachtsAndAdventures",
    description: "Search for yacht charters and adventure packages. Use when users ask about yachts, boats, sailing, or adventure experiences.",
    input_schema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "Location or region (e.g., 'Mediterranean', 'Greek Islands', 'Caribbean')"
        },
        type: {
          type: "string",
          description: "Type: 'yacht', 'adventure', or 'both'"
        },
        guests: {
          type: "number",
          description: "Number of guests"
        }
      },
      required: []
    }
  },
  {
    name: "searchLuxuryCars",
    description: "Search for luxury sports cars and exotic car rentals (Ferrari, Lamborghini, Porsche, etc.). Use ONLY when users want to rent a sports car, supercar, or exotic vehicle for personal driving. These are for 1-4 passengers maximum. Do NOT use for airport transfers or taxi services - use searchAirportTransfer instead.",
    input_schema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City or location for car rental"
        },
        passengers: {
          type: "number",
          description: "Number of passengers (max 4 for sports cars)"
        },
        category: {
          type: "string",
          description: "Car category: supercar, sports, convertible, luxury-sedan"
        }
      },
      required: []
    }
  },
  {
    name: "searchAirportTransfer",
    description: "Search for airport transfers and taxi services. IMPORTANT: If the user only mentions the airport but NOT the final destination (hotel, address, city center), you MUST ask them for their destination BEFORE calling this tool. Once you have both pickup (airport) and destination, call this tool to get available vehicles with estimated pricing based on distance.",
    input_schema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Pickup location - usually an airport (e.g., 'Milan Malpensa', 'MXP', 'Zurich Airport')"
        },
        to: {
          type: "string",
          description: "Final destination - hotel name, address, or landmark (e.g., 'Park Hyatt Milan', 'Four Seasons Geneva', 'city center')"
        },
        toCity: {
          type: "string",
          description: "City of destination (e.g., 'Milan', 'Geneva', 'Zurich')"
        },
        passengers: {
          type: "number",
          description: "Total number of passengers - important for vehicle selection"
        },
        vehicles: {
          type: "number",
          description: "Number of vehicles needed (e.g., 2 for 8 passengers)"
        },
        date: {
          type: "string",
          description: "Pickup date in YYYY-MM-DD format"
        },
        time: {
          type: "string",
          description: "Pickup time in HH:MM format"
        },
        flightNumber: {
          type: "string",
          description: "Flight number for airport pickups (for flight tracking)"
        }
      },
      required: ["from", "to", "passengers"]
    }
  },
  {
    name: "calculateFlightPrice",
    description: "Calculate estimated flight price for a jet or helicopter based on hourly rate and flight duration. Use when users ask about pricing, cost estimates, or 'how much would it cost' for a specific route with a jet from the search results.",
    input_schema: {
      type: "object",
      properties: {
        aircraftId: {
          type: "string",
          description: "The ID of the aircraft from search results"
        },
        aircraftName: {
          type: "string",
          description: "Name of the aircraft (e.g., 'Gulfstream G650', 'Cessna Citation')"
        },
        hourlyRate: {
          type: "number",
          description: "Hourly rate in EUR (from search results)"
        },
        fromCity: {
          type: "string",
          description: "Departure city"
        },
        toCity: {
          type: "string",
          description: "Arrival city"
        },
        flightHours: {
          type: "number",
          description: "Estimated flight duration in hours (if known)"
        }
      },
      required: ["hourlyRate"]
    }
  },
  {
    name: "lookupLuxuryItem",
    description: "Look up estimated market price for luxury items like fine wines, champagne, caviar, cigars, or other premium products. Use when a user requests a specific luxury item to be added to their booking. Returns estimated price and availability status. Note: Availability must be confirmed by our team.",
    input_schema: {
      type: "object",
      properties: {
        itemName: {
          type: "string",
          description: "Full name of the luxury item (e.g., 'Chateau Mouton Rothschild 1967', 'Dom Perignon 2012', 'Cohiba Behike 56')"
        },
        category: {
          type: "string",
          enum: ["wine", "champagne", "spirits", "caviar", "cigars", "flowers", "other"],
          description: "Category of the luxury item"
        },
        quantity: {
          type: "number",
          description: "Quantity requested (e.g., 1 bottle, 2 boxes)"
        }
      },
      required: ["itemName", "category"]
    }
  },
  {
    name: "addCustomExtra",
    description: "Add a custom extra or special request to the user's cart. Use when user wants to add additional services like specific wines, champagne, flowers, special catering requests, music, decorations, etc. This creates a custom request item that will be confirmed by the team.",
    input_schema: {
      type: "object",
      properties: {
        itemName: {
          type: "string",
          description: "Name of the custom extra (e.g., 'Chateau Mouton Rothschild 1967', 'Fresh roses bouquet', 'Birthday cake')"
        },
        category: {
          type: "string",
          enum: ["wine", "champagne", "spirits", "caviar", "cigars", "flowers", "cake", "decorations", "music", "photography", "catering", "other"],
          description: "Category of the extra"
        },
        estimatedPrice: {
          type: "number",
          description: "Estimated price in EUR (if known from lookupLuxuryItem or general knowledge)"
        },
        quantity: {
          type: "number",
          description: "Quantity (default 1)"
        },
        notes: {
          type: "string",
          description: "Special instructions or notes for this item"
        },
        linkedToCartItem: {
          type: "string",
          description: "Optional: ID of the cart item this extra is linked to (e.g., specific jet or yacht booking)"
        }
      },
      required: ["itemName", "category"]
    }
  },
  {
    name: "lookupPlaceAddress",
    description: "Look up the address and location details of a place such as a restaurant, hotel, landmark, business, or any point of interest. Use this when users ask 'where is [place]?', 'what's the address of [place]?', 'can you find [restaurant/hotel]?', or need location information for a specific venue. Returns the full address, coordinates, and place name.",
    input_schema: {
      type: "object",
      properties: {
        placeName: {
          type: "string",
          description: "Name of the place to look up (e.g., 'Nobu London', 'Four Seasons Hotel Milan', 'Eiffel Tower')"
        },
        city: {
          type: "string",
          description: "City or area to narrow down the search (e.g., 'Paris', 'Dubai', 'New York'). Helps find the correct location if the place name is common."
        }
      },
      required: ["placeName"]
    }
  },
  {
    name: "addToCart",
    description: "Add a service booking to the user's cart. Use this when user says 'add to cart', 'book it', 'I'll take it', or confirms they want to proceed with a specific aircraft, yacht, or service. IMPORTANT: Always include hourlyRate for jets/helicopters to calculate estimated total. After adding to cart, ask about additional services like ground transport.",
    input_schema: {
      type: "object",
      properties: {
        serviceType: {
          type: "string",
          enum: ["jet", "helicopter", "yacht", "car", "empty_leg", "adventure", "transfer"],
          description: "Type of service being booked"
        },
        name: {
          type: "string",
          description: "Name of the aircraft/vehicle/service (e.g., 'Challenger 350', 'Mercedes S-Class')"
        },
        from: {
          type: "string",
          description: "Departure location/airport with IATA code (e.g., 'Dublin (DUB)')"
        },
        to: {
          type: "string",
          description: "Destination location/airport with IATA code (e.g., 'Amsterdam (AMS)')"
        },
        date: {
          type: "string",
          description: "Travel date"
        },
        time: {
          type: "string",
          description: "Departure time"
        },
        passengers: {
          type: "number",
          description: "Number of passengers"
        },
        hourlyRate: {
          type: "number",
          description: "Hourly rate in EUR from the aircraft details - REQUIRED for jets/helicopters to calculate total"
        },
        price: {
          type: "number",
          description: "Fixed price in EUR (for empty legs, transfers)"
        },
        catering: {
          type: "string",
          description: "Catering preference (complimentary/premium/custom)"
        },
        notes: {
          type: "string",
          description: "Additional notes or special requests"
        }
      },
      required: ["serviceType", "name"]
    }
  }
];

/**
 * Execute a tool call from Claude
 * @param {string} toolName - Name of the tool to execute
 * @param {object} input - Input parameters for the tool
 * @returns {Promise<object>} - Tool execution result
 */
export async function executeTool(toolName, input) {
  console.log(`🔧 Executing tool: ${toolName}`, input);

  try {
    switch (toolName) {
      case 'searchEmptyLegs':
        return await searchEmptyLegs(input);

      case 'searchPrivateJets':
        return await searchPrivateJets(input);

      case 'searchHelicopters':
        return await searchHelicopters(input);

      case 'searchYachtsAndAdventures':
        return await searchYachtsAndAdventures(input);

      case 'searchLuxuryCars':
        return await searchLuxuryCars(input);

      case 'searchAirportTransfer':
        return await searchAirportTransfer(input);

      case 'calculateFlightPrice':
        return calculateFlightPrice(input);

      case 'lookupLuxuryItem':
        return await lookupLuxuryItem(input);

      case 'lookupPlaceAddress':
        return await lookupPlaceAddress(input);

      case 'addCustomExtra':
        return addCustomExtra(input);

      case 'addToCart':
        return addToCart(input);

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`
        };
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Sanctioned countries - no flights allowed
const SANCTIONED_COUNTRIES = [
  'russia', 'russian federation', 'belarus', 'iran', 'north korea', 'dprk',
  'syria', 'cuba', 'venezuela', 'crimea', 'donetsk', 'luhansk'
];

// Countries with limited/no coverage
const LIMITED_COVERAGE_COUNTRIES = [
  'china', 'chinese', 'india', 'pakistan', 'bangladesh', 'myanmar', 'burma',
  'afghanistan', 'iraq', 'yemen', 'libya', 'somalia', 'sudan', 'south sudan'
];

function checkSanctionedLocation(location) {
  if (!location) return null;
  const loc = location.toLowerCase().trim();

  for (const sanctioned of SANCTIONED_COUNTRIES) {
    if (loc.includes(sanctioned)) {
      return {
        type: 'sanctioned',
        message: `Due to international sanctions, we cannot offer flights to/from ${location}. This includes Russia, Belarus, Iran, North Korea, Syria, and other sanctioned territories.`
      };
    }
  }

  for (const limited of LIMITED_COVERAGE_COUNTRIES) {
    if (loc.includes(limited)) {
      return {
        type: 'limited',
        message: `We currently have limited or no empty leg coverage for ${location}. Our network primarily covers Europe, North America, and the Middle East. Please contact us directly for custom charter options to this region.`
      };
    }
  }

  return null;
}

/**
 * Search for empty leg flights
 * If no results found, returns alternatives and suggestions
 */
export async function searchEmptyLegs(params) {
  console.log('🔍 searchEmptyLegs called with:', params);

  // Check for sanctioned/limited locations
  const fromCheck = checkSanctionedLocation(params.from);
  const toCheck = checkSanctionedLocation(params.to);
  const locationCheck = checkSanctionedLocation(params.location);
  const countryCheck = checkSanctionedLocation(params.country);

  const restriction = fromCheck || toCheck || locationCheck || countryCheck;
  if (restriction) {
    console.log('⚠️ Location restriction:', restriction);
    return {
      success: true,
      results: [],
      total: 0,
      params,
      restriction: restriction,
      alternatives: {
        canCharterJet: true,
        message: `While empty legs are not available for this region, we can arrange a private jet charter. Would you like me to search for available aircraft?`
      }
    };
  }

  const results = await UnifiedSearchService.searchAll({
    q: params.location || params.from || params.to || params.country,
    fromLocation: params.from,
    toLocation: params.to,
    country: params.country,
    dateFrom: params.dateFrom || params.date,
    dateTo: params.dateTo,
    passengers: params.passengers,
    serviceTypes: { emptyLegs: true }
  });

  console.log('🔍 searchEmptyLegs results:', results.emptyLegs?.length || 0, 'empty legs found');

  const emptyLegs = results.emptyLegs || [];

  // If no results found, fetch alternatives
  if (emptyLegs.length === 0) {
    console.log('🔍 No empty legs found, fetching alternatives...');

    // Fetch ALL empty legs to find nearby alternatives
    const allResults = await UnifiedSearchService.searchAll({
      serviceTypes: { emptyLegs: true }
    });

    const allEmptyLegs = allResults.emptyLegs || [];

    // Find nearby/related routes
    const searchTerms = [params.from, params.to, params.location, params.country]
      .filter(Boolean)
      .map(s => s.toLowerCase());

    // Get region-based alternatives (same country or nearby)
    const regionMap = {
      // Asia
      'tokyo': ['japan', 'osaka', 'nagoya', 'fukuoka', 'sapporo', 'nrt', 'hnd', 'kix', 'ngo'],
      'kyoto': ['japan', 'osaka', 'kix', 'itm'],
      'osaka': ['japan', 'tokyo', 'kyoto', 'kix', 'itm', 'nrt'],
      'japan': ['tokyo', 'osaka', 'kyoto', 'nagoya', 'fukuoka', 'nrt', 'hnd', 'kix'],
      'singapore': ['asia', 'sin', 'kuala lumpur', 'bangkok', 'hong kong'],
      'hong kong': ['asia', 'hkg', 'singapore', 'taipei', 'shanghai'],
      'dubai': ['uae', 'abu dhabi', 'dxb', 'auh', 'middle east', 'doha', 'riyadh'],
      'abu dhabi': ['uae', 'dubai', 'auh', 'dxb', 'middle east'],
      // Europe
      'london': ['uk', 'europe', 'lhr', 'lgw', 'ltn', 'stn', 'paris', 'amsterdam'],
      'paris': ['france', 'europe', 'cdg', 'ory', 'london', 'geneva', 'nice'],
      'zurich': ['switzerland', 'europe', 'zrh', 'geneva', 'milan', 'munich'],
      'geneva': ['switzerland', 'europe', 'gva', 'zurich', 'lyon', 'milan'],
      'nice': ['france', 'europe', 'nce', 'monaco', 'cannes', 'milan'],
      'milan': ['italy', 'europe', 'mxp', 'lin', 'rome', 'nice', 'zurich'],
      // US
      'new york': ['usa', 'us', 'jfk', 'ewr', 'lga', 'teterboro', 'northeast'],
      'los angeles': ['usa', 'us', 'lax', 'vny', 'sna', 'california', 'west coast'],
      'miami': ['usa', 'us', 'mia', 'opa', 'fll', 'florida', 'southeast'],
    };

    // Find related search terms for the region
    let relatedTerms = [];
    for (const term of searchTerms) {
      for (const [key, related] of Object.entries(regionMap)) {
        if (term.includes(key) || key.includes(term)) {
          relatedTerms.push(...related);
        }
      }
    }
    relatedTerms = [...new Set(relatedTerms)]; // Remove duplicates

    // Find alternatives from the same region
    const alternatives = allEmptyLegs.filter(leg => {
      const legText = [
        leg.from_city, leg.to_city, leg.from, leg.to,
        leg.from_iata, leg.to_iata, leg.from_country, leg.to_country
      ].filter(Boolean).join(' ').toLowerCase();

      return relatedTerms.some(term => legText.includes(term));
    }).slice(0, 5); // Limit to 5 alternatives

    // Build helpful response
    const fromCity = params.from || params.location || 'your departure';
    const toCity = params.to || 'your destination';

    return {
      success: true,
      results: [],
      total: 0,
      params,
      noResults: true,
      alternatives: {
        nearbyRoutes: alternatives,
        nearbyRoutesCount: alternatives.length,
        canCharterJet: true,
        suggestions: [
          alternatives.length > 0
            ? `I found ${alternatives.length} empty leg${alternatives.length > 1 ? 's' : ''} in nearby regions that might work for you.`
            : null,
          `I can search for private jet charters from ${fromCity} to ${toCity} - these offer guaranteed availability and flexible scheduling.`,
          `Would you like me to check helicopter options for shorter distances?`,
          `I can also set up an alert to notify you when empty legs become available on this route.`
        ].filter(Boolean),
        message: alternatives.length > 0
          ? `No empty legs found for ${fromCity} → ${toCity}, but I found ${alternatives.length} alternative route${alternatives.length > 1 ? 's' : ''} nearby. For your exact route, I can arrange a private jet charter.`
          : `No empty legs currently available for ${fromCity} → ${toCity}. Empty legs are repositioning flights with limited availability. For this route, I recommend chartering a private jet for guaranteed availability.`
      },
      // Include all available empty legs for reference (limited)
      allAvailable: allEmptyLegs.slice(0, 10),
      allAvailableCount: allEmptyLegs.length
    };
  }

  return {
    success: true,
    results: emptyLegs,
    total: emptyLegs.length,
    params
  };
}

/**
 * Search for private jets
 */
export async function searchPrivateJets(params) {
  const results = await UnifiedSearchService.searchAll({
    q: params.location,
    fromLocation: params.from,
    location: params.to,
    passengers: params.passengers,
    serviceTypes: { jets: true }
  });

  return {
    success: true,
    results: results.aircraft || [],
    total: results.aircraft?.length || 0,
    params
  };
}

/**
 * Search for helicopters
 */
export async function searchHelicopters(params) {
  const results = await UnifiedSearchService.searchAll({
    q: params.location,
    fromLocation: params.from,
    location: params.to,
    passengers: params.passengers,
    serviceTypes: { helicopters: true }
  });

  return {
    success: true,
    results: results.helicopters || [],
    total: results.helicopters?.length || 0,
    params
  };
}

/**
 * Search for yachts and adventure packages
 */
export async function searchYachtsAndAdventures(params) {
  const serviceTypeObj = {};
  if (params.type === 'yacht' || params.type === 'both' || !params.type) {
    serviceTypeObj.yachts = true;
  }
  if (params.type === 'adventure' || params.type === 'both' || !params.type) {
    serviceTypeObj.adventures = true;
  }

  const results = await UnifiedSearchService.searchAll({
    q: params.location,
    location: params.location,
    passengers: params.guests,
    serviceTypes: serviceTypeObj
  });

  return {
    success: true,
    results: {
      yachts: results.yachts || [],
      adventures: results.adventures || []
    },
    total: (results.yachts?.length || 0) + (results.adventures?.length || 0),
    params
  };
}

/**
 * Search for luxury sports cars (supercars, exotic rentals)
 * For personal driving - NOT for airport transfers
 */
export async function searchLuxuryCars(params) {
  const results = await UnifiedSearchService.searchAll({
    q: params.location,
    passengers: Math.min(params.passengers || 2, 4), // Max 4 for sports cars
    serviceTypes: { cars: true }
  });

  // Filter to only include sports/exotic cars (exclude vans, sedans for transfers)
  const sportsCarKeywords = ['ferrari', 'lamborghini', 'porsche', 'mclaren', 'aston martin', 'bentley', 'rolls', 'maserati', 'bugatti', 'mercedes-amg', 'bmw m', 'audi r8'];
  const filteredCars = (results.luxuryCars || []).filter(car => {
    const name = `${car.brand || ''} ${car.model || ''} ${car.name || ''}`.toLowerCase();
    return sportsCarKeywords.some(keyword => name.includes(keyword));
  });

  return {
    success: true,
    results: filteredCars,
    total: filteredCars.length,
    params,
    note: 'Luxury sports cars for personal driving (1-4 passengers). For airport transfers or larger groups, use taxi/transfer service.'
  };
}

/**
 * Airfield/Airport pickup fees (Sonderanfahrt)
 */
const AIRPORT_PICKUP_FEES = {
  // Major airports with special access fees
  'mxp': { name: 'Milan Malpensa', fee: 45, currency: 'EUR' },
  'linate': { name: 'Milan Linate', fee: 35, currency: 'EUR' },
  'fco': { name: 'Rome Fiumicino', fee: 50, currency: 'EUR' },
  'cia': { name: 'Rome Ciampino', fee: 40, currency: 'EUR' },
  'zrh': { name: 'Zurich Airport', fee: 40, currency: 'CHF' },
  'gva': { name: 'Geneva Airport', fee: 45, currency: 'CHF' },
  'lhr': { name: 'London Heathrow', fee: 55, currency: 'GBP' },
  'lgw': { name: 'London Gatwick', fee: 45, currency: 'GBP' },
  'cdg': { name: 'Paris CDG', fee: 50, currency: 'EUR' },
  'ory': { name: 'Paris Orly', fee: 40, currency: 'EUR' },
  'dxb': { name: 'Dubai International', fee: 60, currency: 'AED' },
  'muc': { name: 'Munich Airport', fee: 45, currency: 'EUR' },
  'fra': { name: 'Frankfurt Airport', fee: 45, currency: 'EUR' },
  'vie': { name: 'Vienna Airport', fee: 40, currency: 'EUR' },
  'nce': { name: 'Nice Airport', fee: 50, currency: 'EUR' },
  'bcn': { name: 'Barcelona Airport', fee: 45, currency: 'EUR' },
  'mad': { name: 'Madrid Airport', fee: 45, currency: 'EUR' },
  // Default for unlisted airports
  'default': { name: 'Airport', fee: 40, currency: 'EUR' }
};

/**
 * Check if location is an airport and get pickup fee
 */
function getAirportPickupFee(location) {
  if (!location) return null;

  const loc = location.toLowerCase();

  // Check by IATA code
  for (const [code, info] of Object.entries(AIRPORT_PICKUP_FEES)) {
    if (code !== 'default' && loc.includes(code)) {
      return { ...info, code };
    }
  }

  // Check by airport name keywords
  const airportKeywords = ['airport', 'aeroporto', 'aeroport', 'flughafen', 'malpensa', 'linate', 'fiumicino', 'heathrow', 'gatwick', 'schiphol'];
  if (airportKeywords.some(kw => loc.includes(kw))) {
    // Try to match specific airport
    if (loc.includes('malpensa')) return { ...AIRPORT_PICKUP_FEES['mxp'], code: 'mxp' };
    if (loc.includes('linate')) return { ...AIRPORT_PICKUP_FEES['linate'], code: 'linate' };
    if (loc.includes('fiumicino')) return { ...AIRPORT_PICKUP_FEES['fco'], code: 'fco' };
    if (loc.includes('heathrow')) return { ...AIRPORT_PICKUP_FEES['lhr'], code: 'lhr' };
    if (loc.includes('gatwick')) return { ...AIRPORT_PICKUP_FEES['lgw'], code: 'lgw' };
    if (loc.includes('zurich') || loc.includes('zürich')) return { ...AIRPORT_PICKUP_FEES['zrh'], code: 'zrh' };
    if (loc.includes('geneva') || loc.includes('genf') || loc.includes('genève')) return { ...AIRPORT_PICKUP_FEES['gva'], code: 'gva' };

    // Default airport fee
    return { ...AIRPORT_PICKUP_FEES['default'], code: 'default' };
  }

  return null;
}

/**
 * Known distances from airports to destinations (in km)
 * Format: 'airport-destination': distanceKm
 */
const TRANSFER_DISTANCES = {
  // Milan Malpensa (MXP) - ~50km from city center
  'mxp-milan': 50,
  'mxp-milan city': 50,
  'mxp-park hyatt milan': 52,
  'mxp-four seasons milan': 51,
  'mxp-armani hotel': 50,
  'mxp-mandarin oriental milan': 51,
  'mxp-bulgari milan': 50,
  'mxp-excelsior gallia': 48,
  'mxp-como': 75,
  'mxp-bergamo': 85,
  'malpensa-milan': 50,

  // Milan Linate (LIN) - ~8km from city center
  'lin-milan': 8,
  'linate-milan': 8,
  'lin-park hyatt milan': 9,
  'linate-park hyatt': 9,

  // Zurich (ZRH) - ~12km from city center
  'zrh-zurich': 12,
  'zrh-baur au lac': 14,
  'zrh-dolder grand': 16,
  'zrh-park hyatt zurich': 13,
  'zrh-widder hotel': 14,
  'zrh-savoy zurich': 13,

  // Geneva (GVA) - ~5km from city center
  'gva-geneva': 5,
  'gva-four seasons geneva': 6,
  'gva-hotel & spa': 7,
  'gva-beau rivage': 6,
  'gva-mandarin oriental geneva': 5,

  // London Heathrow (LHR) - ~25km from central London
  'lhr-london': 25,
  'lhr-mayfair': 27,
  'lhr-claridges': 28,
  'lhr-the savoy': 30,
  'lhr-four seasons london': 28,
  'lhr-the dorchester': 27,

  // Paris CDG - ~30km from city center
  'cdg-paris': 30,
  'cdg-ritz paris': 32,
  'cdg-four seasons george v': 33,
  'cdg-plaza athenee': 33,
  'cdg-le bristol': 32,
  'cdg-shangri-la paris': 35,

  // Dubai (DXB) - varies greatly
  'dxb-dubai': 15,
  'dxb-burj al arab': 35,
  'dxb-atlantis': 45,
  'dxb-four seasons dubai': 25,
  'dxb-armani dubai': 20,

  // Nice (NCE) - ~7km from city center
  'nce-nice': 7,
  'nce-monaco': 30,
  'nce-cannes': 35,
  'nce-hotel du cap': 25,
  'nce-hotel negresco': 8,
};

/**
 * Known luxury hotels database with ratings
 */
const LUXURY_HOTELS = {
  'park hyatt milan': {
    name: 'Park Hyatt Milan',
    city: 'Milan',
    address: 'Via Tommaso Grossi 1, 20121 Milan',
    rating: 4.8,
    stars: 5,
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    amenities: ['Spa', 'Fine Dining', 'Concierge', 'Valet Parking'],
    priceRange: '€€€€'
  },
  'four seasons milan': {
    name: 'Four Seasons Hotel Milan',
    city: 'Milan',
    address: 'Via Gesù 6/8, 20121 Milan',
    rating: 4.9,
    stars: 5,
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
    amenities: ['Spa', 'Pool', 'Michelin Restaurant', 'Garden'],
    priceRange: '€€€€€'
  },
  'armani hotel milan': {
    name: 'Armani Hotel Milano',
    city: 'Milan',
    address: 'Via Manzoni 31, 20121 Milan',
    rating: 4.7,
    stars: 5,
    category: 'Design Luxury',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
    amenities: ['Spa', 'Armani Restaurant', 'Rooftop Bar'],
    priceRange: '€€€€'
  },
  'mandarin oriental milan': {
    name: 'Mandarin Oriental Milan',
    city: 'Milan',
    address: 'Via Andegari 9, 20121 Milan',
    rating: 4.8,
    stars: 5,
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400',
    amenities: ['Spa', 'Fine Dining', 'Garden', 'Gym'],
    priceRange: '€€€€€'
  },
  'baur au lac': {
    name: 'Baur au Lac',
    city: 'Zurich',
    address: 'Talstrasse 1, 8001 Zurich',
    rating: 4.9,
    stars: 5,
    category: 'Historic Luxury',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
    amenities: ['Lakeside', 'Spa', 'Fine Dining', 'Private Park'],
    priceRange: '€€€€€'
  },
  'dolder grand': {
    name: 'The Dolder Grand',
    city: 'Zurich',
    address: 'Kurhausstrasse 65, 8032 Zurich',
    rating: 4.8,
    stars: 5,
    category: 'Luxury Spa Resort',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
    amenities: ['Spa', 'Golf', 'Art Collection', 'Mountain Views'],
    priceRange: '€€€€€'
  },
  'four seasons geneva': {
    name: 'Four Seasons Hotel des Bergues Geneva',
    city: 'Geneva',
    address: 'Quai des Bergues 33, 1201 Geneva',
    rating: 4.8,
    stars: 5,
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
    amenities: ['Lake View', 'Spa', 'Fine Dining', 'Concierge'],
    priceRange: '€€€€€'
  },
  'claridges': {
    name: "Claridge's",
    city: 'London',
    address: 'Brook Street, Mayfair, London W1K 4HR',
    rating: 4.9,
    stars: 5,
    category: 'Historic Luxury',
    image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400',
    amenities: ['Art Deco', 'Spa', 'Gordon Ramsay Restaurant'],
    priceRange: '€€€€€'
  },
  'ritz paris': {
    name: 'Ritz Paris',
    city: 'Paris',
    address: '15 Place Vendôme, 75001 Paris',
    rating: 4.9,
    stars: 5,
    category: 'Palace',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
    amenities: ['Spa', 'Michelin Restaurant', 'Historic', 'Bar Hemingway'],
    priceRange: '€€€€€'
  },
  'burj al arab': {
    name: 'Burj Al Arab Jumeirah',
    city: 'Dubai',
    address: 'Jumeirah Street, Dubai',
    rating: 4.9,
    stars: 7,
    category: 'Ultra Luxury',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
    amenities: ['Private Beach', 'Helipad', 'Butler Service', 'Spa'],
    priceRange: '€€€€€€'
  }
};

/**
 * City center/district distances from airports (in km)
 * Used to estimate distance for any address within these areas
 */
const CITY_DISTRICTS = {
  // Milan districts from Malpensa
  'mxp': {
    'centro': 50, 'city center': 50, 'duomo': 51, 'brera': 50, 'navigli': 52,
    'porta nuova': 49, 'garibaldi': 49, 'centrale': 48, 'cadorna': 50,
    'san babila': 51, 'montenapoleone': 51, 'quadrilatero': 51,
    'porta romana': 53, 'isola': 48, 'sempione': 49, 'fiera': 45,
    'default': 50
  },
  // Milan from Linate
  'lin': {
    'centro': 8, 'city center': 8, 'duomo': 9, 'brera': 10, 'navigli': 7,
    'porta nuova': 9, 'garibaldi': 10, 'centrale': 8, 'cadorna': 10,
    'default': 8
  },
  // Zurich districts
  'zrh': {
    'centro': 12, 'city center': 12, 'altstadt': 13, 'bahnhofstrasse': 13,
    'niederdorf': 13, 'seefeld': 14, 'enge': 14, 'wiedikon': 15,
    'oerlikon': 8, 'kloten': 3, 'winterthur': 25, 'baden': 20,
    'default': 12
  },
  // Geneva districts
  'gva': {
    'centro': 5, 'city center': 5, 'old town': 6, 'vieille ville': 6,
    'nations': 4, 'carouge': 8, 'eaux-vives': 7, 'champel': 8,
    'default': 5
  },
  // London from Heathrow
  'lhr': {
    'centro': 25, 'city center': 25, 'mayfair': 27, 'kensington': 20,
    'chelsea': 22, 'westminster': 26, 'soho': 28, 'covent garden': 29,
    'city of london': 32, 'canary wharf': 38, 'knightsbridge': 21,
    'default': 25
  },
  // Paris from CDG
  'cdg': {
    'centro': 30, 'city center': 30, 'champs elysees': 32, 'opera': 30,
    'marais': 28, 'saint germain': 32, 'montmartre': 27, 'bastille': 29,
    'la defense': 35, 'louvre': 31, 'eiffel': 34,
    'default': 30
  },
  // Dubai
  'dxb': {
    'centro': 15, 'city center': 15, 'downtown': 15, 'burj khalifa': 16,
    'marina': 35, 'palm jumeirah': 40, 'jumeirah': 25, 'deira': 8,
    'business bay': 17, 'difc': 14,
    'default': 20
  },
  // Nice
  'nce': {
    'centro': 7, 'city center': 7, 'promenade': 8, 'old town': 8,
    'port': 9, 'cimiez': 10, 'monaco': 30, 'cannes': 35, 'antibes': 20,
    'default': 10
  }
};

/**
 * Get estimated distance between airport and destination
 * Works with hotels, addresses, districts, or any location
 */
function getTransferDistance(from, to) {
  if (!from || !to) return null;

  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  // Extract airport code
  let airportCode = null;
  if (fromLower.includes('malpensa') || fromLower.includes('mxp')) airportCode = 'mxp';
  else if (fromLower.includes('linate') || fromLower.includes('lin')) airportCode = 'lin';
  else if (fromLower.includes('zurich') || fromLower.includes('zrh') || fromLower.includes('zürich')) airportCode = 'zrh';
  else if (fromLower.includes('geneva') || fromLower.includes('gva') || fromLower.includes('genf')) airportCode = 'gva';
  else if (fromLower.includes('heathrow') || fromLower.includes('lhr')) airportCode = 'lhr';
  else if (fromLower.includes('cdg') || fromLower.includes('charles de gaulle')) airportCode = 'cdg';
  else if (fromLower.includes('dubai') || fromLower.includes('dxb')) airportCode = 'dxb';
  else if (fromLower.includes('nice') || fromLower.includes('nce')) airportCode = 'nce';

  if (!airportCode) return null;

  // 1. Try to find exact match in predefined routes (hotels, landmarks)
  for (const [route, distance] of Object.entries(TRANSFER_DISTANCES)) {
    if (route.startsWith(airportCode) && toLower.includes(route.split('-')[1])) {
      return distance;
    }
  }

  // 2. Try partial hotel/landmark name match
  for (const [route, distance] of Object.entries(TRANSFER_DISTANCES)) {
    const dest = route.split('-')[1];
    if (route.startsWith(airportCode) && (toLower.includes(dest) || dest.includes(toLower.split(' ')[0]))) {
      return distance;
    }
  }

  // 3. Try to match city district/area for any address
  const cityDistricts = CITY_DISTRICTS[airportCode];
  if (cityDistricts) {
    for (const [district, distance] of Object.entries(cityDistricts)) {
      if (district !== 'default' && toLower.includes(district)) {
        return distance;
      }
    }
    // If address contains a street name or number, use default city center distance
    // Addresses typically have numbers, "via", "strasse", "street", "rue", etc.
    const addressIndicators = ['via ', 'str.', 'strasse', 'street', 'rue ', 'avenue', 'blvd', 'road', 'lane', 'piazza', 'plaza', 'platz'];
    const hasAddressFormat = /\d+/.test(toLower) || addressIndicators.some(ind => toLower.includes(ind));
    if (hasAddressFormat) {
      return cityDistricts['default'];
    }
  }

  // 4. Default distances if nothing else matches
  const defaultDistances = {
    'mxp': 50, 'lin': 8, 'zrh': 12, 'gva': 5, 'lhr': 25, 'cdg': 30, 'dxb': 20, 'nce': 10
  };

  return defaultDistances[airportCode] || 30;
}

/**
 * Get hotel info if destination is a known hotel
 */
function getHotelInfo(destination) {
  if (!destination) return null;

  const destLower = destination.toLowerCase();

  for (const [key, hotel] of Object.entries(LUXURY_HOTELS)) {
    if (destLower.includes(key) || key.includes(destLower.split(' ').slice(0, 2).join(' '))) {
      return hotel;
    }
  }

  return null;
}

/**
 * Calculate transfer price based on distance
 * Base rate: €2.50/km for luxury transfer
 * Minimum charge: €45
 */
function calculateTransferPrice(distanceKm, vehiclesNeeded = 1) {
  const ratePerKm = 2.50; // EUR per km
  const minimumCharge = 45; // EUR minimum per vehicle
  const basePrice = Math.max(distanceKm * ratePerKm, minimumCharge);

  return {
    distanceKm,
    ratePerKm,
    pricePerVehicle: Math.round(basePrice),
    totalPrice: Math.round(basePrice * vehiclesNeeded),
    vehiclesNeeded,
    isEstimate: true,
    note: 'Estimated price - final price may vary based on traffic, waiting time, and route'
  };
}

/**
 * Search for airport transfers and taxi services
 * For chauffeur-driven transport, airport pickups, larger groups
 * Uses Mapbox for accurate distance/duration calculation
 */
export async function searchAirportTransfer(params) {
  const { from, to, toCity, passengers, vehicles, date, time, flightNumber } = params;

  const results = await UnifiedSearchService.searchAll({
    q: from || to,
    fromLocation: from,
    location: to,
    passengers: passengers,
    serviceTypes: { taxi: true, groundTransport: true }
  });

  // Get available transfer vehicles
  let transferVehicles = results.groundTransport || results.taxi || [];

  // Calculate number of vehicles needed based on passenger count
  const passengersPerVehicle = 7; // Mercedes V-Class capacity
  const vehiclesNeeded = vehicles || Math.ceil((passengers || 1) / passengersPerVehicle);

  // Check for airport pickup fees
  const airportFee = getAirportPickupFee(from);

  // Try to get accurate distance from Mapbox first
  let distanceKm = null;
  let durationMinutes = null;
  let routeInfo = null;

  // Use Mapbox for real distance calculation
  const mapboxResult = await calculateTransferDistanceMapbox(from, to);

  if (mapboxResult) {
    distanceKm = mapboxResult.distanceKm;
    durationMinutes = mapboxResult.durationMinutes;
    routeInfo = {
      fromAddress: mapboxResult.fromCoords.placeName,
      toAddress: mapboxResult.toCoords.placeName,
      fromCoords: mapboxResult.fromCoords,
      toCoords: mapboxResult.toCoords,
      source: 'mapbox'
    };
    console.log(`📍 Mapbox route: ${distanceKm}km, ${durationMinutes}min`);
  } else {
    // Fallback to predefined distances
    distanceKm = getTransferDistance(from, to);
    durationMinutes = distanceKm ? Math.round(distanceKm * 1.2) : null; // Rough estimate
    routeInfo = { source: 'predefined' };
    console.log(`📍 Using predefined distance: ${distanceKm}km`);
  }

  const pricing = distanceKm ? calculateTransferPrice(distanceKm, vehiclesNeeded) : null;

  // Get hotel info if destination is a known hotel
  const hotelInfo = getHotelInfo(to);

  // Add pricing and fee info to each vehicle
  transferVehicles = transferVehicles.map(v => {
    const basePrice = pricing ? pricing.pricePerVehicle : (v.price || v.hourly_rate_eur || 80);
    const airportFeeAmount = airportFee ? airportFee.fee : 0;
    const totalPerVehicle = basePrice + airportFeeAmount;

    return {
      ...v,
      basePrice,
      airportPickupFee: airportFeeAmount,
      airportPickupFeeCurrency: airportFee?.currency || 'EUR',
      airportName: airportFee?.name || null,
      totalWithFee: totalPerVehicle,
      totalForAllVehicles: totalPerVehicle * vehiclesNeeded,
      isEstimate: true
    };
  });

  return {
    success: true,
    results: transferVehicles,
    total: transferVehicles.length,
    params: {
      ...params,
      vehiclesNeeded,
      passengersPerVehicle
    },
    route: {
      from: routeInfo?.fromAddress || from,
      to: routeInfo?.toAddress || to,
      toCity: toCity || hotelInfo?.city || null,
      distanceKm,
      durationMinutes,
      estimatedDuration: durationMinutes ? `${durationMinutes} min` : (distanceKm ? `~${Math.round(distanceKm * 1.2)} min` : null),
      coordinates: routeInfo?.fromCoords && routeInfo?.toCoords ? {
        from: routeInfo.fromCoords,
        to: routeInfo.toCoords
      } : null,
      source: routeInfo?.source || 'unknown'
    },
    pricing: pricing ? {
      ...pricing,
      airportFee: airportFee?.fee || 0,
      airportFeeCurrency: airportFee?.currency || 'EUR',
      totalWithFees: pricing.totalPrice + (airportFee?.fee || 0) * vehiclesNeeded,
      isEstimate: true
    } : null,
    destination: hotelInfo ? {
      type: 'hotel',
      ...hotelInfo
    } : {
      type: 'address',
      name: to,
      city: toCity || null
    },
    booking: {
      from,
      to,
      passengers,
      vehiclesNeeded,
      date,
      time,
      flightNumber
    },
    airportFee: airportFee ? {
      applies: true,
      airport: airportFee.name,
      feePerVehicle: airportFee.fee,
      currency: airportFee.currency,
      totalFee: airportFee.fee * vehiclesNeeded,
      note: 'Sonderanfahrt (special airport access fee) applies for airport pickups'
    } : {
      applies: false
    },
    // Ready-to-use cart item for adding to cart
    cartItem: {
      id: `transfer-${Date.now()}`,
      type: 'transfer',
      name: `Airport Transfer${vehiclesNeeded > 1 ? ` (${vehiclesNeeded} vehicles)` : ''}`,
      title: `${routeInfo?.fromAddress || from} → ${routeInfo?.toAddress || to}`,
      from: routeInfo?.fromAddress || from,
      to: routeInfo?.toAddress || to,
      passengers,
      vehiclesNeeded,
      date,
      time,
      flightNumber,
      distanceKm,
      durationMinutes,
      estimatedDuration: durationMinutes ? `${durationMinutes} min` : null,
      basePrice: pricing ? pricing.totalPrice : 80 * vehiclesNeeded,
      airportPickupFee: (airportFee?.fee || 0) * vehiclesNeeded,
      airportPickupFeeCurrency: airportFee?.currency || 'EUR',
      airportName: airportFee?.name || null,
      price: pricing ? pricing.totalPrice + (airportFee?.fee || 0) * vehiclesNeeded : 80 * vehiclesNeeded,
      totalWithFee: pricing ? pricing.totalPrice + (airportFee?.fee || 0) * vehiclesNeeded : 80 * vehiclesNeeded,
      isEstimate: true,
      destination: hotelInfo ? hotelInfo.name : (routeInfo?.toAddress || to),
      destinationType: hotelInfo ? 'hotel' : 'address',
      coordinates: routeInfo?.fromCoords && routeInfo?.toCoords ? {
        from: routeInfo.fromCoords,
        to: routeInfo.toCoords
      } : null
    },
    notes: [
      'All prices are estimates and may vary',
      vehiclesNeeded > 1 ? `${vehiclesNeeded} vehicles for ${passengers} passengers` : null,
      airportFee ? `Airport pickup fee: ${airportFee.currency} ${airportFee.fee}/vehicle` : null,
      distanceKm ? `Distance: ${distanceKm} km` : null,
      durationMinutes ? `Drive time: ~${durationMinutes} min` : null,
      'Final price confirmed upon booking'
    ].filter(Boolean)
  };
}

/**
 * Common flight distances and durations between major cities (in hours)
 * These are approximate direct flight times
 */
const FLIGHT_DURATIONS = {
  // Europe internal
  'zurich-london': 1.5,
  'zurich-paris': 1.2,
  'zurich-milan': 0.7,
  'zurich-geneva': 0.5,
  'zurich-munich': 0.7,
  'zurich-frankfurt': 0.8,
  'zurich-vienna': 1.2,
  'zurich-nice': 1.0,
  'zurich-rome': 1.3,
  'zurich-amsterdam': 1.3,
  'zurich-berlin': 1.3,
  'london-paris': 1.0,
  'london-milan': 1.8,
  'london-rome': 2.2,
  'london-nice': 1.8,
  'paris-nice': 1.2,
  'paris-milan': 1.2,
  'munich-rome': 1.3,
  'geneva-london': 1.5,
  'geneva-nice': 0.7,

  // Dublin routes
  'dublin-london': 1.25,
  'dublin-amsterdam': 1.5,
  'dublin-paris': 1.5,
  'dublin-zurich': 2.0,
  'dublin-nice': 2.25,
  'dublin-rome': 2.75,
  'dublin-milan': 2.25,
  'dublin-munich': 2.0,
  'dublin-barcelona': 2.25,
  'dublin-geneva': 1.75,
  'dublin-frankfurt': 1.75,

  // Amsterdam routes
  'amsterdam-london': 0.75,
  'amsterdam-paris': 0.9,
  'amsterdam-nice': 1.75,
  'amsterdam-milan': 1.5,
  'amsterdam-barcelona': 2.0,
  'amsterdam-madrid': 2.25,
  'amsterdam-rome': 2.0,

  // Europe to Middle East
  'zurich-dubai': 6.0,
  'london-dubai': 7.0,
  'paris-dubai': 6.5,
  'munich-dubai': 5.5,
  'geneva-dubai': 6.0,

  // Europe to US
  'zurich-new york': 8.5,
  'london-new york': 7.5,
  'paris-new york': 8.0,
  'zurich-los angeles': 12.0,
  'london-los angeles': 11.0,
  'zurich-miami': 10.0,
  'london-miami': 9.5,

  // Middle East
  'dubai-riyadh': 2.0,
  'dubai-doha': 1.0,
  'dubai-abu dhabi': 0.5,
  'dubai-jeddah': 2.5,

  // Asia
  'zurich-tokyo': 12.0,
  'london-tokyo': 12.5,
  'zurich-singapore': 11.5,
  'dubai-singapore': 7.0,
  'dubai-hong kong': 7.5,
  'hong kong-tokyo': 4.0,
  'singapore-tokyo': 7.0,
};

/**
 * Calculate estimated flight price
 * @param {object} params - Calculation parameters
 * @returns {object} - Price estimate
 */
function calculateFlightPrice(params) {
  const { hourlyRate, fromCity, toCity, flightHours, aircraftName } = params;

  if (!hourlyRate || hourlyRate <= 0) {
    return {
      success: false,
      error: 'Hourly rate is required for price calculation'
    };
  }

  let estimatedHours = flightHours;

  // Try to find flight duration if not provided
  if (!estimatedHours && fromCity && toCity) {
    const from = fromCity.toLowerCase().trim();
    const to = toCity.toLowerCase().trim();

    // Try both directions
    const routeKey1 = `${from}-${to}`;
    const routeKey2 = `${to}-${from}`;

    estimatedHours = FLIGHT_DURATIONS[routeKey1] || FLIGHT_DURATIONS[routeKey2];

    // Try partial matches
    if (!estimatedHours) {
      for (const [route, hours] of Object.entries(FLIGHT_DURATIONS)) {
        const [r1, r2] = route.split('-');
        if ((from.includes(r1) || r1.includes(from)) && (to.includes(r2) || r2.includes(to))) {
          estimatedHours = hours;
          break;
        }
        if ((from.includes(r2) || r2.includes(from)) && (to.includes(r1) || r1.includes(to))) {
          estimatedHours = hours;
          break;
        }
      }
    }
  }

  // Calculate prices
  const basePrice = estimatedHours ? hourlyRate * estimatedHours : null;
  const minimumCharge = hourlyRate * 2; // Most operators have a 2-hour minimum

  // For positioning flights, add 30% for return/repositioning
  const positioningFactor = 1.3;

  // Swiss VAT rate
  const VAT_RATE = 0.081; // 8.1%

  const result = {
    success: true,
    aircraft: aircraftName || 'Selected Aircraft',
    hourlyRate: hourlyRate,
    hourlyRateFormatted: `€${hourlyRate.toLocaleString()}/hr`,
    route: fromCity && toCity ? `${fromCity} → ${toCity}` : null
  };

  if (estimatedHours) {
    result.estimatedFlightHours = estimatedHours;
    result.estimatedFlightTime = `${Math.floor(estimatedHours)}h ${Math.round((estimatedHours % 1) * 60)}min`;
    result.basePrice = Math.round(basePrice);
    result.basePriceFormatted = `€${Math.round(basePrice).toLocaleString()}`;

    // Calculate with minimum charge
    const finalPrice = Math.max(basePrice, minimumCharge);

    // Calculate VAT
    const vatAmount = Math.round(finalPrice * VAT_RATE);
    const priceWithVat = Math.round(finalPrice + vatAmount);

    result.estimatedPrice = Math.round(finalPrice);
    result.estimatedPriceFormatted = `€${Math.round(finalPrice).toLocaleString()}`;
    result.vat = {
      rate: '8.1%',
      amount: vatAmount,
      amountFormatted: `€${vatAmount.toLocaleString()}`
    };
    result.totalWithVat = priceWithVat;
    result.totalWithVatFormatted = `€${priceWithVat.toLocaleString()}`;

    // Add range estimate (base to base + positioning) - including VAT
    const highEstimate = Math.round(finalPrice * positioningFactor);
    const highWithVat = Math.round(highEstimate * (1 + VAT_RATE));
    result.priceRange = {
      low: priceWithVat,
      high: highWithVat,
      formatted: `€${priceWithVat.toLocaleString()} - €${highWithVat.toLocaleString()} (incl. 8.1% VAT)`
    };

    result.notes = [
      'Price based on direct flight time',
      'Includes 8.1% Swiss VAT',
      'Does not include landing fees, catering, or ground handling',
      'Positioning fees may apply depending on aircraft location',
      '2-hour minimum charge applies'
    ];
  } else {
    // Cannot estimate without flight duration
    const minWithVat = Math.round(minimumCharge * (1 + VAT_RATE));
    result.minimumCharge = minimumCharge;
    result.minimumChargeFormatted = `€${minimumCharge.toLocaleString()} (2hr minimum)`;
    result.minimumWithVat = minWithVat;
    result.minimumWithVatFormatted = `€${minWithVat.toLocaleString()} (incl. 8.1% VAT)`;
    result.notes = [
      'Flight duration needed for accurate estimate',
      'All prices subject to 8.1% Swiss VAT',
      'Contact us for a detailed quote',
      'Prices vary based on route, positioning, and date'
    ];
  }

  return result;
}

/**
 * Luxury item images database
 * High-quality product images for display in chat and cart
 */
const LUXURY_ITEM_IMAGES = {
  // Bordeaux First Growths
  'chateau mouton rothschild': 'https://images.vivino.com/thumbs/ApnbEqNcpdCVpPE7VLqbXQ_375x500.jpg',
  'chateau lafite rothschild': 'https://images.vivino.com/thumbs/OQqxjYwRa8LZPX9zxRXWRg_375x500.jpg',
  'chateau margaux': 'https://images.vivino.com/thumbs/tJ3P0lPoTeHKGJyHNzJeKg_375x500.jpg',
  'chateau latour': 'https://images.vivino.com/thumbs/r05-K6RaTB-p0E69Gspgdw_375x500.jpg',
  'chateau haut brion': 'https://images.vivino.com/thumbs/dN4IWNV9Q-VaE-4pJxvhUQ_375x500.jpg',
  'petrus': 'https://images.vivino.com/thumbs/6YJrAY4YT79uvnXHTLDHUg_375x500.jpg',

  // Burgundy
  'romanee conti': 'https://images.vivino.com/thumbs/xrLFGcBjT8Zy0EksBOE4qw_375x500.jpg',
  'la tache': 'https://images.vivino.com/thumbs/XaV0mJ9nTD2G8MQMsShHmw_375x500.jpg',
  'richebourg': 'https://images.vivino.com/thumbs/yMWEhMPLTkKWcPmNpjKvkw_375x500.jpg',

  // Champagne
  'dom perignon': 'https://images.vivino.com/thumbs/q80_R0tmECVNVpb8aTf5Sg_375x500.jpg',
  'dom perignon rose': 'https://images.vivino.com/thumbs/fGKuNAGxQyioqq6t6WZYlA_375x500.jpg',
  'krug': 'https://images.vivino.com/thumbs/ILMQQWmsReuiAMZxhfxzlA_375x500.jpg',
  'krug grande cuvee': 'https://images.vivino.com/thumbs/ILMQQWmsReuiAMZxhfxzlA_375x500.jpg',
  'louis roederer cristal': 'https://images.vivino.com/thumbs/KErlIuBnR8xQ7NC7LPHP2A_375x500.jpg',
  'cristal': 'https://images.vivino.com/thumbs/KErlIuBnR8xQ7NC7LPHP2A_375x500.jpg',
  'salon': 'https://images.vivino.com/thumbs/u2xfQ1xvR1-IFjcS2BfGBQ_375x500.jpg',
  'bollinger': 'https://images.vivino.com/thumbs/KZhkzLiOR-iZjl_dz8TtNg_375x500.jpg',
  'veuve clicquot': 'https://images.vivino.com/thumbs/M-EzOPxzQXO8ulfsKdJzRQ_375x500.jpg',
  'moet chandon': 'https://images.vivino.com/thumbs/ZPp0ontFS8aqbKSVEIdTFQ_375x500.jpg',
  'ruinart': 'https://images.vivino.com/thumbs/6Bqle7LFSReH0BE0i0LYig_375x500.jpg',
  'taittinger': 'https://images.vivino.com/thumbs/1OT1Ld-NSt6ZL8m_qzOlEQ_375x500.jpg',
  'perrier jouet': 'https://images.vivino.com/thumbs/VFV27qxVQ_C0B9P5Ty_5Bg_375x500.jpg',
  'belle epoque': 'https://images.vivino.com/thumbs/VFV27qxVQ_C0B9P5Ty_5Bg_375x500.jpg',

  // Italian
  'sassicaia': 'https://images.vivino.com/thumbs/DuLaXbQYQVj5-lFy9B7JJg_375x500.jpg',
  'ornellaia': 'https://images.vivino.com/thumbs/UfYCDsf5Q6mFPaFKrpFLHw_375x500.jpg',
  'masseto': 'https://images.vivino.com/thumbs/p3xWwaDvRQa_VEnNNNcLqQ_375x500.jpg',
  'solaia': 'https://images.vivino.com/thumbs/NJBfQLfgQfO5BYFl8H2aQg_375x500.jpg',
  'tignanello': 'https://images.vivino.com/thumbs/NJBfQLfgQfO5BYFl8H2aQg_375x500.jpg',

  // Spirits - Cognac
  'louis xiii': 'https://www.louisxiii-cognac.com/sites/default/files/styles/product_image/public/2023-05/LOUIS-XIII-Classic-Decanter.png',
  'remy martin louis xiii': 'https://www.louisxiii-cognac.com/sites/default/files/styles/product_image/public/2023-05/LOUIS-XIII-Classic-Decanter.png',
  'richard hennessy': 'https://www.hennessy.com/sites/hennessy_master/files/styles/product_image/public/bottle/hennessy-richard.png',
  'hennessy paradis': 'https://www.hennessy.com/sites/hennessy_master/files/styles/product_image/public/bottle/hennessy-paradis-imperial.png',
  'hennessy xo': 'https://www.hennessy.com/sites/hennessy_master/files/styles/product_image/public/bottle/hennessy-xo.png',

  // Whisky
  'macallan 25': 'https://www.themacallan.com/sites/default/files/2023-06/sherry-oak-25-years-old-bottle.png',
  'macallan 30': 'https://www.themacallan.com/sites/default/files/2023-06/sherry-oak-30-years-old-bottle.png',
  'macallan 40': 'https://www.themacallan.com/sites/default/files/2023-06/sherry-oak-40-years-old-bottle.png',
  'macallan': 'https://www.themacallan.com/sites/default/files/2023-06/sherry-oak-18-years-old-bottle.png',
  'glenfiddich': 'https://www.glenfiddich.com/sites/default/files/2023-06/glenfiddich-40-year-old.png',
  'dalmore': 'https://www.thedalmore.com/sites/default/files/2023-06/dalmore-25-year-old.png',

  // Cigars
  'cohiba behike': 'https://www.cubancigarwebsite.com/brand/cohiba/behike-56-box.jpg',
  'cohiba esplendido': 'https://www.cubancigarwebsite.com/brand/cohiba/esplendidos-box.jpg',
  'cohiba siglo': 'https://www.cubancigarwebsite.com/brand/cohiba/siglo-vi-box.jpg',
  'cohiba': 'https://www.cubancigarwebsite.com/brand/cohiba/esplendidos-box.jpg',
  'montecristo': 'https://www.cubancigarwebsite.com/brand/montecristo/no-2-box.jpg',
  'partagas': 'https://www.cubancigarwebsite.com/brand/partagas/lusitanias-box.jpg',

  // Caviar
  'beluga caviar': 'https://www.petrossian.com/media/catalog/product/b/e/beluga-imperial-caviar-petrossian.jpg',
  'osetra caviar': 'https://www.petrossian.com/media/catalog/product/o/s/ossetra-imperial-caviar-petrossian.jpg',
  'sevruga caviar': 'https://www.petrossian.com/media/catalog/product/s/e/sevruga-caviar-petrossian.jpg',
  'almas caviar': 'https://www.petrossian.com/media/catalog/product/a/l/almas-caviar-petrossian.jpg',
  'caviar': 'https://www.petrossian.com/media/catalog/product/o/s/ossetra-imperial-caviar-petrossian.jpg',

  // Category fallbacks - using reliable product images from known sources
  '_wine': 'https://images.vivino.com/thumbs/ApnbEqNcpdCVpPE7VLqbXQ_375x500.jpg',
  '_champagne': 'https://images.vivino.com/thumbs/ZPp0ontFS8aqbKSVEIdTFQ_375x500.jpg',
  '_spirits': 'https://images.vivino.com/thumbs/q80_R0tmECVNVpb8aTf5Sg_375x500.jpg',
  '_cigars': 'https://www.cigarworld.de/media/image/product/7890/lg/cohiba-esplendidos.jpg',
  '_caviar': 'https://www.petrossian.fr/media/catalog/product/cache/1/image/1200x/9df78eab33525d08d6e5fb8d27136e95/o/s/oscietra-imperial.jpg',
  '_flowers': 'https://images.floraqueen.com/images/products/luxury-red-roses-bouquet.jpg',
  '_cake': 'https://images.laduree.com/media/catalog/product/cache/1/image/1200x/macarons-gift-box.jpg',
  '_decorations': 'https://images.vivino.com/thumbs/KErlIuBnR8xQ7NC7LPHP2A_375x500.jpg',
  '_music': 'https://images.vivino.com/thumbs/ILMQQWmsReuiAMZxhfxzlA_375x500.jpg',
  '_photography': 'https://images.vivino.com/thumbs/u2xfQ1xvR1-IFjcS2BfGBQ_375x500.jpg',
  '_catering': 'https://www.petrossian.fr/media/catalog/product/cache/1/image/1200x/9df78eab33525d08d6e5fb8d27136e95/c/a/caviar-service.jpg',
  '_other': 'https://images.vivino.com/thumbs/q80_R0tmECVNVpb8aTf5Sg_375x500.jpg'
};

/**
 * Get image URL for a luxury item
 * @param {string} itemName - Name of the item
 * @param {string} category - Category fallback
 * @returns {string} - Image URL
 */
function getLuxuryItemImage(itemName, category) {
  const nameLower = itemName.toLowerCase();

  // Try exact match first
  for (const [key, url] of Object.entries(LUXURY_ITEM_IMAGES)) {
    if (!key.startsWith('_') && nameLower.includes(key)) {
      return url;
    }
  }

  // Fall back to category image
  const categoryKey = `_${category}`;
  return LUXURY_ITEM_IMAGES[categoryKey] || LUXURY_ITEM_IMAGES['_other'];
}

/**
 * Known luxury wine prices database (approximate market prices in EUR)
 * These are reference prices - actual availability and prices may vary
 */
const WINE_PRICE_DATABASE = {
  // Bordeaux First Growths
  'chateau mouton rothschild': { basePrice: 400, vintage1967: 2500, vintage1982: 1200, vintage2000: 800, vintage2010: 600 },
  'chateau lafite rothschild': { basePrice: 500, vintage1982: 1500, vintage2000: 900, vintage2010: 700 },
  'chateau margaux': { basePrice: 450, vintage1982: 1300, vintage2000: 850, vintage2010: 650 },
  'chateau latour': { basePrice: 550, vintage1982: 1400, vintage2000: 950, vintage2010: 750 },
  'chateau haut brion': { basePrice: 400, vintage1982: 1100, vintage2000: 750, vintage2010: 600 },
  'petrus': { basePrice: 3000, vintage1982: 6000, vintage2000: 4500, vintage2010: 4000 },

  // Burgundy
  'romanee conti': { basePrice: 15000, vintage2010: 20000, vintage2015: 18000 },
  'la tache': { basePrice: 4000, vintage2010: 5500, vintage2015: 5000 },
  'richebourg': { basePrice: 2500, vintage2010: 3500, vintage2015: 3000 },

  // Champagne
  'dom perignon': { basePrice: 200, vintage2008: 280, vintage2012: 250, rose: 400 },
  'krug': { basePrice: 250, grandeCuvee: 280, vintage: 350, cloMesnil: 1500 },
  'louis roederer cristal': { basePrice: 280, vintage2014: 300, rose: 500 },
  'salon': { basePrice: 500, vintage2012: 550 },
  'bollinger': { basePrice: 80, grandAnnee: 150, rd: 300, vieilles: 400 },
  'veuve clicquot': { basePrice: 60, grandDame: 180 },
  'moet chandon': { basePrice: 50, domPerignon: 200 },
  'ruinart': { basePrice: 70, blancdeBlancs: 90, domRuinart: 200 },
  'taittinger': { basePrice: 55, comteDeChampagne: 200 },
  'perrier jouet': { basePrice: 65, belleEpoque: 180 },

  // Italian
  'sassicaia': { basePrice: 250, vintage2015: 300, vintage2016: 280 },
  'ornellaia': { basePrice: 200, vintage2015: 250 },
  'masseto': { basePrice: 600, vintage2015: 750 },
  'solaia': { basePrice: 250, vintage2015: 300 },
  'tignanello': { basePrice: 120, vintage2015: 150 },

  // Spirits
  'louis xiii': { basePrice: 3500 },
  'richard hennessy': { basePrice: 4000 },
  'hennessy paradis': { basePrice: 800 },
  'remy martin louis xiii': { basePrice: 3500 },
  'macallan 25': { basePrice: 2000 },
  'macallan 30': { basePrice: 5000 },
  'macallan 40': { basePrice: 15000 },
  'glenfiddich 40': { basePrice: 4000 },
  'dalmore 25': { basePrice: 1500 },

  // Cigars (per box)
  'cohiba behike': { basePrice: 1500, behike52: 1200, behike54: 1400, behike56: 1800 },
  'cohiba esplendido': { basePrice: 800 },
  'cohiba siglo': { basePrice: 600, sigloVI: 750 },
  'montecristo': { basePrice: 400, no2: 500 },
  'partagas': { basePrice: 350, lusitania: 500 },

  // Caviar (per 100g)
  'beluga caviar': { basePrice: 400 },
  'osetra caviar': { basePrice: 250 },
  'sevruga caviar': { basePrice: 180 },
  'almas caviar': { basePrice: 2500 },
};

/**
 * Look up luxury item price
 * Returns estimated market price based on known prices or general estimation
 */
async function lookupLuxuryItem(params) {
  const { itemName, category, quantity = 1 } = params;

  if (!itemName) {
    return {
      success: false,
      error: 'Item name is required'
    };
  }

  const itemLower = itemName.toLowerCase();
  let estimatedPrice = null;
  let priceSource = 'general_estimate';
  let confidence = 'low';
  let notes = [];

  // Try to find in our database
  for (const [key, prices] of Object.entries(WINE_PRICE_DATABASE)) {
    if (itemLower.includes(key)) {
      // Check for vintage year
      const vintageMatch = itemLower.match(/(\d{4})/);
      if (vintageMatch) {
        const vintage = vintageMatch[1];
        const vintageKey = `vintage${vintage}`;
        if (prices[vintageKey]) {
          estimatedPrice = prices[vintageKey];
          priceSource = 'database_vintage';
          confidence = 'medium';
          notes.push(`Price based on ${vintage} vintage market value`);
        }
      }

      // Check for special editions
      if (itemLower.includes('rose') || itemLower.includes('rosé')) {
        estimatedPrice = prices.rose || prices.basePrice * 1.5;
      } else if (itemLower.includes('grande cuvee') || itemLower.includes('grand cuvée')) {
        estimatedPrice = prices.grandeCuvee || prices.basePrice * 1.3;
      }

      // Use base price if no specific match
      if (!estimatedPrice) {
        estimatedPrice = prices.basePrice;
        priceSource = 'database_base';
        confidence = 'medium';
      }
      break;
    }
  }

  // If not found in database, estimate based on category
  if (!estimatedPrice) {
    switch (category) {
      case 'wine':
        estimatedPrice = 150; // Default fine wine estimate
        notes.push('Price estimated based on typical fine wine pricing');
        break;
      case 'champagne':
        estimatedPrice = 100;
        notes.push('Price estimated based on typical champagne pricing');
        break;
      case 'spirits':
        estimatedPrice = 200;
        notes.push('Price estimated based on typical premium spirits pricing');
        break;
      case 'caviar':
        estimatedPrice = 300;
        notes.push('Price per 100g, typical premium caviar pricing');
        break;
      case 'cigars':
        estimatedPrice = 500;
        notes.push('Price per box, typical premium cigar pricing');
        break;
      case 'flowers':
        estimatedPrice = 150;
        notes.push('Price for luxury floral arrangement');
        break;
      default:
        estimatedPrice = 100;
        notes.push('General luxury item estimate');
    }
    priceSource = 'category_estimate';
    confidence = 'low';
  }

  const totalPrice = estimatedPrice * quantity;
  const imageUrl = getLuxuryItemImage(itemName, category);

  return {
    success: true,
    item: {
      name: itemName,
      category,
      quantity,
      unitPrice: estimatedPrice,
      unitPriceFormatted: `€${estimatedPrice.toLocaleString()}`,
      totalPrice,
      totalPriceFormatted: `€${totalPrice.toLocaleString()}`,
      isEstimate: true,
      priceSource,
      confidence,
      image: imageUrl
    },
    availability: {
      status: 'requires_confirmation',
      message: `We cannot confirm availability of "${itemName}" at this time. Our team will check stock and confirm.`,
      estimatedConfirmationTime: '2-4 hours'
    },
    notes: [
      'Price is an estimate based on current market values',
      'Availability must be confirmed by our team',
      'Final price may vary based on actual sourcing',
      ...notes
    ],
    // Cart-ready item
    cartItem: {
      id: `extra-${Date.now()}`,
      type: 'custom_extra',
      name: itemName,
      category,
      quantity,
      unitPrice: estimatedPrice,
      price: totalPrice,
      basePrice: totalPrice,
      totalWithFee: totalPrice,
      isEstimate: true,
      isCustomRequest: true,
      requiresConfirmation: true,
      notes: `${category} - availability to be confirmed`,
      image: imageUrl
    }
  };
}

/**
 * Look up the address and location details of a place (restaurant, hotel, landmark, etc.)
 * Uses Google Places API for rich details including photos, ratings, reviews, and contact info
 * Falls back to Mapbox Geocoding API if Google Places fails
 * @param {object} params - { placeName: string, city?: string }
 * @returns {Promise<object>} - Place details including address, photos, ratings, reviews
 */
async function lookupPlaceAddress(params) {
  const { placeName, city } = params;

  if (!placeName) {
    return {
      success: false,
      error: 'Place name is required'
    };
  }

  // Combine place name with city for better accuracy
  const searchQuery = city ? `${placeName} in ${city}` : placeName;

  try {
    // Try Google Places API first for rich details
    const googlePlacesResult = await fetchGooglePlaces(searchQuery);

    if (googlePlacesResult.success && googlePlacesResult.places?.length > 0) {
      const place = googlePlacesResult.places[0];
      const alternatives = googlePlacesResult.places.slice(1);

      return {
        success: true,
        source: 'google_places',
        place: {
          id: place.id,
          name: place.name,
          fullAddress: place.address,
          category: place.category,
          primaryType: place.primaryType,
          types: place.types,
          coordinates: place.location,
          // Rich details from Google Places
          rating: place.rating,
          reviewCount: place.reviewCount,
          priceLevel: place.priceLevel,
          photos: place.photos,
          mainPhoto: place.mainPhoto,
          website: place.website,
          phone: place.phone,
          googleMapsUrl: place.googleMapsUrl,
          openingHours: place.openingHours,
          description: place.description,
          reviews: place.reviews,
          features: place.features,
          businessStatus: place.businessStatus
        },
        alternatives: alternatives.length > 0 ? alternatives.map(p => ({
          id: p.id,
          name: p.name,
          address: p.address,
          rating: p.rating,
          reviewCount: p.reviewCount,
          category: p.category,
          mainPhoto: p.mainPhoto,
          priceLevel: p.priceLevel
        })) : null,
        // Display configuration for the UI
        displayType: 'place_card',
        message: `Found "${place.name}" - ${place.category || 'Place'}`,
        canArrangeTransfer: true,
        transferNote: 'I can arrange a luxury car transfer to this location. Would you like me to check available vehicles?'
      };
    }

    // Fallback to Mapbox Geocoding API
    console.log('Google Places failed or no results, falling back to Mapbox');
    return await fallbackToMapbox(searchQuery, placeName, city);

  } catch (error) {
    console.error('Place lookup error:', error);
    // Try Mapbox as fallback
    try {
      return await fallbackToMapbox(searchQuery, placeName, city);
    } catch (fallbackError) {
      console.error('Mapbox fallback also failed:', fallbackError);
      return {
        success: false,
        error: 'Unable to look up the place at this time. Please try again.'
      };
    }
  }
}

/**
 * Fetch place details from Google Places API via Edge Function
 */
async function fetchGooglePlaces(query) {
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'searchText',
        query: query,
        maxResults: 5
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google Places API error:', response.status, errorData);
      return { success: false, error: errorData.error || 'API request failed' };
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Google Places edge function:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fallback to Mapbox Geocoding API when Google Places is unavailable
 */
async function fallbackToMapbox(searchQuery, placeName, city) {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&types=poi,address,place&limit=3&language=en`
  );

  const data = await response.json();

  if (!data.features || data.features.length === 0) {
    return {
      success: false,
      error: `Could not find "${placeName}"${city ? ` in ${city}` : ''}. Please try with more specific details or check the spelling.`
    };
  }

  // Get the best match (first result)
  const place = data.features[0];

  // Extract address components from context
  const context = place.context || [];
  const getContextValue = (type) => {
    const item = context.find(c => c.id.startsWith(type));
    return item ? item.text : null;
  };

  const neighborhood = getContextValue('neighborhood');
  const locality = getContextValue('locality');
  const placeContext = getContextValue('place');
  const region = getContextValue('region');
  const country = getContextValue('country');
  const postcode = getContextValue('postcode');

  // Check for alternative results
  const alternatives = data.features.slice(1).map(f => ({
    name: f.text,
    address: f.place_name,
    coordinates: {
      latitude: f.center[1],
      longitude: f.center[0]
    }
  }));

  return {
    success: true,
    source: 'mapbox',
    place: {
      name: place.text,
      fullAddress: place.place_name,
      streetAddress: place.address ? `${place.address} ${place.text}` : place.text,
      neighborhood: neighborhood || locality,
      city: placeContext || locality,
      region: region,
      postalCode: postcode,
      country: country,
      coordinates: {
        latitude: place.center[1],
        longitude: place.center[0]
      },
      placeType: place.place_type?.[0] || 'poi',
      category: place.properties?.category || 'Place'
    },
    alternatives: alternatives.length > 0 ? alternatives : null,
    displayType: 'place_basic',
    message: `Found "${place.text}" at ${place.place_name}`,
    canArrangeTransfer: true,
    transferNote: 'I can arrange a luxury car transfer to this location. Would you like me to check available vehicles?'
  };
}

/**
 * Add a custom extra to the cart
 * Creates a cart-ready item for custom requests
 */
function addCustomExtra(params) {
  const {
    itemName,
    category,
    estimatedPrice = null,
    quantity = 1,
    notes = '',
    linkedToCartItem = null
  } = params;

  if (!itemName) {
    return {
      success: false,
      error: 'Item name is required'
    };
  }

  // Default prices by category if not provided
  const defaultPrices = {
    wine: 150,
    champagne: 120,
    spirits: 200,
    caviar: 300,
    cigars: 500,
    flowers: 150,
    cake: 200,
    decorations: 300,
    music: 500,
    photography: 800,
    catering: 100,
    other: 100
  };

  const unitPrice = estimatedPrice || defaultPrices[category] || 100;
  const totalPrice = unitPrice * quantity;
  const imageUrl = getLuxuryItemImage(itemName, category);

  const cartItem = {
    id: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'custom_extra',
    name: itemName,
    title: itemName,
    image: imageUrl,
    category,
    quantity,
    unitPrice,
    price: totalPrice,
    basePrice: totalPrice,
    totalWithFee: totalPrice,
    isEstimate: estimatedPrice === null,
    isCustomRequest: true,
    requiresConfirmation: true,
    notes: notes || `${category} item - requires confirmation`,
    linkedToCartItem,
    addedAt: new Date().toISOString()
  };

  return {
    success: true,
    message: `Added "${itemName}" to your request`,
    cartItem,
    displayInfo: {
      name: itemName,
      category: category.charAt(0).toUpperCase() + category.slice(1),
      quantity,
      priceFormatted: estimatedPrice ? `€${totalPrice.toLocaleString()}` : `~€${totalPrice.toLocaleString()} (est.)`,
      status: 'Availability to be confirmed',
      linkedTo: linkedToCartItem ? `Linked to booking #${linkedToCartItem}` : null
    },
    notes: [
      'This is a custom request',
      'Our team will confirm availability and final pricing',
      estimatedPrice ? 'Price shown is an estimate' : 'Price is a rough estimate based on typical pricing',
      'You can add unlimited extras to your booking'
    ]
  };
}

/**
 * Add a service booking to the cart
 * Creates a cart-ready item for jets, helicopters, yachts, etc.
 * Includes flight duration calculation and estimated pricing
 */
function addToCart(params) {
  const {
    serviceType,
    name,
    from = '',
    to = '',
    date = '',
    time = '',
    passengers = 1,
    price = 0,
    hourlyRate = 0,
    catering = 'complimentary',
    notes = ''
  } = params;

  if (!serviceType || !name) {
    return {
      success: false,
      error: 'Service type and name are required'
    };
  }

  // Map service types to display types
  const typeMap = {
    jet: 'aircraft',
    helicopter: 'helicopters',
    yacht: 'yachts',
    car: 'luxury_cars',
    empty_leg: 'empty_legs',
    adventure: 'adventures',
    transfer: 'transfers'
  };

  // Calculate flight duration and estimated price for jets/helicopters
  let flightDuration = null;
  let estimatedPrice = price;
  let flightHours = null;
  let priceCalculation = null;

  if ((serviceType === 'jet' || serviceType === 'helicopter') && from && to && hourlyRate) {
    // Extract city names for flight duration lookup
    const fromCity = from.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
    const toCity = to.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();

    // Try both directions in FLIGHT_DURATIONS
    const routeKey1 = `${fromCity}-${toCity}`;
    const routeKey2 = `${toCity}-${fromCity}`;

    flightHours = FLIGHT_DURATIONS[routeKey1] || FLIGHT_DURATIONS[routeKey2];

    // If no exact match, try partial matches
    if (!flightHours) {
      for (const [route, hours] of Object.entries(FLIGHT_DURATIONS)) {
        const [r1, r2] = route.split('-');
        if ((fromCity.includes(r1) || r1.includes(fromCity)) &&
            (toCity.includes(r2) || r2.includes(toCity))) {
          flightHours = hours;
          break;
        }
        if ((fromCity.includes(r2) || r2.includes(fromCity)) &&
            (toCity.includes(r1) || r1.includes(toCity))) {
          flightHours = hours;
          break;
        }
      }
    }

    if (flightHours) {
      // Format duration string
      const hours = Math.floor(flightHours);
      const minutes = Math.round((flightHours % 1) * 60);
      flightDuration = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

      // Calculate estimated price (round up to nearest hour for billing)
      const billedHours = Math.ceil(flightHours);
      estimatedPrice = billedHours * hourlyRate;
      priceCalculation = `${billedHours}h × €${hourlyRate.toLocaleString()}/hr`;
    }
  }

  // Create cart item
  const cartItem = {
    id: `booking-${Date.now()}`,
    type: typeMap[serviceType] || serviceType,
    name,
    model: name,
    from,
    to,
    date,
    time,
    passengers,
    hourlyRate: hourlyRate || 0,
    flightHours: flightHours || null,
    flightDuration: flightDuration || null,
    price: estimatedPrice || 0,
    basePrice: estimatedPrice || 0,
    priceCalculation: priceCalculation || null,
    isEstimate: true,
    requiresConfirmation: true,
    catering,
    notes,
    addedAt: new Date().toISOString()
  };

  // Build display info with all details
  const displayInfo = {
    name,
    type: serviceType.charAt(0).toUpperCase() + serviceType.slice(1),
    route: from && to ? `${from} → ${to}` : '',
    date: date || 'To be confirmed',
    time: time || null,
    passengers,
    flightDuration: flightDuration || null,
    hourlyRateFormatted: hourlyRate ? `€${hourlyRate.toLocaleString()}/hr` : null,
    estimatedPriceFormatted: estimatedPrice ? `€${estimatedPrice.toLocaleString()}` : 'Price on request',
    priceCalculation: priceCalculation || null,
    catering: catering === 'complimentary' ? 'Complimentary refreshments' : catering
  };

  return {
    success: true,
    action: 'ADD_TO_CART',
    message: `Added ${name} to your cart`,
    cartItem,
    displayInfo,
    // Prompt for additional services after adding to cart
    askAdditionalServices: true,
    additionalServicesPrompt: `Your ${name} booking has been added to cart.

📍 **Route:** ${from} → ${to}
${flightDuration ? `⏱️ **Est. Flight Duration:** ${flightDuration}` : ''}
${hourlyRate ? `💰 **Hourly Rate:** €${hourlyRate.toLocaleString()}/hr` : ''}
${estimatedPrice ? `💵 **Est. Total:** €${estimatedPrice.toLocaleString()}${priceCalculation ? ` (${priceCalculation})` : ''}` : ''}

Would you like to add any additional services?
• **Ground Transport** - Airport transfer to your hotel or destination
• **Premium Catering** - Gourmet meals and beverages on board
• **Special Requests** - Champagne, flowers, celebration setup

Just let me know what you need!`,
    notes: [
      'Item added to your cart',
      flightDuration ? `Est. flight time: ${flightDuration}` : null,
      estimatedPrice ? `Est. total: €${estimatedPrice.toLocaleString()}` : null,
      'Final pricing confirmed upon booking'
    ].filter(Boolean)
  };
}
