const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  try {
    // Fetch jets from Supabase
    const { data, error } = await supabase
      .from('jets')
      .select('*')
      .order('name');

    if (error) throw error;

    // Transform data for frontend
    const jets = data.map(jet => ({
      id: jet.id,
      name: jet.name,
      description: jet.description,
      capacity: jet.capacity,
      range: jet.range,
      speed: jet.speed,
      price_per_hour: jet.price_per_hour,
      image_url: jet.image_url,
      category: jet.category,
      availability: 'Available',
      is_available: true
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jets)
    };
  } catch (error) {
    console.error('Error fetching jets:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to fetch jets' })
    };
  }
};