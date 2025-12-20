import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, Sparkles } from 'lucide-react';

/**
 * Intelligent Search Component - Clean AI-Powered Suggestions
 * Shows smart autocomplete suggestions that trigger AI Chat
 */
const IntelligentSearch = ({ onSearch, webMode = 'rws', placeholder = "I need a...", onOpenAIChat }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [typingText, setTypingText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef(null);

  // Typing animation phrases
  const typingPhrases = [
    "I need a private jet to Tokyo",
    "Show me empty legs to Dubai",
    "Book a helicopter transfer to Monaco",
    "I need a concierge in Zurich",
    "Find yacht charters in Monaco",
    "I want to tokenize my yacht",
    "I'm planning a short trip to Aspen for 3 persons",
    "I need an airport transfer from Miami to 1000 Brickell Avenue",
    "Do you have good wine recommendations for my flight from Pisa to Milan?",
    "What cryptocurrencies are accepted?",
    "I'd like to order few cigars and caviar for my flight from Atlanta to Mykonos",
    "Reserve a table at Jimmy'z Monaco",
  ];

  // Smart suggestion patterns based on user input
  const getSuggestionsForQuery = (q) => {
    const lower = q.toLowerCase().trim();
    if (!lower) return [];

    const suggestions = [];

    // Jet/Flight related
    if (lower.match(/jet|flight|fly|plane|aircraft/i)) {
      suggestions.push(
        { label: `Private jet ${lower.includes('to') ? lower : 'charter'}`, query: q },
        { label: 'Show me available empty legs', query: 'Show me available empty legs' },
        { label: 'Book a private jet for next week', query: 'I need a private jet for next week' },
      );
    }

    // Helicopter related
    if (lower.match(/heli|chopper|helicopter/i)) {
      suggestions.push(
        { label: 'Helicopter transfer to Monaco', query: 'I need a helicopter transfer to Monaco' },
        { label: 'Book a helicopter charter', query: 'I need a helicopter charter' },
      );
    }

    // Yacht related
    if (lower.match(/yacht|boat|sailing|charter/i)) {
      suggestions.push(
        { label: 'Yacht charter in Monaco', query: 'I need a yacht charter in Monaco' },
        { label: 'Mediterranean yacht rental', query: 'Show me yacht rentals in the Mediterranean' },
      );
    }

    // Empty legs
    if (lower.match(/empty|leg|deal|discount/i)) {
      suggestions.push(
        { label: 'Available empty leg flights', query: 'Show me available empty legs' },
        { label: 'Empty legs to Europe', query: 'Show me empty legs to Europe' },
      );
    }

    // Restaurant/Dining
    if (lower.match(/restaurant|table|reserv|dining|eat|food/i)) {
      suggestions.push(
        { label: 'Restaurant reservation', query: q.includes('at') ? q : 'I need a restaurant reservation' },
        { label: 'Fine dining in Monaco', query: 'Reserve a table at a fine dining restaurant in Monaco' },
      );
    }

    // Wine/Champagne
    if (lower.match(/wine|champagne|drink|beverage/i)) {
      suggestions.push(
        { label: 'Premium wines for my flight', query: 'Show me premium wines for my flight' },
        { label: 'Champagne selection', query: 'I want champagne for my flight' },
      );
    }

    // Cigars/Caviar/Delicacies
    if (lower.match(/cigar|caviar|delicac/i)) {
      suggestions.push(
        { label: 'Premium cigars and caviar', query: 'I want premium cigars and caviar for my flight' },
        { label: 'In-flight delicacies', query: 'Show me caviar and delicacies for my flight' },
      );
    }

    // Transfer/Transport
    if (lower.match(/transfer|transport|pickup|airport|car/i)) {
      suggestions.push(
        { label: 'Airport transfer', query: lower.includes('from') ? q : 'I need an airport transfer' },
        { label: 'VIP ground transport', query: 'I need VIP ground transportation' },
      );
    }

    // Concierge
    if (lower.match(/concierge|assist|help|service/i)) {
      suggestions.push(
        { label: 'Concierge assistance', query: 'I need concierge assistance' },
        { label: 'Personal travel planning', query: 'I need help planning my trip' },
      );
    }

    // Flowers/Gifts
    if (lower.match(/flower|gift|surprise|romantic/i)) {
      suggestions.push(
        { label: 'Flowers and gifts arranged', query: 'I need flowers or gifts arranged' },
        { label: 'Romantic surprise setup', query: 'I want to arrange a romantic surprise' },
      );
    }

    // Tokenization/Web3
    if (lower.match(/token|web3|crypto|nft|wallet|blockchain/i)) {
      suggestions.push(
        { label: 'Tokenize my asset', query: 'I want to tokenize my asset' },
        { label: 'Crypto payment options', query: 'What cryptocurrencies are accepted?' },
        { label: 'NFT memberships', query: 'Tell me about NFT memberships' },
      );
    }

    // Destinations
    const destinations = ['dubai', 'monaco', 'zurich', 'geneva', 'london', 'paris', 'new york', 'tokyo', 'milan', 'aspen', 'mykonos', 'ibiza'];
    const matchedDest = destinations.find(d => lower.includes(d));
    if (matchedDest) {
      const destCapital = matchedDest.charAt(0).toUpperCase() + matchedDest.slice(1);
      suggestions.push(
        { label: `Private jet to ${destCapital}`, query: `I need a private jet to ${destCapital}` },
      );
    }

    // Generic patterns
    if (lower.startsWith('i need')) {
      suggestions.push({ label: q, query: q });
    }
    if (lower.startsWith('i want')) {
      suggestions.push({ label: q, query: q });
    }
    if (lower.startsWith('show me')) {
      suggestions.push({ label: q, query: q });
    }
    if (lower.startsWith('book')) {
      suggestions.push({ label: q, query: q });
    }
    if (lower.startsWith('find')) {
      suggestions.push({ label: q, query: q });
    }

    // If no specific matches, suggest completing the query
    if (suggestions.length === 0 && lower.length > 2) {
      suggestions.push(
        { label: q, query: q },
        { label: `Help me with: ${q}`, query: `I need help with ${q}` },
      );
    }

    // Remove duplicates and limit to 5
    const unique = suggestions.filter((s, i, arr) =>
      arr.findIndex(x => x.label.toLowerCase() === s.label.toLowerCase()) === i
    );
    return unique.slice(0, 5);
  };

  // Typing animation effect
  useEffect(() => {
    if (query.length > 0 || isOpen) {
      setTypingText('');
      return;
    }

    const currentPhrase = typingPhrases[currentPhraseIndex];
    let charIndex = 0;
    let isDeleting = false;
    let animationFrame;
    let lastTime = 0;

    const TYPING_SPEED = 45;
    const DELETE_SPEED = 25;
    const PAUSE_AT_END = 2500;
    const PAUSE_BEFORE_NEXT = 400;

    const animate = (currentTime) => {
      if (!lastTime) lastTime = currentTime;
      const deltaTime = currentTime - lastTime;

      if (!isDeleting) {
        if (charIndex < currentPhrase.length) {
          if (deltaTime >= TYPING_SPEED) {
            charIndex++;
            setTypingText(currentPhrase.substring(0, charIndex));
            lastTime = currentTime;
          }
          animationFrame = requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            isDeleting = true;
            lastTime = 0;
            animationFrame = requestAnimationFrame(animate);
          }, PAUSE_AT_END);
        }
      } else {
        if (charIndex > 0) {
          if (deltaTime >= DELETE_SPEED) {
            charIndex--;
            setTypingText(currentPhrase.substring(0, charIndex));
            lastTime = currentTime;
          }
          animationFrame = requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            setCurrentPhraseIndex((prev) => (prev + 1) % typingPhrases.length);
          }, PAUSE_BEFORE_NEXT);
        }
      }
    };

    const startTimeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 800);

    return () => {
      clearTimeout(startTimeout);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [currentPhraseIndex, query, isOpen]);

  // Update suggestions when query changes
  useEffect(() => {
    if (query.trim().length > 0) {
      const newSuggestions = getSuggestionsForQuery(query);
      setSuggestions(newSuggestions);
      setSelectedIndex(0);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setSelectedIndex(0);
    }
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger AI chat with query
  const triggerAIChat = (text) => {
    setIsOpen(false);
    setQuery('');
    if (onOpenAIChat) {
      onOpenAIChat(text);
    } else if (onSearch) {
      onSearch({
        label: text,
        action: 'ai-chat',
        query: text,
        category: 'AI Chat'
      }, true);
    }
  };

  // Handle selection
  const handleSelect = (item) => {
    triggerAIChat(item.query || item.label);
  };

  // Keyboard handling
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && selectedIndex >= 0) {
        handleSelect(suggestions[selectedIndex]);
      } else if (query.trim().length > 0) {
        triggerAIChat(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      {/* Search Input + AI Button */}
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(query.length > 0)}
            onKeyDown={handleKeyDown}
            placeholder={typingText || placeholder}
            className="w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent backdrop-blur-xl bg-white/35 border-gray-300/50 text-gray-800 placeholder-gray-500 focus:ring-gray-400/50 transition-all"
          />
        </div>

        {/* Ask Sphera AI Button */}
        {query.length > 0 && (
          <button
            onClick={() => triggerAIChat(query)}
            className="flex-shrink-0 group relative px-4 py-3 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg bg-black"
          >
            <div className="relative flex items-center gap-2 text-white">
              <Sparkles size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium whitespace-nowrap">Ask Sphera AI</span>
            </div>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown - Clean and Simple */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-2xl border border-gray-200/50 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="py-1">
            {suggestions.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelect(item)}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-left ${
                  index === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-800">{item.label}</span>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center">
              Press Enter to ask Sphera AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentSearch;
