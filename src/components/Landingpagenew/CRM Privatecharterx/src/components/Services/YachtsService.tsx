import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, DollarSign, Ship, Users, Calendar, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';
import { ServiceCheckout } from './ServiceCheckout';

interface Yacht {
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

export const YachtsService: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [filteredYachts, setFilteredYachts] = useState<Yacht[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    fetchYachts();
  }, []);

  useEffect(() => {
    filterYachts();
  }, [yachts, searchTerm, featuredFilter]);

  const fetchYachts = async () => {
    try {
      setIsLoading(true);
      // Using fixed_offers table for yacht charters (assuming yacht offers are stored there)
      const { data, error } = await supabase
        .from('fixed_offers')
        .select('*')
        .eq('aircraft_type', 'yacht')
        .order('departure_date', { ascending: true });

      if (error) throw error;
      setYachts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch yachts');
      console.error('Error fetching yachts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterYachts = () => {
    let filtered = yachts;

    if (searchTerm) {
      filtered = filtered.filter(yacht => 
        yacht.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        yacht.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        yacht.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        yacht.destination?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (featuredFilter === 'featured') {
      filtered = filtered.filter(yacht => yacht.is_featured);
    } else if (featuredFilter === 'regular') {
      filtered = filtered.filter(yacht => !yacht.is_featured);
    }

    setFilteredYachts(filtered);
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

  const handleBookYacht = (yacht: Yacht) => {
    setSelectedService({
      id: yacht.id,
      type: 'yacht',
      name: yacht.title,
      price: yacht.price,
      currency: yacht.currency,
      image_url: yacht.image_url,
      details: {
        origin: yacht.origin,
        destination: yacht.destination,
        departure_date: yacht.departure_date,
        return_date: yacht.return_date,
        passengers: yacht.passengers,
        duration: yacht.duration,
        description: yacht.description
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
            <p className="text-gray-600">Loading yacht charters...</p>
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
            <h1 className="text-2xl font-bold text-black mb-2">Yacht Charters</h1>
            <p className="text-gray-600">Luxury yacht charter experiences</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, description, or destination..."
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
                <option value="all">All Yachts</option>
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
          <p className="text-2xl font-bold text-black">{yachts.length}</p>
          <p className="text-sm text-gray-500">Total Charters</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{filteredYachts.length}</p>
          <p className="text-sm text-gray-500">Filtered Results</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">
            {yachts.filter(yacht => yacht.is_featured).length}
          </p>
          <p className="text-sm text-gray-500">Featured</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">
            {yachts.reduce((sum, yacht) => sum + yacht.passengers, 0)}
          </p>
          <p className="text-sm text-gray-500">Total Capacity</p>
        </div>
      </div>

      {/* Yachts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredYachts.map((yacht) => (
          <div key={yacht.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            {yacht.image_url && (
              <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                  src={yacht.image_url}
                  alt={yacht.title}
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
                  <Ship className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-black">{yacht.title}</span>
                </div>
                {yacht.is_featured && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    Featured
                  </span>
                )}
              </div>

              {yacht.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {yacht.description}
                </p>
              )}

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {yacht.origin} → {yacht.destination}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm">{formatDate(yacht.departure_date)}</p>
                    {yacht.return_date && (
                      <p className="text-xs text-gray-500">Return: {formatDate(yacht.return_date)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{yacht.passengers} guests</span>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold">
                    {formatPrice(yacht.price, yacht.currency, yacht.price_on_request)}
                  </span>
                </div>
              </div>

              {yacht.duration && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium">{yacht.duration}</p>
                </div>
              )}

              <button 
                onClick={() => handleBookYacht(yacht)}
                className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Book Now</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredYachts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No yacht charters found</h3>
          <p className="text-gray-500">
            {searchTerm || featuredFilter !== 'all'
              ? 'Try adjusting your search criteria' 
              : 'No yacht charters are currently available'
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
          showSuccess('Success', 'Your yacht charter request has been submitted');
          setShowCheckout(false);
        }}
      />
    </div>
  );
};