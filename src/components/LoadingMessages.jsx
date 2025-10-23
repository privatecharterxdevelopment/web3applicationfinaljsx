import React, { useState, useEffect } from 'react';

// Elegant 3-dot loading animation
export const ThreeDotsLoader = () => {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1400ms' }} />
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '200ms', animationDuration: '1400ms' }} />
      <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" style={{ animationDelay: '400ms', animationDuration: '1400ms' }} />
    </div>
  );
};

// Rotating loading messages
export const TypingIndicator = () => {
  const messages = [
    'Loading...',
    'Collecting best offers...',
    'Sphera is thinking...',
    'Searching database...',
    'Analyzing options...',
    'Ready for boarding...'
  ];

  const [currentMessage, setCurrentMessage] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Rotate message every 2 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 2000);

    // Animate dots every 500ms
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <ThreeDotsLoader />
      <span className="text-sm text-gray-500 font-light">
        {messages[currentMessage]}{dots}
      </span>
    </div>
  );
};

// Smooth fade-in message animation
export const MessageFadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  );
};

// Limit reached overlay
export const LimitReachedMessage = ({ onUpgrade, onTopUp, chatsRemaining = 0 }) => {
  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white border border-black/10 rounded-2xl p-8 shadow-lg">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-black/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-black/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Message */}
          <h3 className="text-xl font-light text-black text-center mb-3">
            Chat Limit Reached
          </h3>
          <p className="text-sm text-gray-500 text-center mb-8 font-light leading-relaxed">
            {chatsRemaining === 0 ? (
              <>
                You've used all your chats this month.<br/>
                Upgrade your plan or purchase more chats to continue using Sphera AI.
              </>
            ) : (
              <>
                You have {chatsRemaining} chat{chatsRemaining !== 1 ? 's' : ''} remaining.<br/>
                Consider upgrading for unlimited access.
              </>
            )}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full py-3 px-6 bg-black text-white rounded-xl font-light text-sm hover:bg-gray-800 transition-all duration-300 border border-black"
            >
              Upgrade Plan
            </button>
            <button
              onClick={onTopUp}
              className="w-full py-3 px-6 bg-white text-black rounded-xl font-light text-sm hover:bg-gray-50 transition-all duration-300 border border-black/20"
            >
              Buy More Chats
            </button>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-400 text-center mt-6 font-light">
            Plans start at $29/month for 10 conversations
          </p>
        </div>
      </div>
    </div>
  );
};

export default {
  ThreeDotsLoader,
  TypingIndicator,
  MessageFadeIn,
  LimitReachedMessage
};
