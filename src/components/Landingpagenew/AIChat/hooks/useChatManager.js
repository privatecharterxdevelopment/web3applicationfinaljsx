// useChatManager Hook
// Manages chat CRUD operations and state

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { chatReducer, initialChatState, chatActions } from '../reducers/chatReducer';
import { chatService } from '../../../../services/chatService';
import { subscriptionService } from '../../../../services/subscriptionService';

export function useChatManager({ user, isAdmin, navigate, onToast }) {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);

  // Refs for managing async operations
  const pendingChatRef = useRef(null);
  const loadingRef = useRef(false);

  // Load chat history on mount
  const loadChatHistory = useCallback(async () => {
    if (!user?.id || loadingRef.current) return;

    loadingRef.current = true;
    try {
      const { success, chats } = await chatService.getUserChats(user.id);
      if (success && chats) {
        const formatted = chats.map(chat => ({
          id: chat.id,
          title: chat.title || 'New Chat',
          date: new Date(chat.updated_at).toLocaleDateString(),
          messages: chat.messages || []
        }));
        dispatch(chatActions.setChatHistory(formatted));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      onToast?.({ message: 'Failed to load chat history', type: 'error' });
    } finally {
      loadingRef.current = false;
    }
  }, [user?.id, onToast]);

  // Create new chat
  const createChat = useCallback(async (title, initialMessage = null) => {
    if (!user?.id) {
      onToast?.({ message: 'Please log in to start a chat', type: 'error' });
      return null;
    }

    // Check subscription limit (skip for admins)
    if (!isAdmin) {
      try {
        const { canStart, chatsUsed, chatsLimit } = await subscriptionService.canStartNewChat(user.id);
        if (!canStart) {
          dispatch(chatActions.setChatLimitReached(true));
          onToast?.({
            message: `You've reached your chat limit (${chatsUsed}/${chatsLimit}). Upgrade to continue.`,
            type: 'warning'
          });
          return null;
        }
      } catch (error) {
        console.warn('Failed to check chat limit:', error);
      }
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

        dispatch(chatActions.addChat(newChat));
        dispatch(chatActions.setActiveChat(chat.id));

        // Increment usage (skip for admins and elite)
        if (!isAdmin) {
          try {
            await subscriptionService.incrementChatUsage(user.id);
            await subscriptionService.createChatSession(user.id, chat.id);
          } catch (usageError) {
            console.warn('Failed to update chat usage:', usageError);
          }
        }

        // Update URL (use dashboard route to keep sidebar)
        if (navigate && chat.id) {
          navigate(`/dashboard/chat/${chat.id}`, { replace: true });
        }

        return chat;
      }

      throw new Error('Chat creation failed');
    } catch (error) {
      console.error('Error creating chat:', error);
      onToast?.({ message: 'Failed to create chat', type: 'error' });
      return null;
    }
  }, [user?.id, isAdmin, navigate, onToast]);

  // Switch to chat
  const switchChat = useCallback((chatId) => {
    dispatch(chatActions.setActiveChat(chatId));
    dispatch(chatActions.setMessageLimitReached(false));

    // Update message count for the chat
    const chat = state.chatHistory.find(c => c.id === chatId);
    if (chat) {
      const userMsgCount = chat.messages?.filter(m => m.role === 'user').length || 0;
      dispatch(chatActions.setMessageCount(userMsgCount));
    }

    // Update URL (use dashboard route to keep sidebar)
    if (navigate && chatId && chatId !== 'new') {
      navigate(`/dashboard/chat/${chatId}`, { replace: true });
    }
  }, [navigate, state.chatHistory]);

  // Delete chat
  const deleteChat = useCallback(async (chatId) => {
    if (!user?.id) return false;

    try {
      const { success } = await chatService.deleteChat(chatId, user.id);
      if (success) {
        dispatch(chatActions.deleteChat(chatId));

        // If deleted current chat, go to new
        if (state.activeChat === chatId) {
          dispatch(chatActions.setActiveChat('new'));
          if (navigate) navigate('/chat', { replace: true });
        }

        onToast?.({ message: 'Chat deleted', type: 'success' });
        return true;
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      onToast?.({ message: 'Failed to delete chat', type: 'error' });
    }
    return false;
  }, [user?.id, state.activeChat, navigate, onToast]);

  // Update chat title
  const updateChatTitle = useCallback(async (chatId, newTitle) => {
    if (!user?.id) return false;

    try {
      dispatch(chatActions.updateChat(chatId, { title: newTitle }));
      await chatService.updateChatTitle(chatId, newTitle, user.id);
      return true;
    } catch (error) {
      console.error('Error updating chat title:', error);
      return false;
    }
  }, [user?.id]);

  // Save messages to database
  const saveMessages = useCallback(async (chatId, messages) => {
    if (!user?.id || chatId === 'new') return false;

    // Only save if it's a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chatId);
    if (!isUUID) return false;

    try {
      await chatService.updateChatMessages(chatId, messages, user.id);
      return true;
    } catch (error) {
      console.error('Error saving messages:', error);
      return false;
    }
  }, [user?.id]);

  // Add message to chat
  const addMessage = useCallback((chatId, message) => {
    dispatch(chatActions.addMessage(chatId, message));

    // Update message count if it's a user message
    if (message.role === 'user') {
      dispatch(chatActions.setMessageCount(state.messageCount + 1));
    }
  }, [state.messageCount]);

  // Remove loading messages
  const removeLoadingMessages = useCallback((chatId) => {
    dispatch(chatActions.removeLoadingMessages(chatId));
  }, []);

  // Set chat messages (replace all)
  const setChatMessages = useCallback((chatId, messages) => {
    dispatch(chatActions.setChatMessages(chatId, messages));
  }, []);

  // Get current chat
  const getCurrentChat = useCallback(() => {
    return state.chatHistory.find(c => c.id === state.activeChat);
  }, [state.chatHistory, state.activeChat]);

  // Load chat from URL
  const loadChatFromUrl = useCallback(async (chatId) => {
    if (!user?.id || !chatId) return null;

    try {
      const { success, chat } = await chatService.getChatById(chatId, user.id);
      if (success && chat) {
        // Check if chat already in history
        const existing = state.chatHistory.find(c => c.id === chatId);
        if (!existing) {
          const formatted = {
            id: chat.id,
            title: chat.title || 'Loaded Chat',
            date: new Date(chat.updated_at).toLocaleDateString(),
            messages: chat.messages || []
          };
          dispatch(chatActions.addChat(formatted));
        }

        dispatch(chatActions.setActiveChat(chatId));

        // Update messages if they exist
        if (chat.messages?.length > 0) {
          dispatch(chatActions.setChatMessages(chatId, chat.messages));
        }

        return chat;
      }
    } catch (error) {
      console.error('Error loading chat from URL:', error);
    }
    return null;
  }, [user?.id, state.chatHistory]);

  // Start new chat view
  const startNewChat = useCallback(() => {
    dispatch(chatActions.setActiveChat('new'));
    dispatch(chatActions.setMessageCount(0));
    dispatch(chatActions.setMessageLimitReached(false));
    dispatch(chatActions.setShowWelcomeMessage(true));
    if (navigate) navigate('/chat', { replace: true });
  }, [navigate]);

  return {
    // State
    ...state,
    currentChat: getCurrentChat(),

    // Actions
    dispatch,
    loadChatHistory,
    createChat,
    switchChat,
    deleteChat,
    updateChatTitle,
    saveMessages,
    addMessage,
    removeLoadingMessages,
    setChatMessages,
    loadChatFromUrl,
    startNewChat,

    // Setters via dispatch
    setProcessing: (value) => dispatch(chatActions.setProcessing(value)),
    setSearching: (value) => dispatch(chatActions.setSearching(value)),
    setAssistantTyping: (value) => dispatch(chatActions.setAssistantTyping(value)),
    setTypingMessageIndex: (index) => dispatch(chatActions.setTypingMessageIndex(index)),
    setShowWelcomeMessage: (value) => dispatch(chatActions.setShowWelcomeMessage(value)),
    setChatLimitReached: (value) => dispatch(chatActions.setChatLimitReached(value)),
    setMessageLimitReached: (value) => dispatch(chatActions.setMessageLimitReached(value)),
    setMessageCount: (count) => dispatch(chatActions.setMessageCount(count))
  };
}

export default useChatManager;
