import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function FloatingSearchModal() {
  const navigate = useNavigate();
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated || false;
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [titleOpacity, setTitleOpacity] = useState(1);
  const [currentOpenSection, setCurrentOpenSection] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Charter a jet state
  const [showCharterFields, setShowCharterFields] = useState(false);
  const [departureLocation, setDepartureLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');

  const titles = [
    'Tokenizing global mobility',
    'Charter the smart way',
    'Blockchain powered travel'
  ];

  const placeholders = [
    'where we go today?',
    'business or leisure?',
    'back for dinner at 6.33',
    'plan your travel with sphera AI',
    'book a p/jet today',
    'airfield transfer ready'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleOpacity(0);
      setTimeout(() => {
        setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
        setTitleOpacity(1);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Typing animation for placeholder
  useEffect(() => {
    const currentText = placeholders[currentPlaceholderIndex];
    let charIndex = 0;
    setDisplayedPlaceholder('');
    setIsTyping(true);

    // Type out the text
    const typingInterval = setInterval(() => {
      if (charIndex < currentText.length) {
        setDisplayedPlaceholder(currentText.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);

        // Wait then move to next placeholder
        setTimeout(() => {
          setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 2000);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [currentPlaceholderIndex]);

  // Handle charter jet submission
  const handleCharterJetSubmit = () => {
    if (departureLocation && destinationLocation) {
      // Navigate to dashboard charter tab with pre-filled data, skip to step 2
      const params = new URLSearchParams({
        tab: 'charter',
        departure: departureLocation,
        destination: destinationLocation,
        step: '2'
      });
      if (!isAuthenticated) {
        params.append('login', 'true');
      }
      navigate(`/glasdashboard?${params.toString()}`);
    }
  };

  const toggleSection = (section: string) => {
    setCurrentOpenSection(currentOpenSection === section ? null : section);
  };

  // Handle Sphera AI search - requires login, creates new AI chat
  const handleSphereAISearch = (query: string) => {
    if (query.trim()) {
      // Navigate to AI chat with query - requires authentication
      if (isAuthenticated) {
        // Navigate to glasdashboard AI chat with new conversation
        navigate(`/glasdashboard?tab=ai-chat&query=${encodeURIComponent(query)}&newChat=true`);
      } else {
        // Navigate with login flag - will show login modal first
        navigate(`/glasdashboard?tab=ai-chat&query=${encodeURIComponent(query)}&newChat=true&login=true`);
      }
    } else {
      // If no query, just open AI chat
      if (isAuthenticated) {
        navigate(`/glasdashboard?tab=ai-chat&newChat=true`);
      } else {
        navigate(`/glasdashboard?tab=ai-chat&newChat=true&login=true`);
      }
    }
  };

  // Navigate with authentication check helper
  const navigateWithAuth = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate(`${path}${path.includes('?') ? '&' : '?'}login=true`);
    }
  };

  // Handle RWA category clicks
  const handleRWAClick = (category: string) => {
    switch (category) {
      case 'p/jets':
        navigate('/tokenized-assets?category=jets');
        break;
      case 'emptylegs':
        navigate('/tokenized-assets?category=empty-legs');
        break;
      case 'helicopter':
        navigate('/tokenized-assets?category=helicopter');
        break;
      case 'airportransfer':
        navigateWithAuth('/glasdashboard?tab=concierge&service=airport-transfer');
        break;
      case 'concierge':
        navigateWithAuth('/glasdashboard?tab=concierge');
        break;
      case 'SPV Formation':
        navigateWithAuth('/glasdashboard?tab=spv');
        break;
      case 'adventure package':
        navigate('/tokenized-assets?category=adventures');
        break;
      case 'holiday planer':
        navigateWithAuth('/glasdashboard?tab=ai-chat&query=help me plan my holiday');
        break;
      case 'travel designer':
        navigateWithAuth('/glasdashboard?tab=ai-chat&query=design my travel itinerary');
        break;
      case 'application':
        navigateWithAuth('/glasdashboard?tab=profile');
        break;
      case 'Co2 certificate':
        navigate('/tokenized-assets?category=co2');
        break;
      default:
        navigate('/tokenized-assets');
    }
  };

  // Handle Web3 category clicks
  const handleWeb3Click = (category: string) => {
    switch (category) {
      case 'free emptyleg':
        navigate('/tokenized-assets?category=empty-legs&filter=free');
        break;
      case 'NFTs':
        navigate('/tokenized-assets?category=nfts');
        break;
      case 'asset-/tokenization':
        navigateWithAuth('/glasdashboard?tab=tokenize');
        break;
      case '$PVCX':
        navigateWithAuth('/glasdashboard?tab=pvcx');
        break;
      case 'chain-escrow':
        navigateWithAuth('/glasdashboard?tab=escrow');
        break;
      case 'SAF certificate':
        navigate('/tokenized-assets?category=saf');
        break;
      default:
        navigate('/tokenized-assets');
    }
  };

  return (
    <div className="w-[calc(100%-16px)] sm:w-full sm:max-w-[650px] mx-2 sm:mx-0">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-6 sm:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.06)] border border-white/15 transition-all duration-150 hover:bg-white/12 sm:hover:shadow-[0_30px_80px_rgba(0,0,0,0.12),0_12px_24px_rgba(0,0,0,0.08)]">

        {/* Status Bubble */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100/60 backdrop-blur-sm rounded-full border border-gray-300/30 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[11px] sm:text-[10px] text-gray-600 font-medium tracking-wide uppercase">web3 and ai powered multi charter</span>
        </div>

        {/* Animated Title */}
        <h1
          className="text-[26px] sm:text-[32px] font-light text-gray-900 mb-2 leading-tight tracking-tight transition-all duration-300 pb-2 border-b border-gray-300/20"
          style={{ opacity: titleOpacity, transform: `translateY(${titleOpacity === 0 ? '-10px' : '0'})` }}
        >
          {titles[currentTitleIndex]}
        </h1>

        {/* Sphera AI Search Bar - Minimal, Smooth Design */}
        <div className="mt-4 sm:mt-3">
          <div className="relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3.5 sm:py-3 bg-gray-50 rounded-xl border border-gray-200 transition-all duration-100 focus-within:bg-white focus-within:border-gray-300 focus-within:shadow-sm">
            {/* Command Icon */}
            <span className="text-gray-400 text-sm font-light flex-shrink-0">⌘</span>

            {/* Input with animated placeholder overlay */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[16px] sm:text-[15px] text-gray-800 font-normal"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSphereAISearch(searchValue);
                  }
                }}
              />
              {/* Typing animation placeholder - only show when input is empty */}
              {!searchValue && (
                <div className="absolute inset-0 flex items-center pointer-events-none">
                  <span className="text-[16px] sm:text-[15px] text-gray-400 font-normal">
                    {displayedPlaceholder}
                    {isTyping && <span className="animate-pulse ml-0.5">|</span>}
                  </span>
                </div>
              )}
            </div>

            {/* Send Button - Minimal rounded square */}
            <button
              onClick={() => handleSphereAISearch(searchValue)}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center transition-all duration-100 hover:bg-black active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Services Row - RWA, web3.0, charter a jet in same row */}
        <div className="flex gap-2.5 sm:gap-3 mt-4 sm:mt-3 flex-wrap items-center">
          {/* RWA Button */}
          <div
            onClick={() => toggleSection('rwa')}
            className="flex items-center gap-2 px-3 py-2 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95"
          >
            <div className={`w-5 h-5 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-150 ${currentOpenSection === 'rwa' ? 'rotate-45' : ''}`}>
              +
            </div>
            <span className="text-[13px] sm:text-xs text-gray-700 font-medium tracking-wide">RWA</span>
          </div>

          {/* Web3.0 Button */}
          <div
            onClick={() => toggleSection('web3')}
            className="flex items-center gap-2 px-3 py-2 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95"
          >
            <div className={`w-5 h-5 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-150 ${currentOpenSection === 'web3' ? 'rotate-45' : ''}`}>
              +
            </div>
            <span className="text-[13px] sm:text-xs text-gray-700 font-medium tracking-wide">web3.0</span>
          </div>

          {/* Charter a Jet Button - Same style as RWA/web3 */}
          <div
            onClick={() => setShowCharterFields(!showCharterFields)}
            className="flex items-center gap-2 px-3 py-2 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95"
          >
            <div className={`w-5 h-5 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-150 ${showCharterFields ? 'rotate-45' : ''}`}>
              +
            </div>
            <span className="text-[13px] sm:text-xs text-gray-700 font-medium tracking-wide">charter a jet</span>
          </div>
        </div>

        {/* Charter Fields - Expandable, Single Row Inputs */}
        <div className={`overflow-hidden transition-all duration-150 ${showCharterFields ? 'max-h-[120px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="flex gap-1.5 sm:gap-2 items-center">
            {/* Departure Input */}
            <div className="flex-1 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 sm:py-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 16v-2a4 4 0 0 0-4-4H5" />
                <polyline points="9 6 5 10 9 14" />
              </svg>
              <input
                type="text"
                value={departureLocation}
                onChange={(e) => setDepartureLocation(e.target.value)}
                placeholder="From"
                className="flex-1 bg-transparent border-none outline-none text-[14px] sm:text-[13px] text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Destination Input */}
            <div className="flex-1 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 sm:py-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 8h14" />
                <polyline points="17 4 21 8 17 12" />
              </svg>
              <input
                type="text"
                value={destinationLocation}
                onChange={(e) => setDestinationLocation(e.target.value)}
                placeholder="To"
                className="flex-1 bg-transparent border-none outline-none text-[14px] sm:text-[13px] text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Go Button */}
            <button
              onClick={handleCharterJetSubmit}
              disabled={!departureLocation || !destinationLocation}
              className="px-3 sm:px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm sm:text-xs font-medium transition-all duration-100 hover:bg-black active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Go
            </button>
          </div>
        </div>

        {/* RWA Categories */}
        <div className={`flex flex-wrap gap-1.5 sm:gap-2 px-0 transition-all duration-150 ${currentOpenSection === 'rwa' ? 'max-h-[300px] opacity-100 mt-3 mb-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {['p/jets', 'emptylegs', 'helicopter', 'airportransfer', 'concierge', 'SPV Formation', 'adventure package', 'holiday planer', 'travel designer', 'application', 'Co2 certificate'].map(cat => (
            <div
              key={cat}
              onClick={() => handleRWAClick(cat)}
              className="px-2.5 sm:px-3 py-1.5 bg-gray-100 rounded-full text-[12px] sm:text-xs text-gray-700 cursor-pointer transition-all duration-100 border border-gray-300 font-medium hover:bg-gray-200 active:scale-95 hover:border-gray-400"
            >
              {cat}
            </div>
          ))}
        </div>

        {/* Web3 Categories */}
        <div className={`flex flex-wrap gap-1.5 sm:gap-2 px-0 transition-all duration-150 ${currentOpenSection === 'web3' ? 'max-h-[300px] opacity-100 mt-3 mb-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {['free emptyleg', 'NFTs', 'asset-/tokenization', '$PVCX', 'chain-escrow', 'SAF certificate'].map(cat => (
            <div
              key={cat}
              onClick={() => handleWeb3Click(cat)}
              className="px-2.5 sm:px-3 py-1.5 bg-gray-100 rounded-full text-[12px] sm:text-xs text-gray-700 cursor-pointer transition-all duration-100 border border-gray-300 font-medium hover:bg-gray-200 active:scale-95 hover:border-gray-400"
            >
              {cat}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
