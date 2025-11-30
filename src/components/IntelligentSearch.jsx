import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, Clock, TrendingUp, Sparkles, Plane, Zap, Mail } from 'lucide-react';
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
    "Find luxury cars in Paris",
    "I want to tokenize my yacht",
    "I need a hotel in Bangkok which accepts crypto",
  ];

  // Natural language query patterns (Perplexity style)
  const queryPatterns = [
    // "I need..." patterns
    { pattern: /^i\s*ne/i, suggestions: [
      { label: 'I need a private jet from Zurich to Dubai', icon: '✈️', category: 'Complete this...', action: 'jets', query: 'I need a private jet from Zurich to Dubai' },
      { label: 'I need a private jet for next week', icon: '✈️', category: 'Complete this...', action: 'jets', query: 'I need a private jet for next week' },
      { label: 'I need a helicopter transfer', icon: '🚁', category: 'Complete this...', action: 'helicopter', query: 'I need a helicopter transfer' },
      { label: 'I need a luxury car', icon: '🚗', category: 'Complete this...', action: 'luxury-cars', query: 'I need a luxury car' },
    ]},
    { pattern: /^i\s*need\s*a\s*/i, suggestions: [
      { label: 'I need a private jet', icon: '✈️', category: 'Complete this...', action: 'jets', query: 'I need a private jet' },
      { label: 'I need a helicopter', icon: '🚁', category: 'Complete this...', action: 'helicopter', query: 'I need a helicopter' },
      { label: 'I need a luxury car', icon: '🚗', category: 'Complete this...', action: 'luxury-cars', query: 'I need a luxury car' },
      { label: 'I need an adventure trip', icon: '�️', category: 'Complete this...', action: 'adventures', query: 'I need an adventure trip' },
    ]},
    // "I want..." patterns
    { pattern: /^i\s*wa/i, suggestions: [
      { label: 'I want to tokenize my jet', icon: '💎', category: 'Complete this...', action: 'tokenize', query: 'I want to tokenize my jet' },
      { label: 'I want to buy NFT membership', icon: '🎫', category: 'Complete this...', action: 'wallet-nfts', query: 'I want to buy NFT membership' },
      { label: 'I want to offset CO2 emissions', icon: '🌱', category: 'Complete this...', action: 'co2-saf', query: 'I want to offset CO2 emissions' },
      { label: 'I want to swap tokens', icon: '🔄', category: 'Complete this...', action: 'swap', query: 'I want to swap tokens' },
    ]},
    // "Show me..." patterns
    { pattern: /^sh/i, suggestions: [
      { label: 'Show me empty leg flights', icon: '🛫', category: 'Complete this...', action: 'empty-legs', query: 'Show me empty leg flights' },
      { label: 'Show me available jets', icon: '✈️', category: 'Complete this...', action: 'jets', query: 'Show me available jets' },
      { label: 'Show me tokenized assets', icon: '💎', category: 'Complete this...', action: 'tokenized-assets', query: 'Show me tokenized assets' },
      { label: 'Show me my bookings', icon: '📅', category: 'Complete this...', action: 'calendar', query: 'Show me my bookings' },
    ]},
    // "Book..." patterns
    { pattern: /^bo/i, suggestions: [
      { label: 'Book a private jet', icon: '✈️', category: 'Complete this...', action: 'jets', query: 'Book a private jet' },
      { label: 'Book a helicopter', icon: '🚁', category: 'Complete this...', action: 'helicopter', query: 'Book a helicopter' },
      { label: 'Book a luxury car', icon: '🚗', category: 'Complete this...', action: 'luxury-cars', query: 'Book a luxury car' },
      { label: 'Book an adventure', icon: '🏔️', category: 'Complete this...', action: 'adventures', query: 'Book an adventure' },
    ]},
    // "Find..." patterns
    { pattern: /^fi/i, suggestions: [
      { label: 'Find flights to Dubai', icon: '✈️', category: 'Complete this...', action: 'jets', query: 'Find flights to Dubai' },
      { label: 'Find empty legs', icon: '🛫', category: 'Complete this...', action: 'empty-legs', query: 'Find empty legs' },
      { label: 'Find adventure trips', icon: '🏔️', category: 'Complete this...', action: 'adventures', query: 'Find adventure trips' },
    ]},
  ];

  // All available services - RWS & Web3.0
  const allServices = {
    rwsServices: [
      { label: 'Break the Price', icon: '💰', category: 'RWS Services', action: 'break-the-price', highlight: true },
      { label: 'Private Jets', icon: '✈️', category: 'RWS Services', action: 'jets' },
      { label: 'Helicopters', icon: '🚁', category: 'RWS Services', action: 'helicopter' },
      { label: 'Empty Legs', icon: '🛫', category: 'RWS Services', action: 'empty-legs' },
      { label: 'Luxury Cars', icon: '🚗', category: 'RWS Services', action: 'luxury-cars' },
      { label: 'Adventures', icon: '🏔️', category: 'RWS Services', action: 'adventures' },
      { label: 'CO2 / SAF Certificates', icon: '🌱', category: 'RWS Services', action: 'co2-saf' },
      // { label: 'AI Travel Agent', icon: '🤖', category: 'RWS Services', action: 'chat' },
      // { label: 'Calendar & Bookings', icon: '📅', category: 'RWS Services', action: 'calendar' },
      // { label: 'Concierge Service', icon: '🎩', category: 'RWS Services', action: 'chat' },
      { label: 'Chat Support', icon: '💬', category: 'RWS Services', action: 'chat-support' },
    ],
    web3Services: [
      { label: 'Tokenize Assets', icon: '💎', category: 'Web3.0 Services', action: 'tokenize' },
      { label: 'View Tokenized Assets', icon: '✨', category: 'Web3.0 Services', action: 'tokenized-assets' },
      { label: 'Token Swap', icon: '🔄', category: 'Web3.0 Services', action: 'swap' },
      { label: 'NFT Memberships', icon: '🎫', category: 'Web3.0 Services', action: 'wallet-nfts' },
      { label: 'Launchpad', icon: '🚀', category: 'Web3.0 Services', action: 'launchpad' },
      { label: 'Connect Wallet', icon: '👛', category: 'Web3.0 Services', action: 'wallet-nfts' },
      { label: 'View Transactions', icon: '📊', category: 'Web3.0 Services', action: 'transactions' },
    ],
    destinations: [
      { label: 'Zurich', icon: '📍', category: 'Popular Destinations', action: 'search:zurich' },
      { label: 'Geneva', icon: '📍', category: 'Popular Destinations', action: 'search:geneva' },
      { label: 'London', icon: '📍', category: 'Popular Destinations', action: 'search:london' },
      { label: 'Paris', icon: '📍', category: 'Popular Destinations', action: 'search:paris' },
      { label: 'Dubai', icon: '📍', category: 'Popular Destinations', action: 'search:dubai' },
      { label: 'New York', icon: '📍', category: 'Popular Destinations', action: 'search:new york' },
      { label: 'Monaco', icon: '📍', category: 'Popular Destinations', action: 'search:monaco' },
      { label: 'Milan', icon: '📍', category: 'Popular Destinations', action: 'search:milan' },
    ],
    aircraft: [
      { label: 'Gulfstream G650', icon: '✈️', category: 'Popular Aircraft', action: 'search:gulfstream g650' },
      { label: 'Bombardier Global 7500', icon: '✈️', category: 'Popular Aircraft', action: 'search:bombardier global' },
      { label: 'Citation X', icon: '✈️', category: 'Popular Aircraft', action: 'search:citation x' },
      { label: 'Phenom 300', icon: '✈️', category: 'Popular Aircraft', action: 'search:phenom 300' },
    ],
  };

  // Combine all suggestions based on mode
  const getAllSuggestions = () => {
    let all = [...allServices.destinations, ...allServices.aircraft];
    if (webMode === 'rws') {
      all = [...allServices.rwsServices, ...all];
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

      // Search luxury cars - no text filter
      const { data: luxuryCars } = await supabase.from('luxury_cars').select('*').limit(3);

      // Search ground transport - no filter
      const { data: groundTransport } = await supabase.from('taxi_cars').select('*').limit(3);

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

      if (luxuryCars && luxuryCars.length > 0) {
        offers.push({
          category: 'Luxury Cars',
          icon: '🚗',
          items: luxuryCars.map(car => ({
            label: `${car.brand || ''} ${car.model || car.name || car.type} - €${car.daily_rate?.toLocaleString() || car.price_per_day?.toLocaleString() || 'Quote'}/day`,
            action: 'luxury-cars',
            data: car
          }))
        });
      }

      if (groundTransport && groundTransport.length > 0) {
        offers.push({
          category: 'Ground Transport',
          icon: '🚙',
          items: groundTransport.map(car => ({
            label: `${car.name || car.type} - €${car.price_per_hour?.toLocaleString() || car.hourly_rate?.toLocaleString() || 'Quote'}/hr`,
            action: 'ground-transport',
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
    setQuery(item.query || item.label);
    setIsOpen(false);
    saveToRecent(item);
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
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-gray-400 pointer-events-none">
            ⌘/
          </kbd>
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
              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={10} />
                Available Offers
              </div>
              {actualOffers.map((offerGroup, groupIndex) => (
                <div key={groupIndex} className="mb-2">
                  <div className="px-4 py-1 text-xs font-medium text-gray-600 flex items-center gap-2">
                    <span>{offerGroup.icon}</span>
                    <span>{offerGroup.category}</span>
                  </div>
                  {offerGroup.items.map((offer, offerIndex) => (
                    <button
                      key={offerIndex}
                      onClick={() => handleSelect(offer)}
                      className="w-full px-6 py-2 hover:bg-gray-50 transition-colors text-left flex items-center gap-2"
                    >
                      <Plane size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-800">{offer.label}</span>
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
                      <div
                        key={index}
                        className={`flex items-center justify-between px-4 py-1.5 transition-colors ${
                          isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <button
                          onClick={() => handleSelect(item, true)}
                          className="flex-1 text-left"
                        >
                          <span className="text-sm text-gray-800">{item.label}</span>
                        </button>
                        {item.action && item.action !== 'chat' && item.action !== 'chat-support' && (
                          <button
                            onClick={(e) => handleSeePage(item, e)}
                            className="ml-2 px-3 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600 transition-colors"
                          >
                            See Page
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {query.length > 0 && suggestions.length === 0 && actualOffers.length === 0 && !loadingOffers && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-600 mb-3">No results found for "{query}"</p>
              <p className="text-xs text-gray-500 mb-4">Contact our travel specialists for assistance</p>
              <a
                href="mailto:bookings@privatecharterx.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <Mail size={16} />
                Get in touch with us now
              </a>
            </div>
          )}

          {/* Show all services when empty */}
          {query.length === 0 && recentSearches.length === 0 && (
            <div className="max-h-80 overflow-y-auto">
              {webMode === 'rws' && (
                <div className="border-b border-gray-100/50">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Services
                  </div>
                  {allServices.rwsServices.slice(0, 8).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelect(item)}
                      className={`w-full px-4 py-1.5 transition-colors text-left flex items-center gap-2 ${
                        item.highlight
                          ? 'bg-amber-50 hover:bg-amber-100 border-l-2 border-amber-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className={`text-sm ${item.highlight ? 'font-medium text-amber-700' : 'text-gray-800'}`}>
                        {item.label}
                      </span>
                      {item.highlight && (
                        <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                          Beat any quote
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {webMode === 'web3' && (
                <div className="border-b border-gray-100/50">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Web3.0
                  </div>
                  {allServices.web3Services.map((item, index) => (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntelligentSearch;
