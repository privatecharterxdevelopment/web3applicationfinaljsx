import { supabase } from '../lib/supabase';
import { SphereAI } from '../lib/openAI';

/**
 * Service for handling intelligent travel search with AI parsing and Supabase queries
 */
export class TravelSearchService {
  constructor(userId) {
    this.userId = userId;
    this.ai = new SphereAI();
  }

  /**
   * Main search function - takes natural language query and returns results
   */
  async search(query, conversationHistory = []) {
    try {
      // Step 1: Use AI to parse the query and extract booking intent
      const extractedIntent = await this.ai.extractTravelRequest([
        ...conversationHistory.map(msg => ({ content: msg.content, role: msg.role })),
        { content: query, role: 'user' }
      ]);

      // Preserve raw query for downstream natural language parsing (dates like "second week of October")
      extractedIntent.raw_query = query;

      console.log('Extracted intent (raw):', extractedIntent);

      // Normalize/sanitize intent based on the raw query (keywords and simple patterns)
      const sanitizedIntent = this.sanitizeIntent(extractedIntent);
      console.log('Sanitized intent:', sanitizedIntent);

      // Step 1.5: Validate required fields for the requested service
      const validation = this.validateIntent(sanitizedIntent);
      const svc = (sanitizedIntent.service_type || '').toLowerCase();
      const hasSpecificService = !!svc;

      // Step 2: Query Supabase based on extracted intent
      // If no specific service requested (discovery), fetch across all to keep the user engaged
      const results = await this.querySupabase(sanitizedIntent);

      // Step 3: Save ALL chat requests (both with and without results)
      const hasResults = results.totalResults > 0;
      const requestId = await this.saveChatRequest(
        query,
        sanitizedIntent,
        conversationHistory,
        hasResults,
        results
      );

      return {
        success: true,
        intent: sanitizedIntent,
        results: results,
        query: query,
        requestId: requestId,
        // Always include guidance so UI can ask smart follow-ups
        needsMoreInfo: hasSpecificService && !validation.complete,
        missingFields: validation.missingFields,
        followUpPrompt: validation.followUpPrompt
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        success: false,
        error: error.message,
        query: query
      };
    }
  }

  /**
   * Query Supabase tables based on sanitized intent
   * If no specific service is requested, fetch all to present multiple tabs
   */
  async querySupabase(intent) {
    const results = {
      emptyLegs: [],
      jets: [],
      helicopters: [],
      luxuryCars: [],
      yachts: [],
      adventures: [],
      taxi: [],
      totalResults: 0
    };

    try {
      const [emptyLegsData, jetsData, helicoptersData, carsData, yachtsData, adventuresData, taxiData] = await Promise.all([
        this.queryEmptyLegs(intent),
        this.queryJets(intent),
        this.queryHelicopters(intent),
        this.queryLuxuryCars(intent),
        this.queryYachts(intent),
        this.queryAdventures(intent),
        this.queryTaxi(intent)
      ]);

      results.emptyLegs = emptyLegsData; results.totalResults += emptyLegsData.length;
      results.jets = jetsData; results.totalResults += jetsData.length;
      results.helicopters = helicoptersData; results.totalResults += helicoptersData.length;
      results.luxuryCars = carsData; results.totalResults += carsData.length;
      results.yachts = yachtsData; results.totalResults += yachtsData.length;
      results.adventures = adventuresData; results.totalResults += adventuresData.length;
      results.taxi = taxiData; results.totalResults += taxiData.length;

      return results;
    } catch (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
  }

  /**
   * Query Empty Legs table
   */
  async queryEmptyLegs(intent) {
    try {
      let baseQuery = supabase.from('EmptyLegs_').select('*');

      // Filter by departure location
      if (intent.from_location || intent.departure_location) {
        const location = intent.from_location || intent.departure_location;
        // Support multiple possible schemas: from/from_city/departure_*
        baseQuery = baseQuery.or(
          `from.ilike.%${location}%,from_city.ilike.%${location}%,departure_airport.ilike.%${location}%,departure_city.ilike.%${location}%`
        );
      }

      // Filter by destination
      if (intent.to_location || intent.destination) {
        const location = intent.to_location || intent.destination;
        baseQuery = baseQuery.or(
          `to.ilike.%${location}%,to_city.ilike.%${location}%,arrival_airport.ilike.%${location}%,arrival_city.ilike.%${location}%`
        );
      }

      // Filter by date or date range (supports natural phrases like "mid October" or "second week of October")
      const dateRange = this.resolveDateRange(intent);
      if (dateRange?.from) {
        baseQuery = baseQuery.gte('departure_date', dateRange.from);
      }
      if (dateRange?.to) {
        baseQuery = baseQuery.lte('departure_date', dateRange.to);
      }

      // Filter by passenger count
      if (intent.passengers || intent.passenger_count) {
        const passengers = intent.passengers || intent.passenger_count;
        // Try seats or max_passengers
        baseQuery = baseQuery.or(`max_passengers.gte.${passengers},seats.gte.${passengers}`);
      }

      // Filter by budget
      if (intent.budget) {
        baseQuery = baseQuery.lte('price', intent.budget);
      }

      // First attempt: full filters
  let { data, error } = await baseQuery.order('departure_date', { ascending: true }).limit(20);

      if (error) throw error;
      if (data && data.length > 0) return data;

      // Fallback 1: drop destination constraint if set
      let fallback1 = supabase.from('EmptyLegs_').select('*');
      if (intent.from_location || intent.departure_location) {
        const location = intent.from_location || intent.departure_location;
        fallback1 = fallback1.or(`from.ilike.%${location}%,from_city.ilike.%${location}%,departure_airport.ilike.%${location}%,departure_city.ilike.%${location}%`);
      }
      if (dateRange?.from) fallback1 = fallback1.gte('departure_date', dateRange.from);
      if (dateRange?.to) fallback1 = fallback1.lte('departure_date', dateRange.to);
      if (intent.passengers || intent.passenger_count) {
        const passengers = intent.passengers || intent.passenger_count;
        fallback1 = fallback1.or(`max_passengers.gte.${passengers},seats.gte.${passengers}`);
      }
      if (intent.budget) fallback1 = fallback1.lte('price', intent.budget);

      let fb1 = await fallback1.limit(20);
      if (fb1.error) throw fb1.error;
      if (fb1.data && fb1.data.length > 0) return fb1.data;

      // Fallback 2: widen date window +/- 7 days from start if available
      if (dateRange?.from) {
        const aroundFrom = this.addDays(dateRange.from, -7);
        const aroundTo = this.addDays(dateRange.to || dateRange.from, 7);
        let fallback2 = supabase.from('EmptyLegs_').select('*');
        if (intent.from_location || intent.departure_location) {
          const location = intent.from_location || intent.departure_location;
          fallback2 = fallback2.or(`from.ilike.%${location}%,from_city.ilike.%${location}%,departure_airport.ilike.%${location}%,departure_city.ilike.%${location}%`);
        }
        fallback2 = fallback2.gte('departure_date', aroundFrom).lte('departure_date', aroundTo);
        if (intent.passengers || intent.passenger_count) {
          const passengers = intent.passengers || intent.passenger_count;
          fallback2 = fallback2.or(`max_passengers.gte.${passengers},seats.gte.${passengers}`);
        }
        if (intent.budget) fallback2 = fallback2.lte('price', intent.budget);
        const fb2 = await fallback2.limit(20);
        if (fb2.error) throw fb2.error;
        if (fb2.data && fb2.data.length > 0) return fb2.data;
      }

      return [];
    } catch (error) {
      console.error('Empty legs query error:', error);
      return [];
    }
  }

  /**
   * Determine if the intent has the minimum fields for priced results per service type
   */
  validateIntent(intent) {
    const service = (intent.service_type || '').toLowerCase();

    // Minimal required fields per service to show priced cards
      const requirements = {
        'empty_legs': ['from_location', 'to_location', 'date'],
        'empty-legs': ['from_location', 'to_location', 'date'],
        'jets': ['from_location', 'to_location', 'date', 'passengers'],
        'private-jet': ['from_location', 'to_location', 'date', 'passengers'],
        'helicopters': ['from_location', 'to_location', 'date', 'passengers'],
        'helicopter': ['from_location', 'to_location', 'date', 'passengers'],
        'luxury_cars': ['location', 'date'],
        'cars': ['location', 'date'],
        'yachts': ['location', 'date', 'passengers'],
        'yacht': ['location', 'date', 'passengers'],
        'adventures': ['destination'],
        'adventure': ['destination'],
        'taxi': ['from_location', 'to_location', 'date']
      };

    // Helpers
    const hasFrom = !!(intent.from_location || intent.departure_location);
    const hasTo = !!(intent.to_location || intent.destination);
    const hasDate = !!(intent.date_start || intent.travel_date || this.resolveDateRange(intent)?.from);
    const hasPassengers = !!(intent.passengers || intent.passenger_count);
    const hasLocation = !!(intent.from_location || intent.to_location || intent.destination);
    const hasDestination = !!(intent.destination || intent.to_location);

    const required = requirements[service] || [];
    const missing = [];
    for (const key of required) {
      if (key === 'from_location' && !hasFrom) missing.push('departure location');
      else if (key === 'to_location' && !hasTo) missing.push('destination');
      else if (key === 'date' && !hasDate) missing.push('date');
      else if (key === 'passengers' && !hasPassengers) missing.push('passenger count');
      else if (key === 'location' && !hasLocation) missing.push('location');
      else if (key === 'destination' && !hasDestination) missing.push('destination');
    }

      const complete = missing.length === 0 || required.length === 0; // If service not recognized, don't block

    let followUpPrompt = '';
    if (!complete) {
      const humanService = service || 'your trip';
      const lastPart = missing.length > 1
        ? `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`
        : missing[0];
      followUpPrompt = `To find priced options for ${humanService}, please share your ${lastPart}.`;
    }

    return { complete, missingFields: missing, followUpPrompt };
  }

  /**
   * Resolve a date range from the intent, supporting natural phrases like "second week of October" or "mid October".
   * Returns { from: 'YYYY-MM-DD', to?: 'YYYY-MM-DD' } or null.
   */
  resolveDateRange(intent) {
    try {
      // Direct fields
      if (intent.date_start && intent.date_end) {
        return { from: this.toDateString(intent.date_start), to: this.toDateString(intent.date_end) };
      }
      if (intent.date_start) {
        return { from: this.toDateString(intent.date_start) };
      }
      if (intent.travel_date) {
        return { from: this.toDateString(intent.travel_date) };
      }

      const q = (intent.raw_query || '').toLowerCase();
      if (!q) return null;

      const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
      const monthIndex = (m) => monthNames.indexOf(m.toLowerCase());
      const pad2 = (n) => n.toString().padStart(2, '0');
      const thisYear = new Date().getFullYear();

      // Helper to build from/to
      const range = (y, mIdx, startDay, endDay) => ({
        from: `${y}-${pad2(mIdx + 1)}-${pad2(startDay)}`,
        to: `${y}-${pad2(mIdx + 1)}-${pad2(endDay)}`
      });

      // second week of October (2025)
      const weekMatch = q.match(/(first|second|third|fourth|fifth)\s+week\s+of\s+([a-zA-Z]+)\s*(\d{4})?/);
      if (weekMatch) {
        const ordinal = weekMatch[1];
        const month = weekMatch[2];
        const year = weekMatch[3] ? parseInt(weekMatch[3], 10) : thisYear;
        const mIdx = monthIndex(month);
        if (mIdx >= 0) {
          const weekNumber = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 }[ordinal];
          const startDay = (weekNumber - 1) * 7 + 1; // Approximate weeks by 7-day blocks starting on the 1st
          const endDay = Math.min(startDay + 6, new Date(year, mIdx + 1, 0).getDate());
          return range(year, mIdx, startDay, endDay);
        }
      }

      // week of October 14, 2025
      const weekOfMatch = q.match(/week\s+of\s+([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*(\d{4}))?/);
      if (weekOfMatch) {
        const month = weekOfMatch[1];
        const day = parseInt(weekOfMatch[2], 10);
        const year = weekOfMatch[3] ? parseInt(weekOfMatch[3], 10) : thisYear;
        const mIdx = monthIndex(month);
        if (mIdx >= 0) {
          const maxDay = new Date(year, mIdx + 1, 0).getDate();
          const startDay = Math.max(1, Math.min(day, maxDay));
          const endDay = Math.min(startDay + 6, maxDay);
          return range(year, mIdx, startDay, endDay);
        }
      }

      // mid October (2025) -> 11th to 20th, early -> 1st-10th, late -> 21st-end
      const midMatch = q.match(/\b(mid|early|late)[-\s]+([a-zA-Z]+)\s*(\d{4})?/);
      if (midMatch) {
        const when = midMatch[1];
        const month = midMatch[2];
        const year = midMatch[3] ? parseInt(midMatch[3], 10) : thisYear;
        const mIdx = monthIndex(month);
        if (mIdx >= 0) {
          const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
          if (when === 'early') return range(year, mIdx, 1, Math.min(10, daysInMonth));
          if (when === 'mid') return range(year, mIdx, 11, Math.min(20, daysInMonth));
          return range(year, mIdx, 21, daysInMonth);
        }
      }

      // Specific month and year like "October 2025" -> whole month
      const monthYearMatch = q.match(/\b([a-zA-Z]+)\s+(\d{4})\b/);
      if (monthYearMatch) {
        const mIdx = monthIndex(monthYearMatch[1]);
        const year = parseInt(monthYearMatch[2], 10);
        if (mIdx >= 0) {
          const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
          return range(year, mIdx, 1, daysInMonth);
        }
      }

      return null;
    } catch (e) {
      console.warn('resolveDateRange error:', e);
      return null;
    }
  }

  toDateString(dateVal) {
    try {
      if (!dateVal) return undefined;
      if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal; // already YYYY-MM-DD
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Heuristic cleanup: infer service type, route, passengers from raw query
   */
  sanitizeIntent(intent) {
    const out = { ...intent };
    const q = (intent.raw_query || '').toLowerCase();

    // Infer service type from keywords if concierge/unknown
    const known = ['empty_legs','empty-legs','empty legs','jets','private-jet','helicopter','helicopters','luxury_cars','cars','yachts','yacht','taxi','transfer','adventures','adventure'];
    const svc = (out.service_type || '').toLowerCase();
    if (!known.includes(svc)) {
      if (q.includes('empty leg') || q.includes('emptyleg') || q.includes('empty legs') || q.includes('emptyleg') || q.includes('emptylegs')) out.service_type = 'empty_legs';
      else if (q.includes('private jet') || q.includes('jet')) out.service_type = 'jets';
      else if (q.includes('helicopter')) out.service_type = 'helicopters';
      else if (q.includes('yacht')) out.service_type = 'yachts';
      else if (q.includes('car')) out.service_type = 'luxury_cars';
      else if (q.includes('taxi') || q.includes('transfer')) out.service_type = 'taxi';
      else if (q.includes('adventure')) out.service_type = 'adventures';
    }

    // Parse passengers: "for 2 passengers" or "for 2 pax"
    if (!out.passengers && !out.passenger_count) {
      const pm = q.match(/for\s+(\d{1,2})\s*(passenger|passengers|pax|people)?/);
      if (pm) out.passengers = parseInt(pm[1], 10);
    }

    // Parse route: "from X to Y" or "X to Y"
    const route1 = q.match(/from\s+([^,]+?)\s+(?:to|->)\s+([^,]+?)(?:\s|$)/);
    if (route1) {
      out.from_location = out.from_location || out.departure_location || route1[1].trim();
      out.to_location = out.to_location || out.destination || route1[2].trim();
    } else {
      // Fallback pattern: "London to Geneva" (stop at common delimiters)
      const route2 = q.match(/\b([a-zA-Z][a-zA-Z .'-]+?)\s+to\s+([a-zA-Z][a-zA-Z .'-]+?)(?:\s+(?:in|on|at|for|by|this|next|the)\b|$)/);
      if (route2) {
        out.from_location = out.from_location || out.departure_location || route2[1].trim();
        out.to_location = out.to_location || out.destination || route2[2].trim();
      }
    }

    // If to == from and query includes a different "to" capture, prefer the parsed "to"
    if (out.from_location && out.to_location && out.from_location.toLowerCase() === out.to_location.toLowerCase()) {
      const toOnly = q.match(/\bto\s+([a-zA-Z][a-zA-Z .'-]+)/);
      if (toOnly) out.to_location = toOnly[1].trim();
    }

    return out;
  }

  addDays(dateStr, days) {
    try {
      const d = new Date(dateStr + 'T00:00:00Z');
      if (isNaN(d.getTime())) return dateStr;
      d.setUTCDate(d.getUTCDate() + days);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * Query Jets table
   */
  async queryJets(intent) {
    try {
      let query = supabase.from('jets').select('*');

      // Filter by passenger count
      if (intent.passengers || intent.passenger_count) {
        const passengers = intent.passengers || intent.passenger_count;
        query = query.or(`passenger_capacity.gte.${passengers},capacity.gte.${passengers}`);
      }

      // Filter by budget (hourly rate)
      if (intent.budget) {
        query = query.or(`hourly_rate.lte.${intent.budget},price_per_hour.lte.${intent.budget}`);
      }

      // Filter by availability
  // Availability may be stored as availability or is_available; if neither exists, this will be ignored by Supabase
  query = query.or('availability.eq.true,is_available.eq.true');

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Jets query error:', error);
      return [];
    }
  }

  /**
   * Query Helicopters table
   */
  async queryHelicopters(intent) {
    try {
      let query = supabase.from('helicopters').select('*');

      // Filter by passenger count
      if (intent.passengers || intent.passenger_count) {
        const passengers = intent.passengers || intent.passenger_count;
        query = query.gte('passenger_capacity', passengers);
      }

      // Filter by budget
      if (intent.budget) {
        query = query.lte('hourly_rate', intent.budget);
      }

      // Filter by availability
      query = query.eq('availability', true);

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Helicopters query error:', error);
      return [];
    }
  }

  /**
   * Query Luxury Cars table
   */
  async queryLuxuryCars(intent) {
    try {
      let query = supabase.from('luxury_cars').select('*');

      // Filter by passenger count (seats)
      if (intent.passengers || intent.passenger_count) {
        const passengers = intent.passengers || intent.passenger_count;
        query = query.or(`seats.gte.${passengers}`);
      }

      // Filter by budget (daily rate)
      if (intent.budget) {
        query = query.or(`daily_rate.lte.${intent.budget},price_per_day.lte.${intent.budget}`);
      }

      // Filter by availability
  // Availability may be absent; try common variants
  query = query.or('available.eq.true,is_available.eq.true');

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Luxury cars query error:', error);
      return [];
    }
  }

  /**
   * Query Yachts table
   */
  async queryYachts(intent) {
    try {
      let query = supabase.from('yachts').select('*');

      // Filter by passenger count (guests)
      if (intent.passengers || intent.passenger_count) {
        const passengers = intent.passengers || intent.passenger_count;
        query = query.gte('max_guests', passengers);
      }

      // Filter by budget
      if (intent.budget) {
        query = query.lte('daily_rate', intent.budget);
      }

      // Filter by location (if specified)
      if (intent.from_location || intent.to_location) {
        const location = intent.from_location || intent.to_location;
        query = query.ilike('location', `%${location}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Yachts query error:', error);
      return [];
    }
  }

  /**
   * Query Adventures table
   */
  async queryAdventures(intent) {
    try {
      let query = supabase.from('adventures').select('*');

      // Filter by location (destination)
      if (intent.to_location || intent.destination) {
        const location = intent.to_location || intent.destination;
        query = query.or(`location.ilike.%${location}%,destination.ilike.%${location}%`);
      }

      // Filter by budget
      if (intent.budget) {
        query = query.lte('price_from', intent.budget);
      }

      // Filter by passenger count (max participants)
      if (intent.passengers || intent.passenger_count) {
        const passengers = intent.passengers || intent.passenger_count;
        query = query.gte('max_participants', passengers);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Adventures query error:', error);
      return [];
    }
  }

  /**
   * Query Taxi/Fixed Offers table
   */
  async queryTaxi(intent) {
    try {
      let query = supabase.from('fixed_offers').select('*');

      // Filter by route (from/to locations)
      if (intent.from_location) {
        // Match either origin or from_location schema
        query = query.or(`from_location.ilike.%${intent.from_location}%,origin.ilike.%${intent.from_location}%`);
      }
      if (intent.to_location) {
        query = query.or(`to_location.ilike.%${intent.to_location}%,destination.ilike.%${intent.to_location}%`);
      }

      // Filter by budget
      if (intent.budget) {
        query = query.lte('price', intent.budget);
      }

  // Some schemas distinguish service_type; if not present, results will still return
  // query = query.or('service_type.eq.taxi,service_type.eq.transfer');

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Taxi query error:', error);
      return [];
    }
  }

  /**
   * Save ALL chat requests (both with and without results)
   */
  async saveChatRequest(query, intent, conversationHistory, hasResults = false, results = null) {
    try {
      const requestData = {
        user_id: this.userId,
        query: query,
        service_type: intent.service_type,
        from_location: intent.from_location || intent.departure_location,
        to_location: intent.to_location || intent.destination,
        date_start: intent.date_start || intent.travel_date,
        date_end: intent.date_end,
        passengers: intent.passengers || intent.passenger_count,
        budget: intent.budget,
        pets: intent.pets,
        special_requirements: intent.special_requirements,
        confidence_score: intent.confidence_score,
        conversation_history: conversationHistory,
        has_results: hasResults,
        results_count: results ? results.totalResults : 0,
        results_summary: results ? this.createResultsSummary(results) : null,
        status: hasResults ? 'completed' : 'pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('chat_requests')
        .insert([requestData])
        .select();

      if (error) throw error;

      // Send email notification only if no results found
      if (!hasResults) {
        await this.sendEmailNotification(requestData);
      }

      console.log('Chat request saved:', data);
      return data && data[0] ? data[0].id : null;
    } catch (error) {
      console.error('Error saving chat request:', error);
      throw error;
    }
  }

  /**
   * Create a summary of search results for storage
   */
  createResultsSummary(results) {
    const summary = {};

    if (results.emptyLegs && results.emptyLegs.length > 0) {
      summary.emptyLegs = results.emptyLegs.length;
    }
    if (results.jets && results.jets.length > 0) {
      summary.jets = results.jets.length;
    }
    if (results.helicopters && results.helicopters.length > 0) {
      summary.helicopters = results.helicopters.length;
    }
    if (results.luxuryCars && results.luxuryCars.length > 0) {
      summary.luxuryCars = results.luxuryCars.length;
    }
    if (results.yachts && results.yachts.length > 0) {
      summary.yachts = results.yachts.length;
    }
    if (results.adventures && results.adventures.length > 0) {
      summary.adventures = results.adventures.length;
    }
    if (results.taxi && results.taxi.length > 0) {
      summary.taxi = results.taxi.length;
    }

    return summary;
  }

  /**
   * Send email notification for new chat request
   */
  async sendEmailNotification(requestData) {
    try {
      // In production, this would use Supabase Edge Functions or a backend service
      // For now, we'll log it
      console.log('EMAIL NOTIFICATION - New Chat Request:');
      console.log('To: bookings@privatecharterx.com');
      console.log('Subject: New Travel Request from AI Chat');
      console.log('Body:', JSON.stringify(requestData, null, 2));

      // TODO: Implement actual email sending via Supabase Edge Function
      // Example:
      // const { data, error } = await supabase.functions.invoke('send-email', {
      //   body: {
      //     to: 'bookings@privatecharterx.com',
      //     subject: 'New Travel Request from AI Chat',
      //     requestData: requestData
      //   }
      // });
    } catch (error) {
      console.error('Email notification error:', error);
      // Don't throw - email failure shouldn't block the request
    }
  }

  /**
   * Format results for display in tabs/cards
   */
  formatResultsForDisplay(results) {
    const tabs = [];

    if (results.emptyLegs.length > 0) {
      tabs.push({
        id: 'empty-legs',
        title: 'Empty Legs',
        count: results.emptyLegs.length,
        icon: '✈️',
        items: results.emptyLegs.map(leg => {
          const depCity = leg.departure_city || leg.from_city || leg.from || leg.origin_city || leg.origin;
          const arrCity = leg.arrival_city || leg.to_city || leg.to || leg.destination_city || leg.destination;
          const depApt = leg.departure_airport || leg.from_airport || leg.from || '';
          const arrApt = leg.arrival_airport || leg.to_airport || leg.to || '';
          const pax = leg.max_passengers ?? leg.seats ?? leg.passengers;
          return ({
            id: leg.id,
            title: `${leg.aircraft_type || 'Private Jet'} - ${depCity || 'TBD'} to ${arrCity || 'TBD'}`,
            subtitle: `${leg.departure_date} ${leg.departure_time ? 'at ' + leg.departure_time : ''}`,
            price: leg.price,
            currency: leg.currency || 'CHF',
            details: {
              'Aircraft': leg.aircraft_type,
              'Departure': `${depCity || 'TBD'}${depApt ? ` (${depApt})` : ''}`,
              'Arrival': `${arrCity || 'TBD'}${arrApt ? ` (${arrApt})` : ''}`,
              'Date': leg.departure_date,
              'Time': leg.departure_time || 'Flexible',
              'Passengers': pax,
              'Flight Time': leg.flight_duration
            },
            availability: leg.availability,
            imageUrl: leg.image_url
          });
        })
      });
    }

    if (results.jets.length > 0) {
      tabs.push({
        id: 'jets',
        title: 'Private Jets',
        count: results.jets.length,
        icon: '🛩️',
        items: results.jets.map(jet => {
          const capacity = jet.passenger_capacity ?? jet.capacity;
          const rate = jet.hourly_rate ?? jet.price_per_hour;
          const title = (jet.manufacturer && jet.model)
            ? `${jet.manufacturer} ${jet.model}`
            : (jet.name || 'Private Jet');
          const available = jet.availability ?? jet.is_available ?? true;
          return ({
            id: jet.id,
            title,
            subtitle: `${jet.category || 'Jet'} - ${capacity || 'N/A'} passengers`,
            price: rate,
            currency: jet.currency || 'CHF',
            priceUnit: 'per hour',
            details: {
              'Category': jet.category,
              'Manufacturer': jet.manufacturer,
              'Model': jet.model || jet.name,
              'Passengers': capacity,
              'Range': jet.range_km ? `${jet.range_km} km` : (jet.range ? `${jet.range} km` : 'N/A'),
              'Cruising Speed': jet.cruising_speed ? `${jet.cruising_speed} km/h` : (jet.speed ? `${jet.speed} km/h` : 'N/A'),
              'Baggage': jet.baggage_capacity
            },
            availability: available,
            imageUrl: jet.image_url
          });
        })
      });
    }

    if (results.helicopters.length > 0) {
      tabs.push({
        id: 'helicopters',
        title: 'Helicopters',
        count: results.helicopters.length,
        icon: '🚁',
        items: results.helicopters.map(heli => ({
          id: heli.id,
          title: `${heli.manufacturer} ${heli.model}`,
          subtitle: `${heli.category} - ${heli.passenger_capacity} passengers`,
          price: heli.hourly_rate,
          currency: heli.currency || 'CHF',
          priceUnit: 'per hour',
          details: {
            'Category': heli.category,
            'Manufacturer': heli.manufacturer,
            'Model': heli.model,
            'Passengers': heli.passenger_capacity,
            'Range': heli.range_km ? `${heli.range_km} km` : 'N/A',
            'Cruising Speed': heli.cruising_speed ? `${heli.cruising_speed} km/h` : 'N/A'
          },
          availability: heli.availability,
          imageUrl: heli.image_url
        }))
      });
    }

    if (results.luxuryCars.length > 0) {
      tabs.push({
        id: 'luxury-cars',
        title: 'Luxury Cars',
        count: results.luxuryCars.length,
        icon: '🚗',
        items: results.luxuryCars.map(car => ({
          id: car.id,
          title: `${car.brand || ''} ${car.model || car.name || ''}`.trim(),
          subtitle: `${car.category || car.type || 'Car'}${car.seats ? ` - ${car.seats} seats` : ''}`,
          price: car.daily_rate ?? car.price_per_day,
          currency: car.currency || 'CHF',
          priceUnit: 'per day',
          details: {
            'Brand': car.brand,
            'Model': car.model || car.name,
            'Category': car.category || car.type,
            'Year': car.year,
            'Seats': car.seats,
            'Color': car.color,
            'Location': car.location
          },
          availability: car.available ?? car.is_available ?? true,
          imageUrl: car.image_url
        }))
      });
    }

    if (results.yachts.length > 0) {
      tabs.push({
        id: 'yachts',
        title: 'Yachts',
        count: results.yachts.length,
        icon: '🛥️',
        items: results.yachts.map(yacht => ({
          id: yacht.id,
          title: yacht.name,
          subtitle: `${yacht.yacht_type} - ${yacht.max_guests} guests`,
          price: yacht.daily_rate,
          currency: yacht.currency || 'CHF',
          priceUnit: 'per day',
          details: {
            'Type': yacht.yacht_type,
            'Length': yacht.length_meters ? `${yacht.length_meters}m` : 'N/A',
            'Guests': yacht.max_guests,
            'Cabins': yacht.cabins,
            'Crew': yacht.crew_members,
            'Location': yacht.location
          },
          availability: true,
          imageUrl: yacht.image_url
        }))
      });
    }

    if (results.adventures.length > 0) {
      tabs.push({
        id: 'adventures',
        title: 'Adventures',
        count: results.adventures.length,
        icon: '🏔️',
        items: results.adventures.map(adventure => ({
          id: adventure.id,
          title: adventure.title,
          subtitle: `${adventure.location} - ${adventure.duration}`,
          price: adventure.price_from,
          currency: adventure.currency || 'CHF',
          priceUnit: 'from',
          details: {
            'Type': adventure.adventure_type,
            'Location': adventure.location,
            'Duration': adventure.duration,
            'Difficulty': adventure.difficulty_level,
            'Max Participants': adventure.max_participants,
            'Includes': adventure.includes
          },
          availability: true,
          imageUrl: adventure.image_url
        }))
      });
    }

    if (results.taxi.length > 0) {
      tabs.push({
        id: 'taxi',
        title: 'Taxi & Transfers',
        count: results.taxi.length,
        icon: '🚕',
        items: results.taxi.map(taxi => ({
          id: taxi.id,
          title: `${taxi.from_location || taxi.origin || 'Origin'} → ${taxi.to_location || taxi.destination || 'Destination'}`,
          subtitle: taxi.vehicle_type || 'Transfer Service',
          price: taxi.price,
          currency: taxi.currency || 'CHF',
          details: {
            'From': taxi.from_location || taxi.origin,
            'To': taxi.to_location || taxi.destination,
            'Vehicle': taxi.vehicle_type,
            'Duration': taxi.duration,
            'Distance': taxi.distance
          },
          availability: true,
          imageUrl: taxi.image_url
        }))
      });
    }

    return tabs;
  }
}

export default TravelSearchService;
