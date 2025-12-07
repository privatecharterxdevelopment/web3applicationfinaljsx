import React, { useState, useEffect } from 'react';

/**
 * Monochromatic loading animation for Sphera AI
 * Clean, minimal design with subtle animations
 */
const LoadingMessage = ({ stage = 'thinking' }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Define loading stages with their messages
  const loadingStages = {
    searching: [
      'Searching options',
      'Checking availability',
      'Finding routes',
      'Analyzing prices'
    ],
    thinking: [
      'Thinking',
      'Processing',
      'Analyzing'
    ],
    generating: [
      'Generating results',
      'Preparing response',
      'Finalizing'
    ],
    booking: [
      'Preparing booking',
      'Checking availability',
      'Calculating'
    ],
    saving: [
      'Saving',
      'Syncing'
    ]
  };

  const messages = loadingStages[stage] || loadingStages.thinking;

  // Cycle through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, [messages.length]);

  return (
    <div className="flex items-center gap-3">
      {/* Monochromatic pulsing dots */}
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse-dot-1"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot-2"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse-dot-3"></div>
      </div>

      {/* Status message - clean typography */}
      <span className="text-sm text-gray-600 font-medium tracking-tight">
        {messages[currentMessageIndex]}
      </span>

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-pulse-dot-1 {
          animation: pulse-dot 1.4s ease-in-out infinite;
        }
        .animate-pulse-dot-2 {
          animation: pulse-dot 1.4s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        .animate-pulse-dot-3 {
          animation: pulse-dot 1.4s ease-in-out infinite;
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
};

export default LoadingMessage;
