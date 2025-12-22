/**
 * useToolResults Hook - Tool Result Processing & Formatting
 *
 * Handles all tool result types from Claude AI:
 * - Search results (jets, helicopters, yachts, cars, wines, cigars, etc.)
 * - Place lookups
 * - Hotel searches
 * - Cart operations
 * - Luxury item lookups
 */

import { useCallback } from 'react';

// Luxury Services Catalog Data
export const LUXURY_SERVICES_CATALOG = {
  caviar: [
    { product: 'Sevruga Caviar 50g', price_usd: 185, unit: 'per 50g' },
    { product: 'Sevruga Caviar 100g', price_usd: 370, unit: 'per 100g' },
    { product: 'Sevruga Caviar 200g', price_usd: 740, unit: 'per 200g' },
    { product: 'Sevruga Caviar 250g', price_usd: 925, unit: 'per 250g' },
    { product: 'Sevruga Caviar 500g', price_usd: 1850, unit: 'per 500g' },
    { product: 'Oscietra Caviar 30g', price_usd: 210, unit: 'per 30g' },
    { product: 'Oscietra Caviar 50g', price_usd: 350, unit: 'per 50g' },
    { product: 'Oscietra Caviar 200g', price_usd: 1395, unit: 'per 200g' },
    { product: 'Beluga Siberian 30g', price_usd: 160, unit: 'per 30g' },
    { product: 'Beluga Siberian 50g', price_usd: 265, unit: 'per 50g' },
    { product: 'Beluga Siberian 100g', price_usd: 530, unit: 'per 100g' }
  ],
  cigars: [
    { product: 'Cohiba Behike 52', price_usd: 120, unit: 'Robusto • Medium-Full' },
    { product: 'Cohiba Behike 54', price_usd: 140, unit: 'Toro • Medium-Full' },
    { product: 'Cohiba Behike 56', price_usd: 160, unit: 'Gran Robusto • Medium-Full' },
    { product: 'Cohiba Esplendido', price_usd: 85, unit: 'Churchill • Medium' },
    { product: 'Cohiba Siglo VI', price_usd: 70, unit: 'Toro • Medium' },
    { product: 'Cohiba Lancero', price_usd: 65, unit: 'Lonsdale • Medium' },
    { product: 'Cohiba Robusto', price_usd: 55, unit: 'Robusto • Medium' },
    { product: 'Montecristo No. 2', price_usd: 45, unit: 'Torpedo • Medium' },
    { product: 'Montecristo No. 4', price_usd: 35, unit: 'Petit Corona • Medium' },
    { product: 'Montecristo Edmundo', price_usd: 40, unit: 'Robusto • Medium' },
    { product: 'Padron 1964 Anniversary Maduro', price_usd: 35, unit: 'Robusto • Full' },
    { product: 'Padron 1926 Serie No. 9', price_usd: 40, unit: 'Torpedo • Full' },
    { product: 'Davidoff Millennium Robusto', price_usd: 45, unit: 'Robusto • Medium' },
    { product: 'Davidoff Winston Churchill', price_usd: 50, unit: 'Toro • Medium' },
    { product: 'Davidoff Year of the Dragon', price_usd: 180, unit: 'Toro • Medium' },
    { product: 'Arturo Fuente Opus X Perfecxion No. 4', price_usd: 35, unit: 'Robusto • Full' },
    { product: 'Arturo Fuente Opus X Double Corona', price_usd: 55, unit: 'Double Corona • Full' },
    { product: 'Romeo y Julieta Churchill', price_usd: 30, unit: 'Churchill • Medium' },
    { product: 'Partagas Serie D No. 4', price_usd: 30, unit: 'Robusto • Full' },
    { product: 'Partagas Lusitania', price_usd: 40, unit: 'Double Corona • Full' }
  ],
  flowers: [
    { product: '12 Premium Red Roses', price_usd: 80, unit: 'per bouquet' },
    { product: '24 Premium Red Roses', price_usd: 150, unit: 'per bouquet' },
    { product: 'Luxury Orchid Arrangement', price_usd: 200, unit: 'per arrangement' },
    { product: 'Mixed Designer Bouquet', price_usd: 250, unit: 'per bouquet' },
    { product: 'Premium Event Installation', price_usd: 500, unit: 'per installation' }
  ],
  cakes: [
    { product: 'Custom Birthday Cake (2-Tier)', price_usd: 250, unit: 'per cake' },
    { product: 'Designer Celebration Cake', price_usd: 350, unit: 'per cake' },
    { product: 'Macaron Tower (100 pieces)', price_usd: 300, unit: 'per tower' },
    { product: 'Luxury Dessert Platter', price_usd: 200, unit: 'per platter' }
  ],
  decorations: [
    { product: 'Birthday Package', price_usd: 350, unit: 'per setup' },
    { product: 'Anniversary Romantic Setup', price_usd: 450, unit: 'per setup' },
    { product: 'Proposal Premium Setup', price_usd: 800, unit: 'per setup' },
    { product: 'Corporate Branding Package', price_usd: 550, unit: 'per setup' }
  ],
  photography: [
    { product: 'Photographer (3 hours)', price_usd: 1000, unit: 'per session' },
    { product: 'Videographer (Event)', price_usd: 1500, unit: 'per event' },
    { product: 'Drone Footage', price_usd: 750, unit: 'per session' },
    { product: 'Photo + Video Package', price_usd: 2800, unit: 'per package' }
  ],
  special: [
    { product: 'Pet Transport (Cabin-Safe)', price_usd: 250, unit: 'per transport' },
    { product: 'Security Personnel', price_usd: 700, unit: 'per day' },
    { product: 'Interpreter', price_usd: 200, unit: 'per hour' },
    { product: 'Butler Service', price_usd: 900, unit: 'per day' }
  ],
  smoking: [
    { product: 'Aircraft Deep Cleaning Fee (Smoking)', price_usd: 2000, unit: 'Required for smoking onboard' }
  ]
};

export const CATEGORY_LABELS = {
  caviar: 'Premium Caviar',
  cigars: 'Premium Cigars',
  flowers: 'Floral Arrangements',
  cakes: 'Cakes & Desserts',
  decorations: 'Event Decorations',
  photography: 'Photo & Video',
  special: 'Special Services',
  smoking: 'Aircraft Services'
};

export const CATEGORY_EMOJIS = {
  wine: '🍷',
  champagne: '🥂',
  spirits: '🥃',
  caviar: '🐟',
  cigars: '🚬',
  flowers: '💐',
  cake: '🎂',
  decorations: '🎊',
  music: '🎵',
  photography: '📸',
  catering: '🍽️',
  other: '✨'
};

export const useToolResults = () => {
  // Process search tool results into display tabs
  const processSearchResults = useCallback((toolName, toolResult) => {
    const tabs = [];

    // Handle location restrictions (sanctioned/limited coverage)
    if (toolResult.restriction) {
      return {
        tabs: [],
        hasRestriction: true,
        restriction: toolResult.restriction
      };
    }

    switch (toolName) {
      case 'searchEmptyLegs':
        if (toolResult.results?.length > 0) {
          tabs.push({
            id: 'emptylegs',
            title: 'Empty Legs',
            count: toolResult.results.length,
            items: toolResult.results.map(item => ({
              ...item,
              type: 'empty_legs',
              displayType: 'EMPTY LEG',
              badgeColor: 'bg-green-100 text-green-800'
            }))
          });
        }
        break;

      case 'searchPrivateJets':
        if (toolResult.results?.length > 0) {
          tabs.push({
            id: 'jets',
            title: toolResult.showingAlternatives ? 'Alternative Jets' : 'Private Jets',
            count: toolResult.results.length,
            items: toolResult.results.map(item => ({
              ...item,
              type: 'jet',
              displayType: 'PRIVATE JET',
              badgeColor: 'bg-gray-800 text-white'
            })),
            showingAlternatives: toolResult.showingAlternatives,
            requestedModel: toolResult.requestedModel,
            alternativeMessage: toolResult.alternativeMessage
          });
        }
        break;

      case 'searchHelicopters':
        if (toolResult.results?.length > 0) {
          tabs.push({
            id: 'helicopters',
            title: toolResult.showingAlternatives ? 'Alternative Helicopters' : 'Helicopters',
            count: toolResult.results.length,
            items: toolResult.results.map(item => ({
              ...item,
              type: 'helicopter',
              displayType: 'HELICOPTER',
              badgeColor: 'bg-blue-100 text-blue-800'
            })),
            showingAlternatives: toolResult.showingAlternatives,
            requestedModel: toolResult.requestedModel,
            alternativeMessage: toolResult.alternativeMessage
          });
        }
        break;

      case 'searchLuxuryCars':
        if (toolResult.results?.length > 0) {
          tabs.push({
            id: 'luxury_cars',
            title: 'Luxury Cars',
            count: toolResult.results.length,
            items: toolResult.results.map(item => ({
              ...item,
              type: 'luxury_car',
              displayType: 'SUPERCAR',
              badgeColor: 'bg-purple-100 text-purple-800'
            }))
          });
        }
        break;

      case 'searchWines':
        if (toolResult.results?.length > 0) {
          tabs.push({
            id: 'wines',
            title: 'Wines',
            count: toolResult.results.length,
            items: toolResult.results.map(item => ({
              ...item,
              type: 'wine',
              displayType: 'WINE',
              badgeColor: 'bg-red-100 text-red-800'
            }))
          });
        }
        break;

      case 'searchDelicatesse':
        if (toolResult.results?.length > 0) {
          tabs.push({
            id: 'delicatesse',
            title: 'Delicacies',
            count: toolResult.results.length,
            items: toolResult.results.map(item => ({
              ...item,
              type: 'delicatesse',
              displayType: 'DELICACY',
              badgeColor: 'bg-amber-100 text-amber-800'
            }))
          });
        }
        break;

      case 'searchCigars':
        if (toolResult.results?.length > 0) {
          tabs.push({
            id: 'cigars',
            title: 'Premium Cigars',
            count: toolResult.results.length,
            items: toolResult.results.map(item => ({
              ...item,
              type: 'cigar',
              displayType: 'CIGAR',
              badgeColor: 'bg-orange-100 text-orange-800'
            }))
          });
        }
        break;

      default:
        break;
    }

    return { tabs, hasRestriction: false };
  }, []);

  // Format booking confirmation message
  const formatBookingConfirmation = useCallback((cartItem) => {
    let content = `Ready to proceed with your booking:\n\n`;

    // Item name
    content += `✈️ **${cartItem.name || cartItem.title || 'Charter Request'}**\n`;

    // Route
    if (cartItem.from && cartItem.to) {
      content += `📍 ${cartItem.from} → ${cartItem.to}\n`;
    }

    // Date/Time
    if (cartItem.date) {
      content += `📅 ${cartItem.date}`;
      if (cartItem.time) content += ` at ${cartItem.time}`;
      content += '\n';
    }

    // Passengers
    if (cartItem.passengers) {
      content += `👥 ${cartItem.passengers} passengers\n`;
    }

    // Catering
    if (cartItem.catering) {
      const cateringText = cartItem.catering === 'complimentary'
        ? 'Complimentary refreshments'
        : cartItem.catering;
      content += `🥤 ${cateringText}\n`;
    }

    content += '\nChoose how you\'d like to proceed:';

    return content;
  }, []);

  // Format custom extra confirmation message
  const formatCustomExtraConfirmation = useCallback((cartItem) => {
    let content = `Ready to add this custom item:\n\n`;
    content += `🍷 **${cartItem.name}**\n`;
    content += `📦 Category: ${cartItem.category}\n`;
    content += `💰 Est. Price: $${(cartItem.price || 0).toLocaleString()}\n`;

    if (cartItem.quantity > 1) {
      content += `📊 Quantity: ${cartItem.quantity}\n`;
    }

    content += '\nChoose how you\'d like to proceed:';
    return content;
  }, []);

  // Format luxury item confirmation message
  const formatLuxuryItemConfirmation = useCallback((toolResult) => {
    const item = toolResult.item || {};
    const emoji = CATEGORY_EMOJIS[item.category] || '✨';

    let content = `Found: **${item.name}**\n\n`;
    content += `${emoji} Category: ${item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}\n`;
    content += `💰 Est. Price: ${item.unitPriceFormatted || `$${(item.unitPrice || 0).toLocaleString()}`}`;

    if (item.quantity > 1) {
      content += ` × ${item.quantity} = ${item.totalPriceFormatted}`;
    }
    content += '\n';

    if (toolResult.availability?.status === 'requires_confirmation') {
      content += '\n⏳ Availability requires confirmation by our team';
    }

    content += '\n\nWould you like to add this to your cart?';
    return content;
  }, []);

  // Format place lookup message
  const formatPlaceMessage = useCallback((toolResult) => {
    return {
      role: 'place',
      content: toolResult.message || `Found ${toolResult.place.name}`,
      place: toolResult.place,
      alternatives: toolResult.alternatives || [],
      canArrangeTransfer: toolResult.canArrangeTransfer
    };
  }, []);

  // Format hotel search message
  const formatHotelMessage = useCallback((toolResult) => {
    return {
      role: 'hotels',
      content: toolResult.message || `Found ${toolResult.results.length} hotels in ${toolResult.city}`,
      hotels: toolResult.results,
      city: toolResult.city,
      params: toolResult.params,
      isDemo: toolResult.isDemo
    };
  }, []);

  // Create place summary for AI follow-up
  const createPlaceSummary = useCallback((toolResult) => {
    return {
      success: true,
      place: {
        name: toolResult.place.name,
        fullAddress: toolResult.place.fullAddress,
        category: toolResult.place.category,
        rating: toolResult.place.rating,
        reviewCount: toolResult.place.reviewCount,
        priceLevel: toolResult.place.priceLevel,
        phone: toolResult.place.phone,
        website: toolResult.place.website ? 'Available' : null,
        openNow: toolResult.place.openingHours?.openNow
      },
      canArrangeTransfer: toolResult.canArrangeTransfer
    };
  }, []);

  // Create hotel summary for AI follow-up
  const createHotelSummary = useCallback((toolResult) => {
    return {
      success: true,
      city: toolResult.city,
      hotelCount: toolResult.results.length,
      hotels: toolResult.results.slice(0, 3).map(h => ({
        name: h.hotel?.name,
        rating: h.hotel?.rating,
        starRating: h.hotel?.starRating,
        minRate: h.totalRate || h.hotel?.minRate,
        amenities: h.hotel?.amenities?.slice(0, 4)
      }))
    };
  }, []);

  // Get item type display info
  const getItemTypeInfo = useCallback((item) => {
    const type = item.type?.toLowerCase() || '';

    const typeMap = {
      empty_legs: { badge: 'EMPTY LEG', color: 'bg-green-100 text-green-800', icon: 'plane' },
      emptyleg: { badge: 'EMPTY LEG', color: 'bg-green-100 text-green-800', icon: 'plane' },
      jet: { badge: 'PRIVATE JET', color: 'bg-gray-800 text-white', icon: 'plane' },
      jets: { badge: 'PRIVATE JET', color: 'bg-gray-800 text-white', icon: 'plane' },
      helicopter: { badge: 'HELICOPTER', color: 'bg-blue-100 text-blue-800', icon: 'plane' },
      helicopters: { badge: 'HELICOPTER', color: 'bg-blue-100 text-blue-800', icon: 'plane' },
      yacht: { badge: 'YACHT', color: 'bg-cyan-100 text-cyan-800', icon: 'anchor' },
      yachts: { badge: 'YACHT', color: 'bg-cyan-100 text-cyan-800', icon: 'anchor' },
      luxury_car: { badge: 'SUPERCAR', color: 'bg-purple-100 text-purple-800', icon: 'car' },
      luxury_cars: { badge: 'SUPERCAR', color: 'bg-purple-100 text-purple-800', icon: 'car' },
      wine: { badge: 'WINE', color: 'bg-red-100 text-red-800', icon: 'wine' },
      wines: { badge: 'WINE', color: 'bg-red-100 text-red-800', icon: 'wine' },
      adventure: { badge: 'EXPERIENCE', color: 'bg-amber-100 text-amber-800', icon: 'mountain' },
      fixed_offer: { badge: 'EXPERIENCE', color: 'bg-amber-100 text-amber-800', icon: 'mountain' },
      transfer: { badge: 'TRANSFER', color: 'bg-gray-200 text-gray-700', icon: 'car' },
      taxi: { badge: 'TRANSFER', color: 'bg-gray-200 text-gray-700', icon: 'car' },
      ground_transport: { badge: 'TRANSFER', color: 'bg-gray-200 text-gray-700', icon: 'car' },
      custom_extra: { badge: 'EXTRA', color: 'bg-gray-700 text-white', icon: 'plus' },
      medevac: { badge: 'MEDEVAC', color: 'bg-red-600 text-white', icon: 'medical' },
      service_fee: { badge: 'FEE', color: 'bg-gray-200 text-gray-600', icon: 'dollar' }
    };

    return typeMap[type] || { badge: 'SERVICE', color: 'bg-gray-300 text-gray-700', icon: 'star' };
  }, []);

  // Check if item can be paid directly (crypto)
  const canDirectCheckout = useCallback((item) => {
    const type = item.type?.toLowerCase() || '';
    return ['empty_legs', 'emptyleg', 'adventure', 'fixed_offer', 'wine', 'wines'].includes(type);
  }, []);

  // Check if item requires quote (AI request)
  const requiresQuote = useCallback((item) => {
    const type = item.type?.toLowerCase() || '';
    return ['jet', 'jets', 'helicopter', 'helicopters', 'yacht', 'yachts', 'luxury_car', 'luxury_cars', 'transfer', 'taxi'].includes(type);
  }, []);

  return {
    // Processing functions
    processSearchResults,

    // Formatting functions
    formatBookingConfirmation,
    formatCustomExtraConfirmation,
    formatLuxuryItemConfirmation,
    formatPlaceMessage,
    formatHotelMessage,

    // Summary functions
    createPlaceSummary,
    createHotelSummary,

    // Utility functions
    getItemTypeInfo,
    canDirectCheckout,
    requiresQuote,

    // Constants
    LUXURY_SERVICES_CATALOG,
    CATEGORY_LABELS,
    CATEGORY_EMOJIS
  };
};

export default useToolResults;
