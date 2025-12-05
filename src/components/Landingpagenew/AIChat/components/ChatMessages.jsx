// ChatMessages Component
// Renders message list with optional virtualization for long chats

import React, { memo, useRef, useEffect, useCallback } from 'react';
import MessageBubble from './MessageBubble';

const ChatMessages = memo(function ChatMessages({
  messages = [],
  typingMessageIndex = -1,
  assistantTyping = false,
  onTypingComplete,
  onAction,
  user,
  renderResultsMessage,
  isSearching = false,
  loadingStage = null
}) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, assistantTyping]);

  // Handle typing complete
  const handleTypingComplete = useCallback(() => {
    onTypingComplete?.();
  }, [onTypingComplete]);

  // Render loading indicator
  const renderLoading = () => {
    if (!isSearching && !assistantTyping) return null;

    return (
      <div className="flex justify-start mb-4">
        <div className="bg-gray-100 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            {loadingStage === 'searching' && (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Searching...</span>
              </>
            )}
            {!loadingStage && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!messages || messages.length === 0) {
    return (
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-center h-full text-gray-400">
          <p className="text-sm">Start a conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message, index) => {
          // Check if this is a results message (search results)
          if (message.role === 'results' && renderResultsMessage) {
            return (
              <div key={`results-${index}`}>
                {renderResultsMessage(message)}
              </div>
            );
          }

          // Skip loading messages in the list (we render them separately)
          if (message.isLoading) {
            return (
              <div key={`loading-${index}`} className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            );
          }

          // Determine if this message should show typing animation
          const isTyping = assistantTyping &&
                          index === typingMessageIndex &&
                          message.role === 'assistant';

          return (
            <MessageBubble
              key={`msg-${index}-${message.role}`}
              message={message}
              isTyping={isTyping}
              onTypingComplete={handleTypingComplete}
              onAction={onAction}
              user={user}
            />
          );
        })}

        {/* Loading indicator */}
        {renderLoading()}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

export default ChatMessages;
