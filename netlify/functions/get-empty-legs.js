const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  try {
    // Parse query parameters
    const params = new URLSearchParams(event.rawQuery || '');
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '6');
    const category = params.get('category');
    const searchTerm = params.get('searchTerm');

    console.log('Received params:', { page, limit, category, searchTerm });

    // Build the query
    let query = supabase.from('EmptyLegs_').select('*', { count: 'exact' });

    // Apply search filter
    if (searchTerm && searchTerm.trim() !== '') {
      query = query.or(`to.ilike.%${searchTerm}%,from.ilike.%${searchTerm}%,to_city.ilike.%${searchTerm}%,from_city.ilike.%${searchTerm}%`);
    }

    // Apply category filter
    if (category && category !== 'all') {
      if (category === 'europe') {
        query = query.or('to_country.ilike.%Germany%,to_country.ilike.%France%,to_country.ilike.%Italy%,to_country.ilike.%Spain%,to_country.ilike.%UK%,to_country.ilike.%Switzerland%,to_country.ilike.%Austria%,to_country.ilike.%Netherlands%');
      } else if (category === 'caribbean') {
        query = query.or('to_country.ilike.%Bahamas%,to_country.ilike.%Jamaica%,to_country.ilike.%Barbados%,to_country.ilike.%Trinidad%');
      } else if (category === 'usa') {
        query = query.or('to_country.ilike.%USA%,to_country.ilike.%United States%');
      } else if (category === 'asia') {
        query = query.or('to_country.ilike.%Japan%,to_country.ilike.%China%,to_country.ilike.%Singapore%,to_country.ilike.%Thailand%,to_country.ilike.%Malaysia%');
      }
    }

    // Filter out old empty legs using the new date column
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('departure_date', today);

    // Sort by departure date using the new date column
    query = query.order('departure_date', { ascending: true });

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Apply pagination
    query = query.range(from, to);

    console.log('Executing Supabase query...');
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log(`Found ${count} total records, returning ${data?.length || 0} for page ${page}`);


    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        data: data || [],
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      })
    };

  } catch (error) {
    console.error('Error in fetchEmptyLegs function:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to fetch empty leg offers',
        message: error.message
      })
    };
  }
};