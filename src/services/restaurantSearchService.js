/**
 * Restaurant Search Service
 * Returns structured data for restaurant card display
 * Uses Claude's knowledge for worldwide restaurant recommendations
 */

// Cuisine type icons and images
const CUISINE_DATA = {
  italian: { icon: '🍝', keywords: ['italian', 'pasta', 'pizza', 'trattoria', 'ristorante', 'osteria'] },
  japanese: { icon: '🍣', keywords: ['japanese', 'sushi', 'ramen', 'izakaya', 'omakase', 'kaiseki'] },
  chinese: { icon: '🥢', keywords: ['chinese', 'dim sum', 'cantonese', 'szechuan', 'peking'] },
  french: { icon: '🥐', keywords: ['french', 'bistro', 'brasserie', 'cuisine française'] },
  indian: { icon: '🍛', keywords: ['indian', 'curry', 'tandoori', 'masala', 'biryani'] },
  mexican: { icon: '🌮', keywords: ['mexican', 'taco', 'burrito', 'cantina', 'taqueria'] },
  thai: { icon: '🍜', keywords: ['thai', 'pad thai', 'tom yum', 'green curry'] },
  mediterranean: { icon: '🫒', keywords: ['mediterranean', 'greek', 'lebanese', 'middle eastern', 'mezze'] },
  seafood: { icon: '🦞', keywords: ['seafood', 'fish', 'oyster', 'lobster', 'crab', 'ocean'] },
  steakhouse: { icon: '🥩', keywords: ['steak', 'grill', 'beef', 'prime', 'chophouse', 'wagyu'] },
  american: { icon: '🍔', keywords: ['american', 'burger', 'bbq', 'diner', 'barbecue'] },
  spanish: { icon: '🥘', keywords: ['spanish', 'tapas', 'paella', 'pintxos'] },
  korean: { icon: '🍲', keywords: ['korean', 'bbq', 'kimchi', 'bibimbap', 'gogi'] },
  vietnamese: { icon: '🍜', keywords: ['vietnamese', 'pho', 'banh mi'] },
  peruvian: { icon: '🐟', keywords: ['peruvian', 'ceviche', 'nikkei'] },
  brazilian: { icon: '🥩', keywords: ['brazilian', 'churrasco', 'rodizio'] },
  arabic: { icon: '🧆', keywords: ['arabic', 'lebanese', 'turkish', 'persian', 'falafel', 'shawarma'] },
  fineDining: { icon: '✨', keywords: ['fine dining', 'michelin', 'tasting menu', 'gourmet', 'starred'] },
  rooftop: { icon: '🌃', keywords: ['rooftop', 'sky', 'view', 'terrace', 'skyline'] },
  vegan: { icon: '🥗', keywords: ['vegan', 'plant-based', 'vegetarian'] },
  default: { icon: '🍽️', keywords: [] }
};

// High-quality restaurant images by cuisine type
const CUISINE_IMAGES = {
  italian: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
  japanese: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop',
  chinese: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop',
  french: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&h=300&fit=crop',
  indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
  mexican: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop',
  thai: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop',
  mediterranean: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
  seafood: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
  steakhouse: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop',
  american: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',
  spanish: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=400&h=300&fit=crop',
  korean: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=300&fit=crop',
  vietnamese: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop',
  peruvian: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=400&h=300&fit=crop',
  brazilian: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop',
  arabic: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop',
  fineDining: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
  rooftop: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  vegan: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
  default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
};

/**
 * Detect cuisine type from text
 */
export function detectCuisine(text) {
  const lowerText = (text || '').toLowerCase();

  for (const [cuisine, data] of Object.entries(CUISINE_DATA)) {
    if (cuisine === 'default') continue;
    if (data.keywords.some(keyword => lowerText.includes(keyword))) {
      return {
        type: cuisine,
        icon: data.icon,
        image: CUISINE_IMAGES[cuisine] || CUISINE_IMAGES.default
      };
    }
  }
  return {
    type: 'restaurant',
    icon: CUISINE_DATA.default.icon,
    image: CUISINE_IMAGES.default
  };
}

/**
 * Format restaurant data from Claude's response into card format
 */
export function formatRestaurantForCard(restaurant, index, location) {
  const cuisineData = detectCuisine(restaurant.cuisine || restaurant.name || '');

  return {
    id: `rest_${Date.now()}_${index}`,
    name: restaurant.name,
    description: restaurant.description || `Popular restaurant in ${location}`,
    rating: restaurant.rating || 4.5,
    totalRatings: restaurant.reviews || Math.floor(500 + Math.random() * 2000),
    priceLevel: (restaurant.price || '€€€').length,
    priceLevelText: restaurant.price || '€€€',
    address: restaurant.address || location,
    cuisineType: restaurant.cuisine || cuisineData.type,
    cuisineIcon: cuisineData.icon,
    image: cuisineData.image,
    isOpen: true
  };
}

/**
 * Extract location from a restaurant query
 * Returns { location, cuisineType } or null if no location found
 */
export function extractLocationFromQuery(message) {
  const lowerMessage = message.toLowerCase();

  // Patterns to extract location
  const patterns = [
    // "restaurants in [city]"
    /restaurants?\s+in\s+([a-zA-Z\s\-]+?)(?:\?|$|,|\.|\!|for|with|that)/i,
    // "restaurants near [place]"
    /restaurants?\s+near\s+(?:the\s+)?([a-zA-Z\s\-]+?)(?:\?|$|,|\.|\!|for|with)/i,
    // "[city] restaurants"
    /([a-zA-Z\s\-]+?)\s+restaurants?(?:\?|$|,|\.|\!)/i,
    // "dining in [city]"
    /dining\s+in\s+([a-zA-Z\s\-]+?)(?:\?|$|,|\.|\!)/i,
    // "eat in [city]"
    /(?:where\s+to\s+)?eat\s+in\s+([a-zA-Z\s\-]+?)(?:\?|$|,|\.|\!)/i,
    // "food in [city]"
    /food\s+in\s+([a-zA-Z\s\-]+?)(?:\?|$|,|\.|\!)/i,
    // "best [cuisine] in [city]"
    /best\s+\w+\s+in\s+([a-zA-Z\s\-]+?)(?:\?|$|,|\.|\!)/i
  ];

  for (const pattern of patterns) {
    const match = lowerMessage.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      // Filter out common non-location words
      const nonLocations = ['the', 'a', 'an', 'my', 'your', 'this', 'that', 'hotel', 'area', 'city', 'town', 'nearby', 'some', 'good', 'best'];
      if (!nonLocations.includes(location.toLowerCase()) && location.length > 2) {
        // Extract cuisine type if mentioned
        let cuisineType = null;
        const cuisineMatch = lowerMessage.match(/(italian|japanese|chinese|french|indian|mexican|thai|korean|vietnamese|spanish|mediterranean|seafood|steak|american|vegan|vegetarian|arabic|persian|turkish|lebanese|greek)/i);
        if (cuisineMatch) {
          cuisineType = cuisineMatch[1].toLowerCase();
        }

        return { location, cuisineType };
      }
    }
  }

  return null;
}

/**
 * Check if a message is asking about restaurants
 */
export function isRestaurantQuery(message) {
  const restaurantKeywords = /restaurant|dining|eat|food|dinner|lunch|breakfast|cuisine|where.*eat|recommend.*place|good.*place|fine dining|essen|speisen/i;
  return restaurantKeywords.test(message);
}

/**
 * Generate the prompt for Claude to get restaurant recommendations
 */
export function getRestaurantSearchPrompt(location, cuisineType = null) {
  const cuisineText = cuisineType ? `${cuisineType} ` : '';

  return `Find 6 highly-rated ${cuisineText}restaurants in ${location}. Return ONLY a JSON array with no other text. Each restaurant should have:
- name: Real restaurant name
- cuisine: Type of cuisine
- description: One sentence about the restaurant
- price: Price level using € symbols (€ to €€€€)
- rating: Rating out of 5 (e.g., 4.5)
- address: Location/neighborhood

Example format:
[{"name":"Restaurant Name","cuisine":"Italian","description":"Award-winning pasta in historic setting","price":"€€€","rating":4.6,"address":"City Center, ${location}"}]`;
}

/**
 * Parse Claude's restaurant response into structured data
 */
export function parseRestaurantResponse(response, location) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const restaurants = JSON.parse(jsonMatch[0]);
      return restaurants.map((r, i) => formatRestaurantForCard(r, i, location));
    }
  } catch (error) {
    console.error('Failed to parse restaurant response:', error);
  }

  return [];
}

export default {
  detectCuisine,
  formatRestaurantForCard,
  extractLocationFromQuery,
  isRestaurantQuery,
  getRestaurantSearchPrompt,
  parseRestaurantResponse,
  CUISINE_IMAGES
};
