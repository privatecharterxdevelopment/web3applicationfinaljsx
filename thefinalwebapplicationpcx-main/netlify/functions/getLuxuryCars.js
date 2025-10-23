const { createClient } = require('@supabase/supabase-js');
// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
exports.handler = async (event) => {
  try {
    // Check for missing credentials
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Supabase credentials are not set' })
      };
    }
    // Parse query params
    const params = new URLSearchParams(event.rawQuery || '');
    const type = params.get('type');
    const location = params.get('location');
    // Build base query
    let query = supabase.from('luxury_cars').select('*');
    if (type) {
      query = query.eq('type', type);
    }
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }
    query = query.limit(10);
    const { data, error } = await query;
    if (error) {
      console.error('Supabase fetch error:', error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch luxury cars', details: error.message })
      };
    }
    if (!data || data.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No cars found', data: [] })
      };
    }
    // Format each car cleanly
    const cars = data.map(car => ({
      id: car.id,
      name: car.name,
      brand: car.brand,
      model: car.model,
      type: car.type,
      currency: car.currency,
      location: car.location,
      price_per_day: car.price_per_day,
      price_per_hour: car.price_per_hour || null,
      price_per_week: car.price_per_week || null,
      description: car.description || '',
      features: Array.isArray(car.features) ? car.features : [],
      image_url: car.image_url || '',
      is_featured: !!car.is_featured,
      created_at: car.created_at,
      updated_at: car.updated_at
    }));
    return {
      statusCode: 200,
      body: JSON.stringify(cars)
    };
  } catch (error) {
    console.error('Unhandled error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected server error', details: error.message })
    };
  }
};