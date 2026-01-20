import React, { useState, useEffect } from 'react';
import { Plane, MapPin, Clock, Search, Gavel, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FlightOp {
  id: string;
  title: string;
  description: string;
  origin: string;
  destination: string;
  price: number;
  currency: string;
  departure_date: string;
  image_url: string;
  aircraft_type: string;
  passengers: number;
  duration: string;
  is_featured: boolean;
}

interface FlightOpsViewProps {
  onSelectRoute?: (route: FlightOp, bidCount: number) => void;
}

// Price ranges for filter
const priceRanges = [
  { id: 'all', label: 'All Prices', min: 0, max: Infinity },
  { id: 'under10k', label: 'Under $10K', min: 0, max: 10000 },
  { id: '10k-25k', label: '$10K - $25K', min: 10000, max: 25000 },
  { id: '25k-50k', label: '$25K - $50K', min: 25000, max: 50000 },
  { id: 'over50k', label: 'Over $50K', min: 50000, max: Infinity },
];

// Region definitions
const regions = [
  { id: 'all', label: 'All' },
  { id: 'usa', label: 'USA' },
  { id: 'europe', label: 'Europe' },
  { id: 'asia', label: 'Asia' },
  { id: 'caribbean', label: 'Caribbean' },
];

// Keywords for region matching
const regionKeywords: Record<string, string[]> = {
  usa: ['new york', 'los angeles', 'miami', 'boston', 'chicago', 'dallas', 'houston', 'austin', 'nashville', 'pittsburgh', 'nantucket', 'martha', 'vineyard', 'telluride', 'jackson', 'sun valley', 'aspen', 'denver', 'seattle', 'phoenix', 'scottsdale', 'las vegas', 'san francisco', 'atlanta', 'washington', 'palm beach', 'teterboro', 'van nuys', 'usa', 'united states'],
  europe: ['london', 'paris', 'rome', 'milan', 'barcelona', 'madrid', 'monaco', 'nice', 'cannes', 'zurich', 'geneva', 'amsterdam', 'vienna', 'berlin', 'munich', 'frankfurt', 'lisbon', 'athens', 'santorini', 'mykonos', 'istanbul', 'st moritz', 'st. moritz', 'courchevel', 'gstaad', 'sardinia', 'mallorca', 'palma', 'ibiza', 'st tropez', 'como', 'amalfi', 'naples', 'florence', 'venice', 'copenhagen', 'stockholm', 'oslo', 'dublin', 'edinburgh', 'brussels', 'prague', 'budapest', 'europe', 'uk', 'switzerland', 'france', 'italy', 'spain', 'germany', 'austria', 'greece', 'portugal'],
  asia: ['tokyo', 'singapore', 'hong kong', 'bangkok', 'bali', 'phuket', 'maldives', 'dubai', 'seychelles', 'mauritius', 'asia', 'japan', 'thailand', 'indonesia', 'uae'],
  caribbean: ['turks', 'caicos', 'anguilla', 'bahamas', 'nassau', 'caribbean', 'cabo', 'cancun', 'tulum', 'jamaica', 'barbados', 'st barts', 'virgin islands'],
};

export default function FlightOpsView({ onSelectRoute }: FlightOpsViewProps) {
  const [flightOps, setFlightOps] = useState<FlightOp[]>([]);
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  // Fetch flight ops and bid counts
  const fetchFlightOps = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('flight_ops_routes')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply price filter
      const selectedPrice = priceRanges.find(p => p.id === priceFilter);
      if (selectedPrice && priceFilter !== 'all') {
        query = query.gte('price', selectedPrice.min);
        if (selectedPrice.max !== Infinity) {
          query = query.lte('price', selectedPrice.max);
        }
      }

      // Apply region filter using text search on origin/destination
      if (regionFilter !== 'all') {
        const keywords = regionKeywords[regionFilter] || [];
        if (keywords.length > 0) {
          // Build OR query for destination matching
          const orConditions = keywords.map(k => `destination.ilike.%${k}%`).join(',');
          const originConditions = keywords.slice(0, 10).map(k => `origin.ilike.%${k}%`).join(',');
          query = query.or(`${orConditions},${originConditions}`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setFlightOps(data || []);

      // Fetch bid counts for the last 7 days
      if (data && data.length > 0) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: bidsData, error: bidsError } = await supabase
          .from('flight_bids')
          .select('route_id')
          .in('route_id', data.map(f => f.id))
          .gte('created_at', sevenDaysAgo.toISOString());

        if (!bidsError && bidsData) {
          const counts: Record<string, number> = {};
          bidsData.forEach((bid: { route_id: string }) => {
            counts[bid.route_id] = (counts[bid.route_id] || 0) + 1;
          });
          setBidCounts(counts);
        }
      }
    } catch (err) {
      console.error('Error fetching flight ops:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchFlightOps();
  }, [regionFilter, priceFilter]);

  useEffect(() => {
    const channel = supabase
      .channel('flight-ops-bids')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'flight_bids' },
        (payload) => {
          const routeId = payload.new.route_id;
          setBidCounts(prev => ({
            ...prev,
            [routeId]: (prev[routeId] || 0) + 1
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply search filter locally
  const filteredFlights = flightOps.filter(flight => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      flight.title?.toLowerCase().includes(query) ||
      flight.origin?.toLowerCase().includes(query) ||
      flight.destination?.toLowerCase().includes(query) ||
      flight.aircraft_type?.toLowerCase().includes(query)
    );
  });

  const selectedPriceLabel = priceRanges.find(p => p.id === priceFilter)?.label || 'All Prices';

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3 pt-4 md:pt-6">
        <div>
          <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter">Flight Bids</h2>
          <p className="text-sm text-gray-500 mt-1">Fixed routes - Place your bid</p>
        </div>
      </div>

      {/* Region Filter Pills + Price Filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-4">
        {/* Region Badges */}
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setRegionFilter(region.id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                regionFilter === region.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {region.label}
            </button>
          ))}
        </div>

        {/* Price Filter + Search */}
        <div className="flex items-center gap-3">
          {/* Price Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPriceDropdown(!showPriceDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {selectedPriceLabel}
              <ChevronDown size={14} className={`transition-transform ${showPriceDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPriceDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 min-w-[160px]">
                {priceRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => {
                      setPriceFilter(range.id);
                      setShowPriceDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      priceFilter === range.id ? 'text-gray-900 font-medium bg-gray-50' : 'text-gray-600'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routes..."
              className="w-40 pl-9 pr-3 py-2 bg-gray-100 border-none rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {filteredFlights.length} route{filteredFlights.length !== 1 ? 's' : ''} available
      </p>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-xl aspect-[4/3] mb-2 sm:mb-3"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-3 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Flight Ops Grid - Airbnb Style like Adventures */}
      {!isLoading && filteredFlights.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredFlights.map((flight) => (
            <div
              key={flight.id}
              onClick={() => onSelectRoute?.(flight, bidCounts[flight.id] || 0)}
              className="group cursor-pointer active:scale-[0.98] transition-transform"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3">
                <img
                  src={flight.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800'}
                  alt={flight.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Featured Badge */}
                {flight.is_featured && (
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    <span className="bg-amber-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
                      Featured
                    </span>
                  </div>
                )}
                {/* Bid Count Badge */}
                {bidCounts[flight.id] > 0 && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <span className="bg-emerald-500/90 backdrop-blur-sm text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
                      <Gavel size={10} />
                      {bidCounts[flight.id]} bid{bidCounts[flight.id] !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                  {flight.title}
                </h3>

                <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm mb-1">
                  <MapPin size={10} className="flex-shrink-0" />
                  <span className="line-clamp-1">
                    {flight.origin?.split('(')[0]?.trim()} → {flight.destination?.split('(')[0]?.trim()}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1">
                    <Plane size={10} />
                    {flight.aircraft_type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {flight.duration}
                  </span>
                </div>

                {/* Price at bottom like Adventures */}
                <p className="text-xs sm:text-sm">
                  <span className="font-semibold text-gray-900">
                    ${flight.price?.toLocaleString()}
                  </span>
                  <span className="text-gray-500 ml-1">avg.</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredFlights.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <Plane size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No routes available</h3>
          <p className="text-sm text-gray-500 mb-4">Try adjusting your filters</p>
          <button
            onClick={() => {
              setRegionFilter('all');
              setPriceFilter('all');
              setSearchQuery('');
            }}
            className="text-sm text-gray-900 underline hover:no-underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Click outside to close price dropdown */}
      {showPriceDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPriceDropdown(false)}
        />
      )}
    </div>
  );
}
