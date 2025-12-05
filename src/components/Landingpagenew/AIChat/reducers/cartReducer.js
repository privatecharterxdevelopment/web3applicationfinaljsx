// Cart State Reducer
// Manages: cartItems, totals, extras, multi-stop data

export const CART_ACTIONS = {
  // Items
  SET_CART_ITEMS: 'SET_CART_ITEMS',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',

  // Multi-stop
  ADD_STOP: 'ADD_STOP',
  REMOVE_STOP: 'REMOVE_STOP',
  UPDATE_STOP_DURATION: 'UPDATE_STOP_DURATION',
  UPDATE_ENDPOINT: 'UPDATE_ENDPOINT',

  // Extras
  UPDATE_CATERING: 'UPDATE_CATERING',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  UPDATE_RENTAL_DAYS: 'UPDATE_RENTAL_DAYS',

  // Selection
  SET_SELECTED_PAYMENT_ITEM: 'SET_SELECTED_PAYMENT_ITEM',
  SET_SELECTED_PAYMENT_METHOD: 'SET_SELECTED_PAYMENT_METHOD',

  // Batch
  BATCH_UPDATE: 'BATCH_UPDATE'
};

export const initialCartState = {
  cartItems: [],
  selectedPaymentItem: null,
  selectedPaymentMethod: null
};

export function cartReducer(state, action) {
  switch (action.type) {
    // Items
    case CART_ACTIONS.SET_CART_ITEMS:
      return { ...state, cartItems: action.payload };

    case CART_ACTIONS.ADD_ITEM:
      // Check for duplicates
      const existingIndex = state.cartItems.findIndex(
        item => item.id === action.payload.id && item.type === action.payload.type
      );
      if (existingIndex >= 0) {
        // Update quantity if exists
        return {
          ...state,
          cartItems: state.cartItems.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: (item.quantity || 1) + 1 }
              : item
          )
        };
      }
      return {
        ...state,
        cartItems: [...state.cartItems, { ...action.payload, cartId: `cart-${Date.now()}` }]
      };

    case CART_ACTIONS.UPDATE_ITEM:
      return {
        ...state,
        cartItems: state.cartItems.map(item =>
          item.cartId === action.payload.cartId
            ? { ...item, ...action.payload.updates }
            : item
        )
      };

    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        cartItems: state.cartItems.filter(item => item.cartId !== action.payload)
      };

    case CART_ACTIONS.CLEAR_CART:
      return { ...state, cartItems: [] };

    // Multi-stop flight management
    case CART_ACTIONS.ADD_STOP:
      return {
        ...state,
        cartItems: state.cartItems.map(item => {
          if (item.cartId === action.payload.cartId &&
              (item.type === 'jets' || item.type === 'jet' ||
               item.type === 'helicopters' || item.type === 'helicopter')) {
            const stops = item.stops || [];
            const newStop = {
              ...action.payload.stopAirport,
              stopDuration: action.payload.stopDuration || 60
            };
            return {
              ...item,
              stops: [...stops, newStop],
              isMultiStop: true
            };
          }
          return item;
        })
      };

    case CART_ACTIONS.REMOVE_STOP:
      return {
        ...state,
        cartItems: state.cartItems.map(item => {
          if (item.cartId === action.payload.cartId && item.stops) {
            const updatedStops = item.stops.filter((_, idx) => idx !== action.payload.stopIndex);
            return {
              ...item,
              stops: updatedStops,
              isMultiStop: updatedStops.length > 0
            };
          }
          return item;
        })
      };

    case CART_ACTIONS.UPDATE_STOP_DURATION:
      return {
        ...state,
        cartItems: state.cartItems.map(item => {
          if (item.cartId === action.payload.cartId && item.stops) {
            return {
              ...item,
              stops: item.stops.map((stop, idx) =>
                idx === action.payload.stopIndex
                  ? { ...stop, stopDuration: action.payload.duration }
                  : stop
              )
            };
          }
          return item;
        })
      };

    case CART_ACTIONS.UPDATE_ENDPOINT:
      return {
        ...state,
        cartItems: state.cartItems.map(item => {
          if (item.cartId === action.payload.cartId) {
            if (action.payload.endpointType === 'origin') {
              return {
                ...item,
                from: action.payload.airport.name,
                origin: action.payload.airport.name,
                from_iata: action.payload.airport.code,
                originIata: action.payload.airport.code,
                originLat: action.payload.airport.lat,
                originLng: action.payload.airport.lng
              };
            } else {
              return {
                ...item,
                to: action.payload.airport.name,
                destination: action.payload.airport.name,
                to_iata: action.payload.airport.code,
                destinationIata: action.payload.airport.code,
                destLat: action.payload.airport.lat,
                destLng: action.payload.airport.lng
              };
            }
          }
          return item;
        })
      };

    // Extras
    case CART_ACTIONS.UPDATE_CATERING:
      return {
        ...state,
        cartItems: state.cartItems.map(item =>
          item.cartId === action.payload.cartId
            ? {
                ...item,
                catering: action.payload.cateringId,
                cateringPrice: action.payload.price
              }
            : item
        )
      };

    case CART_ACTIONS.UPDATE_QUANTITY:
      return {
        ...state,
        cartItems: state.cartItems.map(item => {
          if (item.cartId === action.payload.cartId) {
            const qty = action.payload.quantity;
            const unitPrice = item.unitPrice || item.price;
            return {
              ...item,
              quantity: qty,
              price: unitPrice * qty,
              basePrice: unitPrice * qty,
              totalWithFee: unitPrice * qty
            };
          }
          return item;
        })
      };

    case CART_ACTIONS.UPDATE_RENTAL_DAYS:
      return {
        ...state,
        cartItems: state.cartItems.map(item => {
          if (item.cartId === action.payload.cartId) {
            const days = action.payload.days;
            const dailyRate = item.daily_rate_eur || item.price;
            return {
              ...item,
              rentalDays: days,
              price: dailyRate * days
            };
          }
          return item;
        })
      };

    // Selection
    case CART_ACTIONS.SET_SELECTED_PAYMENT_ITEM:
      return { ...state, selectedPaymentItem: action.payload };

    case CART_ACTIONS.SET_SELECTED_PAYMENT_METHOD:
      return { ...state, selectedPaymentMethod: action.payload };

    // Batch
    case CART_ACTIONS.BATCH_UPDATE:
      return { ...state, ...action.payload };

    default:
      console.warn('Unknown cart action:', action.type);
      return state;
  }
}

// Action creators
export const cartActions = {
  setCartItems: (items) => ({ type: CART_ACTIONS.SET_CART_ITEMS, payload: items }),
  addItem: (item) => ({ type: CART_ACTIONS.ADD_ITEM, payload: item }),
  updateItem: (cartId, updates) => ({ type: CART_ACTIONS.UPDATE_ITEM, payload: { cartId, updates } }),
  removeItem: (cartId) => ({ type: CART_ACTIONS.REMOVE_ITEM, payload: cartId }),
  clearCart: () => ({ type: CART_ACTIONS.CLEAR_CART }),

  addStop: (cartId, stopAirport, stopDuration = 60) => ({
    type: CART_ACTIONS.ADD_STOP,
    payload: { cartId, stopAirport, stopDuration }
  }),
  removeStop: (cartId, stopIndex) => ({
    type: CART_ACTIONS.REMOVE_STOP,
    payload: { cartId, stopIndex }
  }),
  updateStopDuration: (cartId, stopIndex, duration) => ({
    type: CART_ACTIONS.UPDATE_STOP_DURATION,
    payload: { cartId, stopIndex, duration }
  }),
  updateEndpoint: (cartId, endpointType, airport) => ({
    type: CART_ACTIONS.UPDATE_ENDPOINT,
    payload: { cartId, endpointType, airport }
  }),

  updateCatering: (cartId, cateringId, price) => ({
    type: CART_ACTIONS.UPDATE_CATERING,
    payload: { cartId, cateringId, price }
  }),
  updateQuantity: (cartId, quantity) => ({
    type: CART_ACTIONS.UPDATE_QUANTITY,
    payload: { cartId, quantity }
  }),
  updateRentalDays: (cartId, days) => ({
    type: CART_ACTIONS.UPDATE_RENTAL_DAYS,
    payload: { cartId, days }
  }),

  setSelectedPaymentItem: (item) => ({ type: CART_ACTIONS.SET_SELECTED_PAYMENT_ITEM, payload: item }),
  setSelectedPaymentMethod: (method) => ({ type: CART_ACTIONS.SET_SELECTED_PAYMENT_METHOD, payload: method }),

  batchUpdate: (updates) => ({ type: CART_ACTIONS.BATCH_UPDATE, payload: updates })
};
