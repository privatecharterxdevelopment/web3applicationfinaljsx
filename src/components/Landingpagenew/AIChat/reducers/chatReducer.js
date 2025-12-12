// Chat State Reducer
// Manages: chatHistory, activeChat, messages, loading states

export const CHAT_ACTIONS = {
  // Chat management
  SET_CHAT_HISTORY: 'SET_CHAT_HISTORY',
  ADD_CHAT: 'ADD_CHAT',
  UPDATE_CHAT: 'UPDATE_CHAT',
  DELETE_CHAT: 'DELETE_CHAT',
  SET_ACTIVE_CHAT: 'SET_ACTIVE_CHAT',

  // Messages
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  REMOVE_LOADING_MESSAGES: 'REMOVE_LOADING_MESSAGES',
  SET_CHAT_MESSAGES: 'SET_CHAT_MESSAGES',
  UPDATE_STREAMING_MESSAGE: 'UPDATE_STREAMING_MESSAGE', // For real-time streaming

  // Loading states
  SET_PROCESSING: 'SET_PROCESSING',
  SET_SEARCHING: 'SET_SEARCHING',
  SET_ASSISTANT_TYPING: 'SET_ASSISTANT_TYPING',
  SET_STREAMING: 'SET_STREAMING', // For streaming indicator

  // Limits
  SET_MESSAGE_COUNT: 'SET_MESSAGE_COUNT',
  SET_MESSAGE_LIMIT_REACHED: 'SET_MESSAGE_LIMIT_REACHED',
  SET_CHAT_LIMIT_REACHED: 'SET_CHAT_LIMIT_REACHED',

  // UI
  SET_TYPING_MESSAGE_INDEX: 'SET_TYPING_MESSAGE_INDEX',
  SET_SHOW_WELCOME_MESSAGE: 'SET_SHOW_WELCOME_MESSAGE',

  // Bulk update
  BATCH_UPDATE: 'BATCH_UPDATE'
};

export const initialChatState = {
  chatHistory: [],
  activeChat: 'new',
  isProcessing: false,
  isSearching: false,
  isStreaming: false, // For real-time streaming
  assistantTyping: false,
  messageCount: 0,
  messageLimitReached: false,
  chatLimitReached: false,
  typingMessageIndex: -1,
  showWelcomeMessage: true,
  loadingStage: null
};

export function chatReducer(state, action) {
  switch (action.type) {
    // Chat management
    case CHAT_ACTIONS.SET_CHAT_HISTORY:
      return { ...state, chatHistory: action.payload };

    case CHAT_ACTIONS.ADD_CHAT:
      return {
        ...state,
        chatHistory: [action.payload, ...state.chatHistory]
      };

    case CHAT_ACTIONS.UPDATE_CHAT:
      return {
        ...state,
        chatHistory: state.chatHistory.map(chat =>
          chat.id === action.payload.id
            ? { ...chat, ...action.payload.updates }
            : chat
        )
      };

    case CHAT_ACTIONS.DELETE_CHAT:
      return {
        ...state,
        chatHistory: state.chatHistory.filter(chat => chat.id !== action.payload),
        activeChat: state.activeChat === action.payload ? 'new' : state.activeChat
      };

    case CHAT_ACTIONS.SET_ACTIVE_CHAT:
      return { ...state, activeChat: action.payload };

    // Messages
    case CHAT_ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        chatHistory: state.chatHistory.map(chat =>
          chat.id === action.payload.chatId
            ? { ...chat, messages: [...chat.messages, action.payload.message] }
            : chat
        )
      };

    case CHAT_ACTIONS.UPDATE_MESSAGE:
      return {
        ...state,
        chatHistory: state.chatHistory.map(chat =>
          chat.id === action.payload.chatId
            ? {
                ...chat,
                messages: chat.messages.map((msg, idx) =>
                  idx === action.payload.index
                    ? { ...msg, ...action.payload.updates }
                    : msg
                )
              }
            : chat
        )
      };

    case CHAT_ACTIONS.REMOVE_LOADING_MESSAGES:
      return {
        ...state,
        chatHistory: state.chatHistory.map(chat =>
          chat.id === action.payload
            ? { ...chat, messages: chat.messages.filter(m => !m.isLoading) }
            : chat
        )
      };

    case CHAT_ACTIONS.SET_CHAT_MESSAGES:
      return {
        ...state,
        chatHistory: state.chatHistory.map(chat =>
          chat.id === action.payload.chatId
            ? { ...chat, messages: action.payload.messages }
            : chat
        )
      };

    // Update streaming message content in real-time
    case CHAT_ACTIONS.UPDATE_STREAMING_MESSAGE:
      return {
        ...state,
        chatHistory: state.chatHistory.map(chat => {
          if (chat.id !== action.payload.chatId) return chat;

          // Find the last assistant message that's streaming
          const messages = [...chat.messages];
          const lastMsgIndex = messages.length - 1;

          if (lastMsgIndex >= 0 && messages[lastMsgIndex].role === 'assistant') {
            messages[lastMsgIndex] = {
              ...messages[lastMsgIndex],
              content: action.payload.content,
              isStreaming: action.payload.isStreaming ?? true
            };
          }

          return { ...chat, messages };
        })
      };

    // Loading states
    case CHAT_ACTIONS.SET_PROCESSING:
      return { ...state, isProcessing: action.payload };

    case CHAT_ACTIONS.SET_SEARCHING:
      return { ...state, isSearching: action.payload };

    case CHAT_ACTIONS.SET_ASSISTANT_TYPING:
      return { ...state, assistantTyping: action.payload };

    case CHAT_ACTIONS.SET_STREAMING:
      return { ...state, isStreaming: action.payload };

    // Limits
    case CHAT_ACTIONS.SET_MESSAGE_COUNT:
      return { ...state, messageCount: action.payload };

    case CHAT_ACTIONS.SET_MESSAGE_LIMIT_REACHED:
      return { ...state, messageLimitReached: action.payload };

    case CHAT_ACTIONS.SET_CHAT_LIMIT_REACHED:
      return { ...state, chatLimitReached: action.payload };

    // UI
    case CHAT_ACTIONS.SET_TYPING_MESSAGE_INDEX:
      return { ...state, typingMessageIndex: action.payload };

    case CHAT_ACTIONS.SET_SHOW_WELCOME_MESSAGE:
      return { ...state, showWelcomeMessage: action.payload };

    // Batch update for performance
    case CHAT_ACTIONS.BATCH_UPDATE:
      return { ...state, ...action.payload };

    default:
      console.warn('Unknown chat action:', action.type);
      return state;
  }
}

// Action creators for cleaner code
export const chatActions = {
  setChatHistory: (history) => ({ type: CHAT_ACTIONS.SET_CHAT_HISTORY, payload: history }),
  addChat: (chat) => ({ type: CHAT_ACTIONS.ADD_CHAT, payload: chat }),
  updateChat: (id, updates) => ({ type: CHAT_ACTIONS.UPDATE_CHAT, payload: { id, updates } }),
  deleteChat: (id) => ({ type: CHAT_ACTIONS.DELETE_CHAT, payload: id }),
  setActiveChat: (id) => ({ type: CHAT_ACTIONS.SET_ACTIVE_CHAT, payload: id }),

  addMessage: (chatId, message) => ({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: { chatId, message } }),
  updateMessage: (chatId, index, updates) => ({ type: CHAT_ACTIONS.UPDATE_MESSAGE, payload: { chatId, index, updates } }),
  removeLoadingMessages: (chatId) => ({ type: CHAT_ACTIONS.REMOVE_LOADING_MESSAGES, payload: chatId }),
  setChatMessages: (chatId, messages) => ({ type: CHAT_ACTIONS.SET_CHAT_MESSAGES, payload: { chatId, messages } }),
  updateStreamingMessage: (chatId, content, isStreaming = true) => ({
    type: CHAT_ACTIONS.UPDATE_STREAMING_MESSAGE,
    payload: { chatId, content, isStreaming }
  }),

  setProcessing: (value) => ({ type: CHAT_ACTIONS.SET_PROCESSING, payload: value }),
  setSearching: (value) => ({ type: CHAT_ACTIONS.SET_SEARCHING, payload: value }),
  setAssistantTyping: (value) => ({ type: CHAT_ACTIONS.SET_ASSISTANT_TYPING, payload: value }),
  setStreaming: (value) => ({ type: CHAT_ACTIONS.SET_STREAMING, payload: value }),

  setMessageCount: (count) => ({ type: CHAT_ACTIONS.SET_MESSAGE_COUNT, payload: count }),
  setMessageLimitReached: (value) => ({ type: CHAT_ACTIONS.SET_MESSAGE_LIMIT_REACHED, payload: value }),
  setChatLimitReached: (value) => ({ type: CHAT_ACTIONS.SET_CHAT_LIMIT_REACHED, payload: value }),

  setTypingMessageIndex: (index) => ({ type: CHAT_ACTIONS.SET_TYPING_MESSAGE_INDEX, payload: index }),
  setShowWelcomeMessage: (value) => ({ type: CHAT_ACTIONS.SET_SHOW_WELCOME_MESSAGE, payload: value }),

  batchUpdate: (updates) => ({ type: CHAT_ACTIONS.BATCH_UPDATE, payload: updates })
};
