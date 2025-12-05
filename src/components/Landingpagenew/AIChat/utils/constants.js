// Constants for AIChat
// Centralized configuration values

// Message limits
export const MAX_MESSAGES_PER_CHAT = 20;
export const MAX_CHATS_FREE = 5;
export const MAX_CHATS_STARTER = 5;
export const MAX_CHATS_PRO = 20;
export const MAX_CHATS_ELITE = Infinity;

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  EXPLORER: 'explorer',
  STARTER: 'starter',
  PRO: 'pro',
  ELITE: 'elite'
};

// Tier limits
export const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.EXPLORER]: {
    chats: 2,
    messagesPerChat: 10,
    breakThePrice: false,
    unlimitedMessages: false
  },
  [SUBSCRIPTION_TIERS.STARTER]: {
    chats: 5,
    messagesPerChat: 50,
    breakThePrice: false,
    unlimitedMessages: false
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    chats: 20,
    messagesPerChat: 100,
    breakThePrice: true,
    unlimitedMessages: false
  },
  [SUBSCRIPTION_TIERS.ELITE]: {
    chats: Infinity,
    messagesPerChat: Infinity,
    breakThePrice: true,
    unlimitedMessages: true
  }
};

// Service types
export const SERVICE_TYPES = {
  JETS: 'jets',
  JET: 'jet',
  HELICOPTERS: 'helicopters',
  HELICOPTER: 'helicopter',
  YACHTS: 'yachts',
  ADVENTURES: 'adventures',
  LUXURY_CARS: 'luxury_cars',
  EMPTY_LEGS: 'empty_legs',
  EMPTYLEG: 'emptyleg',
  CUSTOM_EXTRA: 'custom_extra'
};

// Cart item types that support multi-stop
export const MULTI_STOP_TYPES = [
  SERVICE_TYPES.JETS,
  SERVICE_TYPES.JET,
  SERVICE_TYPES.HELICOPTERS,
  SERVICE_TYPES.HELICOPTER
];

// Catering options
export const CATERING_OPTIONS = [
  { id: 'none', label: 'No catering', price: 0 },
  { id: 'complimentary', label: 'Complimentary refreshments', price: 0 },
  { id: 'light', label: 'Light snacks & drinks', price: 150 },
  { id: 'full', label: 'Full meal service', price: 450 },
  { id: 'premium', label: 'Premium dining experience', price: 850 }
];

// Extra categories
export const EXTRA_CATEGORIES = {
  WINE: 'wine',
  CHAMPAGNE: 'champagne',
  SPIRITS: 'spirits',
  CAVIAR: 'caviar',
  CIGARS: 'cigars',
  FLOWERS: 'flowers',
  CAKE: 'cake',
  DECORATIONS: 'decorations',
  MUSIC: 'music',
  PHOTOGRAPHY: 'photography',
  CATERING: 'catering',
  OTHER: 'other'
};

// Category emojis
export const CATEGORY_EMOJIS = {
  [EXTRA_CATEGORIES.WINE]: '🍷',
  [EXTRA_CATEGORIES.CHAMPAGNE]: '🥂',
  [EXTRA_CATEGORIES.SPIRITS]: '🥃',
  [EXTRA_CATEGORIES.CAVIAR]: '🐟',
  [EXTRA_CATEGORIES.CIGARS]: '🚬',
  [EXTRA_CATEGORIES.FLOWERS]: '💐',
  [EXTRA_CATEGORIES.CAKE]: '🎂',
  [EXTRA_CATEGORIES.DECORATIONS]: '🎊',
  [EXTRA_CATEGORIES.MUSIC]: '🎵',
  [EXTRA_CATEGORIES.PHOTOGRAPHY]: '📸',
  [EXTRA_CATEGORIES.CATERING]: '🍽️',
  [EXTRA_CATEGORIES.OTHER]: '✨'
};

// VAT rate (Switzerland)
export const VAT_RATE = 0.081;

// Default aircraft speed (km/h)
export const DEFAULT_AIRCRAFT_SPEED_KMH = 800;
export const DEFAULT_HELICOPTER_SPEED_KMH = 250;

// Minimum flight booking (hours)
export const MIN_FLIGHT_HOURS = 1;

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  CART: 'cart'
};

// Loading stages
export const LOADING_STAGES = {
  SEARCHING: 'searching',
  PROCESSING: 'processing',
  SAVING: 'saving'
};

// Action types for message actions
export const MESSAGE_ACTIONS = {
  CONFIRM_BOOKING: 'confirm_booking',
  SEND_CHARTER_REQUEST: 'send_charter_request',
  PAY_CRYPTO: 'pay_crypto',
  REQUEST_CHANGES: 'request_changes'
};

// Payment methods
export const PAYMENT_METHODS = {
  CRYPTO: 'crypto',
  CARD: 'card',
  WIRE: 'wire'
};

// Crypto currencies supported
export const SUPPORTED_CRYPTO = ['USDT', 'USDC', 'BTC', 'ETH', 'PVCX'];

// API endpoints (relative to Supabase)
export const EDGE_FUNCTIONS = {
  CLAUDE_CHAT: '/functions/v1/claude-chat',
  COINGATE: '/functions/v1/coingate-payment'
};

// Local storage keys
export const STORAGE_KEYS = {
  CART_ITEMS: 'sphera_cart_items',
  CHAT_DRAFT: 'sphera_chat_draft',
  LAST_CHAT_ID: 'sphera_last_chat_id'
};

// Debounce delays (ms)
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  AIRPORT_SEARCH: 500,
  AUTO_SAVE: 1000
};

// Animation durations (ms)
export const ANIMATION_DURATIONS = {
  TYPING: 30,
  FADE: 200,
  SLIDE: 300
};
