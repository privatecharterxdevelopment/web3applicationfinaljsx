/**
 * useChatNew Hook
 * Core chat state management: messages, history, active chat, CRUD operations
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { chatService } from '../../../../services/chatService';

export const useChatNew = (user, isAdmin = false, chatHistoryProp, setChatHistoryProp, activeChatProp, setActiveChatProp) => {
  // Internal state (used if props not provided)
  const [internalChatHistory, setInternalChatHistory] = useState([]);
  const [internalActiveChat, setInternalActiveChat] = useState('new');

  // Use props if provided, otherwise internal state
  const chatHistory = chatHistoryProp !== undefined ? chatHistoryProp : internalChatHistory;
  const setChatHistory = setChatHistoryProp || setInternalChatHistory;
  const activeChat = activeChatProp !== undefined ? activeChatProp : internalActiveChat;
  const setActiveChat = setActiveChatProp || setInternalActiveChat;

  // Loading/status states
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStage, setLoadingStage] = useState('searching');
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);

  // Message limit tracking (per chat)
  const [messageCount, setMessageCount] = useState(0);
  const [messageLimitReached, setMessageLimitReached] = useState(false);
  const MAX_MESSAGES_PER_CHAT = 20;

  // Chat limit tracking (total chats for user)
  const [chatLimitReached, setChatLimitReached] = useState(false);

  // Refs
  const previousUserIdRef = useRef(null);
  const hasGreetedRef = useRef(false);
  const isReturningUserRef = useRef(false);
  const messagesEndRef = useRef(null);
  const processedQueriesRef = useRef(new Set());

  // Current chat (memoized)
  const currentChat = useMemo(() => {
    return chatHistory.find(c => c.id === activeChat);
  }, [chatHistory, activeChat]);

  // Current messages (memoized)
  const messages = useMemo(() => {
    return currentChat?.messages || [];
  }, [currentChat]);

  // Reset chatsLoaded when user changes
  useEffect(() => {
    const currentUserId = user?.id;
    const previousUserId = previousUserIdRef.current;

    if (previousUserId !== null && previousUserId !== currentUserId) {
      console.log('🔄 User changed, resetting chatsLoaded');
      setChatsLoaded(false);
    }

    previousUserIdRef.current = currentUserId;
  }, [user?.id]);

  // Load user's chat history from database
  useEffect(() => {
    if (chatHistoryProp !== undefined || !user?.id || chatsLoaded) return;

    const loadChats = async () => {
      try {
        const { success, chats } = await chatService.loadUserChats(user.id);
        if (success && chats?.length > 0) {
          const formattedChats = chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            date: new Date(chat.updated_at).toLocaleDateString(),
            messages: chat.messages || []
          }));
          setChatHistory(formattedChats);
        }
        setChatsLoaded(true);
      } catch (error) {
        console.error('Error loading chats:', error);
        setChatsLoaded(true);
      }
    };

    loadChats();
  }, [user?.id, chatsLoaded, chatHistoryProp, setChatHistory]);

  // Check returning user
  useEffect(() => {
    const lastVisit = localStorage.getItem('last_visit');
    if (lastVisit) isReturningUserRef.current = true;
    localStorage.setItem('last_visit', new Date().toISOString());
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }, [messages.length, isSearching, assistantTyping]);

  // Save chat to database
  const saveChat = useCallback(async (chatId, chatMessages) => {
    if (!user?.id || chatId === 'new' || chatId?.startsWith('temp-')) return;

    try {
      await chatService.updateChatMessages(chatId, chatMessages, user.id);
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  }, [user?.id]);

  // Auto-save chat when messages change
  useEffect(() => {
    if (!user?.id || !chatsLoaded || activeChat === 'new') return;

    const currentChatData = chatHistory.find(c => c.id === activeChat);
    if (!currentChatData || currentChatData.messages.length === 0) return;

    const timeoutId = setTimeout(() => {
      saveChat(activeChat, currentChatData.messages);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [chatHistory, activeChat, user?.id, chatsLoaded, saveChat]);

  // Create new chat
  const createChat = useCallback(async (title, initialMessage) => {
    if (!user?.id) {
      console.error('No user ID for chat creation');
      return null;
    }

    try {
      const { success, chat } = await chatService.createChat(user.id, title, initialMessage);

      if (success && chat) {
        const newChat = {
          id: chat.id,
          title: chat.title,
          date: 'Just now',
          messages: initialMessage ? [initialMessage] : []
        };

        setChatHistory(prev => {
          // Prevent duplicates
          if (prev.find(c => c.id === chat.id)) return prev;
          return [newChat, ...prev];
        });

        setActiveChat(chat.id);
        return chat.id;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      // Create temp local chat on error
      const tempId = `temp-${Date.now()}`;
      const tempChat = {
        id: tempId,
        title: title || 'New Chat',
        date: 'Just now',
        messages: initialMessage ? [initialMessage] : []
      };
      setChatHistory(prev => [tempChat, ...prev]);
      setActiveChat(tempId);
      return tempId;
    }

    return null;
  }, [user?.id, setChatHistory, setActiveChat]);

  // Add message to current chat
  const addMessage = useCallback((message) => {
    if (!activeChat || activeChat === 'new') return;

    setChatHistory(prev => prev.map(chat =>
      chat.id === activeChat
        ? { ...chat, messages: [...chat.messages, message] }
        : chat
    ));
  }, [activeChat, setChatHistory]);

  // Update last message (for streaming)
  const updateLastMessage = useCallback((updater) => {
    setChatHistory(prev => prev.map(chat => {
      if (chat.id !== activeChat) return chat;

      const messages = [...chat.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0) {
        messages[lastIndex] = typeof updater === 'function'
          ? updater(messages[lastIndex])
          : { ...messages[lastIndex], ...updater };
      }
      return { ...chat, messages };
    }));
  }, [activeChat, setChatHistory]);

  // Replace loading message with actual response
  const replaceLoadingMessage = useCallback((content, additionalProps = {}) => {
    setChatHistory(prev => prev.map(chat => {
      if (chat.id !== activeChat) return chat;

      const messages = [...chat.messages];
      const loadingIndex = messages.findIndex(m => m.isLoading);

      if (loadingIndex !== -1) {
        messages[loadingIndex] = {
          role: 'assistant',
          content,
          ...additionalProps
        };
      }

      return { ...chat, messages };
    }));
  }, [activeChat, setChatHistory]);

  // Delete chat
  const deleteChat = useCallback(async (chatId) => {
    if (!user?.id) return;

    try {
      await chatService.deleteChat(chatId, user.id);

      setChatHistory(prev => prev.filter(c => c.id !== chatId));

      if (activeChat === chatId) {
        setActiveChat('new');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }, [user?.id, activeChat, setChatHistory, setActiveChat]);

  // Update chat title
  const updateChatTitle = useCallback(async (chatId, newTitle) => {
    if (!user?.id) return;

    try {
      await chatService.updateChatTitle(chatId, newTitle, user.id);

      setChatHistory(prev => prev.map(c =>
        c.id === chatId ? { ...c, title: newTitle } : c
      ));
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  }, [user?.id, setChatHistory]);

  // Switch to chat
  const switchToChat = useCallback((chatId) => {
    setActiveChat(chatId);
    hasGreetedRef.current = false;
    setMessageCount(0);
    setMessageLimitReached(false);
    setShowWelcomeMessage(true);
  }, [setActiveChat]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setActiveChat('new');
    hasGreetedRef.current = false;
    setMessageCount(0);
    setMessageLimitReached(false);
    setShowWelcomeMessage(true);
  }, [setActiveChat]);

  // Clear messages from current chat
  const clearMessages = useCallback(() => {
    if (!activeChat || activeChat === 'new') return;

    setChatHistory(prev => prev.map(chat =>
      chat.id === activeChat
        ? { ...chat, messages: [] }
        : chat
    ));
  }, [activeChat, setChatHistory]);

  // Generate greeting message
  const generateGreeting = useCallback((userName) => {
    const timeOfDay = new Date().getHours();
    let greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 18 ? 'Good afternoon' : 'Good evening';
    if (isReturningUserRef.current) greeting = 'Welcome back';
    greeting += userName ? ` ${userName}` : '';
    greeting += `. I'm Sphera, your luxury travel AI assistant. How can I help you today?`;
    return greeting;
  }, []);

  // Check if query was already processed (for initial queries)
  const isQueryProcessed = useCallback((query) => {
    return processedQueriesRef.current.has(query);
  }, []);

  // Mark query as processed
  const markQueryProcessed = useCallback((query) => {
    processedQueriesRef.current.add(query);
  }, []);

  return {
    // State
    chatHistory,
    activeChat,
    currentChat,
    messages,
    chatsLoaded,
    isSearching,
    loadingStage,
    assistantTyping,
    typingMessageIndex,
    showWelcomeMessage,
    messageCount,
    messageLimitReached,
    chatLimitReached,
    isReturningUser: isReturningUserRef.current,

    // Setters
    setChatHistory,
    setActiveChat,
    setChatsLoaded,
    setIsSearching,
    setLoadingStage,
    setAssistantTyping,
    setTypingMessageIndex,
    setShowWelcomeMessage,
    setMessageCount,
    setMessageLimitReached,
    setChatLimitReached,

    // Actions
    createChat,
    deleteChat,
    saveChat,
    addMessage,
    updateLastMessage,
    replaceLoadingMessage,
    updateChatTitle,
    switchToChat,
    startNewChat,
    clearMessages,
    generateGreeting,
    isQueryProcessed,
    markQueryProcessed,

    // Refs
    messagesEndRef,
    hasGreetedRef,

    // Constants
    MAX_MESSAGES_PER_CHAT
  };
};

export default useChatNew;
