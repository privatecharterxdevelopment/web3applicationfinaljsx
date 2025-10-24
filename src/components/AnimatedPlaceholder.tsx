import React, { useState, useEffect } from 'react';

const placeholders = [
  "What's your next destination?",
  "Ask our AI to help you organize everything smoothly",
  "Searching for sunshine?",
  "Use our integrated AI for multi-charter options",
  "Enjoy the world's first travel designer fully customizable"
];

export const AnimatedPlaceholder: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const typingSpeed = 50; // Speed for typing
    const deletingSpeed = 30; // Speed for deleting
    const pauseDuration = 2000; // How long to pause when text is complete

    let timeout: NodeJS.Timeout;

    if (!isDeleting && currentText === placeholders[placeholderIndex]) {
      // Text is complete, pause before deleting
      timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && currentText === '') {
      // Finished deleting, move to next placeholder
      setIsDeleting(false);
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    } else {
      const target = placeholders[placeholderIndex];
      timeout = setTimeout(() => {
        if (isDeleting) {
          setCurrentText(prev => prev.slice(0, -1));
        } else {
          setCurrentText(target.slice(0, currentText.length + 1));
        }
      }, isDeleting ? deletingSpeed : typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [placeholderIndex, currentText, isDeleting]);

  return (
    <span className={className}>
      {currentText}
    </span>
  );
};