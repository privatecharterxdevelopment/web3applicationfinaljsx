import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, Users, DollarSign, Plane, Clock, ShoppingCart } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/CRM/NotificationContext';
import { ServiceCheckout } from './ServiceCheckout';
import { EmptyLegRequests } from './EmptyLegRequests';

interface EmptyLeg {
  id: string;
  from: string | null;
  to: string | null;
  from_iata: string | null;
  to_iata: string | null;
  aircraft_type: string | null;
  category: string | null;
  capacity: number | null;
  departure_date: string | null;
  price: number | null;
  currency: string | null;
  operator: string | null;
  booking_link: string | null;
  aircraft_type_original: string | null;
  from_country: string | null;
  to_country: string | null;
  from_city: string | null;
  to_city: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  registration: string | null;
  image_url: string | null;
  is_reserved?: boolean;
}

export const EmptyLegsService: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [emptyLegs, setEmptyLegs] = useState<EmptyLeg[]>([]);
  const [filteredLegs, setFilteredLegs] = useState<EmptyLeg[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'requests'>('listings');

  useEffect(() => {
    fetchEmptyLegs();
  }, []);

  useEffect(() => {
    filterEmptyLegs();
  }, [emptyLegs, searchTerm, categoryFilter]);

  const fetchEmptyLegs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('EmptyLegs_')
        .select('*')
        .order('departure_date', { ascending: true });

      if (error) throw error;
      
      // Check for reservations in service_orders
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select('service_id, service_type')
        .eq('service_type', 'emptyleg');
        
      if (orderError) throw orderError;
      
      // Mark empty legs as reserved if they appear in orders
      const reservedLegIds = new Set(orderItems?.map(item => item.service_id) || []);
      
      const legsWithReservationStatus = data?.map(leg => ({
        ...leg,
        is_reserved: reservedLegIds.has(leg.id)
      })) || [];
      
      setEmptyLegs(legsWithReservationStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch empty legs');
      console.error('Error fetching empty legs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmptyLegs = () => {
    let filtered = emptyLegs;

    if (searchTerm) {
      filtered = filtered.filter(leg => 
        leg.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leg.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leg.from_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leg.to_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leg.aircraft_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leg.operator?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(leg => leg.category === categoryFilter);
    }

    setFilteredLegs(filtered);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return 'Price on request';
    return `${currency || '$'}${price.toLocaleString()}`;
  };

  const getUniqueCategories = () => {
    const categories = emptyLegs
      .map(leg => leg.category)
      .filter((category, index, self) => category && self.indexOf(category) === index)
      .sort();
    return categories;
  };

  const handleBookEmptyLeg = async (leg: EmptyLeg) => {
    setSelectedService({
      id: leg.id,
      type: 'emptyleg',
      name: `${leg.from_city || leg.from || ''} to ${leg.to_city || leg.to || ''} - ${leg.aircraft_type || 'Aircraft'}`,
      price: leg.price || 0,
      currency: leg.currency || '$',
      image_url: leg.image_url,
      details: {
        departure: leg.from || leg.from_city,
        arrival: leg.to || leg.to_city,
        departure_date: leg.departure_date,
        departure_time: leg.departure_time,
        aircraft_type: leg.aircraft_type,
        capacity: leg.capacity,
        operator: leg.operator,
        registration: leg.registration
      }
    });
    setShowCheckout(true);
    
    // Mark this leg as reserved in the UI immediately
    setEmptyLegs(prevLegs => 
      prevLegs.map(prevLeg => 
        prevLeg.id === leg.id ? { ...prevLeg, is_reserved: true } : prevLeg
      )
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading empty legs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Empty Legs</h1>
            <p className="text-gray-600">Available empty leg flights at discounted prices</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'listings'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Available Flights
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            EmptyLeg Requests
          </button>
        </div>

        {activeTab === 'listings' && (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by departure, arrival, aircraft type, or operator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {getUniqueCategories().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 mb-8">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-black">{emptyLegs.length}</p>
                <p className="text-sm text-gray-500">Total Empty Legs</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-black">{filteredLegs.length}</p>
                <p className="text-sm text-gray-500">Filtered Results</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-black">{getUniqueCategories().length}</p>
                <p className="text-sm text-gray-500">Aircraft Categories</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-black">
                  {emptyLegs.filter(leg => leg.price && leg.price > 0).length}
                </p>
                <p className="text-sm text-gray-500">With Pricing</p>
              </div>
            </div>

            {/* Empty Legs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLegs.map((leg) => (
                <div 
                  key={leg.id} 
                  className={`bg-white rounded-lg border ${leg.is_reserved ? 'border-amber-500 shadow-md' : 'border-gray-200 shadow-sm hover:shadow-md'} transition-shadow`}
                >
                  {leg.image_url && (
                    <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      <img
                        src={leg.image_url}
                        alt={leg.aircraft_type || 'Aircraft'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Plane className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-black">
                          {leg.aircraft_type || 'Aircraft'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {leg.category && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {leg.category}
                          </span>
                        )}
                        {leg.is_reserved && (
                          <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                            Reserved
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {leg.from_city || leg.from || 'Unknown'} → {leg.to_city || leg.to || 'Unknown'}
                          </p>
                          {(leg.from_iata || leg.to_iata) && (
                            <p className="text-xs text-gray-500">
                              {leg.from_iata} → {leg.to_iata}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm">{formatDate(leg.departure_date)}</p>
                          {leg.departure_time && (
                            <p className="text-xs text-gray-500">{leg.departure_time}</p>
                          )}
                        </div>
                      </div>

                      {leg.capacity && (
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{leg.capacity} passengers</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold">
                          {formatPrice(leg.price, leg.currency)}
                        </span>
                      </div>
                    </div>

                    {leg.operator && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500">Operator</p>
                        <p className="text-sm font-medium">{leg.operator}</p>
                      </div>
                    )}

                    {leg.registration && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500">Registration</p>
                        <p className="text-sm font-medium">{leg.registration}</p>
                      </div>
                    )}

                    <button
                      onClick={() => handleBookEmptyLeg(leg)}
                      disabled={leg.is_reserved}
                      className={`w-full py-2 px-4 rounded-lg flex items-center justify-center space-x-2 ${
                        leg.is_reserved 
                          ? 'bg-amber-100 text-amber-800 cursor-not-allowed' 
                          : 'bg-black text-white hover:bg-gray-800 transition-colors'
                      }`}
                    >
                      {leg.is_reserved ? (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>Currently Reserved</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>Book Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredLegs.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No empty legs found</h3>
                <p className="text-gray-500">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'Try adjusting your search criteria' 
                    : 'No empty leg flights are currently available'
                  }
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <EmptyLegRequests />
        )}
      </div>

      {/* Service Checkout Modal */}
      <ServiceCheckout
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        service={selectedService}
        onOrderPlaced={() => {
          showSuccess('Success', 'Your empty leg booking request has been submitted');
          setShowCheckout(false);
        }}
      />
    </div>
  );
};