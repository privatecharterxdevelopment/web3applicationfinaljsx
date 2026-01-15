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

    // Apply filters based on category or region field
    if (category) {
      switch (category) {
        case 'featured':
          query = query.eq('is_featured', true);
          break;
        case 'europe':
          // Filter by region field or search in origin/destination for European cities/countries
          query = query.or(
            'region.ilike.%europe%,origin.ilike.%Paris%,origin.ilike.%London%,origin.ilike.%Rome%,origin.ilike.%Milan%,origin.ilike.%Zurich%,origin.ilike.%Geneva%,origin.ilike.%Munich%,origin.ilike.%Vienna%,origin.ilike.%Barcelona%,origin.ilike.%Madrid%,destination.ilike.%Paris%,destination.ilike.%London%,destination.ilike.%Rome%,destination.ilike.%Milan%,destination.ilike.%Zurich%,destination.ilike.%Geneva%,destination.ilike.%Munich%,destination.ilike.%Vienna%,destination.ilike.%Barcelona%,destination.ilike.%Madrid%'
          );
          break;
        case 'africa':
          query = query.or(
            'region.ilike.%africa%,origin.ilike.%Cape Town%,origin.ilike.%Johannesburg%,origin.ilike.%Nairobi%,origin.ilike.%Marrakech%,origin.ilike.%Cairo%,origin.ilike.%Lagos%,destination.ilike.%Cape Town%,destination.ilike.%Johannesburg%,destination.ilike.%Nairobi%,destination.ilike.%Marrakech%,destination.ilike.%Cairo%,destination.ilike.%Lagos%'
          );
          break;
        case 'asia':
          query = query.or(
            'region.ilike.%asia%,origin.ilike.%Tokyo%,origin.ilike.%Singapore%,origin.ilike.%Hong Kong%,origin.ilike.%Dubai%,origin.ilike.%Bangkok%,origin.ilike.%Bali%,origin.ilike.%Shanghai%,destination.ilike.%Tokyo%,destination.ilike.%Singapore%,destination.ilike.%Hong Kong%,destination.ilike.%Dubai%,destination.ilike.%Bangkok%,destination.ilike.%Bali%,destination.ilike.%Shanghai%'
          );
          break;
        case 'usa':
        case 'north-america':
          query = query.or(
            'region.ilike.%usa%,region.ilike.%america%,origin.ilike.%New York%,origin.ilike.%Los Angeles%,origin.ilike.%Miami%,origin.ilike.%Las Vegas%,origin.ilike.%San Francisco%,origin.ilike.%Chicago%,origin.ilike.%Aspen%,destination.ilike.%New York%,destination.ilike.%Los Angeles%,destination.ilike.%Miami%,destination.ilike.%Las Vegas%,destination.ilike.%San Francisco%,destination.ilike.%Chicago%,destination.ilike.%Aspen%'
          );
          break;
        case 'south-america':
          query = query.or(
            'region.ilike.%south america%,origin.ilike.%Rio%,origin.ilike.%Sao Paulo%,origin.ilike.%Buenos Aires%,destination.ilike.%Rio%,destination.ilike.%Sao Paulo%,destination.ilike.%Buenos Aires%'
          );
          break;
        case 'oceania':
          query = query.or(
            'region.ilike.%oceania%,region.ilike.%australia%,origin.ilike.%Sydney%,origin.ilike.%Melbourne%,origin.ilike.%Auckland%,destination.ilike.%Sydney%,destination.ilike.%Melbourne%,destination.ilike.%Auckland%'
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