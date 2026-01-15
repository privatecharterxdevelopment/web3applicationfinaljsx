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

    // Apply filters based on category - using origin/destination text search
    if (category) {
      switch (category) {
        case 'featured':
          query = query.eq('is_featured', true);
          break;
        case 'europe':
          // European cities/airports
          query = query.or(
            'origin.ilike.%London%,origin.ilike.%Paris%,origin.ilike.%Rome%,origin.ilike.%Munich%,origin.ilike.%Vienna%,origin.ilike.%Zurich%,origin.ilike.%Copenhagen%,origin.ilike.%Dublin%,origin.ilike.%Stockholm%,origin.ilike.%LCY%,origin.ilike.%LTN%,origin.ilike.%LBG%,origin.ilike.%CIA%,origin.ilike.%MUC%,origin.ilike.%VIE%,origin.ilike.%ARN%,destination.ilike.%Athens%,destination.ilike.%Bergen%,destination.ilike.%Edinburgh%,destination.ilike.%Glasgow%,destination.ilike.%Reykjavik%,destination.ilike.%Rovaniemi%,destination.ilike.%Split%,destination.ilike.%Baden%,destination.ilike.%Bolzano%,destination.ilike.%Svalbard%'
          );
          break;
        case 'africa':
          // African cities
          query = query.or(
            'origin.ilike.%Cape Town%,origin.ilike.%Johannesburg%,origin.ilike.%Nairobi%,origin.ilike.%Marrakech%,origin.ilike.%Cairo%,origin.ilike.%Lagos%,destination.ilike.%Cape Town%,destination.ilike.%Johannesburg%,destination.ilike.%Nairobi%,destination.ilike.%Marrakech%,destination.ilike.%Cairo%,destination.ilike.%Lagos%'
          );
          break;
        case 'asia':
          // Asian cities including Japan
          query = query.or(
            'origin.ilike.%Tokyo%,origin.ilike.%Osaka%,origin.ilike.%Kyoto%,origin.ilike.%Yokohama%,origin.ilike.%Singapore%,origin.ilike.%Hong Kong%,origin.ilike.%Dubai%,origin.ilike.%Bangkok%,origin.ilike.%Bali%,origin.ilike.%Shanghai%,destination.ilike.%Tokyo%,destination.ilike.%Osaka%,destination.ilike.%Kyoto%,destination.ilike.%Yokohama%'
          );
          break;
        case 'usa':
        case 'north-america':
          // US/North American cities
          query = query.or(
            'origin.ilike.%New York%,origin.ilike.%Los Angeles%,origin.ilike.%Miami%,origin.ilike.%Las Vegas%,origin.ilike.%San Francisco%,origin.ilike.%Chicago%,origin.ilike.%Aspen%,origin.ilike.%JFK%,origin.ilike.%LAX%,origin.ilike.%MIA%,destination.ilike.%New York%,destination.ilike.%Los Angeles%,destination.ilike.%Miami%,destination.ilike.%Las Vegas%'
          );
          break;
        default:
          // No filter for unknown categories
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