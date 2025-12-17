import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Mic, Send, X, Volume2, VolumeX, Edit2, Shield, Wallet, ShoppingCart, MessageSquare, Plus, Crown, AlertCircle, Calendar, Trash2, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plane, Clock, Upload, FileText, DollarSign, Users, MapPin, Anchor, Mountain, Car, Minus, Route, Coins, Loader2
} from 'lucide-react';
import { calculateDistance, estimateDuration, estimateCost } from '../../../utils/distanceCalculator';
// Secure Claude API via Edge Function - API key stays server-side
import { claudeEdgeService } from '../../../services/claudeEdgeService';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Services
import { UnifiedSearchService, ImageUtils } from '../../../services/supabaseService';
import { HumeEVIClient } from '../../../lib/humeClient';
import ConversationStateManager from '../../../services/ConversationStateManager';
import SpheraWeb3Concierge from '../../../services/SpheraWeb3Concierge';
import { claudeService } from '../../../services/claudeService';
import { getSystemPrompt } from '../../../lib/aiKnowledgeBase';
import { chatService } from '../../../services/chatService';
import { subscriptionService } from '../../../services/subscriptionService';
import { useAuth } from '../../../context/AuthContext';
import { createRequest } from '../../../services/requests';
import { convertToUSD, initializeExchangeRates } from '../../../services/currencyService';
import {
  aiToolDefinitions,
  executeTool,
  searchEmptyLegs,
  searchPrivateJets,
  searchHelicopters,
  searchYachtsAndAdventures,
  searchLuxuryCars
} from '../../../services/aiTools';

// Components
import SearchResults from '../../SearchResults';
import { supabase } from '../../../lib/supabase';
import CreateEventModal from '../../Calendar/CreateEventModal';
import RequestAdjustmentModal from '../../modals/RequestAdjustmentModal';
import ConsultationBookingModal from '../../modals/ConsultationBookingModal';
import WalletConnect from '../../WalletConnect';
import LoadingMessage from '../../LoadingMessage';
import BulkOrderInterface from '../../BulkOrderInterface';
import SubscriptionModal from '../../SubscriptionModal';
import CryptoPaymentModal from '../../Payment/CryptoPaymentModal';
import PlaceCard from '../../PlaceCard';
import HotelCard from '../../HotelCard';
import AdventureCard from '../../AdventureCard';
import { JourneyBuilder, AirportTransferOffer } from './components/MultiStopJourney';
import CartJourneyDisplay from './components/CartJourneyDisplay';

// PDF Generator
import { generateRequestConfirmationPDF, downloadPDF, savePDFToStorage } from '../../../services/pdfGeneratorService';

// Web3
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { signAIChatRequest } from '../../../lib/web3';

// Weather Widget - Light gray design
const WeatherWidget = ({ location, weather }) => {
  if (!weather) return null;
  return (
    <div className="bg-gray-200 border border-gray-300 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600 font-medium mb-0.5">{location}</p>
          <p className="text-2xl font-semibold text-black">{weather.temp}°C</p>
        </div>
        <p className="text-sm text-gray-700">{weather.condition}</p>
      </div>
    </div>
  );
};

// Toast notification component - minimalistic monochromatic design
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    // Cart notifications disappear faster (2s), others stay longer (4s)
    const duration = type === 'cart' ? 2000 : 4000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, type]);

  // Minimalistic cart toast
  if (type === 'cart') {
    return (
      <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg shadow-lg">
          <ShoppingCart size={16} />
          <p className="text-sm">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
        type === 'warning'
          ? 'bg-gray-100 border-gray-300 text-gray-900'
          : type === 'error'
          ? 'bg-gray-100 border-gray-300 text-gray-900'
          : type === 'success'
          ? 'bg-gray-900 text-white border-gray-700'
          : 'bg-gray-50 border-gray-200 text-gray-900'
      }`}>
        <AlertCircle size={20} className={
          type === 'warning' ? 'text-gray-600' : type === 'error' ? 'text-gray-600' : 'text-gray-400'
        } />
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Typing Animation Component
const TypingAnimation = () => (
  <div className="flex gap-1 py-2">
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

// Typing Text Effect Component - Smooth word-by-word streaming like ChatGPT
const TypingText = ({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const requestRef = useRef();
  const startTimeRef = useRef();
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  // Keep onComplete ref updated without triggering re-animation
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset animation state when text changes
    setDisplayedText('');
    setIsComplete(false);
    startTimeRef.current = null;
    hasCompletedRef.current = false;

    // Split text into words for smoother typing
    const words = text.split(/(\s+)/); // Keep whitespace

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      // Calculate how many characters should be shown based on elapsed time
      const baseCharsToShow = Math.floor(elapsed / speed);

      // Build the displayed text
      let charsShown = 0;
      let result = '';

      for (let i = 0; i < words.length && charsShown < baseCharsToShow; i++) {
        const word = words[i];
        const remainingChars = baseCharsToShow - charsShown;

        if (remainingChars >= word.length) {
          result += word;
          charsShown += word.length;
        } else {
          result += word.slice(0, remainingChars);
          charsShown += remainingChars;
        }
      }

      setDisplayedText(result);

      if (result.length < text.length) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedText(text);
        setIsComplete(true);
        // Only call onComplete once
        if (!hasCompletedRef.current && onCompleteRef.current) {
          hasCompletedRef.current = true;
          setTimeout(() => onCompleteRef.current?.(), 100);
        }
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [text, speed]); // Removed onComplete from dependencies

  return (
    <p className="text-sm leading-relaxed whitespace-pre-line">
      {displayedText}
      {!isComplete && <span className="inline-block w-0.5 h-4 bg-gray-500 ml-0.5 animate-pulse" />}
    </p>
  );
};

// Main Component
const AIChat = ({
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
  setChatHistory: setChatHistoryProp
}) => {
  // Use auth context (returns null if not in AuthProvider)
  const authContext = useAuth();
  const user = userProp || authContext?.user || { name: 'Guest', id: null };
  const isAdmin = authContext?.isAdmin || false;

  // URL routing for direct chat links
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();

  console.log('👤 User info:', { userId: user?.id, isAdmin, hasAuthContext: !!authContext });
  console.log('📥 AIChat RENDER - initialQuery:', JSON.stringify(initialQuery), 'user.id:', user?.id);

  // Voice API keys (optional - voice will be skipped gracefully if missing)
  const HUME_API_KEY = (import.meta.env?.VITE_HUME_API_KEY) || '';
  const HUME_SECRET_KEY = (import.meta.env?.VITE_HUME_SECRET_KEY) || '';
  // NOTE: ANTHROPIC_API_KEY removed - now using secure Edge Function via claudeEdgeService

  // =======================
  // ALL STATE & REFS FIRST
  // =======================
  const humeEnabled = Boolean(HUME_API_KEY && HUME_SECRET_KEY);

  const [humeClient] = useState(() => new HumeEVIClient(
    HUME_API_KEY,
    HUME_SECRET_KEY
  ));
  const [conversationalAI] = useState(() => new SpheraWeb3Concierge());
  const [conversationState] = useState(() => new ConversationStateManager());

  // Use props if provided, otherwise use internal state
  const [internalChatHistory, setInternalChatHistory] = useState([]);
  const [internalActiveChat, setInternalActiveChat] = useState('new');

  // Determine which state to use (props take precedence)
  const chatHistory = chatHistoryProp !== undefined ? chatHistoryProp : internalChatHistory;
  const setChatHistory = setChatHistoryProp || setInternalChatHistory;
  const activeChat = activeChatProp !== undefined ? activeChatProp : internalActiveChat;
  const setActiveChat = setActiveChatProp || setInternalActiveChat;
  const [chatsLoaded, setChatsLoaded] = useState(true); // Start as true so new chats work immediately
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastInputMethod, setLastInputMethod] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStage, setLoadingStage] = useState('searching');
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [weather, setWeather] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  // Use props if provided, otherwise local state
  const [localCartItems, setLocalCartItems] = useState([]);
  const cartItems = cartItemsProp !== undefined ? cartItemsProp : localCartItems;
  const setCartItems = setCartItemsProp !== undefined ? setCartItemsProp : setLocalCartItems;
  const [userHasNFT, setUserHasNFT] = useState(false);
  const [usedNFTBenefitThisYear, setUsedNFTBenefitThisYear] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedItemForCalendar, setSelectedItemForCalendar] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [itemToAdjust, setItemToAdjust] = useState(null);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationTopic, setConsultationTopic] = useState('tokenization');
  const [showBulkOrderInterface, setShowBulkOrderInterface] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showChatSessions, setShowChatSessions] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [reportIssueForm, setReportIssueForm] = useState({ message: '', rating: 0 });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [toast, setToast] = useState(null);
  const [limitWarningShown, setLimitWarningShown] = useState(false);
  const [pendingSignature, setPendingSignature] = useState(null);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);
  const [selectedPaymentItem, setSelectedPaymentItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Multi-Stop Journey Builder
  const [showJourneyBuilder, setShowJourneyBuilder] = useState(false);
  const [journeyBuilderJet, setJourneyBuilderJet] = useState(null);
  const [showTransferOffer, setShowTransferOffer] = useState(false);
  const [lastAddedJourney, setLastAddedJourney] = useState(null);
  const [multiLegRouteInfo, setMultiLegRouteInfo] = useState(null);
  const [multiLegChatMode, setMultiLegChatMode] = useState(false);
  const [multiLegChatData, setMultiLegChatData] = useState({
    legs: [],
    currentLegIndex: 0,
    passengers: null,
    pets: false,
    luggage: null,
    specialRequests: ''
  });
  const [multiLegRoute, setMultiLegRoute] = useState([]); // Array of stops: [{city, code, date, time, stopDuration}]
  const [pendingLegData, setPendingLegData] = useState(null); // Leg awaiting "Add to Route" confirmation

  // Break the Price feature
  const [showBreakThePrice, setShowBreakThePrice] = useState(false);
  const [breakThePriceFile, setBreakThePriceFile] = useState(null);
  const [isUploadingQuote, setIsUploadingQuote] = useState(false);
  const [userSubscriptionLimits, setUserSubscriptionLimits] = useState(null);

  // Message limit tracking (20 messages per chat)
  const [messageCount, setMessageCount] = useState(0);
  const [messageLimitReached, setMessageLimitReached] = useState(false);
  const MAX_MESSAGES_PER_CHAT = 20;

  // Chat limit tracking (for free users)
  const [chatLimitReached, setChatLimitReached] = useState(false);

  // Voice Interaction State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  // Cart visibility
  const [showCartWidget, setShowCartWidget] = useState(false);

  // Add Extras - inline in cart sidebar instead of popup modal
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showInlineExtras, setShowInlineExtras] = useState(false); // Inline extras form in cart dropdown
  const [selectedExtraCategory, setSelectedExtraCategory] = useState(null);
  const [expandedCartItems, setExpandedCartItems] = useState({}); // Track which cart items are expanded
  const [customExtraForm, setCustomExtraForm] = useState({
    name: '',
    category: '',
    quantity: 1,
    notes: ''
  });

  // Web3 Wallet
  const { address: walletAddress, isConnected: isWalletConnected } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  // All refs
  // NOTE: anthropicRef removed - now using claudeEdgeService for secure API calls
  const humeClientRef = useRef(null);
  const audioContextRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);
  const hasGreetedRef = useRef(false);
  const isReturningUserRef = useRef(false);
  const messagesEndRef = useRef(null);

  // =======================
  // EFFECTS & CALLBACKS
  // =======================

  // NOTE: Claude API initialization removed - now using claudeEdgeService for secure server-side API calls

  // Initialize Hume AI Client for voice
  useEffect(() => {
    if (HUME_API_KEY && HUME_SECRET_KEY) {
      humeClientRef.current = new HumeEVIClient(HUME_API_KEY, HUME_SECRET_KEY);
      humeClientRef.current.connect().catch(err => {
        console.warn('Hume AI connection failed:', err);
      });
    }
  }, []);

  // URL-based chat loading: Load specific chat when navigating to /chat/:chatId
  useEffect(() => {
    if (urlChatId && urlChatId !== 'new' && user?.id) {
      console.log('🔗 Loading chat from URL:', urlChatId);
      // Load the specific chat from the database
      const loadChatFromUrl = async () => {
        try {
          const result = await chatService.loadChat(urlChatId, user.id);
          if (result.success && result.chat) {
            // Add to chat history if not already there
            setChatHistory(prev => {
              const exists = prev.find(c => c.id === urlChatId);
              if (exists) return prev;
              return [...prev, {
                ...result.chat,
                date: new Date(result.chat.updated_at).toLocaleDateString()
              }];
            });
            // Set as active chat
            setActiveChat(urlChatId);
            // Load messages
            if (result.chat.messages?.length > 0) {
              setMessages(result.chat.messages);
            }
            console.log('✅ Chat loaded from URL successfully');
          } else {
            console.log('⚠️ Chat not found, starting new chat');
            setActiveChat('new');
          }
        } catch (err) {
          console.error('Error loading chat from URL:', err);
          setActiveChat('new');
        }
      };
      loadChatFromUrl();
    }
  }, [urlChatId, user?.id]);

  // Initialize Speech Recognition for Voice Mode
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        if (event.results[event.results.length - 1].isFinal) {
          console.log('🎤 Voice input:', transcript);
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Auto-restart if no speech detected
          setTimeout(() => {
            if (isVoiceMode) {
              recognitionRef.current?.start();
            }
          }, 1000);
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if voice mode is still active
        if (isVoiceMode) {
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 500);
        }
      };
    }
  }, []);

  // DO NOT auto-create welcome chat - let user choose service bubble
  // This prevents the endless loading issue

  // Toggle Voice Mode
  const toggleVoiceMode = useCallback(() => {
    if (!recognitionRef.current) {
      setToast({ message: 'Voice recognition not supported in this browser', type: 'error' });
      return;
    }

    setIsVoiceMode(prev => {
      const newMode = !prev;

      if (newMode) {
        // Start voice mode
        try {
          recognitionRef.current.start();
          setIsListening(true);
          setToast({ message: 'Voice mode activated - speak naturally', type: 'info' });
        } catch (err) {
          console.error('Failed to start speech recognition:', err);
        }
      } else {
        // Stop voice mode
        try {
          recognitionRef.current.stop();
          setIsListening(false);
          setToast({ message: 'Voice mode deactivated', type: 'info' });
        } catch (err) {
          console.error('Failed to stop speech recognition:', err);
        }
      }

      return newMode;
    });
  }, []);

  // Text-to-Speech for AI responses
  const speakResponse = useCallback((text) => {
    if (isVoiceMuted || !isVoiceMode) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    window.speechSynthesis.speak(utterance);
  }, [isVoiceMuted, isVoiceMode]);

  // Toggle Voice Mute
  const toggleVoiceMute = useCallback(() => {
    setIsVoiceMuted(prev => {
      const newMuted = !prev;
      if (newMuted) {
        window.speechSynthesis.cancel();
      }
      return newMuted;
    });
  }, []);

  const currentChat = useMemo(() => {
    const chat = chatHistory.find(c => c.id === activeChat);
    console.log('🔍 Current chat lookup:', {
      activeChat,
      foundChat: chat ? { id: chat.id, title: chat.title, messageCount: chat.messages?.length } : null,
      totalChats: chatHistory.length
    });
    return chat;
  }, [chatHistory, activeChat]);

  // Define audio playback helper BEFORE any effects that reference it
  const playHumeVoice = useCallback((audioBase64) => {
    if (!voiceEnabled) return;
    if (currentAudioRef.current) currentAudioRef.current.pause();
    setIsSpeaking(true);
    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
    currentAudioRef.current = audio;
    audio.onended = () => { setIsSpeaking(false); currentAudioRef.current = null; };
    audio.onerror = () => { setIsSpeaking(false); currentAudioRef.current = null; };
    audio.play().catch(() => { setIsSpeaking(false); });
  }, [voiceEnabled]);

  // Use Hume emotion context (when available) to gently adapt tone
  const withEmpathy = useCallback((text) => {
    try {
      if (!humeEnabled || typeof humeClient?.getEmpatheticPrefix !== 'function') return text;
      const prefix = humeClient.getEmpatheticPrefix();
      return prefix ? `${prefix} ${text}` : text;
    } catch {
      return text;
    }
  }, [humeEnabled, humeClient]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }, [currentChat?.messages?.length, isSearching, assistantTyping]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((origin, destination) => {
    if (!origin || !destination) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLon = (destination.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculate item price with estimated flight time for jets/helicopters
  const calculateItemPrice = useCallback((item) => {
    // If item has a fixed price (empty legs, adventures, cars), use it directly
    if (item.price && item.type !== 'jet' && item.type !== 'helicopter' && item.type !== 'aircraft') {
      return item.price;
    }

    // For jets/helicopters with hourly rate, calculate based on estimated flight time
    const hourlyRate = item.hourly_rate || item.price_per_hour || item.pricePerHour || item.rate;
    const speed = item.speed || item.speed_kmh || 800; // Default 800 km/h for jets

    if (hourlyRate && (item.origin || item.from_city) && (item.destination || item.to_city)) {
      // Try to get coordinates from item
      const origin = item.origin_coords || item.origin ||
        (item.from_lat && item.from_lng ? { lat: item.from_lat, lng: item.from_lng } : null);
      const destination = item.destination_coords || item.destination ||
        (item.to_lat && item.to_lng ? { lat: item.to_lat, lng: item.to_lng } : null);

      if (origin?.lat && destination?.lat) {
        const distance = calculateDistance(origin, destination);
        const flightHours = Math.max(1, distance / speed); // Minimum 1 hour
        return Math.round(flightHours * hourlyRate);
      }

      // Fallback: Use estimated hours if provided
      if (item.estimated_hours || item.flightHours) {
        const hours = item.estimated_hours || item.flightHours;
        return Math.round(hours * hourlyRate);
      }

      // Fallback: Show 1 hour price (minimum booking)
      return hourlyRate;
    }

    // Fallback to item price or 0
    return item.price || item.estimated_price || 0;
  }, [calculateDistance]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (conversationalAI.isEligibleForNFTBenefit(item, userHasNFT, usedNFTBenefitThisYear)) {
        return sum;
      }
      return sum + calculateItemPrice(item);
    }, 0);
  }, [cartItems, userHasNFT, usedNFTBenefitThisYear, conversationalAI, calculateItemPrice]);

  useEffect(() => {
    const lastVisit = localStorage.getItem('last_visit');
    if (lastVisit) isReturningUserRef.current = true;
    localStorage.setItem('last_visit', new Date().toISOString());

    const nftStatus = sessionStorage.getItem('user_has_nft') === 'true';
    const nftUsed = sessionStorage.getItem('nft_benefit_used_this_year') === 'true';
    setUserHasNFT(nftStatus);
    setUsedNFTBenefitThisYear(nftUsed);

    // Initialize exchange rates for USD conversion
    initializeExchangeRates();

    // Load user subscription profile
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  // Handle Break the Price file from hero upload (sessionStorage)
  useEffect(() => {
    const checkHeroBreakThePriceFile = async () => {
      const storedFileData = sessionStorage.getItem('breakThePriceFile');
      if (!storedFileData) return;

      // Clear immediately to prevent re-processing
      sessionStorage.removeItem('breakThePriceFile');

      // User must be logged in
      if (!user?.id) {
        console.log('User not logged in, cannot process Break the Price file');
        return;
      }

      try {
        const fileData = JSON.parse(storedFileData);

        // Convert base64 back to File object
        const response = await fetch(fileData.data);
        const blob = await response.blob();
        const file = new File([blob], fileData.name, { type: fileData.type });

        // Small delay to ensure component is fully mounted
        setTimeout(() => {
          // Trigger the file input change programmatically
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          // Find the break the price file input and trigger it
          const breakThePriceInput = document.querySelector('input[accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"]');
          if (breakThePriceInput) {
            breakThePriceInput.files = dataTransfer.files;
            breakThePriceInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 500);
      } catch (error) {
        console.error('Error processing Break the Price file from hero:', error);
      }
    };

    checkHeroBreakThePriceFile();
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;
    try {
      const profile = await subscriptionService.getUserProfile(user.id);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Load user's chat history from database
  useEffect(() => {
    if (!user?.id || chatsLoaded) return;

    const loadChats = async () => {
      const { success, chats } = await chatService.loadUserChats(user.id);
      if (success && chats.length > 0) {
        // Convert database format to app format
        const formattedChats = chats.map(chat => ({
          id: chat.id,
          title: chat.title,
          date: new Date(chat.updated_at).toLocaleDateString(),
          messages: chat.messages || []
        }));
        setChatHistory(formattedChats);
      }
      setChatsLoaded(true);
    };

    loadChats();
  }, [user?.id, chatsLoaded]);

  // Auto-save chat when messages change
  useEffect(() => {
    if (!user?.id || !chatsLoaded || activeChat === 'new') return;

    const currentChatData = chatHistory.find(c => c.id === activeChat);
    if (!currentChatData || currentChatData.messages.length === 0) return;

    // Debounce saving
    const timeoutId = setTimeout(() => {
      saveChat(activeChat, currentChatData.messages);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [chatHistory, activeChat, user?.id, chatsLoaded]);

  useEffect(() => {
    if (!humeEnabled) return; // Skip Hume setup if keys are not configured
    const initHume = async () => {
      try {
        await humeClient.connect();
        humeClient.onMessage((data) => {
          const text = data?.transcript || data?.text || data?.message;
          if (text) {
            setLastInputMethod('voice');
            handleSendMessage(String(text));
          }
        });
        humeClient.onAudio((audioBase64) => {
          playHumeVoice(audioBase64);
        });
      } catch (error) {
        console.log('Hume skipped');
      }
    };
    initHume();
    return () => {
      humeClient.disconnect();
      if (currentAudioRef.current) currentAudioRef.current.pause();
    };
  }, [humeClient, humeEnabled, playHumeVoice]);

  useEffect(() => {
    if (activeChat !== 'new' && !hasGreetedRef.current && currentChat?.messages.length === 0) {
      const timeOfDay = new Date().getHours();
      let greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 18 ? 'Good afternoon' : 'Good evening';
      if (isReturningUserRef.current) greeting = 'Welcome back';
      greeting += user?.name ? ` ${user.name}` : '';
      greeting += `. I'm Sphera, your luxury travel AI assistant. How can I help you today?`;
      
      const finalGreeting = withEmpathy(greeting);
      setChatHistory(prev => prev.map(c => 
        c.id === activeChat ? { ...c, messages: [{ role: 'assistant', content: finalGreeting }] } : c
      ));
      hasGreetedRef.current = true;
    }
  }, [activeChat, currentChat, user, withEmpathy]);

  // Ref to track which initial queries we've already processed (prevents double-processing)
  const processedQueriesRef = useRef(new Set());

  // Handle initial query from search - create new chat, save it, and send to AI
  useEffect(() => {
    console.log('🔄 Initial query effect triggered:', {
      initialQuery,
      hasQuery: !!(initialQuery && initialQuery.trim()),
      userId: user?.id,
      alreadyProcessed: processedQueriesRef.current.has(initialQuery),
      processedQueries: Array.from(processedQueriesRef.current)
    });

    if (initialQuery && initialQuery.trim()) {
      // Skip if we've already processed this exact query
      if (processedQueriesRef.current.has(initialQuery)) {
        console.log('⏭️ Skipping already processed query:', initialQuery);
        return;
      }

      // Wait for user auth to be ready before creating chat
      // This ensures the chat is saved to the database with the correct user ID
      if (!user?.id) {
        console.log('⏳ Waiting for user auth before processing initial query...');
        return; // Will re-run when user?.id becomes available
      }

      console.log('📝 Initial query received:', initialQuery, 'for user:', user.id);

      // Mark this query as being processed IMMEDIATELY to prevent double-processing
      processedQueriesRef.current.add(initialQuery);

      const queryToProcess = initialQuery;
      const userMessage = { role: 'user', content: queryToProcess };
      const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
      const title = queryToProcess.split(' ').slice(0, 5).join(' ') + '...';

      // Create chat and immediately send to AI (all in one async flow)
      const createChatAndSendToAI = async () => {
        let chatId;

        // Step 1: Create chat in database
        try {
          const { success, chat } = await chatService.createChat(user.id, title, userMessage);
          if (success && chat) {
            chatId = chat.id;
            console.log('💾 Created chat in database:', chatId);
          } else {
            chatId = Date.now().toString();
            console.warn('⚠️ Database chat creation failed, using temp ID:', chatId);
          }
        } catch (error) {
          console.error('❌ Error creating chat in database:', error);
          chatId = Date.now().toString();
        }

        const newChat = {
          id: chatId,
          title,
          date: 'Just now',
          messages: [userMessage, loadingMsg]
        };

        console.log('🆕 Creating new chat with message:', chatId);

        // Step 2: Add to chat history and set as active
        // Use a callback to ensure we set activeChat AFTER the chat is added
        setChatHistory(prev => {
          console.log('📚 Adding chat to history. Previous length:', prev.length, 'New chat ID:', chatId);
          // Schedule activeChat update after this state update
          setTimeout(() => {
            console.log('🎯 Setting activeChat to:', chatId);
            setActiveChat(chatId);
            // Clear the initial query prop after activeChat is set
            setTimeout(() => {
              console.log('📭 Calling onQueryProcessed');
              onQueryProcessed();
            }, 50);
          }, 0);
          return [newChat, ...prev];
        });

        // Step 4: Send query to AI (don't wait for state updates)
        console.log('🚀 Sending initial query to AI:', queryToProcess);
        setIsProcessing(true);

        try {
          const systemPrompt = getSystemPrompt();
          const claudeUserMessage = { role: 'user', content: queryToProcess };

          const response = await claudeEdgeService.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
            messages: [claudeUserMessage],
            tools: aiToolDefinitions.map((tool, index) =>
              index === aiToolDefinitions.length - 1
                ? { ...tool, cache_control: { type: "ephemeral" } }
                : tool
            ),
            tool_choice: { type: "auto" }
          });

          console.log('🤖 Claude response for initial query:', response);

          // Handle the response
          if (response.stop_reason === 'tool_use') {
            const toolUse = response.content.find(block => block.type === 'tool_use');
            if (toolUse) {
              console.log('🔧 Tool used:', toolUse.name, toolUse.input);
              const toolResult = await executeTool(toolUse.name, toolUse.input);

              // Get AI follow-up response
              const followUp = await claudeEdgeService.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
                messages: [
                  claudeUserMessage,
                  { role: 'assistant', content: response.content },
                  { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(toolResult) }] }
                ]
              });

              const aiText = followUp.content.find(block => block.type === 'text')?.text || 'Here are the results!';
              const aiMessage = { role: 'assistant', content: aiText };

              // Handle results display
              let resultsMessage = null;
              if (toolResult.success && toolResult.results) {
                let tabs = [];
                if (toolUse.name === 'searchEmptyLegs' && toolResult.results.length > 0) {
                  tabs.push({ id: 'emptylegs', title: 'Empty Legs', count: toolResult.results.length, items: toolResult.results });
                } else if (toolUse.name === 'searchPrivateJets' && toolResult.results.length > 0) {
                  tabs.push({ id: 'jets', title: 'Private Jets', count: toolResult.results.length, items: toolResult.results });
                } else if (toolUse.name === 'searchHelicopters' && toolResult.results.length > 0) {
                  tabs.push({ id: 'helicopters', title: 'Helicopters', count: toolResult.results.length, items: toolResult.results });
                } else if (toolUse.name === 'searchLuxuryCars' && toolResult.results.length > 0) {
                  tabs.push({ id: 'luxury_cars', title: 'Luxury Cars', count: toolResult.results.length, items: toolResult.results });
                } else if (toolUse.name === 'searchWines' && toolResult.results.length > 0) {
                  tabs.push({ id: 'wines', title: 'Wines', count: toolResult.results.length, items: toolResult.results });
                } else if (toolUse.name === 'searchDelicatesse' && toolResult.results.length > 0) {
                  tabs.push({ id: 'delicatesse', title: 'Delicacies', count: toolResult.results.length, items: toolResult.results });
                } else if (toolUse.name === 'searchCigars' && toolResult.results.length > 0) {
                  tabs.push({ id: 'cigars', title: 'Premium Cigars', count: toolResult.results.length, items: toolResult.results });
                }
                if (tabs.length > 0) {
                  resultsMessage = { role: 'results', content: JSON.stringify({ tabs }), tabs };
                }
              }

              // Update chat with results - filter out loading messages first
              setChatHistory(prev => prev.map(c =>
                c.id === chatId
                  ? {
                      ...c,
                      messages: [
                        ...c.messages.filter(m => !m.isLoading),
                        ...(resultsMessage ? [resultsMessage] : []),
                        aiMessage
                      ].filter((msg, index, self) =>
                        // Remove duplicate user messages
                        msg.role !== 'user' || index === self.findIndex(m => m.role === 'user' && m.content === msg.content)
                      )
                    }
                  : c
              ));

              // Save to database
              try {
                const messagesToSave = [
                  userMessage,
                  ...(resultsMessage ? [resultsMessage] : []),
                  aiMessage
                ];
                await chatService.updateChatMessages(chatId, messagesToSave, user.id);
                console.log('💾 Saved messages to database');
              } catch (saveError) {
                console.error('Error saving messages:', saveError);
              }
            }
          } else {
            // Simple text response (no tool use)
            const aiText = response.content.find(block => block.type === 'text')?.text || "I'm here to help!";
            const aiMessage = { role: 'assistant', content: aiText };

            // Update chat - filter out loading messages first
            setChatHistory(prev => prev.map(c =>
              c.id === chatId
                ? {
                    ...c,
                    messages: [
                      ...c.messages.filter(m => !m.isLoading),
                      aiMessage
                    ].filter((msg, index, self) =>
                      // Remove duplicate user messages
                      msg.role !== 'user' || index === self.findIndex(m => m.role === 'user' && m.content === msg.content)
                    )
                  }
                : c
            ));

            // Save to database
            try {
              await chatService.updateChatMessages(chatId, [userMessage, aiMessage], user.id);
              console.log('💾 Saved messages to database');
            } catch (saveError) {
              console.error('Error saving messages:', saveError);
            }
          }
        } catch (error) {
          console.error('❌ Error calling Claude:', error);
          const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
          setChatHistory(prev => prev.map(c =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [
                    ...c.messages.filter(m => !m.isLoading),
                    errorMessage
                  ].filter((msg, index, self) =>
                    msg.role !== 'user' || index === self.findIndex(m => m.role === 'user' && m.content === msg.content)
                  )
                }
              : c
          ));
        } finally {
          setIsProcessing(false);
        }
      };

      createChatAndSendToAI();
    }
  }, [initialQuery, onQueryProcessed, user?.id]);

  // Track if we've processed the assistant message to prevent double-processing
  const processedAssistantMessageRef = useRef(new Set());

  // Handle initialAssistantMessage - show prefilled assistant message in new chat
  useEffect(() => {
    if (initialAssistantMessage && initialAssistantMessage.trim()) {
      // Skip if already processed
      if (processedAssistantMessageRef.current.has(initialAssistantMessage)) {
        console.log('⏭️ Skipping already processed assistant message');
        return;
      }

      console.log('📝 Initial assistant message received:', initialAssistantMessage);
      processedAssistantMessageRef.current.add(initialAssistantMessage);

      // Create a new chat with the assistant message
      const newChatId = `beat-price-${Date.now()}`;
      const newChat = {
        id: newChatId,
        title: 'Beat the Price',
        date: new Date().toLocaleDateString(),
        messages: [{
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: initialAssistantMessage,
          timestamp: new Date().toISOString()
        }]
      };

      setChatHistory(prev => [newChat, ...prev]);
      setActiveChat(newChatId);

      // Clear the prop after a small delay to ensure state updates propagate
      setTimeout(() => {
        onAssistantMessageProcessed();
      }, 100);
    }
  }, [initialAssistantMessage, onAssistantMessageProcessed]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    } else {
      if (!humeEnabled) {
        alert('Voice capture not configured. Please set VITE_HUME_API_KEY and VITE_HUME_SECRET_KEY.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await humeClient.sendAudio(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
        setIsListening(true);
      } catch (error) {
        alert('Microphone access denied');
      }
    }
  }, [isRecording, humeClient, humeEnabled]);

  const fetchWeather = useCallback(async (location) => {
    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
      const data = await response.json();
      setWeather({
        location: location,
        temp: data.temp_c || data.current?.temp_c || 22,
        condition: data.condition?.text || data.current?.condition?.text || 'Sunny'
      });
    } catch (error) {
      setWeather({ location: location, temp: 22, condition: 'Sunny' });
    }
  }, []);

  const addToCart = useCallback((item) => {
    // Preserve original database ID for items from winery/delicacies tables
    const originalDbId = item.id;
    const itemType = item.type?.toLowerCase() || '';
    const isFromDatabase = itemType === 'wines' || itemType === 'wine' ||
                          itemType === 'delicatesse' || itemType === 'delicacies' ||
                          itemType === 'cigars';

    let cartItem = {
      ...item,
      cartId: Date.now(),
      addedAt: new Date().toISOString(),
      currency: 'USD', // All prices now in USD
      // Preserve original database ID for payment processing
      original_id: originalDbId,
      db_id: isFromDatabase ? originalDbId : undefined
    };

    // For jets and helicopters: calculate estimated price based on flight distance/time
    const isJet = item.type === 'jets' || item.type === 'jet';
    const isHelicopter = item.type === 'helicopters' || item.type === 'helicopter';

    // Convert hourly rate from EUR to USD
    const hourlyRateUSD = item.hourly_rate_eur ? Math.round(convertToUSD(item.hourly_rate_eur, 'EUR')) : 0;

    if ((isJet || isHelicopter) && item.hourly_rate_eur) {
      // FIRST: Check if item already has estimatedPrice from search results (pre-calculated)
      if (item.estimatedPrice && item.estimatedPrice > 0) {
        // Convert pre-calculated price from EUR to USD
        const estimatedPriceUSD = Math.round(convertToUSD(item.estimatedPrice, 'EUR'));
        cartItem = {
          ...cartItem,
          flightDistanceNm: item.flightDistance,
          flightTimeHours: item.flightHours || item.billedHours,
          estimatedDuration: item.estimatedDuration,
          billedHours: item.billedHours || item.flightHours,
          estimatedPrice: estimatedPriceUSD,
          price: estimatedPriceUSD,
          basePrice: estimatedPriceUSD,
          totalWithFee: estimatedPriceUSD,
          hourly_rate_usd: hourlyRateUSD,
          isEstimate: true,
          priceCalculation: item.priceCalculation ? item.priceCalculation.replace(/€/g, '$') : `${item.estimatedDuration} × $${hourlyRateUSD.toLocaleString()}/hr`,
          route: item.route || `${item.from} → ${item.to}`
        };
      } else if (item.flightDistance && item.estimatedDuration) {
        // Parse duration to get hours (e.g., "2h 30m" -> 2.5)
        const durationMatch = item.estimatedDuration.match(/(\d+)h\s*(\d+)?m?/);
        let flightTimeHours = 1;
        if (durationMatch) {
          flightTimeHours = parseInt(durationMatch[1]) + (parseInt(durationMatch[2] || 0) / 60);
        }

        // Calculate estimated price in USD
        const estimatedPriceUSD = Math.round(flightTimeHours * hourlyRateUSD);

        // Add calculated fields to cart item
        cartItem = {
          ...cartItem,
          flightDistanceNm: item.flightDistance,
          flightTimeHours: flightTimeHours,
          estimatedDuration: item.estimatedDuration,
          billedHours: flightTimeHours,
          estimatedPrice: estimatedPriceUSD,
          price: estimatedPriceUSD,
          basePrice: estimatedPriceUSD,
          totalWithFee: estimatedPriceUSD,
          hourly_rate_usd: hourlyRateUSD,
          isEstimate: true,
          priceCalculation: `${item.estimatedDuration} × $${hourlyRateUSD.toLocaleString()}/hr`,
          route: item.route || `${item.flightDistance.toLocaleString()} nm flight`
        };
      } else {
        // FALLBACK: Try to calculate from origin/destination
        const origin = item.from || item.from_city || item.origin || item.departure_airport;
        const destination = item.to || item.to_city || item.destination || item.arrival_airport;

        if (origin && destination) {
          // Calculate distance in nautical miles
          const distanceNm = calculateDistance(origin, destination);

          if (distanceNm) {
            // Get cruise speed (default 450 kts for jets, 150 kts for helicopters)
            const cruiseSpeedKts = item.speed_kts || (isJet ? 450 : 150);

            // Calculate flight time in hours
            const flightTimeHours = distanceNm / cruiseSpeedKts;

            // Calculate estimated price in USD
            const estimatedPriceUSD = Math.round(flightTimeHours * hourlyRateUSD);

            // Format duration string
            const hours = Math.floor(flightTimeHours);
            const minutes = Math.round((flightTimeHours - hours) * 60);
            const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

            // Add calculated fields to cart item
            cartItem = {
              ...cartItem,
              flightDistanceNm: distanceNm,
              flightTimeHours: flightTimeHours,
              estimatedDuration: durationStr,
              billedHours: flightTimeHours,
              estimatedPrice: estimatedPriceUSD,
              price: estimatedPriceUSD,
              basePrice: estimatedPriceUSD,
              totalWithFee: estimatedPriceUSD,
              hourly_rate_usd: hourlyRateUSD,
              isEstimate: true,
              priceCalculation: `${durationStr} × $${hourlyRateUSD.toLocaleString()}/hr`,
              route: `${origin} → ${destination}`
            };
          } else if (item.estimatedDuration) {
            // Distance calculation failed but we have duration - parse and use it
            const durationMatch = item.estimatedDuration.match(/(\d+)h\s*(\d+)?m?/);
            let flightTimeHours = 1; // minimum 1 hour
            if (durationMatch) {
              flightTimeHours = parseInt(durationMatch[1]) + (parseInt(durationMatch[2] || 0) / 60);
            }
            const estimatedPriceUSD = Math.round(flightTimeHours * hourlyRateUSD);

            cartItem = {
              ...cartItem,
              flightTimeHours: flightTimeHours,
              estimatedDuration: item.estimatedDuration,
              billedHours: flightTimeHours,
              estimatedPrice: estimatedPriceUSD,
              price: estimatedPriceUSD,
              basePrice: estimatedPriceUSD,
              totalWithFee: estimatedPriceUSD,
              hourly_rate_usd: hourlyRateUSD,
              isEstimate: true,
              priceCalculation: `${item.estimatedDuration} × $${hourlyRateUSD.toLocaleString()}/hr`,
              route: `${origin} → ${destination}`
            };
          } else {
            // Last resort: use minimum 1 hour billing
            const minHours = isHelicopter ? 0.5 : 1; // 30 min for heli, 1h for jets
            const estimatedPriceUSD = Math.round(minHours * hourlyRateUSD);
            const durationStr = isHelicopter ? '30m' : '1h';

            cartItem = {
              ...cartItem,
              flightTimeHours: minHours,
              estimatedDuration: `${durationStr} (minimum)`,
              billedHours: minHours,
              estimatedPrice: estimatedPriceUSD,
              price: estimatedPriceUSD,
              basePrice: estimatedPriceUSD,
              totalWithFee: estimatedPriceUSD,
              hourly_rate_usd: hourlyRateUSD,
              isEstimate: true,
              priceCalculation: `${durationStr} min × $${hourlyRateUSD.toLocaleString()}/hr`,
              route: `${origin} → ${destination}`
            };
          }
        }
      }
    }

    setCartItems(prev => [...prev, cartItem]);

    const isFree = conversationalAI.isEligibleForNFTBenefit(item, userHasNFT, usedNFTBenefitThisYear);

    // Show minimalistic toast notification
    const itemName = item.name || item.title || 'Item';
    const priceInfo = cartItem.estimatedPrice ? ` (~$${cartItem.estimatedPrice.toLocaleString()})` : '';
    setToast({
      message: isFree ? `${itemName} added (FREE with NFT)` : `${itemName}${priceInfo} added to cart`,
      type: 'cart'
    });

    // Add message to chat with price calculation info
    let msg = `Added ${itemName}`;
    if (isFree) msg += ` (FREE with NFT!)`;
    if (cartItem.estimatedPrice && cartItem.priceCalculation) {
      msg += `\n\n📍 Route: ${cartItem.route}`;
      msg += `\n⏱️ Est. flight time: ${cartItem.estimatedDuration}`;
      msg += `\n💰 Est. price: ${cartItem.priceCalculation} = ~$${cartItem.estimatedPrice.toLocaleString()}`;
    }
    msg += `\n\nContinue browsing or say "send request" when ready.`;

    setChatHistory(prev => prev.map(c =>
      c.id === activeChat ? { ...c, messages: [...c.messages, { role: 'assistant', content: msg }] } : c
    ));
  }, [activeChat, conversationalAI, userHasNFT, usedNFTBenefitThisYear]);

  const removeFromCart = useCallback((cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  }, []);

  const handleAdjustItem = (item) => {
    setItemToAdjust(item);
    setShowAdjustModal(true);
  };

  // Multi-Stop Journey Builder handlers
  const handleBuildJourney = useCallback((jet) => {
    // Only for private jets (not empty legs or helicopters)
    if (jet.type !== 'jets' && jet.type !== 'jet') {
      setToast({ message: 'Multi-stop journeys are only available for private jets', type: 'warning' });
      return;
    }
    setJourneyBuilderJet(jet);
    setShowJourneyBuilder(true);
  }, []);

  const handleJourneyComplete = useCallback((journeyItem) => {
    // Add the multi-stop journey to cart
    const cartItem = {
      ...journeyItem,
      cartId: Date.now(),
      addedAt: new Date().toISOString(),
      currency: 'USD'
    };

    setCartItems(prev => [...prev, cartItem]);
    setShowJourneyBuilder(false);
    setJourneyBuilderJet(null);

    // Show toast
    const stopCount = journeyItem.stops?.length || 0;
    setToast({
      message: `${journeyItem.name} journey (${stopCount} stop${stopCount !== 1 ? 's' : ''}) added to cart`,
      type: 'cart'
    });

    // Check if journey has overnight stays - offer transfers
    if (journeyItem.hasOvernightStays && journeyItem.suggestedTransfers?.length > 0) {
      setLastAddedJourney(cartItem);
      setTimeout(() => {
        setShowTransferOffer(true);
      }, 500);
    }

    // Add message to chat with journey summary
    let msg = `✈️ **Multi-stop journey added to cart!**\n\n`;
    msg += `📍 **Route:** ${journeyItem.route}\n`;
    msg += `✈️ **Aircraft:** ${journeyItem.name}\n`;
    msg += `📏 **Total distance:** ${Math.round(journeyItem.totalDistance * 0.539957).toLocaleString()} nm\n`;
    msg += `⏱️ **Total flight time:** ${Math.round(journeyItem.totalFlightTime * 10) / 10}h\n`;
    msg += `💰 **Estimated price:** ~$${journeyItem.estimatedPrice?.toLocaleString()}\n\n`;

    if (journeyItem.hasOvernightStays) {
      msg += `🌙 This journey includes overnight stays.\n\n`;
    }

    msg += `Say "send request" when you're ready to get a coordinator quote.`;

    // Add the journey confirmation message
    setChatHistory(prev => prev.map(c =>
      c.id === activeChat ? { ...c, messages: [...c.messages, { role: 'assistant', content: msg }] } : c
    ));

    // Add cross-sell suggestions after a short delay
    setTimeout(() => {
      const crossSellServices = [];

      // Always suggest airport transfers
      crossSellServices.push({
        icon: '🚗',
        name: 'Airport Transfers',
        description: 'Luxury ground transport at each destination'
      });

      // Suggest hotels if overnight stays
      if (journeyItem.hasOvernightStays) {
        crossSellServices.push({
          icon: '🏨',
          name: 'Hotel Accommodations',
          description: 'Premium hotels near your overnight stops'
        });
      }

      // Always offer concierge
      crossSellServices.push({
        icon: '🍾',
        name: 'In-Flight Catering',
        description: 'Gourmet meals & beverages for your journey'
      });

      crossSellServices.push({
        icon: '📋',
        name: 'Concierge Services',
        description: 'Restaurant reservations, events, experiences'
      });

      let crossSellMsg = `\n**Enhance your journey with these services:**\n\n`;
      crossSellServices.forEach(service => {
        crossSellMsg += `${service.icon} **${service.name}** - ${service.description}\n`;
      });
      crossSellMsg += `\nJust ask if you'd like me to add any of these to your request!`;

      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, { role: 'assistant', content: crossSellMsg, isCrossSell: true }] }
          : c
      ));
    }, 1500);
  }, [activeChat]);

  const handleAddTransfers = useCallback((transfers) => {
    // Add selected transfers as linked cart items
    transfers.forEach(transfer => {
      const transferItem = {
        ...transfer,
        cartId: Date.now() + Math.random(),
        addedAt: new Date().toISOString(),
        currency: 'USD',
        type: 'ground_transport',
        linkedJourneyId: lastAddedJourney?.cartId,
        name: `Airport Transfer - ${transfer.city}`,
        isTransfer: true
      };
      setCartItems(prev => [...prev, transferItem]);
    });

    setShowTransferOffer(false);
    setLastAddedJourney(null);

    setToast({
      message: `${transfers.length} airport transfer${transfers.length !== 1 ? 's' : ''} added`,
      type: 'cart'
    });
  }, [lastAddedJourney]);

  // Multi-Leg Inline Button handlers
  const handleSelectFormBuilder = useCallback(() => {
    // Add loading message first
    const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
    setChatHistory(prev => prev.map(c =>
      c.id === activeChat
        ? { ...c, messages: [...c.messages, loadingMsg] }
        : c
    ));

    // After brief delay, show form and add confirmation message
    setTimeout(() => {
      // Check if we have jet results to use
      const jetsTab = searchResults?.tabs?.find(tab => tab.id === 'jets');
      const firstJet = jetsTab?.items?.[0];

      if (firstJet) {
        handleBuildJourney(firstJet);
      } else {
        // No jets yet - open journey builder with placeholder
        setShowJourneyBuilder(true);
        setJourneyBuilderJet({
          name: 'Aircraft TBD',
          type: 'jets',
          hourly_rate_eur: 5000,
          range_km: 5000,
          cruising_speed_kmh: 800,
          placeholder: true
        });
      }

      // Replace loading with confirmation message
      const confirmMessage = `Opening the Journey Builder form. Use the visual builder to:

• Add stops along your route
• Set departure dates and times for each leg
• Specify stop durations
• View total distance and estimated costs

Each stop you add will appear in the route: **A → B → C → D**

Click **"Add to Cart"** when your journey is complete.`;

      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? {
              ...c,
              messages: c.messages.map((msg, idx) =>
                idx === c.messages.length - 1 && msg.isLoading
                  ? { role: 'assistant', content: confirmMessage }
                  : msg
              )
            }
          : c
      ));
    }, 600);
  }, [searchResults, handleBuildJourney, activeChat]);

  const handleSelectChatBuilder = useCallback(() => {
    setMultiLegChatMode(true);
    setMultiLegChatData({
      legs: [],
      currentLegIndex: 0,
      passengers: null,
      pets: false,
      luggage: null,
      specialRequests: ''
    });

    // Add loading message first
    const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
    setChatHistory(prev => prev.map(c =>
      c.id === activeChat
        ? { ...c, messages: [...c.messages, loadingMsg] }
        : c
    ));

    // After a brief delay, replace with the actual message
    setTimeout(() => {
      const routeInfo = multiLegRouteInfo || 'your multi-leg journey';
      const startMessage = `Perfect! Let's build ${routeInfo} step by step via chat.

I'll help you add each leg of your journey. For each stop, tell me:
• **Destination** (city or airport)
• **Date** of departure
• **Time** of departure
• **How long** you'll stay at each stop

Once you provide these details, I'll show you an **"Add to Route"** button to confirm each leg.

Let's start with your **first leg**. Where are you departing from, and what's your first destination?`;

      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? {
              ...c,
              messages: c.messages.map((msg, idx) =>
                idx === c.messages.length - 1 && msg.isLoading
                  ? { role: 'assistant', content: startMessage, isMultiLegChat: true }
                  : msg
              )
            }
          : c
      ));
    }, 800);
  }, [activeChat, multiLegRouteInfo]);

  // Add leg to multi-leg route (when user clicks "Add to Route")
  const handleAddLegToRoute = useCallback((legData) => {
    // Add the leg to the route
    setMultiLegRoute(prev => [...prev, legData]);
    setPendingLegData(null);

    // Calculate route string for display
    const updatedRoute = [...multiLegRoute, legData];
    const routeString = updatedRoute.map(leg => leg.code || leg.city?.substring(0, 3).toUpperCase()).join(' → ');

    // Add confirmation message to chat
    const confirmMessage = `**${legData.city} (${legData.code})** added to your route.

**Current route:** ${routeString}

${updatedRoute.length >= 2
  ? `Would you like to add another stop, or are you ready to **add this journey to your cart**?`
  : `Great start! Now tell me about your **next destination**.`
}`;

    // Show loading then message
    const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
    setChatHistory(prev => prev.map(c =>
      c.id === activeChat
        ? { ...c, messages: [...c.messages, loadingMsg] }
        : c
    ));

    setTimeout(() => {
      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? {
              ...c,
              messages: c.messages.map((msg, idx) =>
                idx === c.messages.length - 1 && msg.isLoading
                  ? { role: 'assistant', content: confirmMessage, isMultiLegChat: true, currentRoute: updatedRoute }
                  : msg
              )
            }
          : c
      ));
    }, 500);
  }, [activeChat, multiLegRoute]);

  // Finalize multi-leg route and add to cart
  const handleAddRouteToCart = useCallback(() => {
    if (multiLegRoute.length < 2) return;

    // Create a multi-stop cart item
    const routeString = multiLegRoute.map(leg => leg.code || leg.city?.substring(0, 3).toUpperCase()).join(' → ');

    const multiStopItem = {
      id: `multi-leg-${Date.now()}`,
      type: 'jets',
      name: 'Multi-Leg Charter (Aircraft TBD)',
      isMultiStop: true,
      route: routeString,
      stops: multiLegRoute,
      from: multiLegRoute[0]?.city,
      from_iata: multiLegRoute[0]?.code,
      to: multiLegRoute[multiLegRoute.length - 1]?.city,
      to_iata: multiLegRoute[multiLegRoute.length - 1]?.code,
      departure_date: multiLegRoute[0]?.date,
      departure_time: multiLegRoute[0]?.time,
      passengers: multiLegChatData.passengers || 1,
      requiresQuote: true,
      placeholder: true
    };

    // Add to cart using setCartItems
    setCartItems(prev => [...prev, multiStopItem]);

    // Show confirmation message
    const confirmMessage = `Your multi-leg journey has been added to the cart:

**Route:** ${routeString}
**Stops:** ${multiLegRoute.length}

Our coordinators will find the best aircraft for your route and provide you with a detailed quote.

Would you like to add any additional services like **airport transfers** or **catering**?`;

    const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
    setChatHistory(prev => prev.map(c =>
      c.id === activeChat
        ? { ...c, messages: [...c.messages, loadingMsg] }
        : c
    ));

    setTimeout(() => {
      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? {
              ...c,
              messages: c.messages.map((msg, idx) =>
                idx === c.messages.length - 1 && msg.isLoading
                  ? { role: 'assistant', content: confirmMessage }
                  : msg
              )
            }
          : c
      ));

      // Show cart sidebar
      setShowCartSidebar(true);
    }, 600);

    // Reset multi-leg state
    setMultiLegChatMode(false);
    setMultiLegRoute([]);
    setMultiLegChatData({
      legs: [],
      currentLegIndex: 0,
      passengers: null,
      pets: false,
      luggage: null,
      specialRequests: ''
    });
  }, [activeChat, multiLegRoute, multiLegChatData]);

  // Break the Price - check if user has access
  const canUseBreakThePrice = useCallback(() => {
    if (!userSubscriptionLimits) return false;
    return userSubscriptionLimits.break_the_price === true;
  }, [userSubscriptionLimits]);

  // Convert PDF to images for Claude Vision analysis
  const convertPdfToImages = useCallback(async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const images = [];
    // Only process first 3 pages max (quotes are usually 1-2 pages)
    const maxPages = Math.min(pdf.numPages, 3);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const scale = 2; // Higher = better quality but more tokens
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Convert to base64
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      images.push({
        page: i,
        base64,
        mediaType: 'image/png'
      });
    }

    return images;
  }, []);

  // Parse extracted quote data from Claude's response
  const parseExtractedQuoteData = useCallback((text) => {
    const extractField = (fieldName) => {
      const regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?=\\n|$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };

    return {
      route: extractField('Route'),
      date: extractField('Date'),
      time: extractField('Time'),
      aircraft: extractField('Aircraft'),
      passengers: extractField('Passengers'),
      price: extractField('Price'),
      broker: extractField('Broker'),
      validUntil: extractField('Valid Until')
    };
  }, []);

  // Break the Price - handle file upload with Claude Vision analysis
  const handleBreakThePriceUpload = useCallback(async (file) => {
    if (!file) return;
    if (!user?.id) {
      setToast({ message: 'Please log in to use Break the Price', type: 'error' });
      return;
    }

    // Check if user has Break the Price access
    if (!canUseBreakThePrice()) {
      setToast({ message: 'Upgrade to Starter or higher to use Break the Price', type: 'warning' });
      setShowSubscriptionModal(true);
      return;
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: 'Please upload a PDF or image file (JPG, PNG, WebP)', type: 'error' });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'File too large. Maximum size is 10MB.', type: 'error' });
      return;
    }

    setIsUploadingQuote(true);
    setBreakThePriceFile(file);
    setShowBreakThePrice(false);

    try {
      // For non-Elite users, check if they have chats remaining (costs 1 chat)
      if (userSubscriptionLimits?.tier !== 'elite') {
        const { canStart, chatsRemaining } = await subscriptionService.canStartNewChat(user.id);
        if (!canStart || chatsRemaining < 1) {
          setToast({ message: 'No chats remaining. Break the Price costs 1 chat.', type: 'warning' });
          setShowSubscriptionModal(true);
          setIsUploadingQuote(false);
          return;
        }
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${activeChat || 'new'}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('price-break-quotes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('price-break-quotes')
        .getPublicUrl(fileName);

      // Add upload message to chat
      const uploadMessage = {
        role: 'user',
        content: `[Break the Price] I've uploaded a competitor quote for analysis.`,
        attachment: {
          type: 'price_break_quote',
          fileName: file.name,
          fileUrl: publicUrl
        }
      };

      // Add analyzing message
      const analyzingMessage = {
        role: 'assistant',
        content: file.type === 'application/pdf'
          ? 'Converting PDF and analyzing your quote...'
          : 'Analyzing your quote...',
        isLoading: true
      };

      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, uploadMessage, analyzingMessage] }
          : c
      ));

      // Prepare image content for Claude Vision
      let imageContent = [];
      let pagesAnalyzed = 1;

      if (file.type === 'application/pdf') {
        // Convert PDF pages to images
        const pdfImages = await convertPdfToImages(file);
        pagesAnalyzed = pdfImages.length;

        imageContent = pdfImages.map(img => ({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType,
            data: img.base64
          }
        }));
      } else {
        // Regular image - convert to base64
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result.split(',')[1]);
          reader.readAsDataURL(file);
        });

        imageContent = [{
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type,
            data: base64
          }
        }];
      }

      // Send to Claude for analysis
      const analysisPrompt = `Analyze this charter/travel quote and extract:

1. Route (departure → destination with airport codes if visible)
2. Date and time of service
3. Aircraft/Vehicle type and model
4. Number of passengers
5. Total price and currency
6. Broker or Operator name
7. Quote validity/expiration date

Format your response as:

**EXTRACTED QUOTE DATA:**
- **Route:** [FROM] → [TO]
- **Date:** [DATE]
- **Time:** [TIME]
- **Aircraft:** [TYPE]
- **Passengers:** [NUMBER]
- **Price:** [CURRENCY] [AMOUNT]
- **Broker:** [NAME]
- **Valid Until:** [DATE]

If any field is not visible or unclear, write "Not specified".

End your response with: "Please review the information above. If everything is correct, click **Send Request** below and we'll get back to you within 12 hours with a better price."`;

      let analysisText = '';
      let extractedData = null;

      try {
        const response = await claudeEdgeService.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: [{ type: "text", text: "You are a travel quote analysis expert. Extract key details from travel quotes.", cache_control: { type: "ephemeral" } }],
          messages: [{
            role: 'user',
            content: [
              ...imageContent,
              { type: 'text', text: analysisPrompt }
            ]
          }]
        });

        analysisText = response.content[0].text;
        extractedData = parseExtractedQuoteData(analysisText);
      } catch (analysisError) {
        console.warn('Claude analysis failed, using fallback:', analysisError);
        analysisText = `I couldn't automatically analyze this document, but no worries - our coordinators will review it manually.

Your quote has been received and will be reviewed within 12 hours.`;
      }

      // Create price break request in database with extracted data
      const requestRef = `BTP-${Date.now().toString().slice(-6)}`;
      const { error: requestError } = await supabase
        .from('price_break_requests')
        .insert({
          user_id: user.id,
          chat_id: activeChat || 'new',
          service_type: extractedData?.aircraft ? 'jet' : 'unknown',
          service_details: extractedData || {},
          quote_file_url: publicUrl,
          quote_file_type: file.type.includes('pdf') ? 'pdf' : 'image',
          quote_extracted_data: extractedData || {},
          competitor_price: extractedData?.price ? parseFloat(extractedData.price.replace(/[^0-9.]/g, '')) : null,
          status: extractedData ? 'analyzing' : 'pending',
          metadata: {
            reference: requestRef,
            fileName: file.name,
            fileSize: file.size,
            pagesAnalyzed: pagesAnalyzed
          }
        });

      if (requestError) console.warn('Error saving request:', requestError);

      // Deduct 1 chat for non-Elite users
      if (userSubscriptionLimits?.tier !== 'elite') {
        await subscriptionService.incrementChatUsage(user.id);
      }

      // Show analysis result
      const resultMessage = {
        role: 'assistant',
        content: extractedData
          ? `${analysisText}\n\n---\n\n**Reference:** #${requestRef}\n\nIf the above information is correct, reply "confirm" and our coordinators will find you a better price within 12 hours.`
          : `${analysisText}\n\n**Reference:** #${requestRef}`,
        action: extractedData ? 'price_break_confirm' : null,
        extractedData: extractedData,
        requestRef: requestRef
      };

      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), resultMessage] }
          : c
      ));

      setToast({ message: 'Quote analyzed! Review the extracted data.', type: 'info' });

    } catch (error) {
      console.error('Error uploading quote:', error);

      // Remove loading message and show error
      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), {
              role: 'assistant',
              content: 'Sorry, there was an error processing your quote. Please try again or contact support.'
            }] }
          : c
      ));

      setToast({ message: 'Failed to process quote. Please try again.', type: 'error' });
    } finally {
      setIsUploadingQuote(false);
      setBreakThePriceFile(null);
    }
  }, [user?.id, activeChat, canUseBreakThePrice, userSubscriptionLimits, convertPdfToImages, parseExtractedQuoteData]);

  // Fetch user subscription limits on mount
  useEffect(() => {
    const fetchSubscriptionLimits = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase.rpc('get_chat_limits', { p_user_id: user.id });
        if (!error && data) {
          setUserSubscriptionLimits(data);
        }
      } catch (err) {
        console.warn('Failed to fetch subscription limits:', err);
      }
    };
    fetchSubscriptionLimits();
  }, [user?.id]);

  const handleSaveAdjustment = (adjustedItem) => {
    setCartItems(prev => prev.map(item => 
      item.id === adjustedItem.id ? { ...item, ...adjustedItem } : item
    ));
    
    setChatHistory(prev => prev.map(c => 
      c.id === activeChat ? { ...c, messages: [...c.messages, { role: 'assistant', content: `Updated ${adjustedItem.name}` }] } : c
    ));
  };

  const handleWalletConnect = useCallback((wallet) => {
    setConnectedWallet(wallet);
    setShowWalletConnect(false);
    
    setChatHistory(prev => prev.map(c => 
      c.id === activeChat ? { ...c, messages: [...c.messages, { role: 'assistant', content: `Wallet connected: ${wallet.slice(0, 6)}...${wallet.slice(-4)}` }] } : c
    ));
  }, [activeChat]);

  const saveRequestToPDF = useCallback(() => {
    const request = {
      id: `REQ-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chatId: activeChat,
      items: cartItems,
      total: cartTotal,
      conversation: currentChat?.messages || [],
      weather: weather,
      status: 'saved'
    };

    const existing = JSON.parse(sessionStorage.getItem('chat_requests') || '[]');
    sessionStorage.setItem('chat_requests', JSON.stringify([...existing, request]));

    setChatHistory(prev => prev.map(c => 
      c.id === activeChat ? { ...c, messages: [...c.messages, { role: 'assistant', content: `Saved! Reference: ${request.id}` }] } : c
    ));
  }, [cartItems, cartTotal, activeChat, currentChat, weather]);

  const sendRequest = useCallback(async () => {
    const hasNFTItem = cartItems.some(item => 
      conversationalAI.isEligibleForNFTBenefit(item, userHasNFT, usedNFTBenefitThisYear)
    );
    
    if (hasNFTItem && !usedNFTBenefitThisYear) {
      sessionStorage.setItem('nft_benefit_used_this_year', 'true');
      setUsedNFTBenefitThisYear(true);
    }

    const request = {
      id: `REQ-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chatId: activeChat,
      items: cartItems,
      total: cartTotal,
      status: 'sent',
      paymentMethod: selectedPaymentMethod,
      walletAddress: connectedWallet
    };

    const existing = JSON.parse(sessionStorage.getItem('chat_requests') || '[]');
    sessionStorage.setItem('chat_requests', JSON.stringify([...existing, request]));
    
    // Persist to Supabase user_requests (My Requests)
    try {
      // Determine request type from items
      const types = new Set(cartItems.map(i => i.type));
      const hasMultiStop = cartItems.some(i => i.isMultiStop);
      const toType = () => {
        // Check for multi-stop charter first
        if (hasMultiStop) return 'multi_stop_charter';
        if (types.size > 1) return 'booking';
        const only = Array.from(types)[0];
        if (only === 'empty_legs') return 'empty_leg';
        if (only === 'jets' || only === 'aircraft') return 'private_jet_charter';
        if (only === 'helicopters') return 'helicopter_charter';
        if (only === 'luxury_cars' || only === 'cars') return 'luxury_car_rental';
        if (only === 'taxi_cars' || only === 'taxi' || only === 'transfer' || only === 'ground_transport') return 'ground_transport';
        if (only === 'adventures' || only === 'adventure') return 'adventure_package';
        // HOTELS DISABLED - LiteAPI hotels temporarily removed
        // if (only === 'hotels' || only === 'hotel') return 'hotel_booking';
        if (only === 'fixed_offer' || only === 'fixed_offers') return 'fixed_offer';
        if (only === 'yachts' || only === 'yacht') return 'yacht_charter';
        return 'booking';
      };

      const { data: userInfo } = await supabase.auth.getUser();
      const userId = userInfo?.user?.id || null;

      if (userId) {
        // Build detailed items array with full service info
        const detailedItems = cartItems.map(item => ({
          // Core identifiers
          id: item.id,
          original_id: item.original_id,
          cartId: item.cartId,
          type: item.type,
          // Service details
          name: item.name || item.title,
          title: item.title || item.name,
          description: item.description,
          // Route info
          from_city: item.from_city || item.from || item.origin || item.departure_airport,
          to_city: item.to_city || item.to || item.destination || item.arrival_airport,
          from_iata: item.from_iata,
          to_iata: item.to_iata,
          route: item.route || `${item.from_city || item.from || ''} → ${item.to_city || item.to || ''}`,
          // Date/Time
          departure_date: item.departure_date || item.date,
          departure_time: item.departure_time,
          // Aircraft/Vehicle info
          aircraft: item.aircraft || item.aircraft_type || item.aircraft_model,
          aircraft_type: item.aircraft_type,
          aircraft_model: item.aircraft_model,
          category: item.category,
          manufacturer: item.manufacturer,
          capacity: item.capacity || item.max_passengers || item.pax,
          // Ground Transport specific fields
          pickup_location: item.pickup_location || item.from,
          dropoff_location: item.dropoff_location || item.to,
          service_type: item.service_type || item.category,
          // Pricing - ALL IN USD (Base + VAT only)
          base_price: item.price_usd || item.price || item.basePrice || 0,
          vat_amount: item.vat_amount || Math.round((item.price_usd || item.price || item.basePrice || 0) * 0.081),
          vat_percent: 8.1,
          total_price: item.totalWithFee || Math.round((item.price_usd || item.price || item.basePrice || 0) * 1.081),
          currency: 'USD',
          // Original price reference
          original_price: item.original_price,
          original_currency: item.original_currency,
          // Extras
          passengers: item.passengers,
          luggage: item.luggage,
          has_pet: item.has_pet,
          special_requests: item.special_requests,
          // NFT benefits
          has_nft: item.has_nft,
          nft_discount: item.nft_discount,
          // Metadata
          image_url: item.imageUrl || item.image_url || item.primaryImage,
          addedAt: item.addedAt,
          // Multi-stop journey data
          isMultiStop: item.isMultiStop || false,
          stops: item.stops || [],
          legs: item.legs || [],
          totalDistance: item.totalDistance,
          totalFlightTime: item.totalFlightTime,
          billedHours: item.billedHours,
          hasOvernightStays: item.hasOvernightStays || false,
          overnightStopIndices: item.overnightStopIndices || [],
          suggestedTransfers: item.suggestedTransfers || [],
          fuelIncluded: item.fuelIncluded !== false, // Default true
          priceCalculation: item.priceCalculation,
          // Linked items (for transfers linked to journeys)
          linkedJourneyId: item.linkedJourneyId
        }));

        // Calculate grand total from detailed items
        const grandTotal = detailedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);

        const payload = {
          user_id: userId,
          type: toType(),
          client_email: userInfo?.user?.email,
          data: {
            request_id: request.id,
            source: 'ai_chat',
            // Full service items with all details
            items: detailedItems,
            // Summary totals (Base + VAT only)
            subtotal: detailedItems.reduce((sum, item) => sum + (item.base_price || 0), 0),
            total_vat: detailedItems.reduce((sum, item) => sum + (item.vat_amount || 0), 0),
            total: grandTotal,
            currency: 'USD',
            // Payment info
            payment_method: selectedPaymentMethod,
            wallet_address: connectedWallet,
            // Conversation for context
            conversation: currentChat?.messages || [],
            created_at: request.timestamp
          },
          status: 'pending'
        };
        const { data: insertedRequest, error: insertError } = await supabase
          .from('user_requests')
          .insert([payload])
          .select()
          .single();

        if (insertError) {
          console.error('Failed to save to user_requests:', insertError);
        } else if (insertedRequest?.id) {
          // Trigger email notification via Supabase Edge Function
          try {
            await supabase.functions.invoke('user-request-notifications', {
              body: { record: { id: insertedRequest.id } }
            });
            console.log('Email notification triggered for request:', insertedRequest.id);
          } catch (emailErr) {
            console.error('Failed to send email notification:', emailErr);
            // Don't block the flow if email fails
          }

          // Generate PDF confirmation for the request
          try {
            const pdfRequest = {
              id: insertedRequest.id,
              type: payload.type,
              service_type: payload.type,
              created_at: request.timestamp,
              client_email: userInfo?.user?.email,
              data: {
                ...payload.data,
                cart_items: detailedItems,
                estimated_total: grandTotal
              }
            };

            const { blob, filename } = await generateRequestConfirmationPDF(pdfRequest);

            // Save PDF to storage
            try {
              await savePDFToStorage(blob, filename, 'request', insertedRequest.id);
              console.log('Request PDF saved to storage');
            } catch (storageErr) {
              console.warn('Could not save request PDF to storage:', storageErr);
            }

            // Auto-download PDF for user
            downloadPDF(blob, filename);
            console.log('Request confirmation PDF generated and downloaded');
          } catch (pdfErr) {
            console.error('Failed to generate request PDF:', pdfErr);
            // Don't block the flow if PDF generation fails
          }
        }
      } else {
        console.warn('Not logged in; skipping user_requests insert');
      }
    } catch (e) {
      console.error('Error saving to user_requests:', e);
    }

    let msg = `Request submitted!\n\nReference: ${request.id}\nTotal: $${cartTotal.toLocaleString()}\n\nOur team will respond within 2-4 hours.\n\n📄 A PDF confirmation has been downloaded for your records.`;

    setChatHistory(prev => prev.map(c =>
      c.id === activeChat ? { ...c, messages: [...c.messages, { role: 'assistant', content: msg }] } : c
    ));

    setCartItems([]);
    setSelectedPaymentMethod(null);
  }, [cartItems, cartTotal, activeChat, selectedPaymentMethod, userHasNFT, usedNFTBenefitThisYear, conversationalAI, connectedWallet]);

  const handleSearch = async (query, conversationHistory = []) => {
    setIsSearching(true);
    setLoadingStage('searching');
    setAssistantTyping(true);

    try {
      const context = conversationalAI.extractContext(conversationHistory);
      const lowerQuery = query.toLowerCase();
      const passengers = parseInt(lowerQuery.match(/(\d+)\s+(?:passenger|person|people|pax)/)?.[1]) || context.passengers || null;

      // Extract location: prefer "in <location>", then fallback to "to <location>"
      const inMatch = lowerQuery.match(/\bin\s+([a-z\s]+?)(?:\s+for|\s+next|\s+this|,|$)/i);
      const toMatch = lowerQuery.match(/\bto\s+([a-z\s]+?)(?:\s+for|,|$)/i);
      const fromMatch = lowerQuery.match(/\bfrom\s+([a-z\s]+?)(?:\s+to|\s+for|,|$)/i);
      const location = (inMatch?.[1] || toMatch?.[1] || context.to || '').trim() || null;
      const fromLocation = (fromMatch?.[1] || context.from || '').trim() || null;

      // Determine specific service type from query (check most specific first)
      let serviceType = null;
      if (lowerQuery.match(/empty\s*legs?|emptyleg/)) {
        serviceType = 'emptyLegs';
      } else if (lowerQuery.match(/helicopter|heli/)) {
        serviceType = 'helicopters';
      } else if (lowerQuery.match(/private\s*jet|jet|aircraft|plane/)) {
        serviceType = 'aircraft';
      } else if (lowerQuery.match(/yacht|boat|vessel/)) {
        serviceType = 'yachts';
      } else if (lowerQuery.match(/car|chauffeur|driver|taxi|transfer/)) {
        serviceType = 'luxuryCars';
      }

      // Extract simple date windows (support "next week")
      let dateFrom = null, dateTo = null;
      if (lowerQuery.includes('next week')) {
        const now = new Date();
        const day = now.getDay(); // 0 Sun - 6 Sat
        const daysUntilNextMonday = ((8 - day) % 7) || 7;
        const start = new Date(now);
        start.setDate(now.getDate() + daysUntilNextMonday);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        dateFrom = start.toISOString().slice(0, 10);
        dateTo = end.toISOString().slice(0, 10);
      }

      console.log('🔍 Search Parameters:', {
        serviceType,
        query,
        passengers,
        location,
        fromLocation,
        dateFrom,
        dateTo
      });

      // Call UnifiedSearchService but filter results based on requested service
      const results = await UnifiedSearchService.searchAll({
        passengers,
        location,
        fromLocation,
        dateFrom,
        dateTo,
        q: query,
        serviceTypes: serviceType ? [serviceType] : null // Pass as array
      });

      console.log('📦 Raw search results:', results);

      // Filter results to only include requested service type
      let filteredResults = { totalResults: 0 };

      if (serviceType) {
        // User asked for a SPECIFIC service type - only show that type
        if (serviceType === 'emptyLegs') {
          filteredResults = {
            totalResults: results.emptyLegs?.length || 0,
            emptyLegs: results.emptyLegs || []
          };
        } else if (serviceType === 'aircraft') {
          filteredResults = {
            totalResults: results.aircraft?.length || 0,
            aircraft: results.aircraft || []
          };
        } else if (serviceType === 'helicopters') {
          filteredResults = {
            totalResults: results.helicopters?.length || 0,
            helicopters: results.helicopters || []
          };
        } else if (serviceType === 'yachts') {
          filteredResults = {
            totalResults: results.yachts?.length || 0,
            yachts: results.yachts || []
          };
        } else if (serviceType === 'luxuryCars') {
          filteredResults = {
            totalResults: results.luxuryCars?.length || 0,
            luxuryCars: results.luxuryCars || []
          };
        }
      } else {
        // No specific service type requested - show all available results
        filteredResults = results;
      }

      console.log('📊 Filtered results:', filteredResults);

      if (filteredResults.totalResults === 0) {
        // Use AI to generate intelligent "no results" response
        setAssistantTyping(true);
        
        try {
          const systemPrompt = getSystemPrompt();
          claudeService.setSystemPrompt(systemPrompt);

          const noResultsContext = `The user searched for "${query}" but we didn't find any exact matches in our current inventory.

As their luxury travel consultant:
1. Acknowledge their specific request warmly
2. Explain that we'll create a custom request for them
3. Mention our team will respond within 2-4 hours with personalized options
4. Ask if they'd like to adjust their criteria or explore alternatives
5. Keep it helpful and solution-oriented (2-3 sentences)`;

          const aiResponse = await claudeService.sendMessage([
            { role: 'user', content: noResultsContext }
          ], {
            maxTokens: 200,
            temperature: 0.7
          });

          let newMsgIndex = 0;
          setChatHistory(prev => prev.map(c => {
            if (c.id === activeChat) {
              const updatedMessages = [...c.messages, { role: 'assistant', content: withEmpathy(aiResponse) }];
              newMsgIndex = updatedMessages.length - 1;
              return { ...c, messages: updatedMessages };
            }
            return c;
          }));
          setTimeout(() => setTypingMessageIndex(newMsgIndex), 50);
        } catch (error) {
          const fallbackResponse = `I understand you're looking for "${query}" - while I don't see exact matches right now, I'm creating a custom request for our team. They'll respond within 2-4 hours with personalized options. Would you like to adjust your criteria or explore alternative solutions?`;

          let fallbackMsgIndex = 0;
          setChatHistory(prev => prev.map(c => {
            if (c.id === activeChat) {
              const updatedMessages = [...c.messages, { role: 'assistant', content: withEmpathy(fallbackResponse) }];
              fallbackMsgIndex = updatedMessages.length - 1;
              return { ...c, messages: updatedMessages };
            }
            return c;
          }));
          setTimeout(() => setTypingMessageIndex(fallbackMsgIndex), 50);
        } finally {
          setAssistantTyping(false);
        }
        
        setIsSearching(false);
        return;
      }

      const formattedTabs = [];

      // Only add tabs for services that have results
      if (filteredResults.aircraft?.length > 0) {
        formattedTabs.push({
          id: 'jets',
          title: 'Private Jets',
          count: filteredResults.aircraft.length,
          items: filteredResults.aircraft.map(aircraft => ({
            ...aircraft,
            type: 'jets',
            images: ImageUtils.getAllImageUrls(aircraft.images, 'aircraft-images'),
            primaryImage: ImageUtils.getPrimaryImage(aircraft.images),
            price: aircraft.hourly_rate_eur
          }))
        });
      }

      if (filteredResults.emptyLegs?.length > 0) {
        formattedTabs.push({
          id: 'empty_legs',
          title: 'Empty Legs',
          count: filteredResults.emptyLegs.length,
          items: filteredResults.emptyLegs.map(leg => {
            const routeTitle = `${
              leg.from_iata || leg.from || leg.from_city || leg.departure_city || 'Origin'
            } → ${
              leg.to_iata || leg.to || leg.to_city || leg.arrival_city || 'Destination'
            }`;
            const whenText = [leg.departure_date, leg.departure_time].filter(Boolean).join(' ');
            const opText = leg.operator ? ` • ${leg.operator}` : '';
            const subtitle = `${whenText}${opText}`.trim();

            // Use price_usd directly from database (no conversion needed)
            let priceUSD = 0;
            let originalPrice = 0;
            let originalCurrency = 'USD';

            if (leg.price_usd && leg.price_usd > 0) {
              // Use price_usd from database
              priceUSD = parseFloat(leg.price_usd);
              originalPrice = priceUSD;
              originalCurrency = 'USD';
            } else if (leg.price_in_usd && leg.price_in_usd > 0) {
              // Fallback to price_in_usd
              priceUSD = parseFloat(leg.price_in_usd);
              originalPrice = priceUSD;
              originalCurrency = 'USD';
            } else if (leg.price && leg.price > 0) {
              // Final fallback to price field
              priceUSD = parseFloat(leg.price);
              originalPrice = priceUSD;
              originalCurrency = 'USD';
            }

            // Add VAT (8.1%) for total price calculation
            const vatAmount = Math.round(priceUSD * 0.081);
            const totalWithFees = priceUSD + vatAmount;

            const imageUrl = leg.image_url || leg.image_url_1 || leg.image_url_2 || leg.image_url_3 || leg.image_url_4 || leg.image_url_5 || (leg.aircraft?.images ? ImageUtils.getPrimaryImage(leg.aircraft.images) : null);

            const details = {
              'Aircraft Type': leg.aircraft_type || leg.aircraft_type_original || '—',
              'Category': leg.category || '—',
              'Capacity': leg.capacity || '—',
              'Registration': leg.registration || '—',
              'Operator': leg.operator || '—',
              'From City': leg.from_city || leg.from || '—',
              'From Country': leg.from_country || '—',
              'From IATA': leg.from_iata || '—',
              'Departure Time': leg.departure_time || '—',
              'To City': leg.to_city || leg.to || '—',
              'To Country': leg.to_country || '—',
              'To IATA': leg.to_iata || '—',
              'Arrival Time': leg.arrival_time || '—',
              'Departure Date': leg.departure_date || '—',
              'Currency': 'USD',
              'Booking Link': leg.booking_link || '—'
            };

            const description = `Empty Leg ${routeTitle}\n` +
              `Date: ${leg.departure_date || 'TBA'} ${leg.departure_time || ''}\n` +
              `Aircraft: ${details['Aircraft Type']} (${details['Category']})\n` +
              `Capacity: ${details['Capacity']}\n` +
              `Operator: ${details['Operator']}\n` +
              `Registration: ${details['Registration']}`;

            return {
              ...leg,
              type: 'empty_legs',
              title: routeTitle,
              subtitle,
              currency: 'USD',
              // Price fields - all in USD (Base + VAT only)
              price: priceUSD,              // Base price in USD
              price_usd: priceUSD,          // Explicit USD field
              basePrice: priceUSD,          // For cart calculations
              vat_amount: vatAmount,
              totalWithFee: totalWithFees,  // Total with VAT
              // Original price info for reference
              original_price: originalPrice,
              original_currency: originalCurrency,
              // Display fields
              priceUnit: undefined,
              imageUrl,
              details,
              description
            };
          })
        });
      }

      if (filteredResults.helicopters?.length > 0) {
        formattedTabs.push({
          id: 'helicopters',
          title: 'Helicopters',
          count: filteredResults.helicopters.length,
          items: filteredResults.helicopters.map(heli => ({
            ...heli,
            type: 'helicopters',
            images: ImageUtils.getAllImageUrls(heli.images, 'helicopter-images'),
            primaryImage: ImageUtils.getPrimaryImage(heli.images),
            price: heli.hourly_rate_eur
          }))
        });
      }

      if (filteredResults.yachts?.length > 0) {
        formattedTabs.push({
          id: 'yachts',
          title: 'Yachts',
          count: filteredResults.yachts.length,
          items: filteredResults.yachts.map(yacht => ({
            ...yacht,
            type: 'yachts',
            price: yacht.daily_rate_eur,
            images: ImageUtils.getAllImageUrls(yacht.images, 'yacht-images'),
            primaryImage: ImageUtils.getPrimaryImage(yacht.images)
          }))
        });
      }

      // HIDDEN: Adventure packages - not shown in AI Chat
      // const adventures = filteredResults.adventures || [];
      // if (adventures.length > 0) {
      //   formattedTabs.push({
      //     id: 'adventures',
      //     title: 'Fixed Offers & Adventures',
      //     count: adventures.length,
      //     items: adventures.map(adv => ({
      //       ...adv,
      //       type: 'adventures',
      //       name: adv.title || adv.name,
      //       title: adv.title || adv.name,
      //       subtitle: `${adv.origin || ''} → ${adv.destination || ''}`.trim() || adv.description,
      //       price: adv.price_eur || adv.price,
      //       description: adv.description,
      //       images: ImageUtils.getAllImageUrls(adv.images || adv.image_url, 'adventure-images'),
      //       primaryImage: ImageUtils.getPrimaryImage(adv.images || adv.image_url),
      //       details: {
      //         'Package': adv.title || adv.name,
      //         'Route': `${adv.origin || 'TBD'} → ${adv.destination || 'TBD'}`,
      //         'Duration': adv.duration || '—',
      //         'Price': adv.price_eur ? `$${adv.price_eur.toLocaleString()}` : '—',
      //         'Description': adv.description || '—'
      //       }
      //     }))
      //   });
      // }

      // Use static category-based ground transport options (consistent with TaxiConciergeView)
      const groundTransportCategories = [
        { id: 'economy', name: 'Economy', seats: 4, priceMinCHF: 3.50, priceMaxCHF: 6.00, description: 'Comfortable sedan', image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_251110158_bmw-7-2015-seitenansicht_4x.png' },
        { id: 'business', name: 'Business', seats: 4, priceMinCHF: 4.50, priceMaxCHF: 7.50, description: 'Premium sedan', image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_253116175_mercedes-benz-s-2018-seitenansicht_4x.png' },
        { id: 'first-class', name: 'First Class', seats: 4, priceMinCHF: 6.00, priceMaxCHF: 9.00, description: 'Luxury sedan', image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_253111171_mercedes-benz-s-2020-seitenansicht_4x.png' },
        { id: 'van', name: 'Van', seats: 7, priceMinCHF: 6.50, priceMaxCHF: 9.00, description: 'Spacious van for groups', image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/vito.jpg' },
        { id: 'vip', name: 'VIP', seats: 4, priceMinCHF: 8.00, priceMaxCHF: 12.00, description: 'Ultra-luxury experience', image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_255110169_mercedes-benz-s-2020-seitenansicht_4x.png' }
      ];

      // Show ground transport categories if user asked for cars/taxi/transfer
      if (filteredResults.luxuryCars?.length > 0 || serviceType === 'luxuryCars') {
        formattedTabs.push({
          id: 'taxi_cars',
          title: 'Ground Transport',
          count: groundTransportCategories.length,
          items: groundTransportCategories.map(cat => ({
            ...cat,
            type: 'taxi_cars',
            title: cat.name,
            subtitle: `${cat.seats} seats • ${cat.description}`,
            price_range: `CHF ${cat.priceMinCHF.toFixed(2)} - ${cat.priceMaxCHF.toFixed(2)} per km`,
            price_min: cat.priceMinCHF,
            price_max: cat.priceMaxCHF,
            images: cat.image ? [cat.image] : [],
            primaryImage: cat.image,
            // IMPORTANT: Include route info for ground transport requests
            pickup_location: fromLocation || '',
            dropoff_location: location || '',
            from: fromLocation || '',
            to: location || '',
            service_type: cat.name,
            category: cat.name,
            route: fromLocation && location ? `${fromLocation} → ${location}` : '',
            details: {
              'Category': cat.name,
              'Seats': cat.seats,
              'Description': cat.description,
              'Price per km': `CHF ${cat.priceMinCHF.toFixed(2)} - ${cat.priceMaxCHF.toFixed(2)}`,
              'Availability': 'Available',
              'Pickup': fromLocation || 'To be confirmed',
              'Dropoff': location || 'To be confirmed'
            }
          }))
        });
      }

      setSearchResults({ tabs: formattedTabs, query, results: filteredResults });

      // Use AI to generate intelligent, consultative search summary with TOP 3 RECOMMENDATIONS
      setAssistantTyping(true);

      try {
        const systemPrompt = getSystemPrompt();
        claudeService.setSystemPrompt(systemPrompt);

        // Get top 3 results from the first tab
        const topTab = formattedTabs[0];
        const topResults = topTab?.items?.slice(0, 3) || [];

        let topResultsSummary = '';
        if (topResults.length > 0) {
          topResultsSummary = `\n\nTop ${topResults.length} recommendations:\n` + topResults.map((item, idx) => {
            const name = item.name || item.title || item.model || item.aircraft_type || 'Option';
            const price = item.price ? `$${item.price}${item.priceUnit || '/hr'}` : 'Price on request';
            const capacity = item.capacity || item.passengers || item.max_passengers || '';
            return `${idx + 1}. ${name} - ${price}${capacity ? ` (${capacity} pax)` : ''}`;
          }).join('\n');
        }

        const searchContext = `User searched for "${query}" and we found ${filteredResults.totalResults} options:
${formattedTabs.map(tab => `- ${tab.title}: ${tab.count} options available`).join('\n')}${topResultsSummary}

As their luxury travel consultant, provide an enthusiastic response that:
1. Acknowledges their specific request
2. Mentions you found ${filteredResults.totalResults} options
3. RECOMMEND the TOP option briefly (why it's a good fit)
4. Mention they can see all options below
5. Ask if they'd like to know more about a specific aircraft or have any preferences (budget, speed, luxury level)
6. Keep it conversational and consultative (3-4 sentences max)`;

        const aiResponse = await claudeService.sendMessage([
          { role: 'user', content: searchContext }
        ], {
          maxTokens: 250,
          temperature: 0.8
        });

        let searchMsgIndex = 0;
        setChatHistory(prev => prev.map(c => {
          if (c.id === activeChat) {
            const updatedMessages = [...c.messages, { role: 'assistant', content: withEmpathy(aiResponse) }];
            searchMsgIndex = updatedMessages.length - 1;
            return { ...c, messages: updatedMessages };
          }
          return c;
        }));
        setTimeout(() => setTypingMessageIndex(searchMsgIndex), 50);
      } catch (error) {
        // Enhanced fallback response with TOP recommendation
        const topTab = formattedTabs[0];
        const topResult = topTab?.items?.[0];

        let response = `Perfect! I found ${filteredResults.totalResults} great options for you`;

        if (topResult) {
          const name = topResult.name || topResult.title || topResult.model || topResult.aircraft_type;
          const price = topResult.price ? `$${topResult.price}${topResult.priceUnit || '/hr'}` : '';
          response += `. I'd especially recommend the ${name}`;
          if (price) response += ` at ${price}`;
          if (topResult.capacity || topResult.passengers) response += ` (${topResult.capacity || topResult.passengers} passengers)`;
          response += ' - it\'s an excellent fit for your requirements';
        }

        if (serviceType === 'emptyLegs') response += '. These empty legs offer fantastic 30-50% savings';
        else if (serviceType === 'aircraft') response += '. You\'ll have complete flexibility for your journey';
        else if (serviceType === 'helicopters') response += '. Perfect for short transfers and avoiding traffic';

        response += '. Browse all options below, or let me know if you have specific preferences like budget range or luxury level!';

        let fallbackSearchMsgIndex = 0;
        setChatHistory(prev => prev.map(c => {
          if (c.id === activeChat) {
            const updatedMessages = [...c.messages, { role: 'assistant', content: withEmpathy(response) }];
            fallbackSearchMsgIndex = updatedMessages.length - 1;
            return { ...c, messages: updatedMessages };
          }
          return c;
        }));
        setTimeout(() => setTypingMessageIndex(fallbackSearchMsgIndex), 50);
      } finally {
        setAssistantTyping(false);
      }

      if (location) fetchWeather(location);

    } catch (error) {
      console.error('Search error:', error);
      setChatHistory(prev => prev.map(c => 
        c.id === activeChat 
          ? { ...c, messages: [...c.messages, { role: 'assistant', content: 'Error searching. Please try again.' }] }
          : c
      ));
    } finally {
      setIsSearching(false);
    }
  };

  // Save chat to database
  const saveChat = async (chatId, messages, title = null) => {
    if (!user?.id || chatId === 'new') return;

    // Check if chat exists in database (UUID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chatId);

    if (isUUID) {
      // Update existing chat
      await chatService.updateChatMessages(chatId, messages, user.id);
      if (title) {
        await chatService.updateChatTitle(chatId, title, user.id);
      }
    }
  };

  // NEW CLAUDE-BASED MESSAGE HANDLER (via secure Edge Function)
  const handleSendMessage = async (message) => {
    if (!message.trim() || isProcessing) return;
    // NOTE: anthropicRef check removed - claudeEdgeService is always available

    const existingChat = chatHistory.find(c => c.id === activeChat);

    // SKIP CHAT LIMITS FOR TESTING - chat limits disabled
    // const currentMsgCount = existingChat?.messages?.filter(m => m.role === 'user').length || 0;
    // const hasUnlimitedMessages = userSubscriptionLimits?.unlimited_messages === true;
    // if (!hasUnlimitedMessages && currentMsgCount >= MAX_MESSAGES_PER_CHAT && activeChat !== 'new') {
    //   setMessageLimitReached(true);
    //   return;
    // }
    // if (!hasUnlimitedMessages) {
    //   setMessageCount(currentMsgCount + 1);
    // }

    setShowWelcomeMessage(false);
    const userMessage = { role: 'user', content: message };
    let workingChatId = activeChat;

    // Check if this is the first user message (chat only has welcome message)
    const isFirstUserMessage = existingChat && existingChat.messages.length === 1 &&
                                 existingChat.messages[0].role === 'assistant' &&
                                 existingChat.title === 'New Chat';

    if (isFirstUserMessage) {
      // Update chat title based on first user message
      const newTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '');

      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, title: newTitle, messages: [...c.messages, userMessage] }
          : c
      ));

      await chatService.updateChatMessages(activeChat, [...existingChat.messages, userMessage], user.id);

      // Update title in database
      try {
        await chatService.updateChatTitle(activeChat, newTitle, user.id);
      } catch (error) {
        console.warn('Failed to update chat title:', error);
      }
    } else if (activeChat === 'new') {
      // Create new chat when starting from category overview
      const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');

      console.log('🆕 Creating new chat from service bubble:', { title, userId: user?.id });

      if (!user?.id) {
        console.error('❌ No user ID found - user should be logged in!');
        setToast({ message: 'Please log in to start a chat', type: 'error' });
        setIsProcessing(false);
        return;
      }

      // SKIP CHAT LIMITS FOR TESTING
      // if (!isAdmin) {
      //   try {
      //     const { canStart, chatsUsed, chatsLimit } = await subscriptionService.canStartNewChat(user.id);
      //     if (!canStart) {
      //       setChatLimitReached(true);
      //       setToast({
      //         message: `You've used your free chat. Upgrade to continue booking luxury travel.`,
      //         type: 'warning'
      //       });
      //       return;
      //     }
      //   } catch (error) {
      //     console.warn('Failed to check chat limit:', error);
      //   }
      // }

      // Reset message count for new chat
      setMessageCount(0);
      setMessageLimitReached(false);

      let chatId, chatTitle;

      try {
        const { success, chat } = await chatService.createChat(user.id, title, userMessage);

        if (success && chat) {
          chatId = chat.id;
          chatTitle = chat.title;
          console.log('✅ Chat created in database:', { id: chatId, title: chatTitle });

          // SKIP SUBSCRIPTION TRACKING FOR TESTING
          // if (!isAdmin) {
          //   try {
          //     await subscriptionService.incrementChatUsage(user.id);
          //     await subscriptionService.createChatSession(user.id, chatId);
          //   } catch (usageError) {
          //     console.warn('Failed to update chat usage:', usageError);
          //   }
          // }
        } else {
          throw new Error('Chat creation returned false');
        }
      } catch (error) {
        console.error('❌ Database error, creating temporary local chat:', error);
        // Create temporary local chat if database fails
        chatId = `temp-${Date.now()}`;
        chatTitle = title;
        setToast({ message: 'Using offline mode (database timeout)', type: 'warning' });
      }

      const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
      const newChat = {
        id: chatId,
        title: chatTitle,
        date: 'Just now',
        messages: [userMessage, loadingMsg]
      };

      console.log('✅ Adding chat to history:', { id: chatId, title: chatTitle });

      // Update chat history and active chat TOGETHER
      setChatHistory(prev => {
        const updated = [newChat, ...prev];
        console.log('📝 Chat history updated, total chats:', updated.length);
        return updated;
      });

      setActiveChat(chatId);
      workingChatId = chatId;

      console.log('✅ Active chat switched to:', chatId);
    } else {
      // Regular message in existing chat - add loading message for AI response
      const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, userMessage, loadingMsg] }
          : c
      ));

      if (existingChat) {
        await chatService.updateChatMessages(activeChat, [...existingChat.messages, userMessage], user.id);
      }
    }

    setCurrentMessage('');
    setIsProcessing(true);

    // Check if user is confirming a charter request
    const lowerMessage = message.toLowerCase().trim();
    const isConfirmation = /^(confirm|send it|yes send|submit|book it|go ahead|yes please|ja|bestätigen|abschicken)$/i.test(lowerMessage);

    // Check if previous messages contain a charter request context
    const recentMessages = existingChat?.messages?.slice(-5) || [];
    const hasCharterRequestContext = recentMessages.some(m =>
      m.role === 'assistant' &&
      (m.content?.includes('custom charter request') ||
       m.content?.includes('booking request') ||
       m.content?.includes('Route:') && m.content?.includes('Date:') && m.content?.includes('Passengers:'))
    );

    if (isConfirmation && hasCharterRequestContext) {
      // Extract details from previous assistant message
      const lastAssistantMsg = [...recentMessages].reverse().find(m => m.role === 'assistant');

      // Add confirmation message with action button
      const confirmationMsg = {
        role: 'assistant',
        content: '✅ Perfect! Click the button below to submit your charter request:',
        action: 'send_charter_request',
        requestDetails: lastAssistantMsg?.content || ''
      };

      setChatHistory(prev => prev.map(c =>
        c.id === workingChatId
          ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), confirmationMsg] }
          : c
      ));
      setIsProcessing(false);
      return;
    }

    // Handle Multi-Leg Chat Mode - Parse leg details from user message
    if (multiLegChatMode) {
      // Try to parse city/airport, date, and time from user message
      const cityPattern = /(?:from\s+)?(\w+(?:\s+\w+)?)\s*(?:to|→|->)\s*(\w+(?:\s+\w+)?)|(?:to\s+)?(\w+(?:\s+\w+)?)/i;
      const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]?\d{0,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*(?:\s+\d{2,4})?)/i;
      const timePattern = /(\d{1,2}[:\.]?\d{0,2}\s*(?:am|pm)?|\d{2}:\d{2})/i;

      const cityMatch = message.match(cityPattern);
      const dateMatch = message.match(datePattern);
      const timeMatch = message.match(timePattern);

      // If we have at least a city mention, show parsing feedback
      if (cityMatch) {
        const parsedCity = cityMatch[2] || cityMatch[3] || cityMatch[1];
        const parsedDate = dateMatch ? dateMatch[1] : null;
        const parsedTime = timeMatch ? timeMatch[1] : null;

        // Add loading message
        const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
        setChatHistory(prev => prev.map(c =>
          c.id === workingChatId
            ? { ...c, messages: [...c.messages, loadingMsg] }
            : c
        ));

        setTimeout(() => {
          // Create a leg data object
          const newLegData = {
            city: parsedCity?.trim(),
            code: parsedCity?.substring(0, 3).toUpperCase(),
            date: parsedDate || 'TBD',
            time: parsedTime || 'TBD',
            stopDuration: 0
          };

          // Store pending leg data
          setPendingLegData(newLegData);

          // Create response message asking to confirm
          const confirmContent = `Got it! Here's what I understood:

**Destination:** ${newLegData.city} (${newLegData.code})
**Date:** ${newLegData.date}
**Time:** ${newLegData.time}

Click **"Add to Route"** to confirm this stop, or provide corrections.`;

          const responseMsg = {
            role: 'assistant',
            content: confirmContent,
            isMultiLegChat: true,
            pendingLeg: newLegData
          };

          setChatHistory(prev => prev.map(c =>
            c.id === workingChatId
              ? {
                  ...c,
                  messages: c.messages.map((m, i) =>
                    i === c.messages.length - 1 && m.isLoading ? responseMsg : m
                  )
                }
              : c
          ));
          setIsProcessing(false);
        }, 600);
        return;
      }
    }

    // Build conversation history - handle new chat creation case
    let conversationHistory;

    if (isFirstUserMessage && existingChat) {
      // First message after welcome: [welcome, userMessage]
      conversationHistory = [...existingChat.messages, userMessage];
    } else if (workingChatId !== activeChat) {
      // Just created a new chat - use only the user message
      conversationHistory = [userMessage];
    } else {
      // Existing chat: find it and use all messages
      const currentChatObj = chatHistory.find(c => c.id === workingChatId);
      if (currentChatObj) {
        conversationHistory = [...currentChatObj.messages.filter(msg => !msg.isLoading), userMessage];
      } else {
        // Fallback for any edge case
        conversationHistory = [userMessage];
      }
    }

    console.log('📝 Conversation history being sent to Claude:', conversationHistory);

    // Loading message is already added when user message was added (both for new and existing chats)

    try {
      const systemPrompt = getSystemPrompt();

      // Filter out UI-only messages - only user/assistant are valid Claude roles
      // place, hotels, adventures, confirm_booking, results, loading are UI-only
      const uiOnlyRoles = ['results', 'place', 'hotels', 'adventures', 'confirm_booking', 'loading'];
      const claudeMessages = conversationHistory
        .filter(msg => !uiOnlyRoles.includes(msg.role) && !msg.isLoading)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Claude handles ALL searches including wines - same as empty legs, jets, etc.
      console.log('🔧 Tools being sent to Claude:', aiToolDefinitions.map(t => t.name));
      console.log('🔧 searchWines tool definition:', aiToolDefinitions.find(t => t.name === 'searchWines'));

      const response = await claudeEdgeService.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" }
          }
        ],
        messages: claudeMessages,
        tools: aiToolDefinitions.map((tool, index) =>
          index === aiToolDefinitions.length - 1
            ? { ...tool, cache_control: { type: "ephemeral" } }
            : tool
        ),
        tool_choice: { type: "auto" }
      });

      console.log('🤖 Claude response:', response);

      if (response.stop_reason === 'tool_use') {
        // FIRST: Check if Claude sent any text message BEFORE the tool call
        const textBlock = response.content.find(block => block.type === 'text');
        if (textBlock && textBlock.text && textBlock.text.trim()) {
          const initialMessage = { role: 'assistant', content: textBlock.text };

          // Remove loading message and add actual response
          setChatHistory(prev => prev.map(c =>
            c.id === workingChatId
              ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), initialMessage] }
              : c
          ));

          await chatService.updateChatMessages(workingChatId, [...conversationHistory, initialMessage], user.id);
        }
        // NOTE: Keep loading message visible - it will be removed when follow-up response is added

        const toolUse = response.content.find(block => block.type === 'tool_use');
        if (toolUse) {
          console.log('🔧 Tool used:', toolUse.name, toolUse.input);

          const toolResult = await executeTool(toolUse.name, toolUse.input);
          console.log('📊 Tool result:', toolResult);

          // Format and save results as message
          if (toolResult.success) {
            let tabs = [];

            // Handle location restrictions (sanctioned/limited coverage)
            if (toolResult.restriction) {
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify({
                  restriction: toolResult.restriction.type,
                  message: toolResult.restriction.message
                })
              });
              // Don't process results, let Claude handle the restriction message
            } else if (toolUse.name === 'searchEmptyLegs' && toolResult.results && toolResult.results.length > 0) {
              tabs.push({
                id: 'emptylegs',
                title: 'Empty Legs',
                count: toolResult.results.length,
                items: toolResult.results
              });
            } else if (toolUse.name === 'searchPrivateJets' && toolResult.results && toolResult.results.length > 0) {
              tabs.push({
                id: 'jets',
                title: 'Private Jets',
                count: toolResult.results.length,
                items: toolResult.results
              });
            } else if (toolUse.name === 'searchHelicopters' && toolResult.results && toolResult.results.length > 0) {
              tabs.push({
                id: 'helicopters',
                title: 'Helicopters',
                count: toolResult.results.length,
                items: toolResult.results
              });
            } else if (toolUse.name === 'searchYachtsAndAdventures' && toolResult.results) {
              if (toolResult.results.yachts && toolResult.results.yachts.length > 0) {
                tabs.push({
                  id: 'yachts',
                  title: 'Yachts',
                  count: toolResult.results.yachts.length,
                  items: toolResult.results.yachts
                });
              }
              // HIDDEN: Adventures not shown in AI Chat
              // if (toolResult.results.adventures && toolResult.results.adventures.length > 0) {
              //   tabs.push({
              //     id: 'adventures',
              //     title: 'Adventures',
              //     count: toolResult.results.adventures.length,
              //     items: toolResult.results.adventures
              //   });
              // }
            } else if (toolUse.name === 'searchLuxuryCars' && toolResult.results && toolResult.results.length > 0) {
              tabs.push({
                id: 'luxury_cars',
                title: 'Luxury Cars',
                count: toolResult.results.length,
                items: toolResult.results
              });
            } else if (toolUse.name === 'searchWines' && toolResult.results && toolResult.results.length > 0) {
              tabs.push({
                id: 'wines',
                title: 'Wines',
                count: toolResult.results.length,
                items: toolResult.results
              });
            } else if (toolUse.name === 'searchDelicatesse' && toolResult.results && toolResult.results.length > 0) {
              tabs.push({
                id: 'delicatesse',
                title: 'Delicacies',
                count: toolResult.results.length,
                items: toolResult.results
              });
            } else if (toolUse.name === 'searchCigars' && toolResult.results && toolResult.results.length > 0) {
              tabs.push({
                id: 'cigars',
                title: 'Premium Cigars',
                count: toolResult.results.length,
                items: toolResult.results
              });
            } else if (toolUse.name === 'addToCart' && toolResult.action === 'ADD_TO_CART' && toolResult.cartItem) {
              // Instead of auto-adding to cart, show action buttons for user to confirm
              const confirmMessage = {
                role: 'assistant',
                content: `Ready to proceed with your booking:\n\n✈️ **${toolResult.cartItem.name}**\n${toolResult.cartItem.from && toolResult.cartItem.to ? `📍 ${toolResult.cartItem.from} → ${toolResult.cartItem.to}\n` : ''}${toolResult.cartItem.date ? `📅 ${toolResult.cartItem.date}${toolResult.cartItem.time ? ` at ${toolResult.cartItem.time}` : ''}\n` : ''}${toolResult.cartItem.passengers ? `👥 ${toolResult.cartItem.passengers} passengers\n` : ''}${toolResult.cartItem.catering ? `🥤 ${toolResult.cartItem.catering === 'complimentary' ? 'Complimentary refreshments' : toolResult.cartItem.catering}\n` : ''}\nChoose how you'd like to proceed:`,
                action: 'confirm_booking',
                bookingData: toolResult.cartItem
              };

              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), confirmMessage] }
                  : c
              ));
              setIsProcessing(false);
              return; // Exit early - don't continue to AI follow-up
            } else if (toolUse.name === 'addCustomExtra' && toolResult.cartItem) {
              // Show action buttons for custom extras too
              const confirmMessage = {
                role: 'assistant',
                content: `Ready to add this custom item:\n\n🍷 **${toolResult.cartItem.name}**\n📦 Category: ${toolResult.cartItem.category}\n💰 Est. Price: $${(toolResult.cartItem.price || 0).toLocaleString()}\n${toolResult.cartItem.quantity > 1 ? `📊 Quantity: ${toolResult.cartItem.quantity}\n` : ''}\nChoose how you'd like to proceed:`,
                action: 'confirm_booking',
                bookingData: toolResult.cartItem
              };

              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), confirmMessage] }
                  : c
              ));
              setIsProcessing(false);
              return; // Exit early - don't continue to AI follow-up
            } else if (toolUse.name === 'lookupLuxuryItem' && toolResult.cartItem) {
              // Show luxury item with option to add to cart
              const item = toolResult.item || {};
              const categoryEmoji = {
                wine: '🍷',
                champagne: '🥂',
                spirits: '🥃',
                caviar: '🐟',
                cigars: '🚬',
                flowers: '💐',
                cake: '🎂',
                decorations: '🎊',
                music: '🎵',
                photography: '📸',
                catering: '🍽️',
                other: '✨'
              };
              const emoji = categoryEmoji[item.category] || '✨';

              const confirmMessage = {
                role: 'assistant',
                content: `Found: **${item.name}**\n\n${emoji} Category: ${item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}\n💰 Est. Price: ${item.unitPriceFormatted || `$${(item.unitPrice || 0).toLocaleString()}`}${item.quantity > 1 ? ` × ${item.quantity} = ${item.totalPriceFormatted}` : ''}\n${toolResult.availability?.status === 'requires_confirmation' ? '\n⏳ Availability requires confirmation by our team' : ''}\n\nWould you like to add this to your cart?`,
                action: 'confirm_booking',
                bookingData: toolResult.cartItem
              };

              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), confirmMessage] }
                  : c
              ));
              setIsProcessing(false);
              return; // Exit early - don't continue to AI follow-up
            } else if (toolUse.name === 'lookupPlaceAddress' && toolResult.place) {
              // Show place card with rich Google Places data
              const placeMessage = {
                role: 'place',
                content: toolResult.message || `Found ${toolResult.place.name}`,
                place: toolResult.place,
                alternatives: toolResult.alternatives || [],
                canArrangeTransfer: toolResult.canArrangeTransfer
              };

              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), placeMessage] }
                  : c
              ));

              // Get AI follow-up with a summarized version (to avoid token limits)
              const placeSummary = {
                success: true,
                place: {
                  name: toolResult.place.name,
                  fullAddress: toolResult.place.fullAddress,
                  category: toolResult.place.category,
                  rating: toolResult.place.rating,
                  reviewCount: toolResult.place.reviewCount,
                  priceLevel: toolResult.place.priceLevel,
                  phone: toolResult.place.phone,
                  website: toolResult.place.website ? 'Available' : null,
                  openNow: toolResult.place.openingHours?.openNow
                },
                canArrangeTransfer: toolResult.canArrangeTransfer
              };

              try {
                const placeFollowUp = await claudeEdgeService.messages.create({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 512,
                  system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
                  messages: [
                    ...claudeMessages,
                    { role: 'assistant', content: response.content },
                    { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(placeSummary) }] }
                  ]
                });

                const placeAiText = placeFollowUp.content.find(block => block.type === 'text')?.text;
                if (placeAiText) {
                  const placeAiMessage = { role: 'assistant', content: placeAiText };
                  setChatHistory(prev => prev.map(c =>
                    c.id === workingChatId
                      ? { ...c, messages: [...c.messages, placeAiMessage] }
                      : c
                  ));
                }
              } catch (followUpError) {
                console.warn('Place follow-up failed:', followUpError);
                // Place card is already shown, so this is not critical
              }

              setIsProcessing(false);
              return; // Exit early - place card and optional follow-up handled
            } else if (toolUse.name === 'searchHotels' && toolResult.results?.length > 0) {
              // Show hotel search results
              const hotelMessage = {
                role: 'hotels',
                content: toolResult.message || `Found ${toolResult.results.length} hotels in ${toolResult.city}`,
                hotels: toolResult.results,
                city: toolResult.city,
                params: toolResult.params,
                isDemo: toolResult.isDemo
              };

              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), hotelMessage] }
                  : c
              ));

              // Get AI follow-up about the hotels
              const hotelSummary = {
                success: true,
                city: toolResult.city,
                hotelCount: toolResult.results.length,
                hotels: toolResult.results.slice(0, 3).map(h => ({
                  name: h.hotel?.name,
                  rating: h.hotel?.rating,
                  starRating: h.hotel?.starRating,
                  minRate: h.totalRate || h.hotel?.minRate,
                  amenities: h.hotel?.amenities?.slice(0, 4)
                }))
              };

              try {
                const hotelFollowUp = await claudeEdgeService.messages.create({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 512,
                  system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
                  messages: [
                    ...claudeMessages,
                    { role: 'assistant', content: response.content },
                    { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(hotelSummary) }] }
                  ]
                });

                const hotelAiText = hotelFollowUp.content.find(block => block.type === 'text')?.text;
                if (hotelAiText) {
                  const hotelAiMessage = { role: 'assistant', content: hotelAiText };
                  setChatHistory(prev => prev.map(c =>
                    c.id === workingChatId
                      ? { ...c, messages: [...c.messages, hotelAiMessage] }
                      : c
                  ));
                }
              } catch (followUpError) {
                console.warn('Hotel follow-up failed:', followUpError);
              }

              setIsProcessing(false);
              return; // Exit early - hotels handled
            // HIDDEN: Adventures not shown in AI Chat - Sommelier handles wine consultations
            // } else if (toolUse.name === 'searchYachtsAndAdventures' && toolResult.results?.adventures?.length > 0) {
            //   // Show adventure package results as cards
            //   const adventureCount = toolResult.results.adventures.length;
            //   const adventureMessage = {
            //     role: 'adventures',
            //     content: `Found ${adventureCount} adventure package${adventureCount > 1 ? 's' : ''} for you! Browse the options below - click on any card to see details, add to cart, or request a booking. Would you like me to tell you more about any of these packages?`,
            //     adventures: toolResult.results.adventures,
            //     params: toolResult.params
            //   };

            //   setChatHistory(prev => prev.map(c =>
            //     c.id === workingChatId
            //       ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), adventureMessage] }
            //       : c
            //   ));

            //   // No automatic AI follow-up - just show the cards and let user explore
            //   // User can ask for more details if interested

            //   setIsProcessing(false);
            //   return; // Exit early - adventures handled
            } else if (toolUse.name === 'addHotelToCart' && toolResult.success) {
              // Handle hotel added to cart
              if (toolResult.cartItem) {
                setCart(prev => [...prev, toolResult.cartItem]);
              }

              const confirmMessage = {
                role: 'confirm_booking',
                content: toolResult.additionalServicesPrompt || toolResult.message,
                bookingType: 'hotel_booking',
                bookingData: toolResult.cartItem,
                displayInfo: toolResult.displayInfo
              };

              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), confirmMessage] }
                  : c
              ));
              setIsProcessing(false);
              return; // Exit early
            }

            // Only add results message if we have tabs to display
            if (tabs.length > 0) {
              const resultsMessage = {
                role: 'results',
                content: JSON.stringify({ tabs }),
                tabs: tabs
              };

              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages, resultsMessage] }
                  : c
              ));

              await chatService.updateChatMessages(workingChatId, [...conversationHistory, resultsMessage], user.id);
            }
          }

          // Get AI response about results - MUST use proper tool_result format
          const followUp = await claudeEdgeService.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: [
              {
                type: "text",
                text: systemPrompt,
                cache_control: { type: "ephemeral" }
              }
            ],
            messages: [
              ...claudeMessages,
              { role: 'assistant', content: response.content },
              {
                role: 'user',
                content: [{
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(toolResult)
                }]
              }
            ]
          });

          const aiText = followUp.content.find(block => block.type === 'text')?.text || 'Found results!';
          const aiMessage = { role: 'assistant', content: aiText };

          let followUpMessageIndex = 0;
          setChatHistory(prev => {
            const updated = prev.map(c => {
              if (c.id === workingChatId) {
                // Remove loading messages and add the AI response
                const newMessages = [...c.messages.filter(m => !m.isLoading), aiMessage];
                followUpMessageIndex = newMessages.length - 1;
                return { ...c, messages: newMessages };
              }
              return c;
            });
            return updated;
          });

          // Trigger typing animation AFTER state update
          setTimeout(() => {
            setTypingMessageIndex(followUpMessageIndex);
          }, 50);

          await chatService.updateChatMessages(workingChatId, [...conversationHistory, aiMessage], user.id);
        }
      } else {
        const textBlock = response.content.find(block => block.type === 'text');
        const aiMessage = { role: 'assistant', content: textBlock?.text || 'How can I help?' };

        // Remove loading message and add actual response
        let newMessageIndex = 0;
        setChatHistory(prev => {
          const updated = prev.map(c => {
            if (c.id === workingChatId) {
              const newMessages = [...c.messages.filter(m => !m.isLoading), aiMessage];
              newMessageIndex = newMessages.length - 1;
              return { ...c, messages: newMessages };
            }
            return c;
          });
          return updated;
        });

        // Trigger typing animation AFTER state update
        setTimeout(() => {
          setTypingMessageIndex(newMessageIndex);
        }, 50);

        await chatService.updateChatMessages(workingChatId, [...conversationHistory, aiMessage], user.id);
      }
    } catch (error) {
      console.error('❌ AI service error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        type: error.type,
        error: error
      });
      setToast({ message: 'Error - please open a new chat or contact support', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessageOLD = async (message, inputMethod = lastInputMethod) => {
    if (!message.trim()) return;

    console.log('🚀 handleSendMessage called:', { message, activeChat, userId: user?.id });

    const userMessage = { role: 'user', content: message };
    let workingChat = currentChat;
    let workingChatId = activeChat;

    if (activeChat === 'new') {
      console.log('📝 Creating new chat from "new" view');

      // Check if user can start new chat (bypass for admins)
      if (user?.id && !isAdmin) {
        console.log('👤 Checking subscription limits for user:', user.id);
        const { canStart, chatsUsed, chatsLimit } = await subscriptionService.canStartNewChat(user.id);
        console.log('📊 Subscription check result:', { canStart, chatsUsed, chatsLimit });

        if (!canStart) {
          console.log('⚠️ Limit reached - allowing chat but showing warning');
          // Show toast notification
          setToast({
            message: `Chat limit reached (${chatsUsed}/${chatsLimit}). Upgrade to continue using Sphera AI.`,
            type: 'warning'
          });
          // Set flag to show warning message in chat
          setLimitWarningShown(true);
          // Continue creating chat anyway
        }
      } else if (isAdmin) {
        console.log('👑 Admin user - bypassing subscription limits');
      } else {
        console.log('⚠️ No user ID found - proceeding without subscription check');
      }

      // Create new chat in database
      const title = chatService.generateTitle(message);
      console.log('💾 Creating chat in database:', { userId: user.id, title });

      const { success, chat } = await chatService.createChat(user.id, title, userMessage);
      console.log('💾 Chat creation result:', { success, chatId: chat?.id });

      if (success) {
        // Increment chat usage (non-critical - don't block if it fails)
        if (user?.id && !isAdmin) {
          try {
            await subscriptionService.incrementChatUsage(user.id);
            await loadUserProfile(); // Reload profile to update UI
          } catch (error) {
            console.warn('⚠️ Failed to increment chat usage (non-critical):', error);
            // Continue anyway - this shouldn't block chat creation
          }
        }

        // Add warning message if limit was reached
        const chatMessages = [userMessage];
        if (limitWarningShown) {
          chatMessages.push({
            role: 'assistant',
            content: `⚠️ You've reached your chat limit. This conversation will continue, but please upgrade your subscription to unlock unlimited chats and advanced features. Click the "Subscriptions" button above to view plans.`
          });
        }

        const newChat = {
          id: chat.id, // Use database UUID
          title: chat.title,
          date: 'Just now',
          messages: chatMessages
        };

        console.log('✅ Creating new chat:', {
          chatId: chat.id,
          title: chat.title,
          messageCount: newChat.messages.length,
          limitWarning: limitWarningShown
        });

        // Update chat history AND active chat together
        console.log('🔄 Switching from "new" to chat:', chat.id);

        // Use functional updates to ensure they happen together
        setChatHistory(prev => {
          const updated = [newChat, ...prev];
          console.log('📝 Updated chat history:', updated.map(c => ({ id: c.id, title: c.title })));

          // Also update activeChat in the same render cycle
          setActiveChat(chat.id);

          return updated;
        });

        workingChat = newChat;
        workingChatId = chat.id;

        console.log('✅ Chat creation complete. Component should re-render with new activeChat.');

        // IMPORTANT: Give React time to re-render with new activeChat before continuing
        // This ensures the view switches from "new" to "chat" view
        await new Promise(resolve => setTimeout(resolve, 150));
        console.log('⏱️ Waited for state update - continuing with AI processing');

        // Verify the chat is now in history
        console.log('🔍 Verifying chat exists in history after wait...');
        const chatExists = chatHistory.find(c => c.id === chat.id);
        console.log('✅ Chat verification:', chatExists ? 'Found' : 'NOT FOUND');
      } else {
        // If chat creation failed, show error and return
        console.error('❌ Failed to create chat');
        return;
      }
    } else {
      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      ));
      // Save to database
      await saveChat(activeChat, [...(workingChat?.messages || []), userMessage]);
    }

    // Make sure workingChat exists before accessing messages
    if (!workingChat || !workingChat.messages) {
      console.error('❌ Working chat is null or has no messages');
      return;
    }

    const updatedMessages = [...workingChat.messages, userMessage];

    setCurrentMessage('');
    const lowerMsg = message.toLowerCase();

    // Conversation flow
    if (conversationState.state.currentService && conversationState.state.awaitingInfo) {
      const key = conversationState.state.awaitingInfo;
      conversationState.addInfo(key, message);
      conversationState.state.awaitingInfo = null;

      if (conversationState.isComplete()) {
        const info = conversationState.state.collectedInfo;
        const searchQuery = `${conversationState.state.currentService} from ${info.from || ''} to ${info.to || ''} ${info.passengers ? 'for ' + info.passengers + ' passengers' : ''}`.trim();
        await handleSearch(searchQuery, updatedMessages);
        conversationState.reset();
        return;
      } else {
        const next = conversationState.getNextQuestion();
        conversationState.state.awaitingInfo = next.key;
        
        setChatHistory(prev => prev.map(c => 
          c.id === workingChatId
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: next.question }] }
            : c
        ));
        return;
      }
    }

    // Check for booking requests that should trigger search immediately
    if (conversationalAI.isActualBookingRequest(message)) {
      await handleSearch(message, updatedMessages);
      return;
    }

    // Special handling for cart-related actions
    if (cartItems.length > 0) {
      if (lowerMsg.match(/save|draft/)) {
        saveRequestToPDF();
        return;
      }
      if (lowerMsg.match(/send|submit|book|proceed/)) {
        await sendRequest();
        return;
      }
      if (lowerMsg.match(/pay|payment/)) {
        let msg = `Payment Options:\n\n`;
        msg += `Traditional: Card, Bank Transfer, Wire\n\n`;
        msg += `Crypto (5% bonus):\n`;
        msg += `- USDT/USDC: $${cartTotal.toLocaleString()}\n`;
        msg += `- BTC: ${(cartTotal / 43250).toFixed(6)}\n`;
        msg += `- ETH: ${(cartTotal / 2280).toFixed(4)}\n`;
        msg += `- PVCX: ${(cartTotal / 0.85).toFixed(0)} tokens`;
        
        setChatHistory(prev => prev.map(c => 
          c.id === workingChatId
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: withEmpathy(msg) }] }
            : c
        ));
        return;
      }
    }

    // Web3/Token questions - Show consultation booking modal instead of generic AI response
    if (lowerMsg.match(/tokeniz|fractional|ownership|pvcx|token/)) {
      // Determine specific consultation topic based on keywords
      let topic = 'tokenization';
      if (lowerMsg.match(/fractional.*ownership|ownership.*fractional/)) {
        topic = 'fractional_ownership';
      } else if (lowerMsg.match(/pvcx|token.*reward/)) {
        topic = 'pvcx_tokens';
      }
      
      setConsultationTopic(topic);
      setShowConsultationModal(true);
      
      // Add a message indicating consultation booking
      setChatHistory(prev => prev.map(c => 
        c.id === workingChatId
          ? { ...c, messages: [...c.messages, { 
              role: 'assistant', 
              content: withEmpathy('I understand you\'re interested in our tokenization and blockchain features! For detailed guidance on asset tokenization and fractional ownership, I\'d recommend booking a consultation with our blockchain specialists. They can provide personalized advice tailored to your specific needs.'),
              action: 'consultation_booking'
            }] }
          : c
      ));
      return;
    }

    // Service detection with specific category handling
    
    // 1. HELICOPTER - Only for short distances (<700km) or explicit requests
    if (lowerMsg.match(/\b(heli|helicopter)\b/)) {
      conversationState.setService('helicopter');
      
      // Check if route/passenger info is already provided
      const fromMatch = lowerMsg.match(/\bfrom\s+([a-z\s]+?)(?:\s+to|\s+for|,|$)/i);
      const toMatch = lowerMsg.match(/\bto\s+([a-z\s]+?)(?:\s+for|,|$)/i);
      const paxMatch = lowerMsg.match(/(?:for\s+)?(\d+)(?:\s+(?:passenger|person|people|pax))?/i);
      const routeMatch = lowerMsg.match(/\b([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s+for|,|$)/i);
      
      if (fromMatch) conversationState.addInfo('from', fromMatch[1].trim());
      else if (routeMatch) conversationState.addInfo('from', routeMatch[1].trim());
      
      if (toMatch) conversationState.addInfo('to', toMatch[1].trim());
      else if (routeMatch) conversationState.addInfo('to', routeMatch[2].trim());
      
      if (paxMatch) conversationState.addInfo('passengers', paxMatch[1]);
      
      if (conversationState.isComplete()) {
        const info = conversationState.state.collectedInfo;
        const searchQuery = `helicopter from ${info.from} to ${info.to} for ${info.passengers} passengers`;
        await handleSearch(searchQuery, updatedMessages);
        conversationState.reset();
        return;
      }
      
      const next = conversationState.getNextQuestion();
      conversationState.state.awaitingInfo = next.key;

      setChatHistory(prev => prev.map(c =>
        c.id === workingChatId
          ? { ...c, messages: [...c.messages, { role: 'assistant', content: withEmpathy(`Great, helicopter charter. Note: Helicopter routes are limited to 700km for optimal efficiency. ${next.question}`) }] }
          : c
      ));
      return;
    }

    // 2. EMPTY LEGS - For price-conscious users looking for discounted flights
    if (lowerMsg.match(/empty\s*legs?|emptyleg/)) {
      // If the user phrased a direct request OR mentions time period, search immediately
      const directIntent = /show|find|get|list|available|any|have|this\s+week|today|tomorrow|this\s+month|flying/.test(lowerMsg) || /\bin\s+\w+/.test(lowerMsg) || /\bto\s+\w+/.test(lowerMsg) || /\bfrom\s+\w+/.test(lowerMsg);
      if (directIntent) {
        await handleSearch(message, updatedMessages);
        return;
      }
      
      conversationState.setService('empty_leg');
      
      const fromMatch = lowerMsg.match(/\bfrom\s+([a-z\s]+?)(?:\s+to|\s+for|,|$)/i);
      const toMatch = lowerMsg.match(/\bto\s+([a-z\s]+?)(?:\s+for|,|$)/i);
      const paxMatch = lowerMsg.match(/(?:for\s+)?(\d+)(?:\s+(?:passenger|person|people|pax))?/i);
      const routeMatch = lowerMsg.match(/\b([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s+for|,|$)/i);
      
      if (fromMatch) conversationState.addInfo('from', fromMatch[1].trim());
      else if (routeMatch) conversationState.addInfo('from', routeMatch[1].trim());
      
      if (toMatch) conversationState.addInfo('to', toMatch[1].trim());
      else if (routeMatch) conversationState.addInfo('to', routeMatch[2].trim());
      
      if (paxMatch) conversationState.addInfo('passengers', paxMatch[1]);
      
      if (conversationState.isComplete()) {
        const info = conversationState.state.collectedInfo;
        const searchQuery = `empty legs from ${info.from} to ${info.to} for ${info.passengers} passengers`;
        await handleSearch(searchQuery, updatedMessages);
        conversationState.reset();
        return;
      }
      
      const next = conversationState.getNextQuestion();
      conversationState.state.awaitingInfo = next.key;
      
      setChatHistory(prev => prev.map(c => 
        c.id === workingChatId
          ? { ...c, messages: [...c.messages, { role: 'assistant', content: withEmpathy(`Perfect choice for value! Empty legs offer 30-50% savings on fixed routes. ${next.question}`) }] }
          : c
      ));
      return;
    }

    // 3. PRIVATE JETS - Let AI handle the conversation naturally (removed hardcoded flow)

    // 4. YACHT CHARTER - Always request-based, need budget and details
    if (lowerMsg.match(/yacht|boat/) && !lowerMsg.match(/luxury\s*car/)) {
      setAssistantTyping(true);
      
      try {
        const systemPrompt = `You are Sphera, helping with yacht charter requests. Always ask for:
1. Budget range (daily charter rates vary widely)
2. Number of passengers/guests
3. Preferred dates and duration
4. Destination/cruising area
5. Special requirements (crew, catering, water sports)

Keep responses conversational and ask for 1-2 details at a time.`;

        claudeService.setSystemPrompt(systemPrompt);

        const aiResponse = await claudeService.sendMessage([
          { role: 'user', content: `User is interested in yacht charter: "${message}". Ask for budget and passenger details.` }
        ], {
          maxTokens: 200,
          temperature: 0.7
        });

        setChatHistory(prev => prev.map(c => 
          c.id === workingChatId
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: withEmpathy(aiResponse) }] }
            : c
        ));
      } catch (error) {
        setChatHistory(prev => prev.map(c => 
          c.id === workingChatId
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: withEmpathy('Excellent choice for yacht charter! I\'ll need to know your budget range, number of guests, and preferred cruising area to find the perfect yacht for you.') }] }
            : c
        ));
      } finally {
        setAssistantTyping(false);
      }
      return;
    }

    // 5. LUXURY CARS - Separate service, can be added to other bookings
    if (lowerMsg.match(/luxury\s*car|chauffeur|driver|\bcars?\b/) && !lowerMsg.match(/yacht/)) {
      // Check if user is adding to existing booking
      const isAddingToBooking = cartItems.length > 0 || lowerMsg.match(/add|also|zusätzlich|dazu/);
      
      if (isAddingToBooking) {
        setChatHistory(prev => prev.map(c => 
          c.id === workingChatId
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: withEmpathy('Perfect! I can add luxury car service to your booking. Which cities do you need ground transportation in?') }] }
            : c
        ));
      } else {
        setChatHistory(prev => prev.map(c => 
          c.id === workingChatId
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: withEmpathy('Luxury chauffeur service available! Which city and what type of service do you need? (Airport transfer, hourly service, special events)') }] }
            : c
        ));
      }
      return;
    }

    // Check if user is responding to search results - offer proactive suggestions
    if (searchResults && searchResults.tabs && searchResults.tabs.length > 0) {
      if (lowerMsg.match(/yes|sure|ok|great|good|perfect|sounds good|looks good/)) {
        setAssistantTyping(true);

        try {
          const systemPrompt = getSystemPrompt();
          claudeService.setSystemPrompt(systemPrompt);

          const addOnContext = `The user seems interested in the search results for "${searchResults.query}".

As their luxury travel consultant, proactively suggest relevant add-ons:
1. If it's a flight (jet/empty leg): Suggest ground transportation (luxury car/chauffeur service) at departure/arrival cities
2. If it's a helicopter: Suggest connecting to a main flight or car service
3. If it's multi-day: Suggest accommodation or concierge services
4. Ask if they need CO2 offset certificates for sustainability
5. Keep it consultative and natural (2-3 sentences max)`;

          const aiResponse = await claudeService.sendMessage([
            { role: 'user', content: addOnContext }
          ], {
            maxTokens: 200,
            temperature: 0.7
          });

          setChatHistory(prev => prev.map(c =>
            c.id === workingChatId
              ? { ...c, messages: [...c.messages, { role: 'assistant', content: withEmpathy(aiResponse) }] }
              : c
          ));
        } catch (error) {
          const fallbackSuggestion = `Wonderful! Would you also like me to arrange ground transportation for your trip? I can organize luxury chauffeur service at both departure and arrival cities. We also offer CO2 offset certificates if you'd like to travel sustainably.`;

          setChatHistory(prev => prev.map(c =>
            c.id === workingChatId
              ? { ...c, messages: [...c.messages, { role: 'assistant', content: withEmpathy(fallbackSuggestion) }] }
              : c
          ));
        } finally {
          setAssistantTyping(false);
        }
        return;
      }
    }

    // For all other messages, use OpenRouter AI with full consultation system prompt
    setAssistantTyping(true);

    try {
      // Use the comprehensive system prompt from aiKnowledgeBase
      const systemPrompt = getSystemPrompt();
      claudeService.setSystemPrompt(systemPrompt);

      // Prepare conversation history for AI consultation
      // Filter out UI-only messages - only user/assistant are valid Claude roles
      const uiOnlyRoles = ['results', 'place', 'hotels', 'adventures', 'confirm_booking', 'loading'];
      const conversationHistory = updatedMessages
        .filter(msg => !uiOnlyRoles.includes(msg.role) && !msg.isLoading)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add context about search results if any exist
      let contextMessage = message;
      if (searchResults && searchResults.tabs?.length > 0) {
        contextMessage += `\n\nCurrent search results: ${searchResults.tabs.map(tab => `${tab.title} (${tab.count} options)`).join(', ')}`;
      }

      // Add context about cart items if any
      if (cartItems.length > 0) {
        contextMessage += `\n\nItems in cart: ${cartItems.map(item => item.name || item.title).join(', ')} (Total: $${cartTotal.toLocaleString()})`;
      }

      console.log('🤖 Consulting user with AI:', contextMessage);

      // Get AI consultation response
      const aiResponse = await claudeService.sendMessage([
        ...conversationHistory.slice(0, -1), // All previous messages
        { role: 'user', content: contextMessage } // Enhanced current message with context
      ], {
        maxTokens: 500,
        temperature: 0.8
      });

      console.log('🎯 AI consultation response:', aiResponse);

      // SMART CONTEXT EXTRACTION - Check ENTIRE conversation history for booking details
      const extractFromContext = (conversationHistory) => {
        const allUserMessages = conversationHistory.filter(m => m.role === 'user').map(m => m.content.toLowerCase()).join(' ');

        // Extract locations from context
        const toMatch = allUserMessages.match(/\b(?:to|destination|going to|flying to)\s+([a-z\s]+?)(?:\s|,|$|next|on|for|with|\d)/i);
        const fromMatch = allUserMessages.match(/\b(?:from|departure|leaving from|departing from)\s+([a-z\s]+?)(?:\s|,|$|to|on|for|with|\d)/i);

        // Also check for city names directly mentioned (like "rome" or "monaco")
        const cityMentions = allUserMessages.match(/\b(london|paris|rome|monaco|zurich|geneva|dubai|new york|miami|nice|milan|barcelona|madrid|berlin|munich|ibiza|mallorca|cannes|st tropez|vienna|amsterdam|brussels|copenhagen|stockholm|helsinki|oslo|reykjavik|lisbon|athens|istanbul|moscow|tokyo|singapore|hong kong|sydney|los angeles|san francisco|chicago|toronto|vancouver|mexico city|sao paulo|buenos aires)\b/gi);

        // Extract passenger count
        const paxMatch = allUserMessages.match(/(\d+)\s*(?:pax|passenger|person|people)/i);

        // Extract date info
        const dateMatch = allUserMessages.match(/(?:on|at|for)\s+(?:the\s+)?(\d+)\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i) ||
                          allUserMessages.match(/(?:next|this)\s+(week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);

        // Service type detection
        const isJet = /\b(jet|aircraft|plane|charter|flight|fly)\b/i.test(allUserMessages);
        const isEmptyLeg = /\bempty\s*leg/i.test(allUserMessages);
        const isHelicopter = /\b(helicopter|heli|chopper)\b/i.test(allUserMessages);

        return {
          to: toMatch?.[1]?.trim() || (cityMentions?.[cityMentions.length - 1]) || null,
          from: fromMatch?.[1]?.trim() || (cityMentions?.[0] !== cityMentions?.[cityMentions.length - 1] ? cityMentions?.[0] : null) || null,
          passengers: paxMatch?.[1] || null,
          hasDate: !!dateMatch,
          isJet,
          isEmptyLeg,
          isHelicopter
        };
      };

      const context = extractFromContext(conversationHistory);
      console.log('🔍 Extracted context from conversation:', context);

      // Check if we have enough info to auto-search
      const hasEnoughForSearch = (
        (context.from || context.to) && // At least one location
        (context.passengers || context.hasDate) && // Plus either passengers or date
        (context.isJet || context.isEmptyLeg || context.isHelicopter) // And it's a booking request
      );

      if (hasEnoughForSearch && !searchResults) {
        // Build search query from context
        let searchQuery = '';
        if (context.isEmptyLeg) searchQuery = 'empty leg ';
        else if (context.isHelicopter) searchQuery = 'helicopter ';
        else searchQuery = 'private jet ';

        if (context.from) searchQuery += `from ${context.from} `;
        if (context.to) searchQuery += `to ${context.to} `;
        if (context.passengers) searchQuery += `for ${context.passengers} passengers `;

        console.log('🚀 AUTO-TRIGGERING SEARCH with query:', searchQuery);

        // Trigger search after AI response
        setTimeout(async () => {
          await handleSearch(searchQuery.trim(), updatedMessages);
        }, 1000);
      }

      // AUTO-SAVE AI-CREATED REQUEST when enough info is gathered
      const hasCompleteBookingInfo = (
        context.from &&
        context.to &&
        context.passengers &&
        context.hasDate &&
        (context.isJet || context.isEmptyLeg || context.isHelicopter)
      );

      if (hasCompleteBookingInfo && user) {
        console.log('💾 AUTO-SAVING AI-CREATED REQUEST to database...');

        // Determine request type
        let requestType = 'private_jet_charter';
        if (context.isEmptyLeg) requestType = 'empty_leg';
        else if (context.isHelicopter) requestType = 'helicopter_charter';

        // Build comprehensive request data
        const requestData = {
          source: 'ai-chat',
          createdBy: 'ai-assistant',
          conversationHistory: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || new Date().toISOString()
          })),
          extractedInfo: {
            from: context.from,
            to: context.to,
            passengers: parseInt(context.passengers),
            serviceType: requestType,
            fullConversation: conversationHistory.map(m => m.content).join('\n---\n')
          },
          status: 'pending-ai-created',
          notes: `AI-generated request from chat conversation. User provided: ${context.from} to ${context.to}, ${context.passengers} passengers.`
        };

        try {
          // Check if request requires blockchain signature
          const requiresSignature = false; // Will be updated when user selects blockchain features
          let signature = null;
          let signatureMessage = null;

          // If wallet is connected and blockchain features are selected, request signature
          if (requiresSignature && isWalletConnected && walletAddress) {
            try {
              console.log('🔐 Requesting blockchain signature...');

              const signatureData = {
                requestId: `ai-chat-${Date.now()}`,
                userId: user.id,
                services: [requestType],
                totalAmount: 0, // Will be calculated when booking confirmed
                currency: 'EUR',
                timestamp: Date.now(),
                includesBlockchain: false,
                includesCO2Certificate: false,
                includesCryptoPayment: false
              };

              const { signature: sig, message: msg } = await signAIChatRequest(
                signatureData,
                signMessageAsync
              );

              signature = sig;
              signatureMessage = msg;

              console.log('✅ Signature obtained:', signature.substring(0, 20) + '...');
            } catch (signError) {
              console.error('❌ Signature rejected:', signError);
              // Don't block request creation, but note signature was rejected
              requestData.signatureRejected = true;
            }
          }

          // Add signature to request data if obtained
          if (signature) {
            requestData.blockchainSignature = {
              signature,
              signatureMessage,
              walletAddress,
              signedAt: new Date().toISOString()
            };
          }

          const { request, error } = await createRequest({
            userId: user.id,
            type: requestType,
            data: requestData,
            userEmail: user.email
          });

          if (!error && request) {
            console.log('✅ AI-CREATED REQUEST SAVED:', request.id);

            // Notify user in chat
            let statusMessage = `✅ Your request has been saved to "My Requests" and our team will review it shortly. Request ID: ${request.id.substring(0, 8)}...`;

            if (signature) {
              statusMessage += `\n\n🔐 Blockchain signature verified: ${signature.substring(0, 10)}...${signature.substring(signature.length - 8)}`;
            }

            setChatHistory(prev => prev.map(c =>
              c.id === workingChatId
                ? {
                    ...c,
                    messages: [
                      ...c.messages,
                      {
                        role: 'system',
                        content: statusMessage,
                        timestamp: new Date().toISOString()
                      }
                    ]
                  }
                : c
            ));
          } else {
            console.error('❌ Failed to save AI-created request:', error);
          }
        } catch (err) {
          console.error('❌ Error saving AI-created request:', err);
        }
      }

      const finalResponse = withEmpathy(aiResponse);

      // Speak response if voice mode is active
      if (isVoiceMode && !isVoiceMuted) {
        speakResponse(finalResponse);
      }

      setChatHistory(prev => prev.map(c =>
        c.id === workingChatId
          ? { ...c, messages: [...c.messages, { role: 'assistant', content: finalResponse }] }
          : c
      ));

    } catch (error) {
      console.error('❌ AI Consultation Error:', error);
      console.error('❌ Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Show user-friendly error message
      const errorResponse = `Something went wrong. Please try starting a new chat or contact support if the issue persists.`;

      setChatHistory(prev => prev.map(c =>
        c.id === workingChatId
          ? { ...c, messages: [...c.messages, { role: 'assistant', content: errorResponse }] }
          : c
      ));
    } finally {
      setAssistantTyping(false);
    }
  };

  // If we have an initialQuery prop, show loading state while useEffect processes it
  // This must come BEFORE the NEW CHAT VIEW check
  if (initialQuery && initialQuery.trim() && !processedQueriesRef.current.has(initialQuery)) {
    console.log('🎨 Rendering: INITIAL QUERY LOADING (waiting for useEffect to process)', { initialQuery, userId: user?.id });
    return (
      <div className="h-full bg-transparent flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <div className="text-gray-600 text-sm">Starting conversation...</div>
          </div>
        </div>
      </div>
    );
  }

  // NEW CHAT VIEW - Welcome message with suggestion bubbles
  // Show this view if activeChat is 'new' or null (and no query being processed)
  if (activeChat === 'new' || activeChat === null) {
    console.log('🎨 Rendering: NEW CHAT VIEW (welcome with suggestions)', { activeChat, chatHistoryLength: chatHistory.length });

    // Quick suggestion bubbles - small, blurred, monochromatic
    const quickSuggestions = [
      { id: 'jets', label: 'Private Jets', prompt: 'I need to book a private jet' },
      { id: 'sommelier', label: 'Sommelier', prompt: 'I would like wine recommendations' },
      { id: 'restaurants', label: 'Restaurants', prompt: 'Find me a luxury restaurant' },
      { id: 'transfer', label: 'Airport Transfer', prompt: 'I need an airport transfer' },
      { id: 'emptylegs', label: 'Empty Legs', prompt: 'I want to find empty leg flights', isRouteQuery: true },
      { id: 'yachts', label: 'Yachts', prompt: 'I want to charter a yacht' },
    ];

    // Get time-based greeting
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    };

    return (
      <div className="h-full bg-transparent flex flex-col overflow-hidden">
        {/* Messages area with welcome */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col justify-end">
          <div className="max-w-3xl mx-auto w-full space-y-4">
            {/* Sphera Welcome Message */}
            <div className="flex justify-start animate-fade-in">
              <div className="flex flex-col gap-2 ml-0 sm:ml-12" style={{ maxWidth: '85%' }}>
                <div className="flex items-center gap-2 px-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">Sphera AI</span>
                </div>
                <div className="px-5 py-4 bg-gray-100 text-gray-800 border border-gray-200 rounded-2xl">
                  <p className="text-sm leading-relaxed">
                    {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! I'm Sphera, your luxury travel and Web3 concierge.
                  </p>
                  <p className="text-sm leading-relaxed mt-2 text-gray-600">
                    I can help you book private jets, find restaurants, arrange transfers, explore tokenization, and much more. What would you like to do today?
                  </p>
                </div>

                {/* Quick Suggestion Bubbles - Small, blurred, monochromatic */}
                <div className="flex flex-wrap gap-2 mt-2 px-2">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        // Create new chat
                        const chatId = `chat-${Date.now()}`;
                        const userMessage = { role: 'user', content: suggestion.prompt };

                        // For all suggestions (including empty legs), show loading animation
                        // Claude AI will naturally ask for route details for empty legs based on knowledge base
                        const loadingMsg = { role: 'assistant', content: '...', isLoading: true };

                        const newChat = {
                          id: chatId,
                          title: suggestion.label,
                          date: 'Just now',
                          messages: [userMessage, loadingMsg]
                        };

                        setChatHistory(prev => [newChat, ...prev]);
                        setActiveChat(chatId);

                        setTimeout(() => {
                          handleSendMessage(suggestion.prompt);
                        }, 100);
                      }}
                      className="group"
                      style={{
                        animation: `fadeIn 0.3s ease-out ${0.1 + index * 0.05}s both`
                      }}
                    >
                      <div className="px-3 py-1.5 bg-white/40 backdrop-blur-sm border border-gray-200/60 rounded-full hover:bg-white/70 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
                        <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                          {suggestion.label}
                        </span>
                      </div>
                    </button>
                  ))}
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
                    // Create new chat and send message
                    const chatId = `chat-${Date.now()}`;
                    const userMessage = { role: 'user', content: currentMessage };
                    const loadingMsg = { role: 'assistant', content: '...', isLoading: true };

                    const newChat = {
                      id: chatId,
                      title: currentMessage.split(' ').slice(0, 4).join(' ') + '...',
                      date: 'Just now',
                      messages: [userMessage, loadingMsg]
                    };

                    setChatHistory(prev => [newChat, ...prev]);
                    setActiveChat(chatId);
                    const msgToSend = currentMessage;
                    setCurrentMessage('');

                    setTimeout(() => {
                      handleSendMessage(msgToSend);
                    }, 100);
                  }
                }}
                placeholder="Message Sphera... e.g. 'Private jet from London to Monaco'"
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
              />

              <button
                onClick={() => {
                  if (currentMessage.trim()) {
                    const chatId = `chat-${Date.now()}`;
                    const userMessage = { role: 'user', content: currentMessage };
                    const loadingMsg = { role: 'assistant', content: '...', isLoading: true };

                    const newChat = {
                      id: chatId,
                      title: currentMessage.split(' ').slice(0, 4).join(' ') + '...',
                      date: 'Just now',
                      messages: [userMessage, loadingMsg]
                    };

                    setChatHistory(prev => [newChat, ...prev]);
                    setActiveChat(chatId);
                    const msgToSend = currentMessage;
                    setCurrentMessage('');

                    setTimeout(() => {
                      handleSendMessage(msgToSend);
                    }, 100);
                  }
                }}
                disabled={!currentMessage.trim()}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentMessage.trim()
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:scale-110'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Animation keyframes */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // EXISTING CHAT VIEW (conversation mode)
  // This handles activeChat !== 'new' which shows the actual conversation

  if (!currentChat) {
    console.log('⚠️ No currentChat found. ActiveChat:', activeChat, 'chatHistoryLength:', chatHistory.length);

    // If activeChat is a numeric ID (not 'new' or null), we're waiting for chatHistory to sync
    // This happens due to React state batching - activeChat updates before chatHistory prop arrives
    // Show "Starting conversation" spinner while waiting
    if (activeChat && activeChat !== 'new') {
      return (
        <div className="h-full bg-transparent flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              <div className="text-gray-600 text-sm">Starting conversation...</div>
            </div>
          </div>
        </div>
      );
    }

    // Fallback loading state
    return (
      <div className="h-full bg-transparent flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading chat...</div>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering: CHAT VIEW with chat:', currentChat.id, currentChat.title);

  // CHAT VIEW - Messages flow from bottom like WhatsApp
  return (
    <div className="ai-chat-page h-full flex bg-transparent overflow-hidden relative">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* 1. HEADER - FIXED TOP on mobile - iOS 26 Glass effect */}
      <div className="flex-shrink-0 sticky top-0 z-30 px-3 sm:px-6 py-2.5 bg-white/80 sm:bg-white/15 border-b border-white/10" style={{ backdropFilter: 'blur(50px) saturate(180%)', WebkitBackdropFilter: 'blur(50px) saturate(180%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveChat('new');
                setWeather(null);
                setCartItems([]);
                setSearchResults(null);
              }}
              className="p-2 bg-white/25 text-gray-700 rounded-xl hover:bg-white/40 transition-all duration-200 border border-white/20"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-base font-normal text-gray-700 truncate max-w-md">
              {currentChat?.messages?.[0]?.content || currentChat?.title || 'New Conversation'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Cart icon - always visible */}
            <button
              onClick={() => setShowCartSidebar(true)}
              className="relative p-2 rounded-xl bg-white/40 hover:bg-white/60 text-gray-700 transition-all duration-200 border border-gray-200/40 hover:border-gray-300/50 group"
              style={{ backdropFilter: 'blur(8px)' }}
              title="View Cart"
            >
              <ShoppingCart size={16} className="group-hover:scale-105 transition-transform" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {cartItems.length}
                </span>
              )}
            </button>

            {/* Voice Mute Toggle - hidden for now
            <button
              onClick={toggleVoiceMute}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              title={isVoiceMuted ? 'Voice Muted' : 'Voice Active'}
            >
              {isVoiceMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            */}

            {/* Chat Counter - Clickable to open subscriptions */}
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="px-2.5 py-1.5 bg-white/40 hover:bg-white/60 rounded-xl text-xs font-medium text-gray-700 transition-all duration-200 flex items-center gap-1.5 border border-gray-200/40 hover:border-gray-300/50"
              style={{ backdropFilter: 'blur(8px)' }}
              title="Click to manage subscription"
            >
              {userSubscriptionLimits?.tier === 'elite' ? (
                <span className="flex items-center gap-1">
                  <Crown size={12} className="text-amber-600" />
                  <span className="text-gray-700">Elite</span>
                </span>
              ) : userSubscriptionLimits?.tier === 'pro' ? (
                <span className="flex items-center gap-1">
                  <span className="text-gray-600">Pro</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">{userProfile?.chats_used || 0}/{userProfile?.chats_limit || 20}</span>
                </span>
              ) : userSubscriptionLimits?.tier === 'starter' ? (
                <span className="flex items-center gap-1">
                  <span className="text-gray-600">Starter</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">{userProfile?.chats_used || 0}/{userProfile?.chats_limit || 5}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="text-gray-500">Free</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-400">{userProfile?.chats_used || 0}/{userProfile?.chats_limit || 2}</span>
                </span>
              )}
            </button>

            {/* Report Issue Button */}
            <button
              onClick={() => setShowReportIssueModal(true)}
              className="p-2 bg-white/40 hover:bg-white/60 rounded-xl text-gray-500 hover:text-gray-700 transition-all duration-200 border border-gray-200/40 hover:border-gray-300/50"
              style={{ backdropFilter: 'blur(8px)' }}
              title="Report an issue"
            >
              <AlertCircle size={14} />
            </button>

            {/* Cart Button - Hidden from header, available in cart sidebar */}

            {/* Chat Sessions Dropdown - Hidden, can be accessed via menu if needed */}
            <div className="relative hidden">
              <button
                onClick={() => setShowChatSessions(!showChatSessions)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-black transition-colors"
              >
                <MessageSquare size={16} />
                <span className="font-medium">
                  {chatHistory.filter(c => c.id !== 'new').length} chats
                </span>
              </button>

              {showChatSessions && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowChatSessions(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Your Chats</h3>
                        <button
                          onClick={async () => {
                            setShowChatSessions(false);
                            // Check if user can start new chat
                            if (user?.id) {
                              const { canStart } = await subscriptionService.canStartNewChat(user.id);
                              if (!canStart) {
                                setShowSubscriptionModal(true);
                                return;
                              }
                            }
                            setActiveChat('new');
                            setWeather(null);
                            setCartItems([]);
                            setSearchResults(null);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                        >
                          <Plus size={14} />
                          <span>New Chat</span>
                        </button>
                      </div>

                      {userProfile && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              {userProfile.chats_limit === null ? (
                                <span className="flex items-center gap-1 text-yellow-600">
                                  <Crown size={12} />
                                  <span className="font-medium">Unlimited chats</span>
                                </span>
                              ) : (
                                <span>
                                  <span className="font-medium text-gray-900">{userProfile.chats_used}</span>
                                  <span className="text-gray-500"> / {userProfile.chats_limit} used</span>
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {chatHistory.filter(c => c.id !== 'new').length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            No chat history yet
                          </div>
                        ) : (
                          chatHistory
                            .filter(c => c.id !== 'new')
                            .map((chat) => (
                              <button
                                key={chat.id}
                                onClick={() => {
                                  setActiveChat(chat.id);
                                  setShowChatSessions(false);
                                }}
                                className={`w-full text-left p-3 rounded-lg transition-colors ${
                                  activeChat === chat.id
                                    ? 'bg-gray-100 border border-gray-300'
                                    : 'hover:bg-gray-50 border border-transparent'
                                }`}
                              >
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {chat.title}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-xs text-gray-500">{chat.date}</p>
                                  <p className="text-xs text-gray-400">
                                    {chat.messages?.length || 0} messages
                                  </p>
                                </div>
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MESSAGES - FLOW FROM BOTTOM - Less padding on mobile */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-3 sm:py-4 flex flex-col-reverse">
        <div className="max-w-3xl mx-auto space-y-4 flex flex-col w-full">
            {currentChat?.messages.map((msg, idx) => {
              const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const isLastMessage = idx === currentChat.messages.length - 1;
              const shouldType = msg.role === 'assistant' && isLastMessage && typingMessageIndex === idx;

              // Render SearchResults if this is a results message
              if (msg.role === 'results' && msg.tabs) {
                return (
                  <div key={idx} className="w-full my-4">
                    <SearchResults
                      tabs={msg.tabs}
                      onAddToCart={addToCart}
                      onBookNow={addToCart}
                      onBuildJourney={handleBuildJourney}
                    />
                  </div>
                );
              }

              // Render PlaceCard if this is a place message
              if (msg.role === 'place' && msg.place) {
                return (
                  <div key={idx} className="flex justify-start animate-fade-in w-full my-4">
                    <div className="flex flex-col gap-2 ml-12" style={{ maxWidth: '380px' }}>
                      <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-600 font-medium">Sphera AI</span>
                        <span className="text-xs text-gray-400">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <PlaceCard
                        place={msg.place}
                        alternatives={msg.alternatives}
                        showAlternatives={msg.alternatives?.length > 0}
                        onRequestTransfer={msg.canArrangeTransfer ? (place) => {
                          // Send a message to arrange transfer to this place
                          const transferRequest = `I'd like to arrange a luxury car transfer to ${place.name} at ${place.fullAddress}`;
                          handleSendMessage(transferRequest);
                        } : null}
                      />
                    </div>
                  </div>
                );
              }

              // Render HotelCard if this is a hotels message
              if (msg.role === 'hotels' && msg.hotels?.length > 0) {
                return (
                  <div key={idx} className="flex justify-start animate-fade-in w-full my-4">
                    <div className="flex flex-col gap-2 ml-12 w-full" style={{ maxWidth: '100%' }}>
                      <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-600 font-medium">Sphera AI</span>
                        <span className="text-xs text-gray-400">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-gray-600 px-2 mb-2">{msg.content}</p>
                      <div className="flex gap-4 overflow-x-auto pb-2 px-2" style={{ scrollbarWidth: 'thin' }}>
                        {msg.hotels.map((hotelData, hIdx) => (
                          <div key={hIdx} className="flex-shrink-0">
                            <HotelCard
                              hotel={hotelData.hotel}
                              rooms={hotelData.rooms}
                              onSelectRoom={(hotel, room, rate) => {
                                // Build the booking confirmation message
                                const nights = msg.params?.checkIn && msg.params?.checkOut
                                  ? Math.ceil((new Date(msg.params.checkOut) - new Date(msg.params.checkIn)) / (1000 * 60 * 60 * 24))
                                  : 1;
                                const bookingMessage = `I'd like to book ${room.roomName} at ${hotel.name} for ${nights} night(s). Check-in: ${msg.params?.checkIn || 'TBD'}, Check-out: ${msg.params?.checkOut || 'TBD'}. Rate: $${rate.totalRate}/night (${rate.boardType}).`;
                                handleSendMessage(bookingMessage);
                              }}
                              onAddToCart={(cartItem) => {
                                // Add hotel to cart directly
                                addToCart(cartItem);
                                // Show confirmation message
                                const confirmMessage = {
                                  role: 'confirm_booking',
                                  content: `Hotel "${cartItem.name}" has been added to your cart!`,
                                  bookingType: 'hotel_booking',
                                  bookingData: cartItem,
                                  displayInfo: {
                                    type: 'Hotel Booking',
                                    name: cartItem.name,
                                    city: cartItem.hotelCity,
                                    roomType: cartItem.roomType,
                                    checkIn: cartItem.checkIn,
                                    checkOut: cartItem.checkOut,
                                    nights: `${cartItem.nights} night${cartItem.nights > 1 ? 's' : ''}`,
                                    guests: cartItem.guests,
                                    pricePerNight: `$${cartItem.pricePerNight}`,
                                    totalPrice: `$${cartItem.totalPrice}`,
                                    boardType: cartItem.boardType
                                  }
                                };
                                setChatHistory(prev => prev.map(c =>
                                  c.id === currentChatId
                                    ? { ...c, messages: [...c.messages, confirmMessage] }
                                    : c
                                ));
                              }}
                              onViewDetails={(hotel) => {
                                navigate(`/hotel/${hotel.hotelId}`);
                              }}
                              checkIn={msg.params?.checkIn}
                              checkOut={msg.params?.checkOut}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // Render AdventureCard if this is an adventures message
              if (msg.role === 'adventures' && msg.adventures?.length > 0) {
                return (
                  <div key={idx} className="flex justify-start animate-fade-in w-full my-4">
                    <div className="flex flex-col gap-2 ml-12 w-full" style={{ maxWidth: '100%' }}>
                      <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-600 font-medium">Sphera AI</span>
                        <span className="text-xs text-gray-400">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-gray-600 px-2 mb-2">{msg.content}</p>
                      <div className="flex gap-4 overflow-x-auto pb-2 px-2" style={{ scrollbarWidth: 'thin' }}>
                        {msg.adventures.map((adventure, aIdx) => (
                          <div key={aIdx} className="flex-shrink-0">
                            <AdventureCard
                              adventure={adventure}
                              onAddToCart={(cartItem) => {
                                // Add adventure to cart
                                addToCart({
                                  type: 'adventure',
                                  id: cartItem.item?.id || `adventure-${Date.now()}`,
                                  name: cartItem.item?.title || cartItem.item?.name || 'Adventure Package',
                                  destination: cartItem.item?.destination,
                                  price: cartItem.totalPrice,
                                  pricePerPerson: cartItem.item?.price,
                                  guests: cartItem.guests,
                                  selectedDate: cartItem.selectedDate,
                                  duration: cartItem.item?.duration,
                                  packageType: cartItem.item?.package_type,
                                  image: cartItem.item?.image_url
                                });
                                // Show confirmation message
                                const confirmMessage = {
                                  role: 'confirm_booking',
                                  content: `Adventure "${cartItem.item?.title || cartItem.item?.name}" has been added to your cart!`,
                                  bookingType: 'adventure_booking',
                                  bookingData: cartItem,
                                  displayInfo: {
                                    type: 'Adventure Package',
                                    name: cartItem.item?.title || cartItem.item?.name,
                                    destination: cartItem.item?.destination,
                                    duration: cartItem.item?.duration,
                                    guests: `${cartItem.guests} guest${cartItem.guests > 1 ? 's' : ''}`,
                                    date: cartItem.selectedDate || 'Flexible',
                                    totalPrice: `€${cartItem.totalPrice?.toLocaleString() || 'On Request'}`
                                  }
                                };
                                setChatHistory(prev => prev.map(c =>
                                  c.id === currentChatId
                                    ? { ...c, messages: [...c.messages, confirmMessage] }
                                    : c
                                ));
                              }}
                              onRequestBooking={(requestData) => {
                                // Send request message to AI
                                const requestMessage = `I'd like to request a booking for the adventure "${requestData.item?.title || requestData.item?.name}" in ${requestData.item?.destination}. Guests: ${requestData.guests}${requestData.selectedDate ? `, preferred date: ${requestData.selectedDate}` : ''}. Please provide more details and availability.`;
                                handleSendMessage(requestMessage);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // Render regular messages
              return (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in w-full`}
                >
                  <div className={`${msg.role === 'user' ? 'items-end mr-0' : 'items-start ml-12'} flex flex-col gap-1`} style={{ maxWidth: '75%' }}>
                    <div className="flex items-center gap-2 px-2">
                      {msg.role === 'assistant' && (
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                      )}
                      <span className="text-xs text-gray-600 font-medium">
                        {msg.role === 'user' ? 'You' : 'Sphera AI'}
                      </span>
                      <span className="text-xs text-gray-400">{timestamp}</span>
                    </div>
                    <div
                      className={`px-4 py-3 rounded-2xl transition-all duration-300 ${
                        msg.role === 'user'
                          ? 'bg-black text-white'
                          : 'bg-white/40 backdrop-blur-sm text-black border border-gray-200/50'
                      }`}
                    >
                      {/* Show Break the Price badge if this is a quote upload */}
                      {msg.attachment?.type === 'price_break_quote' && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700 text-white text-[10px] font-medium rounded-full">
                            <DollarSign size={10} />
                            BREAK THE PRICE
                          </span>
                          <span className="text-[10px] text-gray-400">FREE</span>
                        </div>
                      )}
                      {/* Show file attachment preview */}
                      {msg.attachment && (
                        <div className="mb-3 p-3 bg-white/10 rounded-lg border border-gray-500/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                              <FileText size={20} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{msg.attachment.fileName}</p>
                              <p className="text-xs opacity-70">Uploaded for analysis</p>
                            </div>
                            {msg.attachment.fileUrl && (
                              <a
                                href={msg.attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline opacity-70 hover:opacity-100"
                              >
                                View
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      {msg.isLoading ? (
                        <TypingAnimation />
                      ) : shouldType ? (
                        <TypingText
                          text={msg.content}
                          speed={5}
                          onComplete={() => setTypingMessageIndex(null)}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                      )}

                      {/* Multi-Leg Route Button - Show when AI detects multi-stop journey FOR JETS/HELIS ONLY */}
                      {msg.role === 'assistant' && !msg.isLoading && (() => {
                        const content = (msg.content || '').toLowerCase();

                        // EXCLUSIONS: These categories should NEVER show multi-leg journey buttons
                        const isExcludedCategory = content.match(/delicac|delicatesse|caviar|cigar|flower|cake|decoration|photography|wine|champagne|sommelier|extras|luxury\s*extra|in-flight\s*extra|special\s*treat|beluga|oscietra|sevruga|cohiba|montecristo|davidoff|proposal\s*setup|celebration|birthday|anniversary/i);

                        // If it's about delicatesse/wine/extras, never show multi-leg buttons
                        if (isExcludedCategory) {
                          return null;
                        }

                        // Check if this is about ground transport - if so, DON'T show Build with Form / Continue by Chat
                        const isGroundTransport = content.match(/ground\s*transport|taxi|transfer|chauffeur|airport\s*pickup|limousine|sedan|economy\s*category|business\s*category|first\s*class\s*category|vip\s*category|van\s*category/i);

                        // Only show for jets/helicopters - detect aviation context
                        const isAviation = content.match(/private\s*jet|jet\s*charter|charter\s*flight|helicopter|heli|aircraft|fly\s*to|flight|aviation|turboprop|citation|gulfstream|bombardier|cessna|pilatus|embraer/i);

                        // If it's ground transport, never show these buttons
                        if (isGroundTransport && !isAviation) {
                          return null;
                        }

                        // Detect route patterns like "A to B to C" or "A → B → C"
                        const multiRoutePattern = /(\w+)\s*(to|→|->)\s*(\w+)\s*(to|→|->)\s*(\w+)/i;
                        const hasRoutePattern = multiRoutePattern.test(content);

                        // Keywords that indicate multi-leg journey context (AVIATION ONLY)
                        const multiLegKeywords = [
                          'multi-leg', 'multi leg', 'multiple legs', 'two legs',
                          'multi-stop', 'multi stop', 'multiple stops', 'two flights',
                          'second leg', 'first leg', 'connecting flight',
                          'then fly to', 'then travel to', 'then continue to',
                          'two-leg', 'round trip with stop', 'multiple destinations',
                          'book both legs', 'bespoke proposal', 'multi-leg request',
                          'coordinating two flights', 'entire journey', 'caribbean adventure',
                          'this route', 'this multi-leg', 'this journey'
                        ];
                        const hasMultiLegKeyword = multiLegKeywords.some(kw => content.includes(kw));

                        // Show button ONLY if: (route pattern OR multi-leg keyword) AND it's about aviation (not ground transport)
                        const shouldShowButton = (hasRoutePattern || hasMultiLegKeyword) && isAviation;

                        // Extract route info from content for display
                        const routeMatch = content.match(/(\w+[\w\s]*)\s*(to|→|->)\s*(\w+[\w\s]*)\s*(to|→|->)\s*(\w+[\w\s]*)/i);
                        const routeDisplay = routeMatch
                          ? `${routeMatch[1].trim()} → ${routeMatch[3].trim()} → ${routeMatch[5].trim()}`
                          : null;

                        if (shouldShowButton) {
                          return (
                            <div className="mt-3 space-y-2">
                              {/* Label */}
                              <p className="text-xs text-gray-500 px-1">Start Multi-Leg Journey</p>

                              {/* Two option buttons - same style as welcome message suggestions */}
                              <div className="flex flex-wrap gap-2">
                                {/* Build with Form Button */}
                                <button
                                  onClick={() => {
                                    setMultiLegRouteInfo(routeDisplay);
                                    handleSelectFormBuilder();
                                  }}
                                  className="group"
                                >
                                  <div className="px-3 py-1.5 bg-white/40 backdrop-blur-sm border border-gray-200/60 rounded-full hover:bg-white/70 hover:border-gray-300 transition-all duration-200 hover:shadow-sm flex items-center gap-1.5">
                                    <FileText size={12} className="text-gray-500 group-hover:text-gray-700" />
                                    <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                                      Build with Form
                                    </span>
                                  </div>
                                </button>

                                {/* Continue by Chat Button */}
                                <button
                                  onClick={() => {
                                    setMultiLegRouteInfo(routeDisplay);
                                    handleSelectChatBuilder();
                                  }}
                                  className="group"
                                >
                                  <div className="px-3 py-1.5 bg-white/40 backdrop-blur-sm border border-gray-200/60 rounded-full hover:bg-white/70 hover:border-gray-300 transition-all duration-200 hover:shadow-sm flex items-center gap-1.5">
                                    <MessageSquare size={12} className="text-gray-500 group-hover:text-gray-700" />
                                    <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                                      Continue by Chat
                                    </span>
                                  </div>
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Multi-Leg Chat Mode Buttons - Show "Add to Route" and "Add Journey to Cart" */}
                      {msg.role === 'assistant' && msg.isMultiLegChat && multiLegChatMode && !msg.isLoading && (
                        <div className="mt-3 space-y-2">
                          {/* Current Route Display */}
                          {multiLegRoute.length > 0 && (
                            <div className="px-3 py-2 bg-gray-100/80 rounded-lg border border-gray-200">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Current Route</p>
                              <p className="text-sm font-medium text-gray-800">
                                {multiLegRoute.map(leg => leg.code || leg.city?.substring(0, 3).toUpperCase()).join(' → ')}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {/* Add to Route Button - Show when there's a pending leg */}
                            {msg.pendingLeg && (
                              <button
                                onClick={() => handleAddLegToRoute(msg.pendingLeg)}
                                className="group"
                              >
                                <div className="px-3 py-1.5 bg-blue-500 border border-blue-500 rounded-full hover:bg-blue-600 transition-all duration-200 hover:shadow-sm flex items-center gap-1.5">
                                  <Plus size={12} className="text-white" />
                                  <span className="text-xs font-medium text-white transition-colors">
                                    Add to Route
                                  </span>
                                </div>
                              </button>
                            )}

                            {/* Add Next Stop Button - Show when no pending leg */}
                            {!msg.pendingLeg && (
                              <button
                                onClick={() => {
                                  // Prompt user for next destination
                                  const promptMessage = multiLegRoute.length === 0
                                    ? "Please tell me your **departure city** and **first destination** with the date and time."
                                    : `Great! What's your **next destination** after ${multiLegRoute[multiLegRoute.length - 1]?.city || 'your last stop'}? Include the date and time.`;

                                  const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
                                  setChatHistory(prev => prev.map(c =>
                                    c.id === activeChat
                                      ? { ...c, messages: [...c.messages, loadingMsg] }
                                      : c
                                  ));

                                  setTimeout(() => {
                                    setChatHistory(prev => prev.map(c =>
                                      c.id === activeChat
                                        ? {
                                            ...c,
                                            messages: c.messages.map((m, i) =>
                                              i === c.messages.length - 1 && m.isLoading
                                                ? { role: 'assistant', content: promptMessage, isMultiLegChat: true }
                                                : m
                                            )
                                          }
                                        : c
                                    ));
                                  }, 400);
                                }}
                                className="group"
                              >
                                <div className="px-3 py-1.5 bg-white/40 backdrop-blur-sm border border-gray-200/60 rounded-full hover:bg-white/70 hover:border-gray-300 transition-all duration-200 hover:shadow-sm flex items-center gap-1.5">
                                  <Plus size={12} className="text-gray-500 group-hover:text-gray-700" />
                                  <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                                    Add {multiLegRoute.length === 0 ? 'First Stop' : 'Next Stop'}
                                  </span>
                                </div>
                              </button>
                            )}

                            {/* Add Journey to Cart Button - Only show when we have at least 2 stops */}
                            {multiLegRoute.length >= 2 && (
                              <button
                                onClick={handleAddRouteToCart}
                                className="group"
                              >
                                <div className="px-3 py-1.5 bg-gray-900 border border-gray-900 rounded-full hover:bg-gray-800 transition-all duration-200 hover:shadow-sm flex items-center gap-1.5">
                                  <ShoppingCart size={12} className="text-white" />
                                  <span className="text-xs font-medium text-white transition-colors">
                                    Add Journey to Cart
                                  </span>
                                </div>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                      {/* Add to Cart Button - Shows ONLY when AI confirms a specific product from search results
                          Uses actual database data from the SearchResults, not hardcoded patterns */}
                      {msg.role === 'assistant' && !msg.isLoading && !msg.action && (() => {
                        const content = msg.content || '';
                        const contentLower = content.toLowerCase();

                        // Skip if this message already has action buttons (confirm_booking, etc.)
                        if (msg.bookingData) return null;

                        // Skip if this is an "Added to cart" confirmation message
                        if (content.startsWith('✓ Added') || content.includes('to your cart')) return null;

                        // Only show Add to Cart if AI is confirming/recommending a specific product
                        // Look for confirmation phrases like "excellent choice", "I'll add", "here's the", "you've selected"
                        const isProductConfirmation =
                          contentLower.includes('excellent choice') ||
                          contentLower.includes('great choice') ||
                          contentLower.includes('perfect choice') ||
                          contentLower.includes('you\'ve selected') ||
                          contentLower.includes('you have selected') ||
                          contentLower.includes('here\'s the') ||
                          contentLower.includes('here is the') ||
                          contentLower.includes('i\'ll prepare') ||
                          contentLower.includes('ready to add') ||
                          contentLower.includes('for your order') ||
                          contentLower.includes('adding to your') ||
                          (contentLower.includes('$') && (contentLower.includes('would you like') || contentLower.includes('shall i add')));

                        if (!isProductConfirmation) return null;

                        // Find the most recent search results from previous messages
                        const previousMessages = currentChat?.messages?.slice(0, idx) || [];
                        let latestResults = null;
                        for (let i = previousMessages.length - 1; i >= 0; i--) {
                          if (previousMessages[i].role === 'results' && previousMessages[i].tabs) {
                            latestResults = previousMessages[i].tabs;
                            break;
                          }
                        }

                        if (!latestResults || latestResults.length === 0) return null;

                        // Get all items from search results (cigars, delicatesse, wines, etc.)
                        const allItems = latestResults.flatMap(tab => tab.items || []);
                        if (allItems.length === 0) return null;

                        // Find the product mentioned in the AI message by matching names
                        let matchedProduct = null;
                        let bestMatchScore = 0;

                        for (const item of allItems) {
                          const itemName = (item.name || item.displayTitle || '').toLowerCase();
                          const itemBrand = (item.brand || '').toLowerCase();
                          const fullName = `${itemBrand} ${itemName}`.trim();

                          // Check if item name appears in the AI message
                          if (itemName && contentLower.includes(itemName)) {
                            const score = itemName.length; // Longer matches are more specific
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

                        // If no match found, don't show button
                        if (!matchedProduct) return null;

                        // Get product details from database
                        const productName = matchedProduct.displayTitle || matchedProduct.name || 'Product';
                        const productPrice = matchedProduct.price || matchedProduct.unitPrice || matchedProduct.basePrice || 0;
                        const productType = matchedProduct.type || 'custom_extra';
                        const productCategory = matchedProduct.category || productType;
                        const isCigar = productType === 'cigars' || productCategory === 'cigars';

                        // Get emoji for category
                        const categoryEmoji = {
                          cigars: '🚬',
                          champagne: '🍾',
                          wine: '🍷',
                          wines: '🍷',
                          caviar: '🥄',
                          flowers: '💐',
                          spirits: '🥃',
                          delicatesse: '🍽️'
                        };

                        return (
                          <div className="mt-3 pt-3 border-t border-gray-200/50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{categoryEmoji[productCategory] || categoryEmoji[productType] || '✨'}</span>
                              <span className="text-sm font-medium text-gray-700">
                                {productName}
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                ${productPrice.toLocaleString()}
                              </span>
                              {isCigar && <span className="text-xs text-orange-500">(+$2,000 cleaning)</span>}
                            </div>
                            <button
                              onClick={() => {
                                // Use actual database product data
                                const cartItem = {
                                  ...matchedProduct,
                                  cartId: Date.now(),
                                  addedAt: new Date().toISOString(),
                                  price: productPrice,
                                  basePrice: productPrice,
                                  totalWithFee: isCigar ? productPrice + 2000 : productPrice
                                };

                                // Add cleaning fee for cigars
                                if (isCigar) {
                                  const hasCleaningFee = cartItems.some(item =>
                                    item.type === 'service_fee' && item.linkedTo === 'cigars'
                                  );

                                  if (!hasCleaningFee) {
                                    const cleaningFee = {
                                      id: `cleaning-${Date.now()}`,
                                      cartId: Date.now() + 1,
                                      type: 'service_fee',
                                      name: 'Aircraft Cleaning Fee',
                                      description: 'Required deep cleaning for aircraft after cigar/smoking use',
                                      price: 2000,
                                      basePrice: 2000,
                                      totalWithFee: 2000,
                                      linkedTo: 'cigars',
                                      addedAt: new Date().toISOString()
                                    };
                                    setCartItems(prev => [...prev, cartItem, cleaningFee]);
                                  } else {
                                    setCartItems(prev => [...prev, cartItem]);
                                  }
                                } else {
                                  setCartItems(prev => [...prev, cartItem]);
                                }

                                setToast({ message: `Added ${productName} to cart`, type: 'success' });
                                setChatHistory(prev => prev.map(c =>
                                  c.id === activeChat
                                    ? {
                                        ...c,
                                        messages: [...c.messages, {
                                          role: 'assistant',
                                          content: `✓ Added ${productName} to your cart${isCigar ? ' (including $2,000 aircraft cleaning fee)' : ''}. You can review it in your cart before checkout.`
                                        }]
                                      }
                                    : c
                                ));
                              }}
                              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
                            >
                              <ShoppingCart size={14} />
                              Add to Cart
                            </button>
                          </div>
                        );
                      })()}

                    {/* Action Buttons for Booking Confirmation */}
                    {msg.action === 'send_charter_request' && (
                      <button
                        onClick={() => {
                          sendRequest();
                          setChatHistory(prev => prev.map(c =>
                            c.id === activeChat
                              ? {
                                  ...c,
                                  messages: [...c.messages, {
                                    role: 'assistant',
                                    content: 'Your charter request has been submitted successfully. Our team will contact you shortly to confirm the details.'
                                  }]
                                }
                              : c
                          ));
                        }}
                        className="mt-3 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center gap-2 shadow-lg hover:scale-105"
                      >
                        <Send size={18} />
                        Submit Charter Request
                      </button>
                    )}

                    {/* Booking Action Buttons - Add to Cart & Send Custom Request */}
                    {msg.action === 'confirm_booking' && msg.bookingData && (
                      <div className="mt-3 flex gap-2">
                        {/* Add to Cart Button - Small, elegant */}
                        <button
                          onClick={() => {
                            const cartItem = {
                              ...msg.bookingData,
                              cartId: Date.now(),
                              addedAt: new Date().toISOString()
                            };
                            setCartItems(prev => [...prev, cartItem]);
                            setToast({ message: `Added ${msg.bookingData.name || 'item'} to cart`, type: 'success' });
                            setChatHistory(prev => prev.map(c =>
                              c.id === activeChat
                                ? {
                                    ...c,
                                    messages: [...c.messages, {
                                      role: 'assistant',
                                      content: `Added to your cart. You can review and adjust details (catering, dates, etc.) in your cart before checkout.`
                                    }]
                                  }
                                : c
                            ));
                          }}
                          className="flex-1 px-3 py-2 bg-white/50 hover:bg-white/70 text-gray-700 text-xs font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 border border-gray-200/50 hover:border-gray-300/50"
                          style={{ backdropFilter: 'blur(8px)' }}
                        >
                          <ShoppingCart size={14} />
                          Add to Cart
                        </button>

                        {/* Send Request Button - Small, elegant with darker border */}
                        <button
                          onClick={async () => {
                            try {
                              // First add to cart
                              const cartItem = {
                                ...msg.bookingData,
                                cartId: Date.now(),
                                addedAt: new Date().toISOString(),
                                isCustomRequest: true
                              };
                              setCartItems(prev => [...prev, cartItem]);

                              // Then save custom request to database
                              const requestData = {
                                type: 'custom_request',
                                source: 'ai_chat',
                                ...msg.bookingData,
                                conversation_id: activeChat,
                                submitted_at: new Date().toISOString()
                              };

                              const result = await createRequest(
                                'custom_request',
                                requestData,
                                user?.id
                              );

                              if (result.success) {
                                setToast({ message: 'Request added to cart and sent to bookings@privatecharterx.com', type: 'success' });
                                setChatHistory(prev => prev.map(c =>
                                  c.id === activeChat
                                    ? {
                                        ...c,
                                        messages: [...c.messages, {
                                          role: 'assistant',
                                          content: `Your request has been added to your cart and sent to our team at bookings@privatecharterx.com. You can track its status in your AI Requests. We'll get back to you within 2-4 hours.`
                                        }]
                                      }
                                    : c
                                ));
                              } else {
                                throw new Error(result.error || 'Failed to send request');
                              }
                            } catch (error) {
                              console.error('Error sending custom request:', error);
                              setToast({ message: 'Failed to send request. Please try again.', type: 'error' });
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-white/50 hover:bg-white/70 text-gray-700 text-xs font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 border border-gray-200/50 hover:border-gray-300/50"
                          style={{ backdropFilter: 'blur(8px)' }}
                        >
                          <Send size={14} />
                          Send Request
                        </button>
                      </div>
                    )}

                    {/* Break the Price - Confirm & Send Request - HIDDEN (feature disabled) */}
                    {/* {msg.action === 'price_break_confirm' && msg.extractedData && (
                      ...hidden...
                    )} */}
                  </div>
                </div>
              );
            })}

            {assistantTyping && !isSearching && (
              <div className="flex justify-start w-full">
                <div className="flex flex-col gap-1 ml-12" style={{ maxWidth: '75%' }}>
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600 font-medium">Sphera AI</span>
                    <span className="text-xs text-gray-400">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="px-4 py-3 bg-gray-200 text-black border border-gray-300 rounded-2xl">
                    <TypingAnimation />
                  </div>
                </div>
              </div>
            )}

            {isSearching && (
              <div className="flex justify-start w-full">
                <div className="flex flex-col gap-1 ml-12" style={{ maxWidth: '75%' }}>
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600 font-medium">Sphera AI</span>
                    <span className="text-xs text-gray-400">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="px-4 py-3 bg-gray-200 text-black border border-gray-300 rounded-2xl">
                    <LoadingMessage stage={loadingStage} />
                  </div>
                </div>
              </div>
            )}

            {weather && (
              <WeatherWidget location={weather.location} weather={weather} />
            )}

            {searchResults && searchResults.tabs && searchResults.tabs.length > 0 && (
              <SearchResults
                tabs={searchResults.tabs}
                selectedItems={selectedItems}
                onSelectItem={(id) => setSelectedItems(prev =>
                  prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                )}
                onBookNow={(item) => addToCart(item)}
                onAddToCalendar={(item) => {
                  setSelectedItemForCalendar(item);
                  setShowCalendarModal(true);
                }}
                onAddToCart={(item) => addToCart(item)}
                onRequestChanges={(item) => handleAdjustItem(item)}
                onPayCrypto={(item) => {
                  // Set item for crypto payment and open payment modal
                  setSelectedPaymentItem(item);
                  setShowCryptoPayment(true);
                }}
                onBuildJourney={handleBuildJourney}
              />
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. INPUT - FIXED AT BOTTOM on mobile - Less padding on mobile */}
      <div className="flex-shrink-0 sticky bottom-0 z-30 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 bg-gradient-to-t from-white via-white/95 to-transparent sm:bg-transparent">
        <div className="max-w-3xl mx-auto">
          {/* Message Limit Reached (20 messages per chat) */}
          {messageLimitReached ? (
            <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageSquare size={20} className="text-blue-500" />
                  <span className="font-medium text-gray-900">Message Limit Reached</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  You've reached 20 messages for this conversation.
                  {cartItems.length > 0 && ` You have ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your cart.`}
                </p>
                <div className="flex gap-3">
                  {/* Show checkout option if cart has items */}
                  {cartItems.length > 0 ? (
                    <>
                      <button
                        onClick={() => setShowCartSidebar(true)}
                        className="flex-1 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={18} />
                        View Cart ({cartItems.length})
                      </button>
                      <button
                        onClick={() => setShowRequestForm(true)}
                        className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Send size={18} />
                        Send Request
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowRequestForm(true)}
                        className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Send size={18} />
                        Send Request
                      </button>
                      <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300 flex items-center justify-center gap-2"
                      >
                        <Crown size={18} />
                        Upgrade
                      </button>
                    </>
                  )}
                </div>
                {/* Upgrade option for more messages */}
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Crown size={14} />
                  Need more messages? Upgrade your plan
                </button>
              </div>
            </div>
          ) : (
            /* Normal Input */
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
              {/* Break the Price Button - HIDDEN (feature disabled) */}
              {/* <button
                onClick={() => setShowBreakThePrice(true)}
                disabled={!canUseBreakThePrice() || isSearching}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  canUseBreakThePrice()
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                } disabled:opacity-50`}
                title={canUseBreakThePrice() ? 'Break the Price - Upload competitor quote' : 'Upgrade to unlock Break the Price'}
              >
                <Upload size={18} />
              </button> */}

              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentMessage.trim() && !isSearching) {
                    handleSendMessage(currentMessage);
                  }
                }}
                placeholder="Message Sphera..."
                disabled={isSearching}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 disabled:cursor-not-allowed"
              />

              {/* Message counter - HIDDEN FOR TESTING (limits disabled)
              {messageCount > 0 && !userSubscriptionLimits?.unlimited_messages && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  messageCount >= MAX_MESSAGES_PER_CHAT - 3
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {messageCount}/{MAX_MESSAGES_PER_CHAT}
                </span>
              )}
              */}

              <button
                onClick={() => handleSendMessage(currentMessage)}
                disabled={!currentMessage.trim() || isSearching}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentMessage.trim() && !isSearching
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:scale-110'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCartSidebar && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={() => setShowCartSidebar(false)} />
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl z-50 animate-fade-in-right flex flex-col max-h-screen">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Cart ({cartItems.length})</h3>
                <button onClick={() => setShowCartSidebar(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              {/* Add Extra Button - toggles inline form in cart dropdown */}
              <button
                onClick={() => setShowInlineExtras(!showInlineExtras)}
                className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showInlineExtras
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {showInlineExtras ? <X size={16} /> : <Plus size={16} />}
                {showInlineExtras ? 'Close Extras' : '+ Extra Services'}
              </button>
            </div>

            {/* Inline Extras Form - shown inside cart dropdown */}
            {showInlineExtras && (
              <div className="border-b border-gray-200 bg-gray-50 p-3 flex-shrink-0 max-h-[50vh] overflow-y-auto">
                {!selectedExtraCategory ? (
                  <>
                    <p className="text-xs text-gray-500 mb-2">Select a category</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'caviar', icon: '🥄', label: 'Caviar' },
                        { id: 'cigars', icon: '🚬', label: 'Cigars' },
                        { id: 'flowers', icon: '💐', label: 'Flowers' },
                        { id: 'cakes', icon: '🎂', label: 'Cakes' },
                        { id: 'decorations', icon: '🎈', label: 'Decor' },
                        { id: 'photography', icon: '📸', label: 'Photo' },
                        { id: 'special', icon: '⭐', label: 'Special' },
                        { id: 'smoking', icon: '✈️', label: 'Aircraft' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedExtraCategory(cat.id);
                            setCustomExtraForm(prev => ({ ...prev, category: cat.id }));
                          }}
                          className="flex flex-col items-center gap-0.5 p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors text-center border border-gray-200 hover:border-gray-300"
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-[10px] font-medium text-gray-700">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedExtraCategory(null)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <ChevronLeft size={14} />
                      Back to categories
                    </button>

                    {/* LUXURY SERVICES CATALOG */}
                    {(() => {
                      // Luxury Services Data
                      const luxuryServices = {
                        caviar: [
                          { product: 'Sevruga Caviar 50g', price_usd: 185, unit: 'per 50g' },
                          { product: 'Sevruga Caviar 100g', price_usd: 370, unit: 'per 100g' },
                          { product: 'Sevruga Caviar 200g', price_usd: 740, unit: 'per 200g' },
                          { product: 'Sevruga Caviar 250g', price_usd: 925, unit: 'per 250g' },
                          { product: 'Sevruga Caviar 500g', price_usd: 1850, unit: 'per 500g' },
                          { product: 'Oscietra Caviar 30g', price_usd: 210, unit: 'per 30g' },
                          { product: 'Oscietra Caviar 50g', price_usd: 350, unit: 'per 50g' },
                          { product: 'Oscietra Caviar 200g', price_usd: 1395, unit: 'per 200g' },
                          { product: 'Beluga Siberian 30g', price_usd: 160, unit: 'per 30g' },
                          { product: 'Beluga Siberian 50g', price_usd: 265, unit: 'per 50g' },
                          { product: 'Beluga Siberian 100g', price_usd: 530, unit: 'per 100g' }
                        ],
                        cigars: [
                          { product: 'Cohiba Behike 52', price_usd: 120, unit: 'Robusto • Medium-Full' },
                          { product: 'Cohiba Behike 54', price_usd: 140, unit: 'Toro • Medium-Full' },
                          { product: 'Cohiba Behike 56', price_usd: 160, unit: 'Gran Robusto • Medium-Full' },
                          { product: 'Cohiba Esplendido', price_usd: 85, unit: 'Churchill • Medium' },
                          { product: 'Cohiba Siglo VI', price_usd: 70, unit: 'Toro • Medium' },
                          { product: 'Cohiba Lancero', price_usd: 65, unit: 'Lonsdale • Medium' },
                          { product: 'Cohiba Robusto', price_usd: 55, unit: 'Robusto • Medium' },
                          { product: 'Montecristo No. 2', price_usd: 45, unit: 'Torpedo • Medium' },
                          { product: 'Montecristo No. 4', price_usd: 35, unit: 'Petit Corona • Medium' },
                          { product: 'Montecristo Edmundo', price_usd: 40, unit: 'Robusto • Medium' },
                          { product: 'Padron 1964 Anniversary Maduro', price_usd: 35, unit: 'Robusto • Full' },
                          { product: 'Padron 1926 Serie No. 9', price_usd: 40, unit: 'Torpedo • Full' },
                          { product: 'Davidoff Millennium Robusto', price_usd: 45, unit: 'Robusto • Medium' },
                          { product: 'Davidoff Winston Churchill', price_usd: 50, unit: 'Toro • Medium' },
                          { product: 'Davidoff Year of the Dragon', price_usd: 180, unit: 'Toro • Medium' },
                          { product: 'Arturo Fuente Opus X Perfecxion No. 4', price_usd: 35, unit: 'Robusto • Full' },
                          { product: 'Arturo Fuente Opus X Double Corona', price_usd: 55, unit: 'Double Corona • Full' },
                          { product: 'Romeo y Julieta Churchill', price_usd: 30, unit: 'Churchill • Medium' },
                          { product: 'Partagas Serie D No. 4', price_usd: 30, unit: 'Robusto • Full' },
                          { product: 'Partagas Lusitania', price_usd: 40, unit: 'Double Corona • Full' }
                        ],
                        flowers: [
                          { product: '12 Premium Red Roses', price_usd: 80, unit: 'per bouquet' },
                          { product: '24 Premium Red Roses', price_usd: 150, unit: 'per bouquet' },
                          { product: 'Luxury Orchid Arrangement', price_usd: 200, unit: 'per arrangement' },
                          { product: 'Mixed Designer Bouquet', price_usd: 250, unit: 'per bouquet' },
                          { product: 'Premium Event Installation', price_usd: 500, unit: 'per installation' }
                        ],
                        cakes: [
                          { product: 'Custom Birthday Cake (2-Tier)', price_usd: 250, unit: 'per cake' },
                          { product: 'Designer Celebration Cake', price_usd: 350, unit: 'per cake' },
                          { product: 'Macaron Tower (100 pieces)', price_usd: 300, unit: 'per tower' },
                          { product: 'Luxury Dessert Platter', price_usd: 200, unit: 'per platter' }
                        ],
                        decorations: [
                          { product: 'Birthday Package', price_usd: 350, unit: 'per setup' },
                          { product: 'Anniversary Romantic Setup', price_usd: 450, unit: 'per setup' },
                          { product: 'Proposal Premium Setup', price_usd: 800, unit: 'per setup' },
                          { product: 'Corporate Branding Package', price_usd: 550, unit: 'per setup' }
                        ],
                        photography: [
                          { product: 'Photographer (3 hours)', price_usd: 1000, unit: 'per session' },
                          { product: 'Videographer (Event)', price_usd: 1500, unit: 'per event' },
                          { product: 'Drone Footage', price_usd: 750, unit: 'per session' },
                          { product: 'Photo + Video Package', price_usd: 2800, unit: 'per package' }
                        ],
                        special: [
                          { product: 'Pet Transport (Cabin-Safe)', price_usd: 250, unit: 'per transport' },
                          { product: 'Security Personnel', price_usd: 700, unit: 'per day' },
                          { product: 'Interpreter', price_usd: 200, unit: 'per hour' },
                          { product: 'Butler Service', price_usd: 900, unit: 'per day' }
                        ],
                        smoking: [
                          { product: 'Aircraft Deep Cleaning Fee (Smoking)', price_usd: 2000, unit: 'Required for smoking onboard' }
                        ]
                      };

                      const items = luxuryServices[selectedExtraCategory] || [];
                      const categoryLabels = {
                        caviar: 'Premium Caviar',
                        cigars: 'Premium Cigars',
                        flowers: 'Floral Arrangements',
                        cakes: 'Cakes & Desserts',
                        decorations: 'Event Decorations',
                        photography: 'Photo & Video',
                        special: 'Special Services',
                        smoking: 'Aircraft Services'
                      };

                      return (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-700 mb-2">{categoryLabels[selectedExtraCategory]}</p>
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="text-xs font-medium text-gray-900 truncate">{item.product}</p>
                                <p className="text-[10px] text-gray-500">{item.unit}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-semibold text-gray-900">${item.price_usd.toLocaleString()}</span>
                                <button
                                  onClick={() => {
                                    const newExtra = {
                                      id: `extra-${Date.now()}`,
                                      cartId: `extra-${Date.now()}`,
                                      type: 'custom_extra',
                                      name: item.product,
                                      title: item.product,
                                      category: selectedExtraCategory,
                                      quantity: 1,
                                      unitPrice: item.price_usd,
                                      price: item.price_usd,
                                      price_usd: item.price_usd,
                                      basePrice: item.price_usd,
                                      totalWithFee: item.price_usd,
                                      unit: item.unit,
                                      isEstimate: false,
                                      addedAt: new Date().toISOString()
                                    };

                                    // Check if this is a cigar item and if cleaning fee already exists
                                    const isCigarItem = selectedExtraCategory === 'cigars';
                                    const hasCleaningFee = cartItems.some(i =>
                                      i.isCleaningFee === true ||
                                      i.id === 'aircraft-cleaning-fee-smoking' ||
                                      (i.name && i.name.toLowerCase().includes('cleaning fee') && i.name.toLowerCase().includes('smoking'))
                                    );

                                    if (isCigarItem && !hasCleaningFee) {
                                      // Add cleaning fee automatically
                                      const cleaningFeeItem = {
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
                                      setCartItems(prev => [...prev, newExtra, cleaningFeeItem]);
                                      setToast({ message: `${item.product} + cleaning fee added`, type: 'cart' });
                                    } else {
                                      setCartItems(prev => [...prev, newExtra]);
                                      setToast({ message: `${item.product} added`, type: 'cart' });
                                    }
                                  }}
                                  className="px-2 py-1 bg-gray-900 text-white text-[10px] font-medium rounded hover:bg-gray-800 transition-colors"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Custom Request Option */}
                    <div className="pt-2 border-t border-gray-200 mt-3">
                      <p className="text-[10px] text-gray-500 mb-1.5">Or add a custom request:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customExtraForm.name}
                          onChange={(e) => setCustomExtraForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Custom item name..."
                          className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                        />
                        <button
                          onClick={() => {
                            if (!customExtraForm.name.trim()) return;
                            const newExtra = {
                              id: `extra-${Date.now()}`,
                              cartId: `extra-${Date.now()}`,
                              type: 'custom_extra',
                              name: customExtraForm.name,
                              title: customExtraForm.name,
                              category: selectedExtraCategory,
                              quantity: 1,
                              price: 0,
                              basePrice: 0,
                              totalWithFee: 0,
                              isEstimate: true,
                              isCustomRequest: true,
                              addedAt: new Date().toISOString()
                            };
                            setCartItems(prev => [...prev, newExtra]);
                            setShowInlineExtras(false);
                            setSelectedExtraCategory(null);
                            setCustomExtraForm({ name: '', category: '', quantity: 1, notes: '' });
                            setToast({ message: `Custom request added`, type: 'cart' });
                          }}
                          disabled={!customExtraForm.name.trim()}
                          className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus size={12} />
                          Add
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-1">Price on request</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {cartItems.length === 0 && !showInlineExtras ? (
              <div className="p-6 text-center text-gray-500 flex-1 flex flex-col items-center justify-center">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                <p>Your cart is empty</p>
              </div>
            ) : cartItems.length === 0 ? null : (
              <>
                <div className="flex-1 min-h-0 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
                  {cartItems.map((item, idx) => {
                    const isEmptyLeg = item.type === 'empty_legs' || item.type === 'emptyleg';
                    const isAdventure = item.type === 'adventure' || item.type === 'fixed_offer';
                    const isTransfer = item.type === 'taxi' || item.type === 'transfer' || item.type === 'ground_transport';
                    const isJet = item.type === 'jets' || item.type === 'jet';
                    const isHelicopter = item.type === 'helicopters' || item.type === 'helicopter';
                    const isYacht = item.type === 'yachts' || item.type === 'yacht';
                    const isLuxuryCar = item.type === 'luxury_cars' || item.type === 'luxury_car';
                    const isWine = item.type === 'wines' || item.type === 'wine';
                    const isCustomExtra = item.type === 'custom_extra';
                    const canDirectCheckout = isEmptyLeg || isAdventure || isWine;
                    const hasAirportFee = item.airportPickupFee && item.airportPickupFee > 0;
                    // Currency: All prices now in USD
                    const currencySymbol = '$';

                    // Custom Extra - Special horizontal layout
                    if (isCustomExtra) {
                      return (
                        <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-200 animate-fade-in hover:border-gray-400 transition-all duration-300">
                          <div className="flex gap-3">
                            {/* Left: Product Image */}
                            <div className="flex-shrink-0">
                              {item.image ? (
                                <div className="w-14 h-18 rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-lg">${item.category === 'wine' ? '🍷' : item.category === 'champagne' ? '🍾' : item.category === 'cigars' ? '🚬' : item.category === 'caviar' ? '🥄' : item.category === 'flowers' ? '💐' : '✨'}</div>`;
                                    }}
                                  />
                                </div>
                              ) : item.isLoadingPrice ? (
                                <div className="w-14 h-18 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                                </div>
                              ) : (
                                <div className="w-14 h-18 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 text-lg">
                                  {item.category === 'wine' ? '🍷' : item.category === 'champagne' ? '🍾' : item.category === 'cigars' ? '🚬' : item.category === 'caviar' ? '🥄' : item.category === 'flowers' ? '💐' : '✨'}
                                </div>
                              )}
                            </div>

                            {/* Center: Title & Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-700 text-white">
                                  {item.category?.toUpperCase() || 'EXTRA'}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-200 text-gray-600">
                                  {item.isLoadingPrice ? 'LOADING...' : 'TBC'}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{item.isLoadingPrice ? 'Fetching estimated price...' : 'Availability to be confirmed'}</p>

                              {/* Quantity selector */}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-gray-500">Qty:</span>
                                <button
                                  onClick={() => {
                                    const qty = Math.max(1, (item.quantity || 1) - 1);
                                    setCartItems(prev => prev.map((ci, i) =>
                                      (ci.cartId === item.cartId || i === idx)
                                        ? { ...ci, quantity: qty, price: (ci.unitPrice || ci.price) * qty, basePrice: (ci.unitPrice || ci.price) * qty, totalWithFee: (ci.unitPrice || ci.price) * qty }
                                        : ci
                                    ));
                                  }}
                                  className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-xs"
                                >
                                  -
                                </button>
                                <span className="text-xs font-medium w-4 text-center">{item.quantity || 1}</span>
                                <button
                                  onClick={() => {
                                    const qty = (item.quantity || 1) + 1;
                                    setCartItems(prev => prev.map((ci, i) =>
                                      (ci.cartId === item.cartId || i === idx)
                                        ? { ...ci, quantity: qty, price: (ci.unitPrice || ci.price) * qty, basePrice: (ci.unitPrice || ci.price) * qty, totalWithFee: (ci.unitPrice || ci.price) * qty }
                                        : ci
                                    ));
                                  }}
                                  className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Right: Price & Remove */}
                            <div className="flex flex-col items-end justify-between">
                              <button
                                onClick={() => removeFromCart(item.cartId || idx)}
                                className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                              <div className="text-right">
                                {item.isLoadingPrice ? (
                                  <>
                                    <p className="text-xs text-gray-500">Loading...</p>
                                    <div className="animate-pulse bg-gray-200 h-5 w-16 rounded"></div>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs text-gray-500">Est.</p>
                                    <p className="text-sm font-bold text-gray-900">~${(item.price || item.basePrice || 0).toLocaleString()}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Regular cart items (jets, helicopters, yachts, etc.)
                    const isExpanded = expandedCartItems[item.cartId || idx];
                    const isPaidItem = item.isPaid || item.paymentStatus === 'pending_confirmation';
                    return (
                      <div key={idx} className={`rounded-xl border animate-fade-in transition-all duration-300 overflow-hidden ${
                        isPaidItem
                          ? 'bg-green-50 border-green-300 opacity-70'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}>
                        {/* Paid badge overlay */}
                        {isPaidItem && (
                          <div className="bg-green-100 px-3 py-1.5 border-b border-green-200 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-semibold text-green-800">PAYMENT INITIATED - Awaiting CoinGate Confirmation</span>
                          </div>
                        )}
                        {/* Collapsible Header - click to expand */}
                        <div
                          className={`p-3 flex items-center gap-3 ${isPaidItem ? 'opacity-60' : 'cursor-pointer'}`}
                          onClick={() => !isPaidItem && setExpandedCartItems(prev => ({ ...prev, [item.cartId || idx]: !prev[item.cartId || idx] }))}
                        >
                          {/* Type badge & name */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                isPaidItem ? 'bg-green-600 text-white' :
                                isJet ? 'bg-gray-800 text-white' :
                                isHelicopter ? 'bg-gray-700 text-white' :
                                isYacht ? 'bg-gray-600 text-white' :
                                isLuxuryCar ? 'bg-gray-900 text-white' :
                                isEmptyLeg ? 'bg-gray-800 text-white' :
                                isTransfer ? 'bg-gray-400 text-white' :
                                isAdventure ? 'bg-gray-800 text-white' :
                                isWine ? 'bg-gray-700 text-white' :
                                'bg-gray-300 text-gray-700'
                              }`}>
                                {isPaidItem ? 'PAID' : isJet ? 'CHARTER' : isHelicopter ? 'HELI' : isYacht ? 'YACHT' : isLuxuryCar ? 'SUPERCAR' : isEmptyLeg ? 'EMPTY LEG' : isTransfer ? 'TRANSFER' : isAdventure ? 'EXPERIENCE' : isWine ? 'WINE' : 'SERVICE'}
                              </span>
{/* CRYPTO PAY badge hidden - now shown only in final submit popup and My Requests */}
                              {!isPaidItem && (isJet || isHelicopter) && !isEmptyLeg && !item.isMultiStop && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-gray-200 text-gray-600">AI REQUEST</span>
                              )}
                              {!isPaidItem && item.isMultiStop && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700">MULTI-STOP</span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {isEmptyLeg ? `${item.from_iata || item.from_city || item.from || ''} → ${item.to_iata || item.to_city || item.to || ''}` : (item.name || item.title || item.aircraft_type || item.model)}
                            </p>
                            {/* Flight route & duration for jets/helicopters */}
                            {(isJet || isHelicopter) && item.route && (
                              <p className="text-[10px] text-gray-500 mt-0.5">📍 {item.route}</p>
                            )}
                            {(isJet || isHelicopter) && item.estimatedDuration && (
                              <p className="text-[10px] text-gray-500">⏱️ {item.estimatedDuration} ({item.billedHours}h billed)</p>
                            )}
                            {/* Wine details */}
                            {isWine && item.producer && (
                              <p className="text-[10px] text-gray-500 mt-0.5">{item.producer}{item.vintage ? ` · ${item.vintage}` : ''}</p>
                            )}
                          </div>
                          {/* Price & expand icon */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">
                                {currencySymbol}{(item.price || item.basePrice || item.price_usd || 0).toLocaleString()}
                              </p>
                              {item.priceCalculation && (
                                <p className="text-[9px] text-gray-400">{item.priceCalculation}</p>
                              )}
                            </div>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {/* Expanded Details - scrollable */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-white max-h-48 overflow-y-auto">
                            {/* Header actions */}
                            <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100">
                              <span className="text-[10px] text-gray-500">Details & Options</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeFromCart(item.cartId || idx); }}
                                className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1"
                              >
                                <Trash2 size={10} />
                                Remove
                              </button>
                            </div>

                            {/* Multi-Stop Journey Details */}
                            {item.isMultiStop && item.stops && (
                              <div className="p-3 space-y-2">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Journey Stops</p>
                                <div className="space-y-1">
                                  {item.stops.map((stop, stopIdx) => (
                                    <div key={stopIdx} className="flex items-center gap-2 text-xs">
                                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-[9px] font-bold text-gray-600">{stopIdx + 1}</span>
                                      </div>
                                      <span className="font-medium text-gray-900">{stop.city} ({stop.code})</span>
                                      {stop.date && stop.date !== 'TBD' && (
                                        <span className="text-gray-500">{stop.date}</span>
                                      )}
                                      {stop.time && stop.time !== 'TBD' && (
                                        <span className="text-gray-400">{stop.time}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[10px] text-gray-400 italic pt-2">
                                  Our coordinators will recommend the best aircraft for this route.
                                </p>
                              </div>
                            )}

                            {/* Jet/Heli Details */}
                            {(isJet || isHelicopter) && !item.isMultiStop && (
                              <div className="p-3 space-y-2 text-xs text-gray-600">
                                <div className="grid grid-cols-2 gap-2">
                                  {item.max_passengers && (
                                    <div className="flex items-center gap-1.5">
                                      <Users size={11} className="text-gray-400" />
                                      <span>{item.max_passengers} pax</span>
                                    </div>
                                  )}
                                  {item.range_km && (
                                    <div className="flex items-center gap-1.5">
                                      <Plane size={11} className="text-gray-400" />
                                      <span>{item.range_km.toLocaleString()} km</span>
                                    </div>
                                  )}
                                  {item.speed_kts && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">⚡</span>
                                      <span>{item.speed_kts} kts</span>
                                    </div>
                                  )}
                                  {(item.hourly_rate_usd || item.hourly_rate_eur) && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">💰</span>
                                      <span>${(item.hourly_rate_usd || Math.round(convertToUSD(item.hourly_rate_eur, 'EUR'))).toLocaleString()}/hr</span>
                                    </div>
                                  )}
                                </div>
                                {/* Catering Options - Monochromatic */}
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-2">Catering Options</p>
                                  <div className="space-y-1.5">
                                    {[
                                      { id: 'standard', label: 'Standard (snacks & drinks)', price: 0 },
                                      { id: 'premium', label: 'Premium dining', price: 350 },
                                      { id: 'gourmet', label: 'Gourmet experience', price: 750 }
                                    ].map(option => (
                                      <label key={option.id} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                          type="radio"
                                          name={`catering-${item.cartId || idx}`}
                                          checked={(item.catering || 'standard') === option.id}
                                          onChange={() => {
                                            setCartItems(prev => prev.map((ci, i) =>
                                              (ci.cartId === item.cartId || i === idx)
                                                ? { ...ci, catering: option.id, cateringPrice: option.price }
                                                : ci
                                            ));
                                          }}
                                          className="w-3 h-3 text-gray-900 border-gray-400 focus:ring-gray-500 focus:ring-1"
                                        />
                                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{option.label}</span>
                                        {option.price > 0 && (
                                          <span className="text-xs text-gray-500 ml-auto">+${option.price}</span>
                                        )}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Yacht Details */}
                            {isYacht && (
                              <div className="p-3 space-y-2 text-xs text-gray-600">
                                <div className="grid grid-cols-2 gap-2">
                                  {item.length_ft && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">📏</span>
                                      <span>{item.length_ft} ft</span>
                                    </div>
                                  )}
                                  {item.max_passengers && (
                                    <div className="flex items-center gap-1.5">
                                      <Users size={12} className="text-gray-400" />
                                      <span>{item.max_passengers} guests</span>
                                    </div>
                                  )}
                                  {item.cabins && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">🛏️</span>
                                      <span>{item.cabins} cabins</span>
                                    </div>
                                  )}
                                  {item.crew && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">👥</span>
                                      <span>{item.crew} crew</span>
                                    </div>
                                  )}
                                  {(item.daily_rate_usd || item.daily_rate_eur) && (
                                    <div className="flex items-center gap-1.5 col-span-2">
                                      <span className="text-gray-400">💰</span>
                                      <span>${(item.daily_rate_usd || Math.round(convertToUSD(item.daily_rate_eur, 'EUR'))).toLocaleString()}/day</span>
                                    </div>
                                  )}
                                </div>
                                {item.location && (
                                  <div className="flex items-center gap-1.5 pt-1">
                                    <MapPin size={12} className="text-gray-400" />
                                    <span>{item.location}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Luxury Car Details */}
                            {isLuxuryCar && (
                              <div className="p-3 space-y-2 text-xs text-gray-600">
                                <div className="grid grid-cols-2 gap-2">
                                  {item.year && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">📅</span>
                                      <span>{item.year}</span>
                                    </div>
                                  )}
                                  {(item.seats || item.max_passengers) && (
                                    <div className="flex items-center gap-1.5">
                                      <Users size={12} className="text-gray-400" />
                                      <span>{item.seats || item.max_passengers} seats</span>
                                    </div>
                                  )}
                                  {item.transmission && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">⚙️</span>
                                      <span>{item.transmission}</span>
                                    </div>
                                  )}
                                  {(item.daily_rate_usd || item.daily_rate_eur) && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">💰</span>
                                      <span>${(item.daily_rate_usd || Math.round(convertToUSD(item.daily_rate_eur, 'EUR'))).toLocaleString()}/day</span>
                                    </div>
                                  )}
                                </div>
                                {/* Rental days selector */}
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600">Rental days:</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          const days = Math.max(1, (item.rentalDays || 1) - 1);
                                          const dailyRate = item.daily_rate_usd || Math.round(convertToUSD(item.daily_rate_eur || item.price, 'EUR'));
                                          setCartItems(prev => prev.map((ci, i) =>
                                            (ci.cartId === item.cartId || i === idx)
                                              ? { ...ci, rentalDays: days, price: dailyRate * days }
                                              : ci
                                          ));
                                        }}
                                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                                      >
                                        -
                                      </button>
                                      <span className="text-sm font-medium w-8 text-center">{item.rentalDays || 1}</span>
                                      <button
                                        onClick={() => {
                                          const days = (item.rentalDays || 1) + 1;
                                          const dailyRate = item.daily_rate_usd || Math.round(convertToUSD(item.daily_rate_eur || item.price, 'EUR'));
                                          setCartItems(prev => prev.map((ci, i) =>
                                            (ci.cartId === item.cartId || i === idx)
                                              ? { ...ci, rentalDays: days, price: dailyRate * days }
                                              : ci
                                          ));
                                        }}
                                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">
                                  Insurance included • Min. age 18 • Valid license required
                                </div>
                              </div>
                            )}

                            {/* Empty Leg Details */}
                            {isEmptyLeg && (
                              <div className="p-3 space-y-2 text-xs text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Plane size={12} className="text-gray-400" />
                                  <span>{item.from_city || item.from} → {item.to_city || item.to}</span>
                                </div>
                                {item.departure_date && (
                                  <div className="flex items-center gap-2">
                                    <Clock size={12} className="text-gray-400" />
                                    <span>{item.departure_date} {item.departure_time && `at ${item.departure_time}`}</span>
                                  </div>
                                )}
                                {item.available_seats && (
                                  <div className="flex items-center gap-2">
                                    <Users size={12} className="text-gray-400" />
                                    <span>Up to {item.available_seats} passengers</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Transfer Details */}
                            {isTransfer && (
                              <div className="p-3 space-y-2 text-xs text-gray-600">
                                {item.passengers && (
                                  <div className="flex items-center gap-2">
                                    <Users size={12} className="text-gray-400" />
                                    <span>{item.passengers} passengers</span>
                                  </div>
                                )}
                                {item.vehiclesNeeded && item.vehiclesNeeded > 1 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400">🚐</span>
                                    <span>{item.vehiclesNeeded} vehicles</span>
                                  </div>
                                )}
                                {item.durationMinutes && (
                                  <div className="flex items-center gap-2">
                                    <Clock size={12} className="text-gray-400" />
                                    <span>~{item.durationMinutes} min drive</span>
                                  </div>
                                )}
                                <div className="text-[10px] text-gray-400 mt-1">
                                  Chauffeur • Meet & greet • Flight tracking
                                </div>
                              </div>
                            )}

                            {/* Adventure Details */}
                            {isAdventure && (
                              <div className="p-3 space-y-2 text-xs text-gray-600">
                                {item.description && (
                                  <p className="text-gray-600 line-clamp-2">{item.description}</p>
                                )}
                                {item.duration && (
                                  <div className="flex items-center gap-2">
                                    <Clock size={12} className="text-gray-400" />
                                    <span>{item.duration}</span>
                                  </div>
                                )}
                                {item.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin size={12} className="text-gray-400" />
                                    <span>{item.location}</span>
                                  </div>
                                )}
                                {item.max_participants && (
                                  <div className="flex items-center gap-2">
                                    <Users size={12} className="text-gray-400" />
                                    <span>Up to {item.max_participants} participants</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Price breakdown */}
                        <div className="p-3 pt-2 border-t border-gray-200 space-y-1">
                          {/* Estimated badge for transfers */}
                          {(isTransfer || item.isEstimate) && (
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                ESTIMATED
                              </span>
                              <span className="text-[10px] text-gray-400">Price may vary</span>
                            </div>
                          )}

                          {/* Distance for transfers */}
                          {isTransfer && item.distanceKm && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Distance</span>
                              <span className="text-gray-600">~{item.distanceKm} km</span>
                            </div>
                          )}

                          {/* Base Price */}
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">
                              {isLuxuryCar ? `${item.rentalDays || 1} day${(item.rentalDays || 1) > 1 ? 's' : ''} rental` :
                               isJet ? 'Charter quote' :
                               isCustomExtra ? `${item.quantity || 1}x ${item.category || 'item'}` :
                               isWine ? `${item.quantity || 1}x bottle` :
                               item.isEstimate ? 'Base price (est.)' : 'Base price'}
                            </span>
                            <span className="text-gray-700">
                              {item.isEstimate && isCustomExtra ? '~' : ''}{currencySymbol}{(item.basePrice || item.price_usd || item.price || 0).toLocaleString()}
                            </span>
                          </div>

                          {/* Catering for jets */}
                          {isJet && item.cateringPrice > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Catering upgrade</span>
                              <span className="text-gray-600">+${item.cateringPrice}</span>
                            </div>
                          )}

                          {/* Airport Pickup Fee (Sonderanfahrt) */}
                          {hasAirportFee && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500 flex items-center gap-1">
                                Airfield pickup fee
                              </span>
                              <span className="text-gray-600">
                                +${item.airportPickupFee}
                              </span>
                            </div>
                          )}

                          {/* VAT if applicable */}
                          {item.vat && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">VAT (8.1%)</span>
                              <span className="text-gray-600">
                                +${item.vat.toLocaleString()}
                              </span>
                            </div>
                          )}

                          {/* Total */}
                          <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-100">
                            <span className="text-xs text-gray-600 font-medium">
                              {canDirectCheckout ? 'Direct booking' : (item.isEstimate ? 'Est. total' : 'Request quote')}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {item.isEstimate ? '~' : ''}{currencySymbol}{((item.totalWithFee || item.price_usd || item.price || 0) + (item.cateringPrice || 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cart Total & Actions */}
                <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white max-h-[45vh] overflow-y-auto">
                  {/* Subtotal breakdown */}
                  {(() => {
                    const mainServices = cartItems.filter(item => item.type !== 'custom_extra');
                    const customExtras = cartItems.filter(item => item.type === 'custom_extra');

                    // All prices now in USD - with NaN protection
                    const safeNumber = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;
                    const subtotal = cartItems.reduce((sum, item) => sum + safeNumber(item.basePrice || item.price_usd || item.price || 0), 0);
                    const extrasSubtotal = customExtras.reduce((sum, item) => sum + safeNumber(item.basePrice || item.price_usd || item.price || 0), 0);
                    const airportFees = cartItems.reduce((sum, item) => sum + safeNumber(item.airportPickupFee || 0), 0);
                    const cateringTotal = cartItems.reduce((sum, item) => sum + safeNumber(item.cateringPrice || 0), 0);

                    const hasEstimates = cartItems.some(item => item.isEstimate);
                    const hasCustomExtras = customExtras.length > 0;

                    // Calculate grand total - with NaN protection
                    const grandTotal = safeNumber(subtotal + airportFees + cateringTotal);

                    return (
                      <div className="space-y-2 mb-3">
                        {hasEstimates && (
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-100">
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                              ESTIMATED
                            </span>
                            <span className="text-[10px] text-gray-400">Final price confirmed upon booking</span>
                          </div>
                        )}
                        {hasCustomExtras && (
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-100">
                            <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                              {customExtras.length} CUSTOM REQUEST{customExtras.length > 1 ? 'S' : ''}
                            </span>
                            <span className="text-[10px] text-gray-400">Availability TBC</span>
                          </div>
                        )}

                        {/* Show services subtotal */}
                        {subtotal > 0 && (
                          <div className="flex justify-between items-start gap-2 text-sm">
                            <span className="text-gray-500 flex-shrink-0">Services</span>
                            <span className="text-gray-700 text-right break-words">{hasEstimates ? '~' : ''}${subtotal.toLocaleString()}</span>
                          </div>
                        )}

                        {extrasSubtotal > 0 && (
                          <div className="flex justify-between items-start gap-2 text-sm">
                            <span className="text-gray-600 flex-shrink-0">Custom extras</span>
                            <span className="text-gray-600 text-right break-words">~${extrasSubtotal.toLocaleString()}</span>
                          </div>
                        )}
                        {cateringTotal > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Catering upgrades</span>
                            <span className="text-gray-600">+${cateringTotal.toLocaleString()}</span>
                          </div>
                        )}
                        {airportFees > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Airfield pickup fees</span>
                            <span className="text-gray-600">+${airportFees.toLocaleString()}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">{hasEstimates ? 'Est. Total' : 'Total'}</span>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900">
                              {hasEstimates ? '~' : ''}${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* PVCX Rewards Estimate */}
                        {grandTotal > 0 && (
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-gray-200 bg-gray-100 -mx-4 px-4 py-2 -mb-3 rounded-b-lg">
                            <span className="text-xs text-gray-700 flex items-center gap-1.5">
                              <span className="text-sm">✨</span>
                              PVCX Reward (1.5%)
                            </span>
                            <span className="text-sm font-bold text-gray-800">
                              +{(grandTotal * 0.015).toFixed(2)} PVCX
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Smart checkout: Direct crypto pay for payable items OR Send Request */}
                  {(() => {
                    // PAYABLE TYPES: Can checkout directly with crypto
                    // - Empty legs (fixed prices)
                    // - Wines (fixed prices)
                    // - Delicacies/extras (cigars, caviar, flowers, etc.)
                    // - Service fees (cleaning fee)
                    const payableTypes = ['empty_legs', 'emptyleg', 'adventure', 'fixed_offer', 'wines', 'wine', 'custom_extra', 'service_fee', 'cigars', 'delicatesse'];

                    // REQUEST-ONLY TYPES: Need coordinator quote
                    const requestOnlyTypes = ['jets', 'jet', 'helicopters', 'helicopter', 'yachts', 'yacht', 'luxury_cars', 'luxury_car', 'taxi', 'transfer', 'ground_transport', 'taxi_cars'];

                    // Exclude already paid items from calculations
                    const unpaidItems = cartItems.filter(item => !item.isPaid && item.paymentStatus !== 'pending_confirmation');

                    // Check if cart contains ANY request-only items
                    const hasRequestOnlyService = unpaidItems.some(item => requestOnlyTypes.includes(item.type));

                    // Payable items: items that CAN be paid directly (not request-only)
                    const payableItems = unpaidItems.filter(item => {
                      // Check if it's a payable type
                      const isPayableType = payableTypes.includes(item.type) ||
                        item.isCleaningFee ||
                        (item.category && ['cigars', 'caviar', 'flowers', 'cakes', 'decorations', 'photography', 'special', 'smoking', 'Caviar', 'Premium Cigars', 'Flowers', 'Cakes & Desserts', 'Event Decorations', 'Photography & Video', 'Aircraft Services'].includes(item.category));
                      // Must have valid price > 0
                      const hasValidPrice = (item.price_usd || item.price || item.basePrice) > 0;
                      return isPayableType && hasValidPrice;
                    });

                    const requestOnlyItems = unpaidItems.filter(item => requestOnlyTypes.includes(item.type));
                    const paidItems = cartItems.filter(item => item.isPaid || item.paymentStatus === 'pending_confirmation');
                    const hasPayableItems = payableItems.length > 0;
                    const hasRequestOnlyItems = requestOnlyItems.length > 0;
                    const onlyPaidItems = unpaidItems.length === 0 && paidItems.length > 0;

                    // NEW: Check if cart contains ONLY payable items (can do direct checkout)
                    const canDoDirectCheckout = hasPayableItems && !hasRequestOnlyService && unpaidItems.length > 0;

                    // Calculate totals for payable items - Base + VAT only
                    const payableSubtotal = payableItems.reduce((sum, item) => sum + (item.price_usd || item.price || item.basePrice || 0), 0);
                    const payableVAT = payableItems.reduce((sum, item) => sum + (item.vat_amount || Math.round((item.price_usd || item.price || item.basePrice || 0) * 0.081)), 0);
                    const payableTotal = payableItems.reduce((sum, item) => sum + (item.totalWithFee || ((item.price_usd || item.price || item.basePrice || 0) * 1.081)), 0);

                    // Helper function to save booking to database (for tracking purposes)
                    const saveBookingToDatabase = async (item, status = 'pending') => {
                      if (!user?.id) return null;
                      try {
                        // Calculate proper USD prices - Base + VAT only
                        // IMPORTANT: Sanitize to avoid NaN values
                        const rawBasePrice = item.price_usd || item.price || item.basePrice || 0;
                        const basePrice = (typeof rawBasePrice === 'number' && !isNaN(rawBasePrice)) ? rawBasePrice : 0;
                        const rawVatAmount = item.vat_amount || Math.round(basePrice * 0.081);
                        const vatAmount = (typeof rawVatAmount === 'number' && !isNaN(rawVatAmount)) ? rawVatAmount : 0;
                        const rawTotalPrice = item.totalWithFee || (basePrice + vatAmount);
                        const totalPrice = (typeof rawTotalPrice === 'number' && !isNaN(rawTotalPrice)) ? rawTotalPrice : 0;

                        const bookingData = {
                          user_id: user.id,
                          service_id: item.original_id || item.id,
                          service_type: item.type === 'empty_legs' || item.type === 'emptyleg' ? 'empty_leg' :
                                        item.type === 'adventure' || item.type === 'fixed_offer' ? 'adventure_package' : 'charter',
                          booking_type: item.type === 'empty_legs' || item.type === 'emptyleg' ? 'empty_leg' :
                                        item.type === 'adventure' || item.type === 'fixed_offer' ? 'adventure_package' : 'charter',
                          service_title: item.name || item.title || `${item.origin || item.from} → ${item.destination || item.to}`,
                          origin: item.from_city || item.origin || item.from || item.departure_airport,
                          destination: item.to_city || item.destination || item.to || item.arrival_airport,
                          departure_date: item.departure_date || item.date,
                          passengers: item.passengers || item.pax || item.max_passengers,
                          // Full price breakdown - ALL IN USD (Base + VAT only)
                          base_amount: basePrice,
                          vat_amount: vatAmount,
                          total_amount: totalPrice,
                          currency: 'USD',
                          payment_status: status,
                          // Full service details for My Bookings display
                          service_details: {
                            ...item,
                            // Ensure key fields are present
                            from_city: item.from_city || item.from || item.origin,
                            to_city: item.to_city || item.to || item.destination,
                            from_iata: item.from_iata,
                            to_iata: item.to_iata,
                            aircraft: item.aircraft || item.aircraft_type || item.aircraft_model,
                            aircraft_type: item.aircraft_type,
                            aircraft_model: item.aircraft_model,
                            category: item.category,
                            // Price breakdown - VAT only
                            base_price: basePrice,
                            vat_amount: vatAmount,
                            vat_percent: 8.1,
                            total_price: totalPrice,
                            currency: 'USD',
                            original_price: item.original_price,
                            original_currency: item.original_currency
                          },
                          conversation_id: activeChat
                        };

                        const { data, error } = await supabase
                          .from('user_bookings')
                          .insert([bookingData])
                          .select()
                          .single();

                        if (error) throw error;
                        return data;
                      } catch (err) {
                        console.error('Error saving booking:', err);
                        return null;
                      }
                    };

                    // Helper function to save to user_requests for AI Requests tracking
                    // IMPORTANT: This saves ALL relevant fields so MyRequestsView displays correctly
                    const saveToAIRequests = async (item) => {
                      if (!user?.id) return null;
                      try {
                        // Calculate proper USD prices - Base + VAT only
                        // IMPORTANT: Sanitize to avoid NaN values
                        const rawBasePrice = item.price_usd || item.price || item.basePrice || 0;
                        const basePrice = (typeof rawBasePrice === 'number' && !isNaN(rawBasePrice)) ? rawBasePrice : 0;
                        const rawVatAmount = item.vat_amount || Math.round(basePrice * 0.081);
                        const vatAmount = (typeof rawVatAmount === 'number' && !isNaN(rawVatAmount)) ? rawVatAmount : 0;
                        const rawTotalPrice = item.totalWithFee || (basePrice + vatAmount);
                        const totalPrice = (typeof rawTotalPrice === 'number' && !isNaN(rawTotalPrice)) ? rawTotalPrice : 0;

                        // Determine request type
                        const isEmptyLeg = item.type === 'empty_legs' || item.type === 'emptyleg';
                        const isAdventure = item.type === 'adventure' || item.type === 'fixed_offer' || item.type === 'adventures';
                        const isJet = item.type === 'jets' || item.type === 'jet' || item.type === 'helicopter';
                        const isTaxi = item.type === 'taxi_cars' || item.type === 'taxi' || item.type === 'transfer' || item.type === 'ground_transport';
                        const isYacht = item.type === 'yachts' || item.type === 'yacht';
                        const isLuxuryCar = item.type === 'luxury_cars' || item.type === 'luxury_car';

                        const requestType = isEmptyLeg ? 'empty_leg' :
                                           isAdventure ? 'fixed_offer' :
                                           isTaxi ? 'ground_transport' :
                                           isJet ? 'private_jet_charter' :
                                           isYacht ? 'yacht_charter' :
                                           isLuxuryCar ? 'luxury_car' : 'booking';

                        const { data, error } = await supabase
                          .from('user_requests')
                          .insert([{
                            user_id: user.id,
                            type: requestType,
                            status: 'pending',
                            client_email: user.email,
                            data: {
                              source: 'ai_chat_checkout',
                              item_type: item.type,

                              // Service details
                              name: item.name || item.title || item.aircraft_type || item.model,
                              title: item.title || item.name || item.aircraft_type,

                              // Route info - COMPREHENSIVE
                              from: item.from || item.from_city || item.origin || item.pickup_location,
                              to: item.to || item.to_city || item.destination || item.dropoff_location,
                              from_city: item.from_city || item.from || item.origin,
                              to_city: item.to_city || item.to || item.destination,
                              from_iata: item.from_iata || item.originIata,
                              to_iata: item.to_iata || item.destinationIata,
                              route: `${item.from_city || item.from || item.origin || ''} → ${item.to_city || item.to || item.destination || ''}`,
                              flight_route: `${item.from_iata || item.from_city || ''} → ${item.to_iata || item.to_city || ''}`,

                              // Date/Time - ALL RELEVANT FIELDS
                              departure_date: item.departure_date || item.date || item.selectedDate,
                              departure_time: item.departure_time || item.time || item.selectedTime,
                              date: item.date || item.departure_date,
                              time: item.time || item.departure_time,
                              return_date: item.return_date || item.returnDate,
                              pickupDate: item.pickupDate || item.date,
                              pickupTime: item.pickupTime || item.time,

                              // Aircraft info
                              aircraft: item.aircraft || item.aircraft_type || item.aircraft_model,
                              aircraft_type: item.aircraft_type || item.model,
                              aircraft_model: item.aircraft_model || item.model,
                              category: item.category,
                              capacity: item.capacity || item.max_passengers || item.pax || item.available_seats,
                              available_seats: item.available_seats || item.capacity,
                              range_km: item.range_km,
                              speed_kts: item.speed_kts,
                              hourly_rate_eur: item.hourly_rate_eur,
                              estimated_flight_time: item.estimated_flight_time || item.flightTime,
                              distance_km: item.distance_km || item.distanceKm,

                              // Booking details
                              passengers: item.passengers || item.pax,
                              pax: item.pax || item.passengers,
                              luggage: item.luggage,
                              has_pet: item.hasPet || item.has_pet,

                              // For luxury cars
                              brand: item.brand,
                              model: item.model,
                              year: item.year,
                              location: item.location,
                              rental_days: item.rentalDays || item.rental_days,
                              transmission: item.transmission,
                              seats: item.seats,
                              horsepower: item.horsepower,
                              price_per_day: item.price_per_day || item.pricePerDay,

                              // For yachts
                              length_m: item.length_m,
                              cabins: item.cabins,
                              crew: item.crew,
                              price_per_week: item.price_per_week,

                              // For taxi/transfers
                              carName: item.carName || item.name,
                              carSeats: item.carSeats || item.seats,
                              carImage: item.carImage || item.image_url,
                              distance: item.distance || item.distanceKm,
                              eta: item.eta || item.duration,
                              duration: item.duration || item.eta,
                              vehicles_needed: item.vehiclesNeeded || item.vehicles_needed,
                              pickup_location: item.pickup_location || item.from,
                              dropoff_location: item.dropoff_location || item.to,
                              service_type: item.service_type || item.category,
                              extraNotes: item.extraNotes || item.notes,
                              isSwissBooking: item.isSwissBooking,
                              detectedCountry: item.detectedCountry,

                              // For adventures/fixed offers
                              destination: item.destination || item.to_city,
                              adventure_title: item.adventure_title || item.title,
                              offer_title: item.offer_title || item.title,
                              description: item.description,
                              duration_days: item.duration_days || item.duration,

                              // Full price breakdown - ALL IN USD (Base + VAT only)
                              // Only include price fields if valid (non-zero, non-NaN)
                              base_price: basePrice > 0 ? basePrice : null,
                              price: basePrice > 0 ? basePrice : null,
                              price_usd: basePrice > 0 ? basePrice : null,
                              vat_amount: vatAmount > 0 ? vatAmount : null,
                              vat_percent: 8.1,
                              total_price: totalPrice > 0 ? totalPrice : null,
                              total: totalPrice > 0 ? totalPrice : null,
                              currency: 'USD',
                              priceRange: totalPrice > 0 ? `$${totalPrice.toLocaleString()}` : null,

                              // Original price reference (for GBP empty legs converted to USD)
                              original_price: item.original_price || basePrice,
                              original_currency: item.original_currency || 'USD',
                              original_price_gbp: item.original_price_gbp,

                              // Catering and extras
                              cateringOption: item.catering || item.cateringOption || 'standard',
                              cateringPrice: item.cateringPrice || 0,
                              airportPickupFee: item.airportPickupFee || 0,

                              // Images - ALL POSSIBLE FIELDS
                              image_url: item.image_url || item.imageUrl || item.image || item.primaryImage || item.aircraft_image,
                              primaryImage: item.primaryImage || item.image_url || item.image,

                              // IDs for tracking
                              empty_leg_id: item.id || item.empty_leg_id,
                              item_id: item.id || item.cartId,

                              // Wallet info
                              wallet_address: item.wallet_address || item.walletAddress,

                              // Metadata
                              conversation_id: activeChat,
                              awaiting_payment: true,
                              isEstimate: item.isEstimate,
                              requiresConfirmation: item.requiresConfirmation,
                              notes: item.notes || item.extraNotes
                            }
                          }])
                          .select()
                          .single();

                        if (error) throw error;
                        return data;
                      } catch (err) {
                        console.error('Error saving to AI requests:', err);
                        return null;
                      }
                    };

                    // If all items are already paid
                    if (onlyPaidItems) {
                      return (
                        <div className="bg-green-50/80 rounded-xl p-4 border border-green-200/50" style={{ backdropFilter: 'blur(8px)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-semibold text-green-800">All Payments Initiated</span>
                          </div>
                          <p className="text-[11px] text-green-700 mb-3">
                            Your payment{paidItems.length > 1 ? 's are' : ' is'} being processed via CoinGate.
                          </p>
                          <button
                            onClick={() => setShowCartSidebar(false)}
                            className="w-full px-3 py-2 bg-white/60 hover:bg-white/80 text-green-800 text-xs font-medium rounded-lg transition-all border border-green-200/50"
                            style={{ backdropFilter: 'blur(4px)' }}
                          >
                            Continue Browsing
                          </button>
                        </div>
                      );
                    }

                    // DIRECT CHECKOUT: If cart contains ONLY payable items (empty legs, wines, delicacies)
                    if (canDoDirectCheckout) {
                      return (
                        <div className="space-y-2">
                          {/* Two equal buttons: Send Request OR Pay with Crypto */}
                          <div className="flex gap-2">
                            {/* Send Request */}
                            <button
                              onClick={() => {
                                setShowCartSidebar(false);
                                setShowRequestForm(true);
                              }}
                              className="flex-1 px-3 py-2.5 bg-white/50 hover:bg-white/70 text-gray-800 text-xs font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 border border-gray-200/50 hover:border-gray-300/50"
                              style={{ backdropFilter: 'blur(8px)' }}
                            >
                              <Send size={14} />
                              Send Request
                            </button>

                            {/* Pay with Crypto - Monochromatic */}
                            <button
                              onClick={async () => {
                                if (!user?.id) {
                                  setToast({ message: 'Please log in to checkout', type: 'warning' });
                                  return;
                                }

                                setIsProcessingPayment(true);
                                try {
                                  // Calculate cart total with VAT
                                  const cartTotal = payableItems.reduce((sum, item) => {
                                    const basePrice = item.price_usd || item.price || item.basePrice || 0;
                                    const withVAT = item.totalWithFee || (basePrice * 1.081);
                                    return sum + withVAT;
                                  }, 0);

                                  // Create combined order description
                                  const itemDescriptions = payableItems.map(item =>
                                    item.name || item.title || `${item.from || item.origin || ''} → ${item.to || item.destination || ''}`.trim() || 'Item'
                                  ).join(', ');

                                  // SAVE ALL CART ITEMS TO USER_BOOKINGS
                                  // This creates a single booking with all items listed
                                  const bookingData = {
                                    user_id: user.id,
                                    service_type: 'cart_checkout',
                                    booking_type: 'cart_checkout',
                                    service_title: `Cart Order: ${payableItems.length} item${payableItems.length > 1 ? 's' : ''}`,
                                    // Route info from first empty leg if any
                                    origin: payableItems.find(i => i.type === 'empty_legs' || i.type === 'emptyleg')?.from_city ||
                                            payableItems.find(i => i.type === 'empty_legs' || i.type === 'emptyleg')?.from || null,
                                    destination: payableItems.find(i => i.type === 'empty_legs' || i.type === 'emptyleg')?.to_city ||
                                                 payableItems.find(i => i.type === 'empty_legs' || i.type === 'emptyleg')?.to || null,
                                    departure_date: payableItems.find(i => i.departure_date)?.departure_date || null,
                                    // Total price with VAT
                                    base_amount: payableItems.reduce((sum, i) => sum + (i.price_usd || i.price || i.basePrice || 0), 0),
                                    vat_amount: Math.round(payableItems.reduce((sum, i) => sum + (i.price_usd || i.price || i.basePrice || 0), 0) * 0.081),
                                    total_amount: cartTotal,
                                    currency: 'USD',
                                    payment_status: 'pending',
                                    // ALL CART ITEMS stored in service_details
                                    service_details: {
                                      cart_items: payableItems.map(item => ({
                                        id: item.id,
                                        cartId: item.cartId,
                                        type: item.type,
                                        name: item.name || item.title,
                                        category: item.category,
                                        // Route for empty legs
                                        from: item.from || item.from_city || item.origin,
                                        to: item.to || item.to_city || item.destination,
                                        from_iata: item.from_iata,
                                        to_iata: item.to_iata,
                                        // Price
                                        price: item.price_usd || item.price || item.basePrice,
                                        quantity: item.quantity || 1,
                                        // Images
                                        image_url: item.image_url || item.image,
                                        // Extra details
                                        departure_date: item.departure_date,
                                        aircraft: item.aircraft || item.aircraft_type,
                                        description: item.description,
                                        unit: item.unit,
                                        isCleaningFee: item.isCleaningFee
                                      })),
                                      item_count: payableItems.length,
                                      order_description: itemDescriptions,
                                      checkout_type: 'direct_crypto'
                                    },
                                    conversation_id: activeChat
                                  };

                                  const { data: savedBooking, error: bookingError } = await supabase
                                    .from('user_bookings')
                                    .insert([bookingData])
                                    .select()
                                    .single();

                                  if (bookingError) {
                                    console.error('Error saving booking:', bookingError);
                                  }

                                  // Also save to user_requests for AI Requests tracking
                                  for (const item of payableItems) {
                                    await saveToAIRequests(item);
                                  }

                                  // Determine primary service type for CoinGate based on actual item types
                                  const primaryItem = payableItems[0];
                                  const getServiceType = (item) => {
                                    const itemType = item.type?.toLowerCase() || '';
                                    if (itemType === 'empty_legs' || itemType === 'emptyleg') return 'empty_leg';
                                    if (itemType === 'wine' || itemType === 'wines') return 'wine';
                                    if (itemType === 'delicatesse' || itemType === 'delicacies') return 'delicatesse';
                                    if (itemType === 'cigars' || item.category === 'cigars') return 'cigars';
                                    if (itemType === 'custom_extra') return 'custom_extra';
                                    if (itemType === 'service_fee') return 'service_fee';
                                    if (itemType === 'adventure' || itemType === 'fixed_offer') return 'adventure_package';
                                    return 'custom_extra'; // Default for unknown types
                                  };
                                  const serviceType = getServiceType(primaryItem);

                                  // Use proper ID based on item type - database IDs for known items, generated for custom
                                  const serviceId = primaryItem.original_id || primaryItem.db_id || primaryItem.id || `custom-${Date.now()}`;

                                  // Call CoinGate edge function with total cart amount
                                  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-coingate-payment`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                                    },
                                    body: JSON.stringify({
                                      userId: user.id,
                                      serviceType: serviceType,
                                      serviceId: serviceId,
                                      priceUSD: Math.round(cartTotal * 100) / 100,
                                      email: user.email,
                                      contactName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
                                      // Include service details for custom extras
                                      serviceTitle: primaryItem.name || primaryItem.title || itemDescriptions,
                                      serviceDescription: primaryItem.description || primaryItem.notes || `${primaryItem.category || primaryItem.type || 'Service'}`,
                                      serviceImageUrl: primaryItem.image_url || primaryItem.image,
                                      orderDescription: `PrivateCharterX Cart: ${itemDescriptions}`,
                                      cartItems: payableItems.map(item => ({
                                        id: item.id,
                                        name: item.name || item.title,
                                        type: item.type,
                                        price: item.price_usd || item.price || item.basePrice,
                                        quantity: item.quantity || 1
                                      })),
                                      // Link to our saved booking
                                      bookingReference: savedBooking?.id
                                    })
                                  });

                                  const result = await response.json();

                                  if (result.success && result.paymentUrl) {
                                    // Update saved booking with CoinGate order ID
                                    if (savedBooking?.id) {
                                      await supabase
                                        .from('user_bookings')
                                        .update({
                                          payment_reference: result.coingateOrderId,
                                          payment_status: 'pending'
                                        })
                                        .eq('id', savedBooking.id);
                                    }

                                    // Mark items as pending payment
                                    setCartItems(prev => prev.map(item => {
                                      const isPaying = payableItems.some(p => p.cartId === item.cartId);
                                      if (isPaying) {
                                        return {
                                          ...item,
                                          paymentStatus: 'pending_confirmation',
                                          coingateOrderId: result.coingateOrderId,
                                          bookingId: savedBooking?.id || result.bookingId
                                        };
                                      }
                                      return item;
                                    }));

                                    // Open CoinGate payment page
                                    window.open(result.paymentUrl, '_blank');

                                    setToast({
                                      message: 'Payment page opened. Complete your crypto payment.',
                                      type: 'success'
                                    });
                                  } else {
                                    throw new Error(result.error || 'Failed to create payment');
                                  }
                                } catch (error) {
                                  console.error('Checkout error:', error);
                                  setToast({
                                    message: error.message || 'Failed to process checkout',
                                    type: 'error'
                                  });
                                } finally {
                                  setIsProcessingPayment(false);
                                }
                              }}
                              disabled={isProcessingPayment}
                              className="flex-1 px-3 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {isProcessingPayment ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Coins size={14} />
                                  Pay with Crypto
                                </>
                              )}
                            </button>
                          </div>

                          <p className="text-[10px] text-gray-500 text-center">
                            Total: ${payableTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (incl. VAT)
                          </p>
                        </div>
                      );
                    }

                    // REQUEST-ONLY: Cart contains jets/helis/yachts/transfers - need coordinator quote
                    return (
                      <div className="flex gap-2">
                        {/* Send Request button */}
                        <button
                          onClick={() => {
                            setShowCartSidebar(false);
                            setShowRequestForm(true);
                          }}
                          className="w-full px-3 py-2.5 bg-white/50 hover:bg-white/70 text-gray-800 text-xs font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 border border-gray-200/50 hover:border-gray-300/50"
                          style={{ backdropFilter: 'blur(8px)' }}
                        >
                          <Send size={14} />
                          Send Request
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (() => {
        const hasEmptyLeg = cartItems.some(item => item.type === 'empty_legs' || item.type === 'emptyleg');
        const emptyLegItems = cartItems.filter(item => item.type === 'empty_legs' || item.type === 'emptyleg');
        const otherItems = cartItems.filter(item => item.type !== 'empty_legs' && item.type !== 'emptyleg');
        // NaN protection for grand total
        const safeNum = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;
        const grandTotal = cartItems.reduce((sum, item) => sum + safeNum(item.totalWithFee || item.price_usd || item.price || 0) + safeNum(item.cateringPrice || 0), 0);

        return (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={() => setShowRequestForm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-scale-in flex flex-col">
              <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Your Request</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{cartItems.length} service{cartItems.length > 1 ? 's' : ''} in your cart</p>
                </div>
                <button onClick={() => setShowRequestForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Services List */}
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Services</p>
                  {cartItems.map((item, idx) => {
                    const isEmptyLeg = item.type === 'empty_legs' || item.type === 'emptyleg';
                    const isJet = item.type === 'jets' || item.type === 'jet';
                    const isTransfer = item.type === 'taxi' || item.type === 'transfer' || item.type === 'ground_transport';
                    const isYacht = item.type === 'yachts' || item.type === 'yacht';
                    const isAdventure = item.type === 'adventure' || item.type === 'fixed_offer';
                    const isExtra = item.type === 'custom_extra';

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
                                isAdventure ? 'bg-purple-100 text-purple-700' :
                                isExtra ? 'bg-gray-200 text-gray-700' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {isEmptyLeg ? 'EMPTY LEG' : isJet ? 'CHARTER' : isTransfer ? 'TRANSFER' : isYacht ? 'YACHT' : isAdventure ? 'EXPERIENCE' : isExtra ? 'EXTRA' : 'SERVICE'}
                              </span>
                              {item.isMultiStop && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700">MULTI-STOP</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name || item.title || item.aircraft_type || item.model}
                            </p>
                            {(item.route || item.from) && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.route || `${item.from_iata || item.from || ''} → ${item.to_iata || item.to || ''}`}
                              </p>
                            )}
                            {item.departure_date && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.departure_date} {item.departure_time && `at ${item.departure_time}`}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900">
                              ${(item.totalWithFee || item.price || item.basePrice || 0).toLocaleString()}
                            </p>
                            {item.isEstimate && (
                              <p className="text-[9px] text-gray-400">estimate</p>
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
                  <span className="text-lg font-bold text-gray-900">${grandTotal.toLocaleString()}</span>
                </div>

                {/* Empty Leg Crypto Notice */}
                {hasEmptyLeg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Wallet size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800">Pay Empty Legs by Crypto</p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          You can pay {emptyLegItems.length > 1 ? 'your empty legs' : 'the empty leg'} directly from <strong>"My Requests"</strong> and secure your booking within 2 minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info notice */}
                <p className="text-xs text-gray-500 text-center">
                  Our team will contact you within 2-4 hours to confirm availability and details.
                </p>
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50 space-y-3">
                {/* Terms & Policy Agreement */}
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  By submitting this request you agree to our{' '}
                  <a href="/terms" target="_blank" className="text-gray-600 underline hover:text-gray-800">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="text-gray-600 underline hover:text-gray-800">Privacy Policy</a>
                </p>
                <button
                  onClick={async () => {
                    try {
                      setIsProcessing(true);

                      // Calculate totals
                      const mainServices = cartItems.filter(item => item.type !== 'custom_extra');
                      const customExtras = cartItems.filter(item => item.type === 'custom_extra');
                      // NaN protection helper
                      const safeN = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;
                      const servicesSubtotal = mainServices.reduce((sum, item) => sum + safeN(item.basePrice || item.price_usd || item.price || 0), 0);
                      const extrasSubtotal = customExtras.reduce((sum, item) => sum + safeN(item.basePrice || item.price || 0), 0);
                      const cateringTotal = cartItems.reduce((sum, item) => sum + safeN(item.cateringPrice || 0), 0);
                      const airportFees = cartItems.reduce((sum, item) => sum + safeN(item.airportPickupFee || 0), 0);
                      const vatAmount = cartItems.reduce((sum, item) => sum + safeN(item.vat || 0), 0);
                      const grandTotal = cartItems.reduce((sum, item) => sum + safeN(item.totalWithFee || item.price_usd || item.price || 0) + safeN(item.cateringPrice || 0), 0);

                      // Create ONE bulk request with all cart items
                      const bulkRequestData = {
                        source: 'ai_chat',  // Mark as AI-generated
                        request_id: `AI-${Date.now()}`,
                        items: cartItems.map(item => ({
                          ...item,
                          // Ensure all relevant fields are included
                          type: item.type,
                          name: item.name || item.title || item.aircraft_type || item.model,
                          title: item.title || item.name || item.aircraft_type,
                          price: item.price || item.basePrice || item.price_usd,
                          estimated_price: item.totalWithFee || item.price || item.basePrice,
                          // Route info
                          from: item.from || item.from_city || item.origin,
                          to: item.to || item.to_city || item.destination,
                          origin: item.origin || item.from || item.from_city,
                          destination: item.destination || item.to || item.to_city,
                          from_iata: item.from_iata || item.originIata,
                          to_iata: item.to_iata || item.destinationIata,
                          // Date/time - CRITICAL for booking
                          date: item.date || item.departure_date || item.selectedDate,
                          time: item.time || item.departure_time || item.selectedTime,
                          departure_date: item.departure_date || item.date,
                          departure_time: item.departure_time || item.time,
                          return_date: item.return_date || item.returnDate,
                          // Passengers
                          passengers: item.passengers || item.pax || item.max_passengers,
                          pax: item.pax || item.passengers,
                          // Aircraft/vehicle details
                          aircraft_model: item.aircraft_model || item.model,
                          aircraft_type: item.aircraft_type || item.type,
                          category: item.category,
                          // For jets/helicopters
                          range_km: item.range_km,
                          speed_kts: item.speed_kts,
                          hourly_rate_eur: item.hourly_rate_eur,
                          estimated_flight_time: item.estimated_flight_time || item.flightTime,
                          distance_km: item.distance_km || item.distanceKm,
                          // For luxury cars
                          brand: item.brand,
                          model: item.model,
                          year: item.year,
                          location: item.location,
                          rental_days: item.rentalDays || item.rental_days,
                          transmission: item.transmission,
                          seats: item.seats,
                          horsepower: item.horsepower,
                          price_per_day: item.price_per_day || item.pricePerDay,
                          // For yachts
                          length_m: item.length_m,
                          cabins: item.cabins,
                          crew: item.crew,
                          price_per_week: item.price_per_week,
                          // For transfers
                          distanceKm: item.distanceKm || item.distance_km,
                          duration: item.duration,
                          vehicles_needed: item.vehiclesNeeded || item.vehicles_needed,
                          pickup_location: item.pickup_location || item.from,
                          dropoff_location: item.dropoff_location || item.to,
                          service_type: item.service_type || item.category,
                          // For extras
                          quantity: item.quantity || 1,
                          isCustomRequest: item.isCustomRequest,
                          requiresConfirmation: item.requiresConfirmation,
                          notes: item.notes,
                          // Pricing
                          cateringOption: item.catering || 'standard',
                          cateringPrice: item.cateringPrice || 0,
                          airportPickupFee: item.airportPickupFee || 0,
                          vat: item.vat || 0,
                          isEstimate: item.isEstimate,
                          // Images
                          image: item.image || item.image_url,
                          // ID for tracking
                          itemId: item.id || item.cartId
                        })),
                        summary: {
                          total_items: cartItems.length,
                          services_count: mainServices.length,
                          extras_count: customExtras.length,
                          services_subtotal: servicesSubtotal,
                          extras_subtotal: extrasSubtotal,
                          catering_total: cateringTotal,
                          airport_fees: airportFees,
                          vat_amount: vatAmount,
                          grand_total: grandTotal,
                          has_estimates: cartItems.some(item => item.isEstimate),
                          has_custom_requests: customExtras.length > 0
                        },
                        payment_method: selectedPaymentMethod || 'bank_transfer',
                        created_via: 'sphera_ai_assistant',
                        conversation_id: activeChat
                      };

                      // Create single bulk request - using correct API parameters
                      const { request, error: requestError } = await createRequest({
                        userId: user.id,
                        type: 'ai_chat_bulk',
                        data: bulkRequestData  // Pass object directly, not JSON.stringify
                      });

                      if (requestError) {
                        throw new Error(requestError);
                      }

                      // Generate PDF and send email with attachment
                      if (request?.id) {
                        // Generate PDF confirmation first
                        let pdfBase64 = null;
                        let pdfFilename = null;
                        try {
                          const pdfRequest = {
                            id: request.id,
                            type: 'ai_chat_bulk',
                            service_type: 'ai_chat_bulk',
                            created_at: new Date().toISOString(),
                            client_email: user?.email,
                            data: {
                              ...bulkRequestData,
                              cart_items: cartItems.map(item => ({
                                name: item.name || item.title,
                                type: item.type,
                                price: item.price_usd || item.price || item.basePrice || 0,
                                quantity: item.quantity || 1
                              })),
                              estimated_total: grandTotal
                            }
                          };

                          const { blob, filename, base64 } = await generateRequestConfirmationPDF(pdfRequest);
                          pdfFilename = filename;
                          pdfBase64 = base64;

                          // Save PDF to storage
                          try {
                            await savePDFToStorage(blob, filename, 'request', request.id);
                            console.log('Bulk request PDF saved to storage');
                          } catch (storageErr) {
                            console.warn('Could not save bulk request PDF:', storageErr);
                          }

                          // Auto-download PDF for user
                          downloadPDF(blob, filename);
                          console.log('Bulk request PDF generated and downloaded');
                        } catch (pdfErr) {
                          console.error('Failed to generate bulk request PDF:', pdfErr);
                        }

                        // Send email with PDF attachment
                        try {
                          await supabase.functions.invoke('send-request-email', {
                            body: {
                              to: user?.email,
                              requestData: {
                                id: request.id,
                                type: 'ai_chat_bulk',
                                created_at: new Date().toISOString(),
                                status: 'pending',
                                user: {
                                  name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Valued Client',
                                  email: user?.email
                                },
                                details: {
                                  service_type: 'AI Concierge Request',
                                  price: grandTotal,
                                  currency: 'USD',
                                  notes: `${mainServices.length} service(s)${customExtras.length > 0 ? `, ${customExtras.length} custom extra(s)` : ''}`
                                },
                                // Include full cart items for detailed email listing
                                data: {
                                  items: cartItems.map(item => ({
                                    name: item.name || item.title || item.aircraft_type || item.model,
                                    type: item.type,
                                    price: item.totalWithFee || item.price_usd || item.price || item.basePrice || 0,
                                    from: item.from || item.from_city || item.origin || item.pickup_location,
                                    to: item.to || item.to_city || item.destination || item.dropoff_location,
                                    date: item.date || item.departure_date || item.selectedDate,
                                    quantity: item.quantity || 1
                                  })),
                                  summary: {
                                    services_count: mainServices.length,
                                    extras_count: customExtras.length,
                                    grand_total: grandTotal
                                  }
                                }
                              },
                              pdfBase64: pdfBase64,
                              pdfFilename: pdfFilename
                            }
                          });
                          console.log('Email with PDF sent for request:', request.id);
                        } catch (emailErr) {
                          console.error('Failed to send email with PDF:', emailErr);
                          // Fallback to basic notification
                          try {
                            await supabase.functions.invoke('user-request-notifications', {
                              body: { record: { id: request.id } }
                            });
                            console.log('Fallback email notification sent for request:', request.id);
                          } catch (fallbackErr) {
                            console.error('Fallback email also failed:', fallbackErr);
                          }
                        }
                      }

                      const confirmMsg = {
                        role: 'assistant',
                        content: `✅ **Booking Request Sent!**\n\nWe've received your request containing:\n• ${mainServices.length} service(s)${customExtras.length > 0 ? `\n• ${customExtras.length} custom extra(s) (availability TBC)` : ''}\n\n**Estimated Total:** ~$${grandTotal.toLocaleString()}\n\nOur team will review and contact you within 2-4 hours to confirm details and availability.\n\n📧 A confirmation email with PDF has been sent to ${user?.email}\n📄 PDF also downloaded to your device`
                      };

                      setChatHistory(prev => prev.map(c =>
                        c.id === activeChat
                          ? { ...c, messages: [...c.messages, confirmMsg] }
                          : c
                      ));

                      setCartItems([]);
                      setShowRequestForm(false);
                      setToast({ message: 'Booking request sent!', type: 'info' });
                    } catch (error) {
                      console.error('Booking error:', error);
                      setToast({ message: 'Failed to send request', type: 'error' });
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                  className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50"
                >
                  {isProcessing ? 'Sending...' : 'Confirm & Send Request'}
                </button>
              </div>
            </div>
          </div>
        </>
        );
      })()}

      {showCalendarModal && selectedItemForCalendar && (
        <CreateEventModal
          onClose={() => {
            setShowCalendarModal(false);
            setSelectedItemForCalendar(null);
          }}
          onEventCreated={() => {
            setShowCalendarModal(false);
            setChatHistory(prev => prev.map(c => 
              c.id === activeChat ? { ...c, messages: [...c.messages, { role: 'assistant', content: 'Added to calendar' }] } : c
            ));
          }}
          user={user}
          linkedBooking={selectedItemForCalendar}
        />
      )}

      {showAdjustModal && itemToAdjust && (
        <RequestAdjustmentModal
          show={showAdjustModal}
          onClose={() => {
            setShowAdjustModal(false);
            setItemToAdjust(null);
          }}
          item={itemToAdjust}
          onSave={handleSaveAdjustment}
          onSendRequest={(item) => {
            addToCart(item);
            setShowAdjustModal(false);
            setTimeout(() => sendRequest(), 500);
          }}
        />
      )}

      {showWalletConnect && (
        <WalletConnect
          show={showWalletConnect}
          onClose={() => setShowWalletConnect(false)}
          onConnect={handleWalletConnect}
          onError={(error) => {
            setChatHistory(prev => prev.map(c => 
              c.id === activeChat ? { ...c, messages: [...c.messages, { role: 'assistant', content: `Wallet error: ${error}` }] } : c
            ));
          }}
        />
      )}

      {/* Consultation Booking Modal */}
      <ConsultationBookingModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        topic={consultationTopic}
      />

      {/* Bulk Order Interface - Modern Perplexity-style */}
      {showBulkOrderInterface && cartItems.length > 0 && (
        <BulkOrderInterface
          cartItems={cartItems}
          onUpdateItem={(itemId, updates) => {
            setCartItems(prev => prev.map(item =>
              item.cartId === itemId ? { ...item, ...updates } : item
            ));
          }}
          onRemoveItem={(itemId) => {
            setCartItems(prev => prev.filter(item => item.cartId !== itemId));
          }}
          onSubmit={(sendImmediately) => {
            setShowBulkOrderInterface(false);
            if (sendImmediately) {
              sendRequest();
            } else {
              saveRequestToPDF();
            }
          }}
          onChatAdjust={(message) => {
            // Process chat message to adjust items
            handleSendMessage(message);
          }}
        />
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentTier={userProfile?.subscription_tier || 'explorer'}
      />

      {/* Break the Price Modal - HIDDEN (feature disabled) */}
      {/* {showBreakThePrice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          ...modal content hidden...
        </div>
      )} */}

      {/* Report Issue Modal */}
      {showReportIssueModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Report an Issue</h2>
                  <p className="text-sm text-gray-500 mt-1">Help us improve your experience</p>
                </div>
                <button
                  onClick={() => {
                    setShowReportIssueModal(false);
                    setReportIssueForm({ message: '', rating: 0 });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-2">Reporting as:</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {(user?.email || user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                  </div>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Rate your experience</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReportIssueForm(prev => ({ ...prev, rating: star }))}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <svg
                        className={`w-8 h-8 ${reportIssueForm.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    {reportIssueForm.rating > 0 ? `${reportIssueForm.rating}/5` : 'Select rating'}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Describe the issue</label>
                <textarea
                  value={reportIssueForm.message}
                  onChange={(e) => setReportIssueForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Please describe what went wrong or how we can improve..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReportIssueModal(false);
                    setReportIssueForm({ message: '', rating: 0 });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!reportIssueForm.message.trim()) {
                      setToast({ message: 'Please describe the issue', type: 'warning' });
                      return;
                    }
                    setIsSubmittingReport(true);
                    try {
                      // Save report to database
                      const { error } = await supabase
                        .from('ai_chat_reports')
                        .insert({
                          user_id: user?.id,
                          user_email: user?.email,
                          user_name: user?.name,
                          chat_id: currentChat?.id,
                          rating: reportIssueForm.rating,
                          message: reportIssueForm.message,
                          chat_context: JSON.stringify(currentChat?.messages?.slice(-5) || [])
                        });

                      if (error) throw error;

                      setToast({ message: 'Report submitted successfully. Thank you for your feedback!', type: 'success' });
                      setShowReportIssueModal(false);
                      setReportIssueForm({ message: '', rating: 0 });
                    } catch (err) {
                      console.error('Error submitting report:', err);
                      setToast({ message: 'Failed to submit report. Please try again.', type: 'error' });
                    } finally {
                      setIsSubmittingReport(false);
                    }
                  }}
                  disabled={isSubmittingReport}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:bg-gray-400"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crypto Payment Modal - for Empty Legs and Adventures */}
      {showCryptoPayment && selectedPaymentItem && (
        <CryptoPaymentModal
          isOpen={showCryptoPayment}
          onClose={() => {
            setShowCryptoPayment(false);
            setSelectedPaymentItem(null);
          }}
          service={{
            ...selectedPaymentItem,
            // Ensure price fields are set correctly - use totalWithFee for final price
            price: selectedPaymentItem.price_usd || selectedPaymentItem.price || selectedPaymentItem.discounted_price || 0,
            price_usd: selectedPaymentItem.price_usd || selectedPaymentItem.price || 0,
            totalWithFee: selectedPaymentItem.totalWithFee || selectedPaymentItem.price_with_vat || Math.round((selectedPaymentItem.price_usd || selectedPaymentItem.price || 0) * 1.106),
            currency: 'USD', // CoinGate payments are always in USD
            // Use original EmptyLegs_ id if available
            id: selectedPaymentItem.original_id || selectedPaymentItem.id
          }}
          serviceType={
            selectedPaymentItem.type === 'empty_legs' || selectedPaymentItem.type === 'emptyleg'
              ? 'empty_leg'
              : selectedPaymentItem.type === 'adventure'
                ? 'adventure'
                : 'charter'
          }
          onSuccess={(paymentData) => {
            console.log('✅ Crypto payment initiated:', paymentData);
            setShowCryptoPayment(false);
            setSelectedPaymentItem(null);

            // Mark the paid item as paid (grayed out) instead of removing it
            // This allows user to continue with other cart items
            setCartItems(prev => prev.map(item =>
              item.cartId === selectedPaymentItem.cartId
                ? { ...item, isPaid: true, paymentStatus: 'pending_confirmation', coingateOrderId: paymentData?.order_id }
                : item
            ));

            setToast({ message: 'Payment initiated! Complete the payment on CoinGate.', type: 'success' });

            // Check if there are other unpaid items in cart
            const otherUnpaidItems = cartItems.filter(item => item.cartId !== selectedPaymentItem.cartId && !item.isPaid);

            // Add confirmation message to chat
            const confirmMsg = {
              role: 'assistant',
              content: `🎉 Payment initiated for ${selectedPaymentItem.name || selectedPaymentItem.title || 'your booking'}!\n\nPlease complete the payment on CoinGate. Once confirmed:\n• You'll receive a confirmation email\n• Your booking will appear in "My Bookings"\n• You'll earn 1.5% PVCX rewards${otherUnpaidItems.length > 0 ? `\n\n📦 You still have ${otherUnpaidItems.length} other item${otherUnpaidItems.length > 1 ? 's' : ''} in your cart. Feel free to continue browsing or send a request for those!` : ''}\n\nThank you for choosing Sphera World!`
            };
            setChatHistory(prev => prev.map(c =>
              c.id === activeChat
                ? { ...c, messages: [...c.messages, confirmMsg] }
                : c
            ));
          }}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* WALLET CONNECT MODAL */}
      <WalletConnect
        show={showWalletConnect}
        onClose={() => setShowWalletConnect(false)}
        onConnect={(address) => {
          console.log('✅ Wallet connected:', address);
          setShowWalletConnect(false);
        }}
        onError={(error) => {
          console.error('❌ Wallet connection error:', error);
          setToast({ message: `Wallet connection failed: ${error}`, type: 'error' });
        }}
      />
      </div>

      {/* CART WIDGET - Right Side (hidden on mobile, use cart sidebar instead) */}
      {showCartWidget && cartItems.length > 0 && (
        <div className="hidden md:flex w-80 lg:w-96 bg-white border-l border-gray-200 flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-black">Cart</h3>
              <button
                onClick={() => setShowCartWidget(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600">{cartItems.length} service{cartItems.length !== 1 ? 's' : ''} selected</p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-black text-sm">{item.name || item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{item.type}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCartItems(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X size={14} className="text-gray-600" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-black">
                    ${item.price?.toLocaleString() || item.basePrice?.toLocaleString() || item.price_usd?.toLocaleString() || 'TBD'}
                  </span>
                </div>

                {/* Add to Calendar Button */}
                <button
                  onClick={() => {
                    setSelectedItemForCalendar(item);
                    setShowCalendarModal(true);
                  }}
                  className="mt-2 w-full px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Calendar size={12} />
                  <span>Add to Calendar</span>
                </button>
              </div>
            ))}
          </div>

          {/* Cart Footer - Total & Checkout */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-black">Total:</span>
              <span className="text-xl font-bold text-black">
                ${cartTotal.toLocaleString()}
              </span>
            </div>

            <button
              onClick={sendRequest}
              className="w-full py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} />
              <span>Submit Request</span>
            </button>

            <button
              onClick={() => setCartItems([])}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}

      {/* Add Extras Modal */}
      {showExtrasModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[60] animate-fade-in"
            onClick={() => {
              setShowExtrasModal(false);
              setSelectedExtraCategory(null);
              setCustomExtraForm({ name: '', category: '', quantity: 1, notes: '' });
            }}
          />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-fade-in">
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedExtraCategory ? `Add ${selectedExtraCategory.charAt(0).toUpperCase() + selectedExtraCategory.slice(1)}` : 'Add Extra Service'}
                </h3>
                <button
                  onClick={() => {
                    setShowExtrasModal(false);
                    setSelectedExtraCategory(null);
                    setCustomExtraForm({ name: '', category: '', quantity: 1, notes: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Category Selection */}
              {!selectedExtraCategory ? (
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-gray-500 mb-3">Select a category to add extras to your booking</p>

                  {/* Category Grid - Wine hidden (available via AI Sommelier) */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      // Wine & Winery hidden - available via AI Sommelier chat
                      { id: 'champagne', icon: '🍾', label: 'Champagne', price: '$120+' },
                      { id: 'cigars', icon: '🚬', label: 'Cigars & Smoking', price: '$500+', note: '+$2000 cleaning' },
                      { id: 'caviar', icon: '🥄', label: 'Caviar', price: '$300+' },
                      { id: 'flowers', icon: '💐', label: 'Flowers', price: '$150+' },
                      { id: 'cake', icon: '🎂', label: 'Cakes & Desserts', price: '$200+' },
                      { id: 'decorations', icon: '🎈', label: 'Decorations', price: '$300+' },
                      { id: 'music', icon: '🎵', label: 'Live Music/DJ', price: '$500+' },
                      { id: 'photography', icon: '📸', label: 'Photography', price: '$800+' },
                      { id: 'catering', icon: '🍽️', label: 'Special Catering', price: '$100+' },
                      { id: 'spirits', icon: '🥃', label: 'Spirits & Whisky', price: '$200+' },
                      { id: 'other', icon: '✨', label: 'Other Request', price: 'TBC' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedExtraCategory(cat.id);
                          setCustomExtraForm(prev => ({ ...prev, category: cat.id }));
                        }}
                        className="flex flex-col items-center gap-1 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-center border border-gray-200 hover:border-gray-300"
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-medium text-gray-900">{cat.label}</span>
                        <span className="text-[10px] text-gray-500">{cat.price}</span>
                        {cat.note && <span className="text-[9px] text-amber-600 font-medium">{cat.note}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Extra Details Form */
                <div className="p-4 space-y-4">
                  <button
                    onClick={() => setSelectedExtraCategory(null)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft size={16} />
                    Back to categories
                  </button>

                  {/* Cigars cleaning fee notice */}
                  {selectedExtraCategory === 'cigars' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                      <p className="text-xs font-medium text-amber-800">Aircraft Cleaning Fee</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Smoking on private jets requires a <strong>$2,000 aircraft cleaning fee</strong> (non-smoking to smoking conversion). This will be automatically added to your request.
                      </p>
                    </div>
                  )}

                  {/* Quick Suggestions based on category */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Popular choices</p>
                    <div className="flex flex-wrap gap-1.5">
                      {/* Wine removed - available via AI Sommelier */}
                      {selectedExtraCategory === 'champagne' && ['Moët & Chandon', 'Veuve Clicquot', 'Krug', 'Louis Roederer Cristal', 'Dom Pérignon Rosé'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      {selectedExtraCategory === 'cigars' && ['Cohiba Behike', 'Montecristo No. 2', 'Davidoff', 'Romeo y Julieta', 'Smoking Lounge Access'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      {selectedExtraCategory === 'caviar' && ['Beluga', 'Oscietra', 'Sevruga', 'Kaluga Queen', 'Caviar Tasting Set'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      {selectedExtraCategory === 'flowers' && ['Red Roses Bouquet', 'White Orchids', 'Mixed Seasonal', 'Luxury Arrangement', 'Cabin Decoration'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      {selectedExtraCategory === 'cake' && ['Birthday Cake', 'Wedding Cake', 'Chocolate Cake', 'Custom Design', 'Macaron Tower'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      {selectedExtraCategory === 'decorations' && ['Birthday Setup', 'Anniversary', 'Proposal Setup', 'Corporate Branding', 'Custom Theme'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      {selectedExtraCategory === 'music' && ['Jazz Musician', 'String Quartet', 'DJ Service', 'Pianist', 'Live Band'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      {selectedExtraCategory === 'photography' && ['Event Photographer', 'Videographer', 'Drone Coverage', 'Photo+Video Package', 'Portrait Session'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      {selectedExtraCategory === 'catering' && ['Vegan Menu', 'Halal Menu', 'Kosher Menu', 'Michelin Chef', 'Tasting Menu'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      {selectedExtraCategory === 'spirits' && ['Macallan 25', 'Hennessy XO', 'Rémy Martin Louis XIII', 'Yamazaki 18', 'Custom Selection'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      {selectedExtraCategory === 'other' && ['Pet Transport', 'Security Escort', 'Interpreter', 'Butler Service', 'Custom Request'].map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Name Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customExtraForm.name}
                      onChange={(e) => setCustomExtraForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={`Enter ${selectedExtraCategory} name or details...`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCustomExtraForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-lg font-semibold w-8 text-center">{customExtraForm.quantity}</span>
                      <button
                        onClick={() => setCustomExtraForm(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Special Notes (optional)</label>
                    <textarea
                      value={customExtraForm.notes}
                      onChange={(e) => setCustomExtraForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any special requests, dietary restrictions, timing preferences..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Price Estimate */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estimated Price</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ~${(({
                          wine: 150,
                          champagne: 120,
                          spirits: 200,
                          caviar: 300,
                          cigars: 500,
                          flowers: 150,
                          cake: 200,
                          decorations: 300,
                          music: 500,
                          photography: 800,
                          catering: 100,
                          other: 100
                        }[selectedExtraCategory] || 100) * customExtraForm.quantity).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Final price confirmed by our team</p>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => {
                      if (!customExtraForm.name.trim()) {
                        setToast({ message: 'Please enter item name', type: 'error' });
                        return;
                      }

                      const defaultPrices = {
                        wine: 150,
                        champagne: 120,
                        spirits: 200,
                        caviar: 300,
                        cigars: 500,
                        flowers: 150,
                        cake: 200,
                        decorations: 300,
                        music: 500,
                        photography: 800,
                        catering: 100,
                        other: 100
                      };

                      const unitPrice = defaultPrices[selectedExtraCategory] || 100;
                      const totalPrice = unitPrice * customExtraForm.quantity;

                      const newExtra = {
                        id: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        cartId: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        type: 'custom_extra',
                        name: customExtraForm.name,
                        title: customExtraForm.name,
                        category: selectedExtraCategory,
                        quantity: customExtraForm.quantity,
                        unitPrice,
                        price: totalPrice,
                        basePrice: totalPrice,
                        totalWithFee: totalPrice,
                        isEstimate: true,
                        isCustomRequest: true,
                        requiresConfirmation: true,
                        notes: customExtraForm.notes || `${selectedExtraCategory} item - requires confirmation`,
                        addedAt: new Date().toISOString()
                      };

                      setCartItems(prev => [...prev, newExtra]);
                      setShowExtrasModal(false);
                      setSelectedExtraCategory(null);
                      setCustomExtraForm({ name: '', category: '', quantity: 1, notes: '' });
                      setToast({ message: `Added ${customExtraForm.name} to cart`, type: 'cart' });
                    }}
                    disabled={!customExtraForm.name.trim()}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Multi-Stop Journey Builder Modal */}
      {showJourneyBuilder && journeyBuilderJet && (
        <JourneyBuilder
          isOpen={showJourneyBuilder}
          onClose={() => {
            setShowJourneyBuilder(false);
            setJourneyBuilderJet(null);
          }}
          jet={journeyBuilderJet}
          origin={journeyBuilderJet.from || journeyBuilderJet.from_city || journeyBuilderJet.origin}
          originCode={journeyBuilderJet.from_iata || journeyBuilderJet.originIata || ''}
          originLat={journeyBuilderJet.originLat || journeyBuilderJet.from_lat}
          originLng={journeyBuilderJet.originLng || journeyBuilderJet.from_lng}
          destination={journeyBuilderJet.to || journeyBuilderJet.to_city || journeyBuilderJet.destination}
          destinationCode={journeyBuilderJet.to_iata || journeyBuilderJet.destinationIata || ''}
          destinationLat={journeyBuilderJet.destLat || journeyBuilderJet.to_lat}
          destinationLng={journeyBuilderJet.destLng || journeyBuilderJet.to_lng}
          departureDate={journeyBuilderJet.departure_date}
          departureTime={journeyBuilderJet.departure_time || '09:00'}
          onComplete={handleJourneyComplete}
        />
      )}

      {/* Airport Transfer Offer Modal - after journey is added */}
      {showTransferOffer && lastAddedJourney && (
        <AirportTransferOffer
          isOpen={showTransferOffer}
          onClose={() => {
            setShowTransferOffer(false);
            setLastAddedJourney(null);
          }}
          journey={lastAddedJourney}
          suggestedTransfers={lastAddedJourney.suggestedTransfers || []}
          onAddTransfers={handleAddTransfers}
          onSkip={() => {
            setShowTransferOffer(false);
            setLastAddedJourney(null);
          }}
        />
      )}

      {/* Multi-Leg Options - Now inline buttons below AI message, modal removed */}
    </div>
  );
};

export default AIChat;