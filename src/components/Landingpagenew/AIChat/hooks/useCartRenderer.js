/**
 * useCartRenderer Hook - COMPLETE Cart Item Rendering Logic
 *
 * Contains ALL cart item detail rendering logic from original AIChat.jsx:
 * - Jet/Helicopter details with price calculation display
 * - Yacht details
 * - Luxury car details
 * - Wine/Cigar details with cleaning fee handling
 * - Custom extras with quantity controls
 * - Multi-stop journey display
 * - Medevac requests with urgency badges
 * - Service type detection for generic requests
 * - Badge generation for all item types
 * - Price display with NFT discount logic
 */

import { useCallback } from 'react';
import { LUXURY_SERVICES_CATALOG, CATEGORY_LABELS } from './useToolResults';

// Item type definitions - comprehensive list
export const ITEM_TYPES = {
  JET: ['jet', 'jets', 'private_jet', 'aircraft', 'charter'],
  HELICOPTER: ['helicopter', 'helicopters', 'heli', 'chopper'],
  YACHT: ['yacht', 'yachts', 'boat', 'vessel', 'sailing', 'catamaran', 'superyacht'],
  EMPTY_LEG: ['empty_legs', 'emptyleg', 'empty_leg'],
  LUXURY_CAR: ['luxury_car', 'luxury_cars', 'supercar', 'chauffeur', 'limousine'],
  WINE: ['wine', 'wines', 'champagne', 'spirits'],
  CIGAR: ['cigar', 'cigars'],
  ADVENTURE: ['adventure', 'fixed_offer', 'experience', 'tour'],
  TRANSFER: ['transfer', 'taxi', 'ground_transport', 'car_service'],
  CUSTOM_EXTRA: ['custom_extra', 'extra'],
  MEDEVAC: ['medevac', 'medical_evacuation'],
  SERVICE_FEE: ['service_fee', 'fee', 'cleaning_fee'],
  HOTEL: ['hotel', 'accommodation', 'stay'],
  RESTAURANT: ['restaurant', 'dining', 'reservation'],
  CONCIERGE: ['concierge', 'concierge_request']
};

// Category emoji map
export const CATEGORY_EMOJI_MAP = {
  wine: '🍷',
  champagne: '🍾',
  wines: '🍷',
  spirits: '🥃',
  caviar: '🥄',
  cigars: '🚬',
  flowers: '💐',
  cake: '🎂',
  cakes: '🎂',
  decorations: '🎈',
  photography: '📸',
  special: '⭐',
  smoking: '✈️',
  music: '🎵',
  catering: '🍽️',
  jets: '✈️',
  jet: '✈️',
  helicopters: '🚁',
  helicopter: '🚁',
  yachts: '🛥️',
  yacht: '🛥️',
  luxury_cars: '🚗',
  hotel: '🏨',
  transfer: '🚗',
  restaurant: '🍽️',
  experience: '🎯',
  concierge: '🎩',
  medevac: '🏥',
  delicatesse: '🍽️',
  other: '✨'
};

// Service type detection for generic AI requests
export const detectGenericServiceType = (contentLower) => {
  if (contentLower.includes('jet') || contentLower.includes('private flight'))
    return { type: 'jets', emoji: '✈️', name: 'Private Jet Charter' };
  if (contentLower.includes('helicopter'))
    return { type: 'helicopters', emoji: '🚁', name: 'Helicopter Charter' };
  if (contentLower.includes('yacht'))
    return { type: 'yachts', emoji: '🛥️', name: 'Yacht Charter' };
  if (contentLower.includes('limousine') || contentLower.includes('transfer') || contentLower.includes('car service'))
    return { type: 'transfer', emoji: '🚗', name: 'Ground Transfer' };
  if (contentLower.includes('restaurant') || contentLower.includes('dining') || contentLower.includes('reservation'))
    return { type: 'restaurant_reservation', emoji: '🍽️', name: 'Restaurant Reservation' };
  if (contentLower.includes('hotel') || contentLower.includes('accommodation'))
    return { type: 'hotel', emoji: '🏨', name: 'Hotel Booking' };
  if (contentLower.includes('experience') || contentLower.includes('adventure') || contentLower.includes('tour'))
    return { type: 'experience', emoji: '🎯', name: 'Experience Booking' };
  if (contentLower.includes('concierge'))
    return { type: 'concierge_request', emoji: '🎩', name: 'Concierge Service' };
  if (contentLower.includes('wine') || contentLower.includes('champagne'))
    return { type: 'wines', emoji: '🍷', name: 'Wine Selection' };
  if (contentLower.includes('cigar'))
    return { type: 'cigars', emoji: '🚬', name: 'Premium Cigars' };
  if (contentLower.includes('caviar') || contentLower.includes('delicatesse'))
    return { type: 'delicatesse', emoji: '🥄', name: 'Gourmet Selection' };
  return { type: 'concierge_request', emoji: '✨', name: 'Service Request' };
};

// Find matched product from search results
export const findMatchedProduct = (content, allItems) => {
  if (!allItems || allItems.length === 0) return null;

  const contentLower = content.toLowerCase();
  let matchedProduct = null;
  let bestMatchScore = 0;

  for (const item of allItems) {
    const itemName = (item.name || item.displayTitle || '').toLowerCase();
    const itemBrand = (item.brand || '').toLowerCase();
    const fullName = `${itemBrand} ${itemName}`.trim();

    // Check if item name appears in the AI message
    if (itemName && contentLower.includes(itemName)) {
      const score = itemName.length;
      if (score > bestMatchScore) {
        bestMatchScore = score;
        matchedProduct = item;
      }
    }
    // Also check brand + name combination
    if (fullName && contentLower.includes(fullName)) {
      const score = fullName.length + 10; // Bonus for full name match
      if (score > bestMatchScore) {
        bestMatchScore = score;
        matchedProduct = item;
      }
    }
  }

  return matchedProduct;
};

export const useCartRenderer = ({
  cartItems,
  setCartItems,
  expandedCartItems,
  setExpandedCartItems,
  removeFromCart,
  setShowCryptoPayment,
  setSelectedPaymentItem,
  setShowCalendarModal,
  setSelectedItemForCalendar,
  userHasNFT,
  setToast,
  setChatHistory,
  activeChat
}) => {
  // Check item type
  const isItemType = useCallback((item, types) => {
    const itemType = (item.type || '').toLowerCase();
    return types.some(t => itemType.includes(t));
  }, []);

  // Type checkers
  const isJet = useCallback((item) => isItemType(item, ITEM_TYPES.JET), [isItemType]);
  const isHelicopter = useCallback((item) => isItemType(item, ITEM_TYPES.HELICOPTER), [isItemType]);
  const isYacht = useCallback((item) => isItemType(item, ITEM_TYPES.YACHT), [isItemType]);
  const isEmptyLeg = useCallback((item) => isItemType(item, ITEM_TYPES.EMPTY_LEG), [isItemType]);
  const isLuxuryCar = useCallback((item) => isItemType(item, ITEM_TYPES.LUXURY_CAR), [isItemType]);
  const isWine = useCallback((item) => isItemType(item, ITEM_TYPES.WINE), [isItemType]);
  const isCigar = useCallback((item) => isItemType(item, ITEM_TYPES.CIGAR), [isItemType]);
  const isAdventure = useCallback((item) => isItemType(item, ITEM_TYPES.ADVENTURE), [isItemType]);
  const isTransfer = useCallback((item) => isItemType(item, ITEM_TYPES.TRANSFER), [isItemType]);
  const isCustomExtra = useCallback((item) => isItemType(item, ITEM_TYPES.CUSTOM_EXTRA), [isItemType]);
  const isMedevac = useCallback((item) => isItemType(item, ITEM_TYPES.MEDEVAC), [isItemType]);
  const isServiceFee = useCallback((item) => isItemType(item, ITEM_TYPES.SERVICE_FEE), [isItemType]);
  const isHotel = useCallback((item) => isItemType(item, ITEM_TYPES.HOTEL), [isItemType]);
  const isRestaurant = useCallback((item) => isItemType(item, ITEM_TYPES.RESTAURANT), [isItemType]);
  const isConcierge = useCallback((item) => isItemType(item, ITEM_TYPES.CONCIERGE), [isItemType]);

  // Check if item can be paid directly (crypto checkout)
  const canDirectCheckout = useCallback((item) => {
    return isEmptyLeg(item) || isAdventure(item) || isWine(item);
  }, [isEmptyLeg, isAdventure, isWine]);

  // Check if item requires quote
  const requiresQuote = useCallback((item) => {
    return isJet(item) || isHelicopter(item) || isYacht(item) ||
           isLuxuryCar(item) || isTransfer(item) || isMedevac(item);
  }, [isJet, isHelicopter, isYacht, isLuxuryCar, isTransfer, isMedevac]);

  // Check if item is a flight service (for cross-selling transfers)
  const isFlightService = useCallback((item) => {
    return isJet(item) || isHelicopter(item) || isEmptyLeg(item);
  }, [isJet, isHelicopter, isEmptyLeg]);

  // Get item badge info
  const getItemBadge = useCallback((item) => {
    if (item.isPaid) return { text: 'PAID', color: 'bg-green-600 text-white' };
    if (isJet(item)) return { text: 'CHARTER', color: 'bg-gray-800 text-white' };
    if (isHelicopter(item)) return { text: 'HELI', color: 'bg-gray-700 text-white' };
    if (isYacht(item)) return { text: 'YACHT', color: 'bg-gray-600 text-white' };
    if (isLuxuryCar(item)) return { text: 'SUPERCAR', color: 'bg-gray-900 text-white' };
    if (isEmptyLeg(item)) return { text: 'EMPTY LEG', color: 'bg-gray-800 text-white' };
    if (isTransfer(item)) return { text: 'TRANSFER', color: 'bg-gray-400 text-white' };
    if (isAdventure(item)) return { text: 'EXPERIENCE', color: 'bg-gray-800 text-white' };
    if (isWine(item)) return { text: 'WINE', color: 'bg-gray-700 text-white' };
    if (isCigar(item)) return { text: 'CIGAR', color: 'bg-gray-600 text-white' };
    if (isMedevac(item)) return { text: 'MEDEVAC', color: 'bg-red-600 text-white' };
    if (isHotel(item)) return { text: 'HOTEL', color: 'bg-blue-600 text-white' };
    if (isRestaurant(item)) return { text: 'DINING', color: 'bg-amber-600 text-white' };
    if (isConcierge(item)) return { text: 'CONCIERGE', color: 'bg-purple-600 text-white' };
    if (isCustomExtra(item)) return { text: item.category?.toUpperCase() || 'EXTRA', color: 'bg-gray-700 text-white' };
    if (isServiceFee(item)) return { text: 'FEE', color: 'bg-gray-400 text-gray-800' };
    return { text: 'SERVICE', color: 'bg-gray-300 text-gray-700' };
  }, [isJet, isHelicopter, isYacht, isLuxuryCar, isEmptyLeg, isTransfer, isAdventure, isWine, isCigar, isMedevac, isHotel, isRestaurant, isConcierge, isCustomExtra, isServiceFee]);

  // Get secondary badge (AI REQUEST, MULTI-STOP, etc.)
  const getSecondaryBadge = useCallback((item) => {
    if (item.isPaid) return null;
    if ((isJet(item) || isHelicopter(item)) && !isEmptyLeg(item) && !item.isMultiStop) {
      return { text: 'AI REQUEST', color: 'bg-gray-200 text-gray-600' };
    }
    if (item.isMultiStop) {
      return { text: 'MULTI-STOP', color: 'bg-blue-100 text-blue-700' };
    }
    if (isCustomExtra(item) && item.isLoadingPrice) {
      return { text: 'LOADING...', color: 'bg-gray-200 text-gray-600' };
    }
    if (isCustomExtra(item) || item.requiresQuote || item.isQuoteRequest) {
      return { text: 'TBC', color: 'bg-gray-200 text-gray-600' };
    }
    if (isMedevac(item)) {
      return { text: 'URGENT', color: 'bg-amber-100 text-amber-700' };
    }
    return null;
  }, [isJet, isHelicopter, isEmptyLeg, isCustomExtra, isMedevac]);

  // Get item display name
  const getItemDisplayName = useCallback((item) => {
    if (isEmptyLeg(item)) {
      const from = item.from_iata || item.from_city || item.from || '';
      const to = item.to_iata || item.to_city || item.to || '';
      return `${from} → ${to}`;
    }
    if (item.isMultiStop && item.route) {
      return item.route;
    }
    return item.name || item.title || item.displayTitle ||
           item.aircraft_type || item.model ||
           item.description?.slice(0, 40) || item.category || 'Service';
  }, [isEmptyLeg]);

  // Get item price display
  const getItemPriceDisplay = useCallback((item) => {
    const price = item.price || item.basePrice || item.price_usd || item.estimatedPrice || 0;
    const isQuoteItem = requiresQuote(item);
    const isEstimateItem = item.isEstimate || isJet(item) || isHelicopter(item);

    if (isQuoteItem && price === 0) {
      return { text: 'On Request', isEstimate: true };
    }

    let displayPrice = price;

    // Apply NFT discount if applicable
    if (userHasNFT && !item.nftDiscountApplied && price > 0) {
      displayPrice = price * 0.9; // 10% discount
    }

    const prefix = isEstimateItem ? '~' : '';
    return {
      text: `${prefix}$${displayPrice.toLocaleString()}`,
      isEstimate: isEstimateItem,
      calculation: item.priceCalculation,
      originalPrice: price,
      discountedPrice: displayPrice
    };
  }, [requiresQuote, userHasNFT, isJet, isHelicopter]);

  // Get category emoji
  const getCategoryEmoji = useCallback((category) => {
    return CATEGORY_EMOJI_MAP[category?.toLowerCase()] || '✨';
  }, []);

  // Toggle item expanded state
  const toggleItemExpanded = useCallback((cartId) => {
    setExpandedCartItems(prev => ({
      ...prev,
      [cartId]: !prev[cartId]
    }));
  }, [setExpandedCartItems]);

  // Update item quantity
  const updateItemQuantity = useCallback((item, idx, newQuantity) => {
    if (newQuantity < 1) return;

    setCartItems(prev => prev.map((ci, i) =>
      (ci.cartId === item.cartId || i === idx)
        ? {
            ...ci,
            quantity: newQuantity,
            price: (ci.unitPrice || ci.price_usd || ci.price || 0) * newQuantity,
            basePrice: (ci.unitPrice || ci.price_usd || ci.price || 0) * newQuantity,
            totalWithFee: (ci.unitPrice || ci.price_usd || ci.price || 0) * newQuantity
          }
        : ci
    ));
  }, [setCartItems]);

  // Get item details for expanded view
  const getItemDetails = useCallback((item) => {
    const details = [];

    // Route info
    if ((item.from || item.from_city) && (item.to || item.to_city)) {
      details.push({
        icon: 'mapPin',
        label: 'Route',
        value: `${item.from || item.from_city} → ${item.to || item.to_city}`
      });
    }

    // Passengers
    if (item.passengers || item.pax || item.max_passengers) {
      details.push({
        icon: 'users',
        label: 'Passengers',
        value: `${item.passengers || item.pax || item.max_passengers} pax`
      });
    }

    // Date/Time
    if (item.departure_date || item.departureDate || item.date) {
      details.push({
        icon: 'calendar',
        label: 'Date',
        value: item.departure_date || item.departureDate || item.date
      });
    }

    if (item.departure_time || item.time) {
      details.push({
        icon: 'clock',
        label: 'Time',
        value: item.departure_time || item.time
      });
    }

    // Duration
    if (item.flightDuration || item.estimatedDuration || item.duration) {
      details.push({
        icon: 'clock',
        label: 'Duration',
        value: item.flightDuration || item.estimatedDuration || item.duration
      });
    }

    // Price calculation breakdown
    if (item.priceCalculation) {
      details.push({
        icon: 'calculator',
        label: 'Calculation',
        value: item.priceCalculation
      });
    }

    // Aircraft specs
    if (item.aircraft_type || item.model) {
      details.push({
        icon: 'plane',
        label: 'Aircraft',
        value: item.aircraft_type || item.model
      });
    }

    if (item.range_km) {
      details.push({
        icon: 'plane',
        label: 'Range',
        value: `${item.range_km.toLocaleString()} km`
      });
    }

    if (item.speed_kts) {
      details.push({
        icon: 'plane',
        label: 'Speed',
        value: `${item.speed_kts} kts`
      });
    }

    if (item.hourly_rate_usd) {
      details.push({
        icon: 'dollar',
        label: 'Hourly Rate',
        value: `$${item.hourly_rate_usd.toLocaleString()}/hr`
      });
    }

    // Wine details
    if (isWine(item)) {
      if (item.producer) {
        details.push({ icon: 'wine', label: 'Producer', value: item.producer });
      }
      if (item.vintage) {
        details.push({ icon: 'calendar', label: 'Vintage', value: item.vintage });
      }
      if (item.region) {
        details.push({ icon: 'mapPin', label: 'Region', value: item.region });
      }
      if (item.varietal) {
        details.push({ icon: 'wine', label: 'Varietal', value: item.varietal });
      }
    }

    // Car details
    if (isLuxuryCar(item)) {
      if (item.horsepower) {
        details.push({ icon: 'car', label: 'Power', value: `${item.horsepower} HP` });
      }
      if (item.transmission) {
        details.push({ icon: 'car', label: 'Transmission', value: item.transmission });
      }
      if (item.topSpeed) {
        details.push({ icon: 'car', label: 'Top Speed', value: item.topSpeed });
      }
    }

    // Yacht details
    if (isYacht(item)) {
      if (item.length) {
        details.push({ icon: 'yacht', label: 'Length', value: item.length });
      }
      if (item.guests || item.cabins) {
        details.push({ icon: 'users', label: 'Capacity', value: `${item.guests || ''} guests${item.cabins ? `, ${item.cabins} cabins` : ''}` });
      }
      if (item.crew) {
        details.push({ icon: 'users', label: 'Crew', value: `${item.crew} members` });
      }
    }

    // Medevac details
    if (isMedevac(item)) {
      if (item.urgencyLevel) {
        details.push({ icon: 'alert', label: 'Urgency', value: item.urgencyLevel.toUpperCase() });
      }
      if (item.patientInfo?.condition) {
        details.push({ icon: 'medical', label: 'Condition', value: item.patientInfo.condition });
      }
      if (item.medicalDetails?.requirements) {
        details.push({ icon: 'medical', label: 'Requirements', value: item.medicalDetails.requirements });
      }
    }

    // Hotel details
    if (isHotel(item)) {
      if (item.checkIn) {
        details.push({ icon: 'calendar', label: 'Check-in', value: item.checkIn });
      }
      if (item.checkOut) {
        details.push({ icon: 'calendar', label: 'Check-out', value: item.checkOut });
      }
      if (item.nights) {
        details.push({ icon: 'moon', label: 'Nights', value: `${item.nights} nights` });
      }
      if (item.roomType) {
        details.push({ icon: 'bed', label: 'Room', value: item.roomType });
      }
    }

    // Catering info
    if (item.catering) {
      details.push({
        icon: 'utensils',
        label: 'Catering',
        value: item.catering === 'complimentary' ? 'Complimentary refreshments' : item.catering
      });
    }

    // Airport pickup fee
    if (item.airportPickupFee && item.airportPickupFee > 0) {
      details.push({
        icon: 'car',
        label: 'Airport Pickup',
        value: `+$${item.airportPickupFee.toLocaleString()}`
      });
    }

    return details;
  }, [isWine, isLuxuryCar, isYacht, isMedevac, isHotel]);

  // Get multi-stop journey stops
  const getJourneyStops = useCallback((item) => {
    if (!item.isMultiStop || !item.stops) return [];

    return item.stops.map((stop, index) => ({
      index: index + 1,
      city: stop.city,
      code: stop.code,
      date: stop.date !== 'TBD' ? stop.date : null,
      time: stop.time !== 'TBD' ? stop.time : null,
      stopDuration: stop.stopDuration
    }));
  }, []);

  // Calculate item totals
  const calculateItemTotal = useCallback((item) => {
    const basePrice = item.price || item.basePrice || item.price_usd || item.estimatedPrice || 0;
    const quantity = item.quantity || 1;
    const airportFee = item.airportPickupFee || 0;

    let total = basePrice * quantity + airportFee;

    // Apply NFT discount
    if (userHasNFT && !item.nftDiscountApplied) {
      total = total * 0.9;
    }

    return total;
  }, [userHasNFT]);

  // Get urgency badge for medevac
  const getMedevacUrgencyBadge = useCallback((urgencyLevel) => {
    const badges = {
      critical: { text: 'CRITICAL', color: 'bg-red-500 text-white', animate: true },
      urgent: { text: 'URGENT', color: 'bg-amber-500 text-white', animate: false },
      standard: { text: 'STANDARD', color: 'bg-gray-200 text-gray-600', animate: false }
    };
    return badges[urgencyLevel?.toLowerCase()] || badges.standard;
  }, []);

  // Check if cleaning fee already exists for cigars
  const hasCleaningFeeForCigars = useCallback(() => {
    return cartItems?.some(item =>
      item.isCleaningFee === true ||
      item.id === 'aircraft-cleaning-fee-smoking' ||
      (item.name && item.name.toLowerCase().includes('cleaning fee') && item.name.toLowerCase().includes('smoking'))
    );
  }, [cartItems]);

  // Add cleaning fee for cigars
  const addCleaningFeeForCigars = useCallback(() => {
    if (hasCleaningFeeForCigars()) return null;

    return {
      id: 'aircraft-cleaning-fee-smoking',
      cartId: `cleaning-${Date.now()}`,
      type: 'service_fee',
      name: 'Aircraft Cleaning Fee (Smoking)',
      title: 'Aircraft Cleaning Fee (Smoking)',
      description: 'Required deep cleaning for aircraft after cigar/smoking use',
      category: 'Aircraft Services',
      quantity: 1,
      unitPrice: 2000,
      price: 2000,
      price_usd: 2000,
      basePrice: 2000,
      totalWithFee: 2000,
      unit: 'Required for smoking onboard',
      isEstimate: false,
      isCleaningFee: true,
      isRequired: true,
      linkedTo: 'cigars',
      addedAt: new Date().toISOString()
    };
  }, [hasCleaningFeeForCigars]);

  // Add cigar with cleaning fee
  const addCigarWithCleaningFee = useCallback((cigarItem) => {
    const cleaningFee = addCleaningFeeForCigars();
    if (cleaningFee) {
      setCartItems(prev => [...prev, cigarItem, cleaningFee]);
      if (setToast) {
        setToast({ message: `${cigarItem.name} + cleaning fee added`, type: 'cart' });
      }
    } else {
      setCartItems(prev => [...prev, cigarItem]);
      if (setToast) {
        setToast({ message: `${cigarItem.name} added`, type: 'cart' });
      }
    }
  }, [addCleaningFeeForCigars, setCartItems, setToast]);

  // Handle pay now click
  const handlePayNow = useCallback((item) => {
    setSelectedPaymentItem(item);
    setShowCryptoPayment(true);
  }, [setSelectedPaymentItem, setShowCryptoPayment]);

  // Handle add to calendar click
  const handleAddToCalendar = useCallback((item) => {
    setSelectedItemForCalendar({
      title: item.name || item.title || 'Booking',
      start_date: item.date || item.departure_date,
      end_date: item.return_date,
      location: item.from && item.to ? `${item.from} → ${item.to}` : item.location,
      item_data: item
    });
    setShowCalendarModal(true);
  }, [setSelectedItemForCalendar, setShowCalendarModal]);

  // Create cart item from product
  const createCartItemFromProduct = useCallback((product, options = {}) => {
    const productType = product.type || 'custom_extra';
    const productCategory = product.category || productType;
    const isCigarProduct = productType === 'cigars' || productCategory === 'cigars';
    const isJetOrHeli = productType === 'jets' || productType === 'jet' ||
                        productType === 'helicopters' || productType === 'helicopter';

    const productPrice = isJetOrHeli
      ? (product.estimatedPrice || product.price || 0)
      : (product.price || product.unitPrice || product.basePrice || 0);

    const cartItem = {
      ...product,
      cartId: Date.now(),
      addedAt: new Date().toISOString(),
      price: productPrice,
      basePrice: productPrice,
      totalWithFee: isCigarProduct ? productPrice + 2000 : productPrice,
      ...options
    };

    return { cartItem, isCigarProduct, productPrice };
  }, []);

  // Create generic request cart item
  const createGenericRequestItem = useCallback((content, detectedService) => {
    // Extract any price mentioned in the message
    const priceMatch = content.match(/\$[\d,]+(?:\.\d{2})?/);
    const extractedPrice = priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, '')) : 0;

    return {
      id: `request-${Date.now()}`,
      cartId: Date.now(),
      type: detectedService.type,
      serviceType: detectedService.type,
      name: detectedService.name,
      description: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      price: extractedPrice,
      basePrice: extractedPrice,
      totalWithFee: extractedPrice,
      isCustomRequest: true,
      requestDetails: {
        originalMessage: content,
        serviceType: detectedService.type
      },
      addedAt: new Date().toISOString()
    };
  }, []);

  // Add generic request to cart
  const addGenericRequestToCart = useCallback((content, detectedService) => {
    const requestItem = createGenericRequestItem(content, detectedService);
    setCartItems(prev => [...prev, requestItem]);
    if (setToast) {
      setToast({ message: `${detectedService.name} added to cart`, type: 'success' });
    }
    if (setChatHistory && activeChat) {
      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? {
              ...c,
              messages: [...c.messages, {
                role: 'assistant',
                content: `✓ Added ${detectedService.name} request to your cart. Our team will provide a custom quote after you submit your request.`
              }]
            }
          : c
      ));
    }
    return requestItem;
  }, [createGenericRequestItem, setCartItems, setToast, setChatHistory, activeChat]);

  // Add product to cart (handles cigars with cleaning fee)
  const addProductToCart = useCallback((product) => {
    const { cartItem, isCigarProduct, productPrice } = createCartItemFromProduct(product);
    const productName = product.displayTitle || product.name || 'Product';

    if (isCigarProduct) {
      addCigarWithCleaningFee(cartItem);
    } else {
      setCartItems(prev => [...prev, cartItem]);
      if (setToast) {
        setToast({ message: `Added ${productName} to cart`, type: 'success' });
      }
    }

    if (setChatHistory && activeChat) {
      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? {
              ...c,
              messages: [...c.messages, {
                role: 'assistant',
                content: `✓ Added ${productName} to your cart${isCigarProduct ? ' (including $2,000 aircraft cleaning fee)' : ''}. You can review it in your cart before checkout.`
              }]
            }
          : c
      ));
    }

    return cartItem;
  }, [createCartItemFromProduct, addCigarWithCleaningFee, setCartItems, setToast, setChatHistory, activeChat]);

  // Get cross-sell suggestions based on item type
  const getCrossSellSuggestions = useCallback((item) => {
    const suggestions = [];

    if (isFlightService(item)) {
      const arrivalCity = item.to_city || item.to || item.destination;
      const departureCity = item.from_city || item.from || item.origin;

      if (arrivalCity) {
        suggestions.push({
          icon: '🚗',
          name: 'Airport Transfer',
          description: `Luxury ground transport in ${arrivalCity}`,
          type: 'transfer_arrival',
          city: arrivalCity
        });
      }
      if (departureCity && departureCity !== arrivalCity) {
        suggestions.push({
          icon: '🚗',
          name: 'Airport Transfer',
          description: `Luxury ground transport in ${departureCity}`,
          type: 'transfer_departure',
          city: departureCity
        });
      }
    }

    if (item.isMultiStop || item.hasOvernightStays) {
      suggestions.push({
        icon: '🏨',
        name: 'Hotel Accommodations',
        description: 'Premium hotels near your overnight stops',
        type: 'hotel'
      });
    }

    suggestions.push({
      icon: '🍾',
      name: 'In-Flight Catering',
      description: 'Gourmet meals & beverages',
      type: 'catering'
    });

    suggestions.push({
      icon: '📋',
      name: 'Concierge Services',
      description: 'Restaurant reservations, events, experiences',
      type: 'concierge'
    });

    return suggestions;
  }, [isFlightService]);

  // Calculate cart total
  const calculateCartTotal = useCallback(() => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  }, [cartItems, calculateItemTotal]);

  // Get cart summary
  const getCartSummary = useCallback(() => {
    if (!cartItems || cartItems.length === 0) {
      return { itemCount: 0, total: 0, hasQuoteItems: false, canCheckoutNow: false };
    }

    const total = calculateCartTotal();
    const hasQuoteItems = cartItems.some(item => requiresQuote(item));
    const canCheckoutNow = cartItems.some(item => canDirectCheckout(item));
    const flightItems = cartItems.filter(item => isFlightService(item));
    const extraItems = cartItems.filter(item => isCustomExtra(item) || isServiceFee(item));

    return {
      itemCount: cartItems.length,
      total,
      hasQuoteItems,
      canCheckoutNow,
      flightItems: flightItems.length,
      extraItems: extraItems.length,
      nftDiscount: userHasNFT ? total * 0.1 : 0
    };
  }, [cartItems, calculateCartTotal, requiresQuote, canDirectCheckout, isFlightService, isCustomExtra, isServiceFee, userHasNFT]);

  return {
    // Type checks
    isJet,
    isHelicopter,
    isYacht,
    isEmptyLeg,
    isLuxuryCar,
    isWine,
    isCigar,
    isAdventure,
    isTransfer,
    isCustomExtra,
    isMedevac,
    isServiceFee,
    isHotel,
    isRestaurant,
    isConcierge,
    isFlightService,
    canDirectCheckout,
    requiresQuote,

    // Display helpers
    getItemBadge,
    getSecondaryBadge,
    getItemDisplayName,
    getItemPriceDisplay,
    getCategoryEmoji,
    getItemDetails,
    getJourneyStops,
    calculateItemTotal,
    getMedevacUrgencyBadge,
    getCrossSellSuggestions,
    calculateCartTotal,
    getCartSummary,

    // Cigar cleaning fee
    hasCleaningFeeForCigars,
    addCleaningFeeForCigars,
    addCigarWithCleaningFee,

    // Product to cart
    createCartItemFromProduct,
    createGenericRequestItem,
    addGenericRequestToCart,
    addProductToCart,

    // Service detection
    detectGenericServiceType,
    findMatchedProduct,

    // Actions
    toggleItemExpanded,
    updateItemQuantity,
    handlePayNow,
    handleAddToCalendar,

    // Constants
    ITEM_TYPES,
    CATEGORY_EMOJI_MAP,
    LUXURY_SERVICES_CATALOG,
    CATEGORY_LABELS
  };
};

export default useCartRenderer;
