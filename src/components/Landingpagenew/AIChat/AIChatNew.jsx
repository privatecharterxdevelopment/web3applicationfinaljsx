/**
 * AIChatNew - Clean Architecture Version
 *
 * This is the refactored AIChat component using modular hooks.
 * All business logic is in hooks, this file is UI orchestration only.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send, X, Shield,
  ShoppingCart, MessageSquare, Crown, AlertCircle,
  Plane, Clock, Users, MapPin, Car, Route,
  Loader2, Sparkles, Wine, Globe, Lock, Wallet
} from 'lucide-react';

// Services
import { chatService } from '../../../services/chatService';
import { useAuth } from '../../../context/AuthContext';
import { initializeExchangeRates } from '../../../services/currencyService';

// Components
import { supabase } from '../../../lib/supabase';
import CreateEventModal from '../../Calendar/CreateEventModal';
import ConsultationBookingModal from '../../modals/ConsultationBookingModal';
import RequestAdjustmentModal from '../../modals/RequestAdjustmentModal';
import WalletConnect from '../../WalletConnect';
import SubscriptionModal from '../../SubscriptionModal';
import CryptoPaymentModal from '../../Payment/CryptoPaymentModal';
import BulkOrderInterface from '../../BulkOrderInterface';
import PlaceCard from '../../PlaceCard';
import HotelCard from '../../HotelCard';
import SearchResults from '../../SearchResults';
import { JourneyBuilder, YachtJourneyBuilder, AirportTransferOffer } from './components/MultiStopJourney';

// Extracted Components
import { Toast, TypingAnimation, TypingText, ReportIssueModal } from './components';
import CartSidebar from './components/CartSidebar';
import MedevacRequestCard from './components/MedevacRequestCard';
import TripPackageCard from './components/TripPackageCard';

// Extras catalog for cart
const EXTRAS_CATALOG = [
  { id: 'champagne', name: 'Dom Pérignon Vintage', category: 'champagne', price: 450, emoji: '🍾' },
  { id: 'caviar', name: 'Beluga Caviar (50g)', category: 'delicatesse', price: 380, emoji: '🐟' },
  { id: 'flowers', name: 'Luxury Flower Arrangement', category: 'flowers', price: 250, emoji: '💐' },
  { id: 'cake', name: 'Custom Celebration Cake', category: 'cake', price: 180, emoji: '🎂' },
  { id: 'photographer', name: 'Private Photographer (2hrs)', category: 'photography', price: 600, emoji: '📸' },
  { id: 'musician', name: 'Live Musician', category: 'music', price: 800, emoji: '🎵' },
];

// ALL Hooks - Clean Architecture
import {
  useModals,
  useSubscriptionNew,
  useCartNew,
  useChatNew,
  useJourneyBuilder,
  useMessageHandler,
  useCartRenderer,
  useBookingFlow,
  useToolResults,
  useFileUpload
} from './hooks';

// Utils
import {
  checkServiceAccess,
  getTierLimits,
  hasUnlimitedAccess,
  checkTierAccess
} from './utils/constants';

// Web3
import { useAccount, useDisconnect } from 'wagmi';

// Quick suggestion bubbles - matching original design
const QUICK_SUGGESTIONS = [
  { id: 'jets', label: 'Private Jets', prompt: 'I need to book a private jet' },
  { id: 'custom_travel', label: 'Custom Travel', prompt: 'I want to plan a custom trip with multiple destinations and stops' },
  { id: 'sommelier', label: 'Sommelier', prompt: 'I would like wine recommendations' },
  { id: 'restaurants', label: 'Restaurants', prompt: 'Find me a luxury restaurant' },
  { id: 'transfer', label: 'Airport Transfer', prompt: 'I need an airport transfer' },
  { id: 'emptylegs', label: 'Empty Legs', prompt: 'I want to find empty leg flights' },
  { id: 'medevac', label: 'Medevac', prompt: 'I need medical evacuation services', requiresSubscription: ['elite', 'traveller', 'professional'] },
];

// ============================================
// MAIN COMPONENT
// ============================================
const AIChatNew = ({
  user: userProp,
  initialQuery = '',
  onQueryProcessed = () => {},
  initialAssistantMessage = '',
  onAssistantMessageProcessed = () => {},
  cartItems: cartItemsProp,
  setCartItems: setCartItemsProp,
  activeChat: activeChatProp,
  setActiveChat: setActiveChatProp,
  chatHistory: chatHistoryProp,
  setChatHistory: setChatHistoryProp,
  showChatOverview,
  setShowChatOverview
}) => {
  // Auth Context
  const authContext = useAuth();
  const user = userProp || authContext?.user || { name: 'Guest', id: null };
  const isAdmin = authContext?.isAdmin || false;

  // URL Routing
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();

  // Web3 Wallet
  const { address: walletAddress, isConnected: isWalletConnected } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();

  // NFT Signature state for wallet verification (must be before hooks that use it)
  const [nftSignatureData, setNftSignatureData] = useState(null);

  // ==================================
  // HOOKS - Clean Architecture
  // ==================================
  const modals = useModals();
  const subscription = useSubscriptionNew(user, isAdmin);
  const cart = useCartNew(cartItemsProp, setCartItemsProp, subscription.userHasNFT);
  const chat = useChatNew(user, isAdmin, chatHistoryProp, setChatHistoryProp, activeChatProp, setActiveChatProp);
  const journey = useJourneyBuilder();
  const toolResults = useToolResults();

  // Cart Renderer Hook
  const cartRenderer = useCartRenderer({
    cartItems: cart.cartItems,
    setCartItems: cart.setCartItems,
    expandedCartItems: cart.expandedCartItems,
    setExpandedCartItems: cart.setExpandedCartItems,
    removeFromCart: cart.removeFromCart,
    setShowCryptoPayment: modals.setShowCryptoPayment,
    setSelectedPaymentItem: modals.setSelectedPaymentItem,
    setShowCalendarModal: modals.setShowCalendarModal,
    setSelectedItemForCalendar: modals.setSelectedItemForCalendar,
    userHasNFT: subscription.userHasNFT,
    setToast: modals.setToast,
    setChatHistory: chat.setChatHistory,
    activeChat: chat.activeChat
  });

  // Booking Flow Hook
  const bookingFlow = useBookingFlow({
    user,
    cartItems: cart.cartItems,
    setCartItems: cart.setCartItems,
    setToast: modals.setToast,
    chatHistory: chat.chatHistory,
    setChatHistory: chat.setChatHistory,
    activeChat: chat.activeChat,
    userHasNFT: subscription.userHasNFT,
    isAdmin,
    userSubscriptionLimits: subscription.userSubscriptionLimits,
    nftSignatureData,
    setNftSignatureData
  });

  // File Upload Hook
  const fileUpload = useFileUpload({
    user,
    setToast: modals.setToast,
    setChatHistory: chat.setChatHistory,
    activeChat: chat.activeChat
  });

  // ==================================
  // LOCAL STATE
  // ==================================
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);

  // Report Issue
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [reportIssueForm, setReportIssueForm] = useState({ message: '', rating: 0 });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Cart extras state
  const [showInlineExtras, setShowInlineExtras] = useState(false);
  const [selectedExtraCategory, setSelectedExtraCategory] = useState(null);
  const [customExtraForm, setCustomExtraForm] = useState({ name: '', category: '', quantity: 1, notes: '' });

  // ==================================
  // MESSAGE HANDLER HOOK
  // ==================================
  const messageHandler = useMessageHandler({
    user,
    isAdmin,
    chatHistory: chat.chatHistory,
    setChatHistory: chat.setChatHistory,
    activeChat: chat.activeChat,
    setActiveChat: chat.setActiveChat,
    userProfile: subscription.userProfile,
    setToast: modals.setToast,
    setIsProcessing,
    setTypingMessageIndex,
    setShowSubscriptionBlocker: modals.setShowSubscriptionBlocker,
    setSubscriptionBlockerReason: modals.setSubscriptionBlockerReason,
    setChatLimitReached: chat.setChatLimitReached,
    setMessageCount: chat.setMessageCount,
    setMessageLimitReached: chat.setMessageLimitReached,
    multiLegChatMode: journey.multiLegChatMode,
    setPendingLegData: journey.setPendingLegData,
    cartItems: cart.cartItems,
    setCartItems: cart.setCartItems,
    checkCanSendMessage: subscription.canSendMessage,
    lastBlockReason: subscription.lastBlockReason,
    createChat: chat.createChat,
    addMessage: chat.addMessage,
    replaceLoadingMessage: chat.replaceLoadingMessage,
    setShowWelcomeMessage: chat.setShowWelcomeMessage,
    messages: chat.messages
  });

  // ==================================
  // EFFECTS
  // ==================================
  useEffect(() => { initializeExchangeRates(); }, []);

  useEffect(() => {
    if (user?.id) subscription.loadUserProfile();
  }, [user?.id]);

  // Show subscription blocker when on "new" chat and chat limit reached
  useEffect(() => {
    if (isAdmin || !subscription.userProfile) return;

    // Only check when user is on the "new" chat screen
    if (chat.activeChat === 'new') {
      const hasSubscription = subscription.userProfile.subscription_tier && subscription.userProfile.subscription_status === 'active';
      const hasLimit = subscription.userProfile.chats_limit !== null && subscription.userProfile.chats_limit !== undefined;
      const limitReached = hasLimit && subscription.userProfile.chats_used >= subscription.userProfile.chats_limit;

      if (!hasSubscription) {
        console.log('🚫 Blocking new chat - no subscription');
        modals.setSubscriptionBlockerReason('no_subscription');
        modals.setShowSubscriptionBlocker(true);
      } else if (limitReached) {
        console.log('🚫 Blocking new chat - limit reached:', subscription.userProfile.chats_used, '/', subscription.userProfile.chats_limit);
        modals.setSubscriptionBlockerReason('chat_limit');
        modals.setShowSubscriptionBlocker(true);
      }
    }
  }, [chat.activeChat, subscription.userProfile, isAdmin]);

  useEffect(() => {
    if (urlChatId && urlChatId !== 'new' && user?.id) {
      const loadChatFromUrl = async () => {
        try {
          const result = await chatService.loadChat(urlChatId, user.id);
          if (result.success && result.chat) {
            chat.setChatHistory(prev => {
              const exists = prev.find(c => c.id === urlChatId);
              if (exists) return prev;
              return [...prev, { ...result.chat, date: new Date(result.chat.updated_at).toLocaleDateString() }];
            });
            chat.setActiveChat(urlChatId);
          } else {
            chat.setActiveChat('new');
          }
        } catch (err) {
          chat.setActiveChat('new');
        }
      };
      loadChatFromUrl();
    }
  }, [urlChatId, user?.id]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim() && user?.id) {
      if (chat.isQueryProcessed(initialQuery)) return;
      chat.markQueryProcessed(initialQuery);
      messageHandler.handleSendMessage(initialQuery);
    }
  }, [initialQuery, user?.id]);

  // ==================================
  // HELPERS
  // ==================================
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const getMessageLimit = useCallback(() => {
    const tier = subscription.userProfile?.subscription_tier;
    if (!tier) return { limit: 0, unlimited: false };
    if (tier === 'elite') return { limit: Infinity, unlimited: true };
    const tierConfig = getTierLimits(tier);
    return { limit: tierConfig.messagesPerChat || 10, unlimited: tier === 'elite' };
  }, [subscription.userProfile]);

  // ==================================
  // EVENT HANDLERS
  // ==================================
  const handleAddToCart = useCallback((item) => {
    const cartId = cart.addToCart(item);
    if (cartId) modals.setToast({ message: `Added ${item.name || 'item'} to cart`, type: 'cart' });
  }, [cart, modals]);

  const handleRemoveFromCart = useCallback((cartId) => {
    cart.removeFromCart(cartId);
    modals.setToast({ message: 'Item removed', type: 'info' });
  }, [cart, modals]);

  const handleSuggestionClick = useCallback((suggestion) => {
    // Check subscription requirement using centralized helper
    const userTier = subscription.userProfile?.subscription_tier || null;
    const hasRequired = userTier ? checkTierAccess(userTier, suggestion.requiresSubscription) : false;

    if (suggestion.requiresSubscription && !hasRequired && !isAdmin) {
      modals.setToast({
        message: `${suggestion.label} requires Elite, Traveller, or Professional subscription. Upgrade to access.`,
        type: 'warning'
      });
      return;
    }

    chat.setActiveChat('new');
    messageHandler.handleSendMessage(suggestion.prompt);
  }, [subscription.userProfile, modals, chat, messageHandler, isAdmin]);

  const handleBuildJourney = useCallback((jet) => {
    journey.openJetJourneyBuilder(jet);
  }, [journey]);

  // ==================================
  // RENDER RESULT CARD
  // ==================================
  const renderResultCard = useCallback((item, index, type) => {
    const badge = cartRenderer.getItemBadge({ ...item, type });
    const isJet = type === 'jets';
    const priceDisplay = cartRenderer.getItemPriceDisplay(item);

    return (
      <div key={index} className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all">
        {item.image_url && (
          <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${badge.color}`}>
              {badge.text}
            </span>
            <h4 className="font-semibold text-gray-900 mt-1">{item.name || item.model || item.aircraft_type}</h4>
          </div>
        </div>
        {(item.from_city || item.from) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <MapPin size={14} className="text-gray-400" />
            <span>{item.from_city || item.from} → {item.to_city || item.to}</span>
          </div>
        )}
        {item.max_passengers && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Users size={14} className="text-gray-400" />
            <span>Up to {item.max_passengers} passengers</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className={`text-lg font-bold ${priceDisplay.isEstimate ? 'text-gray-500 italic' : 'text-gray-900'}`}>
            {priceDisplay.text}
          </p>
          <div className="flex gap-2">
            {isJet && (
              <button onClick={() => handleBuildJourney(item)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200">
                Build Route
              </button>
            )}
            <button onClick={() => handleAddToCart(item)} className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }, [handleAddToCart, handleBuildJourney, cartRenderer]);

  // ==================================
  // RENDER MESSAGE
  // ==================================
  const renderMessage = useCallback((msg, index) => {
    if (msg.isLoading) {
      return (
        <div key={index} className="flex justify-start">
          <div className="flex flex-col gap-2 ml-0 sm:ml-12" style={{ maxWidth: '85%' }}>
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 font-medium">Sphera AI</span>
            </div>
            <div className="px-5 py-4 bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
              <TypingAnimation />
            </div>
          </div>
        </div>
      );
    }

    if (msg.role === 'user') {
      return (
        <div key={index} className="flex justify-end">
          <div className="max-w-[80%] bg-black text-white rounded-2xl px-5 py-3">
            <p className="text-sm leading-relaxed">{msg.content}</p>
          </div>
        </div>
      );
    }

    if (msg.tabs) {
      return (
        <div key={index} className="w-full my-4">
          <SearchResults
            tabs={msg.tabs}
            onAddToCart={handleAddToCart}
            onBookNow={handleAddToCart}
            onBuildJourney={handleBuildJourney}
            onBuildYachtJourney={(yacht) => {
              // Handle yacht journey building
              journey.setSelectedYacht(yacht);
              journey.setShowYachtBuilder(true);
            }}
          />
        </div>
      );
    }

    if (msg.place) {
      return (
        <div key={index} className="flex justify-start">
          <div className="max-w-[80%] ml-0 sm:ml-12">
            <PlaceCard
              place={msg.place}
              onRequestTransfer={msg.canArrangeTransfer ? (place) => {
                // Request transfer to this place
                const transferRequest = `I'd like to arrange a luxury car transfer to ${place.name} at ${place.fullAddress}`;
                messageHandler.handleSendMessage(transferRequest);
              } : null}
              onRequestReservation={(place) => {
                // Add free reservation request to cart
                const reservationItem = {
                  id: `reservation-${Date.now()}`,
                  cartId: `reservation-${Date.now()}`,
                  type: 'concierge_request',
                  serviceType: 'restaurant_reservation',
                  name: `Reservation at ${place.name}`,
                  description: `Restaurant reservation request for ${place.name}`,
                  venue: place.name,
                  address: place.fullAddress,
                  phone: place.phone,
                  category: place.category || 'Restaurant',
                  rating: place.rating,
                  price: 0, // Reservations are FREE
                  price_usd: 0,
                  isCustomRequest: true,
                  requestDetails: {
                    venueName: place.name,
                    venueAddress: place.fullAddress,
                    venuePhone: place.phone,
                    venueRating: place.rating,
                    googleMapsUrl: place.googleMapsUrl,
                    note: 'Our concierge team will contact the venue to arrange your reservation. Please specify your preferred date, time, and party size.'
                  }
                };
                handleAddToCart(reservationItem);
                modals.setToast({ message: `Free reservation request for ${place.name} added to cart`, type: 'success' });
              }}
              alternatives={msg.alternatives}
              showAlternatives={msg.alternatives?.length > 0}
            />
          </div>
        </div>
      );
    }

    if (msg.hotels) {
      return (
        <div key={index} className="flex justify-start">
          <div className="flex flex-col gap-2 ml-0 sm:ml-12" style={{ maxWidth: '90%' }}>
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 font-medium">Sphera AI</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 px-2">{msg.content}</p>
              {msg.hotels.slice(0, 3).map((hotel, i) => (
                <HotelCard key={i} hotel={hotel} onBook={() => handleAddToCart(hotel)} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // MEDEVAC Request Card
    if (msg.role === 'medevac_request' && msg.medevacRequest) {
      return (
        <div key={index} className="flex justify-start">
          <div className="flex flex-col gap-2 ml-0 sm:ml-12" style={{ maxWidth: '95%' }}>
            <div className="flex items-center gap-2 px-2">
              <div className={`w-2 h-2 rounded-full ${
                msg.medevacRequest.urgencyLevel === 'critical' ? 'bg-red-600 animate-pulse' : 'bg-amber-500'
              }`}></div>
              <span className="text-xs text-gray-600 font-medium">Sphera AI · Medical Coordination</span>
            </div>
            <MedevacRequestCard
              medevacRequest={msg.medevacRequest}
              urgencyInfo={msg.urgencyInfo}
              isInCart={cart.cartItems.some(item => item.id === msg.medevacRequest.id)}
              onAddToCart={(medevacReq) => {
                const cartItem = {
                  ...medevacReq,
                  cartId: `medevac-${Date.now()}`,
                  type: 'medevac',
                  name: `MEDEVAC: ${medevacReq.route?.origin} → ${medevacReq.route?.destination}`,
                  title: `Medical Evacuation - ${medevacReq.patient?.condition || 'Patient Transport'}`,
                  price: 0, // Price on request
                  priceDisplay: 'Price on Request',
                  isPriority: medevacReq.urgencyLevel === 'critical' || medevacReq.urgencyLevel === 'urgent',
                  isUrgent: medevacReq.urgencyLevel === 'critical',
                  requiresConfirmation: true
                };
                cart.setCartItems(prev => [...prev, cartItem]);
                modals.setToast({ message: '🚨 MEDEVAC request added to cart - Our team will contact you immediately', type: 'success' });
              }}
            />
          </div>
        </div>
      );
    }

    // Custom Trip Package Card
    if (msg.role === 'trip_package' && msg.tripPackage) {
      return (
        <div key={index} className="flex justify-start">
          <div className="flex flex-col gap-2 ml-0 sm:ml-12" style={{ maxWidth: '450px' }}>
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 font-medium">Sphera AI · Travel Planning</span>
            </div>
            <TripPackageCard
              tripPackage={msg.tripPackage}
              isInCart={cart.cartItems.some(item => item.id === msg.tripPackage.id)}
              onAddToCart={(tripPkg) => {
                const cartItem = {
                  ...tripPkg,
                  cartId: `trip-${Date.now()}`,
                  type: 'trip_package',
                  price: tripPkg.estimatedTotal || 0,
                  basePrice: tripPkg.estimatedTotal || 0,
                  totalWithFee: tripPkg.estimatedTotal || 0,
                  isEstimate: true,
                  requiresConfirmation: true,
                  priceDisplay: tripPkg.estimatedTotal ? `€${tripPkg.estimatedTotal.toLocaleString()}` : 'Price on Request'
                };
                cart.setCartItems(prev => [...prev, cartItem]);
                modals.setToast({ message: '✈️ Trip package added to cart!', type: 'success' });
              }}
              onEditSegment={(tripPkg) => {
                // Send message to adjust the trip
                const editMessage = `I'd like to adjust my ${tripPkg.name} trip package. Can you help me modify the segments?`;
                messageHandler.sendMessage(editMessage);
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div key={index} className="flex justify-start">
        <div className="flex flex-col gap-2 ml-0 sm:ml-12" style={{ maxWidth: '85%' }}>
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600 font-medium">Sphera AI</span>
          </div>
          <div className="px-5 py-4 bg-white/90 text-gray-800 border border-gray-100 rounded-2xl shadow-sm">
            <TypingText text={msg.content} speed={typingMessageIndex === index ? 15 : 0} onComplete={() => setTypingMessageIndex(null)} />
            {msg.action === 'confirm_booking' && msg.bookingData && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleAddToCart(msg.bookingData)} className="flex-1 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800">
                  Add to Cart
                </button>
                <button onClick={() => modals.setShowConsultationModal(true)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded-lg hover:bg-gray-200">
                  Request Quote
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [typingMessageIndex, handleAddToCart, renderResultCard, modals, handleBuildJourney, journey, messageHandler]);

  // ==================================
  // NEW CHAT VIEW (Welcome)
  // ==================================
  if (chat.activeChat === 'new' || chat.activeChat === null) {
    const msgLimits = getMessageLimit();
    const newChatDisplayTier = subscription.userProfile?.subscription_tier?.toLowerCase() || null;

    return (
      <div className="h-full bg-transparent flex flex-col overflow-hidden">
        {/* Toast */}
        {modals.toast && <Toast message={modals.toast.message} type={modals.toast.type} onClose={() => modals.setToast(null)} />}

        {/* Header with subscription badge */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200/50" style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowChatOverview?.(true)} className="p-2 hover:bg-gray-100/60 rounded-lg transition-colors">
              <MessageSquare size={20} className="text-gray-600" />
            </button>
            <div className="flex flex-col">
              <h1 className="font-semibold text-gray-900 text-sm">New Chat</h1>
              {subscription.userProfile?.chats_limit === null ? (
                <span className="text-xs text-gray-500">Unlimited chats</span>
              ) : subscription.userProfile?.chats_limit ? (
                <span className={`text-xs ${subscription.chatLimitReached ? 'text-red-500' : 'text-gray-500'}`}>
                  {subscription.userProfile.chats_used || 0}/{subscription.userProfile.chats_limit} chats
                </span>
              ) : (
                <span className="text-xs text-gray-500">0/{msgLimits.limit} messages</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Cart - Only button shown in header */}
            <button
              onClick={() => modals.setShowCartSidebar(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100/80 hover:bg-gray-200/90 text-gray-600 transition-all duration-200 border border-gray-200/50 hover:border-gray-300/60"
              style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              title="View Cart"
            >
              <ShoppingCart size={12} className="text-gray-500" />
              <span className="text-xs font-light tracking-wide" style={{ fontFamily: 'Satoshi, sans-serif' }}>Cart</span>
              {cart.cartItems.length > 0 && (
                <span className="min-w-[18px] h-[18px] bg-gray-800 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                  {cart.cartItems.length}
                </span>
              )}
            </button>

            {/* Subscription Tier Badge */}
            <button
              onClick={() => modals.setShowSubscriptionModal(true)}
              className="px-2.5 py-1.5 bg-white/40 hover:bg-white/60 rounded-xl text-xs font-medium text-gray-700 transition-all duration-200 flex items-center gap-1.5 border border-gray-200/40 hover:border-gray-300/50"
              style={{ backdropFilter: 'blur(8px)' }}
              title="Click to manage subscription"
            >
              {newChatDisplayTier === 'elite' || newChatDisplayTier === 'professional' ? (
                <span className="flex items-center gap-1">
                  <Crown size={12} className="text-amber-600" />
                  <span className="text-gray-700">{newChatDisplayTier.charAt(0).toUpperCase() + newChatDisplayTier.slice(1)}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">∞</span>
                </span>
              ) : newChatDisplayTier === 'traveller' ? (
                <span className="flex items-center gap-1">
                  <span className="text-gray-600">Traveller</span>
                  <span className="text-gray-300">•</span>
                  <span className={`${subscription.chatLimitReached ? 'text-red-500' : 'text-gray-500'}`}>
                    {subscription.userProfile?.chats_used || 0}/{subscription.userProfile?.chats_limit || 10}
                  </span>
                </span>
              ) : newChatDisplayTier === 'explorer' ? (
                <span className="flex items-center gap-1">
                  <span className="text-gray-600">Explorer</span>
                  <span className="text-gray-300">•</span>
                  <span className={`${subscription.chatLimitReached ? 'text-red-500' : 'text-gray-500'}`}>
                    {subscription.userProfile?.chats_used || 0}/{subscription.userProfile?.chats_limit || 5}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="text-gray-500">No Plan</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Messages area with welcome */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col justify-end">
          <div className="max-w-3xl mx-auto w-full space-y-4">
            {/* Sphera Welcome Message */}
            <div className="flex justify-start animate-fade-in">
              <div className="flex flex-col gap-2 ml-0 sm:ml-12" style={{ maxWidth: '85%' }}>
                <div className="flex items-center gap-2 px-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600 font-medium">Sphera AI</span>
                </div>
                <div className="px-5 py-4 bg-white/90 text-gray-800 border border-gray-100 rounded-2xl shadow-sm">
                  <p className="text-sm leading-relaxed">
                    {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! I'm Sphera, your luxury travel and Web3 concierge.
                  </p>
                  <p className="text-sm leading-relaxed mt-2 text-gray-600">
                    I can help you book private jets, find restaurants, arrange transfers, explore tokenization, and much more. What would you like to do today?
                  </p>
                </div>

                {/* Chat Limit Banner - Glassmorphic style */}
                {subscription.chatLimitReached && !isAdmin && subscription.userProfile?.chats_limit && (
                  <div
                    className="mt-3 px-4 py-3 rounded-2xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      You've used all <span className="font-medium text-gray-800">{subscription.userProfile.chats_limit} chats</span> this month.
                      Continue your existing conversations or upgrade for more.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => navigate('/dashboard/chat-history')}
                        className="flex-1 py-2 px-3 text-[13px] font-medium text-gray-600 rounded-xl transition-all"
                        style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                      >
                        Continue chats
                      </button>
                      <button
                        onClick={() => modals.setShowSubscriptionModal(true)}
                        className="flex-1 py-2 px-3 text-[13px] font-medium text-white rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)' }}
                      >
                        Upgrade
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Suggestion Bubbles - Glassmorphic style */}
                <div className="flex flex-wrap gap-2 mt-2 px-2">
                  {QUICK_SUGGESTIONS.map((suggestion, index) => {
                    const userTier = subscription.userProfile?.subscription_tier || null;
                    // Use centralized helper for tier access check
                    const hasRequired = checkTierAccess(userTier, suggestion.requiresSubscription);
                    const isLocked = suggestion.requiresSubscription && !hasRequired && !isAdmin;

                    return (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="group"
                        style={{ animation: `fadeIn 0.3s ease-out ${0.1 + index * 0.05}s both` }}
                      >
                        <div className={`px-3 py-1.5 backdrop-blur-sm border rounded-full transition-all duration-200 hover:shadow-sm flex items-center gap-1.5 ${
                          isLocked
                            ? 'bg-gray-100/60 border-gray-200/40 cursor-not-allowed'
                            : 'bg-white/40 border-gray-200/60 hover:bg-white/70 hover:border-gray-300'
                        }`}>
                          <span className={`text-xs font-medium transition-colors ${
                            isLocked ? 'text-gray-400' : 'text-gray-500 group-hover:text-gray-700'
                          }`}>
                            {suggestion.label}
                          </span>
                          {isLocked && <Lock size={12} className="text-gray-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input at bottom */}
        <div className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentMessage.trim()) {
                    const msgToSend = currentMessage;
                    setCurrentMessage('');
                    messageHandler.handleSendMessage(msgToSend);
                  }
                }}
                placeholder="Ask about jets, cars, wines, restaurants..."
                className="flex-1 bg-transparent border-0 outline-none text-gray-800 placeholder-gray-400 text-sm"
                disabled={isProcessing || subscription.chatLimitReached}
              />
              <button
                onClick={() => {
                  if (currentMessage.trim()) {
                    const msgToSend = currentMessage;
                    setCurrentMessage('');
                    messageHandler.handleSendMessage(msgToSend);
                  }
                }}
                disabled={!currentMessage.trim() || isProcessing || subscription.chatLimitReached}
                className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        {modals.showSubscriptionModal && (
          <SubscriptionModal
            isOpen={modals.showSubscriptionModal}
            onClose={async () => {
              modals.setShowSubscriptionModal(false);
              // Refresh profile in case subscription was updated (webhook processed)
              if (user?.id) {
                await subscription.loadUserProfile();
              }
            }}
            currentTier={subscription.userProfile?.subscription_tier || subscription.userSubscriptionLimits?.tier}
            onToast={({ message, type }) => modals.setToast({ message, type })}
          />
        )}

        {/* Subscription Blocker Popup - Clean minimal design (for ALL subscription reasons including chat_limit) */}
        {modals.showSubscriptionBlocker && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/20 pointer-events-auto"
              onClick={() => modals.setShowSubscriptionBlocker(false)}
            />

            {/* Popup Card */}
            <div
              className="relative w-full max-w-md bg-white/95 rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden pointer-events-auto"
              style={{ backdropFilter: 'blur(20px)' }}
            >
              {/* Close Button */}
              <button
                onClick={() => modals.setShowSubscriptionBlocker(false)}
                className="absolute top-3 right-3 p-1.5 hover:bg-gray-100/60 rounded-lg transition-all z-10"
              >
                <X size={18} className="text-gray-400" />
              </button>

              {/* Header */}
              <div className="pt-6 pb-4 px-6 text-center">
                {/* Logo */}
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png"
                  alt="PrivateCharterX"
                  className="w-10 h-10 mx-auto mb-3 object-contain"
                />
                <h2 className="text-lg font-light text-gray-900 mb-1">
                  {modals.subscriptionBlockerReason === 'no_subscription' && 'Subscription Required'}
                  {modals.subscriptionBlockerReason === 'chat_limit' && 'Chat Limit Reached'}
                  {modals.subscriptionBlockerReason === 'message_limit' && 'Message Limit Reached'}
                  {modals.subscriptionBlockerReason === 'feature_restricted' && 'Upgrade Required'}
                  {!modals.subscriptionBlockerReason && 'Subscription Required'}
                </h2>
                <p className="text-xs font-light text-gray-400">
                  {modals.subscriptionBlockerReason === 'no_subscription' &&
                    'Subscribe to access Sphera AI and start planning your luxury travel experiences.'}
                  {modals.subscriptionBlockerReason === 'chat_limit' &&
                    `You've used all your chats for this month. Continue existing conversations or upgrade for more chats.`}
                  {modals.subscriptionBlockerReason === 'message_limit' &&
                    `You've reached your message limit for this chat. Continue on another chat or upgrade.`}
                  {modals.subscriptionBlockerReason === 'feature_restricted' &&
                    'This feature requires a higher subscription tier.'}
                  {!modals.subscriptionBlockerReason &&
                    'Subscribe to access Sphera AI and start planning your luxury travel experiences.'}
                </p>
              </div>

              {/* Plans - Horizontal row */}
              <div className="px-5 pb-4">
                <div className="flex gap-2">
                  {[
                    { id: 'essential', tier: 'Essential', price: 19, chats: '10 chats' },
                    { id: 'explorer', tier: 'Explorer', price: 99, chats: '5 chats' },
                    { id: 'traveller', tier: 'Traveller', price: 199, chats: '10 chats', popular: true },
                    { id: 'elite', tier: 'Elite', price: 999, chats: 'Unlimited' }
                  ].map((plan) => (
                    <button
                      key={plan.tier}
                      onClick={() => {
                        modals.setShowSubscriptionBlocker(false);
                        navigate('/dashboard/subscriptions/plans');
                      }}
                      className={`flex-1 p-3 rounded-xl border text-center transition-all hover:border-gray-300 ${
                        plan.popular
                          ? 'bg-gray-50/80 border-gray-300'
                          : 'bg-white/60 border-gray-200'
                      }`}
                    >
                      {plan.popular && (
                        <span className="text-[8px] font-medium text-gray-500 uppercase tracking-wider">Popular</span>
                      )}
                      <p className="text-[10px] font-light text-gray-500 uppercase tracking-wide">{plan.tier}</p>
                      <p className="text-xl font-extralight text-gray-900">${plan.price}</p>
                      <p className="text-[9px] font-light text-gray-400">{plan.chats}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-5 space-y-2">
                <button
                  onClick={() => {
                    modals.setShowSubscriptionBlocker(false);
                    navigate('/dashboard/subscriptions/plans');
                  }}
                  className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-light hover:bg-gray-800 transition-colors"
                >
                  Upgrade
                </button>
                <button
                  onClick={() => {
                    modals.setShowSubscriptionBlocker(false);
                    navigate('/dashboard/chat-history');
                  }}
                  className="w-full py-2.5 bg-white text-gray-700 rounded-xl text-sm font-light hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  Continue chats
                </button>
                <p className="text-[10px] font-light text-gray-400 text-center mt-3">
                  Cancel anytime • Instant access • 24/7 AI concierge
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cart Sidebar - Also rendered for New Chat View */}
        <CartSidebar
          isOpen={modals.showCartSidebar}
          onClose={() => modals.setShowCartSidebar(false)}
          cartItems={cart.cartItems}
          setCartItems={cart.setCartItems}
          cartTotal={cart.cartTotal}
          user={user}
          userHasNFT={subscription.userHasNFT}
          onToast={modals.setToast}
          onSendRequest={bookingFlow.submitCartRequest}
          onOpenCalendar={(item) => { modals.setSelectedItemForCalendar(item); modals.setShowCalendarModal(true); }}
          isProcessing={isProcessing}
          isProcessingPayment={bookingFlow.isSubmitting}
          setIsProcessingPayment={() => {}}
          showRequestForm={bookingFlow.showRequestForm}
          setShowRequestForm={bookingFlow.setShowRequestForm}
          showInlineExtras={showInlineExtras}
          setShowInlineExtras={setShowInlineExtras}
          selectedExtraCategory={selectedExtraCategory}
          setSelectedExtraCategory={setSelectedExtraCategory}
          customExtraForm={customExtraForm}
          setCustomExtraForm={setCustomExtraForm}
          extrasCatalog={EXTRAS_CATALOG}
          isWalletConnected={isWalletConnected}
          onOpenWalletConnect={() => modals.setShowWalletConnect(true)}
          onNFTSignatureComplete={setNftSignatureData}
        />

        {/* Wallet Connect Modal - Also for New Chat View */}
        {modals.showWalletConnect && (
          <WalletConnect
            onClose={() => modals.setShowWalletConnect(false)}
            onConnect={(wallet) => { bookingFlow.handleWalletConnect(wallet); modals.setShowWalletConnect(false); }}
          />
        )}
      </div>
    );
  }

  // ==================================
  // ACTIVE CHAT VIEW
  // ==================================
  const msgLimits = getMessageLimit();
  const displayTier = subscription.userProfile?.subscription_tier?.toLowerCase() || null;
  // Calculate actual message count from current chat (user messages only for limit tracking)
  const actualMessageCount = chat.messages?.filter(m => m.role === 'user').length || 0;

  return (
    <div className="h-full bg-transparent flex flex-col overflow-hidden">
      {/* Toast */}
      {modals.toast && <Toast message={modals.toast.message} type={modals.toast.type} onClose={() => modals.setToast(null)} />}

      {/* Header with message count */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200/50" style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowChatOverview?.(true)} className="p-2 hover:bg-gray-100/60 rounded-lg transition-colors">
            <MessageSquare size={20} className="text-gray-600" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-semibold text-gray-900 text-sm">{chat.currentChat?.title || 'New Chat'}</h1>
            {/* Message count display - only show for tiers with limits */}
            {!msgLimits.unlimited && (
              <span className="text-xs text-gray-500">
                <span className={actualMessageCount >= msgLimits.limit - 2 ? 'text-amber-500' : ''}>
                  {actualMessageCount}/{msgLimits.limit} messages
                </span>
              </span>
            )}
            {msgLimits.unlimited && (
              <span className="text-xs text-gray-500">Unlimited messages</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowReportIssueModal(true)} className="p-2 hover:bg-gray-100/60 rounded-lg transition-colors" title="Report Issue">
            <AlertCircle size={18} className="text-gray-400" />
          </button>

          {/* Cart - Only button shown in header */}
          <button
            onClick={() => modals.setShowCartSidebar(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100/80 hover:bg-gray-200/90 text-gray-600 transition-all duration-200 border border-gray-200/50 hover:border-gray-300/60"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            title="View Cart"
          >
            <ShoppingCart size={12} className="text-gray-500" />
            <span className="text-xs font-light tracking-wide" style={{ fontFamily: 'Satoshi, sans-serif' }}>Cart</span>
            {cart.cartItems.length > 0 && (
              <span className="min-w-[18px] h-[18px] bg-gray-800 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                {cart.cartItems.length}
              </span>
            )}
          </button>

          {/* Subscription Tier Badge */}
          <button
            onClick={() => modals.setShowSubscriptionModal(true)}
            className="px-2.5 py-1.5 bg-white/40 hover:bg-white/60 rounded-xl text-xs font-medium text-gray-700 transition-all duration-200 flex items-center gap-1.5 border border-gray-200/40 hover:border-gray-300/50"
            style={{ backdropFilter: 'blur(8px)' }}
            title="Click to manage subscription"
          >
            {displayTier === 'elite' || displayTier === 'professional' ? (
              <span className="flex items-center gap-1">
                <Crown size={12} className="text-amber-600" />
                <span className="text-gray-700">{displayTier.charAt(0).toUpperCase() + displayTier.slice(1)}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">∞</span>
              </span>
            ) : displayTier === 'traveller' ? (
              <span className="flex items-center gap-1">
                <span className="text-gray-600">Traveller</span>
                <span className="text-gray-300">•</span>
                <span className={`${actualMessageCount >= 20 ? 'text-red-500' : actualMessageCount >= 15 ? 'text-amber-500' : 'text-gray-500'}`}>
                  {actualMessageCount}/25
                </span>
              </span>
            ) : displayTier === 'explorer' ? (
              <span className="flex items-center gap-1">
                <span className="text-gray-600">Explorer</span>
                <span className="text-gray-300">•</span>
                <span className={`${actualMessageCount >= 8 ? 'text-red-500' : actualMessageCount >= 5 ? 'text-amber-500' : 'text-gray-500'}`}>
                  {actualMessageCount}/10
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="text-gray-500">No Plan</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto w-full space-y-4">
          {chat.messages.map((msg, index) => renderMessage(msg, index))}
          <div ref={chat.messagesEndRef} />
        </div>
      </div>

      {/* Message Limit Warning */}
      {chat.messageLimitReached && (
        <div className="px-4 sm:px-6 pb-2">
          <div className="max-w-3xl mx-auto">
            <div className="px-4 py-3 rounded-xl" style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)'
            }}>
              <p className="text-sm text-amber-800">
                Message limit reached for this chat.
                <button onClick={() => modals.setShowSubscriptionModal(true)} className="font-medium underline ml-1">
                  Upgrade for more
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && currentMessage.trim()) {
                  e.preventDefault();
                  const msgToSend = currentMessage;
                  setCurrentMessage('');
                  messageHandler.handleSendMessage(msgToSend);
                }
              }}
              placeholder="Ask about jets, helicopters, cars, wines..."
              className="flex-1 bg-transparent border-0 outline-none text-gray-800 placeholder-gray-400 text-sm"
              disabled={isProcessing || chat.messageLimitReached}
            />
            <button
              onClick={() => {
                if (currentMessage.trim()) {
                  const msgToSend = currentMessage;
                  setCurrentMessage('');
                  messageHandler.handleSendMessage(msgToSend);
                }
              }}
              disabled={!currentMessage.trim() || isProcessing || chat.messageLimitReached}
              className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={modals.showCartSidebar}
        onClose={() => modals.setShowCartSidebar(false)}
        cartItems={cart.cartItems}
        setCartItems={cart.setCartItems}
        cartTotal={cart.cartTotal}
        user={user}
        userHasNFT={subscription.userHasNFT}
        onToast={modals.setToast}
        onSendRequest={bookingFlow.submitCartRequest}
        onOpenCalendar={(item) => { modals.setSelectedItemForCalendar(item); modals.setShowCalendarModal(true); }}
        isProcessing={isProcessing}
        isProcessingPayment={bookingFlow.isSubmitting}
        setIsProcessingPayment={() => {}}
        showRequestForm={bookingFlow.showRequestForm}
        setShowRequestForm={bookingFlow.setShowRequestForm}
        showInlineExtras={showInlineExtras}
        setShowInlineExtras={setShowInlineExtras}
        selectedExtraCategory={selectedExtraCategory}
        setSelectedExtraCategory={setSelectedExtraCategory}
        customExtraForm={customExtraForm}
        setCustomExtraForm={setCustomExtraForm}
        extrasCatalog={EXTRAS_CATALOG}
        isWalletConnected={isWalletConnected}
        onOpenWalletConnect={() => modals.setShowWalletConnect(true)}
        onNFTSignatureComplete={setNftSignatureData}
      />

      {/* Request Form Modal */}
      {bookingFlow.showRequestForm && cart.cartItems.length > 0 && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] animate-fade-in" onClick={() => bookingFlow.setShowRequestForm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-scale-in flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Your Request</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{cart.cartItems.length} service{cart.cartItems.length > 1 ? 's' : ''} in your cart</p>
                </div>
                <button onClick={() => bookingFlow.setShowRequestForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Services List */}
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Services</p>
                  {cart.cartItems.map((item, idx) => {
                    const isEmptyLeg = item.type === 'empty_legs' || item.type === 'emptyleg';
                    const isJet = item.type === 'jets' || item.type === 'jet';
                    const isTransfer = item.type === 'taxi' || item.type === 'transfer' || item.type === 'ground_transport';
                    const isYacht = item.type === 'yachts' || item.type === 'yacht';
                    const itemPrice = item.totalWithFee || item.price || item.basePrice || item.estimatedPrice || 0;
                    const isQuoteItem = isTransfer || isJet || isYacht;

                    return (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                isEmptyLeg ? 'bg-emerald-100 text-emerald-700' :
                                isJet ? 'bg-gray-800 text-white' :
                                isTransfer ? 'bg-gray-400 text-white' :
                                isYacht ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {isEmptyLeg ? 'EMPTY LEG' : isJet ? 'CHARTER' : isTransfer ? 'TRANSFER' : isYacht ? 'YACHT' : 'SERVICE'}
                              </span>
                              {item.isMultiStop && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700">MULTI-STOP</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name || item.title || item.aircraft_model || 'Service'}
                            </p>
                            {item.route && typeof item.route === 'string' && (
                              <p className="text-xs text-gray-500 mt-0.5 font-mono">{item.route}</p>
                            )}
                            {item.route && typeof item.route === 'object' && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.route.origin} → {item.route.destination}</p>
                            )}
                            {item.departure_date && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.departure_date} {item.departure_time && `at ${item.departure_time}`}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {isQuoteItem && itemPrice === 0 ? (
                              <p className="text-xs font-medium text-gray-500 italic">On Request</p>
                            ) : (
                              <p className="text-sm font-semibold text-gray-900">
                                ${itemPrice.toLocaleString()}
                                {item.isEstimate && <span className="text-[9px] text-gray-400 block">estimate</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Estimated Total</span>
                  <span className="text-lg font-bold text-gray-900">${cart.cartTotal.toLocaleString()}</span>
                </div>

                {/* Info notice */}
                <p className="text-xs text-gray-500 text-center">
                  Our team will contact you within 2-4 hours to confirm availability and details.
                </p>
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50 space-y-3">
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  By submitting this request you agree to our{' '}
                  <a href="/terms" target="_blank" className="text-gray-600 underline hover:text-gray-800">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="text-gray-600 underline hover:text-gray-800">Privacy Policy</a>
                </p>
                <button
                  onClick={async () => {
                    const success = await bookingFlow.submitCartRequest();
                    if (success) {
                      bookingFlow.setShowRequestForm(false);
                      modals.setShowCartSidebar(false);
                      modals.setToast({ message: 'Request submitted successfully!', type: 'success' });
                    }
                  }}
                  disabled={bookingFlow.isSubmitting}
                  className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingFlow.isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {journey.showJourneyBuilder && journey.journeyBuilderJet && (
        <JourneyBuilder
          jet={journey.journeyBuilderJet}
          onClose={journey.closeJetJourneyBuilder}
          onAddToCart={(data) => { handleAddToCart(data); journey.closeJetJourneyBuilder(); }}
        />
      )}
      {journey.showYachtJourneyBuilder && journey.journeyBuilderYacht && (
        <YachtJourneyBuilder
          yacht={journey.journeyBuilderYacht}
          onClose={journey.closeYachtJourneyBuilder}
          onAddToCart={(data) => { handleAddToCart(data); journey.closeYachtJourneyBuilder(); }}
        />
      )}
      {journey.showTransferOffer && journey.lastAddedJourney && (
        <AirportTransferOffer
          journey={journey.lastAddedJourney}
          onAccept={(t) => { handleAddToCart(t); journey.dismissTransferOffer(); }}
          onDecline={journey.dismissTransferOffer}
        />
      )}
      {modals.showSubscriptionModal && (
        <SubscriptionModal
          isOpen={modals.showSubscriptionModal}
          onClose={async () => {
            modals.setShowSubscriptionModal(false);
            // Refresh profile in case subscription was updated (webhook processed)
            if (user?.id) {
              await subscription.loadUserProfile();
            }
          }}
          currentTier={subscription.userProfile?.subscription_tier || subscription.userSubscriptionLimits?.tier}
          onToast={({ message, type }) => modals.setToast({ message, type })}
        />
      )}
      {/* Subscription Blocker Popup - Clean minimal design (for ALL subscription reasons including chat_limit) */}
      {modals.showSubscriptionBlocker && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 pointer-events-auto"
            onClick={() => modals.setShowSubscriptionBlocker(false)}
          />

          {/* Popup Card */}
          <div
            className="relative w-full max-w-md bg-white/95 rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden pointer-events-auto"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            {/* Close Button */}
            <button
              onClick={() => modals.setShowSubscriptionBlocker(false)}
              className="absolute top-3 right-3 p-1.5 hover:bg-gray-100/60 rounded-lg transition-all z-10"
            >
              <X size={18} className="text-gray-400" />
            </button>

            {/* Header */}
            <div className="pt-6 pb-4 px-6 text-center">
              {/* Logo */}
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png"
                alt="PrivateCharterX"
                className="w-10 h-10 mx-auto mb-3 object-contain"
              />
              <h2 className="text-lg font-light text-gray-900 mb-1">
                {modals.subscriptionBlockerReason === 'no_subscription' && 'Subscription Required'}
                {modals.subscriptionBlockerReason === 'chat_limit' && 'Chat Limit Reached'}
                {modals.subscriptionBlockerReason === 'message_limit' && 'Message Limit Reached'}
                {modals.subscriptionBlockerReason === 'feature_restricted' && 'Upgrade Required'}
                {!modals.subscriptionBlockerReason && 'Subscription Required'}
              </h2>
              <p className="text-xs font-light text-gray-400">
                {modals.subscriptionBlockerReason === 'no_subscription' &&
                  'Subscribe to access Sphera AI and start planning your luxury travel experiences.'}
                {modals.subscriptionBlockerReason === 'chat_limit' &&
                  `You've used all your chats for this month. Continue existing conversations or upgrade for more chats.`}
                {modals.subscriptionBlockerReason === 'message_limit' &&
                  `You've reached your message limit for this chat. Continue on another chat or upgrade.`}
                {modals.subscriptionBlockerReason === 'feature_restricted' &&
                  'This feature requires a higher subscription tier.'}
                {!modals.subscriptionBlockerReason &&
                  'Subscribe to access Sphera AI and start planning your luxury travel experiences.'}
              </p>
            </div>

            {/* Plans - Horizontal row */}
            <div className="px-5 pb-4">
              <div className="flex gap-2">
                {[
                  { id: 'essential', tier: 'Essential', price: 19, chats: '10 chats' },
                  { id: 'explorer', tier: 'Explorer', price: 99, chats: '5 chats' },
                  { id: 'traveller', tier: 'Traveller', price: 199, chats: '10 chats', popular: true },
                  { id: 'elite', tier: 'Elite', price: 999, chats: 'Unlimited' }
                ].map((plan) => (
                  <button
                    key={plan.tier}
                    onClick={() => {
                      modals.setShowSubscriptionBlocker(false);
                      navigate('/dashboard/subscriptions/plans');
                    }}
                    className={`flex-1 p-3 rounded-xl border text-center transition-all hover:border-gray-300 ${
                      plan.popular
                        ? 'bg-gray-50/80 border-gray-300'
                        : 'bg-white/60 border-gray-200'
                    }`}
                  >
                    {plan.popular && (
                      <span className="text-[8px] font-medium text-gray-500 uppercase tracking-wider">Popular</span>
                    )}
                    <p className="text-[10px] font-light text-gray-500 uppercase tracking-wide">{plan.tier}</p>
                    <p className="text-xl font-extralight text-gray-900">${plan.price}</p>
                    <p className="text-[9px] font-light text-gray-400">{plan.chats}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-5 pb-5 space-y-2">
              <button
                onClick={() => {
                  modals.setShowSubscriptionBlocker(false);
                  navigate('/dashboard/subscriptions/plans');
                }}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-light hover:bg-gray-800 transition-colors"
              >
                Upgrade
              </button>
              <button
                onClick={() => {
                  modals.setShowSubscriptionBlocker(false);
                  navigate('/dashboard/chat-history');
                }}
                className="w-full py-2.5 bg-white text-gray-700 rounded-xl text-sm font-light hover:bg-gray-100 transition-colors border border-gray-200"
              >
                Continue chats
              </button>
              <p className="text-[10px] font-light text-gray-400 text-center mt-3">
                Cancel anytime • Instant access • 24/7 AI concierge
              </p>
            </div>
          </div>
        </div>
      )}
      {modals.showWalletConnect && (
        <WalletConnect
          onClose={() => modals.setShowWalletConnect(false)}
          onConnect={(wallet) => { bookingFlow.handleWalletConnect(wallet); modals.setShowWalletConnect(false); }}
        />
      )}
      {modals.showCalendarModal && modals.selectedItemForCalendar && (
        <CreateEventModal
          isOpen={modals.showCalendarModal}
          onClose={() => { modals.setShowCalendarModal(false); modals.setSelectedItemForCalendar(null); }}
          prefillData={modals.selectedItemForCalendar}
        />
      )}
      {modals.showConsultationModal && (
        <ConsultationBookingModal
          isOpen={modals.showConsultationModal}
          onClose={() => modals.setShowConsultationModal(false)}
          topic={modals.consultationTopic}
        />
      )}
      {modals.showCryptoPayment && modals.selectedPaymentItem && (
        <CryptoPaymentModal
          isOpen={modals.showCryptoPayment}
          onClose={() => { modals.setShowCryptoPayment(false); modals.setSelectedPaymentItem(null); }}
          item={modals.selectedPaymentItem}
          onSuccess={(paymentData) => { bookingFlow.handleCryptoPaymentSuccess(paymentData); modals.setShowCryptoPayment(false); }}
        />
      )}
      {modals.showBulkOrderInterface && (
        <BulkOrderInterface
          isOpen={modals.showBulkOrderInterface}
          onClose={() => modals.setShowBulkOrderInterface(false)}
          onAddToCart={(items) => {
            items.forEach(item => handleAddToCart(item));
            modals.setShowBulkOrderInterface(false);
          }}
          user={user}
          userHasNFT={subscription.userHasNFT}
        />
      )}
      {modals.showAdjustModal && modals.itemToAdjust && (
        <RequestAdjustmentModal
          isOpen={modals.showAdjustModal}
          onClose={() => { modals.setShowAdjustModal(false); modals.setItemToAdjust(null); }}
          item={modals.itemToAdjust}
          onSave={(adjustedItem) => {
            bookingFlow.handleSaveAdjustment(adjustedItem);
            modals.setShowAdjustModal(false);
            modals.setItemToAdjust(null);
          }}
        />
      )}
      {showReportIssueModal && (
        <ReportIssueModal
          show={showReportIssueModal}
          onClose={() => setShowReportIssueModal(false)}
          user={user}
          currentChat={chat.currentChat}
          reportIssueForm={reportIssueForm}
          setReportIssueForm={setReportIssueForm}
          isSubmittingReport={isSubmittingReport}
          setIsSubmittingReport={setIsSubmittingReport}
          setToast={modals.setToast}
        />
      )}
    </div>
  );
};

export default AIChatNew;
