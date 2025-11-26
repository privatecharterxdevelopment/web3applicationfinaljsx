import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { supportTicketService } from '../../services/supportTicketService';
import { supabase } from '../../lib/supabase';

export default function ChatWidget() {
  const [userInfo, setUserInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! Welcome to PrivateCharterX. How can we assist you today?",
      sender: 'support',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [emailSent, setEmailSent] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
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

  // Check if we're on taxi/concierge page or AI chat page and hide widget
  useEffect(() => {
    const checkHidePage = () => {
      const taxiPage = document.querySelector('.taxi-concierge-page');
      const aiChatPage = document.querySelector('.ai-chat-page');
      setShouldHide(!!(taxiPage || aiChatPage));
    };

    checkHidePage();

    // Use MutationObserver to detect when taxi or AI chat page is loaded
    const observer = new MutationObserver(checkHidePage);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

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

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setChatHistory(prev => [...prev, newMessage]);
    const currentInput = inputMessage;
    setInputMessage('');

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

    // Auto-response based on keywords
    setTimeout(() => {
      let responseText = "Thank you for your message! Our team has been notified and will get back to you shortly. In the meantime, feel free to continue chatting or check our Help Center for quick answers.";

      const lowerInput = currentInput.toLowerCase();
      if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('quote')) {
        responseText = "For pricing inquiries, please submit a quote request through our platform. Our team will provide a personalized quote within 24 hours. Is there anything specific you'd like to know about our services?";
      } else if (lowerInput.includes('book') || lowerInput.includes('charter') || lowerInput.includes('flight')) {
        responseText = "Great! To book a charter, you can use our booking form or request a quote. Our concierge team is available to assist with your travel needs. What destination are you considering?";
      } else if (lowerInput.includes('payment') || lowerInput.includes('crypto') || lowerInput.includes('usdc')) {
        responseText = "We accept various payment methods including crypto (USDC, ETH) and traditional payments. All transactions are secured through our escrow system. Would you like more details about our payment process?";
      } else if (lowerInput.includes('help') || lowerInput.includes('support')) {
        responseText = "I'm here to help! You can also check our Help Center for FAQs, or our team will respond to your inquiry via email. What specific assistance do you need?";
      }

      const supportResponse = {
        id: messages.length + 2,
        text: responseText,
        sender: 'support',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, supportResponse]);
    }, 1500);
  };

  const toggleChat = () => {
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

  // Don't render anything if on taxi/concierge page
  if (shouldHide) {
    return null;
  }

  return (
    <div className="absolute bottom-[50px] right-[120px] z-[9999] flex flex-col items-end">
      {/* Chat Window - Smaller Square */}
      {isOpen && (
        <div className="mb-2 w-[280px] h-[320px] transition-all duration-300 ease-out">
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

      {/* Chat Button - Simple "Need Help?" Text */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="group relative px-3 py-2 bg-black border border-white/20 rounded-lg shadow-lg hover:bg-gray-900 transition-all duration-300 hover:scale-105"
          aria-label="Open chat"
        >
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
      `}</style>
    </div>
  );
}
