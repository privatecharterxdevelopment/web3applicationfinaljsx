import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, SlidersHorizontal, Plane, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchFixedOffers } from '../services/fixedOffersService';
import { FixedOffer } from './FixedOffers';
import AdventureBookingModal from '../components/AdventureBookingModal';
import LandingHeader from '../components/Landingpagenew/LandingHeader';
import Footer from '../components/Landingpagenew/Footer';
import { useAuth } from '../context/AuthContext';

export default function Adventures() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [adventures, setAdventures] = useState<FixedOffer[]>([]);
  const [filteredAdventures, setFilteredAdventures] = useState<FixedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAdventure, setSelectedAdventure] = useState<FixedOffer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'featured', label: 'Featured' },
    { id: 'europe', label: 'Europe' },
    { id: 'usa', label: 'USA' },
    { id: 'asia', label: 'Asia' },
    { id: 'africa', label: 'Africa' },
  ];

  useEffect(() => {
    loadAdventures();
  }, [selectedCategory]);

  useEffect(() => {
    filterAdventures();
  }, [searchQuery, adventures]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const loadAdventures = async () => {
    setLoading(true);
    try {
      const result = await fetchFixedOffers({
        limit: 50,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      setAdventures(result.data);
      setFilteredAdventures(result.data);
    } catch (error) {
      console.error('Error loading adventures:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAdventures = () => {
    if (!searchQuery.trim()) {
      setFilteredAdventures(adventures);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = adventures.filter((adv) =>
      adv.title.toLowerCase().includes(query) ||
      adv.origin.toLowerCase().includes(query) ||
      adv.destination?.toLowerCase().includes(query) ||
      adv.description?.toLowerCase().includes(query) ||
      adv.aircraft_type?.toLowerCase().includes(query)
    );
    setFilteredAdventures(filtered);
  };

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  // Pagination calculations
  const totalItems = filteredAdventures.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAdventures = filteredAdventures.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader onGetStarted={handleGetStarted} />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-3 tracking-tight">
            Adventure Packages
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            Curated luxury travel experiences, ready to book with crypto
          </p>

          {/* Airbnb-style Search Bar */}
          <div className="bg-white rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow flex items-center p-2 max-w-3xl">
            {/* Where */}
            <div className="flex-1 px-4 py-2 border-r border-gray-200">
              <label className="block text-xs font-medium text-gray-900 mb-0.5">Where</label>
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm text-gray-600 placeholder-gray-400 bg-transparent outline-none"
              />
            </div>

            {/* Category */}
            <div className="hidden sm:block flex-1 px-4 py-2 border-r border-gray-200">
              <label className="block text-xs font-medium text-gray-900 mb-0.5">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-sm text-gray-600 bg-transparent outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={() => filterAdventures()}
              className="ml-2 w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              <Search size={18} className="text-white" />
            </button>
          </div>

          {/* Mobile Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden mt-4 flex items-center gap-2 text-sm text-gray-600"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4 sm:mb-6">
          {totalItems} adventure{totalItems !== 1 ? 's' : ''} available
          {totalPages > 1 && <span className="text-gray-400"> · Page {currentPage} of {totalPages}</span>}
        </p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl aspect-[4/3] mb-2 sm:mb-3"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-3 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredAdventures.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Plane size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No adventures found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-gray-900 underline text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {paginatedAdventures.map((adventure) => (
                <div
                  key={adventure.id}
                  onClick={() => setSelectedAdventure(adventure)}
                  className="group cursor-pointer active:scale-[0.98] transition-transform"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3">
                    <img
                      src={adventure.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80'}
                      alt={adventure.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {adventure.is_featured && (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                        <span className="bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium text-gray-900 shadow-sm">
                          Featured
                        </span>
                      </div>
                    )}
                    {adventure.is_empty_leg && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                        <span className="bg-green-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
                          Empty Leg
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {adventure.title}
                    </h3>

                    <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm mb-1">
                      <MapPin size={10} className="flex-shrink-0" />
                      <span className="line-clamp-1">
                        {/* Show single location for location-based adventures, route for flights */}
                        {!adventure.destination || adventure.origin === adventure.destination
                          ? (adventure.destination || adventure.origin || 'Exclusive Location')
                          : `${adventure.origin} → ${adventure.destination}`
                        }
                      </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 mb-2">
                      {/* Only show aircraft type for flight-based packages */}
                      {adventure.aircraft_type && adventure.destination && adventure.origin !== adventure.destination && (
                        <span className="flex items-center gap-1">
                          <Plane size={10} />
                          {adventure.aircraft_type}
                        </span>
                      )}
                      {adventure.passengers && (
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          {adventure.passengers}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm">
                      <span className="font-semibold text-gray-900">
                        {adventure.price && adventure.price > 0 && !(adventure as any).price_on_request ? (
                          <>
                            {adventure.currency === 'EUR' ? '€' : '$'}
                            {adventure.price.toLocaleString()}
                          </>
                        ) : (
                          'On Request'
                        )}
                      </span>
                    </p>
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
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
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
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {selectedAdventure && (
        <AdventureBookingModal
          isOpen={!!selectedAdventure}
          onClose={() => setSelectedAdventure(null)}
          adventure={selectedAdventure}
        />
      )}

      <Footer />

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
