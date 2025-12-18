import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, Users, DollarSign, Plane, Clock, Star, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';
import { ServiceCheckout } from './ServiceCheckout';

interface FixedOffer {
  id: string;
  title: string;
  description: string;
  origin: string;
  destination: string;
  price: number;
  currency: string;
  departure_date: string;
  return_date: string | null;
  image_url: string | null;
  aircraft_type: string;
  passengers: number;
  duration: string;
  is_featured: boolean;
  is_empty_leg: boolean;
  created_at: string | null;
  updated_at: string | null;
  price_on_request: boolean | null;
}

export const FixedOffersService: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [offers, setOffers] = useState<FixedOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<FixedOffer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    fetchFixedOffers();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [offers, searchTerm, featuredFilter]);

  const fetchFixedOffers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('fixed_offers')
        .select('*')
        .eq('is_empty_leg', false) // Only get fixed offers, not empty legs
        .order('departure_date', { ascending: true });

      if (error) throw error;
      setOffers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch fixed offers');
      console.error('Error fetching fixed offers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOffers = () => {
    let filtered = offers;

    if (searchTerm) {
      filtered = filtered.filter(offer => 
        offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.aircraft_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (featuredFilter === 'featured') {
      filtered = filtered.filter(offer => offer.is_featured);
    } else if (featuredFilter === 'regular') {
      filtered = filtered.filter(offer => !offer.is_featured);
    }

    setFilteredOffers(filtered);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number, currency: string, priceOnRequest: boolean | null) => {
    if (priceOnRequest) return 'Price on request';
    return `${currency}${price.toLocaleString()}`;
  };

  const handleRequestBooking = (offer: FixedOffer) => {
    setSelectedService({
      id: offer.id,
      type: 'jet',
      name: offer.title,
      price: offer.price,
      currency: offer.currency,
      image_url: offer.image_url,
      details: {
        origin: offer.origin,
        destination: offer.destination,
        departure_date: offer.departure_date,
        return_date: offer.return_date,
        aircraft_type: offer.aircraft_type,
        passengers: offer.passengers,
        duration: offer.duration,
        description: offer.description
      }
    });
    setShowCheckout(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading fixed offers...</p>
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
            <h1 className="text-2xl font-bold text-black mb-2">Fixed Charter Offers</h1>
            <p className="text-gray-600">Explore our curated selection of premium charter packages</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, description, origin, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Offers</option>
                <option value="featured">Featured</option>
                <option value="regular">Regular</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{offers.length}</p>
          <p className="text-sm text-gray-500">Total Offers</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{filteredOffers.length}</p>
          <p className="text-sm text-gray-500">Filtered Results</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">
            {offers.filter(offer => offer.is_featured).length}
          </p>
          <p className="text-sm text-gray-500">Featured</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">
            {offers.reduce((sum, offer) => sum + offer.passengers, 0)}
          </p>
          <p className="text-sm text-gray-500">Total Capacity</p>
        </div>
      </div>

      {/* Fixed Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.map((offer) => (
          <div key={offer.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            {offer.image_url && (
              <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                  src={offer.image_url}
                  alt={offer.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-black text-lg">{offer.title}</h3>
                {offer.is_featured && (
                  <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    <Star className="w-3 h-3" />
                    <span>Featured</span>
                  </span>
                )}
              </div>

              {offer.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {offer.description}
                </p>
              )}

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {offer.origin} → {offer.destination}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm">{formatDate(offer.departure_date)}</p>
                    {offer.return_date && (
                      <p className="text-xs text-gray-500">Return: {formatDate(offer.return_date)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Plane className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{offer.aircraft_type}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{offer.passengers} passengers</span>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold">
                    {formatPrice(offer.price, offer.currency, offer.price_on_request)}
                  </span>
                </div>
              </div>

              {offer.duration && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{offer.duration}</span>
                  </div>
                </div>
              )}

              <button 
                onClick={() => handleRequestBooking(offer)}
                className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Book Now</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredOffers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No fixed offers found</h3>
          <p className="text-gray-500">
            {searchTerm || featuredFilter !== 'all'
              ? 'Try adjusting your search criteria' 
              : 'No fixed charter offers are currently available'
            }
          </p>
        </div>
      )}

      {/* Service Checkout Modal */}
      <ServiceCheckout
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        service={selectedService}
        onOrderPlaced={() => {
          showSuccess('Success', 'Your booking request has been submitted');
          setShowCheckout(false);
        }}
      />
    </div>
  );
};