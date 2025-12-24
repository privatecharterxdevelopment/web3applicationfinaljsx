/**
 * useCartNew Hook
 * Manages cart state, add/remove/update items, price calculations
 */

import { useState, useCallback, useMemo } from 'react';
import { calculateDistance } from '../utils/priceCalculator';
import { formatDuration, kmToNm, calculateMultiStopRoute } from '../utils/routeCalculator';

// Constants
const NFT_DISCOUNT_PERCENT = 10;
const SMOKING_CLEANING_FEE = 2000;

export const useCartNew = (cartItemsProp, setCartItemsProp, userHasNFT = false) => {
  // Use prop if provided, otherwise internal state
  const [internalCartItems, setInternalCartItems] = useState([]);
  const cartItems = cartItemsProp ?? internalCartItems;
  const setCartItems = setCartItemsProp ?? setInternalCartItems;

  // Selected items for batch operations
  const [selectedItems, setSelectedItems] = useState([]);

  // Expanded cart items (for details view)
  const [expandedCartItems, setExpandedCartItems] = useState({});

  // Custom extra form
  const [customExtraForm, setCustomExtraForm] = useState({
    name: '',
    category: '',
    quantity: 1,
    notes: ''
  });

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = item.totalWithFee || item.price_usd || item.price || 0;
      return total + (typeof price === 'number' ? price : 0);
    }, 0);
  }, [cartItems]);

  // Calculate item price with distance/time
  const calculateItemPrice = useCallback((item) => {
    if (!item) return 0;

    // Pre-calculated estimated price (from AI or route calculator)
    if (item.estimatedPrice && item.estimatedPrice > 0) {
      return item.estimatedPrice;
    }

    // Fixed price items
    if (item.price_usd) return item.price_usd;
    if (item.price && typeof item.price === 'number') return item.price;

    // Calculate based on hourly rate and billed/flight hours
    const hourlyRate = item.hourly_rate_eur || item.hourly_rate || item.pricePerHour || 0;
    const hours = item.billedHours || item.flightTimeHours || item.flightHours || item.estimatedFlightHours || 0;

    if (hourlyRate && hours) {
      return Math.round(hourlyRate * hours);
    }

    return 0;
  }, []);

  // Apply NFT discount if applicable
  const applyNFTDiscount = useCallback((price) => {
    if (!userHasNFT || !price) return price;
    return price * (1 - NFT_DISCOUNT_PERCENT / 100);
  }, [userHasNFT]);

  // Add item to cart
  const addToCart = useCallback((item) => {
    if (!item) return;

    console.log('🛒 addToCart called with:', {
      type: item.type,
      name: item.name || item.aircraft_model,
      hourly_rate_eur: item.hourly_rate_eur,
      estimatedPrice: item.estimatedPrice,
      billedHours: item.billedHours,
      flightHours: item.flightHours,
      route: item.route,
      from: item.from || item.from_city,
      to: item.to || item.to_city
    });

    const cartId = item.cartId || `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check for duplicates
    const existingItem = cartItems.find(ci =>
      ci.id === item.id && ci.type === item.type
    );

    if (existingItem && !item.allowDuplicate) {
      // Increment quantity instead
      setCartItems(prev => prev.map(ci =>
        ci.cartId === existingItem.cartId
          ? { ...ci, quantity: (ci.quantity || 1) + 1 }
          : ci
      ));
      return existingItem.cartId;
    }

    // Check if this is a jet or helicopter that needs route calculation
    const isJet = item.type === 'jet' || item.type === 'aircraft' || item.category === 'jets';
    const isHelicopter = item.type === 'helicopter' || item.category === 'helicopters';
    // Support both hourly_rate_eur (from database) and hourlyRate (from AI addToCart tool)
    const hourlyRateValue = item.hourly_rate_eur || item.hourlyRate || item.hourly_rate || 0;
    const needsRouteCalculation = (isJet || isHelicopter) && hourlyRateValue;

    let cartItem = { ...item };

    // Calculate route details for jets/helicopters
    if (needsRouteCalculation) {
      // Get coordinates
      const originLat = item.originLat || item.from_lat || 0;
      const originLng = item.originLng || item.from_lng || 0;
      const destLat = item.destLat || item.to_lat || 0;
      const destLng = item.destLng || item.to_lng || 0;

      // Check if we have multi-stop route data already calculated
      if (item.stops && item.stops.length > 0 && item.legs) {
        // Multi-stop route - use existing calculated data
        const totalDistance = item.totalDistance || 0;
        const flightTimeHours = item.flightTimeHours || item.billedHours || 0;
        const billedHours = item.billedHours || Math.ceil(flightTimeHours);
        const estimatedPrice = billedHours * hourlyRateValue;

        cartItem = {
          ...cartItem,
          // Route details
          flightDistanceNm: kmToNm(totalDistance),
          flightDistanceKm: totalDistance,
          flightTimeHours,
          estimatedDuration: item.estimatedDuration || formatDuration(flightTimeHours),
          billedHours,
          // Price
          estimatedPrice,
          price: estimatedPrice,
          basePrice: estimatedPrice,
          totalWithFee: estimatedPrice,
          priceCalculation: `${billedHours}h × €${hourlyRateValue.toLocaleString()}/hr`,
          // Route string
          route: item.route || `${item.from || item.origin} → ${item.to || item.destination}`,
          isMultiStop: true
        };
      } else if (originLat && originLng && destLat && destLng) {
        // Direct route - calculate from coordinates
        const origin = { lat: originLat, lng: originLng };
        const destination = { lat: destLat, lng: destLng };

        const distanceKm = calculateDistance(origin, destination);
        const distanceNm = kmToNm(distanceKm);

        // Get speed (convert knots to km/h if needed)
        const speedKts = item.speed_kts || item.speed || 450;
        const speedKmh = speedKts * 1.852;

        // Calculate flight time
        const flightTimeHours = distanceKm > 0 ? distanceKm / speedKmh : 0;
        const billedHours = Math.max(1, Math.ceil(flightTimeHours)); // Minimum 1 hour

        // Calculate price
        const estimatedPrice = billedHours * hourlyRateValue;

        cartItem = {
          ...cartItem,
          // Coordinates
          originLat,
          originLng,
          destLat,
          destLng,
          // Route details
          flightDistanceNm: Math.round(distanceNm),
          flightDistanceKm: Math.round(distanceKm),
          flightTimeHours,
          estimatedDuration: formatDuration(flightTimeHours),
          billedHours,
          // Price
          estimatedPrice,
          price: estimatedPrice,
          basePrice: estimatedPrice,
          totalWithFee: estimatedPrice,
          priceCalculation: `${billedHours}h × €${hourlyRateValue.toLocaleString()}/hr`,
          // Route string
          route: `${item.from || item.origin || 'Origin'} → ${item.to || item.destination || 'Destination'}`,
          isMultiStop: false
        };
      } else if (item.estimatedPrice && item.estimatedPrice > 0) {
        // Use pre-calculated values from AI response
        cartItem = {
          ...cartItem,
          flightDistanceNm: item.flightDistance || item.flightDistanceNm,
          flightTimeHours: item.flightHours || item.billedHours,
          estimatedDuration: item.estimatedDuration || item.flightDuration || formatDuration(item.flightHours || item.billedHours || 0),
          billedHours: item.billedHours || item.flightHours,
          estimatedPrice: item.estimatedPrice || item.price,
          price: item.estimatedPrice || item.price,
          basePrice: item.estimatedPrice || item.price,
          totalWithFee: item.estimatedPrice || item.price,
          priceCalculation: item.priceCalculation || `${item.billedHours || Math.ceil(item.flightHours) || 1}h × €${hourlyRateValue.toLocaleString()}/hr`,
          route: item.route || `${item.from || item.origin} → ${item.to || item.destination}`
        };
      } else if (item.price && item.price > 0) {
        // Use pre-calculated price from AI addToCart tool
        cartItem = {
          ...cartItem,
          flightTimeHours: item.flightHours,
          estimatedDuration: item.flightDuration || formatDuration(item.flightHours || 0),
          billedHours: item.flightHours ? Math.ceil(item.flightHours) : null,
          estimatedPrice: item.price,
          price: item.price,
          basePrice: item.basePrice || item.price,
          totalWithFee: item.price,
          priceCalculation: item.priceCalculation,
          route: item.route || (item.from && item.to ? `${item.from} → ${item.to}` : null)
        };
      }

      console.log('✈️ Route calculation result:', {
        hourlyRateUsed: hourlyRateValue,
        flightDistanceNm: cartItem.flightDistanceNm,
        flightTimeHours: cartItem.flightTimeHours,
        estimatedDuration: cartItem.estimatedDuration,
        billedHours: cartItem.billedHours,
        estimatedPrice: cartItem.estimatedPrice,
        priceCalculation: cartItem.priceCalculation,
        route: cartItem.route,
        isMultiStop: cartItem.isMultiStop
      });
    }

    // Calculate price (use route-calculated price or fallback)
    let price = cartItem.estimatedPrice || cartItem.price || calculateItemPrice(item);
    if (userHasNFT) {
      price = applyNFTDiscount(price);
    }

    const newItem = {
      ...cartItem,
      cartId,
      price: price || cartItem.price || 0,
      quantity: item.quantity || 1,
      addedAt: new Date().toISOString()
    };

    // Check if cigar/smoking item - add cleaning fee
    const isSmoking = item.category === 'cigars' || item.name?.toLowerCase().includes('cigar');
    const hasCleaningFee = cartItems.some(ci =>
      ci.isCleaningFee || ci.id === 'aircraft-cleaning-fee-smoking'
    );

    if (isSmoking && !hasCleaningFee) {
      const cleaningFee = {
        id: 'aircraft-cleaning-fee-smoking',
        cartId: `cleaning-${Date.now()}`,
        type: 'service_fee',
        name: 'Aircraft Cleaning Fee (Smoking)',
        description: 'Required deep cleaning for aircraft after smoking',
        category: 'Aircraft Services',
        quantity: 1,
        price: SMOKING_CLEANING_FEE,
        price_usd: SMOKING_CLEANING_FEE,
        isCleaningFee: true,
        isRequired: true,
        linkedTo: 'cigars',
        addedAt: new Date().toISOString()
      };

      setCartItems(prev => [...prev, newItem, cleaningFee]);
    } else {
      setCartItems(prev => [...prev, newItem]);
    }

    return cartId;
  }, [cartItems, setCartItems, calculateItemPrice, userHasNFT, applyNFTDiscount]);

  // Remove item from cart
  const removeFromCart = useCallback((cartId) => {
    setCartItems(prev => {
      const itemToRemove = prev.find(item => item.cartId === cartId);

      // If removing last cigar, also remove cleaning fee
      if (itemToRemove?.category === 'cigars') {
        const remainingCigars = prev.filter(item =>
          item.category === 'cigars' && item.cartId !== cartId
        );

        if (remainingCigars.length === 0) {
          return prev.filter(item =>
            item.cartId !== cartId && !item.isCleaningFee
          );
        }
      }

      return prev.filter(item => item.cartId !== cartId);
    });
  }, [setCartItems]);

  // Update item in cart
  const updateCartItem = useCallback((cartId, updates) => {
    setCartItems(prev => prev.map(item =>
      item.cartId === cartId
        ? { ...item, ...updates }
        : item
    ));
  }, [setCartItems]);

  // Update item quantity
  const updateQuantity = useCallback((cartId, quantity) => {
    if (quantity < 1) return;

    setCartItems(prev => prev.map(item => {
      if (item.cartId !== cartId) return item;

      const unitPrice = item.unitPrice || item.price_usd || item.price || 0;
      return {
        ...item,
        quantity,
        price: unitPrice * quantity,
        totalWithFee: unitPrice * quantity
      };
    }));
  }, [setCartItems]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setSelectedItems([]);
    setExpandedCartItems({});
  }, [setCartItems]);

  // Toggle item selection
  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  // Toggle item expanded state
  const toggleItemExpanded = useCallback((cartId) => {
    setExpandedCartItems(prev => ({
      ...prev,
      [cartId]: !prev[cartId]
    }));
  }, []);

  // Get items by type
  const getItemsByType = useCallback((type) => {
    return cartItems.filter(item => item.type === type);
  }, [cartItems]);

  // Separate items into payable vs request-only
  const separatedItems = useMemo(() => {
    const payable = cartItems.filter(item =>
      item.type === 'empty_legs' ||
      item.type === 'emptyleg' ||
      item.type === 'adventure' ||
      item.type === 'wines' ||
      item.type === 'wine'
    );

    const requestOnly = cartItems.filter(item =>
      !payable.includes(item)
    );

    return { payable, requestOnly };
  }, [cartItems]);

  // Calculate payable total
  const payableTotal = useMemo(() => {
    return separatedItems.payable.reduce((total, item) => {
      const price = item.totalWithFee || item.price_usd || item.price || 0;
      return total + (typeof price === 'number' ? price : 0);
    }, 0);
  }, [separatedItems.payable]);

  return {
    // Cart Items
    cartItems,
    setCartItems,

    // Selected Items
    selectedItems,
    setSelectedItems,
    toggleItemSelection,

    // Expanded Items
    expandedCartItems,
    setExpandedCartItems,
    toggleItemExpanded,

    // Custom Extra Form
    customExtraForm,
    setCustomExtraForm,

    // Operations
    addToCart,
    removeFromCart,
    updateCartItem,
    updateQuantity,
    clearCart,

    // Calculations
    cartTotal,
    payableTotal,
    calculateItemPrice,
    applyNFTDiscount,

    // Queries
    getItemsByType,
    separatedItems
  };
};

export default useCartNew;
