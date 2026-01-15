import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plane, Calendar, Users, MapPin, Clock, Luggage, ArrowRight, AlertCircle, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import LandingHeader from '../components/Landingpagenew/LandingHeader';
import Footer from '../components/Landingpagenew/Footer';
import { supabase } from '../lib/supabase';

// Popular airports for autocomplete
const POPULAR_AIRPORTS = [
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK' },
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'USA' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'UAE' },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore' },
  { code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'China' },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'Switzerland' },
  { code: 'GVA', name: 'Geneva', city: 'Geneva', country: 'Switzerland' },
  { code: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany' },
  { code: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona', country: 'Spain' },
  { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'Spain' },
  { code: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'Italy' },
  { code: 'MXP', name: 'Malpensa', city: 'Milan', country: 'Italy' },
  { code: 'VIE', name: 'Vienna Intl', city: 'Vienna', country: 'Austria' },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey' },
  { code: 'ORD', name: "O'Hare", city: 'Chicago', country: 'USA' },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'USA' },
  { code: 'SFO', name: 'San Francisco', city: 'San Francisco', country: 'USA' },
  { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'USA' },
  { code: 'BOS', name: 'Logan Intl', city: 'Boston', country: 'USA' },
  { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', country: 'USA' },
  { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada' },
  { code: 'SYD', name: 'Sydney Kingsford', city: 'Sydney', country: 'Australia' },
  { code: 'MEL', name: 'Melbourne Tullamarine', city: 'Melbourne', country: 'Australia' },
  { code: 'NRT', name: 'Narita', city: 'Tokyo', country: 'Japan' },
  { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japan' },
  { code: 'ICN', name: 'Incheon', city: 'Seoul', country: 'South Korea' },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand' },
  { code: 'KUL', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'DEL', name: 'Indira Gandhi', city: 'Delhi', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji', city: 'Mumbai', country: 'India' },
  { code: 'CPT', name: 'Cape Town Intl', city: 'Cape Town', country: 'South Africa' },
  { code: 'JNB', name: 'O.R. Tambo', city: 'Johannesburg', country: 'South Africa' },
  { code: 'LOS', name: 'Murtala Muhammed', city: 'Lagos', country: 'Nigeria' },
  { code: 'ABV', name: 'Nnamdi Azikiwe', city: 'Abuja', country: 'Nigeria' },
  { code: 'NBO', name: 'Jomo Kenyatta', city: 'Nairobi', country: 'Kenya' },
  { code: 'MBA', name: 'Moi Intl', city: 'Mombasa', country: 'Kenya' },
  { code: 'CAI', name: 'Cairo Intl', city: 'Cairo', country: 'Egypt' },
  { code: 'HRG', name: 'Hurghada Intl', city: 'Hurghada', country: 'Egypt' },
  { code: 'ADD', name: 'Bole Intl', city: 'Addis Ababa', country: 'Ethiopia' },
  { code: 'ACC', name: 'Kotoka Intl', city: 'Accra', country: 'Ghana' },
  { code: 'CMN', name: 'Mohammed V', city: 'Casablanca', country: 'Morocco' },
  { code: 'RAK', name: 'Menara', city: 'Marrakech', country: 'Morocco' },
  { code: 'ALG', name: 'Houari Boumediene', city: 'Algiers', country: 'Algeria' },
  { code: 'TUN', name: 'Tunis-Carthage', city: 'Tunis', country: 'Tunisia' },
  { code: 'DAR', name: 'Julius Nyerere', city: 'Dar es Salaam', country: 'Tanzania' },
  { code: 'EBB', name: 'Entebbe Intl', city: 'Entebbe', country: 'Uganda' },
  { code: 'KGL', name: 'Kigali Intl', city: 'Kigali', country: 'Rwanda' },
  { code: 'DKR', name: 'Blaise Diagne', city: 'Dakar', country: 'Senegal' },
  { code: 'ABJ', name: 'Félix-Houphouët-Boigny', city: 'Abidjan', country: 'Ivory Coast' },
  { code: 'MRU', name: 'Sir Seewoosagur Ramgoolam', city: 'Mauritius', country: 'Mauritius' },
  { code: 'GRU', name: 'Guarulhos', city: 'São Paulo', country: 'Brazil' },
  { code: 'MEX', name: 'Benito Juárez', city: 'Mexico City', country: 'Mexico' },
  { code: 'EZE', name: 'Ezeiza', city: 'Buenos Aires', country: 'Argentina' },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'Qatar' },
  { code: 'AUH', name: 'Abu Dhabi Intl', city: 'Abu Dhabi', country: 'UAE' },
  { code: 'LGW', name: 'Gatwick', city: 'London', country: 'UK' },
  { code: 'STN', name: 'Stansted', city: 'London', country: 'UK' },
  { code: 'LTN', name: 'Luton', city: 'London', country: 'UK' },
  { code: 'MAN', name: 'Manchester', city: 'Manchester', country: 'UK' },
  { code: 'EDI', name: 'Edinburgh', city: 'Edinburgh', country: 'UK' },
  { code: 'DUB', name: 'Dublin', city: 'Dublin', country: 'Ireland' },
  { code: 'LIS', name: 'Lisbon Portela', city: 'Lisbon', country: 'Portugal' },
  { code: 'ATH', name: 'Athens Intl', city: 'Athens', country: 'Greece' },
  { code: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway' },
  { code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden' },
  { code: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'Denmark' },
  { code: 'HEL', name: 'Helsinki Vantaa', city: 'Helsinki', country: 'Finland' },
  { code: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'Poland' },
  { code: 'PRG', name: 'Václav Havel', city: 'Prague', country: 'Czech Republic' },
  { code: 'BUD', name: 'Budapest Ferenc', city: 'Budapest', country: 'Hungary' },
];

interface FlightOffer {
  id: string;
  offerId: string;
  offerRequestId: string;
  airline: {
    name: string;
    iataCode: string;
    logoUrl: string | null;
  };
  flightNumber: string;
  departure: {
    airport: string;
    airportName: string;
    city: string;
    time: string;
    terminal: string | null;
  };
  arrival: {
    airport: string;
    airportName: string;
    city: string;
    time: string;
    terminal: string | null;
  };
  duration: string;
  durationMinutes: number;
  stops: number;
  stopDetails: Array<{
    airport: string;
    city: string;
    duration: string | null;
  }>;
  segments: Array<{
    flightNumber: string;
    aircraft: string | null;
    departure: {
      airport: string;
      airportName: string;
      time: string;
      terminal: string | null;
    };
    arrival: {
      airport: string;
      airportName: string;
      time: string;
      terminal: string | null;
    };
    duration: string | null;
    cabinClass: string;
  }>;
  returnJourney: {
    departure: { airport: string; time: string };
    arrival: { airport: string; time: string };
    duration: string | null;
    stops: number;
  } | null;
  price: {
    amount: number;
    currency: string;
    perPassenger: number;
  };
  baggage: {
    checkedBags: number;
    cabinBags: number;
    checkedBagWeight: number | null;
  };
  cabinClass: string;
  cabinClassName: string;
  expiresAt: string;
  conditions: {
    refundable: boolean;
    changeable: boolean;
  };
  rawOffer: any;
}

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: string;
  journeyType: 'one-way' | 'return' | 'multi-city';
}

export default function FlightTickets() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'economy',
    journeyType: 'return',
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Booking flow moved to /book/flight/:offerId page

  // Airport autocomplete
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  // Filters
  const [sortBy, setSortBy] = useState('least-expensive');
  const [maxStops, setMaxStops] = useState('any');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter airports based on search input
  const getFilteredAirports = (query: string) => {
    if (!query) return POPULAR_AIRPORTS.slice(0, 10);
    const lowerQuery = query.toLowerCase();
    return POPULAR_AIRPORTS.filter(
      airport =>
        airport.code.toLowerCase().includes(lowerQuery) ||
        airport.name.toLowerCase().includes(lowerQuery) ||
        airport.city.toLowerCase().includes(lowerQuery) ||
        airport.country.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  };

  const handleAirportSelect = (airport: typeof POPULAR_AIRPORTS[0], field: 'origin' | 'destination') => {
    setSearchParams(prev => ({ ...prev, [field]: airport.code }));
    if (field === 'origin') {
      setShowOriginDropdown(false);
    } else {
      setShowDestinationDropdown(false);
    }
  };

  // Load search params from URL or localStorage on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // Support both 'origin'/'destination' and 'from'/'to' params
    const urlOrigin = urlParams.get('origin') || urlParams.get('from');
    const urlDestination = urlParams.get('destination') || urlParams.get('to');
    const urlDate = urlParams.get('date');
    const urlPassengers = urlParams.get('passengers');
    const urlJourneyType = urlParams.get('journeyType') as 'one-way' | 'return' | 'multi-city' | null;
    const urlReturnDate = urlParams.get('returnDate');

    // If we have origin and destination from URL, pre-fill the form
    if (urlOrigin || urlDestination) {
      setSearchParams(prev => ({
        ...prev,
        origin: urlOrigin || '',
        destination: urlDestination || '',
        departureDate: urlDate || '',
        returnDate: urlReturnDate || '',
        passengers: urlPassengers ? parseInt(urlPassengers) : 1,
        journeyType: urlJourneyType || 'return'
      }));

      // Only auto-search if we have all required fields
      if (urlOrigin && urlDestination && urlDate) {
        const params = {
          origin: urlOrigin,
          destination: urlDestination,
          departureDate: urlDate,
          returnDate: urlReturnDate || '',
          passengers: urlPassengers ? parseInt(urlPassengers) : 1,
          journeyType: urlJourneyType || 'return',
          cabinClass: 'economy'
        };
        setTimeout(() => handleSearchWithParams(params), 100);
      }
      return;
    }

    // Fallback to localStorage
    const savedSearch = localStorage.getItem('flightSearchParams');
    if (savedSearch) {
      try {
        const parsed = JSON.parse(savedSearch);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
          setSearchParams(prev => ({
            ...prev,
            origin: parsed.origin || '',
            destination: parsed.destination || '',
            departureDate: parsed.departureDate || '',
            returnDate: parsed.returnDate || '',
            passengers: parsed.passengers || 1,
            journeyType: parsed.journeyType || 'return'
          }));
        }
      } catch (e) {
        console.error('Error parsing saved search:', e);
      }
    }
  }, []);

  const handleSearchWithParams = async (params: SearchParams) => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      // Save search to localStorage
      localStorage.setItem('flightSearchParams', JSON.stringify({
        ...params,
        timestamp: Date.now()
      }));

      // Call the search-flights Edge Function
      console.log('Searching flights with params:', {
        origin: params.origin.toUpperCase(),
        destination: params.destination.toUpperCase(),
        departureDate: params.departureDate,
        returnDate: params.journeyType !== 'one-way' ? params.returnDate : undefined,
        passengers: params.passengers,
        cabinClass: params.cabinClass
      });

      const { data, error } = await supabase.functions.invoke('search-flights', {
        body: {
          origin: params.origin.toUpperCase(),
          destination: params.destination.toUpperCase(),
          departureDate: params.departureDate,
          returnDate: params.journeyType !== 'one-way' && params.returnDate ? params.returnDate : undefined,
          passengers: params.passengers,
          cabinClass: params.cabinClass
        }
      });

      console.log('Search response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to search flights');
      }

      if (!data) {
        throw new Error('No response from flight search API');
      }

      if (!data.success) {
        throw new Error(data.error || 'No flights found');
      }

      console.log(`Found ${data.offers?.length || 0} flight offers`);
      setFlights(data.offers || []);

    } catch (err: any) {
      console.error('Flight search error:', err);
      setSearchError(err.message || 'Failed to search flights. Please try again.');
      setFlights([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Check if input is a valid 3-letter IATA code
  const isValidIATACode = (code: string) => {
    return /^[A-Za-z]{3}$/.test(code);
  };

  // Try to find airport code from city name
  const findAirportCode = (input: string): string | null => {
    const lowerInput = input.toLowerCase().trim();
    const airport = POPULAR_AIRPORTS.find(
      a => a.code.toLowerCase() === lowerInput ||
           a.city.toLowerCase() === lowerInput ||
           a.name.toLowerCase() === lowerInput
    );
    return airport?.code || null;
  };

  const handleSearch = async () => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
      setSearchError('Please enter origin, destination, and departure date');
      return;
    }

    // Try to resolve city names to IATA codes
    let originCode = searchParams.origin.trim();
    let destinationCode = searchParams.destination.trim();

    if (!isValidIATACode(originCode)) {
      const foundCode = findAirportCode(originCode);
      if (foundCode) {
        originCode = foundCode;
        setSearchParams(prev => ({ ...prev, origin: foundCode }));
      } else {
        setSearchError('Please select an origin airport from the dropdown or enter a valid 3-letter airport code (e.g., LHR, JFK)');
        return;
      }
    }

    if (!isValidIATACode(destinationCode)) {
      const foundCode = findAirportCode(destinationCode);
      if (foundCode) {
        destinationCode = foundCode;
        setSearchParams(prev => ({ ...prev, destination: foundCode }));
      } else {
        setSearchError('Please select a destination airport from the dropdown or enter a valid 3-letter airport code (e.g., LHR, JFK)');
        return;
      }
    }

    await handleSearchWithParams({
      ...searchParams,
      origin: originCode.toUpperCase(),
      destination: destinationCode.toUpperCase()
    });
  };

  const handleFlightSelect = (flight: FlightOffer) => {
    // Navigate to full-page booking flow with flight data in state
    navigate(`/book/flight/${flight.offerId}?passengers=${searchParams.passengers}`, {
      state: { flight, searchParams }
    });
  };

  // handleBookingComplete moved to FlightBooking page

  // Apply filters and sorting
  const filteredFlights = React.useMemo(() => {
    let result = [...flights];

    // Filter by stops
    if (maxStops !== 'any') {
      const maxStopsNum = maxStops === 'direct' ? 0 : parseInt(maxStops);
      result = result.filter(f => f.stops <= maxStopsNum);
    }

    // Sort
    switch (sortBy) {
      case 'least-expensive':
        result.sort((a, b) => a.price.amount - b.price.amount);
        break;
      case 'most-expensive':
        result.sort((a, b) => b.price.amount - a.price.amount);
        break;
      case 'shortest':
        result.sort((a, b) => a.durationMinutes - b.durationMinutes);
        break;
      case 'longest':
        result.sort((a, b) => b.durationMinutes - a.durationMinutes);
        break;
    }

    return result;
  }, [flights, sortBy, maxStops]);

  const formatTime = (isoString: string) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader onGetStarted={handleGetStarted} />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-3 tracking-tight">
            Flight Tickets
          </h1>
          <p className="text-gray-500 text-base sm:text-lg mb-8">
            Search and book flights with crypto payments
          </p>

          {/* Journey Type Pills */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'one-way', label: 'One way' },
              { id: 'return', label: 'Return' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setSearchParams({ ...searchParams, journeyType: type.id as any })}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  searchParams.journeyType === type.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow p-2">
            <div className="flex flex-col sm:flex-row">
              {/* Origin */}
              <div ref={originRef} className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 relative">
                <label className="block text-xs font-medium text-gray-900 mb-1">From</label>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="City or airport..."
                    value={searchParams.origin}
                    onChange={(e) => {
                      setSearchParams({ ...searchParams, origin: e.target.value });
                      setShowOriginDropdown(true);
                    }}
                    onFocus={() => setShowOriginDropdown(true)}
                    className="w-full text-sm text-gray-600 placeholder-gray-400 bg-transparent outline-none"
                  />
                </div>
                {/* Origin Dropdown */}
                {showOriginDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-64 overflow-y-auto">
                    {getFilteredAirports(searchParams.origin).map((airport) => (
                      <button
                        key={airport.code}
                        onClick={() => handleAirportSelect(airport, 'origin')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-gray-700">{airport.code}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{airport.name}</p>
                          <p className="text-xs text-gray-500 truncate">{airport.city}, {airport.country}</p>
                        </div>
                      </button>
                    ))}
                    {getFilteredAirports(searchParams.origin).length === 0 && searchParams.origin.length >= 3 && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Using code: <span className="font-mono font-bold">{searchParams.origin}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Destination */}
              <div ref={destinationRef} className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 relative">
                <label className="block text-xs font-medium text-gray-900 mb-1">To</label>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="City or airport..."
                    value={searchParams.destination}
                    onChange={(e) => {
                      setSearchParams({ ...searchParams, destination: e.target.value });
                      setShowDestinationDropdown(true);
                    }}
                    onFocus={() => setShowDestinationDropdown(true)}
                    className="w-full text-sm text-gray-600 placeholder-gray-400 bg-transparent outline-none"
                  />
                </div>
                {/* Destination Dropdown */}
                {showDestinationDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-64 overflow-y-auto">
                    {getFilteredAirports(searchParams.destination).map((airport) => (
                      <button
                        key={airport.code}
                        onClick={() => handleAirportSelect(airport, 'destination')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-gray-700">{airport.code}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{airport.name}</p>
                          <p className="text-xs text-gray-500 truncate">{airport.city}, {airport.country}</p>
                        </div>
                      </button>
                    ))}
                    {getFilteredAirports(searchParams.destination).length === 0 && searchParams.destination.length >= 3 && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Using code: <span className="font-mono font-bold">{searchParams.destination}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Departure Date */}
              <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                <label className="block text-xs font-medium text-gray-900 mb-1">Departure</label>
                <input
                  type="date"
                  value={searchParams.departureDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSearchParams({ ...searchParams, departureDate: e.target.value })}
                  className="w-full text-sm text-gray-600 bg-transparent outline-none"
                />
              </div>

              {/* Return Date */}
              {searchParams.journeyType !== 'one-way' && (
                <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                  <label className="block text-xs font-medium text-gray-900 mb-1">Return</label>
                  <input
                    type="date"
                    value={searchParams.returnDate}
                    min={searchParams.departureDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSearchParams({ ...searchParams, returnDate: e.target.value })}
                    className="w-full text-sm text-gray-600 bg-transparent outline-none"
                  />
                </div>
              )}

              {/* Passengers */}
              <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                <label className="block text-xs font-medium text-gray-900 mb-1">Passengers</label>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400 flex-shrink-0" />
                  <select
                    value={searchParams.passengers}
                    onChange={(e) => setSearchParams({ ...searchParams, passengers: parseInt(e.target.value) })}
                    className="w-full text-sm text-gray-600 bg-transparent outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <option key={num} value={num}>{num} adult{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-center justify-center p-2">
                <button
                  onClick={handleSearch}
                  disabled={!searchParams.origin || !searchParams.destination || !searchParams.departureDate || isSearching}
                  className="w-full sm:w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search size={18} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{searchError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills - Cabin Class */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'economy', label: 'Economy' },
              { id: 'premium_economy', label: 'Premium Economy' },
              { id: 'business', label: 'Business' },
              { id: 'first', label: 'First Class' },
            ].map((cabin) => (
              <button
                key={cabin.id}
                onClick={() => setSearchParams({ ...searchParams, cabinClass: cabin.id })}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  searchParams.cabinClass === cabin.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cabin.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {!hasSearched ? (
          // Initial State
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Plane className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for flights</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Enter airport codes (e.g., LHR for London Heathrow, JFK for New York) and travel dates to find available flights
            </p>
          </div>
        ) : (
          <>
          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {flights.length} flight{flights.length !== 1 ? 's' : ''} found
            </p>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>

          {/* Mobile Filter Overlay */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-xl overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* Search Summary */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {searchParams.origin} → {searchParams.destination}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {searchParams.journeyType === 'one-way' ? 'One way' : 'Return'} · {searchParams.passengers} passenger{searchParams.passengers > 1 ? 's' : ''}
                    </p>
                  </div>
                  {/* Sort By */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Sort by</h4>
                    <div className="space-y-2">
                      {[
                        { id: 'least-expensive', label: 'Least expensive' },
                        { id: 'most-expensive', label: 'Most expensive' },
                        { id: 'shortest', label: 'Shortest duration' },
                        { id: 'longest', label: 'Longest duration' },
                      ].map((option) => (
                        <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="mobileSortBy"
                            checked={sortBy === option.id}
                            onChange={() => setSortBy(option.id)}
                            className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Stops Filter */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Stops</h4>
                    <div className="space-y-2">
                      {[
                        { id: 'direct', label: 'Direct only' },
                        { id: '1', label: '1 stop at most' },
                        { id: '2', label: '2 stops at most' },
                        { id: 'any', label: 'Any number of stops' },
                      ].map((option) => (
                        <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="mobileStops"
                            checked={maxStops === option.id}
                            onChange={() => setMaxStops(option.id)}
                            className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-6">
            {/* Left Sidebar - Filters */}
            <div className="w-56 flex-shrink-0 hidden lg:block">
              {/* Search Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  {searchParams.origin} → {searchParams.destination}
                </h4>
                <p className="text-xs text-gray-500">
                  {searchParams.journeyType === 'one-way' ? 'One way' : 'Return'} · {searchParams.passengers} passenger{searchParams.passengers > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(searchParams.departureDate)}
                  {searchParams.returnDate && ` - ${formatDate(searchParams.returnDate)}`}
                </p>
              </div>

              {/* Sort By */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Sort by</h4>
                <div className="space-y-2">
                  {[
                    { id: 'least-expensive', label: 'Least expensive' },
                    { id: 'most-expensive', label: 'Most expensive' },
                    { id: 'shortest', label: 'Shortest duration' },
                    { id: 'longest', label: 'Longest duration' },
                  ].map((option) => (
                    <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={sortBy === option.id}
                        onChange={() => setSortBy(option.id)}
                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stops Filter */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Stops</h4>
                <div className="space-y-2">
                  {[
                    { id: 'direct', label: 'Direct only' },
                    { id: '1', label: '1 stop at most' },
                    { id: '2', label: '2 stops at most' },
                    { id: 'any', label: 'Any number of stops' },
                  ].map((option) => (
                    <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stops"
                        checked={maxStops === option.id}
                        onChange={() => setMaxStops(option.id)}
                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content - Flight Results */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''} available
                </p>
                {flights.length > 0 && (
                  <button
                    onClick={handleSearch}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                )}
              </div>

              {isSearching ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                    {/* Spinning ring */}
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                    <div className="absolute inset-0 border-4 border-transparent border-t-gray-900 rounded-full animate-spin" />
                    {/* Center icon */}
                    <Plane className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Searching flights...</h3>
                  <p className="text-sm text-gray-500">Finding the best options for your trip</p>
                  <div className="flex justify-center gap-1 mt-4">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : filteredFlights.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-4">
                    <Plane className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    {flights.length > 0
                      ? 'Try adjusting your filters to see more results'
                      : 'No flights available for this route and date. Try different dates or airports.'}
                  </p>
                  {flights.length === 0 && (
                    <button
                      onClick={() => navigate(`/dashboard/chat?query=Find me a flight from ${searchParams.origin} to ${searchParams.destination} on ${searchParams.departureDate}&newChat=true`)}
                      className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Search with AI Assistant
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFlights.map((flight) => (
                    <div
                      key={flight.id}
                      onClick={() => handleFlightSelect(flight)}
                      className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Airline & Times */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {flight.airline.logoUrl ? (
                              <img
                                src={flight.airline.logoUrl}
                                alt={flight.airline.name}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <Plane className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 ${flight.airline.logoUrl ? 'hidden' : ''}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-3">
                              <span className="text-sm sm:text-lg font-semibold text-gray-900">
                                {formatTime(flight.departure.time)}
                              </span>
                              <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm sm:text-lg font-semibold text-gray-900">
                                {formatTime(flight.arrival.time)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {flight.airline.name} · {flight.flightNumber}
                            </p>
                          </div>
                        </div>

                        {/* Duration & Route - Hidden on mobile */}
                        <div className="text-center px-3 sm:px-6 hidden sm:block">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock size={14} className="text-gray-400" />
                            <span>{flight.duration}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {flight.departure.airport} – {flight.arrival.airport}
                          </p>
                        </div>

                        {/* Stops - Hidden on mobile/tablet */}
                        <div className="text-center px-4 hidden md:block">
                          <p className={`text-sm font-medium ${flight.stops === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                          </p>
                          {flight.stops > 0 && flight.stopDetails[0] && (
                            <p className="text-xs text-gray-500">{flight.stopDetails[0].airport}</p>
                          )}
                        </div>

                        {/* Baggage - Hidden on mobile/tablet/small desktop */}
                        <div className="text-center px-4 hidden lg:block">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Luggage size={14} className="text-gray-400" />
                            <span>{flight.baggage.checkedBags > 0 ? `${flight.baggage.checkedBags} bag` : 'No bags'}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right pl-2 sm:pl-4 flex-shrink-0">
                          <p className="text-base sm:text-xl font-bold text-gray-900">
                            {flight.price.currency === 'USD' ? '$' : flight.price.currency}{flight.price.perPassenger.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500">per person</p>
                        </div>
                      </div>

                      {/* Mobile: Extra info row */}
                      <div className="flex items-center gap-3 mt-2 sm:hidden text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {flight.duration}
                        </span>
                        <span>·</span>
                        <span className={flight.stops === 0 ? 'text-green-600' : ''}>
                          {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                        </span>
                        <span>·</span>
                        <span>{flight.departure.airport} – {flight.arrival.airport}</span>
                      </div>

                      {/* Return journey info */}
                      {flight.returnJourney && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span className="text-xs font-medium text-gray-400 uppercase">Return</span>
                          <span>{formatTime(flight.returnJourney.departure.time)} - {formatTime(flight.returnJourney.arrival.time)}</span>
                          <span className="text-gray-400 hidden sm:inline">·</span>
                          <span className="hidden sm:inline">{flight.returnJourney.stops === 0 ? 'Non-stop' : `${flight.returnJourney.stops} stop${flight.returnJourney.stops > 1 ? 's' : ''}`}</span>
                        </div>
                      )}

                      {/* Hover indicator - Hidden on mobile (tap instead) */}
                      <div className="mt-3 hidden sm:flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-blue-600 font-medium">Select this flight →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>

      <Footer />

      {/* Booking flow moved to /book/flight/:offerId page */}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
