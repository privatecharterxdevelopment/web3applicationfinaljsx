// services/supabaseService.js
// Fetches all service data from Supabase including images

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// AIRCRAFT SERVICE
// ============================================
export const AircraftService = {
  // Get all aircraft
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select(`
          *,
          images:aircraft_images(*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching aircraft:', error);
      return { data: null, error };
    }
  },

  // Get aircraft by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select(`
          *,
          images:aircraft_images(*),
          specifications:aircraft_specifications(*),
          features:aircraft_features(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching aircraft:', error);
      return { data: null, error };
    }
  },

  // Search aircraft by criteria
  async search({ passengers, range, maxPrice, type }) {
    try {
      let query = supabase
        .from('aircraft')
        .select(`
          *,
          images:aircraft_images(*)
        `);

      if (passengers) {
        query = query.gte('max_passengers', passengers);
      }
      if (range) {
        query = query.gte('range_km', range);
      }
      if (maxPrice) {
        query = query.lte('hourly_rate_eur', maxPrice);
      }
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query.order('hourly_rate_eur', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching aircraft:', error);
      return { data: null, error };
    }
  }
};

// ============================================
// EMPTY LEGS SERVICE
// ============================================
export const EmptyLegsService = {
  // Get all available empty legs
  async getAvailable() {
    try {
      const { data, error } = await supabase
        .from('empty_legs')
        .select(`
          *,
          aircraft:aircraft_id(
            *,
            images:aircraft_images(*)
          )
        `)
        .gte('departure_date', new Date().toISOString())
        .eq('status', 'available')
        .order('departure_date', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching empty legs:', error);
      return { data: null, error };
    }
  },

  // Search empty legs by location
  async searchByLocation(location) {
    try {
      const { data, error } = await supabase
        .from('empty_legs')
        .select(`
          *,
          aircraft:aircraft_id(
            *,
            images:aircraft_images(*)
          )
        `)
        .or(`departure_airport.ilike.%${location}%,arrival_airport.ilike.%${location}%,departure_city.ilike.%${location}%,arrival_city.ilike.%${location}%`)
        .gte('departure_date', new Date().toISOString())
        .eq('status', 'available')
        .order('departure_date', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching empty legs:', error);
      return { data: null, error };
    }
  }
};

// ============================================
// HELICOPTERS SERVICE
// ============================================
export const HelicoptersService = {
  // Get all helicopters
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('helicopters')
        .select(`
          *,
          images:helicopter_images(*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching helicopters:', error);
      return { data: null, error };
    }
  },

  // Search helicopters
  async search({ passengers, type }) {
    try {
      let query = supabase
        .from('helicopters')
        .select(`
          *,
          images:helicopter_images(*)
        `);

      if (passengers) {
        query = query.gte('max_passengers', passengers);
      }
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query.order('hourly_rate_eur', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching helicopters:', error);
      return { data: null, error };
    }
  }
};

// ============================================
// YACHTS SERVICE
// ============================================
export const YachtsService = {
  // Get all yachts
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('yachts')
        .select(`
          *,
          images:yacht_images(*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching yachts:', error);
      return { data: null, error };
    }
  },

  // Search yachts
  async search({ passengers, location, minLength, maxLength }) {
    try {
      let query = supabase
        .from('yachts')
        .select(`
          *,
          images:yacht_images(*)
        `);

      if (passengers) {
        query = query.gte('max_passengers', passengers);
      }
      if (location) {
        query = query.contains('available_locations', [location]);
      }
      if (minLength) {
        query = query.gte('length_ft', minLength);
      }
      if (maxLength) {
        query = query.lte('length_ft', maxLength);
      }

      const { data, error } = await query.order('daily_rate_eur', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching yachts:', error);
      return { data: null, error };
    }
  }
};

// ============================================
// LUXURY CARS SERVICE
// ============================================
export const LuxuryCarsService = {
  // Get all luxury cars
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('luxury_cars')
        .select(`
          *,
          images:car_images(*)
        `)
        .order('brand', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching luxury cars:', error);
      return { data: null, error };
    }
  },

  // Search cars
  async search({ passengers, location, type }) {
    try {
      let query = supabase
        .from('luxury_cars')
        .select(`
          *,
          images:car_images(*)
        `);

      if (passengers) {
        query = query.gte('max_passengers', passengers);
      }
      if (location) {
        query = query.contains('available_locations', [location]);
      }
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query.order('hourly_rate_eur', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching cars:', error);
      return { data: null, error };
    }
  }
};

// ============================================
// ADVENTURES SERVICE
// ============================================
export const AdventuresService = {
  // Get all adventures
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('adventures')
        .select(`
          *,
          images:adventure_images(*)
        `)
        .order('destination', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching adventures:', error);
      return { data: null, error };
    }
  },

  // Search adventures by destination
  async searchByDestination(destination) {
    try {
      const { data, error } = await supabase
        .from('adventures')
        .select(`
          *,
          images:adventure_images(*)
        `)
        .ilike('destination', `%${destination}%`)
        .order('price_eur', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching adventures:', error);
      return { data: null, error };
    }
  }
};

// ============================================
// TOKENIZED ASSETS SERVICE
// ============================================
export const TokenizedAssetsService = {
  // Get all tokenized assets (jets & yachts available for fractional ownership)
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('tokenized_assets')
        .select(`
          *,
          asset_details:asset_id(*),
          images:tokenized_asset_images(*)
        `)
        .eq('available', true)
        .order('asset_type', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching tokenized assets:', error);
      return { data: null, error };
    }
  },

  // Get by asset type
  async getByType(assetType) {
    try {
      const { data, error } = await supabase
        .from('tokenized_assets')
        .select(`
          *,
          asset_details:asset_id(*),
          images:tokenized_asset_images(*)
        `)
        .eq('asset_type', assetType)
        .eq('available', true)
        .order('share_price_eur', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching tokenized assets:', error);
      return { data: null, error };
    }
  }
};

// ============================================
// UNIFIED SEARCH SERVICE
// ============================================
export const UnifiedSearchService = {
  // Search across all services
  async searchAll(query) {
    try {
      const [
        aircraft,
        emptyLegs,
        helicopters,
        yachts,
        cars,
        adventures
      ] = await Promise.all([
        AircraftService.search(query),
        EmptyLegsService.searchByLocation(query.location || ''),
        HelicoptersService.search(query),
        YachtsService.search(query),
        LuxuryCarsService.search(query),
        AdventuresService.searchByDestination(query.location || '')
      ]);

      return {
        aircraft: aircraft.data || [],
        emptyLegs: emptyLegs.data || [],
        helicopters: helicopters.data || [],
        yachts: yachts.data || [],
        luxuryCars: cars.data || [],
        adventures: adventures.data || [],
        totalResults: 
          (aircraft.data?.length || 0) +
          (emptyLegs.data?.length || 0) +
          (helicopters.data?.length || 0) +
          (yachts.data?.length || 0) +
          (cars.data?.length || 0) +
          (adventures.data?.length || 0)
      };
    } catch (error) {
      console.error('Error in unified search:', error);
      return {
        aircraft: [],
        emptyLegs: [],
        helicopters: [],
        yachts: [],
        luxuryCars: [],
        adventures: [],
        totalResults: 0,
        error
      };
    }
  }
};

// ============================================
// IMAGE UTILITIES
// ============================================
export const ImageUtils = {
  // Get public URL for image
  getImageUrl(bucket, path) {
    if (!path) return null;
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data?.publicUrl || null;
  },

  // Get primary image from images array
  getPrimaryImage(images) {
    if (!images || images.length === 0) return null;
    
    const primary = images.find(img => img.is_primary);
    return primary || images[0];
  },

  // Get all image URLs
  getAllImageUrls(images, bucket) {
    if (!images || images.length === 0) return [];
    
    return images.map(img => ({
      ...img,
      url: this.getImageUrl(bucket, img.path)
    }));
  }
};

export default {
  AircraftService,
  EmptyLegsService,
  HelicoptersService,
  YachtsService,
  LuxuryCarsService,
  AdventuresService,
  TokenizedAssetsService,
  UnifiedSearchService,
  ImageUtils
};