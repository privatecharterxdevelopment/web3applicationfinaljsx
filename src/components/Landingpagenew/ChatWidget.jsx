import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { supportTicketService } from '../../services/supportTicketService';
import { supabase } from '../../lib/supabase';

export default function ChatWidget({ isVisible = false, onClose = null, embedded = false }) {
  const [userInfo, setUserInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(embedded ? true : false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationSaved, setConversationSaved] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch user profile for additional info
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('phone, name')
            .eq('user_id', user.id)
            .single();

          setUserInfo({
            id: user.id,
            email: user.email,
            name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0],
            phone: profile?.phone || user.user_metadata?.phone || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    fetchUserInfo();
  }, []);

  // Load chat messages from database when user is available
  useEffect(() => {
    if (userInfo?.id) {
      loadChatMessages();
      subscribeToMessages();
    }
  }, [userInfo?.id]);

  const loadChatMessages = async () => {
    if (!userInfo?.id) return;

    try {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userInfo.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(data.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender_type === 'user' ? 'user' : 'support',
          timestamp: new Date(msg.created_at),
          adminName: msg.admin_name
        })));
      } else {
        // Show welcome message if no messages
        setMessages([{
          id: 'welcome',
          text: "Hello! Welcome to PrivateCharterX. How can we assist you today?",
          sender: 'support',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
      // Show welcome message on error
      setMessages([{
        id: 'welcome',
        text: "Hello! Welcome to PrivateCharterX. How can we assist you today?",
        sender: 'support',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const subscribeToMessages = () => {
    if (!userInfo?.id) return;

    const subscription = supabase
      .channel(`chat_messages_${userInfo.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userInfo.id}`
      }, payload => {
        const newMsg = payload.new;
        // Only add if it's from admin (user messages are added immediately)
        if (newMsg.sender_type === 'admin') {
          setMessages(prev => [...prev, {
            id: newMsg.id,
            text: newMsg.content,
            sender: 'support',
            timestamp: new Date(newMsg.created_at),
            adminName: newMsg.admin_name
          }]);
          // Increment unread count if chat is closed
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const saveChatMessage = async (content, senderType) => {
    if (!userInfo?.id) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: userInfo.id,
          content: content,
          sender_type: senderType
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving chat message:', error);
      return null;
    }
  };

  // When opened in embedded mode, set isOpen to true when isVisible changes
  useEffect(() => {
    if (embedded && isVisible) {
      setIsOpen(true);
    }
  }, [embedded, isVisible]);

  // Function to save the entire conversation as a support request
  const saveConversationAsRequest = async () => {
    if (!userInfo?.id || conversationSaved) return;

    try {
      // Get all user messages from the conversation
      const userMessages = messages.filter(m => m.sender === 'user');
      if (userMessages.length === 0) return;

      // Create a summary of the conversation
      const conversationSummary = messages.map(m =>
        `[${m.sender === 'user' ? 'Customer' : 'Support'}] ${m.text}`
      ).join('\n');

      // Create support ticket with full conversation
      const ticketData = {
        user_id: userInfo.id,
        subject: `Chat Support Request - ${userMessages[0]?.text?.substring(0, 50) || 'General Inquiry'}...`,
        message: conversationSummary,
        category: 'chat_support',
        priority: 'normal',
        status: 'open',
        user_email: userInfo.email,
        user_name: userInfo.name
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) {
        console.error('Error saving support request:', error);
        return;
      }

      console.log('✅ Chat conversation saved as support ticket:', data.id);
      setConversationSaved(true);

      // Send email notification with full conversation summary
      try {
        await supportTicketService.sendChatNotificationEmail({
          message: conversationSummary,
          name: userInfo.name || 'User',
          email: userInfo.email || '',
          phone: userInfo.phone || '',
          userId: userInfo.id,
          ticketId: data.id
        });
        console.log('✅ Email notification sent with chat summary');
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }

      return data;
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentInput = inputMessage;
    setInputMessage('');

    // Add message to UI immediately
    const tempMessage = {
      id: `temp-${Date.now()}`,
      text: currentInput,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempMessage]);

    // Save to database if user is logged in
    if (userInfo?.id) {
      const savedMsg = await saveChatMessage(currentInput, 'user');
      if (savedMsg) {
        // Update temp message with real ID
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, id: savedMsg.id }
            : msg
        ));
      }
    }

    // Send email notification for first message (only once per session)
    if (!emailSent && userInfo?.email) {
      try {
        await supportTicketService.sendChatNotificationEmail({
          message: currentInput,
          name: userInfo?.name || 'Guest User',
          email: userInfo?.email || '',
          phone: userInfo?.phone || '',
          userId: userInfo?.id || null
        });
        setEmailSent(true);
      } catch (error) {
        console.error('Error sending chat notification email:', error);
      }
    }

    // Auto-response only for non-logged-in users or if no admin has responded yet
    // For logged-in users, admin will respond via the admin panel
    if (!userInfo?.id) {
      setTimeout(() => {
        let responseText = "Thank you for your message! Please log in to chat with our support team, or our team will reach out to you via email.";

        const lowerInput = currentInput.toLowerCase();
        if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('quote')) {
          responseText = "For pricing inquiries, please log in and submit a quote request. Our team will provide a personalized quote within 24 hours.";
        } else if (lowerInput.includes('book') || lowerInput.includes('charter') || lowerInput.includes('flight')) {
          responseText = "Great! To book a charter, please log in and use our booking form. Our concierge team is available to assist with your travel needs.";
        } else if (lowerInput.includes('help') || lowerInput.includes('support')) {
          responseText = "I'm here to help! Please log in to chat with our support team, or check our Help Center for FAQs.";
        }

        const supportResponse = {
          id: `auto-${Date.now()}`,
          text: responseText,
          sender: 'support',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, supportResponse]);
      }, 1500);
    }
  };

  const toggleChat = () => {
    if (!isOpen) {
      // Clear unread count when opening chat
      setUnreadCount(0);
    } else {
      // When closing chat, save conversation as support request
      if (messages.filter(m => m.sender === 'user').length > 0) {
        saveConversationAsRequest();
      }
      // Call onClose callback if provided (for embedded mode)
      if (onClose) {
        onClose();
      }
    }
    setIsOpen(!isOpen);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Supporter images
  const supporterImages = [
    'https://i.pravatar.cc/150?img=33',
    'https://i.pravatar.cc/150?img=47',
    'https://i.pravatar.cc/150?img=32',
    'https://i.pravatar.cc/150?img=28'
  ];

  // If not in embedded mode and not explicitly visible, don't render
  // This effectively hides the chat button from everywhere unless triggered
  if (!embedded && !isVisible && !isOpen) {
    return null;
  }

  return (
    <div className={`${embedded ? 'relative w-full h-full' : 'fixed bottom-6 right-6 z-[9999]'} flex flex-col items-end`}>
      {/* Chat Window */}
      {isOpen && (
        <div className={`${embedded ? 'w-full h-full' : 'mb-2 w-[280px] h-[320px]'} transition-all duration-300 ease-out`}>
          {/* Glassmorphic Container */}
          <div className="relative w-full h-full backdrop-blur-xl bg-gradient-to-br from-black/80 via-black/70 to-black/60 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50 animate-gradient" />

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay">
              <svg className="w-full h-full">
                <filter id="noise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noise)" />
              </svg>
            </div>

            {/* Header with Supporter Images */}
            <div className="relative z-10 px-3 py-2.5 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <h3 className="text-white font-medium text-xs">Support Team</h3>
                </div>
                <button
                  onClick={toggleChat}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>
              {/* Supporter Images */}
              <div className="flex items-center gap-1">
                {supporterImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Support team member ${index + 1}`}
                    className="w-6 h-6 rounded-full border border-white/30 object-cover"
                  />
                ))}
                <span className="text-white/50 text-[10px] ml-1">Online now</span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="relative z-10 overflow-y-auto px-3 py-3 space-y-2 h-[calc(100%-145px)] custom-scrollbar">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.sender === 'user'
                        ? 'bg-white/90 text-black'
                        : 'bg-white/10 backdrop-blur-sm text-white'
                    } rounded-xl px-3 py-2 shadow-lg`}
                  >
                    <p className="text-xs leading-relaxed">{message.text}</p>
                    <p className={`text-[9px] mt-0.5 ${
                      message.sender === 'user' ? 'text-black/50' : 'text-white/40'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative z-10 px-3 py-2.5 border-t border-white/10">
              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-xs placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-white/90 hover:bg-white disabled:bg-white/30 disabled:cursor-not-allowed text-black rounded-lg transition-all duration-200 flex-shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button - Only show when NOT in embedded mode */}
      {!isOpen && !embedded && (
        <button
          onClick={toggleChat}
          className="group relative px-3 py-2 bg-black border border-white/20 rounded-lg shadow-lg hover:bg-gray-900 transition-all duration-300 hover:scale-105"
          aria-label="Open chat"
        >
          {/* Notification Badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center animate-bounce-subtle">
              <span className="text-white text-[10px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </div>
          )}
          {/* Text with Icon */}
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-medium">Need Help?</span>
          </div>
        </button>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-gradient {
          animation: gradient 3s ease-in-out infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
