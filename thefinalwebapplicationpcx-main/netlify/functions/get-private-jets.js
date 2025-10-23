const fetchJets = async () => {
  try {
    setLoading(true);
    
    // Build query parameters
    const params = new URLSearchParams();
    if (filterCategory !== 'all') {
      params.append('category', filterCategory);
    }
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    
    // Fetch from your serverless function
    const response = await fetch(`/.netlify/functions/get-private-jet?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch jets');
    }
    
    const jetsData = await response.json();
    setJets(jetsData);
    
  } catch (error) {
    console.error('Error fetching jets:', error);
    // Fallback to direct Supabase query if serverless function fails
    try {
      let query = supabase.from('jets').select('*');
      
      if (filterCategory !== 'all') {
        query = query.ilike('aircraft_category', `%${filterCategory}%`);
      }
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        query = query.or(`title.ilike.%${search}%,aircraft_model.ilike.%${search}%,description.ilike.%${search}%,aircraft_category.ilike.%${search}%`);
      }
      
      const { data, error: supabaseError } = await query.order('title', { ascending: true });
      
      if (supabaseError) throw supabaseError;
      
      const mappedJets = (data || []).map(jet => ({
        id: jet.id,
        name: jet.title || jet.aircraft_model,
        description: jet.description,
        capacity: jet.capacity,
        range: parseInt(jet.range) || 0,
        speed: 900,
        price_per_hour: jet.price_range ? parseInt(jet.price_range.replace(/[^0-9]/g, '')) : 0,
        image_url: jet.image_url,
        category: jet.aircraft_category,
        availability: 'Available',
        is_available: true,
        manufacturer: jet.manufacturer
      }));
      
      setJets(mappedJets);
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      setJets([]);
    }
  } finally {
    setLoading(false);
  }
};