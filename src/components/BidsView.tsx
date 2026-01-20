import React, { useState, useEffect } from 'react';
import { Gavel, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Plane, MapPin, Users, Calendar, ArrowRight, Loader2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Bid {
  id: string;
  user_id: string;
  route_id: string;
  bid_amount: number;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired' | 'withdrawn';
  admin_response: string | null;
  counter_amount: number | null;
  passengers: number;
  departure_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  responded_at: string | null;
  route?: {
    id: string;
    title: string;
    origin: string;
    destination: string;
    image_url: string;
    aircraft_type: string;
    price: number;
    currency: string;
  };
}

interface BidsViewProps {
  onSelectBid?: (bid: Bid) => void;
}

// HD City images mapping
const getCityImage = (destination: string): string => {
  const cityImages: Record<string, string> = {
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
    'nyc': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
    'miami': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=1200&q=80',
    'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1200&q=80',
    'la': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1200&q=80',
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80',
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80',
    'hong kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1200&q=80',
    'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80',
    'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80',
    'milan': 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=1200&q=80',
    'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80',
    'ibiza': 'https://images.unsplash.com/photo-1573451903508-c6539dce5e89?w=1200&q=80',
    'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80',
    'monaco': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/heromonaco.webp',
    'nice': 'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=1200&q=80',
    'cannes': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1200&q=80',
    'zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1200&q=80',
    'geneva': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/589bc75d1b83a01b8588e7b6d12895b8ff254934-1600x1066.jpg',
    'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80',
    'vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=80',
    'berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200&q=80',
    'munich': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1200&q=80',
    'frankfurt': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/GettyImages-601823765.jpg',
    'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=80',
    'lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&q=80',
    'athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=80',
    'santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80',
    'mykonos': 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=1200&q=80',
    'istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80',
    'moscow': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1200&q=80',
    'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80',
    'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
    'phuket': 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=80',
    'las vegas': 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200&q=80',
    'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=80',
    'chicago': 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1200&q=80',
    'aspen': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/download.jpeg',
    'st moritz': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/Things-to-do-in-St-Moritz.jpeg',
    'cabo': 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200&q=80',
    'cancun': 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200&q=80',
    'caribbean': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1200&q=80',
    'bahamas': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1200&q=80',
    'seychelles': 'https://images.unsplash.com/photo-1589979481223-deb893043163?w=1200&q=80',
    'mauritius': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80',
    'boston': 'https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=1200&q=80',
    'palm beach': 'https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1200&q=80',
    'washington': 'https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=1200&q=80',
    'dallas': 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=1200&q=80',
    'houston': 'https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=1200&q=80',
    'austin': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1200&q=80',
    'nashville': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/nashville.webp',
    'pittsburgh': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/Downtown%20Pittsburgh_AdobeStock_221230893_licensed_c_rs1000px.jpg',
    'nantucket': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/660c3c914ed7bbfb9ce64ef7_Nantucket%20Lighthouse.jpeg',
    'martha': 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=1200&q=80',
    'vineyard': 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=1200&q=80',
    'telluride': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    'jackson': 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1200&q=80',
    'sun valley': 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=1200&q=80',
    'turks': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1200&q=80',
    'caicos': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1200&q=80',
    'anguilla': 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&q=80',
    'tulum': 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1200&q=80',
    'atlanta': 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=1200&q=80',
    'denver': 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=1200&q=80',
    'seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=1200&q=80',
    'phoenix': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    'scottsdale': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  };

  const destLower = destination?.toLowerCase() || '';

  // Check for exact or partial match
  for (const [city, url] of Object.entries(cityImages)) {
    if (destLower.includes(city)) {
      return url;
    }
  }

  // Default luxury travel image
  return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80';
};

export default function BidsView({ onSelectBid }: BidsViewProps) {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'countered' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user's bids
  const fetchBids = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('flight_bids')
        .select(`
          *,
          route:route_id (
            id,
            title,
            origin,
            destination,
            image_url,
            aircraft_type,
            price,
            currency
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (err: any) {
      console.error('Error fetching bids:', err);
      setError('Failed to load bids');
    } finally {
      setIsLoading(false);
    }
  };

  // Load bids on mount
  useEffect(() => {
    if (user) {
      fetchBids();
    }
  }, [user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('flight-bids-view')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flight_bids',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchBids();
          } else if (payload.eventType === 'UPDATE') {
            setBids(prev => prev.map(b =>
              b.id === payload.new.id ? { ...b, ...payload.new } : b
            ));
          } else if (payload.eventType === 'DELETE') {
            setBids(prev => prev.filter(b => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get status badge color
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500 text-white';
      case 'accepted':
        return 'bg-emerald-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      case 'countered':
        return 'bg-blue-500 text-white';
      case 'expired':
      case 'withdrawn':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Filter bids
  const filteredBids = bids.filter(bid => {
    // Status filter
    if (filter !== 'all' && bid.status !== filter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = bid.route?.title?.toLowerCase().includes(query);
      const matchesOrigin = bid.route?.origin?.toLowerCase().includes(query);
      const matchesDestination = bid.route?.destination?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesOrigin && !matchesDestination) return false;
    }

    return true;
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-500 font-light">Please log in to view your bids.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3 pt-4 md:pt-6">
        <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter">Flight Bids</h2>
      </div>

      {/* Filter Pills + Search */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-4">
        {/* Status Filter Badges */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'countered', label: 'Countered' },
            { id: 'rejected', label: 'Rejected' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as any)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                filter === cat.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-40 pl-9 pr-3 py-2 bg-gray-100 border-none rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {filteredBids.length} bid{filteredBids.length !== 1 ? 's' : ''} placed
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

      {/* Bids Grid - Airbnb Style */}
      {!isLoading && filteredBids.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredBids.map((bid) => (
            <div
              key={bid.id}
              onClick={() => onSelectBid?.(bid)}
              className="group cursor-pointer active:scale-[0.98] transition-transform"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3">
                <img
                  src={getCityImage(bid.route?.destination || '')}
                  alt={bid.route?.title || 'Flight'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Status Badge - only on image */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                  <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium capitalize ${getStatusStyle(bid.status)}`}>
                    {bid.status === 'countered' ? 'Counter Offer' : bid.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                  {bid.route?.title || 'Flight Bid'}
                </h3>

                <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm mb-1">
                  <MapPin size={10} className="flex-shrink-0" />
                  <span className="line-clamp-1">
                    {bid.route?.origin || 'Origin'} → {bid.route?.destination || 'Destination'}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 mb-2">
                  {bid.route?.aircraft_type && (
                    <span className="flex items-center gap-1">
                      <Plane size={10} />
                      {bid.route.aircraft_type}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {bid.passengers} pax
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {formatTimeAgo(bid.created_at)}
                  </span>
                </div>

                {/* Price comparison - Original vs Your Bid */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">Starting</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {bid.route?.price
                        ? `$${bid.route.price.toLocaleString()}`
                        : 'On Request'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">Your Bid</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      ${bid.bid_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Counter offer if exists */}
                {bid.counter_amount && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-blue-600 uppercase tracking-wide">Counter Offer</p>
                    <p className="text-sm sm:text-base font-semibold text-blue-700">
                      ${bid.counter_amount.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Action hint based on status */}
                {bid.status === 'accepted' && (
                  <div className="mt-2">
                    <span className="text-xs text-emerald-600 font-medium">Ready to book →</span>
                  </div>
                )}
                {bid.status === 'countered' && !bid.counter_amount && (
                  <div className="mt-2">
                    <span className="text-xs text-blue-600 font-medium">Review counter offer →</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredBids.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <Gavel size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No bids yet' : `No ${filter} bids`}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Place a bid on a flight to see it here
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-sm text-gray-900 underline hover:no-underline"
            >
              View all bids
            </button>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <AlertCircle size={32} className="mx-auto text-red-400 mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchBids}
            className="mt-2 text-sm text-gray-900 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
