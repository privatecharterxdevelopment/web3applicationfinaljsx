import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plane, MapPin, Clock, ArrowRight, AlertCircle, RefreshCw, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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
  { code: 'CPT', name: 'Cape Town Intl', city: 'Cape Town', country: 'South Africa' },
  { code: 'JNB', name: 'O.R. Tambo', city: 'Johannesburg', country: 'South Africa' },
  { code: 'LOS', name: 'Murtala Muhammed', city: 'Lagos', country: 'Nigeria' },
  { code: 'NBO', name: 'Jomo Kenyatta', city: 'Nairobi', country: 'Kenya' },
  { code: 'CAI', name: 'Cairo Intl', city: 'Cairo', country: 'Egypt' },
];

interface EmptyLeg {
  id: string;
  from: string;
  to: string;
  from_iata: string;
  to_iata: string;
  from_city: string;
  to_city: string;
  from_country: string;
  to_country: string;
  aircraft_type: string;
  category: string;
  capacity: number;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  price_usd: number;
  currency: string;
  operator: string;
  image_url: string;
  flight_duration_hours: number;
}

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: number;
}

export default function EmptyLegs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    passengers: 1,
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [emptyLegs, setEmptyLegs] = useState<EmptyLeg[]>([]);
  const [allEmptyLegs, setAllEmptyLegs] = useState<EmptyLeg[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Airport autocomplete
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  // Filters
  const [sortBy, setSortBy] = useState('least-expensive');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  // Load all empty legs on mount
  useEffect(() => {
    loadEmptyLegs();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, sortBy, hasSearched]);

  const loadEmptyLegs = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('EmptyLegs_')
        .select('*')
        .gte('departure_date', today)
        .order('departure_date', { ascending: true });

      if (error) throw error;
      setAllEmptyLegs(data || []);
    } catch (err) {
      console.error('Error loading empty legs:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
    setSearchParams(prev => ({ ...prev, [field]: airport.city }));
    if (field === 'origin') {
      setShowOriginDropdown(false);
    } else {
      setShowDestinationDropdown(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      let query = supabase
        .from('EmptyLegs_')
        .select('*')
        .gte('departure_date', new Date().toISOString().split('T')[0])
        .order('departure_date', { ascending: true });

      if (searchParams.origin) {
        const originLower = searchParams.origin.toLowerCase();
        query = query.or(`from_city.ilike.%${originLower}%,from_iata.ilike.%${originLower}%,from.ilike.%${originLower}%`);
      }

      if (searchParams.destination) {
        const destLower = searchParams.destination.toLowerCase();
        query = query.or(`to_city.ilike.%${destLower}%,to_iata.ilike.%${destLower}%,to.ilike.%${destLower}%`);
      }

      if (searchParams.departureDate) {
        query = query.eq('departure_date', searchParams.departureDate);
      }

      if (searchParams.passengers > 1) {
        query = query.gte('capacity', searchParams.passengers);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEmptyLegs(data || []);
    } catch (err: any) {
      console.error('Empty legs search error:', err);
      setSearchError(err.message || 'Failed to search. Please try again.');
      setEmptyLegs([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEmptyLegSelect = (leg: EmptyLeg) => {
    navigate(`/book/empty-leg/${leg.id}?passengers=${searchParams.passengers}`, {
      state: { emptyLeg: leg, passengers: searchParams.passengers }
    });
  };

  // Apply filters and sorting with pagination
  const { filteredLegs, totalPages, totalItems } = React.useMemo(() => {
    let result = hasSearched ? [...emptyLegs] : [...allEmptyLegs];

    if (categoryFilter !== 'all') {
      result = result.filter(leg =>
        leg.category?.toLowerCase().includes(categoryFilter.toLowerCase()) ||
        leg.aircraft_type?.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'least-expensive':
        result.sort((a, b) => (a.price_usd || a.price || 0) - (b.price_usd || b.price || 0));
        break;
      case 'most-expensive':
        result.sort((a, b) => (b.price_usd || b.price || 0) - (a.price_usd || a.price || 0));
        break;
      case 'soonest':
        result.sort((a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime());
        break;
    }

    const totalItems = result.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedResult = result.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { filteredLegs: paginatedResult, totalPages, totalItems };
  }, [emptyLegs, allEmptyLegs, hasSearched, sortBy, categoryFilter, currentPage]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) return 'On Request';
    return `$${price.toLocaleString()}`;
  };

  const formatDuration = (hours: number | null | undefined) => {
    if (!hours) return '';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader onGetStarted={() => navigate('/dashboard')} />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl font-light text-gray-900 tracking-tight">
              Empty Leg Flights
            </h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              Up to 75% Off
            </span>
          </div>
          <p className="text-gray-500 text-lg mb-8">
            Book discounted private jet repositioning flights with crypto
          </p>

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
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                <label className="block text-xs font-medium text-gray-900 mb-1">Date</label>
                <input
                  type="date"
                  value={searchParams.departureDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSearchParams({ ...searchParams, departureDate: e.target.value })}
                  className="w-full text-sm text-gray-600 bg-transparent outline-none"
                />
              </div>

              {/* Passengers */}
              <div className="hidden sm:block flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                <label className="block text-xs font-medium text-gray-900 mb-1">Passengers</label>
                <select
                  value={searchParams.passengers}
                  onChange={(e) => setSearchParams({ ...searchParams, passengers: parseInt(e.target.value) })}
                  className="w-full text-sm text-gray-600 bg-transparent outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <option key={num} value={num}>{num} pax</option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-center justify-center p-2">
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full sm:w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
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

          {searchError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{searchError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'all', label: 'All Jets' },
              { id: 'light', label: 'Light Jet' },
              { id: 'mid', label: 'Mid-Size' },
              { id: 'heavy', label: 'Heavy Jet' },
              { id: 'ultra', label: 'Ultra Long Range' },
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setCategoryFilter(category.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  categoryFilter === category.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-56 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Sort by</h4>
              <div className="space-y-2">
                {[
                  { id: 'least-expensive', label: 'Least expensive' },
                  { id: 'most-expensive', label: 'Most expensive' },
                  { id: 'soonest', label: 'Soonest departure' },
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

            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">What are Empty Legs?</h4>
              <p className="text-xs text-green-700 leading-relaxed">
                Empty leg flights are repositioning flights when a jet needs to return to base. Book at up to 75% off regular prices.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {totalItems} empty leg{totalItems !== 1 ? 's' : ''} available
                {totalPages > 1 && <span className="text-gray-400"> · Page {currentPage} of {totalPages}</span>}
              </p>
              <button
                onClick={loadEmptyLegs}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            {isLoading || isSearching ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-gray-900 rounded-full animate-spin" />
                  <Plane className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isSearching ? 'Searching empty legs...' : 'Loading empty legs...'}
                </h3>
                <p className="text-sm text-gray-500">Finding the best deals for you</p>
              </div>
            ) : filteredLegs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No empty legs found</h3>
                <p className="text-sm text-gray-500 mb-6">Try different dates or destinations.</p>
                <button
                  onClick={() => {
                    setSearchParams({ origin: '', destination: '', departureDate: '', passengers: 1 });
                    setHasSearched(false);
                  }}
                  className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
                >
                  View All Empty Legs
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filteredLegs.map((leg) => (
                    <div
                      key={leg.id}
                      onClick={() => handleEmptyLegSelect(leg)}
                      className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Aircraft Image & Times */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {leg.image_url ? (
                              <img
                                src={leg.image_url}
                                alt={leg.aircraft_type}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <Plane className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 ${leg.image_url ? 'hidden' : ''}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-3">
                              <span className="text-sm sm:text-lg font-semibold text-gray-900">
                                {formatTime(leg.departure_time) || leg.from_iata || leg.from?.slice(0, 3)}
                              </span>
                              <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm sm:text-lg font-semibold text-gray-900">
                                {formatTime(leg.arrival_time) || leg.to_iata || leg.to?.slice(0, 3)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {leg.aircraft_type || 'Private Jet'} · {leg.from_city || leg.from} → {leg.to_city || leg.to}
                            </p>
                          </div>
                        </div>

                        {/* Duration & Date */}
                        <div className="text-center px-3 sm:px-6 hidden sm:block">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock size={14} className="text-gray-400" />
                            <span>{leg.flight_duration_hours ? formatDuration(leg.flight_duration_hours) : 'Direct'}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(leg.departure_date)}
                          </p>
                        </div>

                        {/* Capacity */}
                        <div className="text-center px-4 hidden md:block">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Users size={14} className="text-gray-400" />
                            <span>{leg.capacity} seats</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right pl-2 sm:pl-4 flex-shrink-0">
                          <p className="text-base sm:text-xl font-bold text-gray-900">
                            {formatPrice(leg.price_usd || leg.price)}
                          </p>
                          <p className="text-[10px] sm:text-xs text-green-600">Save up to 75%</p>
                        </div>
                      </div>

                      {/* Mobile: Extra info row */}
                      <div className="flex items-center gap-3 mt-2 sm:hidden text-xs text-gray-500">
                        <span>{formatDate(leg.departure_date)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {leg.flight_duration_hours ? formatDuration(leg.flight_duration_hours) : 'Direct'}
                        </span>
                        <span>·</span>
                        <span>{leg.capacity} pax</span>
                      </div>

                      {/* Hover indicator */}
                      <div className="mt-3 hidden sm:flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-blue-600 font-medium">View details & book →</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                        .map((page, idx, arr) => (
                          <React.Fragment key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === page
                                  ? 'bg-gray-900 text-white'
                                  : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
