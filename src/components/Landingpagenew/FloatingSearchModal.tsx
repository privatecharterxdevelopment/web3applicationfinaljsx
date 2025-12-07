import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { airportsJsonService as airportsService, type AirportSearchResult } from '../../services/airportsJsonService';
import { X } from 'lucide-react';

export default function FloatingSearchModal() {
  const navigate = useNavigate();
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated || false;
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentOpenSection, setCurrentOpenSection] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');

  // Charter a jet state
  const [showCharterFields, setShowCharterFields] = useState(false);
  const [departureInput, setDepartureInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [departureAirport, setDepartureAirport] = useState<AirportSearchResult | null>(null);
  const [destinationAirport, setDestinationAirport] = useState<AirportSearchResult | null>(null);

  // Airport dropdown state
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [departureAirports, setDepartureAirports] = useState<AirportSearchResult[]>([]);
  const [destinationAirports, setDestinationAirports] = useState<AirportSearchResult[]>([]);
  const [isLoadingDeparture, setIsLoadingDeparture] = useState(false);
  const [isLoadingDestination, setIsLoadingDestination] = useState(false);

  // File upload for Break the Price
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const titles = [
    'Where we fly today?',
    'emptylegs to London?',
    'business or leisure?',
    'sphera ai books for you',
    'crypto or classic?',
    'your airportransfer is ready',
    'Family trip planned for the weekend?',
    'we try to beat the quote of others',
    'private island trip?',
    'lets make your travel plans happen',
    'Book your stay at the Ritz Carlton',
    'book a Night at Burj Al Arab'
  ];

  // Typing and deleting animation for titles
  useEffect(() => {
    const currentText = titles[currentTitleIndex];
    const typingSpeed = 35; // ms per character when typing (faster)
    const deletingSpeed = 20; // ms per character when deleting (much faster)
    const pauseAfterTyping = 1200; // shorter pause after fully typed
    const pauseAfterDeleting = 150; // brief pause before next title

    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      // Typing phase
      if (displayedTitle.length < currentText.length) {
        timeout = setTimeout(() => {
          setDisplayedTitle(currentText.substring(0, displayedTitle.length + 1));
        }, typingSpeed);
      } else {
        // Finished typing, wait then start deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseAfterTyping);
      }
    } else {
      // Deleting phase
      if (displayedTitle.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedTitle(displayedTitle.substring(0, displayedTitle.length - 1));
        }, deletingSpeed);
      } else {
        // Finished deleting, move to next title
        timeout = setTimeout(() => {
          setIsDeleting(false);
          setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
        }, pauseAfterDeleting);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedTitle, isDeleting, currentTitleIndex, titles]);

  // Airport search functions
  const searchDepartureAirports = async (query: string) => {
    setIsLoadingDeparture(true);
    try {
      const results = await airportsService.searchAirports(query);
      setDepartureAirports(results);
    } catch (error) {
      console.error('Error searching departure airports:', error);
      setDepartureAirports([]);
    } finally {
      setIsLoadingDeparture(false);
    }
  };

  const searchDestinationAirports = async (query: string) => {
    setIsLoadingDestination(true);
    try {
      const results = await airportsService.searchAirports(query);
      setDestinationAirports(results);
    } catch (error) {
      console.error('Error searching destination airports:', error);
      setDestinationAirports([]);
    } finally {
      setIsLoadingDestination(false);
    }
  };

  const handleDepartureSelect = (airport: AirportSearchResult) => {
    setDepartureAirport(airport);
    setDepartureInput(`${airport.city} (${airport.code})`);
    setShowDepartureDropdown(false);
  };

  const handleDestinationSelect = (airport: AirportSearchResult) => {
    setDestinationAirport(airport);
    setDestinationInput(`${airport.city} (${airport.code})`);
    setShowDestinationDropdown(false);
  };

  // Handle charter jet submission
  const handleCharterJetSubmit = () => {
    if (departureAirport && destinationAirport) {
      // Navigate to dashboard private-jet tab with pre-filled data
      const params = new URLSearchParams({
        tab: 'private-jet',
        departure: departureAirport.code,
        departureName: `${departureAirport.city} (${departureAirport.code})`,
        destination: destinationAirport.code,
        destinationName: `${destinationAirport.city} (${destinationAirport.code})`
      });
      if (!isAuthenticated) {
        params.append('login', 'true');
      }
      navigate(`/dashboard?${params.toString()}`);
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
        navigate(`/dashboard?tab=ai-chat&query=${encodeURIComponent(query)}&newChat=true`);
      } else {
        // Navigate with login flag - will show login modal first
        navigate(`/dashboard?tab=ai-chat&query=${encodeURIComponent(query)}&newChat=true&login=true`);
      }
    } else {
      // If no query, just open AI chat
      if (isAuthenticated) {
        navigate(`/dashboard?tab=ai-chat&newChat=true`);
      } else {
        navigate(`/dashboard?tab=ai-chat&newChat=true&login=true`);
      }
    }
  };

  // Handle file upload for Break the Price
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or image file (JPG, PNG, WebP)');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum size is 10MB.');
        return;
      }
      setSelectedFile(file);
      // Navigate to AI chat with Break the Price file
      const params = new URLSearchParams({
        tab: 'ai-chat',
        newChat: 'true',
        breakThePrice: 'true',
        fileName: file.name
      });
      if (!isAuthenticated) {
        params.append('login', 'true');
      }
      // Store file in sessionStorage for AI chat to pick up
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem('breakThePriceFile', JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result
        }));
        navigate(`/dashboard?${params.toString()}`);
      };
      reader.readAsDataURL(file);
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

  // Handle Beat the Price - navigates to AI chat with prefilled message
  const handleBeatThePrice = () => {
    const prefilledMessage = encodeURIComponent('To beat the price kindly upload your recent Offer / quote as PDF or image and we try to beat the price within 12hrs.');
    if (isAuthenticated) {
      navigate(`/dashboard?tab=ai-chat&newChat=true&assistantMessage=${prefilledMessage}`);
    } else {
      navigate(`/dashboard?tab=ai-chat&newChat=true&assistantMessage=${prefilledMessage}&login=true`);
    }
  };

  // Handle RWA category clicks
  const handleRWAClick = (category: string) => {
    switch (category) {
      case 'p/jets':
        navigate('/dashboard?tab=jets');
        break;
      case 'emptylegs':
        navigate('/dashboard?tab=empty-legs');
        break;
      case 'helicopter':
        navigate('/dashboard?tab=helicopter');
        break;
      case 'hotels':
        navigate('/dashboard?tab=hotels');
        break;
      case 'airportransfer':
        navigateWithAuth('/dashboard?tab=concierge&service=airport-transfer');
        break;
      case 'concierge':
        navigateWithAuth('/dashboard?tab=concierge');
        break;
      case 'SPV Formation':
        navigateWithAuth('/dashboard?tab=spv');
        break;
      case 'adventure package':
        navigate('/dashboard?tab=adventures');
        break;
      case 'holiday planer':
        navigateWithAuth('/dashboard?tab=ai-chat&query=help me plan my holiday');
        break;
      case 'travel designer':
        navigateWithAuth('/dashboard?tab=ai-chat&query=design my travel itinerary');
        break;
      case 'Co2 certificate':
        navigate('/dashboard?tab=co2');
        break;
      default:
        navigate('/dashboard');
    }
  };

  // Handle Web3 category clicks
  const handleWeb3Click = (category: string) => {
    switch (category) {
      case 'free emptyleg':
        navigate('/dashboard?tab=empty-legs&filter=free');
        break;
      case 'NFTs':
        navigate('/dashboard?tab=nfts');
        break;
      case 'asset-/tokenization':
        navigateWithAuth('/dashboard?tab=tokenize');
        break;
      case '$PVCX':
        navigateWithAuth('/dashboard?tab=pvcx');
        break;
      case 'chain-escrow':
        navigateWithAuth('/dashboard?tab=escrow');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <div className="w-[calc(100%-16px)] sm:w-full sm:max-w-[780px] mx-2 sm:mx-0 mt-16 sm:mt-32">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-6 border border-gray-300/50 transition-all duration-150 hover:bg-white/12">

        {/* Status Bubble */}
        <div className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-100/60 backdrop-blur-sm rounded-full border border-gray-300/30 mb-2 sm:mb-3">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[9px] sm:text-[10px] text-gray-600 font-medium tracking-wide uppercase">web3 and ai powered multi charter</span>
        </div>

        {/* Sphera AI Search Bar - Minimal with animated title inside */}
        <div className="mt-0 sm:mt-1">
          <div className="relative flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2.5 sm:py-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 transition-all duration-100 focus-within:bg-white focus-within:border-gray-300">
            {/* Command Icon */}
            <span className="text-gray-400 text-xs sm:text-sm font-light flex-shrink-0">⌘</span>

            {/* Input with animated title as placeholder */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[16px] sm:text-[20px] text-gray-800 font-light tracking-tight"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSphereAISearch(searchValue);
                  }
                }}
              />
              {/* Animated typing title as placeholder - shows when input is empty */}
              {!searchValue && (
                <div className="absolute inset-0 flex items-center pointer-events-none">
                  <span className="text-[16px] sm:text-[20px] text-gray-400 font-light tracking-tight">
                    {displayedTitle}
                    <span className="inline-block w-[2px] h-[1em] bg-gray-400 ml-[1px] animate-pulse align-middle" />
                  </span>
                </div>
              )}
            </div>

            {/* Upload Button - For Break the Price (PDF/Image) */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center transition-all duration-100 hover:bg-gray-200 hover:text-gray-700 active:scale-95 flex-shrink-0"
              title="Upload quote (PDF/Image) - Break the Price"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>

            {/* Send Button - Minimal rounded square */}
            <button
              onClick={() => handleSphereAISearch(searchValue)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gray-900 text-white flex items-center justify-center transition-all duration-100 hover:bg-black active:scale-95"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Services Row - RWA, web3.0, charter a jet in same row - no wrap on mobile */}
        <div className="flex gap-1.5 sm:gap-3 mt-2.5 sm:mt-3 items-center overflow-x-auto">
          {/* RWA Button */}
          <div
            onClick={() => toggleSection('rwa')}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95 flex-shrink-0"
          >
            <div className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-gray-900 text-base sm:text-xl font-light transition-transform duration-150 ${currentOpenSection === 'rwa' ? 'rotate-45' : ''}`}>
              +
            </div>
            <span className="text-[11px] sm:text-xs text-gray-700 font-medium tracking-wide">RWA</span>
          </div>

          {/* Web3.0 Button */}
          <div
            onClick={() => toggleSection('web3')}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95 flex-shrink-0"
          >
            <div className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-gray-900 text-base sm:text-xl font-light transition-transform duration-150 ${currentOpenSection === 'web3' ? 'rotate-45' : ''}`}>
              +
            </div>
            <span className="text-[11px] sm:text-xs text-gray-700 font-medium tracking-wide">web3.0</span>
          </div>

          {/* Charter a Jet Button - Same style as RWA/web3 */}
          <div
            onClick={() => setShowCharterFields(!showCharterFields)}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95 flex-shrink-0"
          >
            <div className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-gray-900 text-base sm:text-xl font-light transition-transform duration-150 ${showCharterFields ? 'rotate-45' : ''}`}>
              +
            </div>
            <span className="text-[11px] sm:text-xs text-gray-700 font-medium tracking-wide whitespace-nowrap">charter a jet</span>
          </div>

          {/* Beat the Price Button */}
          <div
            onClick={handleBeatThePrice}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95 flex-shrink-0"
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-gray-900 text-base sm:text-xl font-light">
              +
            </div>
            <span className="text-[11px] sm:text-xs text-gray-700 font-medium tracking-wide whitespace-nowrap">beat the price</span>
          </div>

          {/* Spacer to push sphera to the right */}
          <div className="flex-1" />

          {/* Sphera AI version */}
          <span className="text-[10px] text-gray-400 flex-shrink-0">sphera 1.0</span>
        </div>

        {/* Charter Fields - Expandable, Mobile optimized with equal width fields */}
        <div className={`transition-all duration-150 ${showCharterFields ? 'max-h-[300px] opacity-100 mt-2 sm:mt-3' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {/* Mobile: Stack all fields vertically, Desktop: Single row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            {/* Departure Input with Dropdown - Full width on mobile */}
            <div className="w-full sm:flex-1 relative">
              <div className="flex items-center gap-2 px-3 py-2.5 sm:py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-gray-400 focus-within:bg-white transition-all">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                </svg>
                <input
                  type="text"
                  value={departureInput}
                  onChange={(e) => {
                    setDepartureInput(e.target.value);
                    searchDepartureAirports(e.target.value);
                    if (departureAirport && e.target.value !== `${departureAirport.city} (${departureAirport.code})`) {
                      setDepartureAirport(null);
                    }
                  }}
                  onFocus={() => {
                    setShowDepartureDropdown(true);
                    searchDepartureAirports(departureInput || '');
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowDepartureDropdown(false), 200);
                  }}
                  placeholder="From (city/airport)"
                  className="flex-1 bg-transparent border-none outline-none text-[14px] sm:text-[13px] text-gray-800 placeholder-gray-400 min-w-0"
                />
                {departureAirport && (
                  <button
                    onClick={() => {
                      setDepartureAirport(null);
                      setDepartureInput('');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Departure Dropdown */}
              {showDepartureDropdown && showCharterFields && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                  {isLoadingDeparture ? (
                    <div className="px-3 py-2 text-center text-gray-500 text-xs">Searching...</div>
                  ) : departureAirports.length > 0 ? (
                    departureAirports.map(airport => (
                      <button
                        key={airport.code}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleDepartureSelect(airport)}
                        className="w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                      >
                        <div className="font-medium text-gray-900 text-sm truncate">{airport.name}</div>
                        <div className="text-xs text-gray-400 truncate">{airport.code} • {airport.city}, {airport.country}</div>
                      </button>
                    ))
                  ) : departureInput.length >= 1 ? (
                    <div className="px-3 py-2 text-center text-gray-500 text-xs">No airports found</div>
                  ) : (
                    <div className="px-3 py-2 text-center text-gray-400 text-xs">Type to search airports</div>
                  )}
                </div>
              )}
            </div>

            {/* Destination Input with Dropdown - Full width on mobile */}
            <div className="w-full sm:flex-1 relative">
              <div className="flex items-center gap-2 px-3 py-2.5 sm:py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-gray-400 focus-within:bg-white transition-all">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => {
                    setDestinationInput(e.target.value);
                    searchDestinationAirports(e.target.value);
                    if (destinationAirport && e.target.value !== `${destinationAirport.city} (${destinationAirport.code})`) {
                      setDestinationAirport(null);
                    }
                  }}
                  onFocus={() => {
                    setShowDestinationDropdown(true);
                    searchDestinationAirports(destinationInput || '');
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowDestinationDropdown(false), 200);
                  }}
                  placeholder="To (city/airport)"
                  className="flex-1 bg-transparent border-none outline-none text-[14px] sm:text-[13px] text-gray-800 placeholder-gray-400 min-w-0"
                />
                {destinationAirport && (
                  <button
                    onClick={() => {
                      setDestinationAirport(null);
                      setDestinationInput('');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Destination Dropdown */}
              {showDestinationDropdown && showCharterFields && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                  {isLoadingDestination ? (
                    <div className="px-3 py-2 text-center text-gray-500 text-xs">Searching...</div>
                  ) : destinationAirports.length > 0 ? (
                    destinationAirports.map(airport => (
                      <button
                        key={airport.code}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleDestinationSelect(airport)}
                        className="w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                      >
                        <div className="font-medium text-gray-900 text-sm truncate">{airport.name}</div>
                        <div className="text-xs text-gray-400 truncate">{airport.code} • {airport.city}, {airport.country}</div>
                      </button>
                    ))
                  ) : destinationInput.length >= 1 ? (
                    <div className="px-3 py-2 text-center text-gray-500 text-xs">No airports found</div>
                  ) : (
                    <div className="px-3 py-2 text-center text-gray-400 text-xs">Type to search airports</div>
                  )}
                </div>
              )}
            </div>

            {/* Search Button - Full width on mobile, auto width on desktop */}
            <button
              onClick={handleCharterJetSubmit}
              disabled={!departureAirport || !destinationAirport}
              className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[14px] sm:text-xs font-medium transition-all duration-100 hover:bg-black active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
              Search Jets
            </button>
          </div>
        </div>

        {/* RWA Categories */}
        <div className={`flex flex-wrap gap-1 sm:gap-2 px-0 transition-all duration-150 ${currentOpenSection === 'rwa' ? 'max-h-[300px] opacity-100 mt-2 sm:mt-3 mb-1 sm:mb-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {['p/jets', 'emptylegs', 'helicopter', 'hotels', 'airportransfer', 'concierge', 'SPV Formation', 'adventure package', 'holiday planer', 'travel designer', 'Co2 certificate'].map(cat => (
            <div
              key={cat}
              onClick={() => handleRWAClick(cat)}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded-full text-[10px] sm:text-xs text-gray-700 cursor-pointer transition-all duration-100 border border-gray-300 font-medium hover:bg-gray-200 active:scale-95 hover:border-gray-400"
            >
              {cat}
            </div>
          ))}
        </div>

        {/* Web3 Categories */}
        <div className={`flex flex-wrap gap-1 sm:gap-2 px-0 transition-all duration-150 ${currentOpenSection === 'web3' ? 'max-h-[300px] opacity-100 mt-2 sm:mt-3 mb-1 sm:mb-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {['free emptyleg', 'NFTs', 'asset-/tokenization', '$PVCX', 'chain-escrow'].map(cat => (
            <div
              key={cat}
              onClick={() => handleWeb3Click(cat)}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded-full text-[10px] sm:text-xs text-gray-700 cursor-pointer transition-all duration-100 border border-gray-300 font-medium hover:bg-gray-200 active:scale-95 hover:border-gray-400"
            >
              {cat}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
