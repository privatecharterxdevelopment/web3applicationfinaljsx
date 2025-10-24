import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Clock, Info, X, ExternalLink, Search, Send, Plus, Grid, List, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { createClient } from '@supabase/supabase-js';
import { createRequest } from '../services/requests';
import { supabase } from '../lib/supabase';

export interface FixedOffer {
  id: string;
  title: string;
  description: string;
  origin: string;
  destination?: string; // Made optional since some might not have it
  price?: number; // Made optional
  currency?: string;
  departure_date?: string;
  return_date?: string;
  image_url?: string;
  aircraft_type?: string;
  passengers?: number;
  duration?: string;
  is_featured?: boolean;
  is_empty_leg?: boolean;
  created_at: string;
  updated_at?: string;
  price_on_request?: string;
}

// Simplified fetch function - let's start basic and add complexity later
const fetchFixedOffers = async (params: {
  page: number;
  limit: number;
  category?: string;
  searchTerm?: string;
}) => {
  try {
    console.log('🚀 Fetching with params:', params);

    // Start with the simplest possible query
    let query = supabase
      .from('fixed_offers')
      .select('*', { count: 'exact' });

    console.log('📝 Basic query created');

    // Apply search filter ONLY if we have a search term
    if (params.searchTerm && params.searchTerm.trim() !== '') {
      console.log('🔍 Applying search filter:', params.searchTerm);
      const search = params.searchTerm.trim();
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,origin.ilike.%${search}%`);
    }

    // Apply category filter - simplified
    if (params.category && params.category !== 'all') {
      console.log('🏷️ Applying category filter:', params.category);
      if (params.category === 'featured') {
        query = query.eq('is_featured', true);
      } else if (params.category === 'empty_leg') {
        query = query.eq('is_empty_leg', true);
      }
      // Skip the complex location filters for now
    }

    // Order by created_at if it exists
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);

    console.log('⚡ Executing query...');
    const { data, error, count } = await query;

    console.log('📊 Query result:', {
      dataLength: data?.length,
      error,
      count,
      firstItem: data?.[0]
    });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    return {
      data: data || [],
      total: count || 0,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil((count || 0) / params.limit)
    };
  } catch (error) {
    console.error('💥 Error in fetchFixedOffers:', error);
    throw error;
  }
};

const FixedOffers: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [fixedOffers, setFixedOffers] = useState<FixedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [totalOffers, setTotalOffers] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<FixedOffer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useEffect triggered');
    fetchFixedOffersData();
  }, [currentPage, filterCategory, searchTerm]);

  const fetchFixedOffersData = async () => {
    try {
      console.log('🚀 Starting fetchFixedOffersData...');
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        searchTerm: searchTerm.trim() || undefined
      };

      const result = await fetchFixedOffers(params);

      console.log('✅ Setting state with result:', result);
      setFixedOffers(result.data);
      setTotalOffers(result.total);
    } catch (error) {
      console.error('💥 Error in fetchFixedOffersData:', error);
      setError('Failed to load adventure packages. Please try again later.');
      setFixedOffers([]);
      setTotalOffers(0);
    } finally {
      setLoading(false);
    }
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterOffersByCategory = (category: string) => {
    setFilterCategory(category);
    setCurrentPage(1);
  };

  const handleOfferClick = (offer: FixedOffer) => {
    setSelectedOffer(offer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOffer(null);
    setSelectedDate(null);
    setMessage('');
    setShowSuccess(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleSendRequest = async () => {
    if (!selectedOffer || !user) {
      if (!isAuthenticated) {
        alert('Please log in to book this package');
        return;
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user.id,
          type: 'fixed_offer',
          status: 'pending',
          client_name: user.name || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
          client_email: user.email,
          client_phone: user.phone || user.phone_number || null,
          data: {
            offer_id: selectedOffer.id,
            offer_title: selectedOffer.title,
            selected_date: selectedDate?.toISOString(),
            message: message,
            offer_details: selectedOffer,
            client_info: {
              name: user.name || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
              email: user.email,
              phone: user.phone || user.phone_number,
              user_id: user.id
            }
          }
        }]);

      if (error) throw error;

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setShowModal(false);
        setSelectedDate(null);
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultImage = () => {
    return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80';
  };

  const totalPages = Math.ceil(totalOffers / itemsPerPage);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Adventure Packages</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our curated selection of luxury adventure packages designed for the ultimate private jet experience to extraordinary destinations.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by destination, origin, or title..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => filterOffersByCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCategory === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All Packages
            </button>
            <button
              onClick={() => filterOffersByCategory('featured')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCategory === 'featured' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Featured
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">
              Available Adventure Packages
              {totalOffers > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({totalOffers} {totalOffers === 1 ? 'package' : 'packages'})
                </span>
              )}
            </h3>
            <div className="bg-gray-100 rounded-lg p-1 inline-flex">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                aria-label="List view"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                aria-label="Grid view"
              >
                <Grid size={20} />
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-16 bg-red-50 rounded-xl border border-red-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Packages</h3>
              <p className="text-red-600 mt-2 mb-4">{error}</p>
              <button
                onClick={fetchFixedOffersData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Adventure Packages Display */}
          {!error && (loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
              <p className="ml-4">Loading adventure packages...</p>
            </div>
          ) : fixedOffers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {fixedOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 cursor-pointer group"
                  onClick={() => handleOfferClick(offer)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={offer.image_url || getDefaultImage()}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = getDefaultImage();
                      }}
                    />
                    {offer.is_featured && (
                      <div className="absolute top-3 left-3">
                        <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          Featured
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2">{offer.title}</h3>
                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin size={16} className="mr-1" />
                      <span className="text-sm">
                        {offer.origin} {offer.destination && `to ${offer.destination}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded-full">
                        <Calendar size={14} className="mr-1" />
                        <span>Flexible dates</span>
                      </div>
                      {offer.passengers && (
                        <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded-full">
                          <Users size={14} className="mr-1" />
                          <span>Up to {offer.passengers} pax</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        {offer.price_on_request ? (
                          <div className="text-base font-bold text-black">
                            Price on Request
                          </div>
                        ) : offer.price && offer.price > 0 ? (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-thin text-gray-700">{offer.currency || 'EUR'}</span>
                              <span className="text-lg font-bold text-black">{offer.price.toLocaleString()}</span>
                            </div>
                            <div className="text-xs font-light text-gray-500 mt-1">
                              package price incl. VAT
                            </div>
                          </div>
                        ) : (
                          <div className="text-base font-bold text-black">
                            On Request
                          </div>
                        )}
                      </div>
                      <button
                        className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOfferClick(offer);
                        }}
                      >
                        Book Package
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No adventure packages found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm || filterCategory !== 'all'
                  ? 'No adventure packages match your current search criteria. Try adjusting your filters.'
                  : 'No adventure packages are currently available. Please check back later or contact us for custom packages.'
                }
              </p>
              {(searchTerm || filterCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('all');
                    setCurrentPage(1);
                  }}
                  className="mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && fixedOffers.length > 0 && !error && (
            <div className="flex justify-center items-center mt-8">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-l-lg transition-colors ${currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Previous
              </button>

              <div className="flex items-center">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`px-4 py-2 ${currentPage === pageNum
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-r-lg transition-colors ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal */}
      {showModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {showSuccess ? (
            <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Request Sent!</h3>
              <p className="text-gray-600 mb-2">
                Thank you for your interest in <strong>{selectedOffer.title}</strong>.
              </p>
              <p className="text-gray-600">
                Our team will get in touch with you soon!
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="relative">
                <button
                  onClick={closeModal}
                  className="absolute top-6 right-6 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-3 transition-colors shadow-lg"
                >
                  <X size={24} />
                </button>

                <img
                  src={selectedOffer.image_url || getDefaultImage()}
                  alt={selectedOffer.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = getDefaultImage();
                  }}
                />

                <div className="p-8">
                  <h2 className="text-3xl font-bold mb-4">{selectedOffer.title}</h2>

                  {selectedOffer.description && (
                    <p className="text-gray-600 mb-6 text-lg leading-relaxed">{selectedOffer.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-4">Package Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center bg-gray-50 p-3 rounded-xl">
                          <MapPin size={16} className="mr-2 text-gray-400" />
                          <span className="font-medium">
                            {selectedOffer.origin} {selectedOffer.destination && `→ ${selectedOffer.destination}`}
                          </span>
                        </div>
                        <div className="flex items-center bg-gray-50 p-3 rounded-xl">
                          <Calendar size={16} className="mr-2 text-gray-400" />
                          <span className="font-medium">Flexible dates available</span>
                        </div>
                        {selectedOffer.passengers && (
                          <div className="flex items-center bg-gray-50 p-3 rounded-xl">
                            <Users size={16} className="mr-2 text-gray-400" />
                            <span className="font-medium">Up to {selectedOffer.passengers} passengers</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 mb-4">Additional Message</h3>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Any special requirements or questions..."
                        rows={6}
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black resize-none bg-gray-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        {selectedOffer.price_on_request ? (
                          <div className="text-2xl font-bold text-black">Price on Request</div>
                        ) : selectedOffer.price && selectedOffer.price > 0 ? (
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-light text-gray-700">{selectedOffer.currency || 'EUR'}</span>
                              <span className="text-2xl font-bold text-black">{selectedOffer.price?.toLocaleString()}</span>
                            </div>
                            <div className="text-sm font-light text-gray-500 mt-1">package price incl. VAT</div>
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-black">On Request</div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {!isAuthenticated ? (
                        <div className="flex-1 text-center py-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                          <p className="text-yellow-800 font-medium mb-2">Please log in to book this package</p>
                          <button className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                            Log In
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleSendRequest}
                          disabled={isSubmitting}
                          className="flex-1 bg-black text-white py-4 rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <span>Book Adventure Package</span>
                          )}
                        </button>
                      )}
                      <button
                        onClick={closeModal}
                        className="px-8 py-4 border border-gray-200 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FixedOffers;