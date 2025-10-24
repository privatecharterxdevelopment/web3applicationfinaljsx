import React, { useState, useEffect } from 'react';

/**
 * Claude-style loading message with animated status updates
 * Shows progressive status messages while AI is thinking
 */
const LoadingMessage = ({ stage = 'searching' }) => {
  const [currentDots, setCurrentDots] = useState(1);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Define loading stages with their messages
  const loadingStages = {
    searching: [
      'Analyzing your request',
      'Searching databases',
      'Checking availability',
      'Finding best options'
    ],
    generating: [
      'Processing results',
      'Generating response',
      'Preparing recommendations',
      'Finalizing details'
    ],
    booking: [
      'Preparing booking',
      'Checking availability',
      'Calculating pricing',
      'Creating reservation'
    ],
    events: [
      'Searching events',
      'Checking Ticketmaster',
      'Checking Eventbrite',
      'Compiling results'
    ]
  };

  const messages = loadingStages[stage] || loadingStages.searching;

  // Animate dots (1, 2, 3, repeat)
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setCurrentDots(prev => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  // Cycle through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, 1500);

    return () => clearInterval(messageInterval);
  }, [messages.length]);

  const getDots = () => '.'.repeat(currentDots);

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          {/* Animated pulse indicator */}
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>

          {/* Animated message */}
          <p className="text-sm leading-relaxed">
            <span className="font-medium">{messages[currentMessageIndex]}</span>
            <span className="text-blue-600 font-semibold">{getDots()}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingMessage;
