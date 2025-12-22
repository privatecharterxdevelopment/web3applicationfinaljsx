// Hooks barrel export

// ===== NEW HOOKS (Clean Architecture) =====
// Core chat management
export { useChatNew } from './useChatNew';
export { useMessageHandler } from './useMessageHandler';

// Cart & Booking
export { useCartNew } from './useCartNew';
export { useCartRenderer, ITEM_TYPES } from './useCartRenderer';
export { useBookingFlow } from './useBookingFlow';

// Tool Results & Services
export { useToolResults, LUXURY_SERVICES_CATALOG, CATEGORY_LABELS } from './useToolResults';

// Journey Building
export { useJourneyBuilder } from './useJourneyBuilder';

// UI & Features
export { useModals } from './useModals';
export { useSubscriptionNew } from './useSubscriptionNew';
export { useVoice } from './useVoice';
export { useFileUpload } from './useFileUpload';

// ===== OLD HOOKS (Legacy - to be deprecated) =====
export { useChatManager } from './useChatManager';
export { useCartManager } from './useCartManager';
export { useMessageSender } from './useMessageSender';
export { useSubscriptionLimits } from './useSubscriptionLimits';
export { useTravelPlanningFlow, TRAVEL_PLANNING_STEPS } from './useTravelPlanningFlow';
