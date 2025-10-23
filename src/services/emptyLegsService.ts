import { supabase } from '../lib/supabase';
import { EmptyLegOffer } from '../pages/EmptyLegOffers';

export interface FetchEmptyLegsParams {
  page?: number;
  limit?: number;
  category?: string;
  searchTerm?: string;
}

export const fetchEmptyLegs = async (params: FetchEmptyLegsParams = {}) => {
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
      .from('EmptyLegs_')
      .select('*', { count: 'exact' });

    // Filter out old empty legs using the new date column
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('departure_date', today);

    // Apply filters
    if (category) {
      switch (category) {
        case 'featured':
          // For featured, we could have a featured flag or just use some criteria
          query = query.eq('category', 'Heavy Jet');
          break;
        case 'europe':
          // Filter for European destinations - using continent-based filtering
          query = query.or(
            'from_continent.eq.Europe,to_continent.eq.Europe'
          );
          break;
        case 'africa':
          // Filter for African destinations
          query = query.or(
            'from_continent.eq.Africa,to_continent.eq.Africa'
          );
          break;
        case 'asia':
          // Filter for Asian destinations
          query = query.or(
            'from_continent.eq.Asia,to_continent.eq.Asia'
          );
          break;
        case 'usa':
        case 'north-america':
          // Filter for North American destinations
          query = query.or(
            'from_continent.eq.North America,to_continent.eq.North America'
          );
          break;
        case 'south-america':
          // Filter for South American destinations
          query = query.or(
            'from_continent.eq.South America,to_continent.eq.South America'
          );
          break;
        case 'oceania':
          // Filter for Oceania destinations
          query = query.or(
            'from_continent.eq.Oceania,to_continent.eq.Oceania'
          );
          break;
      }
    }

    // Apply search term
    if (searchTerm) {
      query = query.or(
        `from.ilike.%${searchTerm}%,to.ilike.%${searchTerm}%,aircraft_type.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,from_city.ilike.%${searchTerm}%,to_city.ilike.%${searchTerm}%`
      );
    }

    // Apply pagination
    query = query.range(from, to);

    // Order by departure date using the new date column
    query = query.order('departure_date', { ascending: true });

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error fetching empty legs:', error);
      throw error;
    }

    console.log('Empty legs data fetched:', data?.length || 0, 'items');


    // Transform the data to match the expected format
    const transformedData: EmptyLegOffer[] = (data || []).map(leg => ({
      id: leg.id || '',
      title: `${leg.from_city || leg.from || ''} to ${leg.to_city || leg.to || ''}`,
      description: `Empty leg flight on ${leg.aircraft_type || 'Private Jet'} from ${leg.from_city || leg.from || ''} to ${leg.to_city || leg.to || ''}`,
      origin: leg.from || '',
      destination: leg.to || '',
      price: leg.price || 0,
      currency: leg.currency || '€',
      departure_date: leg.departure_date || new Date().toISOString(),
      image_url: leg.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80',
      aircraft_type: leg.aircraft_type || 'Private Jet',
      aircraft_category: leg.category || '',
      capacity: leg.capacity || 0,
      duration: leg.departure_time && leg.arrival_time ?
        `${leg.departure_time} - ${leg.arrival_time}` :
        `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 60)}m`, // Generate random duration if times not available
      is_featured: false,
      is_empty_leg: true,
      created_at: new Date().toISOString()
    }));

    return {
      data: transformedData,
      total: count || transformedData.length
    };
  } catch (error) {
    console.error('Error fetching empty legs:', error);
    return {
      data: [] as EmptyLegOffer[],
      total: 0
    };
  }
};