import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, DollarSign, Car, Clock, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';
import { ServiceCheckout } from './ServiceCheckout';

interface LuxuryCar {
  id: string;
  name: string;
  brand: string;
  model: string;
  type: string;
  location: string;
  currency: string;
  price_per_hour: number | null;
  price_per_day: number;
  price_per_week: number | null;
  description: string | null;
  features: string[] | null;
  image_url: string | null;
  is_featured: boolean | null;
  is_available: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const LuxuryCarsService: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [cars, setCars] = useState<LuxuryCar[]>([]);
  const [filteredCars, setFilteredCars] = useState<LuxuryCar[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    filterCars();
  }, [cars, searchTerm, brandFilter, typeFilter]);

  const fetchCars = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('luxurycars')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCars(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch luxury cars');
      console.error('Error fetching luxury cars:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCars = () => {
    let filtered = cars;

    if (searchTerm) {
      filtered = filtered.filter(car => 
        car.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (brandFilter !== 'all') {
      filtered = filtered.filter(car => car.brand === brandFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(car => car.type === typeFilter);
    }

    setFilteredCars(filtered);
  };

  const getUniqueBrands = () => {
    const brands = cars
      .map(car => car.brand)
      .filter((brand, index, self) => brand && self.indexOf(brand) === index)
      .sort();
    return brands;
  };

  const getUniqueTypes = () => {
    const types = cars
      .map(car => car.type)
      .filter((type, index, self) => type && self.indexOf(type) === index)
      .sort();
    return types;
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return 'Price on request';
    return `${currency}${price.toLocaleString()}`;
  };

  const handleBookCar = (car: LuxuryCar) => {
    setSelectedService({
      id: car.id,
      type: 'car',
      name: `${car.brand} ${car.model} - ${car.name}`,
      price: car.price_per_day,
      currency: car.currency,
      image_url: car.image_url,
      details: {
        brand: car.brand,
        model: car.model,
        type: car.type,
        location: car.location,
        price_per_hour: car.price_per_hour,
        price_per_day: car.price_per_day,
        price_per_week: car.price_per_week,
        features: car.features,
        description: car.description
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
            <p className="text-gray-600">Loading luxury cars...</p>
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
            <h1 className="text-2xl font-bold text-black mb-2">Luxury Cars</h1>
            <p className="text-gray-600">Premium vehicle rental services</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, brand, model, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Brands</option>
                {getUniqueBrands().map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Types</option>
              {getUniqueTypes().map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{cars.length}</p>
          <p className="text-sm text-gray-500">Total Vehicles</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{filteredCars.length}</p>
          <p className="text-sm text-gray-500">Filtered Results</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{getUniqueBrands().length}</p>
          <p className="text-sm text-gray-500">Brands</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">
            {cars.filter(car => car.is_featured).length}
          </p>
          <p className="text-sm text-gray-500">Featured</p>
        </div>
      </div>

      {/* Cars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCars.map((car) => (
          <div key={car.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            {car.image_url && (
              <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                  src={car.image_url}
                  alt={car.name}
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
                  <Car className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-black">{car.name}</span>
                </div>
                {car.is_featured && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    Featured
                  </span>
                )}
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-500">{car.brand} {car.model}</p>
                <p className="text-xs text-gray-400 capitalize">{car.type}</p>
              </div>

              {car.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {car.description}
                </p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{car.location}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm capitalize">{car.is_available || 'Available'}</span>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                {car.price_per_hour && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Per Hour</span>
                    <span className="text-sm font-semibold">
                      {formatPrice(car.price_per_hour, car.currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Per Day</span>
                  <span className="text-sm font-semibold">
                    {formatPrice(car.price_per_day, car.currency)}
                  </span>
                </div>
                {car.price_per_week && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Per Week</span>
                    <span className="text-sm font-semibold">
                      {formatPrice(car.price_per_week, car.currency)}
                    </span>
                  </div>
                )}
              </div>

              {car.features && car.features.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Features</p>
                  <div className="flex flex-wrap gap-1">
                    {car.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {feature}
                      </span>
                    ))}
                    {car.features.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        +{car.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button 
                onClick={() => handleBookCar(car)}
                className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Book Now</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCars.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No cars found</h3>
          <p className="text-gray-500">
            {searchTerm || brandFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search criteria' 
              : 'No luxury cars are currently available'
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
          showSuccess('Success', 'Your car rental request has been submitted');
          setShowCheckout(false);
        }}
      />
    </div>
  );
};