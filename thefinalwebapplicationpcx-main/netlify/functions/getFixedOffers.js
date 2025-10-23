import { supabase } from '../lib/supabase';

export const fetchFixedOffers = async ({
  page = 1,
  limit = 6,
  category,
  searchTerm
} = {}) => {
  try {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('fixed_offers')
      .select(`
        id,
        title,
        description,
        origin,
        destination,
        price,
        currency,
        departure_date,
        return_date,
        image_url,
        aircraft_type,
        passengers,
        duration,
        is_featured,
        is_empty_leg,
        created_at,
        updated_at,
        price_on_request
      `, { count: 'exact' });

    if (category && category !== 'all') {
      if (category === 'featured') {
        query = query.eq('is_featured', true);
      } else if (category === 'empty_leg') {
        query = query.eq('is_empty_leg', true);
      } else if (category === 'europe') {
        query = query.or('destination.ilike.%Paris%,destination.ilike.%London%,destination.ilike.%Rome%,destination.ilike.%Barcelona%,destination.ilike.%Geneva%,destination.ilike.%Zurich%,destination.ilike.%Milan%,destination.ilike.%Vienna%,destination.ilike.%Berlin%,destination.ilike.%Amsterdam%');
      } else if (category === 'caribbean') {
        query = query.or('destination.ilike.%Bahamas%,destination.ilike.%Jamaica%,destination.ilike.%Barbados%,destination.ilike.%Barts%,destination.ilike.%Antigua%,destination.ilike.%Dominican%,destination.ilike.%Turks%,destination.ilike.%Caicos%,destination.ilike.%Virgin%');
      } else if (category === 'usa') {
        query = query.or('destination.ilike.%New York%,destination.ilike.%Miami%,destination.ilike.%Los Angeles%,destination.ilike.%Las Vegas%,destination.ilike.%Chicago%,destination.ilike.%Boston%,destination.ilike.%San Francisco%,destination.ilike.%Aspen%,destination.ilike.%Dallas%');
      }
    }

    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.trim();
      query = query.or(`
        title.ilike.%${search}%,
        description.ilike.%${search}%,
        origin.ilike.%${search}%,
        destination.ilike.%${search}%,
        aircraft_type.ilike.%${search}%
      `);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Fetched data:', data);
    console.log('Total count:', count);

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };

  } catch (error) {
    console.error('Error fetching adventure packages:', error);
    throw new Error('Failed to fetch adventure packages');
  }
};

export const fetchFixedOfferById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('fixed_offers')
      .select(`
        id,
        title,
        description,
        origin,
        destination,
        price,
        currency,
        departure_date,
        return_date,
        image_url,
        aircraft_type,
        passengers,
        duration,
        is_featured,
        is_empty_leg,
        created_at,
        updated_at,
        price_on_request
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching fixed offer:', error);
    throw new Error('Failed to fetch fixed offer');
  }
};

export const createFixedOffer = async (offerData) => {
  try {
    const { data, error } = await supabase
      .from('fixed_offers')
      .insert([offerData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating fixed offer:', error);
    throw new Error('Failed to create fixed offer');
  }
};

export const updateFixedOffer = async (id, offerData) => {
  try {
    const { data, error } = await supabase
      .from('fixed_offers')
      .update(offerData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating fixed offer:', error);
    throw new Error('Failed to update fixed offer');
  }
};

export const deleteFixedOffer = async (id) => {
  try {
    const { error } = await supabase
      .from('fixed_offers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting fixed offer:', error);
    throw new Error('Failed to delete fixed offer');
  }
};

export const fetchFeaturedOffers = async (limit = 3) => {
  try {
    const { data, error } = await supabase
      .from('fixed_offers')
      .select(`
        id,
        title,
        description,
        origin,
        destination,
        price,
        currency,
        departure_date,
        return_date,
        image_url,
        aircraft_type,
        passengers,
        duration,
        is_featured,
        is_empty_leg,
        created_at,
        updated_at,
        price_on_request
      `)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching featured offers:', error);
    throw new Error('Failed to fetch featured offers');
  }
};