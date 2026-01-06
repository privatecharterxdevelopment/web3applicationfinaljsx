import React, { useState, useEffect, useRef, useCallback } from 'react';

// Typing Text Effect Component - Smooth character-by-character streaming like ChatGPT
const TypingText = ({ text, speed = 15, onComplete, renderAfterComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef(null);
  const hasCompletedRef = useRef(false);
  const textRef = useRef(text);
  const onCompleteRef = useRef(onComplete);

  // Keep refs updated without triggering re-renders
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Only reset animation when TEXT actually changes
  useEffect(() => {
    // Skip if text hasn't changed
    if (textRef.current === text && displayedText) {
      return;
    }
    textRef.current = text;

    // Reset state when text changes
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;
    hasCompletedRef.current = false;

    if (!text) {
      setIsComplete(true);
      return;
    }

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        // Add next character(s) - batch for smoother feel
        const charsToAdd = Math.min(3, text.length - indexRef.current); // Add 1-3 chars at a time
        const nextText = text.slice(0, indexRef.current + charsToAdd);
        indexRef.current += charsToAdd;

        setDisplayedText(nextText);

        // Continue typing
        timeoutRef.current = setTimeout(typeNextChar, speed);
      } else {
        // Typing complete
        setDisplayedText(text);
        setIsComplete(true);

        if (!hasCompletedRef.current && onCompleteRef.current) {
          hasCompletedRef.current = true;
          setTimeout(() => onCompleteRef.current?.(), 100);
        }
      }
    };

    // Start typing after a small delay
    timeoutRef.current = setTimeout(typeNextChar, 50);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed]); // Removed onComplete from dependencies

  return (
    <div className="text-sm leading-relaxed overflow-hidden">
      <p className="whitespace-pre-line break-words">
        {displayedText}
        {!isComplete && (
          <span className="inline-block w-0.5 h-4 bg-emerald-500 ml-0.5 animate-pulse align-middle" />
        )}
      </p>
      {isComplete && renderAfterComplete && renderAfterComplete()}
    </div>
  );
};

export default TypingText;
