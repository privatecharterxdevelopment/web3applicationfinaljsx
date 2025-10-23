import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, X, Circle } from 'lucide-react';

const FloatingChatInput = ({
  onSendMessage,
  onVoiceStart,
  onVoiceStop,
  isRecording = false,
  isLoading = false,
  disabled = false,
  placeholder = "Ask Sphera AI anything..."
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!message.trim() || isLoading || disabled) return;

    onSendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      onVoiceStop?.();
    } else {
      onVoiceStart?.();
    }
  };

  return (
    <div className="px-6 py-3">
      <div className={`max-w-4xl mx-auto transition-all duration-300 ${
        isFocused ? 'scale-[1.01]' : 'scale-100'
      }`}>
        {/* Compact Floating Input Bar */}
        <div className={`relative bg-white rounded-xl transition-all duration-300 ${
          isFocused
            ? 'shadow-lg border-2 border-black/20'
            : 'shadow-sm border border-black/10 hover:border-black/15'
        }`}>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                <Circle size={6} className="fill-white animate-pulse" />
                <span className="text-[10px] font-light">Recording...</span>
              </div>
            </div>
          )}

          {/* Compact Input Container */}
          <div className="flex items-center gap-2 px-4 py-2.5">

            {/* Compact Voice Button */}
            <button
              type="button"
              onClick={toggleRecording}
              disabled={disabled}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : disabled
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black'
              }`}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? (
                <X size={14} strokeWidth={1.5} />
              ) : (
                <Mic size={14} strokeWidth={1.5} />
              )}
            </button>

            {/* Compact Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled || isRecording}
              placeholder={isRecording ? 'Listening...' : placeholder}
              className={`flex-1 bg-transparent border-none outline-none text-sm font-light placeholder-gray-400 transition-all ${
                disabled || isRecording ? 'text-gray-400 cursor-not-allowed' : 'text-black'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />

            {/* Compact Send Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!message.trim() || isLoading || disabled}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                message.trim() && !isLoading && !disabled
                  ? 'bg-black text-white hover:bg-gray-800 scale-100'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed scale-95'
              }`}
              title="Send message"
            >
              <Send size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Compact Helper Text - removed to save space */}
      </div>
    </div>
  );
};

export default FloatingChatInput;
