import React, { useState, useEffect } from 'react';

/**
 * Aviation-themed loading animation for Sphera AI
 * Shows a flying plane animation with status messages
 */
const LoadingMessage = ({ stage = 'searching' }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Define loading stages with their messages
  const loadingStages = {
    searching: [
      'Searching flight options',
      'Checking availability',
      'Finding best routes',
      'Analyzing prices'
    ],
    thinking: [
      'Processing request',
      'Analyzing options',
      'Preparing response'
    ],
    generating: [
      'Generating results',
      'Preparing recommendations',
      'Finalizing details'
    ],
    booking: [
      'Preparing booking',
      'Checking availability',
      'Calculating pricing'
    ],
    saving: [
      'Saving changes',
      'Syncing data'
    ]
  };

  const messages = loadingStages[stage] || loadingStages.searching;

  // Cycle through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(messageInterval);
  }, [messages.length]);

  return (
    <div className="flex items-center gap-3">
      {/* Aviation-themed plane animation */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Plane icon that moves side to side */}
        <svg
          className="w-5 h-5 text-gray-600 animate-plane-fly"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
        {/* Trail effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-trail opacity-50"></div>
        </div>
      </div>

      {/* Status message */}
      <span className="text-sm text-gray-600 font-medium">
        {messages[currentMessageIndex]}
        <span className="inline-flex ml-1">
          <span className="animate-dot-1">.</span>
          <span className="animate-dot-2">.</span>
          <span className="animate-dot-3">.</span>
        </span>
      </span>

      {/* CSS for animations */}
      <style>{`
        @keyframes plane-fly {
          0%, 100% { transform: translateX(-2px) rotate(-5deg); }
          50% { transform: translateX(2px) rotate(5deg); }
        }
        @keyframes trail {
          0%, 100% { opacity: 0.3; transform: scaleX(0.5); }
          50% { opacity: 0.6; transform: scaleX(1); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
        .animate-plane-fly {
          animation: plane-fly 1.5s ease-in-out infinite;
        }
        .animate-trail {
          animation: trail 1.5s ease-in-out infinite;
        }
        .animate-dot-1 {
          animation: dot-bounce 1.4s infinite;
          animation-delay: 0s;
        }
        .animate-dot-2 {
          animation: dot-bounce 1.4s infinite;
          animation-delay: 0.2s;
        }
        .animate-dot-3 {
          animation: dot-bounce 1.4s infinite;
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
};

export default LoadingMessage;
