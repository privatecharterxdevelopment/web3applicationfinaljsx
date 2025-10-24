/**
 * AI Tool Definitions for Claude Function Calling
 * These tools allow the AI to search and retrieve data from the database
 */

import { UnifiedSearchService } from './supabaseService';

console.log('✅ aiTools.js loaded, UnifiedSearchService:', UnifiedSearchService);

/**
 * Tool Definitions for Claude
 */
export const aiToolDefinitions = [
  {
    name: "searchEmptyLegs",
    description: "Search for empty leg flights (discounted repositioning flights). Use this when users ask about empty legs, cheap flights, or mention specific departure/arrival cities.",
    input_schema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Departure city or airport code (e.g., 'Zurich', 'ZRH', 'Dubai')"
        },
        to: {
          type: "string",
          description: "Arrival city or airport code (e.g., 'London', 'LHR', 'Paris')"
        },
        location: {
          type: "string",
          description: "Generic location when 'from' or 'to' is ambiguous (user said 'in Zurich' or 'emptylegs zurich')"
        },
        date: {
          type: "string",
          description: "Preferred departure date in YYYY-MM-DD format"
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
    description: "Show available private jet models and create custom charter request. Private jets are NOT fixed offers - they require custom quotes based on route, date, and aircraft selection. Always explain this is a custom request process where users select aircraft, dates, and create a booking request.",
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
        passengers: {
          type: "number",
          description: "Number of passengers"
        },
        category: {
          type: "string",
          description: "Jet category: light, midsize, super-midsize, heavy, ultra-long-range"
        }
      },
      required: []
    }
  },
  {
    name: "searchHelicopters",
    description: "Search for helicopter charters. Use when users ask about helicopters, heli transfers, or rotorcraft.",
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
    description: "Search for luxury car and chauffeur services. Use when users ask about cars, taxi, chauffeur, or ground transportation.",
    input_schema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Pickup location"
        },
        to: {
          type: "string",
          description: "Drop-off location"
        },
        location: {
          type: "string",
          description: "Generic location for cars available in that area"
        },
        passengers: {
          type: "number",
          description: "Number of passengers"
        },
        category: {
          type: "string",
          description: "Car category: luxury, van, ultra-luxury"
        }
      },
      required: []
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

/**
 * Search for empty leg flights
 */
export async function searchEmptyLegs(params) {
  console.log('🔍 searchEmptyLegs called with params:', params);

  // If only 'from' is specified without 'to', use it as general search
  const searchParams = {
    serviceTypes: { emptyLegs: true }
  };

  if (params.from && params.to) {
    // Both from and to specified - specific route search
    searchParams.fromLocation = params.from;
    searchParams.location = params.to;
  } else if (params.from) {
    // Only from specified - search as general location (departure OR arrival)
    searchParams.q = params.from;
  } else if (params.to) {
    // Only to specified - search as general location
    searchParams.q = params.to;
  } else if (params.location) {
    // Generic location search
    searchParams.q = params.location;
  }

  // Add date and passenger filters
  if (params.date) searchParams.dateFrom = params.date;
  if (params.passengers) searchParams.passengers = params.passengers;

  console.log('🔍 Calling UnifiedSearchService with:', searchParams);

  const results = await UnifiedSearchService.searchAll(searchParams);

  console.log('✅ searchEmptyLegs results:', {
    emptyLegsCount: results.emptyLegs?.length || 0,
    totalResults: results.totalResults,
    params: searchParams
  });

  return {
    success: true,
    results: results.emptyLegs || [],
    total: results.emptyLegs?.length || 0,
    params
  };
}

/**
 * Search for private jets - CUSTOM REQUEST BUILDER
 * Returns available jet models for custom charter requests
 */
export async function searchPrivateJets(params) {
  console.log('🛩️ searchPrivateJets called - CUSTOM REQUEST MODE:', params);

  // Fetch available jet models from jets table
  const results = await UnifiedSearchService.searchAll({
    fromLocation: params.from,
    location: params.to,
    q: params.location,
    passengers: params.passengers,
    serviceTypes: { jets: true }
  });

  // Price ranges by category (hourly rates in EUR)
  const priceRanges = {
    'light': { min: 2500, max: 4000, range: '€2,500-€4,000/hr' },
    'midsize': { min: 4000, max: 6000, range: '€4,000-€6,000/hr' },
    'super-midsize': { min: 5500, max: 7500, range: '€5,500-€7,500/hr' },
    'heavy': { min: 7000, max: 10000, range: '€7,000-€10,000/hr' },
    'ultra-long-range': { min: 10000, max: 15000, range: '€10,000-€15,000/hr' }
  };

  // Enhance jets with price estimates
  const enhancedJets = (results.aircraft || []).map(jet => {
    const category = (jet.category || 'midsize').toLowerCase();
    const priceInfo = priceRanges[category] || priceRanges['midsize'];

    return {
      ...jet,
      isCustomRequest: true, // Flag indicating this needs custom configuration
      priceRange: priceInfo.range,
      estimatedHourlyRate: priceInfo.min,
      requiresConfiguration: true,
      bookingType: 'custom_request'
    };
  });

  return {
    success: true,
    results: enhancedJets,
    total: enhancedJets.length,
    isCustomRequest: true,
    message: 'Private jets require custom configuration. Select aircraft, dates, and create booking request.',
    priceRanges: priceRanges,
    params
  };
}

/**
 * Search for helicopters
 */
export async function searchHelicopters(params) {
  const results = await UnifiedSearchService.searchAll({
    fromLocation: params.from || params.location,
    location: params.to,
    q: params.location,
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
  const results = await UnifiedSearchService.searchAll({
    q: params.location,
    passengers: params.guests,
    serviceTypes: { yachts: true }
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
 * Search for luxury cars
 */
export async function searchLuxuryCars(params) {
  const results = await UnifiedSearchService.searchAll({
    fromLocation: params.from || params.location,
    location: params.to,
    q: params.location,
    passengers: params.passengers,
    serviceTypes: { cars: true }
  });

  return {
    success: true,
    results: results.luxuryCars || [],
    total: results.luxuryCars?.length || 0,
    params
  };
}
