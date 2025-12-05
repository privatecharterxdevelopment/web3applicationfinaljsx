// MessageBubble Component
// Renders individual chat messages with typing animation

import React, { memo, useState, useEffect, useRef } from 'react';
import { ANIMATION_DURATIONS } from '../utils/constants';

const MessageBubble = memo(function MessageBubble({
  message,
  isTyping = false,
  onTypingComplete,
  onAction,
  user
}) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(!isTyping);
  const typingRef = useRef(null);

  // Handle typing animation
  useEffect(() => {
    if (!isTyping || !message.content) {
      setDisplayedContent(message.content || '');
      setIsTypingComplete(true);
      return;
    }

    let currentIndex = 0;
    const content = message.content;

    const typeNextChar = () => {
      if (currentIndex < content.length) {
        setDisplayedContent(content.substring(0, currentIndex + 1));
        currentIndex++;
        typingRef.current = setTimeout(typeNextChar, ANIMATION_DURATIONS.TYPING);
      } else {
        setIsTypingComplete(true);
        onTypingComplete?.();
      }
    };

    typingRef.current = setTimeout(typeNextChar, ANIMATION_DURATIONS.TYPING);

    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
    };
  }, [isTyping, message.content, onTypingComplete]);

  // Loading state
  if (message.isLoading) {
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[80%]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';
  const isResults = message.role === 'results';
  const content = isTyping && !isTypingComplete ? displayedContent : (message.content || '');

  // User message
  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  // Results message (search results) - skip rendering, handled separately
  if (isResults) {
    return null;
  }

  // Assistant message with optional action buttons
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[80%]">
        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {content}
          {isTyping && !isTypingComplete && (
            <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
          )}
        </p>

        {/* Action buttons */}
        {message.action && isTypingComplete && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.action === 'confirm_booking' && message.bookingData && (
              <>
                <button
                  onClick={() => onAction?.('add_to_cart', message.bookingData)}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => onAction?.('request_changes', message.bookingData)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => onAction?.('pay_crypto', message.bookingData)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Pay with Crypto
                </button>
              </>
            )}

            {message.action === 'send_charter_request' && (
              <button
                onClick={() => onAction?.('send_request', message.requestDetails)}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
              >
                Send Charter Request
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default MessageBubble;
