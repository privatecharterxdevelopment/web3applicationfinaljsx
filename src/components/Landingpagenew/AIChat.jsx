import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft, Mic, Send, X, Volume2, VolumeX, Edit2, Shield, Wallet, ShoppingCart, MessageSquare, Plus, Crown, AlertCircle, Calendar, Trash2, ChevronRight, Plane, Clock, Upload, FileText, DollarSign, Users, MapPin, Anchor, Mountain, Car
} from 'lucide-react';
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
import CryptoPaymentModal from '../CryptoPaymentModal';

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

// Toast notification component
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
        type === 'warning'
          ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
          : type === 'error'
          ? 'bg-red-50 border-red-200 text-red-900'
          : 'bg-gray-50 border-gray-200 text-gray-900'
      }`}>
        <AlertCircle size={20} className={
          type === 'warning' ? 'text-yellow-600' : type === 'error' ? 'text-red-600' : 'text-gray-600'
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
const AIChat = ({ user: userProp, initialQuery = '', onQueryProcessed = () => {} }) => {
  // Use auth context (returns null if not in AuthProvider)
  const authContext = useAuth();
  const user = userProp || authContext?.user || { name: 'Guest', id: null };
  const isAdmin = authContext?.isAdmin || false;

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

  const [chatHistory, setChatHistory] = useState([]);
  const [activeChat, setActiveChat] = useState('new');
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
  const [cartItems, setCartItems] = useState([]);
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

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (conversationalAI.isEligibleForNFTBenefit(item, userHasNFT, usedNFTBenefitThisYear)) {
        return sum;
      }
      return sum + (item.price || 0);
    }, 0);
  }, [cartItems, userHasNFT, usedNFTBenefitThisYear, conversationalAI]);

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

  // Handle initial query from search
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      // Create a new chat with the initial query
      const newChatId = Date.now().toString();
      const newChat = {
        id: newChatId,
        title: initialQuery.split(' ').slice(0, 5).join(' ') + '...',
        date: 'Just now',
        messages: []
      };

      // Add to chat history
      setChatHistory(prev => [newChat, ...prev]);
      setActiveChat(newChatId);

      // Send the message after a brief delay to ensure chat is set up
      setTimeout(() => {
        handleSendMessage(initialQuery);
        // Clear the initial query so it doesn't send again
        onQueryProcessed();
      }, 100);
    }
  }, [initialQuery]); // Only run when initialQuery changes

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
    const cartItem = {
      ...item,
      cartId: Date.now(),
      addedAt: new Date().toISOString()
    };
    setCartItems(prev => [...prev, cartItem]);
    
    const isFree = conversationalAI.isEligibleForNFTBenefit(item, userHasNFT, usedNFTBenefitThisYear);
    
    let msg = `Added ${item.name || item.title}`;
    if (isFree) msg += ` (FREE with NFT!)`;
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

Then ask the user to confirm if the extracted data is correct, and explain that if confirmed, our team will find them a better price within 12 hours.`;

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
      const toType = () => {
        if (types.size > 1) return 'booking';
        const only = Array.from(types)[0];
        if (only === 'empty_legs') return 'empty_leg';
        if (only === 'jets' || only === 'aircraft') return 'private_jet_charter';
        if (only === 'helicopters') return 'helicopter_charter';
        if (only === 'luxury_cars' || only === 'cars') return 'luxury_car_rental';
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

    let msg = `Request submitted!\n\nReference: ${request.id}\nTotal: €${cartTotal.toLocaleString()}\n\nOur team will respond within 2-4 hours.`;
    
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
              'Price': adv.price_eur ? `€${adv.price_eur.toLocaleString()}` : '—',
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
            const price = item.price ? `€${item.price}${item.priceUnit || '/hr'}` : 'Price on request';
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
          const price = topResult.price ? `€${topResult.price}${topResult.priceUnit || '/hr'}` : '';
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
  const handleSendMessage = async (message) => {
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

      // Check if user can start a new chat (subscription limit)
      if (!isAdmin) {
        try {
          const { canStart, chatsUsed, chatsLimit } = await subscriptionService.canStartNewChat(user.id);
          if (!canStart) {
            setChatLimitReached(true);
            setToast({
              message: `You've used your free chat. Upgrade to continue booking luxury travel.`,
              type: 'warning'
            });
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

          // Increment chat usage count for subscription tracking
          if (!isAdmin) {
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
      // Regular message in existing chat
      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, userMessage] }
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
                content: `Ready to add this custom item:\n\n🍷 **${toolResult.cartItem.name}**\n📦 Category: ${toolResult.cartItem.category}\n💰 Est. Price: €${(toolResult.cartItem.price || 0).toLocaleString()}\n${toolResult.cartItem.quantity > 1 ? `📊 Quantity: ${toolResult.cartItem.quantity}\n` : ''}\nChoose how you'd like to proceed:`,
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
        msg += `- USDT/USDC: €${cartTotal.toLocaleString()}\n`;
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
        contextMessage += `\n\nItems in cart: ${cartItems.map(item => item.name || item.title).join(', ')} (Total: €${cartTotal.toLocaleString()})`;
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

  // NEW CHAT VIEW - Monochromatic service bubbles
  if (activeChat === 'new') {
    console.log('🎨 Rendering: NEW CHAT VIEW (monochromatic service bubbles)');

    const services = [
      // RWS Services
      {
        id: 'private-jets',
        title: 'Private Jets',
        description: 'Charter private jets worldwide',
        prompt: 'I need help booking a private jet'
      },
      {
        id: 'helicopters',
        title: 'Helicopters',
        description: 'Helicopter charter services',
        prompt: 'I want to charter a helicopter'
      },
      {
        id: 'yachts',
        title: 'Luxury Yachts',
        description: 'Charter exclusive yachts',
        prompt: 'I want to charter a yacht'
      },
      {
        id: 'luxury-cars',
        title: 'Luxury Cars',
        description: 'Premium chauffeur services',
        prompt: 'I need a luxury car service'
      },
      {
        id: 'ground-transport',
        title: 'Ground Transport',
        description: 'VIP ground transportation',
        prompt: 'I need ground transportation'
      },
      {
        id: 'events',
        title: 'Events & Sports',
        description: 'VIP event experiences',
        prompt: 'I want to attend exclusive events'
      },
      {
        id: 'adventures',
        title: 'Adventures',
        description: 'Luxury experiences worldwide',
        prompt: 'Show me luxury adventure packages'
      },
      // Web3 Services
      {
        id: 'daos',
        title: 'DAOs',
        description: 'Create & manage DAOs',
        prompt: 'Tell me about DAO creation and management'
      },
      {
        id: 'escrow',
        title: 'Escrow',
        description: 'Multi-signature wallets',
        prompt: 'I want to create a Safe escrow account'
      },
      {
        id: 'marketplace',
        title: 'Marketplace',
        description: 'Trade tokenized assets',
        prompt: 'Show me the asset marketplace'
      },
      {
        id: 'p2p-trading',
        title: 'P2P Trading',
        description: 'Peer-to-peer trading',
        prompt: 'I want to trade peer-to-peer'
      },
      {
        id: 'swap',
        title: 'Token Swap',
        description: 'Exchange cryptocurrencies',
        prompt: 'Help me swap tokens'
      },
      {
        id: 'nft-marketplace',
        title: 'NFT Marketplace',
        description: 'Buy & sell NFTs',
        prompt: 'Show me the NFT marketplace'
      },
      {
        id: 'launchpad',
        title: 'Launchpad',
        description: 'Token launches & waitlists',
        prompt: 'Tell me about upcoming token launches'
      },
      {
        id: 'tokenization',
        title: 'Asset Tokenization',
        description: 'Tokenize real-world assets',
        prompt: 'How does asset tokenization work?'
      },
      {
        id: 'general',
        title: 'General Help',
        description: 'Ask me anything',
        prompt: 'I have a general question'
      }
    ];

    return (
      <div className="h-full bg-transparent flex flex-col overflow-hidden">
        {/* Simple Header */}
        <div className="flex-shrink-0 px-8 py-8 text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-2">Choose a Service</h2>
          <p className="text-sm text-gray-500">Select a service to start your conversation</p>
        </div>

        {/* Monochromatic Service Bubbles */}
        <div className="flex-1 overflow-y-auto px-8 pb-6">
          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <button
                key={service.id}
                onClick={async () => {
                  // Create chat immediately and switch to it
                  const chatId = `chat-${Date.now()}`;
                  const userMessage = { role: 'user', content: service.prompt };
                  const loadingMsg = { role: 'assistant', content: '...', isLoading: true };

                  const newChat = {
                    id: chatId,
                    title: service.title,
                    date: 'Just now',
                    messages: [userMessage, loadingMsg]
                  };

                  setChatHistory(prev => [newChat, ...prev]);
                  setActiveChat(chatId);

                  // Send the message to AI after switching
                  setTimeout(() => {
                    handleSendMessage(service.prompt);
                  }, 100);
                }}
                className="group relative"
                style={{
                  animation: `bubbleIn 0.5s ease-out ${index * 0.04}s both`
                }}
              >
                {/* Light Grey Bubble */}
                <div className="px-6 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 rounded-full transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      {service.title}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* FIXED INPUT - Floating bottom */}
        <div className="flex-shrink-0 px-6 pb-6">
          <div className="max-w-3xl mx-auto">
            {/* Chat Limit Reached (Free users - no more chats) */}
            {chatLimitReached ? (
              <div className="bg-white/90 backdrop-blur-xl border border-gray-300 rounded-xl p-4 shadow-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertCircle size={20} className="text-amber-500" />
                    <span className="font-medium text-gray-900">Chat Limit Reached</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    You've used your free chat. Upgrade to continue booking luxury travel.
                  </p>
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Crown size={18} />
                    Upgrade Now
                  </button>
                </div>
              </div>
            ) : messageLimitReached ? (
              /* Message Limit Reached (20 messages per chat) */
              <div className="bg-white/90 backdrop-blur-xl border border-gray-300 rounded-xl p-4 shadow-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MessageSquare size={20} className="text-blue-500" />
                    <span className="font-medium text-gray-900">Message Limit Reached</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    You've reached 20 messages for this conversation. Ready to send your request?
                  </p>
                  <div className="flex gap-3">
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
                  </div>
                </div>
              </div>
            ) : (
              /* Normal Input */
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-gray-300 rounded-xl px-3 py-2 focus-within:border-gray-400 transition-colors shadow-lg">
                {/* Voice input button hidden for now
                <button
                  onClick={toggleVoiceMode}
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                    isVoiceMode
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isVoiceMode ? 'Voice Mode Active - Click to Stop' : 'Click for Voice Mode'}
                >
                  {isVoiceMode ? <X size={16} /> : <Mic size={16} />}
                </button>
                */}

                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && currentMessage.trim()) {
                      handleSendMessage(currentMessage);
                    }
                  }}
                  placeholder={isVoiceMode ? "🎤 Listening... speak naturally" : "Or type your request here... e.g. 'Private jet from London to Monaco'"}
                  disabled={isVoiceMode}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500 disabled:text-gray-400"
                />

                {/* Message counter */}
                {messageCount > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    messageCount >= MAX_MESSAGES_PER_CHAT - 3
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {messageCount}/{MAX_MESSAGES_PER_CHAT}
                  </span>
                )}

                <button
                  onClick={() => handleSendMessage(currentMessage)}
                  disabled={!currentMessage.trim()}
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                    currentMessage.trim()
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Animation keyframes */}
        <style>{`
          @keyframes bubbleIn {
            from {
              opacity: 0;
              transform: scale(0.3) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes spin-reverse {
            from {
              transform: rotate(360deg);
            }
            to {
              transform: rotate(0deg);
            }
          }

          @keyframes pulse-gentle {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.9;
            }
          }

          @keyframes ping-slow {
            0% {
              transform: scale(1);
              opacity: 0.8;
            }
            75%, 100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }

          @keyframes ping-slower {
            0% {
              transform: scale(1);
              opacity: 0.6;
            }
            75%, 100% {
              transform: scale(1.8);
              opacity: 0;
            }
          }

          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }

          .animate-spin-reverse {
            animation: spin-reverse 6s linear infinite;
          }

          .animate-pulse-gentle {
            animation: pulse-gentle 2s ease-in-out infinite;
          }

          .animate-ping-slow {
            animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }

          .animate-ping-slower {
            animation: ping-slower 3s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}</style>
      </div>
    );
  }

  if (!currentChat) {
    console.log('⚠️ No currentChat found. Showing loading state. ActiveChat:', activeChat);
    // Show loading state while chat is being added to history
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
    <div className="ai-chat-page h-full flex bg-transparent overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* 1. HEADER - STICKY TOP */}
      <div className="flex-shrink-0 px-6 py-4 bg-white/10 border-b border-white/20" style={{ backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveChat('new');
                setWeather(null);
                setCartItems([]);
                setSearchResults(null);
              }}
              className="px-3 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-lg font-semibold text-black truncate max-w-md">
              {currentChat?.messages?.[0]?.content || currentChat?.title || 'New Conversation'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Cart - Always visible */}
            <button
              onClick={() => setShowCartSidebar(true)}
              className="relative p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <ShoppingCart size={18} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>

            {/* Send Request - Always visible but disabled when empty */}
            <button
              onClick={() => setShowRequestForm(true)}
              disabled={cartItems.length === 0}
              className={`px-4 py-2 text-sm rounded-full transition-colors ${
                cartItems.length > 0
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Send Request
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
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-900 transition-colors flex items-center gap-2"
              title="Click to manage subscription"
            >
              {userSubscriptionLimits?.tier === 'elite' ? (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <Crown size={14} />
                  <span>Elite</span>
                </span>
              ) : userSubscriptionLimits?.tier === 'pro' ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-600">Pro</span>
                  <span className="text-gray-400">•</span>
                  <span>{userProfile?.chats_used || 0}/{userProfile?.chats_limit || 20}</span>
                </span>
              ) : userSubscriptionLimits?.tier === 'starter' ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-600">Starter</span>
                  <span className="text-gray-400">•</span>
                  <span>{userProfile?.chats_used || 0}/{userProfile?.chats_limit || 5}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-500">Free</span>
                  <span className="text-gray-400">•</span>
                  <span>{userProfile?.chats_used || 0}/{userProfile?.chats_limit || 2}</span>
                </span>
              )}
            </button>

            {/* Report Issue Button */}
            <button
              onClick={() => setShowReportIssueModal(true)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors flex items-center gap-1.5"
              title="Report an issue"
            >
              <AlertCircle size={14} />
              <span className="hidden md:inline">Report</span>
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

      {/* 2. MESSAGES - FLOW FROM BOTTOM */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 flex flex-col-reverse">
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
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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

                        {/* Send Custom Request Button - Green */}
                        <button
                          onClick={async () => {
                            try {
                              // Save custom request to database
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
                                setToast({ message: 'Custom request sent successfully', type: 'success' });
                                setChatHistory(prev => prev.map(c =>
                                  c.id === activeChat
                                    ? {
                                        ...c,
                                        messages: [...c.messages, {
                                          role: 'assistant',
                                          content: `Your custom request has been sent to our team. You can track its status in your AI Requests. We'll get back to you within 2-4 hours.`
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
                          className="w-full px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Send size={18} />
                          Send Custom Request
                        </button>
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
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
              />
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. INPUT - STICKY AT BOTTOM */}
      <div className="flex-shrink-0 px-6 pb-6 pt-4">
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
                  You've reached 20 messages for this conversation. Ready to send your request?
                </p>
                <div className="flex gap-3">
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
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
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
                    ? 'bg-amber-100 text-amber-700'
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
          <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-50 animate-fade-in-right">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Cart ({cartItems.length})</h3>
                <button onClick={() => setShowCartSidebar(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>

            {cartItems.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
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
                        <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-200 animate-fade-in hover:border-amber-300 transition-all duration-300">
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
                                      e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-amber-50 text-amber-600 text-lg">${item.category === 'wine' ? '🍷' : item.category === 'champagne' ? '🍾' : item.category === 'cigars' ? '🚬' : item.category === 'caviar' ? '🥄' : item.category === 'flowers' ? '💐' : '✨'}</div>`;
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-18 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-lg">
                                  {item.category === 'wine' ? '🍷' : item.category === 'champagne' ? '🍾' : item.category === 'cigars' ? '🚬' : item.category === 'caviar' ? '🥄' : item.category === 'flowers' ? '💐' : '✨'}
                                </div>
                              )}
                            </div>

                            {/* Center: Title & Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-600 text-white">
                                  {item.category?.toUpperCase() || 'EXTRA'}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-200 text-gray-600">
                                  TBC
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                              <p className="text-[10px] text-amber-600 mt-0.5">Availability to be confirmed</p>

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
                                <p className="text-xs text-gray-500">Est.</p>
                                <p className="text-sm font-bold text-gray-900">~€{(item.price || item.basePrice || 0).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Regular cart items (jets, helicopters, yachts, etc.)
                    return (
                      <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200 animate-fade-in hover:border-gray-300 transition-all duration-300">
                        {/* Header with title and remove button */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            {/* Type badge */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                isJet ? 'bg-gray-800 text-white' :
                                isHelicopter ? 'bg-gray-700 text-white' :
                                isYacht ? 'bg-gray-600 text-white' :
                                isLuxuryCar ? 'bg-gray-900 text-white' :
                                isEmptyLeg ? 'bg-gray-500 text-white' :
                                isTransfer ? 'bg-gray-400 text-white' :
                                isAdventure ? 'bg-gray-800 text-white' :
                                'bg-gray-300 text-gray-700'
                              }`}>
                                {isJet ? 'JET' : isHelicopter ? 'HELI' : isYacht ? 'YACHT' : isLuxuryCar ? 'SUPERCAR' : isEmptyLeg ? 'EMPTY LEG' : isTransfer ? 'TRANSFER' : isAdventure ? 'EXPERIENCE' : 'SERVICE'}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {isEmptyLeg ? `${item.from_iata || item.from_city || item.from || ''} → ${item.to_iata || item.to_city || item.to || ''}` : (item.name || item.title || item.aircraft_type || item.model)}
                            </p>
                            {isEmptyLeg && item.aircraft_type && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.aircraft_type}</p>
                            )}
                            {isTransfer && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.from} → {item.to}
                              </p>
                            )}
                            {isJet && item.category && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                            )}
                            {isLuxuryCar && item.brand && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.brand} {item.model}</p>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.cartId || idx)}
                            className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-lg transition-all duration-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Jet Details */}
                        {isJet && (
                          <div className="space-y-2 text-xs text-gray-600 mb-3">
                            <div className="grid grid-cols-2 gap-2">
                              {item.max_passengers && (
                                <div className="flex items-center gap-1.5">
                                  <Users size={12} className="text-gray-400" />
                                  <span>{item.max_passengers} passengers</span>
                                </div>
                              )}
                              {item.range_km && (
                                <div className="flex items-center gap-1.5">
                                  <Plane size={12} className="text-gray-400" />
                                  <span>{item.range_km.toLocaleString()} km range</span>
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
                                  <span>€{item.hourly_rate_eur.toLocaleString()}/hr</span>
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
                                      <span className="text-xs text-gray-500 ml-auto">+€{option.price}</span>
                                    )}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Helicopter Details */}
                        {isHelicopter && (
                          <div className="space-y-2 text-xs text-gray-600 mb-3">
                            <div className="grid grid-cols-2 gap-2">
                              {item.max_passengers && (
                                <div className="flex items-center gap-1.5">
                                  <Users size={12} className="text-gray-400" />
                                  <span>{item.max_passengers} passengers</span>
                                </div>
                              )}
                              {item.range_km && (
                                <div className="flex items-center gap-1.5">
                                  <Plane size={12} className="text-gray-400" />
                                  <span>{item.range_km} km range</span>
                                </div>
                              )}
                              {item.hourly_rate_eur && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-400">💰</span>
                                  <span>€{item.hourly_rate_eur.toLocaleString()}/hr</span>
                                </div>
                              )}
                              {item.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={12} className="text-gray-400" />
                                  <span>{item.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Yacht Details */}
                        {isYacht && (
                          <div className="space-y-2 text-xs text-gray-600 mb-3">
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
                                  <span>€{item.daily_rate_eur.toLocaleString()}/day</span>
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
                          <div className="space-y-2 text-xs text-gray-600 mb-3">
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
                                  <span>€{item.daily_rate_eur.toLocaleString()}/day</span>
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
                          <div className="space-y-2 text-xs text-gray-600 mb-3">
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
                          <div className="space-y-2 text-xs text-gray-600 mb-3">
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
                          <div className="space-y-2 text-xs text-gray-600 mb-3">
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

                        {/* Price breakdown */}
                        <div className="pt-2 border-t border-gray-200 space-y-1">
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
                              {item.isEstimate && isCustomExtra ? '~' : ''}€{(item.basePrice || item.price_usd || item.price || 0).toLocaleString()}
                            </span>
                          </div>

                          {/* Catering for jets */}
                          {isJet && item.cateringPrice > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Catering upgrade</span>
                              <span className="text-gray-600">+€{item.cateringPrice}</span>
                            </div>
                          )}

                          {/* Airport Pickup Fee (Sonderanfahrt) */}
                          {hasAirportFee && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500 flex items-center gap-1">
                                Airfield pickup fee
                              </span>
                              <span className="text-gray-600">
                                +€{item.airportPickupFee}
                              </span>
                            </div>
                          )}

                          {/* VAT if applicable */}
                          {item.vat && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">VAT (8.1%)</span>
                              <span className="text-gray-600">
                                +€{item.vat.toLocaleString()}
                              </span>
                            </div>
                          )}

                          {/* Total */}
                          <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-100">
                            <span className="text-xs text-gray-600 font-medium">
                              {canDirectCheckout ? 'Direct booking' : (item.isEstimate ? 'Est. total' : 'Request quote')}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {item.isEstimate ? '~' : ''}€{((item.totalWithFee || item.price_usd || item.price || 0) + (item.cateringPrice || 0)).toLocaleString()}
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
                    const vatAmount = cartItems.reduce((sum, item) => sum + (item.vat || 0), 0);
                    const grandTotal = cartItems.reduce((sum, item) => sum + (item.totalWithFee || item.price_usd || item.price || 0) + (item.cateringPrice || 0), 0);
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
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                              {customExtras.length} CUSTOM REQUEST{customExtras.length > 1 ? 'S' : ''}
                            </span>
                            <span className="text-[10px] text-gray-400">Availability TBC</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Services</span>
                          <span className="text-gray-700">{hasEstimates ? '~' : ''}€{servicesSubtotal.toLocaleString()}</span>
                        </div>
                        {extrasSubtotal > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-amber-600">Custom extras</span>
                            <span className="text-amber-600">~€{extrasSubtotal.toLocaleString()}</span>
                          </div>
                        )}
                        {cateringTotal > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Catering upgrades</span>
                            <span className="text-gray-600">+€{cateringTotal.toLocaleString()}</span>
                          </div>
                        )}
                        {airportFees > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Airfield pickup fees</span>
                            <span className="text-gray-600">+€{airportFees.toLocaleString()}</span>
                          </div>
                        )}
                        {vatAmount > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">VAT (8.1%)</span>
                            <span className="text-gray-600">+€{vatAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">{hasEstimates ? 'Est. Total' : 'Total'}</span>
                          <span className="text-lg font-bold text-gray-900">{hasEstimates ? '~' : ''}€{grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Smart checkout: split payable vs request-only items */}
                  {(() => {
                    const payableTypes = ['empty_legs', 'emptyleg', 'adventure', 'fixed_offer'];
                    const payableItems = cartItems.filter(item => payableTypes.includes(item.type));
                    const requestOnlyItems = cartItems.filter(item => !payableTypes.includes(item.type));
                    const allPayable = requestOnlyItems.length === 0;
                    const allRequestOnly = payableItems.length === 0;
                    const hasMixedCart = payableItems.length > 0 && requestOnlyItems.length > 0;
                    const payableTotal = payableItems.reduce((sum, item) => sum + (item.totalWithFee || item.price_usd || item.price || 0), 0);

                    if (allPayable) {
                      // All items can be paid directly
                      return (
                        <button
                          onClick={() => {
                            setShowCartSidebar(false);
                            setShowCryptoPayment(true);
                          }}
                          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                        >
                          <Wallet size={18} />
                          Pay with Crypto
                        </button>
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
                          <div className="bg-gray-50 rounded-lg p-3 mb-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <span className="text-xs font-medium text-gray-700">Pay now: €{payableTotal.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 pl-4">
                              {payableItems.map(i => i.name || i.title).join(', ')}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span className="text-xs font-medium text-gray-700">Send as request</span>
                            </div>
                            <div className="text-[10px] text-gray-500 pl-4">
                              {requestOnlyItems.map(i => i.name || i.title || i.aircraft_type).join(', ')}
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              // First, create request for request-only items
                              try {
                                if (user?.id) {
                                  const requestData = {
                                    source: 'ai_chat_mixed_cart',
                                    request_id: `AI-MIX-${Date.now()}`,
                                    items: requestOnlyItems.map(item => ({
                                      ...item,
                                      type: item.type,
                                      name: item.name || item.title || item.aircraft_type || item.model,
                                      price: item.price || item.basePrice || item.price_usd,
                                      from: item.from || item.from_city || item.origin,
                                      to: item.to || item.to_city || item.destination,
                                      date: item.date || item.departure_date,
                                      passengers: item.passengers || item.pax,
                                    })),
                                    summary: {
                                      total_items: requestOnlyItems.length,
                                      grand_total: requestOnlyItems.reduce((sum, item) => sum + (item.price || 0), 0),
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

                              // Then open payment for payable items
                              setShowCartSidebar(false);
                              setShowCryptoPayment(true);
                            }}
                            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                          >
                            <Wallet size={18} />
                            Pay €{payableTotal.toLocaleString()} & Send Request
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
                      <span className="font-medium">€{item.price?.toLocaleString()}</span>
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
                          price: item.price || item.basePrice || item.price_usd,
                          // Route info
                          from: item.from || item.from_city || item.origin,
                          to: item.to || item.to_city || item.destination,
                          // Date/time
                          date: item.date || item.departure_date,
                          time: item.time || item.departure_time,
                          // Additional details
                          passengers: item.passengers || item.pax,
                          category: item.category,
                          // For luxury cars
                          brand: item.brand,
                          model: item.model,
                          year: item.year,
                          location: item.location,
                          rental_days: item.rentalDays,
                          // For transfers
                          distanceKm: item.distanceKm,
                          duration: item.duration,
                          vehicles_needed: item.vehiclesNeeded,
                          // For extras
                          quantity: item.quantity,
                          isCustomRequest: item.isCustomRequest,
                          requiresConfirmation: item.requiresConfirmation,
                          // Pricing
                          cateringOption: item.cateringOption,
                          cateringPrice: item.cateringPrice,
                          airportPickupFee: item.airportPickupFee,
                          vat: item.vat,
                          isEstimate: item.isEstimate
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
                        content: `✅ **Booking Request Sent!**\n\nWe've received your request containing:\n• ${mainServices.length} service(s)${customExtras.length > 0 ? `\n• ${customExtras.length} custom extra(s) (availability TBC)` : ''}\n\n**Estimated Total:** ~€${grandTotal.toLocaleString()}\n\nOur team will review and contact you within 2-4 hours to confirm details and availability.`
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
        onClose={() => setShowSubscriptionModal(false)}
        currentTier={userProfile?.subscription_tier || 'explorer'}
        onUpgrade={async (tierId) => {
          // Handle Stripe checkout for subscription upgrade
          console.log('Upgrade to:', tierId);
          // TODO: Implement Stripe checkout
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
                    <DollarSign className="text-amber-500" size={24} />
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
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-amber-800 mb-2">How it works:</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">1.</span>
                    Upload a quote from another provider (PDF or image)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">2.</span>
                    Our team reviews and verifies the quote
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">3.</span>
                    We respond within 12 hours with a better price
                  </li>
                </ul>
                {userSubscriptionLimits?.tier !== 'elite' && (
                  <p className="text-xs text-amber-600 mt-3 pt-3 border-t border-amber-200">
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
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-amber-400', 'bg-amber-50');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50');
                    const file = e.dataTransfer.files[0];
                    if (file) setBreakThePriceFile(file);
                  }}
                >
                  {breakThePriceFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="text-green-600" size={24} />
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
                        <span className="text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer">
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
                  className="flex-1 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      {showCryptoPayment && (() => {
        const payableTypes = ['empty_legs', 'emptyleg', 'adventure', 'fixed_offer'];
        const payableItems = cartItems.filter(item => payableTypes.includes(item.type));
        const requestOnlyItems = cartItems.filter(item => !payableTypes.includes(item.type));
        const itemsToProcess = payableItems.length > 0 ? payableItems : cartItems;
        const payableTotal = itemsToProcess.reduce((sum, item) => sum + (item.price_usd || item.price || 0), 0);

        return (
          <CryptoPaymentModal
            isOpen={showCryptoPayment}
            onClose={() => setShowCryptoPayment(false)}
            amount={payableTotal}
            currency="USD"
            items={itemsToProcess}
            onSuccess={(paymentId) => {
              console.log('✅ Crypto payment successful:', paymentId);
              setShowCryptoPayment(false);
              setCartItems([]);

              const hasMixedCart = requestOnlyItems.length > 0;
              const successMessage = hasMixedCart
                ? `✅ Payment confirmed for ${payableItems.length} item(s)!\n\nPayment ID: ${paymentId}\n\nAdditionally, we've sent a booking request for: ${requestOnlyItems.map(i => i.name || i.title || i.aircraft_type).join(', ')}. Our team will contact you within 2-4 hours.\n\nYou will receive confirmation emails shortly.`
                : `✅ Payment confirmed! Your booking for ${itemsToProcess.length} item(s) has been processed successfully.\n\nPayment ID: ${paymentId}\n\nYou will receive a confirmation email shortly with all the details.`;

              setToast({ message: 'Payment successful! Your booking is confirmed.', type: 'success' });

              // Add confirmation message to chat
              const confirmMsg = {
                role: 'assistant',
                content: successMessage
              };
              setChatHistory(prev => prev.map(c =>
                c.id === activeChat
                  ? { ...c, messages: [...c.messages, confirmMsg] }
                  : c
              ));
            }}
            onError={(error) => {
              console.error('❌ Crypto payment error:', error);
              setToast({ message: `Payment failed: ${error}`, type: 'error' });
            }}
          />
        );
      })()}

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

      {/* CART WIDGET - Right Side */}
      {showCartWidget && cartItems.length > 0 && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
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
                    €{item.price_eur?.toLocaleString() || item.hourly_rate_eur?.toLocaleString() || item.daily_rate_eur?.toLocaleString() || 'TBD'}
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
                €{cartTotal.toLocaleString()}
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
    </div>
  );
};

export default AIChat;