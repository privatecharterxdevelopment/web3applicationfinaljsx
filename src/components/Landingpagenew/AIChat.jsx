import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Mic, Send, X, Volume2, VolumeX, Edit2, Shield, Wallet, ShoppingCart, MessageSquare, Plus, Crown, AlertCircle, Calendar, Trash2, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plane, Clock, Upload, FileText, DollarSign, Users, MapPin, Anchor, Mountain, Car, Minus
} from 'lucide-react';
import { calculateDistance, estimateDuration, estimateCost } from '../../utils/distanceCalculator';
// Secure Claude API via Edge Function - API key stays server-side
import { claudeEdgeService } from '../../services/claudeEdgeService';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Services
import { UnifiedSearchService, ImageUtils } from '../../services/supabaseService';
import { HumeEVIClient } from '../../lib/humeClient';
import ConversationStateManager from '../../services/ConversationStateManager';
import SpheraWeb3Concierge from '../../services/SpheraWeb3Concierge';
import { claudeService } from '../../services/claudeService';
import { getSystemPrompt } from '../../lib/aiKnowledgeBase';
import { chatService } from '../../services/chatService';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuth } from '../../context/AuthContext';
import { createRequest } from '../../services/requests';
import {
  aiToolDefinitions,
  executeTool,
  searchEmptyLegs,
  searchPrivateJets,
  searchHelicopters,
  searchYachtsAndAdventures,
  searchLuxuryCars
} from '../../services/aiTools';
import { airportsJsonService as airportsService } from '../../services/airportsJsonService';

// Components
import SearchResults from '../SearchResults';
import { supabase } from '../../lib/supabase';
import CreateEventModal from '../Calendar/CreateEventModal';
import RequestAdjustmentModal from '../modals/RequestAdjustmentModal';
import ConsultationBookingModal from '../modals/ConsultationBookingModal';
import WalletConnect from '../WalletConnect';
import LoadingMessage from '../LoadingMessage';
import BulkOrderInterface from '../BulkOrderInterface';
import SubscriptionModal from '../SubscriptionModal';
import CryptoPaymentModal from '../Payment/CryptoPaymentModal';

// Web3
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { signAIChatRequest } from '../../lib/web3';

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
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
    setDisplayedText('');
    setIsComplete(false);
    startTimeRef.current = null;

    // Split text into words for smoother typing
    const words = text.split(/(\s+)/); // Keep whitespace
    let currentWordIndex = 0;
    let currentCharInWord = 0;
    let result = '';

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      // Calculate how many characters should be shown based on elapsed time
      // Use variable speed: faster for common words, slight pause after punctuation
      const baseCharsToShow = Math.floor(elapsed / speed);

      // Build the displayed text
      let charsShown = 0;
      result = '';

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
        if (onComplete) {
          setTimeout(onComplete, 100);
        }
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [text, speed, onComplete]);

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
  setChatHistory: setChatHistoryProp,
  onBack = null // Callback to navigate back to overview
}) => {
  // Use auth context (returns null if not in AuthProvider)
  const authContext = useAuth();
  const user = userProp || authContext?.user || { name: 'Guest', id: null };
  const isAdmin = authContext?.isAdmin || false;

  // URL routing for direct chat links
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  console.log('👤 User info:', { userId: user?.id, isAdmin, hasAuthContext: !!authContext });

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

  // Multi-stop flight management
  const [showMultiStopForm, setShowMultiStopForm] = useState(false);
  const [multiStopItemId, setMultiStopItemId] = useState(null); // Which cart item is being edited for multi-stop
  const [stopSearchQuery, setStopSearchQuery] = useState('');
  const [stopSearchResults, setStopSearchResults] = useState([]);
  const [isSearchingStops, setIsSearchingStops] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null); // 'origin' | 'destination' | null
  const [editEndpointItemId, setEditEndpointItemId] = useState(null); // Which cart item's endpoint is being edited

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
  const localChatIdsRef = useRef(new Set()); // Track locally created chat IDs to skip DB fetch

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

  // URL-based chat loading: Load specific chat when navigating directly to /chat/:chatId
  // Only runs once on mount to load chat from DB if needed
  const urlChatLoadedRef = useRef(false);

  useEffect(() => {
    // Only load once
    if (urlChatLoadedRef.current) return;
    if (!urlChatId || urlChatId === 'new' || !user?.id) return;

    // Skip if this is a locally-created chat (not saved to DB yet)
    if (localChatIdsRef.current.has(urlChatId)) {
      console.log('🏠 Skipping DB fetch for locally-created chat:', urlChatId);
      urlChatLoadedRef.current = true;
      return;
    }

    // Check if chat already exists in local history
    const existsLocally = chatHistory.find(c => c.id === urlChatId);
    if (existsLocally) {
      console.log('📂 Chat found in local history:', urlChatId);
      urlChatLoadedRef.current = true;
      return;
    }

    urlChatLoadedRef.current = true;
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
  }, [urlChatId, user?.id, chatHistory]); // chatHistory needed to check if chat exists locally

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

      // Check if user has reached chat limit on load (strict enforcement)
      if (!isAdmin && profile) {
        const { canStart, chatsUsed, chatsLimit } = await subscriptionService.canStartNewChat(user.id);
        if (!canStart) {
          console.log('🚫 User has reached chat limit on load:', { chatsUsed, chatsLimit });
          setChatLimitReached(true);
        } else {
          setChatLimitReached(false);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Handle subscription success - refresh profile when returning from Stripe payment
  useEffect(() => {
    const subscriptionSuccess = searchParams.get('subscription_success');
    if (subscriptionSuccess === 'true' && user?.id) {
      console.log('🎉 Subscription success detected - refreshing profile...');
      // Clear the URL parameter
      setSearchParams(prev => {
        prev.delete('subscription_success');
        return prev;
      });
      // Refresh profile and reset chat limit state
      loadUserProfile();
      setToast({ message: 'Subscription activated! Your chat limits have been updated.', type: 'success' });
    }
  }, [searchParams, user?.id]);

  // Refresh profile when window regains focus (useful when payment completed in another tab)
  useEffect(() => {
    const handleFocus = async () => {
      if (user?.id && showSubscriptionModal) {
        console.log('🔄 Window focused with subscription modal open - refreshing profile...');
        await loadUserProfile();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, showSubscriptionModal]);

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
        // Merge with existing local chats (don't overwrite locally-created chats)
        setChatHistory(prev => {
          // Get IDs of locally-created chats that aren't in the DB yet
          const localOnlyChats = prev.filter(c => localChatIdsRef.current.has(c.id));
          // Combine: local chats first, then DB chats (avoiding duplicates)
          const dbChatIds = new Set(formattedChats.map(c => c.id));
          const uniqueLocalChats = localOnlyChats.filter(c => !dbChatIds.has(c.id));
          return [...uniqueLocalChats, ...formattedChats];
        });
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
  // Ref to store the query that's pending to be sent after chat setup
  const pendingQueryRef = useRef(null);
  // Ref to track the chat ID we created for the initial query
  const initialQueryChatIdRef = useRef(null);

  // Handle initial query from search - create new chat and send message
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      // Skip if we've already processed this exact query
      if (processedQueriesRef.current.has(initialQuery)) {
        console.log('⏭️ Skipping already processed query:', initialQuery);
        return;
      }

      console.log('📝 Initial query received:', initialQuery);

      // Mark this query as being processed
      processedQueriesRef.current.add(initialQuery);

      // Store the query to be sent
      pendingQueryRef.current = initialQuery;

      // Create a new chat with the initial query - include user message from start
      const newChatId = Date.now().toString();
      initialQueryChatIdRef.current = newChatId;

      // Create user message to show immediately
      const userMessage = { role: 'user', content: initialQuery };

      const newChat = {
        id: newChatId,
        title: initialQuery.split(' ').slice(0, 5).join(' ') + '...',
        date: 'Just now',
        messages: [userMessage] // Include user message from the start so it displays
      };

      console.log('🆕 Creating new chat with user message:', newChatId);

      // Mark as local chat to prevent URL-based DB fetch
      localChatIdsRef.current.add(newChatId);

      // Add to chat history and set as active
      setChatHistory(prev => [newChat, ...prev]);
      setActiveChat(newChatId);

      // Clear the initial query prop so parent doesn't keep passing it
      onQueryProcessed();
    }
  }, [initialQuery, onQueryProcessed]);

  // Process the pending query after chat is set up and active
  useEffect(() => {
    // Only proceed if we have a pending query and the correct chat is active
    if (pendingQueryRef.current &&
        initialQueryChatIdRef.current &&
        activeChat === initialQueryChatIdRef.current) {

      const query = pendingQueryRef.current;
      const chatId = initialQueryChatIdRef.current;

      // Verify the chat exists in our history
      const chatExists = chatHistory.find(c => c.id === chatId);

      if (chatExists) {
        console.log('🚀 Sending initial query to AI:', query);

        // Clear refs before sending to prevent double-send
        pendingQueryRef.current = null;
        initialQueryChatIdRef.current = null;

        // Send the message with a small delay to ensure UI is ready
        // Skip adding user message since it was already added during chat creation
        setTimeout(() => {
          handleSendMessage(query, { skipAddUserMessage: true });
        }, 100);
      }
    }
  }, [activeChat, chatHistory]);

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

      // Mark as local chat to prevent URL-based DB fetch
      localChatIdsRef.current.add(newChatId);

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
    let cartItem = {
      ...item,
      cartId: Date.now(),
      addedAt: new Date().toISOString()
    };

    // For jets and helicopters: calculate estimated price based on flight distance/time
    const isJet = item.type === 'jets' || item.type === 'jet';
    const isHelicopter = item.type === 'helicopters' || item.type === 'helicopter';

    if ((isJet || isHelicopter) && item.hourly_rate_eur) {
      // FIRST: Check if item already has flightDistance and estimatedDuration (from search results)
      if (item.flightDistance && item.estimatedDuration) {
        // Parse duration to get hours (e.g., "2h 30m" -> 2.5)
        const durationMatch = item.estimatedDuration.match(/(\d+)h\s*(\d+)?m?/);
        let flightTimeHours = 1;
        if (durationMatch) {
          flightTimeHours = parseInt(durationMatch[1]) + (parseInt(durationMatch[2] || 0) / 60);
        }

        // Round UP to nearest hour for billing
        const billedHours = Math.ceil(flightTimeHours);

        // Calculate estimated price
        const estimatedPrice = billedHours * item.hourly_rate_eur;

        // Add calculated fields to cart item
        cartItem = {
          ...cartItem,
          flightDistanceNm: item.flightDistance,
          flightTimeHours: flightTimeHours,
          estimatedDuration: item.estimatedDuration,
          billedHours: billedHours,
          estimatedPrice: estimatedPrice,
          price: estimatedPrice,
          basePrice: estimatedPrice,
          totalWithFee: estimatedPrice,
          isEstimate: true,
          priceCalculation: `${billedHours}h × €${item.hourly_rate_eur.toLocaleString()}/hr`,
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

            // Round UP to nearest hour for billing (40 min = 1 hour, 3h 20m = 4 hours)
            const billedHours = Math.ceil(flightTimeHours);

            // Calculate estimated price
            const estimatedPrice = billedHours * item.hourly_rate_eur;

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
              billedHours: billedHours,
              estimatedPrice: estimatedPrice,
              price: estimatedPrice,
              basePrice: estimatedPrice,
              totalWithFee: estimatedPrice,
              isEstimate: true,
              priceCalculation: `${billedHours}h × €${item.hourly_rate_eur.toLocaleString()}/hr`,
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
    const priceInfo = cartItem.estimatedPrice ? ` (~€${cartItem.estimatedPrice.toLocaleString()})` : '';
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
      msg += `\n💰 Est. price: ${cartItem.priceCalculation} = ~€${cartItem.estimatedPrice.toLocaleString()}`;
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

  // ===== MULTI-STOP FLIGHT FUNCTIONS =====

  // Search airports for stop locations
  const searchStopAirports = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setStopSearchResults([]);
      return;
    }
    setIsSearchingStops(true);
    try {
      const results = await airportsService.searchAirports(query);
      setStopSearchResults(results.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Error searching airports:', error);
      setStopSearchResults([]);
    } finally {
      setIsSearchingStops(false);
    }
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateLegDistance = useCallback((from, to) => {
    if (!from || !to) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }, []);

  // Add a stop to a cart item (jet/helicopter)
  const addStopToCartItem = useCallback((cartItemId, stopAirport, stopDuration = 60) => {
    setCartItems(prev => prev.map(item => {
      if ((item.cartId === cartItemId) && (item.type === 'jets' || item.type === 'jet' || item.type === 'helicopters' || item.type === 'helicopter')) {
        const stops = item.stops || [];
        const newStop = {
          ...stopAirport,
          stopDuration: stopDuration, // minutes at this stop
          departureTime: null, // Will be calculated
          arrivalTime: null
        };
        const updatedStops = [...stops, newStop];

        // Recalculate total distance and price with stops
        const { totalDistance, totalFlightTime, legs, totalPrice } = calculateMultiStopRoute(item, updatedStops);

        return {
          ...item,
          stops: updatedStops,
          legs: legs,
          totalDistance: totalDistance,
          flightDistanceNm: totalDistance * 0.539957, // Convert km to nm
          flightTimeHours: totalFlightTime,
          estimatedDuration: formatDuration(totalFlightTime),
          billedHours: Math.ceil(totalFlightTime),
          estimatedPrice: totalPrice,
          price: totalPrice,
          basePrice: totalPrice,
          totalWithFee: totalPrice,
          priceCalculation: `${Math.ceil(totalFlightTime)}h × €${item.hourly_rate_eur?.toLocaleString() || 0}/hr`,
          route: formatMultiStopRoute(item.from || item.origin, updatedStops, item.to || item.destination),
          isMultiStop: true
        };
      }
      return item;
    }));

    // Close the multi-stop form
    setShowMultiStopForm(false);
    setMultiStopItemId(null);
    setStopSearchQuery('');
    setStopSearchResults([]);

    setToast({ message: `Stop added: ${stopAirport.name}`, type: 'cart' });
  }, []);

  // Remove a stop from a cart item
  const removeStopFromCartItem = useCallback((cartItemId, stopIndex) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartId === cartItemId && item.stops) {
        const updatedStops = item.stops.filter((_, idx) => idx !== stopIndex);

        if (updatedStops.length === 0) {
          // No more stops - revert to direct route
          const directDistance = calculateLegDistance(
            { lat: item.originLat || 0, lng: item.originLng || 0 },
            { lat: item.destLat || 0, lng: item.destLng || 0 }
          );
          const speedKmh = (item.speed_kts || 450) * 1.852;
          const flightTime = directDistance / speedKmh;
          const billedHours = Math.ceil(flightTime);
          const price = billedHours * (item.hourly_rate_eur || 0);

          return {
            ...item,
            stops: [],
            legs: null,
            totalDistance: directDistance,
            flightTimeHours: flightTime,
            estimatedDuration: formatDuration(flightTime),
            billedHours: billedHours,
            estimatedPrice: price,
            price: price,
            basePrice: price,
            totalWithFee: price,
            priceCalculation: `${billedHours}h × €${item.hourly_rate_eur?.toLocaleString() || 0}/hr`,
            route: `${item.from || item.origin} → ${item.to || item.destination}`,
            isMultiStop: false
          };
        }

        // Recalculate with remaining stops
        const { totalDistance, totalFlightTime, legs, totalPrice } = calculateMultiStopRoute(item, updatedStops);

        return {
          ...item,
          stops: updatedStops,
          legs: legs,
          totalDistance: totalDistance,
          flightDistanceNm: totalDistance * 0.539957,
          flightTimeHours: totalFlightTime,
          estimatedDuration: formatDuration(totalFlightTime),
          billedHours: Math.ceil(totalFlightTime),
          estimatedPrice: totalPrice,
          price: totalPrice,
          basePrice: totalPrice,
          totalWithFee: totalPrice,
          priceCalculation: `${Math.ceil(totalFlightTime)}h × €${item.hourly_rate_eur?.toLocaleString() || 0}/hr`,
          route: formatMultiStopRoute(item.from || item.origin, updatedStops, item.to || item.destination),
          isMultiStop: updatedStops.length > 0
        };
      }
      return item;
    }));

    setToast({ message: 'Stop removed', type: 'cart' });
  }, [calculateLegDistance]);

  // Update stop duration (time spent at destination)
  const updateStopDuration = useCallback((cartItemId, stopIndex, durationMinutes) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartId === cartItemId && item.stops) {
        const updatedStops = item.stops.map((stop, idx) =>
          idx === stopIndex ? { ...stop, stopDuration: durationMinutes } : stop
        );

        // Recalculate schedule with new stop duration
        const { totalDistance, totalFlightTime, legs, totalPrice } = calculateMultiStopRoute(item, updatedStops);

        return {
          ...item,
          stops: updatedStops,
          legs: legs,
          totalDistance: totalDistance,
          flightTimeHours: totalFlightTime,
          estimatedPrice: totalPrice,
          price: totalPrice,
          basePrice: totalPrice,
          totalWithFee: totalPrice
        };
      }
      return item;
    }));
  }, []);

  // Calculate multi-stop route details
  const calculateMultiStopRoute = useCallback((item, stops) => {
    const legs = [];
    let totalDistance = 0;
    let totalFlightTime = 0;

    // Speed in km/h (convert from knots)
    const speedKmh = (item.speed_kts || 450) * 1.852;
    const hourlyRate = item.hourly_rate_eur || 5000;

    // Get origin coordinates
    const origin = {
      name: item.from || item.origin || item.from_city,
      code: item.from_iata || item.originIata || '',
      lat: item.originLat || 0,
      lng: item.originLng || 0
    };

    // Get destination coordinates
    const destination = {
      name: item.to || item.destination || item.to_city,
      code: item.to_iata || item.destinationIata || '',
      lat: item.destLat || 0,
      lng: item.destLng || 0
    };

    // Build waypoints: origin -> stops -> destination
    const waypoints = [origin, ...stops, destination];

    // Calculate each leg
    let currentTime = item.departure_time ? new Date(`2000-01-01T${item.departure_time}`) : new Date();

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      const legDistance = calculateLegDistance(from, to);
      const legFlightTime = legDistance / speedKmh; // hours

      const departureTime = new Date(currentTime);
      const arrivalTime = new Date(currentTime.getTime() + legFlightTime * 60 * 60 * 1000);

      legs.push({
        from: from.name || from.city,
        fromCode: from.code || '',
        to: to.name || to.city,
        toCode: to.code || '',
        distance: Math.round(legDistance),
        flightTime: legFlightTime,
        departureTime: departureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        arrivalTime: arrivalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        stopDuration: to.stopDuration || 0
      });

      totalDistance += legDistance;
      totalFlightTime += legFlightTime;

      // Add stop duration to current time for next leg departure
      currentTime = new Date(arrivalTime.getTime() + (to.stopDuration || 0) * 60 * 1000);
    }

    // Calculate total price (billed hours × hourly rate)
    const billedHours = Math.ceil(totalFlightTime);
    const totalPrice = billedHours * hourlyRate;

    return {
      legs,
      totalDistance: Math.round(totalDistance),
      totalFlightTime,
      totalPrice
    };
  }, [calculateLegDistance]);

  // Format duration from hours to readable string
  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Format multi-stop route string
  const formatMultiStopRoute = (origin, stops, destination) => {
    const stopNames = stops.map(s => s.code || s.name?.substring(0, 3).toUpperCase()).join(' → ');
    return `${origin} → ${stopNames} → ${destination}`;
  };

  // Update origin or destination of a cart item
  const updateCartItemEndpoint = useCallback((cartItemId, endpointType, newAirport) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartId !== cartItemId) return item;
      if (item.type !== 'jets' && item.type !== 'jet' && item.type !== 'helicopters' && item.type !== 'helicopter') return item;

      let updatedItem = { ...item };

      if (endpointType === 'origin') {
        updatedItem = {
          ...updatedItem,
          from: newAirport.city || newAirport.name,
          from_city: newAirport.city || newAirport.name,
          origin: newAirport.city || newAirport.name,
          from_iata: newAirport.code || newAirport.iata,
          originIata: newAirport.code || newAirport.iata,
          originLat: newAirport.lat,
          originLng: newAirport.lng
        };
      } else if (endpointType === 'destination') {
        updatedItem = {
          ...updatedItem,
          to: newAirport.city || newAirport.name,
          to_city: newAirport.city || newAirport.name,
          destination: newAirport.city || newAirport.name,
          to_iata: newAirport.code || newAirport.iata,
          destinationIata: newAirport.code || newAirport.iata,
          destLat: newAirport.lat,
          destLng: newAirport.lng
        };
      }

      // Recalculate route with stops if any
      if (updatedItem.stops && updatedItem.stops.length > 0) {
        const { totalDistance, totalFlightTime, legs, totalPrice } = calculateMultiStopRoute(updatedItem, updatedItem.stops);
        updatedItem = {
          ...updatedItem,
          legs: legs,
          totalDistance: totalDistance,
          flightDistanceNm: totalDistance * 0.539957,
          flightTimeHours: totalFlightTime,
          estimatedDuration: formatDuration(totalFlightTime),
          billedHours: Math.ceil(totalFlightTime),
          estimatedPrice: totalPrice,
          price: totalPrice,
          basePrice: totalPrice,
          totalWithFee: totalPrice,
          priceCalculation: `${Math.ceil(totalFlightTime)}h × €${updatedItem.hourly_rate_eur?.toLocaleString() || 0}/hr`,
          route: formatMultiStopRoute(
            updatedItem.from || updatedItem.origin,
            updatedItem.stops,
            updatedItem.to || updatedItem.destination
          )
        };
      } else {
        // Direct route - recalculate
        const origin = { lat: updatedItem.originLat || 0, lng: updatedItem.originLng || 0 };
        const dest = { lat: updatedItem.destLat || 0, lng: updatedItem.destLng || 0 };
        const distanceKm = calculateLegDistance(origin, dest);
        const speedKmh = (updatedItem.speed_kts || 450) * 1.852;
        const flightTimeHours = distanceKm / speedKmh;
        const billedHours = Math.ceil(flightTimeHours);
        const totalPrice = billedHours * (updatedItem.hourly_rate_eur || 0);

        updatedItem = {
          ...updatedItem,
          totalDistance: distanceKm,
          flightDistanceNm: distanceKm * 0.539957,
          flightTimeHours: flightTimeHours,
          estimatedDuration: formatDuration(flightTimeHours),
          billedHours: billedHours,
          estimatedPrice: totalPrice,
          price: totalPrice,
          basePrice: totalPrice,
          totalWithFee: totalPrice,
          priceCalculation: `${billedHours}h × €${updatedItem.hourly_rate_eur?.toLocaleString() || 0}/hr`,
          route: `${updatedItem.from || updatedItem.origin} → ${updatedItem.to || updatedItem.destination}`
        };
      }

      return updatedItem;
    }));

    // Close the modal
    setEditingEndpoint(null);
    setEditEndpointItemId(null);
    setStopSearchQuery('');
    setStopSearchResults([]);

    setToast({ message: `${endpointType === 'origin' ? 'Departure' : 'Arrival'} updated`, type: 'cart' });
  }, [calculateLegDistance, calculateMultiStopRoute]);
  // ===== END MULTI-STOP FUNCTIONS =====

  // Break the Price - check if user has access AND has available chats
  const canUseBreakThePrice = useCallback(() => {
    if (!userSubscriptionLimits) {
      console.log('🔒 canUseBreakThePrice: No subscription limits loaded');
      return false;
    }
    // Must have break_the_price feature enabled (starter, pro, elite)
    if (userSubscriptionLimits.break_the_price !== true) {
      console.log('🔒 canUseBreakThePrice: Feature not enabled for tier:', userSubscriptionLimits.tier);
      return false;
    }
    // Elite users always have access (unlimited)
    if (userSubscriptionLimits.tier === 'elite' || userSubscriptionLimits.unlimited_chats) {
      console.log('🔓 canUseBreakThePrice: Elite user - unlimited access');
      return true;
    }
    // Non-elite users need at least 1 chat remaining (break the price costs 1 chat)
    const chatsRemaining = userSubscriptionLimits.chats_remaining ??
      ((userSubscriptionLimits.chats_limit || 0) - (userSubscriptionLimits.chats_used || 0));
    const hasAccess = chatsRemaining >= 1;
    console.log(`🔐 canUseBreakThePrice: ${hasAccess ? '🔓' : '🔒'} chatsRemaining=${chatsRemaining}, tier=${userSubscriptionLimits.tier}`);
    return hasAccess;
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

  // Fetch user subscription limits on mount and when subscription changes
  useEffect(() => {
    const fetchSubscriptionLimits = async () => {
      if (!user?.id) return;
      try {
        console.log('🔄 Fetching subscription limits for user:', user.id, 'tier:', user.subscription_tier);
        const { data, error } = await supabase.rpc('get_chat_limits', { p_user_id: user.id });
        if (!error && data) {
          console.log('✅ Subscription limits received:', data);
          setUserSubscriptionLimits(data);
        }
      } catch (err) {
        console.warn('Failed to fetch subscription limits:', err);
      }
    };
    fetchSubscriptionLimits();
  }, [user?.id, user?.subscription_tier]); // Re-fetch when tier changes via AuthContext

  // Set up real-time listener for user_profiles changes to update subscription limits
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('aichat_profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('📡 AIChat: Subscription changed, refreshing limits...', payload.new);
          // Re-fetch subscription limits when profile updates
          const { data, error } = await supabase.rpc('get_chat_limits', { p_user_id: user.id });
          if (!error && data) {
            console.log('✅ AIChat: Updated subscription limits:', data);
            setUserSubscriptionLimits(data);
            // Also reload user profile
            loadUserProfile();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      const toType = () => {
        if (types.size > 1) return 'booking';
        const only = Array.from(types)[0];
        if (only === 'empty_legs') return 'empty_leg';
        if (only === 'jets' || only === 'aircraft') return 'private_jet_charter';
        if (only === 'helicopters') return 'helicopter_charter';
        if (only === 'luxury_cars' || only === 'cars') return 'luxury_car_rental';
        if (only === 'taxi_cars' || only === 'taxi' || only === 'transfer' || only === 'ground_transport') return 'ground_transport';
        return 'booking';
      };

      const { data: userInfo } = await supabase.auth.getUser();
      const userId = userInfo?.user?.id || null;

      if (userId) {
        const payload = {
          user_id: userId,
          type: toType(),
          data: {
            request_id: request.id,
            items: cartItems,
            total: cartTotal,
            payment_method: selectedPaymentMethod,
            wallet_address: connectedWallet,
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
        }
      } else {
        console.warn('Not logged in; skipping user_requests insert');
      }
    } catch (e) {
      console.error('Error saving to user_requests:', e);
    }

    let msg = `Request submitted!\n\nReference: ${request.id}\nTotal: $${cartTotal.toLocaleString()}\n\nOur team will respond within 2-4 hours.`;
    
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

          setChatHistory(prev => prev.map(c => {
            if (c.id === activeChat) {
              const updatedMessages = [...c.messages, { role: 'assistant', content: withEmpathy(aiResponse) }];
              setTypingMessageIndex(updatedMessages.length - 1);
              return { ...c, messages: updatedMessages };
            }
            return c;
          }));
        } catch (error) {
          const fallbackResponse = `I understand you're looking for "${query}" - while I don't see exact matches right now, I'm creating a custom request for our team. They'll respond within 2-4 hours with personalized options. Would you like to adjust your criteria or explore alternative solutions?`;

          setChatHistory(prev => prev.map(c => {
            if (c.id === activeChat) {
              const updatedMessages = [...c.messages, { role: 'assistant', content: withEmpathy(fallbackResponse) }];
              setTypingMessageIndex(updatedMessages.length - 1);
              return { ...c, messages: updatedMessages };
            }
            return c;
          }));
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

            const currency = leg.currency || (leg.price_usd ? 'USD' : 'EUR');
            const price = leg.price_usd || leg.price || leg.price_eur || null;

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
              'Currency': currency,
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
              currency,
              price,
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

      // Add fixed offers / adventures (from fixed_offers table with is_empty_leg = false)
      const adventures = filteredResults.adventures || [];
      if (adventures.length > 0) {
        formattedTabs.push({
          id: 'adventures',
          title: 'Fixed Offers & Adventures',
          count: adventures.length,
          items: adventures.map(adv => ({
            ...adv,
            type: 'adventures',
            name: adv.title || adv.name,
            title: adv.title || adv.name,
            subtitle: `${adv.origin || ''} → ${adv.destination || ''}`.trim() || adv.description,
            price: adv.price_eur || adv.price,
            description: adv.description,
            images: ImageUtils.getAllImageUrls(adv.images || adv.image_url, 'adventure-images'),
            primaryImage: ImageUtils.getPrimaryImage(adv.images || adv.image_url),
            details: {
              'Package': adv.title || adv.name,
              'Route': `${adv.origin || 'TBD'} → ${adv.destination || 'TBD'}`,
              'Duration': adv.duration || '—',
              'Price': adv.price_eur ? `$${adv.price_eur.toLocaleString()}` : '—',
              'Description': adv.description || '—'
            }
          }))
        });
      }

      if (filteredResults.luxuryCars?.length > 0) {
        formattedTabs.push({
          id: 'taxi_cars',
          title: 'Taxi & Chauffeur Service',
          count: filteredResults.luxuryCars.length,
          items: filteredResults.luxuryCars.map(car => ({
            ...car,
            type: 'taxi_cars',
            name: car.name || `${car.brand} ${car.model}`,
            title: car.name,
            subtitle: `${car.seats} seats • ${car.category}`,
            price_range: `CHF ${car.price_min_chf} - ${car.price_max_chf} per km`,
            price_min: car.price_min_chf,
            price_max: car.price_max_chf,
            description: car.description || `Professional chauffeur service with ${car.name}`,
            images: car.image_url ? [car.image_url] : [],
            primaryImage: car.image_url,
            details: {
              'Vehicle': car.name,
              'Brand': car.brand,
              'Model': car.model,
              'Year': car.year || 'Current',
              'Seats': car.seats,
              'Category': car.category,
              'Price per km': `CHF ${car.price_min_chf} - ${car.price_max_chf}`,
              'Availability': car.available ? 'Available' : 'Not Available'
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

        setChatHistory(prev => prev.map(c => {
          if (c.id === activeChat) {
            const updatedMessages = [...c.messages, { role: 'assistant', content: withEmpathy(aiResponse) }];
            setTypingMessageIndex(updatedMessages.length - 1);
            return { ...c, messages: updatedMessages };
          }
          return c;
        }));
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

        setChatHistory(prev => prev.map(c => {
          if (c.id === activeChat) {
            const updatedMessages = [...c.messages, { role: 'assistant', content: withEmpathy(response) }];
            setTypingMessageIndex(updatedMessages.length - 1);
            return { ...c, messages: updatedMessages };
          }
          return c;
        }));
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
  const handleSendMessage = async (message, { skipAddUserMessage = false } = {}) => {
    if (!message.trim() || isProcessing) return;
    // NOTE: anthropicRef check removed - claudeEdgeService is always available

    // Check message limit (20 messages per chat, except Elite which has unlimited)
    const existingChat = chatHistory.find(c => c.id === activeChat);
    const currentMsgCount = existingChat?.messages?.filter(m => m.role === 'user').length || 0;

    // Elite tier has unlimited messages per chat
    const hasUnlimitedMessages = userSubscriptionLimits?.unlimited_messages === true;

    if (!hasUnlimitedMessages && currentMsgCount >= MAX_MESSAGES_PER_CHAT && activeChat !== 'new') {
      setMessageLimitReached(true);
      // Don't block - just show the limit reached UI
      return;
    }

    // Update message count (still track for non-Elite users)
    if (!hasUnlimitedMessages) {
      setMessageCount(currentMsgCount + 1);
    }

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

      // Check if user can start a new chat (subscription limit) - STRICT enforcement
      if (!isAdmin) {
        try {
          const { canStart, chatsUsed, chatsLimit } = await subscriptionService.canStartNewChat(user.id);
          if (!canStart) {
            console.log('🚫 Chat limit reached - BLOCKING');
            setChatLimitReached(true);
            setToast({
              message: `You've reached your chat limit (${chatsUsed}/${chatsLimit}). Upgrade to continue.`,
              type: 'warning'
            });
            // Show subscription modal immediately for upgrade
            setShowSubscriptionModal(true);
            setIsProcessing(false);
            return;
          }
        } catch (error) {
          console.warn('Failed to check chat limit:', error);
          // Continue anyway on error
        }
      }

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

          // Increment chat usage count for subscription tracking (skip for admin and elite users)
          if (!isAdmin && userSubscriptionLimits?.tier !== 'elite') {
            try {
              await subscriptionService.incrementChatUsage(user.id);
              // Also create chat usage record for message tracking
              await subscriptionService.createChatSession(user.id, chatId);
            } catch (usageError) {
              console.warn('Failed to update chat usage:', usageError);
            }
          }
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
      // Regular message in existing chat - skip adding user message if already added (e.g., from initialQuery)
      if (!skipAddUserMessage) {
        setChatHistory(prev => prev.map(c =>
          c.id === activeChat
            ? { ...c, messages: [...c.messages, userMessage] }
            : c
        ));

        if (existingChat) {
          await chatService.updateChatMessages(activeChat, [...existingChat.messages, userMessage], user.id);
        }
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

    // Add a loading message (only if not just created a new chat with loading already added)
    if (workingChatId === activeChat) {
      const loadingMessage = { role: 'assistant', content: '...', isLoading: true };
      setChatHistory(prev => prev.map(c =>
        c.id === workingChatId
          ? { ...c, messages: [...c.messages, loadingMessage] }
          : c
      ));
    }

    try {
      const systemPrompt = getSystemPrompt();

      // Filter out 'results' messages - they're UI-only, not part of Claude conversation
      const claudeMessages = conversationHistory
        .filter(msg => msg.role !== 'results')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

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
        } else {
          // Remove loading message if no text before tool use
          setChatHistory(prev => prev.map(c =>
            c.id === workingChatId
              ? { ...c, messages: c.messages.filter(m => !m.isLoading) }
              : c
          ));
        }

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
              if (toolResult.results.adventures && toolResult.results.adventures.length > 0) {
                tabs.push({
                  id: 'adventures',
                  title: 'Adventures',
                  count: toolResult.results.adventures.length,
                  items: toolResult.results.adventures
                });
              }
            } else if (toolUse.name === 'searchLuxuryCars' && toolResult.results && toolResult.results.length > 0) {
              tabs.push({
                id: 'luxury_cars',
                title: 'Luxury Cars',
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

          setChatHistory(prev => prev.map(c =>
            c.id === workingChatId
              ? { ...c, messages: [...c.messages, aiMessage] }
              : c
          ));

          await chatService.updateChatMessages(workingChatId, [...conversationHistory, aiMessage], user.id);
        }
      } else {
        const textBlock = response.content.find(block => block.type === 'text');
        const aiMessage = { role: 'assistant', content: textBlock?.text || 'How can I help?' };

        // Remove loading message and add actual response
        setChatHistory(prev => prev.map(c =>
          c.id === workingChatId
            ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), aiMessage] }
            : c
        ));

        await chatService.updateChatMessages(workingChatId, [...conversationHistory, aiMessage], user.id);
      }
    } catch (error) {
      console.error('❌ Claude API error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        type: error.type,
        error: error
      });
      const errorMsg = error.message || error.error?.message || 'Failed to get AI response';
      setToast({ message: `AI Error: ${errorMsg}`, type: 'error' });
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
          console.log('🚫 Chat limit reached - BLOCKING new chat');
          // Show toast notification
          setToast({
            message: `You've reached your chat limit (${chatsUsed}/${chatsLimit}). Upgrade to continue using Sphera AI.`,
            type: 'warning'
          });
          // Show subscription modal immediately
          setShowSubscriptionModal(true);
          // Set flag to block future attempts
          setChatLimitReached(true);
          setIsProcessing(false);
          // BLOCK - do not continue creating chat
          return;
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
        // Increment chat usage (non-critical - don't block if it fails, skip for elite users)
        if (user?.id && !isAdmin && userSubscriptionLimits?.tier !== 'elite') {
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
      const conversationHistory = updatedMessages.map(msg => ({
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

      // Show actual error to user for debugging
      const errorResponse = `⚠️ AI Error: ${error.message}\n\nPlease check console for details. (This is a debug message - Claude API might be failing)`;

      setChatHistory(prev => prev.map(c =>
        c.id === workingChatId
          ? { ...c, messages: [...c.messages, { role: 'assistant', content: errorResponse }] }
          : c
      ));
    } finally {
      setAssistantTyping(false);
    }
  };

  // Generate a proper UUID v4
  const generateUUID = useCallback(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }, []);

  // Generate the Sphera AI welcome message
  const getWelcomeMessage = useCallback(() => {
    const timeOfDay = new Date().getHours();
    let greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 18 ? 'Good afternoon' : 'Good evening';
    greeting += user?.name ? ` ${user.name}` : '';
    greeting += `. I'm Sphera, your luxury travel AI assistant. How can I help you today?`;
    return greeting;
  }, [user?.name]);

  // AUTO-CREATE NEW CHAT - When activeChat is 'new', create and switch immediately
  const pendingChatRef = useRef(null);

  useEffect(() => {
    // Skip auto-create if there's an initialQuery - let the initialQuery effect handle chat creation
    if (initialQuery && initialQuery.trim()) {
      console.log('⏭️ Skipping auto-create: initialQuery will handle chat creation');
      return;
    }

    if (activeChat === 'new' && user?.id) {
      // Check if we already have a pending chat being created
      if (pendingChatRef.current) return;

      console.log('🆕 Auto-creating new chat session...');
      const chatId = generateUUID();
      const welcomeMsg = getWelcomeMessage();
      const newChat = {
        id: chatId,
        title: '', // Empty until user sends first message
        date: 'Just now',
        messages: [{ role: 'assistant', content: welcomeMsg }]
      };

      pendingChatRef.current = chatId;
      localChatIdsRef.current.add(chatId);

      // Add to history and switch in one go
      setChatHistory(prev => [newChat, ...prev]);
      setActiveChat(chatId);

      // Clear pending after state updates
      setTimeout(() => {
        pendingChatRef.current = null;
      }, 100);
    }
  }, [activeChat, user?.id, generateUUID, getWelcomeMessage, initialQuery]);

  // Simple fallback for rendering - create a temporary chat object if needed
  const renderChat = useMemo(() => {
    // If we have a current chat from history, use it
    if (currentChat) return currentChat;

    // Generate welcome message for placeholder chats
    const welcomeMsg = getWelcomeMessage();
    const defaultMessages = [{ role: 'assistant', content: welcomeMsg }];

    // If activeChat is 'new' or we're waiting for state to update, use a placeholder
    if (activeChat === 'new' || pendingChatRef.current) {
      return {
        id: pendingChatRef.current || 'temp',
        title: '', // Empty until user sends first message
        date: 'Just now',
        messages: defaultMessages
      };
    }

    // If we have a valid activeChat ID but no match in history yet, create placeholder
    if (activeChat && activeChat !== 'new') {
      return {
        id: activeChat,
        title: '', // Empty until user sends first message
        date: 'Just now',
        messages: defaultMessages
      };
    }

    return null;
  }, [currentChat, activeChat, getWelcomeMessage]);

  // Only show loading if we truly have no chat to render
  if (!renderChat) {
    console.log('⚠️ No chat to render. ActiveChat:', activeChat);
    return (
      <div className="h-full bg-transparent flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading chat...</div>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering: CHAT VIEW with chat:', renderChat.id, renderChat.title);

  // CHAT VIEW - Messages flow from bottom like WhatsApp
  return (
    <div className="ai-chat-page h-full flex bg-transparent overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* 1. HEADER - STICKY TOP - More compact on mobile */}
      <div className="flex-shrink-0 px-3 sm:px-6 py-2 sm:py-4 bg-white/10 border-b border-white/20" style={{ backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Navigate back to overview/chat history
                if (onBack) {
                  onBack();
                } else {
                  // Fallback: navigate to dashboard
                  navigate('/dashboard');
                }
                setWeather(null);
                setCartItems([]);
                setSearchResults(null);
              }}
              className="px-3 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-lg font-semibold text-black truncate max-w-md">
              {renderChat?.title || renderChat?.messages?.find(m => m.role === 'user')?.content?.slice(0, 50) || 'New chat'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* 1. Chat Counter - Clickable to open subscriptions */}
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="px-2 py-1 bg-white/80 hover:bg-white rounded-md text-[11px] font-medium text-gray-600 transition-colors flex items-center gap-1.5 border border-gray-200/50"
              title="Manage subscription"
            >
              {userSubscriptionLimits?.tier === 'elite' || userSubscriptionLimits?.unlimited_chats ? (
                <span className="flex items-center gap-1 text-gray-600">
                  <span className="text-base font-light">∞</span>
                </span>
              ) : userSubscriptionLimits?.tier === 'pro' ? (
                <span className="flex items-center gap-1 text-gray-600">
                  <span>{userProfile?.chats_used || 0}/{userProfile?.chats_limit || 20}</span>
                </span>
              ) : userSubscriptionLimits?.tier === 'starter' ? (
                <span className="flex items-center gap-1 text-gray-600">
                  <span>{userProfile?.chats_used || 0}/{userProfile?.chats_limit || 5}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-600">
                  <span>{userProfile?.chats_used || 0}/{userProfile?.chats_limit || 1}</span>
                </span>
              )}
            </button>

            {/* 2. Cart Button */}
            <button
              onClick={() => setShowCartSidebar(true)}
              className="relative p-1.5 bg-white/80 hover:bg-white rounded-md text-gray-600 transition-colors border border-gray-200/50"
              title="Cart"
            >
              <ShoppingCart size={14} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-medium">
                  {cartItems.length}
                </span>
              )}
            </button>

            {/* 3. Report Issue Button - Last */}
            <button
              onClick={() => setShowReportIssueModal(true)}
              className="p-1.5 bg-white/80 hover:bg-white rounded-md text-gray-400 hover:text-gray-600 transition-colors border border-gray-200/50"
              title="Report"
            >
              <AlertCircle size={14} />
            </button>

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
            {renderChat?.messages.map((msg, idx) => {
              const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const isLastMessage = idx === renderChat.messages.length - 1;
              const shouldType = msg.role === 'assistant' && isLastMessage && typingMessageIndex === idx;

              // Render SearchResults if this is a results message
              if (msg.role === 'results' && msg.tabs) {
                return (
                  <div key={idx} className="w-full my-4">
                    <SearchResults
                      tabs={msg.tabs}
                      onAddToCart={addToCart}
                      onBookNow={addToCart}
                    />
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
                          : 'bg-gray-200 text-black border border-gray-300'
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
                          speed={15}
                          onComplete={() => setTypingMessageIndex(null)}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                      )}
                    </div>
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
                      <div className="mt-3 flex flex-col gap-2">
                        {/* Add to Cart Button - Light Grey */}
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
                          className="w-full px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-gray-300"
                        >
                          <ShoppingCart size={18} />
                          Add to Cart
                        </button>

                        {/* Send Custom Request Button - Monochromatic (adds to cart then sends) */}
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
                          className="w-full px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-gray-700"
                        >
                          <Send size={18} />
                          Send Custom Request
                        </button>
                      </div>
                    )}

                    {/* Break the Price - Confirm & Send Request */}
                    {msg.action === 'price_break_confirm' && msg.extractedData && (
                      <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign size={18} className="text-gray-700" />
                          <span className="font-medium text-gray-900">Would you like me to break the price?</span>
                          <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">FREE</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          If the extracted information is correct, click below and our team will find you a better price within 12 hours.
                        </p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={async () => {
                              try {
                                // Update the price break request status to 'confirmed'
                                if (msg.requestRef) {
                                  await supabase
                                    .from('price_break_requests')
                                    .update({ status: 'confirmed' })
                                    .eq('metadata->>reference', msg.requestRef);
                                }

                                // Create a custom request
                                const requestData = {
                                  type: 'break_the_price',
                                  source: 'ai_chat',
                                  reference: msg.requestRef,
                                  extractedData: msg.extractedData,
                                  conversation_id: activeChat,
                                  submitted_at: new Date().toISOString()
                                };

                                const result = await createRequest(
                                  'break_the_price',
                                  requestData,
                                  user?.id
                                );

                                if (result.success) {
                                  setToast({ message: 'Request sent! We\'ll get back to you within 12 hours.', type: 'success' });
                                  setChatHistory(prev => prev.map(c =>
                                    c.id === activeChat
                                      ? {
                                          ...c,
                                          messages: [...c.messages, {
                                            role: 'assistant',
                                            content: `Your Break the Price request has been confirmed and sent to our team.\n\n**Reference:** #${msg.requestRef}\n\nWe'll analyze your quote and get back to you with a better price within 12 hours. You can track this request in your AI Requests.`
                                          }]
                                        }
                                      : c
                                  ));
                                }
                              } catch (error) {
                                console.error('Error confirming break the price:', error);
                                setToast({ message: 'Failed to send request. Please try again.', type: 'error' });
                              }
                            }}
                            className="w-full px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <Send size={18} />
                            Send Request
                          </button>
                          <button
                            onClick={() => {
                              setChatHistory(prev => prev.map(c =>
                                c.id === activeChat
                                  ? {
                                      ...c,
                                      messages: [...c.messages, {
                                        role: 'assistant',
                                        content: `No problem! Please tell me what needs to be corrected in the extracted data, and I'll update it before sending the request.`
                                      }]
                                    }
                                  : c
                              ));
                            }}
                            className="w-full px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <Edit2 size={16} />
                            Something's not right - Let me correct it
                          </button>
                        </div>
                      </div>
                    )}
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
                  setShowPaymentModal(true);
                }}
              />
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. INPUT - STICKY AT BOTTOM - Less padding on mobile */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4">
        <div className="max-w-3xl mx-auto">
          {/* Chat Limit Reached (Free users - no more chats) */}
          {chatLimitReached ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500">
                  Chat limit reached. Upgrade to continue.
                </p>
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="px-4 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  Upgrade
                </button>
              </div>
            </div>
          ) : messageLimitReached ? (
          /* Message Limit Reached (20 messages per chat) */
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500">
                  Message limit reached.{cartItems.length > 0 && ` ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in cart.`}
                </p>
                <div className="flex items-center gap-2">
                  {cartItems.length > 0 ? (
                    <>
                      <button
                        onClick={() => setShowCartSidebar(true)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 transition-colors whitespace-nowrap"
                      >
                        Cart ({cartItems.length})
                      </button>
                      <button
                        onClick={() => setShowRequestForm(true)}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                      >
                        Send
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowRequestForm(true)}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                      >
                        Send Request
                      </button>
                      <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200 transition-colors border border-gray-200 whitespace-nowrap"
                      >
                        Upgrade
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Normal Input */
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
              {/* Break the Price Button - Left side of input */}
              <button
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
              </button>

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

              {/* Message counter - hide for Elite (unlimited) */}
              {messageCount > 0 && !userSubscriptionLimits?.unlimited_messages && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  messageCount >= MAX_MESSAGES_PER_CHAT - 3
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {messageCount}/{MAX_MESSAGES_PER_CHAT}
                </span>
              )}

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
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl z-50 animate-fade-in-right flex flex-col max-h-screen overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Cart ({cartItems.length})</h3>
                <button onClick={() => setShowCartSidebar(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              {/* Add Extra Button - only show when cart has items */}
              {cartItems.length > 0 && (
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
              )}
            </div>

            {/* Inline Extras Form - shown inside cart dropdown, only when cart has items */}
            {showInlineExtras && cartItems.length > 0 && (
              <div className="border-b border-gray-200 bg-gray-50 p-3 flex-shrink-0 max-h-[40vh] overflow-y-auto">
                {!selectedExtraCategory ? (
                  <>
                    <p className="text-xs text-gray-500 mb-2">Select a category</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'wine', icon: '🍷', label: 'Wine' },
                        { id: 'champagne', icon: '🍾', label: 'Champagne' },
                        { id: 'cigars', icon: '🚬', label: 'Cigars' },
                        { id: 'caviar', icon: '🥄', label: 'Caviar' },
                        { id: 'flowers', icon: '💐', label: 'Flowers' },
                        { id: 'cake', icon: '🎂', label: 'Cakes' },
                        { id: 'decorations', icon: '🎈', label: 'Decor' },
                        { id: 'music', icon: '🎵', label: 'Music' },
                        { id: 'photography', icon: '📸', label: 'Photo' },
                        { id: 'catering', icon: '🍽️', label: 'Catering' },
                        { id: 'spirits', icon: '🥃', label: 'Spirits' },
                        { id: 'other', icon: '✨', label: 'Other' }
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
                      Back
                    </button>
                    {/* Quick suggestions */}
                    <div className="flex flex-wrap gap-1">
                      {(selectedExtraCategory === 'wine' ? ['Dom Pérignon', 'Château Margaux', 'Opus One'] :
                        selectedExtraCategory === 'champagne' ? ['Moët', 'Veuve Clicquot', 'Krug'] :
                        selectedExtraCategory === 'cigars' ? ['Cohiba Behike', 'Montecristo', 'Davidoff'] :
                        selectedExtraCategory === 'caviar' ? ['Beluga', 'Oscietra', 'Sevruga'] :
                        selectedExtraCategory === 'flowers' ? ['Red Roses', 'Orchids', 'Mixed'] :
                        selectedExtraCategory === 'catering' ? ['Vegan', 'Halal', 'Kosher'] :
                        ['Custom Request']
                      ).map(item => (
                        <button
                          key={item}
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, name: item }))}
                          className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${
                            customExtraForm.name === item
                              ? 'bg-gray-900 text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    {/* Name input */}
                    <input
                      type="text"
                      value={customExtraForm.name}
                      onChange={(e) => setCustomExtraForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={`Enter ${selectedExtraCategory} name...`}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                    />
                    {/* Quantity & Add */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-xs"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-medium w-5 text-center">{customExtraForm.quantity}</span>
                        <button
                          onClick={() => setCustomExtraForm(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-xs"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          if (!customExtraForm.name.trim()) return;
                          const defaultPrices = { wine: 150, champagne: 120, spirits: 200, caviar: 300, cigars: 500, flowers: 150, cake: 200, decorations: 300, music: 500, photography: 800, catering: 100, other: 100 };
                          const unitPrice = defaultPrices[selectedExtraCategory] || 100;
                          const totalPrice = unitPrice * customExtraForm.quantity;
                          const newExtra = {
                            id: `extra-${Date.now()}`,
                            cartId: `extra-${Date.now()}`,
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
                            addedAt: new Date().toISOString()
                          };
                          setCartItems(prev => [...prev, newExtra]);
                          setShowInlineExtras(false);
                          setSelectedExtraCategory(null);
                          setCustomExtraForm({ name: '', category: '', quantity: 1, notes: '' });
                          setToast({ message: `Added ${customExtraForm.name} to cart`, type: 'cart' });
                        }}
                        disabled={!customExtraForm.name.trim()}
                        className="flex-1 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus size={12} />
                        Add (~${(({ wine: 150, champagne: 120, spirits: 200, caviar: 300, cigars: 500, flowers: 150, cake: 200, decorations: 300, music: 500, photography: 800, catering: 100, other: 100 }[selectedExtraCategory] || 100) * customExtraForm.quantity).toLocaleString()})
                      </button>
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
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {cartItems.map((item, idx) => {
                    const isEmptyLeg = item.type === 'empty_legs' || item.type === 'emptyleg';
                    const isAdventure = item.type === 'adventure' || item.type === 'fixed_offer';
                    const isTransfer = item.type === 'taxi' || item.type === 'transfer' || item.type === 'ground_transport';
                    const isJet = item.type === 'jets' || item.type === 'jet';
                    const isHelicopter = item.type === 'helicopters' || item.type === 'helicopter';
                    const isYacht = item.type === 'yachts' || item.type === 'yacht';
                    const isLuxuryCar = item.type === 'luxury_cars' || item.type === 'luxury_car';
                    const isCustomExtra = item.type === 'custom_extra';
                    const canDirectCheckout = isEmptyLeg || isAdventure;
                    const hasAirportFee = item.airportPickupFee && item.airportPickupFee > 0;

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
                    return (
                      <div key={idx} className="bg-gray-50 rounded-xl border border-gray-200 animate-fade-in hover:border-gray-300 transition-all duration-300 overflow-hidden">
                        {/* Collapsible Header - click to expand */}
                        <div
                          className="p-3 flex items-center gap-3 cursor-pointer"
                          onClick={() => setExpandedCartItems(prev => ({ ...prev, [item.cartId || idx]: !prev[item.cartId || idx] }))}
                        >
                          {/* Type badge & name */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                isJet ? 'bg-gray-800 text-white' :
                                isHelicopter ? 'bg-gray-700 text-white' :
                                isYacht ? 'bg-gray-600 text-white' :
                                isLuxuryCar ? 'bg-gray-900 text-white' :
                                isEmptyLeg ? 'bg-gray-800 text-white' :
                                isTransfer ? 'bg-gray-400 text-white' :
                                isAdventure ? 'bg-gray-800 text-white' :
                                'bg-gray-300 text-gray-700'
                              }`}>
                                {isJet ? 'CHARTER' : isHelicopter ? 'HELI' : isYacht ? 'YACHT' : isLuxuryCar ? 'SUPERCAR' : isEmptyLeg ? 'EMPTY LEG' : isTransfer ? 'TRANSFER' : isAdventure ? 'EXPERIENCE' : 'SERVICE'}
                              </span>
                              {isEmptyLeg && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-gray-200 text-gray-700">CRYPTO PAY</span>
                              )}
                              {(isJet || isHelicopter) && !isEmptyLeg && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-gray-200 text-gray-600">AI REQUEST</span>
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
                          </div>
                          {/* Price & expand icon */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">
                                {item.isEstimate ? '~' : ''}${(item.price || item.basePrice || item.price_usd || 0).toLocaleString()}
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

                            {/* Jet/Heli Details */}
                            {(isJet || isHelicopter) && (
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
                                  {item.hourly_rate_eur && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">💰</span>
                                      <span>${item.hourly_rate_eur.toLocaleString()}/hr</span>
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

                                {/* Multi-Stop Flight Section */}
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-gray-700">Multi-Stop Route</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMultiStopForm(true);
                                        setMultiStopItemId(item.cartId);
                                      }}
                                      className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors flex items-center gap-1"
                                    >
                                      <Plus size={10} />
                                      Add Stop
                                    </button>
                                  </div>

                                  {/* Current Route Display */}
                                  <div className="space-y-1.5">
                                    {/* Origin - Clickable */}
                                    <div
                                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-200 border border-transparent transition-colors group"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingEndpoint('origin');
                                        setEditEndpointItemId(item.cartId);
                                        setStopSearchQuery('');
                                        setStopSearchResults([]);
                                      }}
                                    >
                                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-500">Departure</p>
                                        <p className="text-xs font-medium text-gray-900 truncate">{item.from || item.origin || item.from_city}</p>
                                      </div>
                                      <Edit2 size={12} className="text-gray-400 group-hover:text-green-600 transition-colors" />
                                    </div>

                                    {/* Stops */}
                                    {item.stops && item.stops.length > 0 && item.stops.map((stop, stopIdx) => (
                                      <div key={stopIdx} className="space-y-1">
                                        {/* Leg info */}
                                        {item.legs && item.legs[stopIdx] && (
                                          <div className="flex items-center justify-center gap-2 py-1">
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                            <span className="text-[9px] text-gray-400 px-1">
                                              {item.legs[stopIdx].distance} km • {formatDuration(item.legs[stopIdx].flightTime)}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                          </div>
                                        )}
                                        {/* Stop card */}
                                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                                          <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-blue-600">Stop {stopIdx + 1}</p>
                                            <p className="text-xs font-medium text-gray-900 truncate">{stop.name || stop.city}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-[9px] text-gray-500">Stay:</span>
                                              <select
                                                value={stop.stopDuration || 60}
                                                onChange={(e) => {
                                                  e.stopPropagation();
                                                  updateStopDuration(item.cartId, stopIdx, parseInt(e.target.value));
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[9px] bg-white border border-gray-200 rounded px-1 py-0.5"
                                              >
                                                <option value={30}>30 min</option>
                                                <option value={60}>1 hour</option>
                                                <option value={120}>2 hours</option>
                                                <option value={180}>3 hours</option>
                                                <option value={240}>4 hours</option>
                                                <option value={480}>8 hours</option>
                                                <option value={1440}>1 day</option>
                                              </select>
                                              {item.legs && item.legs[stopIdx] && (
                                                <span className="text-[9px] text-gray-400 ml-1">
                                                  Depart: {item.legs[stopIdx + 1]?.departureTime || '--:--'}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeStopFromCartItem(item.cartId, stopIdx);
                                            }}
                                            className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded transition-colors"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}

                                    {/* Final leg info */}
                                    {item.legs && item.legs.length > 0 && (
                                      <div className="flex items-center justify-center gap-2 py-1">
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                        <span className="text-[9px] text-gray-400 px-1">
                                          {item.legs[item.legs.length - 1].distance} km • {formatDuration(item.legs[item.legs.length - 1].flightTime)}
                                        </span>
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                      </div>
                                    )}

                                    {/* Destination - Clickable */}
                                    <div
                                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-red-50 hover:border-red-200 border border-transparent transition-colors group"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingEndpoint('destination');
                                        setEditEndpointItemId(item.cartId);
                                        setStopSearchQuery('');
                                        setStopSearchResults([]);
                                      }}
                                    >
                                      <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-500">Arrival</p>
                                        <p className="text-xs font-medium text-gray-900 truncate">{item.to || item.destination || item.to_city}</p>
                                      </div>
                                      <Edit2 size={12} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                                    </div>
                                  </div>

                                  {/* Multi-stop summary */}
                                  {item.isMultiStop && item.legs && (
                                    <div className="mt-3 p-2 bg-gray-100 rounded-lg">
                                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div>
                                          <span className="text-gray-500">Total Distance:</span>
                                          <span className="ml-1 font-medium text-gray-900">{item.totalDistance?.toLocaleString()} km</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Flight Time:</span>
                                          <span className="ml-1 font-medium text-gray-900">{item.estimatedDuration}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Stops:</span>
                                          <span className="ml-1 font-medium text-gray-900">{item.stops?.length || 0}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Billed:</span>
                                          <span className="ml-1 font-medium text-gray-900">{item.billedHours}h</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
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
                                  {item.daily_rate_eur && (
                                    <div className="flex items-center gap-1.5 col-span-2">
                                      <span className="text-gray-400">💰</span>
                                      <span>${item.daily_rate_eur.toLocaleString()}/day</span>
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
                                  {item.daily_rate_eur && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">💰</span>
                                      <span>${item.daily_rate_eur.toLocaleString()}/day</span>
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
                                          setCartItems(prev => prev.map((ci, i) =>
                                            (ci.cartId === item.cartId || i === idx)
                                              ? { ...ci, rentalDays: days, price: (ci.daily_rate_eur || ci.price) * days }
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
                                          setCartItems(prev => prev.map((ci, i) =>
                                            (ci.cartId === item.cartId || i === idx)
                                              ? { ...ci, rentalDays: days, price: (ci.daily_rate_eur || ci.price) * days }
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
                               item.isEstimate ? 'Base price (est.)' : 'Base price'}
                            </span>
                            <span className="text-gray-700">
                              {item.isEstimate && isCustomExtra ? '~' : ''}${(item.basePrice || item.price_usd || item.price || 0).toLocaleString()}
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
                              {item.isEstimate ? '~' : ''}${((item.totalWithFee || item.price_usd || item.price || 0) + (item.cateringPrice || 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cart Total & Actions */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white">
                  {/* Subtotal breakdown */}
                  {(() => {
                    const mainServices = cartItems.filter(item => item.type !== 'custom_extra');
                    const customExtras = cartItems.filter(item => item.type === 'custom_extra');
                    const servicesSubtotal = mainServices.reduce((sum, item) => sum + (item.basePrice || item.price_usd || item.price || 0), 0);
                    const extrasSubtotal = customExtras.reduce((sum, item) => sum + (item.basePrice || item.price_usd || item.price || 0), 0);
                    const airportFees = cartItems.reduce((sum, item) => sum + (item.airportPickupFee || 0), 0);
                    const cateringTotal = cartItems.reduce((sum, item) => sum + (item.cateringPrice || 0), 0);
                    const subtotalBeforeVAT = servicesSubtotal + extrasSubtotal + cateringTotal + airportFees;
                    // Always calculate 8.1% VAT
                    const vatAmount = subtotalBeforeVAT * 0.081;
                    const grandTotal = subtotalBeforeVAT + vatAmount;
                    const hasEstimates = cartItems.some(item => item.isEstimate);
                    const hasCustomExtras = customExtras.length > 0;

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
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Services</span>
                          <span className="text-gray-700">{hasEstimates ? '~' : ''}${servicesSubtotal.toLocaleString()}</span>
                        </div>
                        {extrasSubtotal > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Custom extras</span>
                            <span className="text-gray-600">~${extrasSubtotal.toLocaleString()}</span>
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
                        {/* Always show VAT 8.1% */}
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">VAT (8.1%)</span>
                          <span className="text-gray-600">{hasEstimates ? '~' : ''}+${vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">{hasEstimates ? 'Est. Total' : 'Total'}</span>
                          <span className="text-lg font-bold text-gray-900">{hasEstimates ? '~' : ''}${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

                  {/* Smart checkout: split payable vs request-only items */}
                  {(() => {
                    const payableTypes = ['empty_legs', 'emptyleg', 'adventure', 'fixed_offer'];
                    const payableItems = cartItems.filter(item => payableTypes.includes(item.type));
                    const requestOnlyItems = cartItems.filter(item => !payableTypes.includes(item.type));
                    const allPayable = requestOnlyItems.length === 0 && payableItems.length > 0;
                    const allRequestOnly = payableItems.length === 0;
                    const hasMixedCart = payableItems.length > 0 && requestOnlyItems.length > 0;

                    // Calculate totals with 8.1% VAT
                    const payableSubtotal = payableItems.reduce((sum, item) => sum + (item.price_usd || item.price || item.basePrice || 0), 0);
                    const payableVAT = payableSubtotal * 0.081;
                    const payableTotal = payableSubtotal + payableVAT;

                    const requestSubtotal = requestOnlyItems.reduce((sum, item) => sum + (item.price_usd || item.price || item.basePrice || 0), 0);
                    const requestVAT = requestSubtotal * 0.081;
                    const requestTotal = requestSubtotal + requestVAT;

                    // Helper function to save booking to database (for tracking purposes)
                    const saveBookingToDatabase = async (item, status = 'pending') => {
                      if (!user?.id) return null;
                      try {
                        const bookingData = {
                          user_id: user.id,
                          service_id: item.original_id || item.id,
                          service_type: item.type === 'empty_legs' || item.type === 'emptyleg' ? 'empty_leg' :
                                        item.type === 'adventure' || item.type === 'fixed_offer' ? 'adventure_package' : 'charter',
                          booking_type: item.type === 'empty_legs' || item.type === 'emptyleg' ? 'empty_leg' :
                                        item.type === 'adventure' || item.type === 'fixed_offer' ? 'adventure_package' : 'charter',
                          service_title: item.name || item.title || `${item.origin || item.from} → ${item.destination || item.to}`,
                          origin: item.origin || item.from || item.departure_airport,
                          destination: item.destination || item.to || item.arrival_airport,
                          departure_date: item.departure_date || item.date,
                          passengers: item.passengers || item.pax || item.max_passengers,
                          base_amount: item.price_usd || item.price || item.basePrice || 0,
                          vat_amount: (item.price_usd || item.price || item.basePrice || 0) * 0.081,
                          total_amount: (item.price_usd || item.price || item.basePrice || 0) * 1.081,
                          currency: item.currency || 'EUR',
                          payment_status: status,
                          service_details: item,
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
                    const saveToAIRequests = async (item) => {
                      if (!user?.id) return null;
                      try {
                        const { data, error } = await supabase
                          .from('user_requests')
                          .insert([{
                            user_id: user.id,
                            type: item.type === 'empty_legs' || item.type === 'emptyleg' ? 'empty_leg' :
                                  item.type === 'adventure' || item.type === 'fixed_offer' ? 'fixed_offer' : 'booking',
                            status: 'pending',
                            client_email: user.email,
                            data: {
                              source: 'ai_chat_checkout',
                              item_type: item.type,
                              name: item.name || item.title,
                              route: `${item.origin || item.from || ''} → ${item.destination || item.to || ''}`,
                              date: item.departure_date || item.date,
                              passengers: item.passengers || item.pax,
                              base_price: item.price_usd || item.price || item.basePrice || 0,
                              vat_8_1_percent: (item.price_usd || item.price || item.basePrice || 0) * 0.081,
                              total_with_vat: (item.price_usd || item.price || item.basePrice || 0) * 1.081,
                              currency: item.currency || 'EUR',
                              conversation_id: activeChat,
                              awaiting_payment: true
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

                    if (allPayable) {
                      // All items can be paid directly - process first item
                      const firstPayableItem = payableItems[0];
                      return (
                        <div className="space-y-2">
                          {/* Show pay now breakdown */}
                          <div className="bg-gray-100 rounded-lg p-3 mb-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Subtotal</span>
                              <span>${payableSubtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>VAT (8.1%)</span>
                              <span>${payableVAT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-300">
                              <span>To Pay Now</span>
                              <span>${payableTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              // Edge Function creates the booking - no need to pre-save
                              // Just track in AI requests for conversation history
                              await saveToAIRequests(firstPayableItem);

                              setShowCartSidebar(false);
                              setSelectedPaymentItem({
                                ...firstPayableItem,
                                price: payableSubtotal,
                                price_with_vat: payableTotal,
                                vat_amount: payableVAT
                              });
                              setShowCryptoPayment(true);
                            }}
                            className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                          >
                            <Wallet size={18} />
                            Pay ${payableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} with Crypto
                          </button>
                        </div>
                      );
                    } else if (allRequestOnly) {
                      // All items need to be requested
                      return (
                        <button
                          onClick={() => {
                            setShowCartSidebar(false);
                            setShowRequestForm(true);
                          }}
                          className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300"
                        >
                          Send Request
                        </button>
                      );
                    } else {
                      // Mixed cart: some payable, some request-only
                      return (
                        <div className="space-y-2">
                          {/* Pay now section */}
                          <div className="bg-gray-100 rounded-lg p-3 mb-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                              <span className="text-xs font-semibold text-gray-800">Pay Now (Direct Booking)</span>
                            </div>
                            <div className="text-[10px] text-gray-600 pl-4 mb-2">
                              {payableItems.map(i => i.name || i.title).join(', ')}
                            </div>
                            <div className="pl-4 space-y-1 text-[10px]">
                              <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${payableSubtotal.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>VAT (8.1%)</span>
                                <span>${payableVAT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-300">
                                <span>To Pay</span>
                                <span>${payableTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Request section */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <span className="text-xs font-semibold text-gray-700">On Request (Quote Required)</span>
                            </div>
                            <div className="text-[10px] text-gray-600 pl-4 mb-2">
                              {requestOnlyItems.map(i => i.name || i.title || i.aircraft_type).join(', ')}
                            </div>
                            <div className="pl-4 space-y-1 text-[10px]">
                              <div className="flex justify-between text-gray-600">
                                <span>Est. Subtotal</span>
                                <span>~${requestSubtotal.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>Est. VAT (8.1%)</span>
                                <span>~${requestVAT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between font-bold text-gray-700 pt-1 border-t border-gray-200">
                                <span>Est. Total</span>
                                <span>~${requestTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              // Edge Function creates the booking - no need to pre-save
                              // Just track in AI requests for conversation history
                              const firstPayableItem = payableItems[0];
                              await saveToAIRequests(firstPayableItem);

                              // Then, create request for request-only items
                              try {
                                if (user?.id) {
                                  const requestData = {
                                    source: 'ai_chat_mixed_cart',
                                    request_id: `AI-MIX-${Date.now()}`,
                                    items: requestOnlyItems.map(item => ({
                                      ...item,
                                      type: item.type,
                                      name: item.name || item.title || item.aircraft_type || item.model,
                                      base_price: item.price || item.basePrice || item.price_usd,
                                      vat_8_1_percent: (item.price || item.basePrice || item.price_usd || 0) * 0.081,
                                      total_with_vat: (item.price || item.basePrice || item.price_usd || 0) * 1.081,
                                      from: item.from || item.from_city || item.origin,
                                      to: item.to || item.to_city || item.destination,
                                      date: item.date || item.departure_date,
                                      passengers: item.passengers || item.pax,
                                    })),
                                    summary: {
                                      total_items: requestOnlyItems.length,
                                      subtotal: requestSubtotal,
                                      vat_8_1_percent: requestVAT,
                                      grand_total_with_vat: requestTotal,
                                      note: 'Auto-created from mixed cart - user paid for other items'
                                    },
                                    paid_items_reference: payableItems.map(i => i.name || i.title).join(', '),
                                    created_via: 'sphera_ai_mixed_cart',
                                    conversation_id: activeChat
                                  };

                                  await supabase
                                    .from('user_requests')
                                    .insert([{
                                      user_id: user.id,
                                      type: 'ai_chat_bulk',
                                      status: 'pending',
                                      client_email: user.email,
                                      data: requestData
                                    }]);
                                }
                              } catch (err) {
                                console.error('Error creating request for mixed cart:', err);
                              }

                              // Then open payment for first payable item
                              setShowCartSidebar(false);
                              setSelectedPaymentItem({
                                ...firstPayableItem,
                                price: payableSubtotal,
                                price_with_vat: payableTotal,
                                vat_amount: payableVAT
                              });
                              setShowCryptoPayment(true);
                            }}
                            className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                          >
                            <Wallet size={18} />
                            Pay ${payableTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} & Send Request
                          </button>
                          <button
                            onClick={() => {
                              setShowCartSidebar(false);
                              setShowRequestForm(true);
                            }}
                            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-all duration-300 text-sm"
                          >
                            Send All as Request Instead
                          </button>
                        </div>
                      );
                    }
                  })()}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Multi-Stop Airport Search Modal */}
      {showMultiStopForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] animate-fade-in" onClick={() => {
            setShowMultiStopForm(false);
            setMultiStopItemId(null);
            setStopSearchQuery('');
            setStopSearchResults([]);
          }} />
          <div className="fixed inset-0 flex items-center justify-center z-[61] p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 animate-scale-in max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold">Add Stop</h3>
                <button
                  onClick={() => {
                    setShowMultiStopForm(false);
                    setMultiStopItemId(null);
                    setStopSearchQuery('');
                    setStopSearchResults([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-3 flex-shrink-0">
                <input
                  type="text"
                  value={stopSearchQuery}
                  onChange={(e) => {
                    setStopSearchQuery(e.target.value);
                    searchStopAirports(e.target.value);
                  }}
                  placeholder="Search city or airport..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  autoFocus
                />
                {isSearchingStops && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {stopSearchResults.length > 0 ? (
                  <div className="space-y-1">
                    {stopSearchResults.map((airport, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          addStopToCartItem(multiStopItemId, {
                            name: airport.city || airport.name,
                            code: airport.iata || airport.code,
                            city: airport.city,
                            country: airport.country,
                            lat: airport.lat || airport.latitude,
                            lng: airport.lng || airport.lon || airport.longitude
                          }, 60);
                        }}
                        className="w-full p-3 text-left hover:bg-gray-100 rounded-lg transition-colors flex items-start gap-3"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Plane size={16} className="text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{airport.city || airport.name}</span>
                            {airport.iata && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded font-medium">{airport.iata}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{airport.name || airport.airport}</p>
                          <p className="text-[10px] text-gray-400">{airport.country}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : stopSearchQuery.length >= 2 && !isSearchingStops ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No airports found</p>
                    <p className="text-xs text-gray-400">Try a different search term</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Plane size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Search for a city or airport</p>
                    <p className="text-xs text-gray-400">Type at least 2 characters</p>
                  </div>
                )}
              </div>

              {/* Info footer */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex-shrink-0">
                <p className="text-[10px] text-gray-500 text-center">
                  Stops allow you to make intermediate landings. Each stop adds to the total flight time and cost.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Origin/Destination Modal */}
      {editingEndpoint && editEndpointItemId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] animate-fade-in" onClick={() => {
            setEditingEndpoint(null);
            setEditEndpointItemId(null);
            setStopSearchQuery('');
            setStopSearchResults([]);
          }} />
          <div className="fixed inset-0 flex items-center justify-center z-[61] p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 animate-scale-in max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold">
                  {editingEndpoint === 'origin' ? 'Change Departure' : 'Change Arrival'}
                </h3>
                <button
                  onClick={() => {
                    setEditingEndpoint(null);
                    setEditEndpointItemId(null);
                    setStopSearchQuery('');
                    setStopSearchResults([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-3 flex-shrink-0">
                <input
                  type="text"
                  value={stopSearchQuery}
                  onChange={(e) => {
                    setStopSearchQuery(e.target.value);
                    searchStopAirports(e.target.value);
                  }}
                  placeholder="Search city or airport..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  autoFocus
                />
                {isSearchingStops && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {stopSearchResults.length > 0 ? (
                  <div className="space-y-1">
                    {stopSearchResults.map((airport, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          updateCartItemEndpoint(editEndpointItemId, editingEndpoint, {
                            name: airport.city || airport.name,
                            code: airport.iata || airport.code,
                            city: airport.city,
                            country: airport.country,
                            lat: airport.lat || airport.latitude,
                            lng: airport.lng || airport.lon || airport.longitude
                          });
                          setEditingEndpoint(null);
                          setEditEndpointItemId(null);
                          setStopSearchQuery('');
                          setStopSearchResults([]);
                        }}
                        className="w-full p-3 text-left hover:bg-gray-100 rounded-lg transition-colors flex items-start gap-3"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          editingEndpoint === 'origin' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Plane size={16} className={editingEndpoint === 'origin' ? 'text-green-600' : 'text-red-600'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{airport.city || airport.name}</span>
                            {airport.iata && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded font-medium">{airport.iata}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{airport.name || airport.airport}</p>
                          <p className="text-[10px] text-gray-400">{airport.country}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : stopSearchQuery.length >= 2 && !isSearchingStops ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No airports found</p>
                    <p className="text-xs text-gray-400">Try a different search term</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Plane size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Search for a city or airport</p>
                    <p className="text-xs text-gray-400">Type at least 2 characters</p>
                  </div>
                )}
              </div>

              {/* Info footer */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex-shrink-0">
                <p className="text-[10px] text-gray-500 text-center">
                  Changing the {editingEndpoint === 'origin' ? 'departure' : 'arrival'} will recalculate distance, flight time, and price.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={() => setShowRequestForm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Send Booking Request</h3>
                <button onClick={() => setShowRequestForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  You're about to send a booking request for {cartItems.length} item(s). Our team will contact you within 2-4 hours.
                </p>

                <div className="border-t border-b border-gray-200 py-4">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm mb-2">
                      <span>{item.name || item.title || item.aircraft_type}</span>
                      <span className="font-medium">${item.price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={async () => {
                    try {
                      setIsProcessing(true);

                      // Calculate totals
                      const mainServices = cartItems.filter(item => item.type !== 'custom_extra');
                      const customExtras = cartItems.filter(item => item.type === 'custom_extra');
                      const servicesSubtotal = mainServices.reduce((sum, item) => sum + (item.basePrice || item.price_usd || item.price || 0), 0);
                      const extrasSubtotal = customExtras.reduce((sum, item) => sum + (item.basePrice || item.price || 0), 0);
                      const cateringTotal = cartItems.reduce((sum, item) => sum + (item.cateringPrice || 0), 0);
                      const airportFees = cartItems.reduce((sum, item) => sum + (item.airportPickupFee || 0), 0);
                      const vatAmount = cartItems.reduce((sum, item) => sum + (item.vat || 0), 0);
                      const grandTotal = cartItems.reduce((sum, item) => sum + (item.totalWithFee || item.price_usd || item.price || 0) + (item.cateringPrice || 0), 0);

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
                          estimated_flight_time: item.estimated_flight_time || item.flightTime || item.estimatedDuration,
                          distance_km: item.distance_km || item.distanceKm || item.totalDistance,
                          billed_hours: item.billedHours,
                          // Multi-stop route info
                          is_multi_stop: item.isMultiStop || false,
                          stops: item.stops || [],
                          legs: item.legs || [],
                          total_distance_km: item.totalDistance,
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
                          has_custom_requests: customExtras.length > 0,
                          has_multi_stop_flights: cartItems.some(item => item.isMultiStop),
                          multi_stop_count: cartItems.filter(item => item.isMultiStop).length
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

                      // Trigger email notification via Supabase Edge Function
                      if (request?.id) {
                        try {
                          await supabase.functions.invoke('user-request-notifications', {
                            body: { record: { id: request.id } }
                          });
                          console.log('Email notification triggered for request:', request.id);
                        } catch (emailErr) {
                          console.error('Failed to send email notification:', emailErr);
                          // Don't block the flow if email fails
                        }
                      }

                      const confirmMsg = {
                        role: 'assistant',
                        content: `✅ **Booking Request Sent!**\n\nWe've received your request containing:\n• ${mainServices.length} service(s)${customExtras.length > 0 ? `\n• ${customExtras.length} custom extra(s) (availability TBC)` : ''}\n\n**Estimated Total:** ~$${grandTotal.toLocaleString()}\n\nOur team will review and contact you within 2-4 hours to confirm details and availability.`
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
      )}

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
        onClose={async () => {
          setShowSubscriptionModal(false);
          // Refresh profile when modal closes (in case webhook updated limits while modal was open)
          if (user?.id) {
            console.log('🔄 Modal closed - refreshing subscription profile...');
            await loadUserProfile();
          }
        }}
        currentTier={userProfile?.subscription_tier || 'explorer'}
        onUpgrade={async (tierId) => {
          // Handle Stripe checkout for subscription upgrade
          console.log('Upgrade to:', tierId);
          // After successful upgrade, reload profile
          await loadUserProfile();
        }}
      />

      {/* Break the Price Modal */}
      {showBreakThePrice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="text-gray-700" size={24} />
                    Break the Price
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Upload a competitor quote and we'll beat it</p>
                </div>
                <button
                  onClick={() => {
                    setShowBreakThePrice(false);
                    setBreakThePriceFile(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-800 mb-2">How it works:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-500">1.</span>
                    Upload a quote from another provider (PDF or image)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-500">2.</span>
                    Our team reviews and verifies the quote
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-500">3.</span>
                    We respond within 12 hours with a better price
                  </li>
                </ul>
                {userSubscriptionLimits?.tier !== 'elite' && (
                  <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                    Note: Using Break the Price costs 1 chat from your monthly allowance.
                  </p>
                )}
              </div>

              {/* File Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Competitor Quote
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    breakThePriceFile
                      ? 'border-gray-400 bg-gray-100'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-gray-500', 'bg-gray-100');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-gray-500', 'bg-gray-100');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-gray-500', 'bg-gray-100');
                    const file = e.dataTransfer.files[0];
                    if (file) setBreakThePriceFile(file);
                  }}
                >
                  {breakThePriceFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="text-gray-700" size={24} />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{breakThePriceFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(breakThePriceFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setBreakThePriceFile(null)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag and drop your quote here, or
                      </p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setBreakThePriceFile(file);
                          }}
                        />
                        <span className="text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer">
                          browse to upload
                        </span>
                      </label>
                      <p className="text-xs text-gray-400 mt-2">
                        Supports PDF, JPG, PNG, WebP (max 10MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBreakThePrice(false);
                    setBreakThePriceFile(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isUploadingQuote}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBreakThePriceUpload(breakThePriceFile)}
                  disabled={!breakThePriceFile || isUploadingQuote}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploadingQuote ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Submit Quote
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

                      // Send email notification to admin
                      try {
                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                        await fetch(`${supabaseUrl}/functions/v1/ai-chat-report-notifications`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseAnonKey}`,
                          },
                          body: JSON.stringify({
                            userId: user?.id,
                            userEmail: user?.email,
                            userName: user?.name || user?.full_name,
                            userPhone: user?.phone || userProfile?.phone,
                            chatId: currentChat?.id,
                            rating: reportIssueForm.rating,
                            message: reportIssueForm.message,
                            chatContext: JSON.stringify(currentChat?.messages?.slice(-5) || [])
                          })
                        });
                        console.log('Report email notification sent to admin');
                      } catch (emailErr) {
                        console.error('Failed to send report email (non-blocking):', emailErr);
                      }

                      setToast({ message: 'Report submitted. Thank you for your feedback!', type: 'success' });
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
            // Ensure price field is set correctly
            price: selectedPaymentItem.price_usd || selectedPaymentItem.price || selectedPaymentItem.discounted_price || 0,
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

            // Remove the paid item from cart
            setCartItems(prev => prev.filter(item => item.cartId !== selectedPaymentItem.cartId));

            setToast({ message: 'Payment initiated! Complete the payment on CoinGate.', type: 'success' });

            // Add confirmation message to chat
            const confirmMsg = {
              role: 'assistant',
              content: `🎉 Payment initiated for ${selectedPaymentItem.name || selectedPaymentItem.title || 'your booking'}!\n\nPlease complete the payment on CoinGate. Once confirmed:\n• You'll receive a confirmation email\n• Your booking will appear in "My Bookings"\n• You'll earn 1.5% PVCX rewards\n\nThank you for choosing Sphera World!`
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
                    ${item.price_eur?.toLocaleString() || item.hourly_rate_eur?.toLocaleString() || item.daily_rate_eur?.toLocaleString() || 'TBD'}
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

                  {/* Category Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'wine', icon: '🍷', label: 'Wine & Winery', price: '$150+' },
                      { id: 'champagne', icon: '🍾', label: 'Champagne', price: '$120+' },
                      { id: 'cigars', icon: '🚬', label: 'Cigars & Smoking', price: '$500+' },
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

                  {/* Quick Suggestions based on category */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Popular choices</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedExtraCategory === 'wine' && ['Dom Pérignon', 'Château Margaux', 'Opus One', 'Sassicaia', 'Winery Visit'].map(item => (
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
    </div>
  );
};

export default AIChat;