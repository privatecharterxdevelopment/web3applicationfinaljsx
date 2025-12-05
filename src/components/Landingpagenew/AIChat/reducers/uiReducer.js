// UI State Reducer
// Manages: modals, sidebars, toasts, loading states

export const UI_ACTIONS = {
  // Modals
  SET_SHOW_CART_SIDEBAR: 'SET_SHOW_CART_SIDEBAR',
  SET_SHOW_REQUEST_FORM: 'SET_SHOW_REQUEST_FORM',
  SET_SHOW_PAYMENT_MODAL: 'SET_SHOW_PAYMENT_MODAL',
  SET_SHOW_CRYPTO_PAYMENT: 'SET_SHOW_CRYPTO_PAYMENT',
  SET_SHOW_SUBSCRIPTION_MODAL: 'SET_SHOW_SUBSCRIPTION_MODAL',
  SET_SHOW_WALLET_CONNECT: 'SET_SHOW_WALLET_CONNECT',
  SET_SHOW_BREAK_THE_PRICE: 'SET_SHOW_BREAK_THE_PRICE',
  SET_SHOW_MULTI_STOP_FORM: 'SET_SHOW_MULTI_STOP_FORM',
  SET_SHOW_HISTORY_SIDEBAR: 'SET_SHOW_HISTORY_SIDEBAR',
  SET_SHOW_COMPETITOR_REPORT: 'SET_SHOW_COMPETITOR_REPORT',

  // Multi-stop form
  SET_MULTI_STOP_ITEM_ID: 'SET_MULTI_STOP_ITEM_ID',
  SET_STOP_SEARCH_QUERY: 'SET_STOP_SEARCH_QUERY',
  SET_STOP_SEARCH_RESULTS: 'SET_STOP_SEARCH_RESULTS',
  SET_IS_SEARCHING_STOPS: 'SET_IS_SEARCHING_STOPS',
  SET_SELECTED_STOP_TYPE: 'SET_SELECTED_STOP_TYPE',

  // Toast
  SET_TOAST: 'SET_TOAST',
  CLEAR_TOAST: 'CLEAR_TOAST',

  // Loading
  SET_LOADING_STAGE: 'SET_LOADING_STAGE',
  SET_IS_SUBMITTING_REPORT: 'SET_IS_SUBMITTING_REPORT',

  // View state
  SET_CURRENT_MESSAGE: 'SET_CURRENT_MESSAGE',
  SET_EXPANDED_RESULT: 'SET_EXPANDED_RESULT',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_SELECTED_ITEM: 'SET_SELECTED_ITEM',

  // Batch update
  BATCH_UPDATE: 'BATCH_UPDATE',

  // Reset all modals
  CLOSE_ALL_MODALS: 'CLOSE_ALL_MODALS'
};

export const initialUIState = {
  // Modals
  showCartSidebar: false,
  showRequestForm: false,
  showPaymentModal: false,
  showCryptoPayment: false,
  showSubscriptionModal: false,
  showWalletConnect: false,
  showBreakThePrice: false,
  showMultiStopForm: false,
  showHistorySidebar: false,
  showCompetitorReport: false,

  // Multi-stop form state
  multiStopItemId: null,
  stopSearchQuery: '',
  stopSearchResults: [],
  isSearchingStops: false,
  selectedStopType: 'add', // 'add', 'origin', 'destination'

  // Toast
  toast: null,

  // Loading
  loadingStage: null,
  isSubmittingReport: false,

  // View state
  currentMessage: '',
  expandedResult: null,
  activeTab: null,
  selectedItem: null
};

export function uiReducer(state, action) {
  switch (action.type) {
    // Modals
    case UI_ACTIONS.SET_SHOW_CART_SIDEBAR:
      return { ...state, showCartSidebar: action.payload };

    case UI_ACTIONS.SET_SHOW_REQUEST_FORM:
      return { ...state, showRequestForm: action.payload };

    case UI_ACTIONS.SET_SHOW_PAYMENT_MODAL:
      return { ...state, showPaymentModal: action.payload };

    case UI_ACTIONS.SET_SHOW_CRYPTO_PAYMENT:
      return { ...state, showCryptoPayment: action.payload };

    case UI_ACTIONS.SET_SHOW_SUBSCRIPTION_MODAL:
      return { ...state, showSubscriptionModal: action.payload };

    case UI_ACTIONS.SET_SHOW_WALLET_CONNECT:
      return { ...state, showWalletConnect: action.payload };

    case UI_ACTIONS.SET_SHOW_BREAK_THE_PRICE:
      return { ...state, showBreakThePrice: action.payload };

    case UI_ACTIONS.SET_SHOW_MULTI_STOP_FORM:
      return { ...state, showMultiStopForm: action.payload };

    case UI_ACTIONS.SET_SHOW_HISTORY_SIDEBAR:
      return { ...state, showHistorySidebar: action.payload };

    case UI_ACTIONS.SET_SHOW_COMPETITOR_REPORT:
      return { ...state, showCompetitorReport: action.payload };

    // Multi-stop form
    case UI_ACTIONS.SET_MULTI_STOP_ITEM_ID:
      return { ...state, multiStopItemId: action.payload };

    case UI_ACTIONS.SET_STOP_SEARCH_QUERY:
      return { ...state, stopSearchQuery: action.payload };

    case UI_ACTIONS.SET_STOP_SEARCH_RESULTS:
      return { ...state, stopSearchResults: action.payload };

    case UI_ACTIONS.SET_IS_SEARCHING_STOPS:
      return { ...state, isSearchingStops: action.payload };

    case UI_ACTIONS.SET_SELECTED_STOP_TYPE:
      return { ...state, selectedStopType: action.payload };

    // Toast
    case UI_ACTIONS.SET_TOAST:
      return { ...state, toast: action.payload };

    case UI_ACTIONS.CLEAR_TOAST:
      return { ...state, toast: null };

    // Loading
    case UI_ACTIONS.SET_LOADING_STAGE:
      return { ...state, loadingStage: action.payload };

    case UI_ACTIONS.SET_IS_SUBMITTING_REPORT:
      return { ...state, isSubmittingReport: action.payload };

    // View state
    case UI_ACTIONS.SET_CURRENT_MESSAGE:
      return { ...state, currentMessage: action.payload };

    case UI_ACTIONS.SET_EXPANDED_RESULT:
      return { ...state, expandedResult: action.payload };

    case UI_ACTIONS.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };

    case UI_ACTIONS.SET_SELECTED_ITEM:
      return { ...state, selectedItem: action.payload };

    // Batch update
    case UI_ACTIONS.BATCH_UPDATE:
      return { ...state, ...action.payload };

    // Reset all modals
    case UI_ACTIONS.CLOSE_ALL_MODALS:
      return {
        ...state,
        showCartSidebar: false,
        showRequestForm: false,
        showPaymentModal: false,
        showCryptoPayment: false,
        showSubscriptionModal: false,
        showWalletConnect: false,
        showBreakThePrice: false,
        showMultiStopForm: false,
        showHistorySidebar: false,
        showCompetitorReport: false
      };

    default:
      console.warn('Unknown UI action:', action.type);
      return state;
  }
}

// Action creators
export const uiActions = {
  // Modals
  setShowCartSidebar: (value) => ({ type: UI_ACTIONS.SET_SHOW_CART_SIDEBAR, payload: value }),
  setShowRequestForm: (value) => ({ type: UI_ACTIONS.SET_SHOW_REQUEST_FORM, payload: value }),
  setShowPaymentModal: (value) => ({ type: UI_ACTIONS.SET_SHOW_PAYMENT_MODAL, payload: value }),
  setShowCryptoPayment: (value) => ({ type: UI_ACTIONS.SET_SHOW_CRYPTO_PAYMENT, payload: value }),
  setShowSubscriptionModal: (value) => ({ type: UI_ACTIONS.SET_SHOW_SUBSCRIPTION_MODAL, payload: value }),
  setShowWalletConnect: (value) => ({ type: UI_ACTIONS.SET_SHOW_WALLET_CONNECT, payload: value }),
  setShowBreakThePrice: (value) => ({ type: UI_ACTIONS.SET_SHOW_BREAK_THE_PRICE, payload: value }),
  setShowMultiStopForm: (value) => ({ type: UI_ACTIONS.SET_SHOW_MULTI_STOP_FORM, payload: value }),
  setShowHistorySidebar: (value) => ({ type: UI_ACTIONS.SET_SHOW_HISTORY_SIDEBAR, payload: value }),
  setShowCompetitorReport: (value) => ({ type: UI_ACTIONS.SET_SHOW_COMPETITOR_REPORT, payload: value }),

  // Multi-stop form
  setMultiStopItemId: (id) => ({ type: UI_ACTIONS.SET_MULTI_STOP_ITEM_ID, payload: id }),
  setStopSearchQuery: (query) => ({ type: UI_ACTIONS.SET_STOP_SEARCH_QUERY, payload: query }),
  setStopSearchResults: (results) => ({ type: UI_ACTIONS.SET_STOP_SEARCH_RESULTS, payload: results }),
  setIsSearchingStops: (value) => ({ type: UI_ACTIONS.SET_IS_SEARCHING_STOPS, payload: value }),
  setSelectedStopType: (type) => ({ type: UI_ACTIONS.SET_SELECTED_STOP_TYPE, payload: type }),

  // Toast
  setToast: (toast) => ({ type: UI_ACTIONS.SET_TOAST, payload: toast }),
  clearToast: () => ({ type: UI_ACTIONS.CLEAR_TOAST }),

  // Loading
  setLoadingStage: (stage) => ({ type: UI_ACTIONS.SET_LOADING_STAGE, payload: stage }),
  setIsSubmittingReport: (value) => ({ type: UI_ACTIONS.SET_IS_SUBMITTING_REPORT, payload: value }),

  // View state
  setCurrentMessage: (message) => ({ type: UI_ACTIONS.SET_CURRENT_MESSAGE, payload: message }),
  setExpandedResult: (result) => ({ type: UI_ACTIONS.SET_EXPANDED_RESULT, payload: result }),
  setActiveTab: (tab) => ({ type: UI_ACTIONS.SET_ACTIVE_TAB, payload: tab }),
  setSelectedItem: (item) => ({ type: UI_ACTIONS.SET_SELECTED_ITEM, payload: item }),

  // Batch
  batchUpdate: (updates) => ({ type: UI_ACTIONS.BATCH_UPDATE, payload: updates }),

  // Reset
  closeAllModals: () => ({ type: UI_ACTIONS.CLOSE_ALL_MODALS })
};
