/**
 * AI Tool Definitions for Claude Function Calling
 * These tools allow the AI to search and retrieve data from the database
 */

import { UnifiedSearchService } from './supabaseService';
import { calculateBilledHours } from '../components/Landingpagenew/AIChat/utils/priceCalculator';
import { hotelService } from './hotelService';
import { supabase } from '../lib/supabase';

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
    description: "Search for empty leg flights (discounted repositioning flights). CRITICAL: When user mentions ANY city name (like 'London', 'Dubai', 'Zurich'), IMMEDIATELY call this tool - do NOT ask follow-up questions first. Use 'location' parameter to show BOTH departures and arrivals for that city. Use 'from' for departures only, 'to' for arrivals only. Examples: User says 'London' → call with location='London'. User says 'from London' → call with from='London'. User says 'to Monaco' → call with to='Monaco'.",
    input_schema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Departure city, IATA code, or country. Use when user says 'from [city]' or 'flying from [city]'. Shows only departures from this location."
        },
        to: {
          type: "string",
          description: "Arrival city, IATA code, or country. Use when user says 'to [city]' or 'flying to [city]'. Shows only arrivals to this location."
        },
        location: {
          type: "string",
          description: "City, region, or country for general search. Use when user mentions a city without 'from' or 'to' prefix. This shows BOTH departures and arrivals for that location. Examples: 'London', 'Dubai', 'Europe', 'Switzerland'"
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
    description: "Search for private jet charters. Use when users ask about private jets, jet charter, or aircraft. If user requests a SPECIFIC aircraft model (e.g., 'Gulfstream G650', 'Citation X', 'Challenger 350'), include the model parameter. IMPORTANT: Do NOT use this tool if you already showed jet results in this conversation - when user provides booking details (date, time, passengers), just confirm their details and reference the options already displayed above. Never search twice for the same route.",
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
        },
        model: {
          type: "string",
          description: "Specific aircraft model to search for (e.g., 'Gulfstream G650', 'Citation XLS', 'Challenger 350', 'Phenom 300', 'Global 7500'). Use this when user requests a specific jet model."
        }
      },
      required: []
    }
  },
  {
    name: "searchHelicopters",
    description: "Search for helicopter charters. Use when users ask about helicopters, heli transfers, or rotorcraft. If user requests a SPECIFIC helicopter model (e.g., 'EC135', 'AS350', 'AW139', 'Bell 429'), include the model parameter. IMPORTANT: Do NOT use this tool if you already showed helicopter results in this conversation - just reference the options already displayed above.",
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
        },
        model: {
          type: "string",
          description: "Specific helicopter model to search for (e.g., 'EC135', 'AS350', 'AW139', 'Bell 429', 'H145', 'S-76'). Use this when user requests a specific helicopter model."
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
    name: "searchCommercialFlights",
    description: "Search for commercial airline flights via Duffel API. Use when users ask about commercial flights, airline tickets, airfare, or booking regular flights (not private jets). REQUIRES: origin (IATA code), destination (IATA code), departureDate, and passengers. Ask user for these details if not provided. For booking, direct users to the Flight Tickets page with pre-filled search parameters.",
    input_schema: {
      type: "object",
      properties: {
        origin: {
          type: "string",
          description: "Departure airport IATA code (e.g., 'LHR', 'JFK', 'DXB'). Convert city names to IATA codes."
        },
        destination: {
          type: "string",
          description: "Arrival airport IATA code (e.g., 'CDG', 'LAX', 'SIN'). Convert city names to IATA codes."
        },
        departureDate: {
          type: "string",
          description: "Departure date in YYYY-MM-DD format"
        },
        returnDate: {
          type: "string",
          description: "Return date in YYYY-MM-DD format (for round trips, optional)"
        },
        passengers: {
          type: "number",
          description: "Number of adult passengers (default: 1)"
        },
        cabinClass: {
          type: "string",
          description: "Cabin class: 'economy', 'premium_economy', 'business', or 'first'. Default: 'economy'"
        }
      },
      required: ["origin", "destination", "departureDate", "passengers"]
    }
  },
  {
    name: "searchAirportTransfer",
    description: "Search for airport transfers, taxi, and chauffeur services. Call this tool immediately when user mentions taxi, transfer, chauffeur, airport pickup, or ground transport. Show available vehicles and direct user to the Ground Transport page for easy booking. For direct taxi bookings, guide users to the Ground Transport page where they can enter pickup/dropoff locations on an interactive map.",
    input_schema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Pickup location - airport, hotel, address, or city"
        },
        to: {
          type: "string",
          description: "Destination - hotel name, address, or landmark (optional)"
        },
        toCity: {
          type: "string",
          description: "City of destination"
        },
        passengers: {
          type: "number",
          description: "Number of passengers (default: 1)"
        },
        vehicles: {
          type: "number",
          description: "Number of vehicles needed"
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
          description: "Flight number for airport pickups"
        }
      },
      required: []
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
    name: "searchWines",
    description: "MANDATORY: Search wines database. You MUST use this tool IMMEDIATELY when user says: 'wine', 'champagne', 'Dom Perignon', 'Krug', 'Cristal', 'Margaux', 'Petrus', 'do you have', 'show me wines', or ANY wine name. Database contains 105 premium wines. NEVER respond about wine availability without calling this tool first. When user asks 'do you have Dom Perignon' you MUST call searchWines with query='Dom Perignon'.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The wine name to search. ALWAYS extract and pass this when user mentions a specific wine. User says 'Dom Perignon' → query='Dom Perignon'. User says 'Krug' → query='Krug'. User says 'Margaux' → query='Margaux'."
        },
        category: {
          type: "string",
          enum: ["champagne", "bordeaux", "burgundy", "italy", "white", "sweet"],
          description: "Wine category. Use when user asks for a type: 'champagne' for champagne/sparkling, 'bordeaux' for Bordeaux reds, 'burgundy' for Burgundy wines, 'italy' for Italian wines (Barolo, Brunello, Amarone), 'white' for white wines, 'sweet' for dessert wines."
        },
        type: {
          type: "string",
          enum: ["red", "white", "sparkling", "rosé", "dessert"],
          description: "Wine type filter."
        },
        country: {
          type: "string",
          description: "Country of origin: 'France', 'Italy', 'Spain', 'USA', etc."
        },
        region: {
          type: "string",
          description: "Specific wine region: 'Champagne', 'Bordeaux', 'Burgundy', 'Tuscany', 'Piedmont', 'Napa Valley', etc."
        },
        producer: {
          type: "string",
          description: "Wine producer/house name: 'Moët & Chandon', 'Louis Roederer', 'Château Margaux', etc."
        },
        vintage: {
          type: "string",
          description: "Vintage year: '2012', '2015', '2018', etc."
        },
        priceMin: {
          type: "number",
          description: "Minimum price in EUR"
        },
        priceMax: {
          type: "number",
          description: "Maximum price in EUR"
        },
        classification: {
          type: "string",
          description: "Wine classification: 'Grand Cru', 'Premier Cru', 'First Growth', etc."
        }
      },
      required: []
    }
  },
  {
    name: "searchDelicatesse",
    description: "MANDATORY: Search delicatesse database for luxury in-flight extras. You MUST use this tool when user says: 'delicacies', 'delicatesse', 'extras', 'caviar', 'cigars', 'flowers', 'cake', 'decorations', 'photography', 'in-flight extras', 'special treats', or any luxury item. Database contains: Caviar (Sevruga, Oscietra, Beluga), Premium Cigars (Cohiba, Montecristo, Davidoff, Padron, Arturo Fuente), Flowers, Cakes & Desserts, Event Decorations, Photography & Video, Aircraft Services.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The item name to search. ALWAYS extract and pass this when user mentions a specific item. User says 'Beluga caviar' → query='Beluga'. User says 'Cohiba cigars' → query='Cohiba'."
        },
        category: {
          type: "string",
          enum: ["Caviar", "Premium Cigars", "Flowers", "Cakes & Desserts", "Event Decorations", "Photography & Video", "Special Services", "Aircraft Services"],
          description: "Category filter. Use when user asks for a category: 'caviar' → category='Caviar', 'cigars' → category='Premium Cigars', 'flowers' → category='Flowers', 'cake' → category='Cakes & Desserts', 'decorations' → category='Event Decorations', 'photography' → category='Photography & Video'."
        },
        priceMin: {
          type: "number",
          description: "Minimum price in USD"
        },
        priceMax: {
          type: "number",
          description: "Maximum price in USD"
        }
      },
      required: []
    }
  },
  {
    name: "searchCigars",
    description: "Search premium cigars database specifically. Use when user mentions cigars, Cohiba, Montecristo, Davidoff, Padron, Arturo Fuente, Romeo y Julieta, Partagas. ALWAYS mention the $2,000 aircraft cleaning fee when showing cigar results.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The cigar brand or name to search. User says 'Cohiba' → query='Cohiba'."
        },
        brand: {
          type: "string",
          enum: ["Cohiba", "Montecristo", "Padron", "Davidoff", "Arturo Fuente", "Romeo y Julieta", "Partagas"],
          description: "Filter by brand name"
        },
        priceMin: {
          type: "number",
          description: "Minimum price in USD"
        },
        priceMax: {
          type: "number",
          description: "Maximum price in USD"
        }
      },
      required: []
    }
  },
  {
    name: "searchSpecialServices",
    description: "Search special services database for consulting, concierge, and premium services. Use when user mentions: consulting, business consulting, legal services, concierge, VIP services, special services, advisory, professional services.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The service name to search. User says 'consulting' → query='consulting'."
        },
        category: {
          type: "string",
          description: "Category filter for the service type"
        },
        priceMin: {
          type: "number",
          description: "Minimum price"
        },
        priceMax: {
          type: "number",
          description: "Maximum price"
        }
      },
      required: []
    }
  },
  {
    name: "searchWineGlobal",
    description: "ONLY use AFTER searchWines returns 0 results AND user confirms they want global sourcing. Do NOT use this tool without first trying searchWines. Searches wine merchants globally.",
    input_schema: {
      type: "object",
      properties: {
        wineName: {
          type: "string",
          description: "Full name of the wine to search for (e.g., 'Chateau Mouton Rothschild 1982', 'Screaming Eagle 2015')"
        },
        vintage: {
          type: "string",
          description: "Specific vintage year if known"
        },
        maxBudget: {
          type: "number",
          description: "Maximum budget in EUR (optional)"
        }
      },
      required: ["wineName"]
    }
  },
  {
    name: "createWineRequest",
    description: "Create a wine sourcing request when a specific wine cannot be found via web search. This creates a note/request that the PrivateCharterX wine team will process. Use when: 1) Web search found no pricing, 2) Wine is extremely rare, 3) User wants a specific bottle sourced. The team will contact user within 24-48 hours with availability and pricing.",
    input_schema: {
      type: "object",
      properties: {
        wineName: {
          type: "string",
          description: "Full name of the wine (e.g., 'Screaming Eagle Cabernet Sauvignon')"
        },
        vintage: {
          type: "string",
          description: "Specific vintage year (e.g., '2018')"
        },
        quantity: {
          type: "number",
          description: "Number of bottles requested",
          default: 1
        },
        userNotes: {
          type: "string",
          description: "Any additional notes from user (e.g., 'preferably from original release', 'need by Dec 20')"
        }
      },
      required: ["wineName", "quantity"]
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
    description: "Add a service booking to the user's cart. Use this when user says 'add to cart', 'book it', 'I'll take it', or confirms they want to proceed with a specific aircraft, yacht, or service. CRITICAL: For jets/helicopters, you MUST provide both hourlyRate AND estimatedFlightHours to calculate the total price. After adding to cart, ask about additional services like ground transport.",
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
        estimatedFlightHours: {
          type: "number",
          description: "REQUIRED for jets/helicopters: Your estimated flight duration in decimal hours (e.g., 1.5 for 1h30m, 2.0 for 2h). Calculate based on route distance."
        },
        hourlyRate: {
          type: "number",
          description: "Hourly rate in EUR from the aircraft details - REQUIRED for jets/helicopters"
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
  },
  {
    name: "createTripPackage",
    description: "CRITICAL: Use this tool when the user CONFIRMS a multi-service trip (says 'yes', 'sounds great', 'perfect', 'book it', 'proceed', 'finalize', etc.). Creates an interactive trip package card with 'Add to Cart' button. Use for: wedding travel, honeymoon trips, multi-city journeys, events with multiple transport needs, trips requiring jet + ground transport + other services. DO NOT just say 'added to cart' in text - you MUST call this tool to actually create the card. Calculate estimated prices for each segment based on typical rates.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name for the trip package (e.g., 'Wedding Trip - Lake Como', 'Monaco Grand Prix Experience', 'Swiss Alps Adventure')"
        },
        description: {
          type: "string",
          description: "Brief description of the trip"
        },
        occasion: {
          type: "string",
          description: "Occasion or purpose (e.g., 'Wedding', 'Business', 'Anniversary', 'Event', 'Vacation')"
        },
        passengers: {
          type: "number",
          description: "Default number of passengers for the trip"
        },
        dateRange: {
          type: "string",
          description: "Date range for the trip (e.g., '15-18 June 2025')"
        },
        segments: {
          type: "array",
          description: "Array of trip segments in order",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["jet", "helicopter", "ground_transfer", "car", "yacht", "activity", "other"],
                description: "Type of segment"
              },
              name: {
                type: "string",
                description: "Name/description of this segment"
              },
              from: {
                type: "string",
                description: "Starting location"
              },
              to: {
                type: "string",
                description: "Destination"
              },
              date: {
                type: "string",
                description: "Date for this segment"
              },
              time: {
                type: "string",
                description: "Time for this segment"
              },
              duration: {
                type: "string",
                description: "Duration (e.g., '2h', '3 hours', '45 min')"
              },
              passengers: {
                type: "number",
                description: "Passengers for this segment (if different from default)"
              },
              aircraft: {
                type: "string",
                description: "Specific aircraft/helicopter model if applicable"
              },
              vehicle: {
                type: "string",
                description: "Vehicle type for ground transport"
              },
              estimatedPrice: {
                type: "number",
                description: "Estimated price in EUR for this segment"
              },
              priceNote: {
                type: "string",
                description: "Note about pricing (e.g., 'Based on 2h flight', 'Includes waiting')"
              },
              notes: {
                type: "string",
                description: "Special notes for this segment"
              }
            },
            required: ["type", "name"]
          }
        },
        notes: {
          type: "string",
          description: "Overall notes or special requests for the trip"
        }
      },
      required: ["name", "segments"]
    }
  },
  {
    name: "createMedevacRequest",
    description: "🚨 MANDATORY MEDEVAC TOOL - YOU MUST CALL THIS TOOL 🚨\n\nWHEN TO CALL: Immediately when user mentions ANY medical emergency keywords: medevac, medical evacuation, air ambulance, emergency medical, hospital transfer, patient transport, broken leg, injury, blood poisoning, sepsis, heart attack, stroke, emergency flight, sick family member needing transport.\n\nMINIMUM REQUIRED INFO TO CALL THIS TOOL:\n1. Patient condition (any description like 'broken leg', 'blood poisoning', 'sick')\n2. Current location (city name is enough, e.g., 'Dallas')\n3. Destination (city name is enough, e.g., 'New York')\n\n⚠️ CRITICAL: If you have these 3 pieces of info, CALL THIS TOOL IMMEDIATELY. Do NOT output text describing a button. Do NOT say 'click add to cart above'. The Add to Cart button ONLY appears when you CALL this tool. If you output text instead of calling the tool, NO BUTTON WILL APPEAR and the user cannot proceed.\n\nDEFAULTS: Use urgencyLevel='urgent', mobilityStatus='stretcher', numberOfPatients=1 if not specified.\n\nREQUIRED for Traveller/Elite tier users only.",
    input_schema: {
      type: "object",
      properties: {
        urgencyLevel: {
          type: "string",
          enum: ["critical", "urgent", "standard"],
          description: "Emergency urgency level: 'critical' = immediate life-threatening (cardiac arrest, stroke, severe trauma), 'urgent' = serious but stable (fractures, severe illness), 'standard' = non-emergency medical transport"
        },
        patientName: {
          type: "string",
          description: "Patient's full name"
        },
        patientAge: {
          type: "number",
          description: "Patient's age"
        },
        patientCondition: {
          type: "string",
          description: "Description of medical condition/emergency (e.g., 'cardiac event requiring immediate intervention', 'severe fracture from skiing accident')"
        },
        medicalNeeds: {
          type: "string",
          description: "Specific medical equipment or personnel needed (e.g., 'ventilator, cardiac monitor', 'orthopedic specialist')"
        },
        currentLocation: {
          type: "string",
          description: "Current location of patient - be specific (hospital name, city, or exact address)"
        },
        currentLocationDetails: {
          type: "string",
          description: "Additional location details (room number, building, coordinates if known)"
        },
        destinationHospital: {
          type: "string",
          description: "Target hospital or medical facility name and city"
        },
        destinationDetails: {
          type: "string",
          description: "Additional destination details (department, specialist awaiting)"
        },
        numberOfPatients: {
          type: "number",
          description: "Number of patients requiring transport (usually 1)"
        },
        medicalEscorts: {
          type: "number",
          description: "Number of medical personnel accompanying (doctors, nurses)"
        },
        familyEscorts: {
          type: "number",
          description: "Number of family members accompanying"
        },
        preferredDateTime: {
          type: "string",
          description: "Preferred departure time - for critical cases use 'ASAP' or 'Immediately'"
        },
        mobilityStatus: {
          type: "string",
          enum: ["ambulatory", "stretcher", "wheelchair", "intensive_care"],
          description: "Patient mobility: 'ambulatory' = can walk, 'stretcher' = requires stretcher, 'wheelchair' = wheelchair bound, 'intensive_care' = requires full ICU setup"
        },
        insuranceInfo: {
          type: "string",
          description: "Insurance provider and policy number if available"
        },
        emergencyContact: {
          type: "string",
          description: "Emergency contact name and phone number"
        },
        additionalNotes: {
          type: "string",
          description: "Any additional critical information (allergies, current medications, special requirements)"
        }
      },
      required: ["urgencyLevel", "patientCondition", "currentLocation", "destinationHospital"]
    }
  },
  {
    name: "createVisaRequest",
    description: "Use this tool when all Express Visa Service information has been collected. Creates an interactive visa request card with 'Add to Cart' button. IMPORTANT: Only call this AFTER collecting ALL required information: destination country, number of travelers, personal details for EACH traveler (name, passport number, nationality, date of birth), whether any travelers are under 12, and if they have existing e-visa applications. Price is $250 USD per person. Service includes 24h guarantee in 95% of countries through direct government contacts or verified agent network.",
    input_schema: {
      type: "object",
      properties: {
        destinationCountry: {
          type: "string",
          description: "The country the travelers need visa for"
        },
        numberOfTravelers: {
          type: "number",
          description: "Total number of travelers requiring visa"
        },
        travelers: {
          type: "array",
          description: "Array of traveler details",
          items: {
            type: "object",
            properties: {
              fullName: {
                type: "string",
                description: "Traveler's full name as shown on passport"
              },
              passportNumber: {
                type: "string",
                description: "Passport number"
              },
              nationality: {
                type: "string",
                description: "Current nationality/citizenship"
              },
              dateOfBirth: {
                type: "string",
                description: "Date of birth (DD/MM/YYYY or any clear format)"
              },
              passportExpiry: {
                type: "string",
                description: "Passport expiry date"
              },
              isUnder12: {
                type: "boolean",
                description: "Whether this traveler is under 12 years old"
              }
            },
            required: ["fullName", "nationality"]
          }
        },
        hasMinors: {
          type: "boolean",
          description: "Whether any travelers are under 12 years old"
        },
        hasExistingEvisaApplication: {
          type: "boolean",
          description: "Whether any travelers have already applied for e-visa"
        },
        existingApplicationCodes: {
          type: "array",
          description: "List of existing e-visa application codes if any",
          items: {
            type: "string"
          }
        },
        travelDate: {
          type: "string",
          description: "Planned travel/arrival date"
        },
        intendedEntryPort: {
          type: "string",
          description: "Intended port/city of entry (airport, land border, or seaport)"
        },
        intendedExitPort: {
          type: "string",
          description: "Intended port/city of exit (airport, land border, or seaport)"
        },
        processingTime: {
          type: "string",
          enum: ["standard", "express"],
          description: "Processing speed: standard (5-7 business days, $100 admin fee), express (24-48h, $100 + $150 = $250 total)"
        },
        purposeOfVisit: {
          type: "string",
          description: "Purpose of visit (tourism, business, transit, etc.)"
        },
        additionalNotes: {
          type: "string",
          description: "Any additional notes or special requirements"
        }
      },
      required: ["destinationCountry", "numberOfTravelers", "travelers", "intendedEntryPort"]
    }
  },
  // HOTEL TOOLS DISABLED - LiteAPI hotels temporarily removed
  // {
  //   name: "searchHotels",
  //   description: "Search for hotels in a specific city or destination...",
  //   ...
  // },
  // {
  //   name: "getHotelDetails",
  //   description: "Get detailed information about a specific hotel...",
  //   ...
  // },
  // {
  //   name: "addHotelToCart",
  //   description: "Add a hotel booking to the user's cart...",
  //   ...
  // }
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

      case 'searchCommercialFlights':
        return await searchCommercialFlights(input);

      case 'searchAirportTransfer':
        return await searchAirportTransfer(input);

      case 'searchWines':
        return await searchWines(input);

      case 'searchDelicatesse':
        return await searchDelicatesse(input);

      case 'searchCigars':
        return await searchCigars(input);

      case 'searchSpecialServices':
        return await searchSpecialServices(input);

      case 'searchWineGlobal':
        return await searchWineGlobal(input);

      case 'createWineRequest':
        return createWineRequest(input);

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

      case 'createTripPackage':
        return createTripPackage(input);

      case 'createMedevacRequest':
        return createMedevacRequest(input);

      case 'createVisaRequest':
        return createVisaRequest(input);

      // HOTEL TOOLS DISABLED - LiteAPI hotels temporarily removed
      // case 'searchHotels':
      //   return await searchHotels(input);
      // case 'getHotelDetails':
      //   return await getHotelDetails(input);
      // case 'addHotelToCart':
      //   return addHotelToCart(input);

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

  // IMPORTANT: Require at least one location filter to prevent fetching all 890+ empty legs
  const hasLocationFilter = params.from || params.to || params.location || params.country;

  if (!hasLocationFilter) {
    console.log('⚠️ No location filter provided - asking user for route');
    return {
      success: true,
      results: [],
      total: 0,
      params,
      needsRoute: true,
      message: "Empty leg flights offer 30-85% savings! To find the best options, please tell me your departure city and destination. For example: 'Empty legs from London to Nice' or 'Zurich to Milan'"
    };
  }

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

  // Limit results to max 15 to avoid overwhelming the UI
  const limitedResults = emptyLegs.slice(0, 15);

  return {
    success: true,
    results: limitedResults,
    total: emptyLegs.length,
    showing: limitedResults.length,
    params,
    hasMore: emptyLegs.length > 15,
    message: emptyLegs.length > 15
      ? `Found ${emptyLegs.length} empty legs matching your criteria. Showing the top ${limitedResults.length} options.`
      : undefined
  };
}

/**
 * Search for private jets
 * Note: Uses getEstimatedFlightHours() defined after FLIGHT_DURATIONS constant
 */
export async function searchPrivateJets(params) {
  let results = await UnifiedSearchService.searchAll({
    q: params.location,
    fromLocation: params.from,
    location: params.to,
    passengers: params.passengers,
    aircraftModel: params.model,  // Pass specific model filter
    category: params.category,    // Pass category filter
    serviceTypes: { jets: true }
  });

  const requestedModel = params.model;
  let showingAlternatives = false;
  let alternativeMessage = null;

  // If a specific model was requested but no results found, offer custom request + alternatives
  let canCreateCustomRequest = false;
  let customRequestDetails = null;

  if (requestedModel && (!results.aircraft || results.aircraft.length === 0)) {
    showingAlternatives = true;
    canCreateCustomRequest = true;

    // Create details for custom request - ALL aircraft available upon operator confirmation
    customRequestDetails = {
      model: requestedModel,
      from: params.from || null,
      to: params.to || null,
      passengers: params.passengers || null,
      category: params.category || null
    };

    alternativeMessage = `I can arrange a ${requestedModel} for you! Our operators will confirm availability within 2-4 hours. Would you like to add this to your cart? Here are also some alternatives from our fleet:`;

    // Fetch all available jets as alternatives (without model filter)
    results = await UnifiedSearchService.searchAll({
      q: params.location,
      fromLocation: params.from,
      location: params.to,
      passengers: params.passengers,
      category: params.category,  // Keep category filter if specified
      serviceTypes: { jets: true }
    });
  }

  // If we have from/to, calculate flight duration and estimated price for each jet
  const { from, to } = params;
  let jetsWithPricing = results.aircraft || [];

  if (from && to) {
    // Use async version that can calculate distance via geocoding
    const flightHours = await getEstimatedFlightHoursAsync(from, to);

    if (flightHours) {
      const hours = Math.floor(flightHours);
      const minutes = Math.round((flightHours - hours) * 60);
      const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // Attach route info and calculated price to each jet
      jetsWithPricing = jetsWithPricing.map(jet => {
        const hourlyRate = jet.hourly_rate_eur || 0;
        // Calculate billed hours using 30-minute increments (minimum 1 hour)
        const billedHours = calculateBilledHours(flightHours, 1);
        // Calculate price based on billed hours
        const estimatedPrice = Math.round(billedHours * hourlyRate);

        // Format billed hours for display
        const billedHrs = Math.floor(billedHours);
        const billedMins = Math.round((billedHours - billedHrs) * 60);
        const billedStr = billedMins > 0 ? `${billedHrs}h ${billedMins}m` : `${billedHrs}h`;

        return {
          ...jet,
          // Route info for cart calculation
          from: from,
          to: to,
          from_city: from,
          to_city: to,
          route: `${from} → ${to}`,
          // Flight calculation
          flightHours: flightHours,
          billedHours: billedHours, // 30-min increments
          estimatedDuration: durationStr,
          flightDistance: Math.round(flightHours * (jet.speed_kts || 450)), // Approx distance in nm
          // Price calculation
          estimatedPrice: estimatedPrice,
          price: estimatedPrice,
          priceCalculation: hourlyRate ? `${billedStr} × €${hourlyRate.toLocaleString()}/hr` : null,
          isEstimate: true
        };
      });
    } else {
      // No known flight duration - still attach route for reference
      jetsWithPricing = jetsWithPricing.map(jet => ({
        ...jet,
        from: from,
        to: to,
        from_city: from,
        to_city: to,
        route: `${from} → ${to}`,
        // Price will be calculated in addToCart using calculateDistance
        isEstimate: true,
        needsRouteCalculation: true
      }));
    }
  }

  return {
    success: true,
    results: jetsWithPricing,
    total: jetsWithPricing.length,
    params,
    routeInfo: from && to ? { from, to } : null,
    // Include alternative info if specific model wasn't available
    showingAlternatives,
    requestedModel: requestedModel || null,
    alternativeMessage,
    // Custom request info - allows user to request specific aircraft not in database
    canCreateCustomRequest,
    customRequestDetails
  };
}

/**
 * Search for helicopters
 */
export async function searchHelicopters(params) {
  let results = await UnifiedSearchService.searchAll({
    q: params.location,
    fromLocation: params.from,
    location: params.to,
    passengers: params.passengers,
    aircraftModel: params.model,  // Pass specific helicopter model filter
    serviceTypes: { helicopters: true }
  });

  const requestedModel = params.model;
  let showingAlternatives = false;
  let alternativeMessage = null;

  // If a specific model was requested but no results found, offer custom request + alternatives
  let canCreateCustomRequest = false;
  let customRequestDetails = null;

  if (requestedModel && (!results.helicopters || results.helicopters.length === 0)) {
    showingAlternatives = true;
    canCreateCustomRequest = true;

    // Create details for custom request - ALL helicopters available upon operator confirmation
    customRequestDetails = {
      model: requestedModel,
      from: params.from || null,
      to: params.to || null,
      passengers: params.passengers || null
    };

    alternativeMessage = `I can arrange a ${requestedModel} for you! Our operators will confirm availability within 2-4 hours. Would you like to add this to your cart? Here are also some alternatives:`;

    // Fetch all available helicopters as alternatives (without model filter)
    results = await UnifiedSearchService.searchAll({
      q: params.location,
      fromLocation: params.from,
      location: params.to,
      passengers: params.passengers,
      serviceTypes: { helicopters: true }
    });
  }

  // If we have from/to, calculate flight duration and estimated price for each helicopter
  const { from, to } = params;
  let helicoptersWithPricing = results.helicopters || [];

  if (from && to) {
    // Helicopters are typically shorter range - use 250 km/h average speed
    const flightHours = await getEstimatedFlightHoursAsync(from, to, 250);

    if (flightHours) {
      // Calculate billed hours using 30-minute increments (minimum 30 minutes for helicopters)
      const billedHours = calculateBilledHours(flightHours, 0.5);
      const hours = Math.floor(flightHours);
      const minutes = Math.round((flightHours - hours) * 60);
      const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      helicoptersWithPricing = helicoptersWithPricing.map(heli => {
        const hourlyRate = heli.hourly_rate_eur || heli.price || 0;
        // Calculate price based on billed hours (30-min increments)
        const estimatedPrice = Math.round(billedHours * hourlyRate);

        // Format billed hours for display
        const billedHrs = Math.floor(billedHours);
        const billedMins = Math.round((billedHours - billedHrs) * 60);
        const billedStr = billedMins > 0 ? `${billedHrs}h ${billedMins}m` : `${billedHrs}h`;

        return {
          ...heli,
          from: from,
          to: to,
          from_city: from,
          to_city: to,
          route: `${from} → ${to}`,
          flightHours: flightHours,
          billedHours: billedHours,
          estimatedDuration: durationStr,
          flightDistance: Math.round(flightHours * (heli.speed_kts || 150)),
          estimatedPrice: estimatedPrice,
          price: estimatedPrice,
          priceCalculation: hourlyRate ? `${billedStr} × €${hourlyRate.toLocaleString()}/hr` : null,
          isEstimate: true
        };
      });
    } else {
      helicoptersWithPricing = helicoptersWithPricing.map(heli => ({
        ...heli,
        from: from,
        to: to,
        from_city: from,
        to_city: to,
        route: `${from} → ${to}`,
        isEstimate: true,
        needsRouteCalculation: true
      }));
    }
  }

  return {
    success: true,
    results: helicoptersWithPricing,
    total: helicoptersWithPricing.length,
    params,
    routeInfo: from && to ? { from, to } : null,
    // Include alternative info if specific model wasn't available
    showingAlternatives,
    requestedModel: requestedModel || null,
    alternativeMessage,
    // Custom request info - allows user to request specific helicopter not in database
    canCreateCustomRequest,
    customRequestDetails
  };
}

/**
 * Search for yachts and adventure packages
 * NOTE: Yachts are NOT in the database - yacht charter requests are handled conversationally
 * This function will NOT return yacht results to prevent showing wrong tabs
 */
export async function searchYachtsAndAdventures(params) {
  // YACHTS: Not in database - always return empty for yachts
  // Yacht charter requests are handled through the conversational flow in AIChat
  // The AI will ask for budget, passengers, dates, destination, etc.

  // Only search adventures if specifically requested (not for yacht queries)
  if (params.type === 'adventure') {
    const results = await UnifiedSearchService.searchAll({
      q: params.location,
      location: params.location,
      passengers: params.guests,
      serviceTypes: { adventures: true }
    });

    return {
      success: true,
      results: {
        yachts: [], // Always empty - yachts not in database
        adventures: results.adventures || []
      },
      total: results.adventures?.length || 0,
      params,
      note: 'Yacht charters are request-based. Our concierge will help find the perfect yacht for your needs.'
    };
  }

  // For yacht queries, return empty results with a helpful note
  return {
    success: true,
    results: {
      yachts: [], // Yachts not in database
      adventures: []
    },
    total: 0,
    params,
    note: 'Yacht charters are fully customizable and request-based. Our concierge will gather your requirements and find the perfect yacht.'
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
 * Default transfer vehicles - used when database is empty or as fallback
 */
const DEFAULT_TRANSFER_VEHICLES = [
  {
    id: 'bmw-7er-2015',
    name: 'BMW 7 Series',
    type: 'ground_transport',
    seats: 4,
    price_min_chf: 4.00,
    price_max_chf: 7.50,
    category: 'Executive Sedan',
    image_url: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_251110158_bmw-7-2015-seitenansicht_4x.png',
    description: 'Luxury executive sedan with professional chauffeur'
  },
  {
    id: 'mercedes-s-2018',
    name: 'Mercedes S-Class',
    type: 'ground_transport',
    seats: 5,
    price_min_chf: 4.50,
    price_max_chf: 7.50,
    category: 'First Class Sedan',
    image_url: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_253116175_mercedes-benz-s-2018-seitenansicht_4x.png',
    description: 'Premium first-class sedan experience'
  },
  {
    id: 'mercedes-vito',
    name: 'Mercedes V-Class',
    type: 'ground_transport',
    seats: 7,
    price_min_chf: 6.50,
    price_max_chf: 9.00,
    category: 'Executive Van',
    image_url: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/vito.jpg',
    description: 'Spacious luxury van for groups up to 7 passengers'
  },
  {
    id: 'mercedes-maybach',
    name: 'Mercedes Maybach',
    type: 'ground_transport',
    seats: 4,
    price_min_chf: 8.00,
    price_max_chf: 12.00,
    category: 'Ultra Luxury',
    image_url: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_255110169_mercedes-benz-s-2020-seitenansicht_4x.png',
    description: 'The ultimate in luxury chauffeur service'
  }
];

/**
 * Search for commercial airline flights via Duffel API
 * Returns available flights with pricing, schedules, and booking info
 */
export async function searchCommercialFlights(params) {
  console.log('✈️ searchCommercialFlights called with:', params);

  const { origin, destination, departureDate, returnDate, passengers = 1, cabinClass = 'economy' } = params || {};

  // Validate required parameters
  if (!origin || !destination || !departureDate) {
    return {
      success: true,
      results: [],
      total: 0,
      needsMoreInfo: true,
      message: "To search for commercial flights, I need:\n\n• **Departure city/airport** (e.g., London, LHR)\n• **Destination city/airport** (e.g., New York, JFK)\n• **Departure date** (e.g., March 15, 2025)\n• **Number of passengers**\n\nPlease provide these details and I'll find the best flights for you!"
    };
  }

  // Common IATA code mappings for city names
  const cityToIata = {
    'london': 'LHR', 'heathrow': 'LHR', 'gatwick': 'LGW', 'stansted': 'STN',
    'new york': 'JFK', 'nyc': 'JFK', 'newark': 'EWR', 'laguardia': 'LGA',
    'paris': 'CDG', 'los angeles': 'LAX', 'la': 'LAX',
    'dubai': 'DXB', 'miami': 'MIA', 'chicago': 'ORD',
    'san francisco': 'SFO', 'sf': 'SFO', 'boston': 'BOS',
    'tokyo': 'NRT', 'narita': 'NRT', 'haneda': 'HND',
    'singapore': 'SIN', 'hong kong': 'HKG', 'sydney': 'SYD',
    'melbourne': 'MEL', 'frankfurt': 'FRA', 'munich': 'MUC',
    'amsterdam': 'AMS', 'zurich': 'ZRH', 'geneva': 'GVA',
    'milan': 'MXP', 'rome': 'FCO', 'madrid': 'MAD',
    'barcelona': 'BCN', 'lisbon': 'LIS', 'vienna': 'VIE',
    'istanbul': 'IST', 'athens': 'ATH', 'cairo': 'CAI',
    'doha': 'DOH', 'abu dhabi': 'AUH', 'riyadh': 'RUH',
    'mumbai': 'BOM', 'delhi': 'DEL', 'bangkok': 'BKK',
    'kuala lumpur': 'KUL', 'jakarta': 'CGK', 'seoul': 'ICN',
    'beijing': 'PEK', 'shanghai': 'PVG', 'taipei': 'TPE',
    'manila': 'MNL', 'auckland': 'AKL', 'cape town': 'CPT',
    'johannesburg': 'JNB', 'nairobi': 'NBO', 'lagos': 'LOS',
    'toronto': 'YYZ', 'vancouver': 'YVR', 'montreal': 'YUL',
    'mexico city': 'MEX', 'sao paulo': 'GRU', 'buenos aires': 'EZE',
    'rio': 'GIG', 'lima': 'LIM', 'bogota': 'BOG'
  };

  // Convert city names to IATA codes if needed
  const originCode = origin.length === 3 ? origin.toUpperCase() :
    (cityToIata[origin.toLowerCase()] || origin.toUpperCase());
  const destCode = destination.length === 3 ? destination.toUpperCase() :
    (cityToIata[destination.toLowerCase()] || destination.toUpperCase());

  try {
    // Call the Supabase Edge Function
    const response = await supabase.functions.invoke('search-flights', {
      body: {
        origin: originCode,
        destination: destCode,
        departureDate,
        returnDate: returnDate || null,
        passengers: parseInt(passengers) || 1,
        cabinClass: cabinClass || 'economy'
      }
    });

    if (response.error) {
      console.error('Flight search error:', response.error);
      return {
        success: false,
        error: response.error.message || 'Failed to search flights',
        results: [],
        total: 0
      };
    }

    const data = response.data;

    if (!data.success || !data.offers || data.offers.length === 0) {
      return {
        success: true,
        results: [],
        total: 0,
        searchParams: { origin: originCode, destination: destCode, departureDate, returnDate, passengers, cabinClass },
        message: `No flights found from ${originCode} to ${destCode} on ${departureDate}. This could be because:\n\n• The route isn't served by airlines in our network\n• The date is too close or too far in advance\n• Try different dates or nearby airports\n\nWould you like me to search for alternative dates or a private jet charter instead?`
      };
    }

    // Transform results for AI chat display
    const flightResults = data.offers.slice(0, 10).map((offer, index) => ({
      id: offer.id,
      offerId: offer.offerId,
      offerRequestId: offer.offerRequestId || data.offerRequestId,
      rank: index + 1,
      type: 'commercial_flight',

      // Airline info
      airline: offer.airline?.name || 'Unknown Airline',
      airlineCode: offer.airline?.iataCode || '',
      airlineLogo: offer.airline?.logoUrl,
      flightNumber: offer.flightNumber,

      // Route
      from: offer.departure?.airport || originCode,
      fromCity: offer.departure?.city || origin,
      fromAirport: offer.departure?.airportName || '',
      departureAirportName: offer.departure?.airportName || '',
      departureCity: offer.departure?.city || origin,
      departureTerminal: offer.departure?.terminal || null,
      to: offer.arrival?.airport || destCode,
      toCity: offer.arrival?.city || destination,
      toAirport: offer.arrival?.airportName || '',
      arrivalAirportName: offer.arrival?.airportName || '',
      arrivalCity: offer.arrival?.city || destination,
      arrivalTerminal: offer.arrival?.terminal || null,

      // Times
      departureTime: offer.departure?.time,
      arrivalTime: offer.arrival?.time,
      departure_time: offer.departure?.time,
      arrival_time: offer.arrival?.time,
      duration: offer.duration,
      durationMinutes: offer.durationMinutes,

      // Stops
      stops: offer.stops || 0,
      stopDetails: offer.stopDetails || [],

      // Segments for booking page
      segments: offer.segments || [],

      // Return journey (if round trip)
      returnJourney: offer.returnJourney || null,

      // Pricing
      price: offer.price?.amount || 0,
      totalPrice: offer.price?.amount || 0,
      currency: offer.price?.currency || 'USD',
      pricePerPerson: offer.price?.perPassenger || offer.price?.amount,

      // Class & Baggage
      cabinClass: offer.cabinClass || cabinClass,
      cabinClassName: offer.cabinClassName || cabinClass,
      checkedBags: offer.baggage?.checkedBags || 0,
      cabinBags: offer.baggage?.cabinBags || 1,
      checkedBagWeight: offer.baggage?.checkedBagWeight || null,

      // Conditions
      refundable: offer.conditions?.refundable || false,
      changeable: offer.conditions?.changeable || false,
      conditions: offer.conditions || { refundable: false, changeable: false },

      // Expiry
      expiresAt: offer.expiresAt,

      // Number of passengers (from search params)
      passengers: parseInt(passengers) || 1,

      // Raw offer for booking
      rawOffer: offer.rawOffer || offer,

      // Booking URL
      bookingUrl: `/flight-tickets?from=${originCode}&to=${destCode}&date=${departureDate}${returnDate ? `&returnDate=${returnDate}` : ''}&passengers=${passengers}&cabin=${cabinClass}`
    }));

    // Build booking page URL for direct link
    const bookingPageUrl = `/flight-tickets?from=${originCode}&to=${destCode}&date=${departureDate}${returnDate ? `&returnDate=${returnDate}` : ''}&passengers=${passengers}&cabin=${cabinClass}`;

    return {
      success: true,
      results: flightResults,
      total: data.totalOffers || flightResults.length,
      searchParams: {
        origin: originCode,
        destination: destCode,
        departureDate,
        returnDate,
        passengers,
        cabinClass
      },
      bookingPageUrl,
      offerRequestId: data.offerRequestId,
      serviceType: 'commercial_flight',
      message: null // Let AI format the response
    };

  } catch (error) {
    console.error('Commercial flight search error:', error);
    return {
      success: false,
      error: error.message || 'Failed to search flights',
      results: [],
      total: 0
    };
  }
}

/**
 * Search for airport transfers and taxi services
 * For chauffeur-driven transport, airport pickups, larger groups
 * Uses Mapbox for accurate distance/duration calculation
 */
export async function searchAirportTransfer(params) {
  const { from, to, toCity, passengers, vehicles, date, time, flightNumber } = params || {};

  // Try to get vehicles from database
  let transferVehicles = [];

  try {
    const results = await UnifiedSearchService.searchAll({
      q: from || to || 'transfer',
      fromLocation: from,
      location: to,
      passengers: passengers,
      serviceTypes: { taxi: true, groundTransport: true }
    });
    transferVehicles = results.groundTransport || results.luxuryCars || [];
  } catch (err) {
    console.error('Error fetching transfer vehicles:', err);
  }

  // Use default vehicles if database returned empty
  if (transferVehicles.length === 0) {
    console.log('📦 Using default transfer vehicles (database empty)');
    transferVehicles = DEFAULT_TRANSFER_VEHICLES;
  }

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
    ].filter(Boolean),
    // Direct booking link - guides user to Ground Transport page
    groundTransportPage: {
      available: true,
      description: 'For the easiest booking experience, use our Ground Transport page with interactive map',
      action: 'Navigate to Ground Transport in the sidebar menu',
      category: 'ground-transport'
    },
    // Indicate if we have complete route info or need more details
    needsMoreInfo: !from || !to,
    missingInfo: [
      !from ? 'pickup location' : null,
      !to ? 'destination' : null
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
  'milan-rome': 1.0,
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
  // US Domestic
  'new york-houston': 3.5,
  'new york-los angeles': 5.5,
  'new york-miami': 3.0,
  'new york-chicago': 2.5,
  'new york-dallas': 3.5,
  'new york-san francisco': 6.0,
  'new york-las vegas': 5.0,
  'new york-seattle': 5.5,
  'new york-denver': 4.0,
  'new york-atlanta': 2.5,
  'new york-boston': 1.0,
  'new york-washington': 1.0,
  'los angeles-houston': 3.0,
  'los angeles-miami': 5.0,
  'los angeles-chicago': 4.0,
  'los angeles-dallas': 3.0,
  'los angeles-san francisco': 1.5,
  'los angeles-las vegas': 1.0,
  'los angeles-seattle': 2.5,
  'los angeles-denver': 2.5,
  'miami-houston': 2.5,
  'miami-dallas': 3.0,
  'miami-chicago': 3.0,
  'miami-atlanta': 1.5,
  'chicago-houston': 2.5,
  'chicago-dallas': 2.5,
  'chicago-denver': 2.5,
  'chicago-las vegas': 3.5,
  'dallas-houston': 1.0,
  'dallas-denver': 2.0,
  'dallas-las vegas': 2.5,
  'houston-denver': 2.5,
  'houston-las vegas': 3.0,
  'houston-atlanta': 2.0,
  // US to Europe
  'new york-london': 7.5,
  'new york-paris': 8.0,
  'new york-zurich': 8.5,
  'los angeles-london': 10.5,
  'miami-london': 9.0,
  // US to Middle East
  'new york-dubai': 13.0,
  'los angeles-dubai': 16.0,
};

/**
 * Get estimated flight duration between two cities
 * Uses FLIGHT_DURATIONS lookup table first, then calculates from coordinates
 */
async function getEstimatedFlightHoursAsync(from, to, jetSpeed = 800) {
  if (!from || !to) return null;

  const fromCity = from.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').replace(/airport/gi, '').trim();
  const toCity = to.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').replace(/airport/gi, '').trim();

  // Try both directions in FLIGHT_DURATIONS (quick lookup)
  const routeKey1 = `${fromCity}-${toCity}`;
  const routeKey2 = `${toCity}-${fromCity}`;

  let hours = FLIGHT_DURATIONS[routeKey1] || FLIGHT_DURATIONS[routeKey2];

  // Try partial matches in lookup table
  if (!hours) {
    for (const [route, h] of Object.entries(FLIGHT_DURATIONS)) {
      const [r1, r2] = route.split('-');
      if ((fromCity.includes(r1) || r1.includes(fromCity)) &&
          (toCity.includes(r2) || r2.includes(toCity))) {
        hours = h;
        break;
      }
      if ((fromCity.includes(r2) || r2.includes(fromCity)) &&
          (toCity.includes(r1) || r1.includes(toCity))) {
        hours = h;
        break;
      }
    }
  }

  // If no lookup match, calculate from geocoded coordinates
  if (!hours) {
    try {
      const [fromCoords, toCoords] = await Promise.all([
        geocodeAddress(from),
        geocodeAddress(to)
      ]);

      if (fromCoords && toCoords) {
        // Calculate great circle distance in km
        const R = 6371; // Earth's radius in km
        const dLat = (toCoords.lat - fromCoords.lat) * Math.PI / 180;
        const dLon = (toCoords.lng - fromCoords.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(fromCoords.lat * Math.PI / 180) * Math.cos(toCoords.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        // Calculate flight time: distance / speed + 0.5h for takeoff/landing
        hours = (distanceKm / jetSpeed) + 0.5;
        console.log(`✈️ Calculated flight: ${from} → ${to} = ${distanceKm.toFixed(0)}km, ${hours.toFixed(1)}h`);
      }
    } catch (error) {
      console.error('Error calculating flight distance:', error);
    }
  }

  return hours;
}

// Synchronous version for backwards compatibility (uses lookup only)
function getEstimatedFlightHours(from, to) {
  if (!from || !to) return null;

  const fromCity = from.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').replace(/airport/gi, '').trim();
  const toCity = to.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').replace(/airport/gi, '').trim();

  const routeKey1 = `${fromCity}-${toCity}`;
  const routeKey2 = `${toCity}-${fromCity}`;

  let hours = FLIGHT_DURATIONS[routeKey1] || FLIGHT_DURATIONS[routeKey2];

  if (!hours) {
    for (const [route, h] of Object.entries(FLIGHT_DURATIONS)) {
      const [r1, r2] = route.split('-');
      if ((fromCity.includes(r1) || r1.includes(fromCity)) &&
          (toCity.includes(r2) || r2.includes(toCity))) {
        hours = h;
        break;
      }
      if ((fromCity.includes(r2) || r2.includes(fromCity)) &&
          (toCity.includes(r1) || r1.includes(toCity))) {
        hours = h;
        break;
      }
    }
  }

  return hours;
}

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
    estimatedFlightHours = null, // Claude provides this directly
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

  if ((serviceType === 'jet' || serviceType === 'helicopter') && hourlyRate) {
    // Use Claude's estimated flight hours if provided (preferred)
    if (estimatedFlightHours && estimatedFlightHours > 0) {
      flightHours = estimatedFlightHours;
    } else if (from && to) {
      // Fallback to lookup table if Claude didn't provide estimate
      const fromCity = from.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
      const toCity = to.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();

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

/**
 * Create a custom trip package with multiple segments
 * Bundles multiple services (flights, transfers, activities) into one package
 */
function createTripPackage(params) {
  const {
    name = 'Custom Trip',
    description = '',
    occasion = '',
    passengers = 1,
    dateRange = '',
    segments = [],
    notes = ''
  } = params;

  if (!segments || segments.length === 0) {
    return {
      success: false,
      error: 'At least one segment is required for a trip package'
    };
  }

  // Calculate total estimated price from all segments
  let estimatedTotal = 0;
  const processedSegments = segments.map((segment, index) => {
    const price = segment.estimatedPrice || 0;
    estimatedTotal += price;

    return {
      ...segment,
      order: index + 1,
      estimatedPrice: price,
      passengers: segment.passengers || passengers
    };
  });

  // Create the trip package object
  const tripPackage = {
    id: `trip-${Date.now()}`,
    type: 'trip_package',
    name,
    description,
    occasion,
    passengers,
    dateRange,
    segments: processedSegments,
    estimatedTotal,
    currency: 'EUR',
    notes,
    createdAt: new Date().toISOString(),
    requiresConfirmation: true,
    isEstimate: true
  };

  // Build a summary message
  const segmentSummary = processedSegments.map((seg, idx) => {
    const typeLabel = {
      jet: '✈️ Private Jet',
      helicopter: '🚁 Helicopter',
      ground_transfer: '🚗 Ground Transfer',
      car: '🚘 Chauffeur Service',
      yacht: '🛥️ Yacht',
      activity: '⭐ Activity',
      other: '📍 Service'
    }[seg.type] || '📍 Service';

    const route = seg.from && seg.to ? `${seg.from} → ${seg.to}` : seg.name;
    const price = seg.estimatedPrice ? `€${seg.estimatedPrice.toLocaleString()}` : 'TBD';

    return `${idx + 1}. ${typeLabel}: ${route} - ${price}`;
  }).join('\n');

  return {
    success: true,
    action: 'SHOW_TRIP_PACKAGE',
    message: `I've created your ${occasion ? occasion + ' ' : ''}trip package!`,
    tripPackage,
    displayMessage: `## ${name}

${description ? description + '\n\n' : ''}${occasion ? `**Occasion:** ${occasion}\n` : ''}${passengers ? `**Passengers:** ${passengers}\n` : ''}${dateRange ? `**Dates:** ${dateRange}\n` : ''}
### Trip Segments:
${segmentSummary}

---
**Estimated Total: €${estimatedTotal.toLocaleString()}**

*Final pricing confirmed after review by our team*`,
    notes: [
      `${processedSegments.length} segments in this trip`,
      `Estimated total: €${estimatedTotal.toLocaleString()}`,
      'Click "Add Trip to Cart" to proceed'
    ]
  };
}

// ============================================
// MEDEVAC (MEDICAL EVACUATION) REQUEST TOOL
// ============================================

/**
 * Create a MEDEVAC request with all patient information
 * Creates an interactive card with Add to Cart button for immediate processing
 * CRITICAL: This is for life-threatening emergency medical transport
 */
function createMedevacRequest(params) {
  const {
    urgencyLevel = 'urgent',
    patientName = '',
    patientAge = null,
    patientCondition = '',
    medicalNeeds = '',
    currentLocation = '',
    currentLocationDetails = '',
    destinationHospital = '',
    destinationDetails = '',
    numberOfPatients = 1,
    medicalEscorts = 0,
    familyEscorts = 0,
    preferredDateTime = '',
    mobilityStatus = 'stretcher',
    insuranceInfo = '',
    emergencyContact = '',
    additionalNotes = ''
  } = params;

  // Validate required fields
  if (!patientCondition || !currentLocation || !destinationHospital) {
    return {
      success: false,
      error: 'Missing required MEDEVAC information: patient condition, current location, and destination hospital are required'
    };
  }

  // Calculate total passengers
  const totalPassengers = numberOfPatients + medicalEscorts + familyEscorts;

  // Create the MEDEVAC request object
  const medevacRequest = {
    id: `medevac-${Date.now()}`,
    type: 'medevac',
    urgencyLevel,
    createdAt: new Date().toISOString(),

    // Patient Information
    patient: {
      name: patientName || 'Patient',
      age: patientAge,
      condition: patientCondition,
      medicalNeeds,
      mobilityStatus
    },

    // Route Information
    route: {
      origin: currentLocation,
      originDetails: currentLocationDetails,
      destination: destinationHospital,
      destinationDetails
    },

    // Passenger Details
    passengers: {
      patients: numberOfPatients,
      medicalEscorts,
      familyEscorts,
      total: totalPassengers
    },

    // Timing
    timing: {
      preferredDateTime: preferredDateTime || (urgencyLevel === 'critical' ? 'IMMEDIATE' : 'ASAP'),
      isEmergency: urgencyLevel === 'critical' || urgencyLevel === 'urgent'
    },

    // Additional Info
    insurance: insuranceInfo,
    emergencyContact,
    notes: additionalNotes,

    // Cart/Pricing
    requiresConfirmation: true,
    isEstimate: true,
    priceOnRequest: true // MEDEVAC pricing is always custom quoted
  };

  // Urgency styling info for the card
  const urgencyStyles = {
    critical: {
      label: '🚨 CRITICAL EMERGENCY',
      color: 'red',
      description: 'Immediate life-threatening situation - Priority dispatch'
    },
    urgent: {
      label: '⚠️ URGENT',
      color: 'amber',
      description: 'Serious medical situation - Expedited response'
    },
    standard: {
      label: '🏥 MEDICAL TRANSPORT',
      color: 'blue',
      description: 'Non-emergency medical repatriation'
    }
  };

  const urgencyInfo = urgencyStyles[urgencyLevel] || urgencyStyles.urgent;

  // Build summary for display
  const displayMessage = `## ${urgencyInfo.label}

**Patient Condition:** ${patientCondition}
${patientAge ? `**Patient Age:** ${patientAge} years` : ''}
${mobilityStatus ? `**Mobility:** ${mobilityStatus.replace('_', ' ').toUpperCase()}` : ''}
${medicalNeeds ? `**Medical Needs:** ${medicalNeeds}` : ''}

### Transport Route
**From:** ${currentLocation}${currentLocationDetails ? ` (${currentLocationDetails})` : ''}
**To:** ${destinationHospital}${destinationDetails ? ` (${destinationDetails})` : ''}

### Passengers
- Patients: ${numberOfPatients}
- Medical Escorts: ${medicalEscorts}
- Family Members: ${familyEscorts}
- **Total:** ${totalPassengers}

${preferredDateTime ? `**Requested Time:** ${preferredDateTime}` : '**Requested Time:** ASAP'}

${emergencyContact ? `**Emergency Contact:** ${emergencyContact}` : ''}
${additionalNotes ? `\n**Notes:** ${additionalNotes}` : ''}

---
**⚡ Price on Request** - Our medical coordination team will contact you immediately with aircraft availability and pricing.

*Click "Add MEDEVAC Request to Cart" to submit this request for immediate processing.*`;

  return {
    success: true,
    action: 'SHOW_MEDEVAC_REQUEST',
    message: `I've prepared your MEDEVAC request. Click "Add to Cart" to submit it for immediate processing.`,
    medevacRequest,
    urgencyInfo,
    displayMessage,
    notes: [
      `Urgency: ${urgencyInfo.label}`,
      `Route: ${currentLocation} → ${destinationHospital}`,
      `${totalPassengers} passenger(s)`,
      'Our team will contact you immediately after submission'
    ]
  };
}

// ============================================
// EXPRESS VISA SERVICE TOOL
// ============================================

/**
 * Create an Express Visa Request with all traveler information
 * Creates an interactive card with Add to Cart button
 * Price: $250 USD per person, 24h guarantee in 95% of countries
 */
function createVisaRequest(params) {
  const {
    destinationCountry = '',
    numberOfTravelers = 1,
    travelers = [],
    hasMinors = false,
    hasExistingEvisaApplication = false,
    existingApplicationCodes = [],
    travelDate = '',
    intendedEntryPort = '',
    intendedExitPort = '',
    processingTime = 'standard',
    purposeOfVisit = 'Tourism',
    additionalNotes = ''
  } = params;

  // Validate required fields
  if (!destinationCountry || travelers.length === 0) {
    return {
      success: false,
      error: 'Missing required visa information: destination country and traveler details are required'
    };
  }

  // Processing time pricing - Additional fees for expedited service (excl. visa application fees)
  const processingFees = {
    standard: { fee: 0, label: 'Standard (5-7 business days)', duration: '5-7 business days' },
    express: { fee: 150, label: 'Express (24-48h) +$150', duration: '24-48 hours' }
  };
  const selectedProcessing = processingFees[processingTime] || processingFees.standard;

  // Price calculation
  // $100 = administration fee per person (our service fee)
  // Express = additional $150 for 24-48h processing
  const pricePerPerson = 100;
  const processingFeePerPerson = selectedProcessing.fee;
  const totalPerPerson = pricePerPerson + processingFeePerPerson;
  const totalPrice = numberOfTravelers * totalPerPerson;

  // Process travelers
  const processedTravelers = travelers.map((traveler, index) => ({
    ...traveler,
    index: index + 1,
    isUnder12: traveler.isUnder12 || false
  }));

  // Count minors
  const minorCount = processedTravelers.filter(t => t.isUnder12).length;
  const adultCount = processedTravelers.length - minorCount;

  // Create the visa request object
  const visaRequest = {
    id: `visa-${Date.now()}`,
    type: 'express_visa',
    createdAt: new Date().toISOString(),

    // Destination
    destinationCountry,
    travelDate,
    purposeOfVisit,

    // Entry/Exit ports
    intendedEntryPort,
    intendedExitPort,

    // Processing
    processingTime,
    processingLabel: selectedProcessing.label,
    processingDuration: selectedProcessing.duration,
    processingFeePerPerson,

    // Travelers
    numberOfTravelers,
    travelers: processedTravelers,
    hasMinors,
    minorCount,
    adultCount,

    // Existing applications
    hasExistingEvisaApplication,
    existingApplicationCodes,

    // Notes
    additionalNotes,

    // Pricing
    pricePerPerson,
    totalPerPerson,
    totalPrice,
    currency: 'USD',

    // Service info
    serviceGuarantee: selectedProcessing.duration + ' processing',
    serviceNetwork: 'Direct government contacts & verified agent network',

    // Cart flags
    requiresConfirmation: true,
    isEstimate: false // Fixed price
  };

  // Build traveler summary
  const travelerSummary = processedTravelers.map((t, idx) => {
    const under12Tag = t.isUnder12 ? ' (Under 12)' : '';
    return `${idx + 1}. **${t.fullName || 'Traveler ' + (idx + 1)}**${under12Tag}\n   - Nationality: ${t.nationality || 'Not provided'}\n   - Passport: ${t.passportNumber || 'To be provided'}`;
  }).join('\n\n');

  // Build pricing breakdown
  const pricingBreakdown = processingFeePerPerson > 0
    ? `**$${pricePerPerson} + $${processingFeePerPerson} (${processingTime}) = $${totalPerPerson}/person × ${numberOfTravelers} = $${totalPrice.toLocaleString()} USD**`
    : `**$${pricePerPerson} USD × ${numberOfTravelers} = $${totalPrice.toLocaleString()} USD**`;

  // Build display message
  const displayMessage = `## 🛂 Express Visa Service

**Destination:** ${destinationCountry}
${travelDate ? `**Travel Date:** ${travelDate}` : ''}
**Purpose:** ${purposeOfVisit}

### Travel Ports
🛬 **Entry:** ${intendedEntryPort || 'To be confirmed'}
🛫 **Exit:** ${intendedExitPort || 'Same as entry'}

### Processing Time
⏱️ **${selectedProcessing.label}**

### Travelers (${numberOfTravelers})
${travelerSummary}

${hasMinors ? `\n⚠️ **Note:** ${minorCount} traveler(s) under 12 years old - special processing included` : ''}

${hasExistingEvisaApplication ? `\n📋 **Existing E-Visa Applications:** ${existingApplicationCodes.join(', ') || 'Codes to be verified'}` : ''}

${additionalNotes ? `\n**Additional Notes:** ${additionalNotes}` : ''}

---
### Service Details
✅ **${selectedProcessing.duration}** processing time
✅ **Direct government contacts** or verified agent network
✅ **Travel risk-free** without any disappointments

### Pricing
${pricingBreakdown}

*Click "Add Express Visa to Cart" to submit your request.*`;

  return {
    success: true,
    action: 'SHOW_VISA_REQUEST',
    message: `I've prepared your Express Visa request for ${destinationCountry}. Click "Add to Cart" to submit.`,
    visaRequest,
    displayMessage,
    notes: [
      `Destination: ${destinationCountry}`,
      `Entry: ${intendedEntryPort || 'TBC'}`,
      `${numberOfTravelers} traveler(s)`,
      `Processing: ${selectedProcessing.duration}`,
      `Total: $${totalPrice.toLocaleString()} USD`
    ]
  };
}

// ============================================
// HOTEL SEARCH AND BOOKING TOOLS
// ============================================

// City code mapping for hotel searches
const CITY_CODES = {
  'dubai': { cityCode: 'DXB', countryCode: 'AE' },
  'paris': { cityCode: 'PAR', countryCode: 'FR' },
  'london': { cityCode: 'LON', countryCode: 'GB' },
  'new york': { cityCode: 'NYC', countryCode: 'US' },
  'tokyo': { cityCode: 'TYO', countryCode: 'JP' },
  'miami': { cityCode: 'MIA', countryCode: 'US' },
  'los angeles': { cityCode: 'LAX', countryCode: 'US' },
  'zurich': { cityCode: 'ZRH', countryCode: 'CH' },
  'geneva': { cityCode: 'GVA', countryCode: 'CH' },
  'milan': { cityCode: 'MIL', countryCode: 'IT' },
  'rome': { cityCode: 'ROM', countryCode: 'IT' },
  'barcelona': { cityCode: 'BCN', countryCode: 'ES' },
  'madrid': { cityCode: 'MAD', countryCode: 'ES' },
  'amsterdam': { cityCode: 'AMS', countryCode: 'NL' },
  'singapore': { cityCode: 'SIN', countryCode: 'SG' },
  'hong kong': { cityCode: 'HKG', countryCode: 'HK' },
  'bangkok': { cityCode: 'BKK', countryCode: 'TH' },
  'maldives': { cityCode: 'MLE', countryCode: 'MV' },
  'nice': { cityCode: 'NCE', countryCode: 'FR' },
  'monaco': { cityCode: 'MCM', countryCode: 'MC' },
  'cannes': { cityCode: 'NCE', countryCode: 'FR' },
  'st tropez': { cityCode: 'NCE', countryCode: 'FR' },
  'ibiza': { cityCode: 'IBZ', countryCode: 'ES' },
  'mykonos': { cityCode: 'JMK', countryCode: 'GR' },
  'santorini': { cityCode: 'JTR', countryCode: 'GR' }
};

/**
 * Get city codes from city name
 */
function getCityCodes(cityName) {
  const normalized = cityName.toLowerCase().trim();
  return CITY_CODES[normalized] || { cityCode: normalized.toUpperCase().slice(0, 3), countryCode: null };
}

/**
 * Search for hotels in a city
 */
async function searchHotels(params) {
  console.log('🏨 searchHotels called with:', params);

  const { city, checkIn, checkOut, guests = 2, rooms = 1, starRating, maxPrice } = params;

  if (!city) {
    return {
      success: false,
      error: 'City is required for hotel search'
    };
  }

  // Get city codes
  const cityCodes = getCityCodes(city);

  // Set default dates if not provided
  const today = new Date();
  const defaultCheckIn = new Date(today);
  defaultCheckIn.setDate(defaultCheckIn.getDate() + 1);
  const defaultCheckOut = new Date(defaultCheckIn);
  defaultCheckOut.setDate(defaultCheckOut.getDate() + 1);

  const searchParams = {
    cityCode: cityCodes.cityCode,
    countryCode: cityCodes.countryCode,
    checkIn: checkIn || defaultCheckIn.toISOString().split('T')[0],
    checkOut: checkOut || defaultCheckOut.toISOString().split('T')[0],
    adults: guests,
    children: 0,
    currency: 'USD',
    starRating: starRating || undefined,
    maxPrice: maxPrice || undefined,
    limit: 10
  };

  try {
    const { data, error } = await hotelService.searchHotels(searchParams);

    if (error) {
      console.error('Hotel search error:', error);
      // Return sample hotels for demo
      return {
        success: true,
        results: generateSampleHotels(city, guests, searchParams.checkIn, searchParams.checkOut),
        total: 6,
        params: searchParams,
        city,
        isDemo: true,
        message: `Found hotels in ${city}. Select one to view details and book.`
      };
    }

    return {
      success: true,
      results: data || [],
      total: data?.length || 0,
      params: searchParams,
      city,
      message: data?.length > 0
        ? `Found ${data.length} hotels in ${city}. Would you like to see details for any of these?`
        : `No hotels found in ${city}. Try adjusting your search criteria.`
    };
  } catch (err) {
    console.error('searchHotels error:', err);
    // Return sample hotels for demo
    return {
      success: true,
      results: generateSampleHotels(city, guests, searchParams.checkIn, searchParams.checkOut),
      total: 6,
      params: searchParams,
      city,
      isDemo: true,
      message: `Found hotels in ${city}. Select one to view details and book.`
    };
  }
}

/**
 * Generate sample hotels for demo when API is unavailable
 */
function generateSampleHotels(city, guests, checkIn, checkOut) {
  const hotelNames = [
    'Grand Palace Hotel', 'The Ritz Residence', 'Skyline Tower',
    'Royal Oceanfront', 'Metropolitan Suites', 'Park Avenue Grand'
  ];

  return hotelNames.map((baseName, i) => ({
    hotel: {
      hotelId: `hotel-${city.toLowerCase().replace(/\s/g, '-')}-${i}`,
      name: `${baseName} ${city}`,
      address: `${100 + i * 20} Main Boulevard`,
      city: city,
      country: 'Various',
      starRating: 4 + (i % 2),
      rating: 4.2 + (Math.random() * 0.7),
      reviewCount: 150 + Math.floor(Math.random() * 500),
      description: `Experience luxury and comfort at ${baseName} ${city}, featuring world-class amenities and exceptional service.`,
      images: [
        `https://images.unsplash.com/photo-${1566073771259 + i * 1000}-6a6d97dfc61d?w=800`,
        `https://images.unsplash.com/photo-${1582719508461 + i * 1000}-905c673771fd?w=800`
      ],
      mainImage: `https://images.unsplash.com/photo-1566073771259-6a6d97dfc61d?w=800`,
      amenities: ['wifi', 'parking', 'breakfast', 'gym', 'pool', 'spa', 'restaurant', 'bar'],
      currency: 'USD',
      minRate: 180 + Math.floor(Math.random() * 300)
    },
    rooms: [
      {
        roomId: `room-${i}-deluxe`,
        roomName: 'Deluxe Room',
        roomType: 'deluxe',
        maxOccupancy: 2,
        bedType: 'King',
        size: 35,
        sizeUnit: 'sqm',
        amenities: ['wifi', 'minibar', 'safe', 'air conditioning', 'room service'],
        rates: [
          {
            rateId: `rate-${i}-1`,
            rateName: 'Best Available Rate',
            totalRate: 180 + Math.floor(Math.random() * 100),
            currency: 'USD',
            boardType: 'Room Only',
            cancellation: { refundable: true },
            roomType: 'deluxe',
            maxOccupancy: 2
          },
          {
            rateId: `rate-${i}-2`,
            rateName: 'With Breakfast',
            totalRate: 220 + Math.floor(Math.random() * 100),
            currency: 'USD',
            boardType: 'Breakfast Included',
            cancellation: { refundable: true },
            roomType: 'deluxe',
            maxOccupancy: 2
          }
        ]
      },
      {
        roomId: `room-${i}-suite`,
        roomName: 'Executive Suite',
        roomType: 'suite',
        maxOccupancy: 4,
        bedType: 'King + Sofa Bed',
        size: 65,
        sizeUnit: 'sqm',
        amenities: ['wifi', 'minibar', 'safe', 'air conditioning', 'living room', 'balcony'],
        rates: [
          {
            rateId: `rate-${i}-3`,
            rateName: 'Suite Rate',
            totalRate: 350 + Math.floor(Math.random() * 150),
            currency: 'USD',
            boardType: 'Breakfast Included',
            cancellation: { refundable: true },
            roomType: 'suite',
            maxOccupancy: 4
          }
        ]
      }
    ],
    totalRate: 180 + Math.floor(Math.random() * 300),
    currency: 'USD'
  }));
}

/**
 * Get detailed hotel information
 */
async function getHotelDetails(params) {
  console.log('🏨 getHotelDetails called with:', params);

  const { hotelId, hotelName, checkIn, checkOut, guests } = params;

  try {
    const [detailsRes, reviewsRes] = await Promise.all([
      hotelService.getHotelDetails(hotelId),
      hotelService.getHotelReviews(hotelId)
    ]);

    return {
      success: true,
      hotel: detailsRes.data || { hotelId, name: hotelName },
      reviews: reviewsRes.data || [],
      params,
      message: `Here are the details for ${hotelName || 'this hotel'}. Would you like to book a room?`
    };
  } catch (err) {
    console.error('getHotelDetails error:', err);
    return {
      success: true,
      hotel: { hotelId, name: hotelName },
      reviews: [],
      params,
      message: `Hotel details for ${hotelName}. Select a room type to proceed with booking.`
    };
  }
}

/**
 * Add hotel booking to cart
 */
function addHotelToCart(params) {
  console.log('🏨 addHotelToCart called with:', params);

  const {
    hotelId,
    hotelName,
    hotelCity,
    hotelImage,
    roomType,
    checkIn,
    checkOut,
    guests,
    rooms = 1,
    pricePerNight,
    totalPrice,
    boardType = 'Room Only'
  } = params;

  // Calculate nights
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  // Calculate total if not provided
  const calculatedTotal = totalPrice || (pricePerNight * nights * rooms);

  const cartItem = {
    id: `hotel-${Date.now()}`,
    type: 'hotel',
    serviceType: 'hotel_booking',
    name: hotelName,
    hotelId,
    hotelCity,
    hotelImage,
    roomType,
    checkIn,
    checkOut,
    nights,
    guests,
    rooms,
    pricePerNight,
    totalPrice: calculatedTotal,
    boardType,
    currency: 'USD'
  };

  return {
    success: true,
    action: 'ADD_TO_CART',
    message: `Added ${hotelName} - ${roomType} to your cart`,
    cartItem,
    displayInfo: {
      type: 'Hotel Booking',
      name: hotelName,
      city: hotelCity,
      roomType,
      checkIn,
      checkOut,
      nights: `${nights} night${nights > 1 ? 's' : ''}`,
      guests,
      rooms,
      pricePerNight: `$${pricePerNight}`,
      totalPrice: `$${calculatedTotal}`,
      boardType
    },
    askAdditionalServices: true,
    additionalServicesPrompt: `Your hotel booking has been added to cart!

🏨 **${hotelName}** - ${roomType}
📍 ${hotelCity}
📅 ${checkIn} → ${checkOut} (${nights} nights)
👥 ${guests} guest${guests > 1 ? 's' : ''}
💰 **Total: $${calculatedTotal}**

Would you like to add any additional services?
• **Airport Transfer** - Pick-up from the airport to your hotel
• **Ground Transport** - Car rental or chauffeur service
• **Activities** - Local tours and experiences

Just let me know!`
  };
}

// ============================================
// WINE SOMMELIER SEARCH
// ============================================

/**
 * Search for premium wines from our curated sommelier selection
 * Table columns: id, name, producer, region, country, type, category, price_range_eur,
 * typical_price_eur, vintage, alcohol, rating_points, serving_temp, aging_potential,
 * decanting_time, tasting_notes, description, image_url, luxury_positioning,
 * classification, created_at, updated_at, is_active
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} - Wine search results
 */
export async function searchWines(params) {
  console.log('🍷🍷🍷 searchWines CALLED with params:', JSON.stringify(params));

  const {
    query,           // Wine name search (e.g., "Dom Perignon")
    category,        // champagne, bordeaux, burgundy, italy, white, sweet
    type,            // red, white, sparkling, rosé, dessert
    country,         // France, Italy, Spain, USA, etc.
    region,          // Champagne, Bordeaux, Tuscany, etc.
    producer,        // Producer/house name
    vintage,         // Year
    priceMin,
    priceMax,
    classification   // Grand Cru, Premier Cru, etc.
  } = params;

  try {
    console.log('🍷🍷🍷 WINE SEARCH PARAMS RECEIVED:', JSON.stringify(params));

    // FIRST: Check if wines table has ANY data at all
    const { data: allWines, error: countError } = await supabase
      .from('wines')
      .select('id, name, is_active')
      .limit(5);

    console.log('🍷 DEBUG - Sample wines from DB:', allWines);
    console.log('🍷 DEBUG - Count error:', countError);

    // Build Supabase query
    let supabaseQuery = supabase
      .from('wines')
      .select('*');

    console.log('🍷 Building query with ALL params:', { query, category, type, country, region, producer, vintage, priceMin, priceMax, classification });

    // If NO params provided, return all wines (limited)
    const hasAnyFilter = query || category || type || country || region || producer || vintage || priceMin || priceMax || classification;
    console.log('🍷 Has any filter:', hasAnyFilter);

    // QUERY - search by wine name (most important for specific requests)
    if (query) {
      console.log('🍷 Searching for wine with query:', query);

      // Extract main search term - for "Dom Perignon" use "Perignon"
      const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      const mainTerm = searchTerms.length > 1 ? searchTerms[searchTerms.length - 1] : searchTerms[0];
      console.log('🍷 Search terms:', searchTerms, '-> Main term:', mainTerm);

      // Replace vowels with underscore wildcard for accent-insensitive search
      // "perignon" -> "p_r_gn_n" matches "Pérignon"
      // "petrus" -> "p_tr_s" matches "Pétrus"
      const wildcardTerm = mainTerm
        .replace(/e/gi, '_')
        .replace(/a/gi, '_')
        .replace(/o/gi, '_')
        .replace(/u/gi, '_')
        .replace(/i/gi, '_');

      console.log('🍷 Wildcard search term:', wildcardTerm);

      // Use ilike with wildcard _ for accent-insensitive search
      supabaseQuery = supabaseQuery.ilike('name', `%${wildcardTerm}%`);
    }

    // CATEGORY filter
    if (category) {
      supabaseQuery = supabaseQuery.ilike('category', `%${category}%`);
    }

    // TYPE filter (red, white, sparkling, etc.)
    if (type) {
      supabaseQuery = supabaseQuery.ilike('type', `%${type}%`);
    }

    // COUNTRY filter
    if (country) {
      supabaseQuery = supabaseQuery.ilike('country', `%${country}%`);
    }

    // REGION filter
    if (region) {
      supabaseQuery = supabaseQuery.or(`region.ilike.%${region}%,country.ilike.%${region}%`);
    }

    // PRODUCER filter
    if (producer) {
      supabaseQuery = supabaseQuery.ilike('producer', `%${producer}%`);
    }

    // VINTAGE filter
    if (vintage) {
      supabaseQuery = supabaseQuery.ilike('vintage', `%${vintage}%`);
    }

    // PRICE filters
    if (priceMin) {
      supabaseQuery = supabaseQuery.gte('typical_price_eur', priceMin);
    }
    if (priceMax) {
      supabaseQuery = supabaseQuery.lte('typical_price_eur', priceMax);
    }

    // CLASSIFICATION filter
    if (classification) {
      supabaseQuery = supabaseQuery.ilike('classification', `%${classification}%`);
    }

    // Execute query - limit to 20 for display, specific searches find exact matches from full DB
    const { data: wines, error } = await supabaseQuery
      .order('typical_price_eur', { ascending: true })
      .limit(20);

    console.log('🍷 Query executed, found:', wines?.length || 0, 'wines');

    if (error) {
      console.error('Wine search error:', error);
      return {
        success: false,
        error: 'Failed to search wines: ' + error.message,
        results: []
      };
    }

    // Format results for display
    const formattedWines = (wines || []).map(wine => ({
      id: wine.id,
      name: wine.name,
      producer: wine.producer,
      vintage: wine.vintage,
      // IMPORTANT: type must be 'wines' for SearchResults to recognize it
      type: 'wines',
      wineType: wine.type, // Original wine type (red, white, sparkling, etc.)
      category: wine.category,
      region: wine.region,
      country: wine.country,
      description: wine.description,
      // Price display - use price_range_eur string or format from typical_price_eur
      priceRange: wine.price_range_eur || (wine.typical_price_eur ? `€${wine.typical_price_eur}` : 'Price on request'),
      typicalPrice: wine.typical_price_eur,
      // Cart price fields - set all price fields the cart might look for
      price: wine.typical_price_eur || 0,
      unitPrice: wine.typical_price_eur || 0,
      basePrice: wine.typical_price_eur || 0,
      cartPrice: wine.typical_price_eur,
      currency: 'EUR', // Wines are priced in EUR
      image: wine.image_url,
      image_url: wine.image_url, // Also set image_url for fallback
      // Additional wine details
      alcohol: wine.alcohol ? `${wine.alcohol}%` : null,
      rating: wine.rating_points,
      servingTemp: wine.serving_temp,
      agingPotential: wine.aging_potential,
      decantingTime: wine.decanting_time,
      tastingNotes: wine.tasting_notes,
      luxuryPositioning: wine.luxury_positioning,
      classification: wine.classification,
      // Format for display
      displayTitle: `${wine.name}${wine.vintage ? ` ${wine.vintage}` : ''}`,
      displaySubtitle: `${wine.producer || ''} · ${wine.region || wine.country || ''}`.replace(/^\s*·\s*|\s*·\s*$/g, '')
    }));

    console.log(`🍷 Found ${formattedWines.length} wines`);

    // Debug: Log price info for each wine
    formattedWines.forEach(w => {
      console.log(`🍷 Wine: ${w.name}, Price: €${w.price}, typical_price_eur: ${w.typicalPrice}`);
    });

    // Get category counts for summary
    const categoryCounts = {};
    formattedWines.forEach(w => {
      categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
    });

    // If specific wine was searched but not found, offer global sourcing
    const isSpecificSearch = query && query.length > 3;
    const notFoundButSearchable = formattedWines.length === 0 && isSpecificSearch;

    if (notFoundButSearchable) {
      return {
        success: true,
        results: [],
        total: 0,
        params,
        displayType: 'wines',
        notInStock: true,
        searchedWine: query + (vintage ? ` ${vintage}` : ''),
        message: `The requested wine "${query}${vintage ? ` ${vintage}` : ''}" is currently not in our curated selection.`,
        globalSourcingAvailable: true,
        globalSourcingPrompt: `However, our wine coordinators can source this wine globally if it's available from international merchants, auction houses, or importers. Would you like me to search globally for "${query}${vintage ? ` ${vintage}` : ''}"?`,
        orderingNote: 'Global sourcing typically takes 1-12 days depending on location.',
        cartIntegration: {
          type: 'custom_extra',
          category: 'wine',
          priceField: 'typical_price_eur'
        }
      };
    }

    return {
      success: true,
      results: formattedWines,
      total: formattedWines.length,
      params,
      categorySummary: categoryCounts,
      displayType: 'wines',
      message: formattedWines.length > 0
        ? `Found ${formattedWines.length} wines from our sommelier selection`
        : 'No wines found matching your criteria. You can browse our full collection or ask me to search globally for a specific wine.',
      orderingNote: 'Order at least 24 hours before your flight for aircraft delivery.',
      cartIntegration: {
        type: 'custom_extra',
        category: 'wine',
        priceField: 'typical_price_eur'
      }
    };

  } catch (error) {
    console.error('Wine search error:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

// ============================================
// DELICATESSE & EXTRAS SEARCH
// ============================================

/**
 * Search for delicatesse items (luxury in-flight extras)
 * Tables: delicatesse, premium_cigars
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} - Delicatesse search results
 */
export async function searchDelicatesse(params) {
  console.log('🍾🍾🍾 searchDelicatesse CALLED with params:', JSON.stringify(params));

  const {
    query,           // Item name search (e.g., "Beluga", "Cohiba")
    category,        // Caviar, Premium Cigars, Flowers, etc.
    priceMin,
    priceMax
  } = params;

  try {
    // Build Supabase query for delicatesse table
    let supabaseQuery = supabase
      .from('delicatesse')
      .select('*')
      .eq('is_active', true);

    // QUERY - search by item name
    if (query) {
      supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
    }

    // CATEGORY filter
    if (category) {
      supabaseQuery = supabaseQuery.ilike('category', `%${category}%`);
    }

    // PRICE filters
    if (priceMin) {
      supabaseQuery = supabaseQuery.gte('price_usd', priceMin);
    }
    if (priceMax) {
      supabaseQuery = supabaseQuery.lte('price_usd', priceMax);
    }

    // Execute query - limit to 20 for display
    const { data: items, error } = await supabaseQuery
      .order('sort_order', { ascending: true })
      .order('price_usd', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Delicatesse search error:', error);
      return {
        success: false,
        error: 'Failed to search delicatesse: ' + error.message,
        results: []
      };
    }

    // Format results for display
    const formattedItems = (items || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      type: 'delicatesse', // For SearchResults to recognize
      category: item.category,
      // Price display
      price: item.price_usd || 0,
      unitPrice: item.price_usd || 0,
      basePrice: item.price_usd || 0,
      cartPrice: item.price_usd,
      priceDisplay: item.price_usd ? `$${item.price_usd.toLocaleString()}` : 'Price on request',
      currency: 'USD',
      // Image
      image: item.image_url,
      image_url: item.image_url,
      // Additional details
      preparationTime: item.preparation_time,
      notes: item.notes,
      // Format for display
      displayTitle: item.name,
      displaySubtitle: item.description
    }));

    console.log(`🍾 Found ${formattedItems.length} delicatesse items`);

    // Get category counts for summary
    const categoryCounts = {};
    formattedItems.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });

    return {
      success: true,
      results: formattedItems,
      total: formattedItems.length,
      params,
      categorySummary: categoryCounts,
      displayType: 'delicatesse',
      message: formattedItems.length > 0
        ? `Found ${formattedItems.length} luxury extras for your flight`
        : 'No items found matching your criteria.',
      orderingNote: 'Most items require 24-48 hours advance notice for aircraft delivery.',
      cartIntegration: {
        type: 'custom_extra',
        category: 'delicatesse',
        priceField: 'price_usd'
      }
    };

  } catch (error) {
    console.error('Delicatesse search error:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Search for special services (consulting, concierge, etc.)
 * Table: special_services
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} - Special services search results
 */
export async function searchSpecialServices(params) {
  console.log('🎯 searchSpecialServices CALLED with params:', JSON.stringify(params));

  const {
    query,
    category,
    priceMin,
    priceMax
  } = params;

  try {
    // Build Supabase query for special_services table
    let supabaseQuery = supabase
      .from('special_services')
      .select('*')
      .eq('is_active', true);

    // QUERY - search by service name or description
    if (query) {
      supabaseQuery = supabaseQuery.or(`service_name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // CATEGORY filter
    if (category) {
      supabaseQuery = supabaseQuery.ilike('category', `%${category}%`);
    }

    // PRICE filters
    if (priceMin) {
      supabaseQuery = supabaseQuery.gte('base_price', priceMin);
    }
    if (priceMax) {
      supabaseQuery = supabaseQuery.lte('base_price', priceMax);
    }

    // Execute query
    const { data: services, error } = await supabaseQuery
      .order('base_price', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Special services search error:', error);
      return {
        success: false,
        error: 'Failed to search special services: ' + error.message,
        results: []
      };
    }

    // Format results for display
    const formattedServices = (services || []).map(service => ({
      id: service.id,
      name: service.service_name,
      description: service.description,
      detailedDescription: service.detailed_description,
      type: 'special_service',
      category: service.category,
      // Price display
      price: service.base_price || 0,
      basePrice: service.base_price || 0,
      cartPrice: service.base_price,
      pricingUnit: service.pricing_unit,
      currency: service.currency || 'USD',
      priceDisplay: service.base_price
        ? `${service.currency || '$'}${service.base_price.toLocaleString()}${service.pricing_unit ? ` / ${service.pricing_unit}` : ''}`
        : 'Price on request',
      // Image
      image: service.image_url,
      image_url: service.image_url,
      // Additional details
      inclusions: service.inclusions || [],
      exclusions: service.exclusions || [],
      requirements: service.requirements || [],
      minimumNoticeHours: service.minimum_notice_hours,
      availabilityNotes: service.availability_notes,
      // Format for display
      displayTitle: service.service_name,
      displaySubtitle: service.description
    }));

    console.log(`🎯 Found ${formattedServices.length} special services`);

    // Get category counts for summary
    const categoryCounts = {};
    formattedServices.forEach(service => {
      categoryCounts[service.category] = (categoryCounts[service.category] || 0) + 1;
    });

    return {
      success: true,
      results: formattedServices,
      total: formattedServices.length,
      params,
      categorySummary: categoryCounts,
      displayType: 'special_services',
      message: formattedServices.length > 0
        ? `Found ${formattedServices.length} special services`
        : 'No services found matching your criteria.',
      cartIntegration: {
        type: 'special_service',
        category: 'special_services',
        priceField: 'base_price'
      }
    };

  } catch (error) {
    console.error('Special services search error:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Search for premium cigars specifically
 * Table: premium_cigars
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} - Cigars search results
 */
export async function searchCigars(params) {
  console.log('🚬🚬🚬 searchCigars CALLED with params:', JSON.stringify(params));

  const {
    query,           // Cigar name search
    brand,           // Cohiba, Montecristo, etc.
    priceMin,
    priceMax
  } = params;

  try {
    // Build Supabase query for premium_cigars table
    let supabaseQuery = supabase
      .from('premium_cigars')
      .select('*')
      .eq('is_active', true);

    // QUERY - search by cigar name
    if (query) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,brand.ilike.%${query}%`);
    }

    // BRAND filter
    if (brand) {
      supabaseQuery = supabaseQuery.ilike('brand', `%${brand}%`);
    }

    // PRICE filters
    if (priceMin) {
      supabaseQuery = supabaseQuery.gte('price_per_stick_usd', priceMin);
    }
    if (priceMax) {
      supabaseQuery = supabaseQuery.lte('price_per_stick_usd', priceMax);
    }

    // Execute query
    const { data: cigars, error } = await supabaseQuery
      .order('brand', { ascending: true })
      .order('price_per_stick_usd', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Cigars search error:', error);
      return {
        success: false,
        error: 'Failed to search cigars: ' + error.message,
        results: []
      };
    }

    // Format results for display
    const formattedCigars = (cigars || []).map(cigar => ({
      id: cigar.id,
      name: cigar.name,
      brand: cigar.brand,
      description: cigar.description,
      type: 'cigars', // For SearchResults to recognize
      category: 'Premium Cigars',
      // Price display
      price: cigar.price_per_stick_usd || 0,
      unitPrice: cigar.price_per_stick_usd || 0,
      basePrice: cigar.price_per_stick_usd || 0,
      cartPrice: cigar.price_per_stick_usd,
      priceDisplay: cigar.price_per_stick_usd ? `$${cigar.price_per_stick_usd}/stick` : 'Price on request',
      currency: 'USD',
      // Image
      image: cigar.image_url,
      image_url: cigar.image_url,
      // Additional details
      origin: cigar.origin,
      strength: cigar.strength,
      flavor_profile: cigar.flavor_profile,
      ring_gauge: cigar.ring_gauge,
      length: cigar.length,
      // Format for display
      displayTitle: `${cigar.brand} ${cigar.name}`,
      displaySubtitle: `${cigar.origin || ''} · ${cigar.strength || ''} · ${cigar.flavor_profile || ''}`.replace(/^\s*·\s*|\s*·\s*$/g, '').replace(/·\s*·/g, '·')
    }));

    console.log(`🚬 Found ${formattedCigars.length} cigars`);

    // Get brand counts for summary
    const brandCounts = {};
    formattedCigars.forEach(cigar => {
      brandCounts[cigar.brand] = (brandCounts[cigar.brand] || 0) + 1;
    });

    return {
      success: true,
      results: formattedCigars,
      total: formattedCigars.length,
      params,
      brandSummary: brandCounts,
      displayType: 'cigars',
      message: formattedCigars.length > 0
        ? `Found ${formattedCigars.length} premium cigars`
        : 'No cigars found matching your criteria.',
      // CRITICAL: Always show this warning
      cleaningFeeWarning: '⚠️ A $2,000 aircraft cleaning fee applies for cigar smoking on board.',
      orderingNote: 'All cigars maintained at optimal 65-70% humidity. Order 24 hours before flight.',
      cartIntegration: {
        type: 'custom_extra',
        category: 'cigars',
        priceField: 'price_per_stick_usd'
      }
    };

  } catch (error) {
    console.error('Cigars search error:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Search for wines globally via web search
 * Used when wine is not in our curated selection
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} - Global wine search results
 */
async function searchWineGlobal(params) {
  console.log('🌍🍷 searchWineGlobal called with:', params);

  const { wineName, vintage, maxBudget } = params;

  if (!wineName) {
    return {
      success: false,
      error: 'Wine name is required for global search',
      results: []
    };
  }

  try {
    // Build search query for wine
    const searchQuery = `${wineName}${vintage ? ` ${vintage}` : ''} wine price buy`;

    // Use web search to find wine information
    // This will be processed by Claude's web search capability
    // For now, we return a structured response that prompts the AI to do web search

    const wineSearchTerm = `${wineName}${vintage ? ` ${vintage}` : ''}`;

    // Generate a placeholder result that the AI will enhance with web search
    const result = {
      success: true,
      isGlobalSearch: true,
      searchedWine: wineSearchTerm,
      displayType: 'wines_global',
      requiresWebSearch: true,
      webSearchQuery: searchQuery,
      message: `Searching globally for "${wineSearchTerm}"...`,

      // Instructions for AI to follow
      aiInstructions: {
        action: 'WEB_SEARCH_REQUIRED',
        searchFor: `"${wineSearchTerm}" wine price availability buy merchant Wine-Searcher Vivino`,
        extractFields: ['name', 'vintage', 'price', 'merchant', 'availability', 'image_url'],
        formatAs: 'wine_cards',
        priceMarkup: 1.10, // Internal markup - not shown to user
        addNote: 'Price includes sourcing and transport'
      },

      // Pricing info (internal - not exposed to users)
      sourcingInfo: {
        deliveryTime: '1-12 days typical',
        note: 'Price includes sourcing and transport'
      },

      // Placeholder for results (AI will fill this via web search)
      results: [],

      // If NO price found, create wine request note
      fallbackIfNotFound: {
        type: 'wine_request',
        wine_name: wineSearchTerm,
        vintage: vintage || null,
        quantity: 'TBD - ask user',
        message: "I couldn't find current pricing for this wine. I can create a sourcing request - our wine team at PrivateCharterX will contact you within 24-48 hours with availability and pricing.",
        askUser: "How many bottles would you like our team to source?"
      },

      orderingNote: 'Global sourcing: Delivery typically 1-12 days.',

      cartIntegration: {
        type: 'custom_extra',
        category: 'wine',
        isGlobalSourcing: true,
        requiresConfirmation: true
      }
    };

    return result;

  } catch (error) {
    console.error('Global wine search error:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Create a wine sourcing request when wine cannot be found
 * Used when web search finds no pricing or wine is extremely rare
 * @param {Object} params - Request parameters
 * @returns {Object} - Wine request to add to cart
 */
function createWineRequest(params) {
  console.log('📝🍷 createWineRequest called with:', params);

  const { wineName, vintage, quantity = 1, userNotes } = params;

  if (!wineName) {
    return {
      success: false,
      error: 'Wine name is required'
    };
  }

  const wineFullName = `${wineName}${vintage ? ` ${vintage}` : ''}`;

  // Create a cart-ready wine request item
  const wineRequest = {
    success: true,
    type: 'wine_request',
    displayType: 'wine_request',

    // Item details for cart
    item: {
      id: `wine-request-${Date.now()}`,
      type: 'wine_request',
      category: 'wine',
      name: wineFullName,
      wine_name: wineName,
      vintage: vintage || null,
      quantity: quantity,
      user_notes: userNotes || null,

      // Price is TBD - team will confirm
      price: null,
      priceDisplay: 'Price TBD - Team will confirm',

      // Status
      status: 'pending_confirmation',
      requiresTeamConfirmation: true,

      // Display info
      title: `Wine Sourcing Request: ${wineFullName}`,
      description: `${quantity} bottle${quantity > 1 ? 's' : ''} requested. Our wine team will contact you within 24-48 hours with availability and pricing.`,
      image_url: null // No image for requests
    },

    // Message to show user
    message: `I've created a sourcing request for ${quantity} bottle${quantity > 1 ? 's' : ''} of ${wineFullName}. Our wine team at PrivateCharterX will contact you within 24-48 hours with availability and pricing.`,

    // Cart integration
    cartAction: 'add_wine_request',
    cartItem: {
      type: 'custom_extra',
      category: 'wine_request',
      name: `Wine Request: ${wineFullName}`,
      quantity: quantity,
      price: 0, // Price TBD
      notes: `Wine: ${wineFullName}, Qty: ${quantity}${userNotes ? `, Notes: ${userNotes}` : ''}`,
      status: 'pending_confirmation',
      requiresConfirmation: true
    },

    // Next steps for AI
    nextSteps: [
      'Confirm with user if they want to add this request to their cart',
      'Ask if they have any specific requirements (delivery date, condition, provenance)',
      'Remind them: Team will contact within 24-48 hours'
    ]
  };

  return wineRequest;
}
