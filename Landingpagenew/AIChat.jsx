import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft, Mic, Send, X, Volume2, VolumeX, Edit2, Shield, Wallet, ShoppingCart, MessageSquare, Plus, Crown, AlertCircle, Calendar, Trash2
} from 'lucide-react';
import Anthropic from '@anthropic-ai/sdk';

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

// Typing Text Effect Component
const TypingText = ({ text, speed = 20, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <p className="text-sm leading-relaxed whitespace-pre-line">{displayedText}<span className="animate-pulse">|</span></p>;
};

// Main Component
const AIChat = ({ user: userProp, initialQuery = '', onQueryProcessed = () => {} }) => {
  // Use auth context (returns null if not in AuthProvider)
  const authContext = useAuth();
  const user = userProp || authContext?.user || { name: 'Guest', id: null };
  const isAdmin = authContext?.isAdmin || false;

  console.log('👤 User info:', { userId: user?.id, isAdmin, hasAuthContext: !!authContext });

  // Read Vite-style env vars; if missing, voice will be skipped gracefully
  const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  const HUME_API_KEY = (import.meta.env?.VITE_HUME_API_KEY) || '';
  const HUME_SECRET_KEY = (import.meta.env?.VITE_HUME_SECRET_KEY) || '';

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
  const [chatsLoaded, setChatsLoaded] = useState(false);
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
  const [userProfile, setUserProfile] = useState(null);
  const [toast, setToast] = useState(null);
  const [limitWarningShown, setLimitWarningShown] = useState(false);
  const [pendingSignature, setPendingSignature] = useState(null);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
  const anthropicRef = useRef(null);
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

  // Initialize Claude API
  useEffect(() => {
    console.log('🔑 API Key present:', !!ANTHROPIC_API_KEY, ANTHROPIC_API_KEY ? `(${ANTHROPIC_API_KEY.substring(0, 15)}...)` : '(none)');
    if (ANTHROPIC_API_KEY) {
      anthropicRef.current = new Anthropic({
        apiKey: ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true
      });
      console.log('✅ Claude API initialized');
    } else {
      console.warn('⚠️ VITE_ANTHROPIC_API_KEY not found');
    }
  }, [ANTHROPIC_API_KEY]);

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
          handleSendMessage(transcript, 'voice');
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

  // Create welcome chat when activeChat is 'new'
  const hasCreatedWelcomeRef = useRef(false);

  useEffect(() => {
    const createWelcomeChat = async () => {
      if (activeChat !== 'new' || !user?.id || hasCreatedWelcomeRef.current) return;

      hasCreatedWelcomeRef.current = true; // Prevent multiple creations

      const welcomeMessages = [
        "Hey! I'm Sphera AI. Where are we traveling today?",
        "Hi Captain! Let's plan something great together.",
        "Hello! I'm Sphera. How can I assist you today?"
      ];

      const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

      const welcomeMessage = {
        role: 'assistant',
        content: randomWelcome
      };

      try {
        const { success, chat } = await chatService.createChat(user.id, 'New Chat', welcomeMessage);

        if (success) {
          const newChat = {
            id: chat.id,
            title: 'New Chat',
            date: 'Just now',
            messages: [welcomeMessage]
          };

          setChatHistory(prev => [newChat, ...prev]);
          setActiveChat(chat.id);
          await chatService.updateChatMessages(chat.id, [welcomeMessage], user.id);
        }
      } catch (error) {
        console.error('Failed to create welcome chat:', error);
        hasCreatedWelcomeRef.current = false; // Reset on error
      }
    };

    createWelcomeChat();
  }, [activeChat, user?.id]);

  // Reset the welcome ref when switching away from 'new'
  useEffect(() => {
    if (activeChat !== 'new') {
      hasCreatedWelcomeRef.current = false;
    }
  }, [activeChat]);

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
            handleSendMessage(String(text), 'voice');
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
        handleSendMessage(initialQuery, 'text');
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
        const { error: insertError } = await supabase.from('user_requests').insert([payload]);
        if (insertError) console.error('Failed to save to user_requests:', insertError);
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

  // NEW CLAUDE-BASED MESSAGE HANDLER
  const handleSendMessage = async (message) => {
    if (!message.trim() || isProcessing) return;
    if (!anthropicRef.current) {
      setToast({ message: 'AI not initialized', type: 'error' });
      return;
    }

    setShowWelcomeMessage(false);
    const userMessage = { role: 'user', content: message };
    let workingChatId = activeChat;

    // Update chat with user message
    const existingChat = chatHistory.find(c => c.id === activeChat);

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
      // Fallback: Create new chat if somehow still on 'new'
      const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      const { success, chat } = await chatService.createChat(user.id, title, userMessage);

      if (success) {
        const newChat = {
          id: chat.id,
          title: chat.title,
          date: 'Just now',
          messages: [userMessage]
        };

        setChatHistory(prev => [newChat, ...prev]);
        setActiveChat(chat.id);
        workingChatId = chat.id;

        await chatService.updateChatMessages(chat.id, [userMessage], user.id);
      } else {
        setToast({ message: 'Failed to create chat', type: 'error' });
        return;
      }
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

    // Build conversation history BEFORE state updates
    const currentChatObj = chatHistory.find(c => c.id === workingChatId);
    let conversationHistory;

    if (isFirstUserMessage && existingChat) {
      // First message after welcome: [welcome, userMessage]
      conversationHistory = [...existingChat.messages, userMessage];
    } else if (currentChatObj) {
      // Existing chat: use all messages + new user message
      conversationHistory = [...currentChatObj.messages.filter(msg => !msg.isLoading), userMessage];
    } else {
      // Fallback
      conversationHistory = [userMessage];
    }

    console.log('📝 Conversation history being sent to Claude:', conversationHistory);

    // Add a loading message immediately
    const loadingMessage = { role: 'assistant', content: '...', isLoading: true };
    setChatHistory(prev => prev.map(c =>
      c.id === workingChatId
        ? { ...c, messages: [...c.messages, loadingMessage] }
        : c
    ));

    try {
      const systemPrompt = getSystemPrompt();

      // Filter out 'results' messages - they're UI-only, not part of Claude conversation
      const claudeMessages = conversationHistory
        .filter(msg => msg.role !== 'results')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await anthropicRef.current.messages.create({
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
          if (toolResult.success && toolResult.results && toolResult.results.length > 0) {
            const tabs = [{
              id: toolUse.name === 'searchEmptyLegs' ? 'emptylegs' : 'jets',
              label: toolUse.name === 'searchEmptyLegs' ? 'Empty Legs' : 'Private Jets',
              count: toolResult.results.length,
              items: toolResult.results
            }];

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

          // Get AI response about results - MUST use proper tool_result format
          const followUp = await anthropicRef.current.messages.create({
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

  // NEW CHAT VIEW - Show loading while creating chat with welcome message
  if (activeChat === 'new') {
    console.log('🎨 Rendering: NEW CHAT VIEW (loading)');
    return (
      <div className="h-full bg-transparent flex flex-col overflow-hidden">
        {/* Show loading while creating chat */}
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Creating your chat...</div>
        </div>

        {/* FIXED INPUT - Floating unten */}
        <div className="flex-shrink-0 px-6 pb-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus-within:border-gray-400 transition-colors shadow-lg">
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

              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentMessage.trim()) {
                    handleSendMessage(currentMessage, 'text');
                  }
                }}
                placeholder={isVoiceMode ? "🎤 Listening... speak naturally" : "Private jet from London to Monaco for 4 passengers..."}
                disabled={isVoiceMode}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500 disabled:text-gray-400"
              />

              <button
                onClick={() => handleSendMessage(currentMessage, 'text')}
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
          </div>
        </div>
      </div>
    );
  }

  if (!currentChat) {
    console.log('⚠️ No currentChat found. Returning null. ActiveChat:', activeChat);
    return null;
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

            {/* Voice Mute Toggle */}
            <button
              onClick={toggleVoiceMute}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              title={isVoiceMuted ? 'Voice Muted' : 'Voice Active'}
            >
              {isVoiceMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Chat Counter - Clickable to open subscriptions */}
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-900 transition-colors"
            >
              {userProfile?.chats_limit === null ? (
                <span className="flex items-center gap-1 text-yellow-600">
                  <Crown size={14} />
                  <span>∞</span>
                </span>
              ) : (
                <span>
                  {userProfile?.chats_used || 0}/{userProfile?.chats_limit || 2}
                </span>
              )}
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
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
            <button
              onClick={toggleRecording}
              disabled={isSearching}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : 'bg-black text-white hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? <X size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentMessage.trim() && !isSearching) {
                  handleSendMessage(currentMessage, 'text');
                }
              }}
              placeholder={isRecording ? "Listening..." : "Message Sphera..."}
              disabled={isSearching || isRecording}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 disabled:cursor-not-allowed"
            />

            <button
              onClick={() => handleSendMessage(currentMessage, 'text')}
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
                <div className="p-6 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200 animate-fade-in hover:bg-gray-100 transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-gray-900">{item.name || item.title || item.aircraft_type}</p>
                        <button
                          onClick={() => removeFromCart(item.cartId || idx)}
                          className="p-1 hover:bg-gray-200 rounded transition-all duration-300 hover:scale-110"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">€{item.price?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-6 bg-white">
                  <button
                    onClick={() => {
                      setShowCartSidebar(false);
                      setShowRequestForm(true);
                    }}
                    className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105"
                  >
                    Send Request
                  </button>
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
                      for (const item of cartItems) {
                        await createRequest({
                          user_id: user.id,
                          service_type: item.type || 'aircraft',
                          from_location: item.from || item.from_city || '',
                          to_location: item.to || item.to_city || '',
                          details: JSON.stringify(item),
                          status: 'pending'
                        });
                      }

                      const confirmMsg = {
                        role: 'assistant',
                        content: `✅ Booking request sent! We've received your request for ${cartItems.length} item(s). Our team will contact you within 2-4 hours.`
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