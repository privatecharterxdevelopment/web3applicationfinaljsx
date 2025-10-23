/**
 * PrivateCharterX AI Knowledge Base
 *
 * This file contains all the knowledge and context for the AI assistant (Sphera)
 * Update this file to modify what the AI knows about services, pricing, policies, etc.
 */

export const AI_KNOWLEDGE_BASE = {
  /**
   * AI Assistant Identity
   */
  identity: {
    name: "Sphera",
    role: "Intelligent luxury travel AI assistant for PrivateCharterX",
    personality: "Warm, professional, solution-oriented, proactive",
    responseStyle: "Conversational, concise (under 4 sentences), always ends with clear next step"
  },

  /**
   * Available Services
   */
  services: {
    emptyLegs: {
      name: "Empty Leg Flights",
      description: "Repositioning flights at 30-50% discount",
      icon: "✈️",
      keywords: ["empty leg", "empty legs", "discount flight", "repositioning", "deal"],
      features: [
        "Up to 50% discount on regular charter prices",
        "Same luxury aircraft as full charters",
        "Limited flexibility on dates and routes",
        "Updated every 3 hours with new availability",
        "Includes complimentary CO₂ certificate"
      ],
      pricing: {
        range: "CHF 5,000 - 40,000",
        unit: "per flight",
        discount: "30-50% off regular charter"
      },
      database: "EmptyLegs_"
    },

    jets: {
      name: "Private Jet Charter",
      description: "On-demand private jet charters worldwide - pricing complex and depends on availability, route, flight time",
      icon: "🛩️",
      keywords: ["private jet", "jet charter", "business jet", "aircraft", "plane"],
      categories: {
        veryLightJet: {
          name: "Very Light Jet",
          passengers: "4-6",
          range: "Up to 2,000 km",
          examples: ["Citation Mustang", "Phenom 100", "Eclipse 500", "HondaJet"],
          models: ["mustang", "phenom 100", "eclipse", "hondajet"],
          hourlyRate: "CHF 3,500 - 5,500"
        },
        lightJet: {
          name: "Light Jet",
          passengers: "6-8",
          range: "2,000 - 3,500 km",
          examples: ["Citation CJ3+", "Phenom 300", "Learjet 75", "Citation CJ4"],
          models: ["cj3", "cj4", "phenom 300", "learjet 75", "learjet 70", "citation m2"],
          hourlyRate: "CHF 4,500 - 7,000"
        },
        midsizeJet: {
          name: "Midsize Jet",
          passengers: "8-9",
          range: "3,500 - 5,500 km",
          examples: ["Citation XLS+", "Hawker 900XP", "Learjet 60", "Citation Excel"],
          models: ["xls", "excel", "hawker 900", "hawker 850", "learjet 60", "citation latitude"],
          hourlyRate: "CHF 6,000 - 9,000"
        },
        superMidsize: {
          name: "Super Midsize",
          passengers: "8-10",
          range: "5,500 - 7,500 km",
          examples: ["Citation Sovereign", "Challenger 350", "Gulfstream G280", "Praetor 600"],
          models: ["sovereign", "challenger 350", "challenger 300", "g280", "praetor 600", "legacy 500"],
          hourlyRate: "CHF 8,000 - 12,000"
        },
        heavyJet: {
          name: "Heavy Jet",
          passengers: "10-16",
          range: "7,500 - 12,000 km",
          examples: ["Gulfstream G550", "Global 6000", "Falcon 7X", "Challenger 605"],
          models: ["g550", "g500", "g450", "global 6000", "global 5000", "falcon 7x", "falcon 900", "challenger 605", "challenger 650"],
          hourlyRate: "CHF 12,000 - 18,000"
        },
        ultraLongRange: {
          name: "Ultra Long Range",
          passengers: "12-19",
          range: "12,000+ km",
          examples: ["Gulfstream G650", "Global 7500", "Falcon 8X", "G700"],
          models: ["g650", "g700", "g800", "global 7500", "global 8000", "falcon 8x", "bbj", "acj"],
          hourlyRate: "CHF 15,000 - 25,000+"
        }
      },
      modelToCategory: {
        // Very Light Jets
        "mustang": "veryLightJet", "phenom 100": "veryLightJet", "eclipse": "veryLightJet", "hondajet": "veryLightJet",

        // Light Jets
        "cj3": "lightJet", "cj4": "lightJet", "phenom 300": "lightJet", "learjet 75": "lightJet",
        "learjet 70": "lightJet", "m2": "lightJet",

        // Midsize Jets
        "xls": "midsizeJet", "excel": "midsizeJet", "hawker 900": "midsizeJet", "hawker 850": "midsizeJet",
        "learjet 60": "midsizeJet", "latitude": "midsizeJet",

        // Super Midsize
        "sovereign": "superMidsize", "challenger 350": "superMidsize", "challenger 300": "superMidsize",
        "g280": "superMidsize", "praetor 600": "superMidsize", "legacy 500": "superMidsize",

        // Heavy Jets
        "g550": "heavyJet", "g500": "heavyJet", "g450": "heavyJet", "global 6000": "heavyJet",
        "global 5000": "heavyJet", "falcon 7x": "heavyJet", "falcon 900": "heavyJet",
        "challenger 605": "heavyJet", "challenger 650": "heavyJet",

        // Ultra Long Range
        "g650": "ultraLongRange", "g700": "ultraLongRange", "g800": "ultraLongRange",
        "global 7500": "ultraLongRange", "global 8000": "ultraLongRange", "falcon 8x": "ultraLongRange",
        "bbj": "ultraLongRange", "acj": "ultraLongRange"
      },
      features: [
        "Fully customizable departure times",
        "Choose your preferred aircraft",
        "Catering and ground transport available",
        "Pet-friendly options",
        "WiFi and entertainment systems",
        "Optional CO₂ offset certificates"
      ],
      database: "jets"
    },

    helicopters: {
      name: "Helicopter Charter",
      description: "Point-to-point helicopter transfers and tours",
      icon: "🚁",
      keywords: ["helicopter", "heli", "chopper", "rotorcraft"],
      types: {
        singleEngine: {
          name: "Single Engine",
          passengers: "4-5",
          range: "Up to 600 km",
          examples: ["H125 Ecureuil", "AS350", "Bell 407"],
          hourlyRate: "CHF 2,500 - 4,000"
        },
        twinEngine: {
          name: "Twin Engine",
          passengers: "6-8",
          range: "Up to 800 km",
          examples: ["H145", "AW139", "Bell 429"],
          hourlyRate: "CHF 4,500 - 7,000"
        },
        vip: {
          name: "VIP/Executive",
          passengers: "6-12",
          range: "Up to 1,000 km",
          examples: ["S-76", "AW169", "H175"],
          hourlyRate: "CHF 6,000 - 10,000"
        }
      },
      useCases: [
        "Airport transfers (avoid traffic)",
        "City-to-resort transfers",
        "Scenic tours and sightseeing",
        "Heli-skiing access",
        "Emergency and medical transport",
        "Event transportation"
      ],
      database: "helicopters"
    },

    taxiCars: {
      name: "Taxi & Chauffeur Service",
      description: "Premium taxi fleet with professional chauffeur service",
      icon: "🚗",
      keywords: ["taxi", "car", "vehicle", "chauffeur", "transfer", "ground transport", "ride"],
      categories: {
        luxury: {
          name: "Luxury Sedans",
          examples: ["BMW 7 Series 2015", "Mercedes S-Class 2018", "Mercedes S-Class 2020"],
          pricePerKm: "CHF 4.00 - 8.00"
        },
        van: {
          name: "Luxury Vans",
          examples: ["Mercedes Vito"],
          pricePerKm: "CHF 6.50 - 9.00"
        },
        ultraLuxury: {
          name: "Ultra Luxury",
          examples: ["Mercedes Maybach"],
          pricePerKm: "CHF 8.00 - 12.00"
        }
      },
      features: [
        "Professional chauffeur included",
        "Airport meet & greet",
        "Instant booking in Switzerland",
        "Quote requests worldwide",
        "Real-time route calculation",
        "Multiple payment options (Crypto & Card)"
      ],
      database: "taxi_cars"
    },

    yachts: {
      name: "Yacht Charter",
      description: "Luxury yacht charters in Mediterranean and worldwide",
      icon: "🛥️",
      keywords: ["yacht", "boat", "sailing", "catamaran", "motor yacht"],
      types: {
        motorYacht: {
          name: "Motor Yacht",
          size: "20-80m",
          guests: "8-12",
          crew: "Professional crew included",
          dailyRate: "CHF 10,000 - 150,000+"
        },
        sailingYacht: {
          name: "Sailing Yacht",
          size: "15-50m",
          guests: "6-10",
          crew: "Captain + crew",
          dailyRate: "CHF 8,000 - 80,000"
        },
        catamaran: {
          name: "Catamaran",
          size: "12-25m",
          guests: "8-12",
          crew: "Optional crew",
          dailyRate: "CHF 5,000 - 25,000"
        }
      },
      destinations: [
        "French Riviera (Monaco, Cannes, St. Tropez)",
        "Italian Riviera (Portofino, Amalfi Coast)",
        "Greek Islands (Mykonos, Santorini)",
        "Balearic Islands (Ibiza, Mallorca)",
        "Caribbean (St. Barts, BVI)",
        "Croatia (Dubrovnik, Split)"
      ],
      database: "yachts"
    },

    adventures: {
      name: "Adventure Packages",
      description: "Curated luxury adventure experiences with aviation",
      icon: "🏔️",
      keywords: ["adventure", "package", "experience", "skiing", "safari", "island hopping"],
      packages: {
        heliSkiing: {
          name: "Alpine Heli-Skiing",
          location: "Zermatt, Verbier, or St. Moritz",
          duration: "3-7 days",
          includes: [
            "Helicopter access to pristine slopes",
            "Professional mountain guide",
            "Luxury chalet accommodation",
            "Gourmet meals and après-ski",
            "Equipment rental"
          ],
          priceFrom: "CHF 15,000 per person"
        },
        safari: {
          name: "African Safari by Private Jet",
          location: "Tanzania, Kenya, or South Africa",
          duration: "7-14 days",
          includes: [
            "Private jet charter",
            "Luxury safari lodge accommodation",
            "Game drives and walking safaris",
            "Professional guides and trackers",
            "All meals and premium beverages"
          ],
          priceFrom: "CHF 45,000 per person"
        },
        islandHopping: {
          name: "Mediterranean Island Hopping",
          location: "Greek Islands or Balearics",
          duration: "5-10 days",
          includes: [
            "Yacht charter with crew",
            "Helicopter transfers between islands",
            "Luxury hotel stays",
            "Private beach experiences",
            "Water sports and activities"
          ],
          priceFrom: "CHF 25,000 per person"
        },
        racing: {
          name: "F1 VIP Experience",
          location: "Monaco, Silverstone, or Spa",
          duration: "3-4 days",
          includes: [
            "Private jet to race location",
            "Paddock Club access",
            "Meet & greet with teams",
            "5-star hotel accommodation",
            "Track day experience"
          ],
          priceFrom: "CHF 20,000 per person"
        }
      },
      database: "adventures"
    },

    taxi: {
      name: "Fixed Route Transfers",
      description: "Pre-priced airport and city transfers",
      icon: "🚕",
      keywords: ["taxi", "transfer", "airport", "shuttle"],
      routes: [
        "Zurich Airport - St. Moritz",
        "Geneva Airport - Verbier",
        "Milan Airport - Lake Como",
        "Nice Airport - Monaco",
        "London Heathrow - Central London"
      ],
      features: [
        "Fixed transparent pricing",
        "Professional chauffeur",
        "Flight tracking",
        "Meet & greet service",
        "Luggage assistance"
      ],
      database: "fixed_offers"
    },

    events: {
      name: "Event & Sports Tickets",
      description: "Concert, sports, and entertainment tickets worldwide",
      icon: "🎫",
      keywords: ["event", "concert", "sport", "game", "show", "festival", "match", "theatre"],
      sources: [
        "Ticketmaster (info only, external booking)",
        "Eventbrite (direct checkout available)"
      ],
      categories: [
        "Concerts & Music Festivals",
        "Sports Events (F1, Football, Tennis, etc.)",
        "Theatre & Shows",
        "Arts & Culture",
        "Family Events"
      ],
      coverage: [
        "🇺🇸 USA: New York, LA, Miami, Las Vegas, Chicago",
        "🇬🇧 UK: London, Manchester, Birmingham",
        "🇨🇭 Switzerland: Zurich, Geneva, Basel",
        "🇩🇪 Germany: Berlin, Munich, Frankfurt, Hamburg",
        "🇦🇪 UAE: Dubai, Abu Dhabi"
      ]
    }
  },

  /**
   * CO₂ Offset Program
   */
  sustainability: {
    certificate: {
      name: "CO₂ Offset Certificate",
      description: "Carbon offset for your flight with blockchain verification option",
      pricing: "€80 per ton CO₂",
      includedWith: [
        "All empty leg flights (complimentary)",
        "Optional add-on for regular charters"
      ],
      certificateTypes: {
        classic: {
          name: "Classic Certificate",
          description: "Traditional PDF carbon offset certificate",
          delivery: "Email within 24 hours",
          price: "Included"
        },
        blockchain: {
          name: "Blockchain NFT Certificate",
          description: "Blockchain-verified NFT certificate on Polygon",
          delivery: "Minted to your wallet",
          price: "Included",
          benefits: [
            "Immutable proof of offset",
            "Tradeable and transferable",
            "Visible in your wallet",
            "Supports verified carbon projects"
          ]
        }
      },
      supportedProjects: [
        {
          name: "Rainforest Conservation - Amazon",
          location: "Brazil",
          type: "REDD+ Forest Protection",
          impact: "Protects 50,000 hectares of rainforest"
        },
        {
          name: "Wind Energy - India",
          location: "Tamil Nadu, India",
          type: "Renewable Energy",
          impact: "250 MW clean energy capacity"
        },
        {
          name: "Ocean Cleanup - Pacific",
          location: "Pacific Ocean",
          type: "Ocean Conservation",
          impact: "Removes 1 ton of plastic per ton CO₂"
        },
        {
          name: "Solar Farms - Morocco",
          location: "Morocco",
          type: "Solar Energy",
          impact: "500 MW solar capacity"
        }
      ]
    },
    emissionRates: {
      "Very Light Jet": 0.00053,
      "Light Jet": 0.00080,
      "Midsize Jet": 0.00107,
      "Super Midsize": 0.00133,
      "Heavy Jet": 0.00160,
      "Ultra Long Range": 0.00187,
      "VIP Airliner": 0.00240,
      "Turboprop": 0.00035,
      "Helicopter": 0.00040
    }
  },

  /**
   * Booking & Modification Rules
   */
  bookingRules: {
    emptyLegs: {
      dateModification: false,
      timeModification: false,
      reason: "Empty legs have fixed departure times and dates",
      flexibility: "Very limited - based on aircraft repositioning schedule"
    },
    jets: {
      dateModification: true,
      timeModification: true,
      passengerModification: true,
      leadTime: "Minimum 4 hours for domestic, 24 hours for international",
      cancellation: "Free cancellation up to 48 hours before departure"
    },
    helicopters: {
      dateModification: true,
      timeModification: true,
      passengerModification: true,
      leadTime: "Minimum 2 hours notice",
      cancellation: "Free cancellation up to 24 hours before departure"
    },
    cars: {
      dateModification: true,
      timeModification: true,
      leadTime: "Minimum 3 hours notice",
      cancellation: "Free cancellation up to 12 hours before pickup"
    },
    yachts: {
      dateModification: true,
      leadTime: "Minimum 7 days notice for date changes",
      cancellation: "Free cancellation up to 30 days before charter"
    },
    adventures: {
      dateModification: true,
      leadTime: "Minimum 14 days notice",
      cancellation: "Varies by package - typically 30-60 days"
    }
  },

  /**
   * AI Response Guidelines
   */
  responseGuidelines: {
    tone: "Warm, professional, and solution-oriented",
    length: "Be thorough and detailed - ask multiple clarifying questions to understand exact needs",
    detailedQuestions: {
      emptyLegs: [
        "What is your departure city/airport?",
        "What is your destination?",
        "What are your preferred travel dates? (if not provided, ask for flexibility)",
        "How many passengers will be traveling?",
        "Do you have any luggage requirements?",
        "Would you like to see all available empty legs for the route?"
      ],
      jets: [
        "Where are you departing from?",
        "What is your destination?",
        "When would you like to travel? (date and preferred departure time)",
        "How many passengers will be traveling?",
        "Do you require extra baggage space? If yes, how much luggage?",
        "Would you like cabin crew/flight attendants on board?",
        "Do you need ground transportation/airport transfer at departure or arrival?",
        "Do you have any special catering requirements?",
        "Are there any pets traveling with you?",
        "Do you prefer a specific aircraft type or size?",
        "What is your budget range?"
      ],
      helicopters: [
        "Where is your departure location?",
        "What is your destination?",
        "When would you like to travel?",
        "How many passengers?",
        "Do you need ground transportation at either end?",
        "Is this for sightseeing or transfer?"
      ]
    },
    searchBehavior: {
      emptyLegs: "When location is mentioned, ALWAYS query the EmptyLegs_ database and show at LEAST 5 offers (or more if available). Filter by departure/arrival cities and dates if provided.",
      jets: "Show at least 5-8 private jet options with detailed specifications (passengers, range, amenities, hourly rate)",
      showAll: "When user says 'show more' or 'see all', increase results to 10-15 offers"
    },
    structure: [
      "Acknowledge the request warmly",
      "Ask DETAILED clarifying questions (2-4 questions at once) to understand complete requirements",
      "When location is shared, immediately search database and present 5+ relevant offers",
      "Provide specific recommendations with pricing and availability",
      "End with clear next step or offer to refine search"
    ],
    examples: {
      incompleteInfo: {
        user: "I need a jet",
        response: "I'd love to help you find the perfect private jet! To give you the best options, I need a few details: Where are you departing from? What's your destination? When would you like to travel? How many passengers will be flying? Do you need extra baggage space or any ground transportation?"
      },
      withLocation: {
        user: "London to Paris next week",
        response: "Perfect! London to Paris next week - excellent route. Let me search for options right away. To ensure I find exactly what you need: Which day next week works best? What time would you prefer to depart? How many passengers? Do you require cabin crew on board? Would you like airport transfers arranged? Any special catering requests?"
      },
      emptyLegRequest: {
        user: "empty leg to Dubai",
        response: "Excellent! Empty legs to Dubai offer fantastic savings. Let me search our EmptyLegs_ database right now. To filter the best options: Where are you departing from? What are your preferred travel dates (or are you flexible within a date range)? How many passengers? Any luggage requirements? I'll show you at least 5 available empty legs for this route!"
      },
      emptyLegWithLocation: {
        user: "empty leg from Zurich",
        response: "[After searching EmptyLegs_ database] Great news! I found 7 empty legs departing from Zurich in the next 2 weeks: 1) Zurich→Dubai on Jan 25 for CHF 18,500 (seats 8), 2) Zurich→London on Jan 26 for CHF 9,200 (seats 6), 3) Zurich→Nice on Jan 27 for CHF 6,800 (seats 7), 4) Zurich→Miami on Jan 28 for CHF 42,000 (seats 10), 5) Zurich→Paris on Jan 29 for CHF 8,500 (seats 6)... Which destination interests you? Need more details on any of these?"
      },
      resultsFound: {
        context: "8 jets found",
        response: "Excellent news! I found 8 private jet options for London-Paris: 1) Citation CJ3+ Light Jet - CHF 4,500/hr, seats 7, 1h15m flight 2) Phenom 300 - CHF 5,200/hr, seats 8 3) Citation XLS+ Midsize - CHF 6,800/hr, seats 9 4) Hawker 900XP - CHF 7,100/hr 5) Challenger 350 Super Midsize - CHF 9,500/hr, seats 10 with full galley... Which jet interests you most? Need cabin crew, ground transfers, or special catering?"
      },
      noResults: {
        context: "No matches",
        response: "I don't see any available options for those exact specifications right now, but let me help! I've saved your request for our operations team who will source the perfect aircraft within the hour. Meanwhile, would you like me to show you alternative dates? Or perhaps a different aircraft type? I can also check nearby departure airports - sometimes that opens up great options!"
      },
      noEmptyLegsForDate: {
        user: "No empty legs on December 7th from Zurich",
        response: "I don't see any empty legs from Zurich on December 7th. However, empty legs are fixed offers that change frequently! Should I look for empty legs on December 8th as well? Or would you like to see the next few days? I can also help you with a regular private jet charter which offers full flexibility on dates and times."
      },
      jetModelMentioned: {
        user: "I'm interested in the Falcon 8X",
        response: "Excellent choice! The Falcon 8X is an Ultra Long Range jet - perfect for intercontinental travel. It seats 12-19 passengers with a range of 12,000+ km. Based on your route and flight time, the estimated cost would be around CHF 15,000-25,000 per hour. For a precise quote, could you tell me: Where are you departing from? What's your destination? When would you like to travel? This will help me calculate an accurate estimate based on availability and current fuel prices."
      }
    }
  },

  /**
   * Common Routes & Pricing (Reference Data)
   */
  popularRoutes: {
    europe: [
      { route: "London - Paris", duration: "1h 15m", jetType: "Light Jet", price: "CHF 8,500" },
      { route: "Zurich - London", duration: "1h 30m", jetType: "Light Jet", price: "CHF 9,500" },
      { route: "Geneva - Nice", duration: "45m", jetType: "Very Light Jet", price: "CHF 6,500" },
      { route: "Zurich - St. Moritz", helicopterTime: "45m", price: "CHF 4,500" },
      { route: "Geneva - Verbier", helicopterTime: "30m", price: "CHF 3,500" }
    ],
    intercontinental: [
      { route: "Zurich - New York", duration: "8h 30m", jetType: "Heavy Jet", price: "CHF 120,000" },
      { route: "London - Dubai", duration: "6h 30m", jetType: "Heavy Jet", price: "CHF 95,000" },
      { route: "Paris - Miami", duration: "9h 15m", jetType: "Ultra Long Range", price: "CHF 135,000" }
    ]
  }
};

/**
 * Get the system prompt for the AI (Optimized for Claude 3.5 Sonnet)
 */
export function getSystemPrompt() {
  return `You are Sphera, a luxury travel concierge AI for PrivateCharterX. Warm, professional, and helpful.

FIRST TIME USER GREETING:
When user first opens chat, say: "Hey! I'm Sphera, your luxury travel assistant. Where would you like to go today?"

CONVERSATION FLOW - CONTEXTUAL & CONTINUOUS:
ALWAYS maintain context from previous messages in the conversation!

Example flow:
1. User: "emptylegs in zurich"
   You: "Perfect! Let me find empty legs in Zurich for you." [CALL searchEmptyLegs with location="zurich"]

2. User: "dubai" (mentions new location without context)
   You: "Are you planning to fly TO Dubai, or depart FROM Dubai?"

3. User: "from dubai"
   You: "Got it! Searching for empty legs from Dubai now." [CALL searchEmptyLegs with from="dubai"]

IMPORTANT CONTEXT RULES:
- If user already searched for a location, remember it
- If user mentions a new location without "from" or "to", ASK for clarification
- Always ask: "Are you flying TO [location] or FROM [location]?"
- Continue conversations naturally, don't start from scratch each time

SEARCH QUERIES:
User: "emptylegs from zurich" → CALL searchEmptyLegs(from="zurich")
User: "emptylegs to zurich" → CALL searchEmptyLegs(to="zurich")
User: "emptylegs in zurich" → CALL searchEmptyLegs(location="zurich")
User: "helicopter in London" → CALL searchHelicopters(location="London")
User: "private jet to Dubai" → CALL searchPrivateJets(location="Dubai")

INCOMPLETE REQUESTS:
User: "I need a helicopter"
You: "I'd love to help! Where are you departing from? What's your destination? When do you need it?"

AFTER SEARCH RESULTS:
Say something like: "Great! I found [X] options for you. Check them out below!"
NEVER list offers in text - they appear in tabs automatically
NEVER repeat prices or details from the results

FOLLOW-UP QUESTIONS (always ask naturally):
- "Where are you heading?"
- "When would you like to travel?"
- "How many passengers?"
- "Need ground transportation?"

BOOKING:
User: "I want to book this"
You: "Great choice! Should I add it to your cart?"

Keep it SHORT (2-3 sentences max), warm, conversational, and REMEMBER previous context!`;
}

/**
 * Detect jet category from model name or description
 * Returns category info with pricing estimation
 */
export function detectJetCategory(modelName) {
  if (!modelName) return null;

  const model = String(modelName).toLowerCase();
  const kb = AI_KNOWLEDGE_BASE;

  // Check modelToCategory mapping
  for (const [key, categoryId] of Object.entries(kb.services.jets.modelToCategory)) {
    if (model.includes(key)) {
      const category = kb.services.jets.categories[categoryId];
      return {
        categoryId,
        categoryName: category.name,
        passengers: category.passengers,
        range: category.range,
        hourlyRate: category.hourlyRate,
        examples: category.examples
      };
    }
  }

  // Fallback: check if model name contains category keywords
  if (model.includes('mustang') || model.includes('phenom 100') || model.includes('eclipse') || model.includes('hondajet')) {
    return {
      categoryId: 'veryLightJet',
      categoryName: 'Very Light Jet',
      passengers: '4-6',
      range: 'Up to 2,000 km',
      hourlyRate: 'CHF 3,500 - 5,500',
      examples: kb.services.jets.categories.veryLightJet.examples
    };
  }

  if (model.includes('gulfstream') || model.includes('global') || model.includes('falcon')) {
    // Determine if heavy or ultra long range based on model number
    if (model.includes('g650') || model.includes('g700') || model.includes('g800') ||
        model.includes('global 7500') || model.includes('global 8000') ||
        model.includes('falcon 8x') || model.includes('bbj') || model.includes('acj')) {
      return {
        categoryId: 'ultraLongRange',
        categoryName: 'Ultra Long Range',
        passengers: '12-19',
        range: '12,000+ km',
        hourlyRate: 'CHF 15,000 - 25,000+',
        examples: kb.services.jets.categories.ultraLongRange.examples
      };
    } else {
      return {
        categoryId: 'heavyJet',
        categoryName: 'Heavy Jet',
        passengers: '10-16',
        range: '7,500 - 12,000 km',
        hourlyRate: 'CHF 12,000 - 18,000',
        examples: kb.services.jets.categories.heavyJet.examples
      };
    }
  }

  return null;
}

/**
 * Calculate estimated flight cost based on category and distance/flight time
 * Based on UnifiedBookingFlow.tsx pricing structure
 */
export function calculateEstimatedCost(categoryId, flightHours) {
  const pricingMap = {
    'veryLightJet': 4300,    // CHF per hour
    'lightJet': 5100,        // CHF per hour
    'midsizeJet': 8800,      // CHF per hour
    'superMidsize': 11000,   // CHF per hour
    'heavyJet': 14000,       // CHF per hour
    'ultraLongRange': 16800, // CHF per hour
    'businessAirliner': 19500 // CHF per hour
  };

  const hourlyRate = pricingMap[categoryId] || 8800; // Default to midsize
  const basePrice = Math.round(flightHours * hourlyRate);
  const minPrice = Math.round(basePrice * 0.9);  // -10% for availability
  const maxPrice = Math.round(basePrice * 1.15); // +15% for peak times

  return {
    hourlyRate,
    flightHours,
    basePrice,
    estimatedRange: `CHF ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`,
    note: 'Final pricing depends on availability, fuel prices, landing fees, and operational requirements'
  };
}

export default AI_KNOWLEDGE_BASE;
