// useCartManager Hook
// Manages cart operations with price calculations

import { useReducer, useCallback, useMemo } from 'react';
import { cartReducer, initialCartState, cartActions } from '../reducers/cartReducer';
import {
  calculateItemPrice,
  calculateCartTotal,
  getNormalizedPrice
} from '../utils/priceCalculator';
import {
  calculateMultiStopRoute,
  formatMultiStopRoute,
  formatDuration,
  updateItemWithRoute
} from '../utils/routeCalculator';

export function useCartManager({ userHasNFT, usedNFTBenefitThisYear, nftBenefitChecker, onToast }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  // Calculate cart total with memoization
  const cartTotal = useMemo(() => {
    return calculateCartTotal(state.cartItems, {
      userHasNFT,
      usedNFTBenefitThisYear,
      nftBenefitChecker
    });
  }, [state.cartItems, userHasNFT, usedNFTBenefitThisYear, nftBenefitChecker]);

  // Check if item is cigar/smoking related
  const isCigarOrSmokingItem = useCallback((item) => {
    if (!item) return false;
    const type = (item.type || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();

    return (
      type === 'cigars' ||
      category.includes('cigar') ||
      category.includes('smoking') ||
      name.includes('cigar') ||
      name.includes('cohiba') ||
      name.includes('montecristo') ||
      name.includes('davidoff') ||
      name.includes('partagas') ||
      name.includes('romeo y julieta') ||
      name.includes('padron') ||
      name.includes('arturo fuente')
    );
  }, []);

  // Check if cleaning fee already in cart
  const hasCleaningFeeInCart = useCallback(() => {
    return state.cartItems.some(item =>
      item.isCleaningFee === true ||
      item.id === 'aircraft-cleaning-fee-smoking'
    );
  }, [state.cartItems]);

  // Add item to cart
  const addItem = useCallback((item) => {
    if (!item) return;

    // Check for duplicates
    const existing = state.cartItems.find(
      i => i.id === item.id && i.type === item.type
    );

    if (existing) {
      // Update quantity instead
      dispatch(cartActions.updateItem(existing.cartId, {
        quantity: (existing.quantity || 1) + 1
      }));
      onToast?.({ message: `Updated quantity in cart`, type: 'cart' });
    } else {
      // Add new item with calculated price
      const calculatedPrice = calculateItemPrice(item);
      const newItem = {
        ...item,
        cartId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        price: calculatedPrice || item.price || 0,
        basePrice: calculatedPrice || item.price || 0,
        quantity: item.quantity || 1,
        addedAt: new Date().toISOString()
      };

      dispatch(cartActions.addItem(newItem));
      onToast?.({ message: `Added ${item.name || item.title || 'item'} to cart`, type: 'cart' });

      // AUTO-ADD CLEANING FEE for cigars/smoking items
      if (isCigarOrSmokingItem(item) && !hasCleaningFeeInCart()) {
        const cleaningFeeItem = {
          id: 'aircraft-cleaning-fee-smoking',
          name: 'Aircraft Cleaning Fee (Smoking)',
          description: 'Required deep cleaning for aircraft after cigar/smoking use',
          type: 'service_fee',
          category: 'Aircraft Services',
          price: 2000,
          basePrice: 2000,
          unitPrice: 2000,
          currency: 'USD',
          quantity: 1,
          isCleaningFee: true,
          isRequired: true,
          linkedTo: 'cigars',
          cartId: `cart-cleaning-${Date.now()}`,
          addedAt: new Date().toISOString(),
          image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          note: 'Automatically added for cigar orders'
        };

        // Add cleaning fee after a short delay so toast messages don't overlap
        setTimeout(() => {
          dispatch(cartActions.addItem(cleaningFeeItem));
          onToast?.({ message: 'Aircraft cleaning fee ($2,000) added for cigar order', type: 'info' });
        }, 500);
      }
    }
  }, [state.cartItems, onToast, isCigarOrSmokingItem, hasCleaningFeeInCart]);

  // Remove item from cart
  const removeItem = useCallback((cartId) => {
    const item = state.cartItems.find(i => i.cartId === cartId);
    dispatch(cartActions.removeItem(cartId));
    onToast?.({ message: `Removed ${item?.name || item?.title || 'item'} from cart`, type: 'cart' });
  }, [state.cartItems, onToast]);

  // Update item
  const updateItem = useCallback((cartId, updates) => {
    dispatch(cartActions.updateItem(cartId, updates));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    dispatch(cartActions.clearCart());
    onToast?.({ message: 'Cart cleared', type: 'cart' });
  }, [onToast]);

  // Add stop to multi-stop flight
  const addStop = useCallback((cartId, stopAirport, stopDuration = 60) => {
    const item = state.cartItems.find(i => i.cartId === cartId);
    if (!item) return;

    // Check if it's a flight type
    const isFlightType = ['jets', 'jet', 'helicopters', 'helicopter'].includes(item.type);
    if (!isFlightType) {
      onToast?.({ message: 'Multi-stop only available for jets and helicopters', type: 'warning' });
      return;
    }

    const stops = item.stops || [];
    const newStop = {
      ...stopAirport,
      stopDuration,
      departureTime: null,
      arrivalTime: null
    };
    const updatedStops = [...stops, newStop];

    // Recalculate route with new stop
    const updatedItem = updateItemWithRoute(item, updatedStops);

    dispatch(cartActions.updateItem(cartId, {
      ...updatedItem,
      cartId: item.cartId // Preserve cartId
    }));

    onToast?.({ message: `Stop added: ${stopAirport.name || stopAirport.city}`, type: 'cart' });
  }, [state.cartItems, onToast]);

  // Remove stop from multi-stop flight
  const removeStop = useCallback((cartId, stopIndex) => {
    const item = state.cartItems.find(i => i.cartId === cartId);
    if (!item || !item.stops) return;

    const updatedStops = item.stops.filter((_, idx) => idx !== stopIndex);

    // Recalculate route without removed stop
    const updatedItem = updateItemWithRoute(item, updatedStops);

    dispatch(cartActions.updateItem(cartId, {
      ...updatedItem,
      cartId: item.cartId
    }));

    onToast?.({ message: 'Stop removed', type: 'cart' });
  }, [state.cartItems, onToast]);

  // Update stop duration
  const updateStopDuration = useCallback((cartId, stopIndex, durationMinutes) => {
    const item = state.cartItems.find(i => i.cartId === cartId);
    if (!item || !item.stops) return;

    const updatedStops = item.stops.map((stop, idx) =>
      idx === stopIndex ? { ...stop, stopDuration: durationMinutes } : stop
    );

    // Recalculate with new duration
    const updatedItem = updateItemWithRoute(item, updatedStops);

    dispatch(cartActions.updateItem(cartId, {
      ...updatedItem,
      cartId: item.cartId
    }));
  }, [state.cartItems]);

  // Update endpoint (origin or destination)
  const updateEndpoint = useCallback((cartId, endpointType, airport) => {
    const item = state.cartItems.find(i => i.cartId === cartId);
    if (!item) return;

    let updates;
    if (endpointType === 'origin') {
      updates = {
        from: airport.name,
        origin: airport.name,
        from_iata: airport.code,
        originIata: airport.code,
        originLat: airport.lat,
        originLng: airport.lng
      };
    } else {
      updates = {
        to: airport.name,
        destination: airport.name,
        to_iata: airport.code,
        destinationIata: airport.code,
        destLat: airport.lat,
        destLng: airport.lng
      };
    }

    // Apply updates first
    const updatedItem = { ...item, ...updates };

    // Then recalculate route
    const finalItem = updateItemWithRoute(updatedItem, updatedItem.stops || []);

    dispatch(cartActions.updateItem(cartId, {
      ...finalItem,
      cartId: item.cartId
    }));

    onToast?.({ message: `${endpointType === 'origin' ? 'Departure' : 'Arrival'} updated`, type: 'cart' });
  }, [state.cartItems, onToast]);

  // Update catering
  const updateCatering = useCallback((cartId, cateringId, price) => {
    dispatch(cartActions.updateCatering(cartId, cateringId, price));
  }, []);

  // Update quantity
  const updateQuantity = useCallback((cartId, quantity) => {
    if (quantity < 1) {
      removeItem(cartId);
      return;
    }
    dispatch(cartActions.updateQuantity(cartId, quantity));
  }, [removeItem]);

  // Update rental days (for cars)
  const updateRentalDays = useCallback((cartId, days) => {
    if (days < 1) days = 1;
    dispatch(cartActions.updateRentalDays(cartId, days));
  }, []);

  // Set selected payment item
  const selectPaymentItem = useCallback((item) => {
    dispatch(cartActions.setSelectedPaymentItem(item));
  }, []);

  // Set payment method
  const selectPaymentMethod = useCallback((method) => {
    dispatch(cartActions.setSelectedPaymentMethod(method));
  }, []);

  // Get item price (normalized)
  const getItemPrice = useCallback((item) => {
    return getNormalizedPrice(item);
  }, []);

  // Separate items by type
  const separatedItems = useMemo(() => {
    const mainServices = state.cartItems.filter(item =>
      !item.isCustomExtra && item.type !== 'custom_extra'
    );
    const customExtras = state.cartItems.filter(item =>
      item.isCustomExtra || item.type === 'custom_extra'
    );
    // Payable items include empty legs, adventures, and wines (have fixed prices)
    const payableItems = state.cartItems.filter(item =>
      item.type === 'empty_legs' || item.type === 'emptyleg' ||
      item.type === 'adventure' || item.type === 'adventures' ||
      item.type === 'wines' || item.type === 'wine'
    );
    const requestOnlyItems = state.cartItems.filter(item =>
      !['empty_legs', 'emptyleg', 'adventure', 'adventures', 'wines', 'wine'].includes(item.type)
    );

    return {
      mainServices,
      customExtras,
      payableItems,
      requestOnlyItems,
      hasPayableItems: payableItems.length > 0,
      hasRequestOnlyItems: requestOnlyItems.length > 0
    };
  }, [state.cartItems]);

  return {
    // State
    cartItems: state.cartItems,
    selectedPaymentItem: state.selectedPaymentItem,
    selectedPaymentMethod: state.selectedPaymentMethod,
    cartTotal,
    itemCount: state.cartItems.length,
    ...separatedItems,

    // Actions
    dispatch,
    addItem,
    removeItem,
    updateItem,
    clearCart,
    addStop,
    removeStop,
    updateStopDuration,
    updateEndpoint,
    updateCatering,
    updateQuantity,
    updateRentalDays,
    selectPaymentItem,
    selectPaymentMethod,
    getItemPrice,

    // Direct setters
    setCartItems: (items) => dispatch(cartActions.setCartItems(items))
  };
}

export default useCartManager;
