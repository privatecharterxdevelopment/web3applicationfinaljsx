import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, DollarSign, Plane, MapPin, Star, ShoppingCart } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ServiceCheckout } from './ServiceCheckout';
import { useNotification } from '../../../contexts/CRM/NotificationContext';

interface Jet {
  id: string;
  aircraft_model: string | null;
  description: string | null;
  aircraft_category: string | null;
  price_range: string | null;
  range: string | null;
  capacity: number | null;
  manufacturer: string | null;
  image_url: string | null;
  title: string | null;
}

export const JetsService: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [jets, setJets] = useState<Jet[]>([]);
  const [filteredJets, setFilteredJets] = useState<Jet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    fetchJets();
  }, []);

  useEffect(() => {
    filterJets();
  }, [jets, searchTerm, categoryFilter, manufacturerFilter]);

  const fetchJets = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('jets')
        .select('*')
        .order('aircraft_model', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched jets data:', data);
      setJets(data || []);
    } catch (err: any) {
      console.error('Error fetching jets:', err);
      setError(err.message || 'Failed to fetch jets data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterJets = () => {
    let filtered = jets;

    if (searchTerm) {
      filtered = filtered.filter(jet => 
        jet.aircraft_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jet.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jet.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jet.aircraft_category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(jet => jet.aircraft_category === categoryFilter);
    }

    if (manufacturerFilter !== 'all') {
      filtered = filtered.filter(jet => jet.manufacturer === manufacturerFilter);
    }

    setFilteredJets(filtered);
  };

  const getUniqueCategories = () => {
    const categories = jets
      .map(jet => jet.aircraft_category)
      .filter((category, index, self) => category && self.indexOf(category) === index)
      .sort();
    return categories;
  };

  const getUniqueManufacturers = () => {
    const manufacturers = jets
      .map(jet => jet.manufacturer)
      .filter((manufacturer, index, self) => manufacturer && self.indexOf(manufacturer) === index)
      .sort();
    return manufacturers;
  };

  const handleRequestQuote = (jet: Jet) => {
    // Extract price from price_range string (e.g., "$50,000 - $75,000" -> 50000)
    let price = 50000; // Default price
    if (jet.price_range) {
      const priceMatch = jet.price_range.match(/\$?([\d,]+)/);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ''));
      }
    }

    setSelectedService({
      id: jet.id,
      type: 'jet' as const,
      name: jet.title || jet.aircraft_model || 'Private Jet',
      price: price,
      currency: '$',
      image_url: jet.image_url,
      details: {
        manufacturer: jet.manufacturer,
        category: jet.aircraft_category,
        capacity: jet.capacity,
        range: jet.range,
        description: jet.description
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
            <p className="text-gray-600">Loading private jets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <h3 className="font-medium">Error loading jets data</h3>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={fetchJets}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Private Jets</h1>
            <p className="text-gray-600">Explore our fleet of luxury private aircraft</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by aircraft model, manufacturer, category, or description..."
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
            <select
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Manufacturers</option>
              {getUniqueManufacturers().map((manufacturer) => (
                <option key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-2xl font-bold text-black">{jets.length}</p>
          <p className="text-sm text-gray-500">Total Aircraft</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-2xl font-bold text-black">{filteredJets.length}</p>
          <p className="text-sm text-gray-500">Filtered Results</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-2xl font-bold text-black">{getUniqueCategories().length}</p>
          <p className="text-sm text-gray-500">Categories</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-2xl font-bold text-black">{getUniqueManufacturers().length}</p>
          <p className="text-sm text-gray-500">Manufacturers</p>
        </div>
      </div>

      {/* Jets Grid */}
      {filteredJets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJets.map((jet) => (
            <div key={jet.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {jet.image_url ? (
                <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  <img
                    src={jet.image_url}
                    alt={jet.aircraft_model || jet.title || 'Private Jet'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden h-full bg-gray-200 flex items-center justify-center">
                    <Plane className="w-16 h-16 text-gray-400" />
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <Plane className="w-16 h-16 text-gray-400" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2 flex-1">
                    <Plane className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-black text-lg leading-tight">
                        {jet.title || jet.aircraft_model || 'Private Jet'}
                      </h3>
                      {jet.aircraft_model && jet.title && jet.aircraft_model !== jet.title && (
                        <p className="text-sm text-gray-500">{jet.aircraft_model}</p>
                      )}
                    </div>
                  </div>
                  {jet.aircraft_category && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex-shrink-0 ml-2">
                      {jet.aircraft_category}
                    </span>
                  )}
                </div>

                {jet.manufacturer && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">Manufacturer</p>
                    <p className="text-sm font-medium text-gray-700">{jet.manufacturer}</p>
                  </div>
                )}

                {jet.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {jet.description}
                  </p>
                )}

                <div className="space-y-3 mb-6">
                  {jet.capacity && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        Up to {jet.capacity} passengers
                      </span>
                    </div>
                  )}

                  {jet.range && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Range: {jet.range}</span>
                    </div>
                  )}

                  {jet.price_range && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">{jet.price_range}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleRequestQuote(jet)}
                  className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Request Quote</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {jets.length === 0 ? 'No jets available' : 'No jets found'}
          </h3>
          <p className="text-gray-500">
            {jets.length === 0 
              ? 'No private jets are currently in the database'
              : searchTerm || categoryFilter !== 'all' || manufacturerFilter !== 'all'
              ? 'Try adjusting your search criteria' 
              : 'No jets match your current filters'
            }
          </p>
          {jets.length === 0 && (
            <button 
              onClick={fetchJets}
              className="mt-4 text-sm text-black underline hover:no-underline"
            >
              Refresh data
            </button>
          )}
        </div>
      )}

      {/* Service Checkout Modal */}
      <ServiceCheckout
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        service={selectedService}
        onOrderPlaced={() => {
          showSuccess('Success', 'Your jet charter request has been submitted');
          setShowCheckout(false);
        }}
      />
    </div>
  );
};