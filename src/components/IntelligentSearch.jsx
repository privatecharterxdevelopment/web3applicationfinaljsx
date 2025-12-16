import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, Sparkles, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Intelligent Search Component with Perplexity-Style Autocomplete
 * Features: Progressive word suggestions, natural language queries, glassmorphic dropdown, actual offers display
 */
const IntelligentSearch = ({ onSearch, webMode = 'rws', placeholder = "I need a...", onOpenAIChat }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [typingText, setTypingText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [actualOffers, setActualOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const searchRef = useRef(null);

  // Typing animation phrases - varied starters
  const typingPhrases = [
    "I need a private jet to Tokyo",
    "Show me empty legs to Dubai",
    "Book a helicopter transfer to Monaco",
    "I need a concierge in Zurich",
    "Find yacht charters in Monaco",
    "I want to tokenize my yacht",
    "Show me premium cigars for my flight",
    "I need CO2 offset for my trip",
  ];

  // Natural language query patterns (Perplexity style)
  const queryPatterns = [
    // "I need..." patterns
    { pattern: /^i\s*ne/i, suggestions: [
      { label: 'I need a private jet from Zurich to Dubai', icon: '✈️', category: 'Complete this...', action: 'ai-chat', query: 'I need a private jet from Zurich to Dubai' },
      { label: 'I need a private jet for next week', icon: '✈️', category: 'Complete this...', action: 'ai-chat', query: 'I need a private jet for next week' },
      { label: 'I need a helicopter transfer', icon: '🚁', category: 'Complete this...', action: 'ai-chat', query: 'I need a helicopter transfer' },
      { label: 'I need a yacht charter', icon: '🛥️', category: 'Complete this...', action: 'ai-chat', query: 'I need a yacht charter' },
    ]},
    { pattern: /^i\s*need\s*a\s*/i, suggestions: [
      { label: 'I need a private jet', icon: '✈️', category: 'Complete this...', action: 'ai-chat', query: 'I need a private jet' },
      { label: 'I need a helicopter', icon: '🚁', category: 'Complete this...', action: 'ai-chat', query: 'I need a helicopter' },
      { label: 'I need a yacht', icon: '🛥️', category: 'Complete this...', action: 'ai-chat', query: 'I need a yacht charter' },
      { label: 'I need ground transport', icon: '🚐', category: 'Complete this...', action: 'ai-chat', query: 'I need ground transportation' },
    ]},
    // "I want..." patterns
    { pattern: /^i\s*wa/i, suggestions: [
      { label: 'I want to tokenize my jet', icon: '💎', category: 'Complete this...', action: 'ai-chat', query: 'I want to tokenize my jet' },
      { label: 'I want to buy NFT membership', icon: '🎫', category: 'Complete this...', action: 'ai-chat', query: 'I want to buy NFT membership' },
      { label: 'I want to offset CO2 emissions', icon: '🌱', category: 'Complete this...', action: 'ai-chat', query: 'I want to offset CO2 emissions' },
      { label: 'I want premium cigars for my flight', icon: '🚬', category: 'Complete this...', action: 'ai-chat', query: 'I want premium cigars for my flight' },
    ]},
    // "Show me..." patterns
    { pattern: /^sh/i, suggestions: [
      { label: 'Show me empty leg flights', icon: '🛫', category: 'Complete this...', action: 'ai-chat', query: 'Show me empty leg flights' },
      { label: 'Show me available jets', icon: '✈️', category: 'Complete this...', action: 'ai-chat', query: 'Show me available jets' },
      { label: 'Show me yacht charters', icon: '🛥️', category: 'Complete this...', action: 'ai-chat', query: 'Show me yacht charters' },
      { label: 'Show me premium wines', icon: '🍷', category: 'Complete this...', action: 'ai-chat', query: 'Show me premium wines' },
    ]},
    // "Book..." patterns
    { pattern: /^bo/i, suggestions: [
      { label: 'Book a private jet', icon: '✈️', category: 'Complete this...', action: 'ai-chat', query: 'Book a private jet' },
      { label: 'Book a helicopter', icon: '🚁', category: 'Complete this...', action: 'ai-chat', query: 'Book a helicopter' },
      { label: 'Book a yacht charter', icon: '🛥️', category: 'Complete this...', action: 'ai-chat', query: 'Book a yacht charter' },
      { label: 'Book ground transport', icon: '🚐', category: 'Complete this...', action: 'ai-chat', query: 'Book ground transportation' },
    ]},
    // "Find..." patterns
    { pattern: /^fi/i, suggestions: [
      { label: 'Find flights to Dubai', icon: '✈️', category: 'Complete this...', action: 'ai-chat', query: 'Find flights to Dubai' },
      { label: 'Find empty legs', icon: '🛫', category: 'Complete this...', action: 'ai-chat', query: 'Find empty legs' },
      { label: 'Find yacht charters', icon: '🛥️', category: 'Complete this...', action: 'ai-chat', query: 'Find yacht charters' },
    ]},
  ];

  // All available services - RWS & Web3.0 (aligned with AI Chat categories)
  const allServices = {
    rwsServices: [
      { label: 'Break the Price', category: 'Services', action: 'ai-chat', query: 'I want to beat a price quote', highlight: true },
      { label: 'Private Jets', category: 'Services', action: 'ai-chat', query: 'I need a private jet' },
      { label: 'Empty Legs', category: 'Services', action: 'ai-chat', query: 'Show me available empty legs' },
      { label: 'Helicopters', category: 'Services', action: 'ai-chat', query: 'I need a helicopter transfer' },
      { label: 'Yachts', category: 'Services', action: 'ai-chat', query: 'I need a yacht charter' },
      { label: 'Ground Transport', category: 'Services', action: 'ai-chat', query: 'I need ground transportation' },
      { label: 'CO2 / SAF Certificates', category: 'Services', action: 'ai-chat', query: 'I want to offset my CO2 emissions' },
      { label: 'Concierge Service', category: 'Services', action: 'ai-chat', query: 'I need concierge assistance' },
    ],
    extrasServices: [
      { label: 'Premium Wines', category: 'In-Flight & Extras', action: 'ai-chat', query: 'Show me premium wines for my flight' },
      { label: 'Champagne', category: 'In-Flight & Extras', action: 'ai-chat', query: 'I want champagne for my flight' },
      { label: 'Premium Cigars', category: 'In-Flight & Extras', action: 'ai-chat', query: 'I want premium cigars' },
      { label: 'Caviar & Delicacies', category: 'In-Flight & Extras', action: 'ai-chat', query: 'Show me caviar and delicacies' },
      { label: 'Flowers & Gifts', category: 'In-Flight & Extras', action: 'ai-chat', query: 'I need flowers or gifts arranged' },
    ],
    web3Services: [
      { label: 'Tokenize Assets', category: 'Web3.0 Services', action: 'ai-chat', query: 'I want to tokenize my asset' },
      { label: 'View Tokenized Assets', category: 'Web3.0 Services', action: 'ai-chat', query: 'Show me tokenized assets' },
      { label: 'Token Swap', category: 'Web3.0 Services', action: 'ai-chat', query: 'I want to swap tokens' },
      { label: 'NFT Memberships', category: 'Web3.0 Services', action: 'ai-chat', query: 'Tell me about NFT memberships' },
      { label: 'Launchpad', category: 'Web3.0 Services', action: 'ai-chat', query: 'Show me the launchpad projects' },
      { label: 'Connect Wallet', category: 'Web3.0 Services', action: 'wallet-nfts' },
    ],
    destinations: [
      { label: 'Zurich', category: 'Popular Destinations', action: 'ai-chat', query: 'I need a flight to Zurich' },
      { label: 'Geneva', category: 'Popular Destinations', action: 'ai-chat', query: 'I need a flight to Geneva' },
      { label: 'London', category: 'Popular Destinations', action: 'ai-chat', query: 'I need a flight to London' },
      { label: 'Paris', category: 'Popular Destinations', action: 'ai-chat', query: 'I need a flight to Paris' },
      { label: 'Dubai', category: 'Popular Destinations', action: 'ai-chat', query: 'I need a flight to Dubai' },
      { label: 'New York', category: 'Popular Destinations', action: 'ai-chat', query: 'I need a flight to New York' },
      { label: 'Monaco', category: 'Popular Destinations', action: 'ai-chat', query: 'I need a flight to Monaco' },
      { label: 'Milan', category: 'Popular Destinations', action: 'ai-chat', query: 'I need a flight to Milan' },
    ],
    aircraft: [
      { label: 'Gulfstream G650', category: 'Popular Aircraft', action: 'ai-chat', query: 'I need a Gulfstream G650' },
      { label: 'Bombardier Global 7500', category: 'Popular Aircraft', action: 'ai-chat', query: 'I need a Bombardier Global 7500' },
      { label: 'Citation X', category: 'Popular Aircraft', action: 'ai-chat', query: 'I need a Citation X' },
      { label: 'Phenom 300', category: 'Popular Aircraft', action: 'ai-chat', query: 'I need a Phenom 300' },
    ],
  };

  // Combine all suggestions based on mode
  const getAllSuggestions = () => {
    let all = [...allServices.destinations, ...allServices.aircraft];
    if (webMode === 'rws') {
      all = [...allServices.rwsServices, ...allServices.extrasServices, ...all];
    } else {
      all = [...allServices.web3Services, ...all];
    }
    return all;
  };

  // Load recent searches
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent.slice(0, 3));
  }, []);

  // Typing animation effect - smoother word-by-word delete
  useEffect(() => {
    // Only run animation if input is empty and not focused
    if (query.length > 0 || isOpen) {
      setTypingText('');
      return;
    }

    const currentPhrase = typingPhrases[currentPhraseIndex];
    let charIndex = 0;
    let isDeleting = false;
    let timeout;

    const type = () => {
      if (!isDeleting) {
        // Typing forward
        if (charIndex < currentPhrase.length) {
          setTypingText(currentPhrase.substring(0, charIndex + 1));
          charIndex++;
          timeout = setTimeout(type, 80 + Math.random() * 40); // Random typing speed
        } else {
          // Pause at end before deleting
          timeout = setTimeout(() => {
            isDeleting = true;
            type();
          }, 2000);
        }
      } else {
        // Deleting backward - word by word for smoother look
        if (charIndex > 0) {
          const remaining = currentPhrase.substring(0, charIndex);
          const words = remaining.split(' ');

          // Delete entire last word at once for smoother effect
          if (words.length > 1 && !remaining.endsWith(' ')) {
            const lastWordStart = remaining.lastIndexOf(' ') + 1;
            setTypingText(currentPhrase.substring(0, lastWordStart));
            charIndex = lastWordStart;
            timeout = setTimeout(type, 150); // Pause between word deletes
          } else {
            // Delete single character (space or last word)
            setTypingText(currentPhrase.substring(0, charIndex - 1));
            charIndex--;
            timeout = setTimeout(type, 50);
          }
        } else {
          // Move to next phrase
          setCurrentPhraseIndex((prev) => (prev + 1) % typingPhrases.length);
          isDeleting = false;
          timeout = setTimeout(type, 300);
        }
      }
    };

    timeout = setTimeout(type, 1000); // Initial delay

    return () => clearTimeout(timeout);
  }, [currentPhraseIndex, query, isOpen]);

  // Fetch actual offers from database - All PrivateCharterX services
  const fetchActualOffers = async (searchQuery) => {
    setLoadingOffers(true);
    try {
      // Extract meaningful keywords from the query (remove common words, limit length)
      const stopWords = ['i', 'need', 'want', 'a', 'an', 'the', 'to', 'from', 'for', 'in', 'on', 'at', 'with', 'and', 'or', 'please', 'can', 'you', 'me', 'my', 'private'];
      const keywords = searchQuery
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word))
        .slice(0, 3); // Max 3 keywords

      // If no keywords, just fetch some results without filter
      const hasKeywords = keywords.length > 0;
      const searchKeyword = keywords[0] || ''; // Use first keyword for search

      // Search jets - no text filter (table may not have searchable columns)
      const { data: jets } = await supabase.from('jets').select('*').limit(3);

      // Search empty legs - use location keywords if available
      let emptyLegsQuery = supabase.from('EmptyLegs_').select('*').limit(3);
      if (hasKeywords) {
        const locationKeyword = keywords.find(k => k.length >= 3) || '';
        if (locationKeyword) {
          emptyLegsQuery = supabase
            .from('EmptyLegs_')
            .select('*')
            .or(`from_city.ilike.%${locationKeyword}%,to_city.ilike.%${locationKeyword}%`)
            .limit(3);
        }
      }
      const { data: emptyLegs } = await emptyLegsQuery;

      // Search helicopters - no text filter (table may not have searchable columns)
      const { data: helicopters } = await supabase.from('helicopter_charters').select('*').limit(3);

      // Search ground transport - no filter
      const { data: groundTransport } = await supabase.from('taxi_cars').select('*').limit(3);

      // Search yachts
      const { data: yachts } = await supabase.from('yachts').select('*').limit(3);

      // Search fixed offers - use keywords if available
      let fixedOffersQuery = supabase.from('fixed_offers').select('*').limit(3);
      if (hasKeywords && searchKeyword.length >= 3) {
        fixedOffersQuery = supabase
          .from('fixed_offers')
          .select('*')
          .or(`title.ilike.%${searchKeyword}%,destination.ilike.%${searchKeyword}%`)
          .limit(3);
      }
      const { data: fixedOffers } = await fixedOffersQuery;

      const offers = [];

      if (jets && jets.length > 0) {
        offers.push({
          category: 'Private Jets',
          icon: '✈️',
          items: jets.map(jet => ({
            label: `${jet.name} - €${jet.hourly_rate_eur?.toLocaleString() || 'Quote'}/hr`,
            action: 'jets',
            data: jet
          }))
        });
      }

      if (emptyLegs && emptyLegs.length > 0) {
        offers.push({
          category: 'Empty Legs',
          icon: '🛫',
          items: emptyLegs.map(leg => ({
            label: `${leg.from_city || leg.from} → ${leg.to_city || leg.to} - ${leg.price_usd ? '$' + leg.price_usd.toLocaleString() : '€' + (leg.price_eur?.toLocaleString() || 'Quote')}`,
            action: 'empty-legs',
            data: leg
          }))
        });
      }

      if (helicopters && helicopters.length > 0) {
        offers.push({
          category: 'Helicopters',
          icon: '🚁',
          items: helicopters.map(heli => ({
            label: `${heli.name} - €${heli.hourly_rate_eur?.toLocaleString() || 'Quote'}/hr`,
            action: 'helicopter',
            data: heli
          }))
        });
      }

      if (yachts && yachts.length > 0) {
        offers.push({
          category: 'Yachts',
          icon: '🛥️',
          items: yachts.map(yacht => ({
            label: `${yacht.name || yacht.title} - €${yacht.daily_rate?.toLocaleString() || yacht.price_per_day?.toLocaleString() || 'Quote'}/day`,
            action: 'ai-chat',
            data: yacht
          }))
        });
      }

      if (groundTransport && groundTransport.length > 0) {
        offers.push({
          category: 'Ground Transport',
          icon: '🚙',
          items: groundTransport.map(car => ({
            label: `${car.name || car.type} - €${car.price_per_hour?.toLocaleString() || car.hourly_rate?.toLocaleString() || 'Quote'}/hr`,
            action: 'ai-chat',
            data: car
          }))
        });
      }

      if (fixedOffers && fixedOffers.length > 0) {
        offers.push({
          category: 'Adventures & Packages',
          icon: '🏔️',
          items: fixedOffers.map(offer => ({
            label: `${offer.title} - €${offer.price_eur?.toLocaleString() || 'Quote'}`,
            action: 'adventures',
            data: offer
          }))
        });
      }

      setActualOffers(offers);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoadingOffers(false);
    }
  };

  // Smart filtering with pattern matching
  useEffect(() => {
    if (query.trim().length > 0) {
      // Check if query matches any pattern
      const matchedPattern = queryPatterns.find(p => p.pattern.test(query));

      if (matchedPattern) {
        // Show pattern-based suggestions (Perplexity style)
        setSuggestions(matchedPattern.suggestions);
      } else {
        // Regular keyword search
        const allItems = getAllSuggestions();
        const filtered = allItems.filter(item =>
          item.label.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 8));
      }
      
      // Fetch actual offers if query is long enough
      if (query.length >= 3) {
        fetchActualOffers(query);
      } else {
        setActualOffers([]);
      }
      
      setSelectedIndex(0); // Reset selection
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setActualOffers([]);
      setSelectedIndex(0);
      setIsOpen(query.length === 0 && document.activeElement === searchRef.current?.querySelector('input'));
    }
  }, [query, webMode]);

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

  // Save to recent
  const saveToRecent = (item) => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updated = [item, ...recent.filter(r => r.label !== item.label)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated.slice(0, 3));
  };

  // Handle selection
  const handleSelect = (item, openIndexPage = false) => {
    setIsOpen(false);
    saveToRecent(item);

    // If action is ai-chat, always trigger AI chat
    if (item.action === 'ai-chat') {
      const queryText = item.query || item.label;
      if (onOpenAIChat) {
        onOpenAIChat(queryText);
      } else if (onSearch) {
        onSearch({
          label: queryText,
          action: 'ai-chat',
          query: queryText,
          category: 'AI Chat'
        }, true);
      }
      setQuery('');
      return;
    }

    setQuery(item.query || item.label);
    if (onSearch) {
      onSearch(item, openIndexPage);
    }
  };

  // Handle "See Page" button click
  const handleSeePage = (item, e) => {
    e.stopPropagation();
    handleSelect(item, false); // Navigate directly to the page
  };

  // Keyboard handling with arrow navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim().length > 0) {
        setIsOpen(false);
        // Navigate to AI Chat with the query
        if (onOpenAIChat) {
          onOpenAIChat(query);
          setQuery('');
        } else if (onSearch) {
          onSearch({
            label: query,
            action: 'ai-chat',
            query: query,
            category: 'AI Chat'
          }, true);
          setQuery('');
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      {/* Search Input + AI Button Container */}
      <div className="relative flex items-center gap-3">
        {/* Search Input - Apple Style with Typing Animation */}
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={typingText || placeholder}
            className="w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent backdrop-blur-xl bg-white/35 border-gray-300/50 text-gray-800 placeholder-gray-500 focus:ring-gray-400/50 transition-all"
          />
          {/* Blinking cursor when typing animation is active */}
          {typingText && !query && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none" style={{ marginLeft: `${typingText.length * 7.5}px` }}>
              <span className="animate-pulse">|</span>
            </span>
          )}
        </div>

        {/* AI Chat Button - Opens AI assistant with query */}
        {query.length > 0 && (
          <button
            onClick={() => {
              if (onOpenAIChat) {
                onOpenAIChat(query);
              } else if (onSearch) {
                onSearch({
                  label: query,
                  action: 'ai-chat',
                  query: query,
                  category: 'AI Chat'
                }, true);
              }
              setIsOpen(false);
              setQuery('');
            }}
            className="flex-shrink-0 group relative px-4 py-3 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg bg-black"
          >
            {/* Content */}
            <div className="relative flex items-center gap-2 text-white">
              <Sparkles size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium whitespace-nowrap">Ask Sphera AI</span>
            </div>
          </button>
        )}
      </div>

      {/* Dropdown - Apple Style */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-2xl border border-gray-200/50 rounded-xl shadow-xl overflow-hidden z-50">

          {/* Actual Offers from Database */}
          {actualOffers.length > 0 && (
            <div className="border-b border-gray-100/50">
              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Available Offers
              </div>
              {actualOffers.map((offerGroup, groupIndex) => (
                <div key={groupIndex} className="mb-2">
                  <div className="px-4 py-1 text-xs font-medium text-gray-600">
                    {offerGroup.category}
                  </div>
                  {offerGroup.items.map((offer, offerIndex) => (
                    <button
                      key={offerIndex}
                      onClick={() => {
                        // Trigger AI chat with the offer details
                        const queryText = `I'm interested in: ${offer.label}`;
                        if (onOpenAIChat) {
                          onOpenAIChat(queryText);
                        } else if (onSearch) {
                          onSearch({
                            label: queryText,
                            action: 'ai-chat',
                            query: queryText,
                            category: 'AI Chat'
                          }, true);
                        }
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full px-4 py-2 hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-800">{offer.label}</span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="border-b border-gray-100/50">
              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Recent
              </div>
              {recentSearches.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-1.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-sm text-gray-800">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(
                suggestions.reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {})
              ).map(([category, items]) => (
                <div key={category} className="border-b border-gray-100/50 last:border-0">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {category}
                  </div>
                  {items.map((item, index) => {
                    const globalIndex = suggestions.indexOf(item);
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSelect(item)}
                        className={`w-full flex items-center justify-between px-4 py-2 transition-colors text-left ${
                          isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm text-gray-800">{item.label}</span>
                        <ChevronRight size={14} className="text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* No Results - Show Ask Sphera AI button prominently */}
          {query.length > 0 && suggestions.length === 0 && actualOffers.length === 0 && !loadingOffers && (
            <div className="px-4 py-4 sm:py-6 text-center">
              <p className="text-sm text-gray-600 mb-2">No exact matches for "{query}"</p>
              <p className="text-xs text-gray-500 mb-4 hidden sm:block">Try asking our AI assistant for personalized recommendations</p>

              {/* Ask Sphera AI - Primary action */}
              <button
                onClick={() => {
                  if (onSearch) {
                    onSearch({
                      label: query,
                      action: 'ai-chat',
                      query: query,
                      category: 'AI Chat'
                    }, true);
                  }
                  setIsOpen(false);
                  setQuery('');
                }}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium mb-3"
              >
                <Sparkles size={16} className="hidden sm:block" />
                <span className="sm:hidden">Ask AI</span>
                <span className="hidden sm:inline">Ask Sphera AI about "{query.length > 20 ? query.substring(0, 20) + '...' : query}"</span>
              </button>

              {/* Contact as secondary option */}
              <div className="mt-3 pt-3 border-t border-gray-100 hidden sm:block">
                <p className="text-xs text-gray-400 mb-2">Or contact our travel specialists directly</p>
                <a
                  href="mailto:support@privatecharterx.com"
                  className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Mail size={14} />
                  Get in touch with us now
                </a>
              </div>
            </div>
          )}

          {/* Show all services when empty */}
          {query.length === 0 && recentSearches.length === 0 && (
            <div className="max-h-96 overflow-y-auto">
              {webMode === 'rws' && (
                <>
                  <div className="border-b border-gray-100/50">
                    <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Travel Services
                    </div>
                    {allServices.rwsServices.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelect(item)}
                        className={`w-full px-4 py-2 transition-colors text-left flex items-center justify-between ${
                          item.highlight
                            ? 'bg-amber-50 hover:bg-amber-100 border-l-2 border-amber-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-sm ${item.highlight ? 'font-medium text-amber-700' : 'text-gray-800'}`}>
                          {item.label}
                        </span>
                        {item.highlight && (
                          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                            Beat any quote
                          </span>
                        )}
                        <ChevronRight size={14} className="text-gray-400 ml-auto" />
                      </button>
                    ))}
                  </div>
                  <div className="border-b border-gray-100/50">
                    <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      In-Flight & Extras
                    </div>
                    {allServices.extrasServices.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelect(item)}
                        className="w-full px-4 py-2 hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-800">{item.label}</span>
                        <ChevronRight size={14} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                  <div className="border-b border-gray-100/50">
                    <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Popular Destinations
                    </div>
                    {allServices.destinations.slice(0, 4).map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelect(item)}
                        className="w-full px-4 py-2 hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-800">{item.label}</span>
                        <ChevronRight size={14} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                </>
              )}
              {webMode === 'web3' && (
                <div className="border-b border-gray-100/50">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Web3.0 Services
                  </div>
                  {allServices.web3Services.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelect(item)}
                      className="w-full px-4 py-2 hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-800">{item.label}</span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntelligentSearch;
