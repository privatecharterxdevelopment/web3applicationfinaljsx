// ChatInput Component
// Handles message input, send button, and Break the Price button

import React, { memo, useCallback } from 'react';
import { Send, Upload } from 'lucide-react';
import { MAX_MESSAGES_PER_CHAT } from '../utils/constants';

const ChatInput = memo(function ChatInput({
  currentMessage,
  onMessageChange,
  onSendMessage,
  onBreakThePrice,
  isSearching = false,
  isProcessing = false,
  messageCount = 0,
  messageLimitReached = false,
  chatLimitReached = false,
  canUseBreakThePrice = false,
  hasUnlimitedMessages = false,
  cartItemCount = 0,
  onShowCart,
  onShowRequestForm,
  onShowSubscriptionModal
}) {
  // Handle key press
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && currentMessage.trim() && !isSearching && !isProcessing) {
      e.preventDefault();
      onSendMessage(currentMessage);
    }
  }, [currentMessage, isSearching, isProcessing, onSendMessage]);

  // Handle send click
  const handleSendClick = useCallback(() => {
    if (currentMessage.trim() && !isSearching && !isProcessing) {
      onSendMessage(currentMessage);
    }
  }, [currentMessage, isSearching, isProcessing, onSendMessage]);

  // Handle input change
  const handleChange = useCallback((e) => {
    onMessageChange(e.target.value);
  }, [onMessageChange]);

  // Chat limit reached - show upgrade prompt
  if (chatLimitReached) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            Chat limit reached. Upgrade to continue.
          </p>
          <button
            onClick={onShowSubscriptionModal}
            className="px-4 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  // Message limit reached - show options
  if (messageLimitReached) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            Message limit reached.{cartItemCount > 0 && ` ${cartItemCount} item${cartItemCount > 1 ? 's' : ''} in cart.`}
          </p>
          <div className="flex items-center gap-2">
            {cartItemCount > 0 ? (
              <>
                <button
                  onClick={onShowCart}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 transition-colors whitespace-nowrap"
                >
                  Cart ({cartItemCount})
                </button>
                <button
                  onClick={onShowRequestForm}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  Send
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onShowRequestForm}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  Send Request
                </button>
                <button
                  onClick={onShowSubscriptionModal}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200 transition-colors border border-gray-200 whitespace-nowrap"
                >
                  Upgrade
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal input
  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
      {/* Break the Price Button */}
      <button
        onClick={onBreakThePrice}
        disabled={!canUseBreakThePrice || isSearching}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          canUseBreakThePrice
            ? 'bg-gray-800 text-white hover:bg-gray-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        } disabled:opacity-50`}
        title={canUseBreakThePrice ? 'Break the Price - Upload competitor quote' : 'Upgrade to unlock Break the Price'}
      >
        <Upload size={18} />
      </button>

      {/* Text Input */}
      <input
        type="text"
        value={currentMessage}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Message Sphera..."
        disabled={isSearching || isProcessing}
        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 disabled:cursor-not-allowed"
      />

      {/* Message Counter (hide for Elite) */}
      {messageCount > 0 && !hasUnlimitedMessages && (
        <span className={`text-xs px-2 py-1 rounded-full ${
          messageCount >= MAX_MESSAGES_PER_CHAT - 3
            ? 'bg-gray-200 text-gray-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {messageCount}/{MAX_MESSAGES_PER_CHAT}
        </span>
      )}

      {/* Send Button */}
      <button
        onClick={handleSendClick}
        disabled={!currentMessage.trim() || isSearching || isProcessing}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          currentMessage.trim() && !isSearching && !isProcessing
            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:scale-110'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
        }`}
      >
        <Send size={18} />
      </button>
    </div>
  );
});

export default ChatInput;
