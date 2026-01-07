// Constants for AIChat
// Centralized configuration values

// Message limits
export const MAX_MESSAGES_PER_CHAT = 10;
export const MAX_CHATS_EXPLORER = 5;
export const MAX_CHATS_TRAVELLER = 10;
export const MAX_CHATS_ELITE = Infinity;

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  ESSENTIAL: 'essential',
  EXPLORER: 'explorer',
  TRAVELLER: 'traveller',
  ELITE: 'elite'
};

// Tier pricing (USD)
export const TIER_PRICING = {
  [SUBSCRIPTION_TIERS.ESSENTIAL]: 19,
  [SUBSCRIPTION_TIERS.EXPLORER]: 99,
  [SUBSCRIPTION_TIERS.TRAVELLER]: 199,
  [SUBSCRIPTION_TIERS.ELITE]: 999
};

// Tier limits
export const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.ESSENTIAL]: {
    chats: 10,
    messagesPerChat: 5,
    breakThePrice: false,
    unlimitedMessages: false,
    price: 19,
    support: 'email',
    aiModel: 'haiku',
    features: [
      'empty_legs',
      'restaurants',
      'jet_search'
    ]
  },
  [SUBSCRIPTION_TIERS.EXPLORER]: {
    chats: 5,
    messagesPerChat: 10,
    breakThePrice: false,
    unlimitedMessages: false,
    price: 99,
    support: 'email',
    features: [
      'empty_legs',
      'restaurants',
      'ground_transport',
      'delicacies',
      'cigars',
      'winery',
      'catering',
      'custom_travel_org'
    ]
  },
  [SUBSCRIPTION_TIERS.TRAVELLER]: {
    chats: 10,
    messagesPerChat: 25,
    breakThePrice: true,
    unlimitedMessages: false,
    price: 199,
    support: 'priority',
    features: [
      'empty_legs',
      'restaurants',
      'ground_transport',
      'delicacies',
      'cigars',
      'winery',
      'catering',
      'custom_travel_org',
      'medevac',
      'concierge',
      'group_charter',
      'reservations',
      'event_booking'
    ]
  },
  [SUBSCRIPTION_TIERS.ELITE]: {
    chats: Infinity,
    messagesPerChat: Infinity,
    breakThePrice: true,
    unlimitedMessages: true,
    price: 999,
    support: '24/7_phone',
    freeAirportTransfers: 2,
    membershipXCard: true,
    vipEventInvites: true,
    features: [
      'empty_legs',
      'restaurants',
      'ground_transport',
      'delicacies',
      'cigars',
      'winery',
      'vip_catering',
      'custom_travel_org',
      'medevac',
      'concierge',
      'group_charter',
      'reservations',
      'event_booking',
      'airport_transfers',
      'membershipx_card',
      'vip_events'
    ]
  }
};

// Feature definitions for display
export const FEATURE_DEFINITIONS = {
  empty_legs: { name: 'Empty Legs', icon: 'Plane' },
  restaurants: { name: 'Restaurant Reservations', icon: 'UtensilsCrossed' },
  ground_transport: { name: 'Ground Transport', icon: 'Car' },
  delicacies: { name: 'Delicacies', icon: 'Cookie' },
  cigars: { name: 'Premium Cigars', icon: 'Cigarette' },
  winery: { name: 'Winery Access', icon: 'Wine' },
  catering: { name: 'Catering', icon: 'ChefHat' },
  vip_catering: { name: 'VIP Catering', icon: 'ChefHat' },
  custom_travel_org: { name: 'Custom Travel Organization', icon: 'Map' },
  medevac: { name: 'MEDEVAC Services', icon: 'HeartPulse' },
  concierge: { name: 'Concierge Services', icon: 'Concierge' },
  group_charter: { name: 'Group Charter Requests', icon: 'Users' },
  reservations: { name: 'Reservations', icon: 'CalendarCheck' },
  event_booking: { name: 'Event Booking', icon: 'Calendar' },
  airport_transfers: { name: 'Free Airport Transfers', icon: 'Car' },
  membershipx_card: { name: 'MembershipX Card', icon: 'CreditCard' },
  vip_events: { name: 'VIP Event Invites', icon: 'Star' }
};

// Check if feature is available for tier
export const hasFeatureAccess = (tier, feature) => {
  const tierConfig = TIER_LIMITS[tier];
  if (!tierConfig) return false;
  return tierConfig.features?.includes(feature) || false;
};

// Service keyword to feature mapping for subscription checks
// Maps user query patterns to required feature codes
export const SERVICE_FEATURE_MAP = {
  // Services requiring Traveller or Elite (not in Explorer)
  medevac: {
    patterns: ['medevac', 'medical evacuation', 'medical flight', 'air ambulance', 'emergency medical'],
    feature: 'medevac',
    requiredTier: 'traveller',
    displayName: 'MEDEVAC Services'
  },
  concierge: {
    patterns: ['concierge', 'personal assistant', 'lifestyle manager', 'vip assistance'],
    feature: 'concierge',
    requiredTier: 'traveller',
    displayName: 'Concierge Services'
  },
  group_charter: {
    patterns: ['group charter', 'group booking', 'large group', 'team charter', 'corporate charter'],
    feature: 'group_charter',
    requiredTier: 'traveller',
    displayName: 'Group Charter'
  },
  event_booking: {
    patterns: ['event booking', 'book event', 'event reservation', 'private event'],
    feature: 'event_booking',
    requiredTier: 'traveller',
    displayName: 'Event Booking'
  },
  break_the_price: {
    patterns: ['break the price', 'negotiate price', 'price negotiation', 'get better price', 'lower price'],
    feature: 'break_the_price',
    requiredTier: 'traveller',
    displayName: 'Break the Price'
  },
  // Services requiring Elite only
  vip_events: {
    patterns: ['vip event', 'exclusive event', 'vip invitation', 'elite event'],
    feature: 'vip_events',
    requiredTier: 'elite',
    displayName: 'VIP Event Invites'
  },
  membershipx_card: {
    patterns: ['membershipx', 'membership card', 'elite card', 'vip card'],
    feature: 'membershipx_card',
    requiredTier: 'elite',
    displayName: 'MembershipX Card'
  },
  airport_transfers: {
    patterns: ['free transfer', 'complimentary transfer', 'free airport'],
    feature: 'airport_transfers',
    requiredTier: 'elite',
    displayName: 'Free Airport Transfers'
  }
};

// Check if a message requires a higher tier subscription
export const checkServiceAccess = (message, currentTier) => {
  if (!message) return { hasAccess: true };

  const lowerMessage = message.toLowerCase();

  for (const [serviceKey, serviceConfig] of Object.entries(SERVICE_FEATURE_MAP)) {
    // Check if any pattern matches
    const matchedPattern = serviceConfig.patterns.find(pattern =>
      lowerMessage.includes(pattern)
    );

    if (matchedPattern) {
      // Check if user has access based on tier
      const tierHierarchy = { essential: 1, explorer: 2, traveller: 3, elite: 4 };
      const userTierLevel = tierHierarchy[currentTier] || 0; // 0 = no subscription
      const requiredLevel = tierHierarchy[serviceConfig.requiredTier] || 3;

      if (userTierLevel < requiredLevel) {
        return {
          hasAccess: false,
          service: serviceKey,
          feature: serviceConfig.feature,
          displayName: serviceConfig.displayName,
          requiredTier: serviceConfig.requiredTier,
          currentTier: currentTier || 'none'
        };
      }
    }
  }

  return { hasAccess: true };
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
  CUSTOM_EXTRA: 'custom_extra',
  MEDEVAC: 'medevac',
  GROUND_TRANSPORT: 'ground_transport',
  CONCIERGE: 'concierge'
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

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize tier string (handles case variations and aliases)
 */
export const normalizeTier = (tier) => {
  if (!tier) return null;
  const lower = tier.toLowerCase().trim();
  // Handle 'starter' as alias for 'essential' (Stripe product name)
  if (lower === 'starter') return 'essential';
  return lower;
};

/**
 * Get tier limits (returns null if no valid tier)
 */
export const getTierLimits = (tier) => {
  const normalized = normalizeTier(tier);
  if (!normalized) return { chats: 0, messagesPerChat: 0, features: [], unlimitedMessages: false };
  return TIER_LIMITS[normalized] || { chats: 0, messagesPerChat: 0, features: [], unlimitedMessages: false };
};

/**
 * Check if tier has unlimited access
 */
export const hasUnlimitedAccess = (tier) => {
  const limits = getTierLimits(tier);
  return limits.unlimitedMessages === true;
};

/**
 * Get message limit for tier
 */
export const getMessageLimit = (tier) => {
  const limits = getTierLimits(tier);
  return limits.messagesPerChat;
};

/**
 * Get chat limit for tier
 */
export const getChatLimit = (tier) => {
  const limits = getTierLimits(tier);
  return limits.chats;
};

/**
 * Check if user can send message
 */
export const canSendMessage = (tier, currentMessageCount) => {
  if (hasUnlimitedAccess(tier)) return true;
  const limit = getMessageLimit(tier);
  return currentMessageCount < limit;
};

/**
 * Check if multiple tiers can access (used for quick suggestions)
 * @param {string} userTier - User's subscription tier
 * @param {string[]} allowedTiers - Array of allowed tiers
 */
export const checkTierAccess = (userTier, allowedTiers) => {
  if (!allowedTiers || allowedTiers.length === 0) return true;
  if (!userTier) return false;

  const normalized = normalizeTier(userTier);
  return allowedTiers.some(tier => normalized === normalizeTier(tier));
};
