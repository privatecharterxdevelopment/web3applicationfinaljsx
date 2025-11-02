/**
 * AI Tool Definitions for Claude Function Calling
 * These tools allow the AI to search and retrieve data from the database
 */

import { UnifiedSearchService } from './supabaseService';

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
    description: "Search for private jet charters. Use when users ask about private jets, jet charter, or aircraft.",
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
  const results = await UnifiedSearchService.searchAll({
    q: params.location,
    fromLocation: params.from,
    location: params.to,
    dateFrom: params.date,
    passengers: params.passengers,
    serviceTypes: { emptyLegs: true }
  });

  return {
    success: true,
    results: results.emptyLegs || [],
    total: results.emptyLegs?.length || 0,
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
 * Search for luxury cars
 */
export async function searchLuxuryCars(params) {
  const results = await UnifiedSearchService.searchAll({
    q: params.location,
    fromLocation: params.from,
    location: params.to,
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
