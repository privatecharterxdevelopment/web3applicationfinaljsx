import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, X } from 'lucide-react';

// Services
import { subscriptionService } from '../services/subscriptionService';
import { claudeService } from '../services/claudeService';
import { getSystemPrompt } from '../lib/aiKnowledgeBase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Components
import FloatingChatInput from './FloatingChatInput';
import { TypingIndicator, MessageFadeIn, LimitReachedMessage } from './LoadingMessages';
import SubscriptionModal from './SubscriptionModal';
import TopUpModal from './TopUpModal';

const ModernAIChat = ({ onClose }) => {
  const { user } = useAuth();

  // Chat state
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Subscription state
  const [chatStats, setChatStats] = useState(null);
  const [showLimitReached, setShowLimitReached] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Chat history
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Session tracking
  const sessionIdRef = useRef(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);

  // Load chat stats on mount
  useEffect(() => {
    if (user?.id) {
      loadChatStats();
      loadChatHistory();
    }
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load system prompt
  useEffect(() => {
    const systemPrompt = getSystemPrompt();
    claudeService.setSystemPrompt(systemPrompt);
  }, []);

  const loadChatStats = async () => {
    try {
      const stats = await subscriptionService.getChatStats(user.id);
      setChatStats(stats);
    } catch (error) {
      console.error('Error loading chat stats:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const history = await subscriptionService.getChatHistory(user.id, 20);

      // Group messages by session_id
      const groupedChats = history.reduce((acc, session) => {
        const existing = acc.find(c => c.session_id === session.chat_session_id);
        if (existing) {
          existing.message_count = session.message_count;
          existing.last_message_at = session.last_message_at;
        } else {
          acc.push({
            session_id: session.chat_session_id,
            started_at: session.started_at,
            last_message_at: session.last_message_at,
            message_count: session.message_count,
            completed: session.completed
          });
        }
        return acc;
      }, []);

      setChatHistory(groupedChats);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const startNewChat = async () => {
    // Check if user can start new chat
    const canStart = await subscriptionService.canStartNewChat(user.id);

    if (!canStart.canStart) {
      setShowLimitReached(true);
      return false;
    }

    // Increment usage
    const result = await subscriptionService.incrementChatUsage(user.id);

    if (!result.success) {
      setShowLimitReached(true);
      return false;
    }

    // Create session
    await subscriptionService.createChatSession(user.id, sessionIdRef.current);

    // Reload stats
    await loadChatStats();

    return true;
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    // Check if this is the first message
    if (messages.length === 0) {
      const canStart = await startNewChat();
      if (!canStart) return;
    }

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to AI
      const aiMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      aiMessages.push({
        role: 'user',
        content: messageText
      });

      const response = await claudeService.sendMessage(aiMessages);

      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update message count
      await subscriptionService.updateChatMessageCount(
        sessionIdRef.current,
        messages.length + 2 // +2 for user message and AI response
      );

      // Check if 25 messages reached
      if (messages.length + 2 >= 25) {
        await subscriptionService.completeChat(sessionIdRef.current);

        // Show completion message
        const completionMessage = {
          id: Date.now() + 2,
          role: 'system',
          content: 'This conversation has reached 25 messages. Start a new chat to continue.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
      }

    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = {
        id: Date.now() + 1,
        role: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceStart = () => {
    setIsRecording(true);
    // TODO: Implement voice recording
    console.log('Voice recording started');
  };

  const handleVoiceStop = () => {
    setIsRecording(false);
    // TODO: Implement voice recording stop
    console.log('Voice recording stopped');
  };

  const handleNewChat = () => {
    setMessages([]);
    sessionIdRef.current = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentChatId(null);
  };

  const loadHistoryChat = (chat) => {
    // TODO: Load messages from this chat session
    setShowHistory(false);
    console.log('Load chat:', chat);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">

      {/* Compact Header */}
      <div className="flex-shrink-0 border-b border-black/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

          {/* Left: Back Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-black/60 hover:text-black transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
            <span className="text-xs font-light">Back</span>
          </button>

          {/* Center: Compact Title */}
          <div className="text-center">
            <h1 className="text-base font-light text-black tracking-tight">Sphera AI</h1>
            <p className="text-[10px] text-gray-400 font-light">
              {chatStats?.unlimited ? (
                '∞ Unlimited'
              ) : chatStats ? (
                `${chatStats.chatsRemaining}/${chatStats.chatsLimit} remaining`
              ) : (
                'Loading...'
              )}
            </p>
          </div>

          {/* Right: Compact Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-lg text-xs font-light transition-all"
            >
              History
            </button>
            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 bg-black text-white hover:bg-gray-800 rounded-lg text-xs font-light transition-all"
            >
              New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">

        {/* Chat History Sidebar */}
        {showHistory && (
          <div className="w-80 border-r border-black/10 bg-gray-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-light text-black">Chat History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {chatHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 font-light text-center py-8">
                    No previous chats
                  </p>
                ) : (
                  chatHistory.map((chat) => (
                    <button
                      key={chat.session_id}
                      onClick={() => loadHistoryChat(chat)}
                      className="w-full text-left p-4 bg-white hover:bg-gray-100 rounded-xl border border-black/10 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-light text-black">
                          {new Date(chat.started_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400 font-light">
                          {chat.message_count} msgs
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-light">
                        {new Date(chat.last_message_at).toLocaleTimeString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 flex flex-col relative">

          {/* Limit Reached Overlay */}
          {showLimitReached && (
            <LimitReachedMessage
              chatsRemaining={chatStats?.chatsRemaining || 0}
              onUpgrade={() => {
                setShowLimitReached(false);
                setShowSubscriptionModal(true);
              }}
              onTopUp={() => {
                setShowLimitReached(false);
                setShowTopUpModal(true);
              }}
            />
          )}

          {/* Messages Container - REVERSED (older on top, scroll UP to see history) */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col-reverse">
            <div className="max-w-4xl mx-auto w-full space-y-3">

              {/* Auto-scroll anchor at BOTTOM (newest messages) */}
              <div ref={messagesEndRef} />

              {/* Loading Indicator - at bottom (newest) */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 border border-black/10 rounded-xl">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              {/* Messages - REVERSED array so newest at bottom */}
              {[...messages].reverse().map((message, index) => (
                <MessageFadeIn key={message.id} delay={0}>
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-black text-white'
                        : message.role === 'system'
                        ? 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                        : 'bg-gray-50 text-black border border-black/10'
                    } rounded-xl px-4 py-2.5`}>

                      {/* Compact Role Label */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-1 h-1 rounded-full ${
                          message.role === 'user'
                            ? 'bg-white/60'
                            : message.role === 'system'
                            ? 'bg-yellow-600'
                            : 'bg-black/40'
                        }`} />
                        <span className="text-[10px] font-light opacity-50">
                          {message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'Sphera'}
                        </span>
                        <span className="text-[10px] opacity-40 ml-auto">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-xs font-light leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </MessageFadeIn>
              ))}

              {/* Welcome Message - at TOP (oldest, user scrolls up to see it) */}
              {messages.length === 0 && !isLoading && (
                <MessageFadeIn>
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-black/5 flex items-center justify-center">
                      <svg className="w-6 h-6 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-light text-black mb-2">
                      Welcome to Sphera AI
                    </h2>
                    <p className="text-xs text-gray-500 font-light max-w-md mx-auto leading-relaxed">
                      Ask me about private jets, empty legs, yachts, helicopters, and more.
                    </p>
                  </div>
                </MessageFadeIn>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-black/10 bg-white">
            <FloatingChatInput
              onSendMessage={handleSendMessage}
              onVoiceStart={handleVoiceStart}
              onVoiceStop={handleVoiceStop}
              isRecording={isRecording}
              isLoading={isLoading}
              disabled={messages.length >= 25}
              placeholder={
                messages.length >= 25
                  ? "Start a new chat to continue..."
                  : "Ask Sphera AI anything..."
              }
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentTier={chatStats?.tier || 'explorer'}
        onUpgrade={async (tierId) => {
          console.log('Upgrade to:', tierId);
          // TODO: Implement Stripe checkout
        }}
      />

      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentChats={chatStats}
        onPurchase={async (pkg) => {
          console.log('Purchase:', pkg);
          // TODO: Implement Stripe payment
        }}
      />
    </div>
  );
};

export default ModernAIChat;
