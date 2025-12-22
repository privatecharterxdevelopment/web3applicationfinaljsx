/**
 * useCartNew Hook
 * Manages cart state, add/remove/update items, price calculations
 */

import { useState, useCallback, useMemo } from 'react';

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

    // Fixed price items
    if (item.price_usd) return item.price_usd;
    if (item.price && typeof item.price === 'number') return item.price;

    // Calculate based on hourly rate and flight hours
    if (item.hourly_rate && item.estimatedFlightHours) {
      return item.hourly_rate * item.estimatedFlightHours;
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

    // Calculate price
    let price = calculateItemPrice(item);
    if (userHasNFT) {
      price = applyNFTDiscount(price);
    }

    const newItem = {
      ...item,
      cartId,
      price: price || item.price || 0,
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
