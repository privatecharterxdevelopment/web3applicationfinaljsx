import { supabase } from '../lib/supabase';
import { FixedOffer } from '../pages/FixedOffers';

export interface FetchFixedOffersParams {
  page?: number;
  limit?: number;
  category?: string;
  searchTerm?: string;
}

export const fetchFixedOffers = async (params: FetchFixedOffersParams = {}) => {
  const {
    page = 1,
    limit = 10,
    category,
    searchTerm
  } = params;

  try {
    // Calculate pagination
    const from = page ? (page - 1) * limit : 0;
    const to = from + limit - 1;

    // Start building the query
    let query = supabase
      .from('fixed_offers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (category) {
      switch (category) {
        case 'featured':
          query = query.eq('is_featured', true);
          break;
        case 'europe':
          query = query.or(
            'destination_continent.eq.Europe,origin_continent.eq.Europe'
          );
          break;
        case 'africa':
          query = query.or(
            'destination_continent.eq.Africa,origin_continent.eq.Africa'
          );
          break;
        case 'asia':
          query = query.or(
            'destination_continent.eq.Asia,origin_continent.eq.Asia'
          );
          break;
        case 'usa':
        case 'north-america':
          query = query.or(
            'destination_continent.eq.North America,origin_continent.eq.North America'
          );
          break;
        case 'south-america':
          query = query.or(
            'destination_continent.eq.South America,origin_continent.eq.South America'
          );
          break;
        case 'oceania':
          query = query.or(
            'destination_continent.eq.Oceania,origin_continent.eq.Oceania'
          );
          break;
      }
    }

    // Apply search term
    if (searchTerm) {
      query = query.or(
        `title.ilike.%${searchTerm}%,origin.ilike.%${searchTerm}%,destination.ilike.%${searchTerm}%,aircraft_type.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }

    // Order by featured first, then by creation date
    query = query.order('is_featured', { ascending: false });
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(from, to);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error fetching adventure packages:', error);
      throw error;
    }

    console.log('Adventure packages data fetched:', data?.length || 0, 'items');

    return {
      data: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching adventure packages:', error);
    return {
      data: [] as FixedOffer[],
      total: 0
    };
  }
};