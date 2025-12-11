import React, { useState, useEffect, useRef } from 'react';

// Typing Text Effect Component - Smooth word-by-word streaming like ChatGPT
const TypingText = ({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const requestRef = useRef();
  const startTimeRef = useRef();
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  // Keep onComplete ref updated without triggering re-animation
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset animation state when text changes
    setDisplayedText('');
    setIsComplete(false);
    startTimeRef.current = null;
    hasCompletedRef.current = false;

    // Split text into words for smoother typing
    const words = text.split(/(\s+)/); // Keep whitespace

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      // Calculate how many characters should be shown based on elapsed time
      const baseCharsToShow = Math.floor(elapsed / speed);

      // Build the displayed text
      let charsShown = 0;
      let result = '';

      for (let i = 0; i < words.length && charsShown < baseCharsToShow; i++) {
        const word = words[i];
        const remainingChars = baseCharsToShow - charsShown;

        if (remainingChars >= word.length) {
          result += word;
          charsShown += word.length;
        } else {
          result += word.slice(0, remainingChars);
          charsShown += remainingChars;
        }
      }

      setDisplayedText(result);

      if (result.length < text.length) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedText(text);
        setIsComplete(true);
        // Only call onComplete once
        if (!hasCompletedRef.current && onCompleteRef.current) {
          hasCompletedRef.current = true;
          setTimeout(() => onCompleteRef.current?.(), 100);
        }
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [text, speed]); // Removed onComplete from dependencies

  return (
    <p className="text-sm leading-relaxed whitespace-pre-line">
      {displayedText}
      {!isComplete && <span className="inline-block w-0.5 h-4 bg-gray-500 ml-0.5 animate-pulse" />}
    </p>
  );
};

export default TypingText;
