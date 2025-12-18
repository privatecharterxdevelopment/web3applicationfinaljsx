import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, DollarSign, Zap, Users, Calendar, ShoppingCart } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/CRM/NotificationContext';
import { ServiceCheckout } from './ServiceCheckout';

interface Helicopter {
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

export const HelicoptersService: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [helicopters, setHelicopters] = useState<Helicopter[]>([]);
  const [filteredHelicopters, setFilteredHelicopters] = useState<Helicopter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    fetchHelicopters();
  }, []);

  useEffect(() => {
    filterHelicopters();
  }, [helicopters, searchTerm, featuredFilter]);

  const fetchHelicopters = async () => {
    try {
      setIsLoading(true);
      // Using fixed_offers table for helicopter charters
      const { data, error } = await supabase
        .from('fixed_offers')
        .select('*')
        .eq('aircraft_type', 'helicopter')
        .order('departure_date', { ascending: true });

      if (error) throw error;
      setHelicopters(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch helicopters');
      console.error('Error fetching helicopters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterHelicopters = () => {
    let filtered = helicopters;

    if (searchTerm) {
      filtered = filtered.filter(helicopter => 
        helicopter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        helicopter.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        helicopter.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        helicopter.destination?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (featuredFilter === 'featured') {
      filtered = filtered.filter(helicopter => helicopter.is_featured);
    } else if (featuredFilter === 'regular') {
      filtered = filtered.filter(helicopter => !helicopter.is_featured);
    }

    setFilteredHelicopters(filtered);
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

  const handleBookHelicopter = (helicopter: Helicopter) => {
    setSelectedService({
      id: helicopter.id,
      type: 'helicopter',
      name: helicopter.title,
      price: helicopter.price,
      currency: helicopter.currency,
      image_url: helicopter.image_url,
      details: {
        origin: helicopter.origin,
        destination: helicopter.destination,
        departure_date: helicopter.departure_date,
        return_date: helicopter.return_date,
        passengers: helicopter.passengers,
        duration: helicopter.duration,
        description: helicopter.description
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
            <p className="text-gray-600">Loading helicopter services...</p>
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
            <h1 className="text-2xl font-bold text-black mb-2">Helicopter Services</h1>
            <p className="text-gray-600">Premium helicopter charter and transfer services</p>
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
                <option value="all">All Services</option>
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
          <p className="text-2xl font-bold text-black">{helicopters.length}</p>
          <p className="text-sm text-gray-500">Total Services</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{filteredHelicopters.length}</p>
          <p className="text-sm text-gray-500">Filtered Results</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">
            {helicopters.filter(helicopter => helicopter.is_featured).length}
          </p>
          <p className="text-sm text-gray-500">Featured</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">
            {helicopters.reduce((sum, helicopter) => sum + helicopter.passengers, 0)}
          </p>
          <p className="text-sm text-gray-500">Total Capacity</p>
        </div>
      </div>

      {/* Helicopters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHelicopters.map((helicopter) => (
          <div key={helicopter.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            {helicopter.image_url && (
              <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                  src={helicopter.image_url}
                  alt={helicopter.title}
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
                  <Zap className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-black">{helicopter.title}</span>
                </div>
                {helicopter.is_featured && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    Featured
                  </span>
                )}
              </div>

              {helicopter.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {helicopter.description}
                </p>
              )}

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {helicopter.origin} → {helicopter.destination}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm">{formatDate(helicopter.departure_date)}</p>
                    {helicopter.return_date && (
                      <p className="text-xs text-gray-500">Return: {formatDate(helicopter.return_date)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{helicopter.passengers} passengers</span>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold">
                    {formatPrice(helicopter.price, helicopter.currency, helicopter.price_on_request)}
                  </span>
                </div>
              </div>

              {helicopter.duration && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium">{helicopter.duration}</p>
                </div>
              )}

              <button 
                onClick={() => handleBookHelicopter(helicopter)}
                className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Book Now</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredHelicopters.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No helicopter services found</h3>
          <p className="text-gray-500">
            {searchTerm || featuredFilter !== 'all'
              ? 'Try adjusting your search criteria' 
              : 'No helicopter services are currently available'
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
          showSuccess('Success', 'Your helicopter charter request has been submitted');
          setShowCheckout(false);
        }}
      />
    </div>
  );
};