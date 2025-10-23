import React, { useState, useEffect, useRef } from 'react';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  GeolocateControl,
  MapRef
} from 'react-map-gl';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  X,
  Car,
  Mountain,
  Star,
  MapPinned,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Euro
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../lib/supabase';

const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJpdmF0ZWNoYXJ0ZXJ4IiwiYSI6ImNtN2Z4empwNzA2Z2wyanM3NWN2Znpmbm4ifQ.nuvmpND_qtdsauY-n8F_9g';

const initialViewState = {
  longitude: 10.0,
  latitude: 51.0,
  zoom: 4.0,
  pitch: 45,
  bearing: 0
};

const OFFICE_LOCATIONS = [
  {
    id: "london",
    name: "London Office",
    address: "71-75 Shelton Street, Covent Garden",
    city: "London",
    postcode: "WC2H 9JQ",
    country: "United Kingdom",
    hours: "Mo-Su, 00:00 - 23:59",
    lat: 51.5155,
    lng: -0.1229,
    type: 'office'
  },
  {
    id: "zurich",
    name: "Zurich Office",
    address: "Bahnhofstrasse 37/10",
    city: "Zurich",
    postcode: "8001",
    country: "Switzerland",
    hours: "Mo-Su, 00:00 - 23:59",
    lat: 47.3769,
    lng: 8.5417,
    type: 'office'
  },
  {
    id: "miami",
    name: "Miami Office",
    address: "1000 Brickell Ave, Suite 715",
    city: "Miami",
    postcode: "33131",
    country: "United States",
    hours: "Mo-Su, 00:00 - 23:59",
    lat: 25.7617,
    lng: -80.1918,
    type: 'office'
  }
];

interface DashboardMapProps {
  className?: string;
}

interface ServiceLocation {
  id: string;
  name?: string;
  title?: string;
  lat: number;
  lng: number;
  type?: string;
  type_category?: string;
  is_featured?: boolean;
  location?: string;
  destination?: string;
  city?: string;
  price?: number;
  price_per_day?: number;
  currency?: string;
  image_url?: string;
}

export default function DashboardMap({ className = '' }: DashboardMapProps) {
  const [viewState, setViewState] = useState(initialViewState);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [services, setServices] = useState<ServiceLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<MapRef>(null);
  const animationRef = useRef<number>();

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load service data
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      // Fetch luxury cars
      const { data: luxuryCars } = await supabase
        .from('luxury_cars')
        .select('*')
        .limit(20);

      // Fetch adventure packages
      const { data: adventurePackages } = await supabase
        .from('fixed_offers')
        .select('*')
        .eq('category', 'adventure')
        .limit(20);

      const allServices: ServiceLocation[] = [];

      // Add office locations
      OFFICE_LOCATIONS.forEach(office => {
        allServices.push(office as ServiceLocation);
      });

      // Add luxury cars with geocoding
      if (luxuryCars) {
        for (const car of luxuryCars) {
          if (car.location && car.lat && car.lng) {
            allServices.push({
              id: `car-${car.id}`,
              name: car.name,
              lat: car.lat,
              lng: car.lng,
              type_category: 'luxury-car',
              location: car.location,
              price_per_day: car.price_per_day,
              currency: car.currency,
              image_url: car.image_url,
              is_featured: car.is_featured
            });
          }
        }
      }

      // Add adventure packages with geocoding
      if (adventurePackages) {
        for (const pkg of adventurePackages) {
          if (pkg.destination && pkg.lat && pkg.lng) {
            allServices.push({
              id: `adventure-${pkg.id}`,
              title: pkg.title,
              lat: pkg.lat,
              lng: pkg.lng,
              type_category: 'adventure-package',
              destination: pkg.destination,
              price: pkg.price,
              currency: pkg.currency,
              image_url: pkg.image_url,
              is_featured: pkg.is_featured
            });
          }
        }
      }

      setServices(allServices);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Auto-rotation effect when no interaction
  useEffect(() => {
    let isActive = true;
    let animationId: number | null = null;

    const animate = () => {
      if (!isActive || !mapLoaded || !mapRef.current) return;

      setViewState(prev => ({
        ...prev,
        bearing: (prev.bearing + 0.15) % 360
      }));

      if (isActive) {
        animationId = requestAnimationFrame(animate);
      }
    };

    if (mapLoaded && !showPopup) {
      const timeoutId = setTimeout(() => {
        if (isActive) {
          animationId = requestAnimationFrame(animate);
        }
      }, 2000);

      return () => {
        isActive = false;
        clearTimeout(timeoutId);
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }

    return () => {
      isActive = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [mapLoaded, showPopup]);

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  const handleMarkerClick = (location: ServiceLocation) => {
    setSelectedLocation(location);
    setShowPopup(true);
  };

  const getMarkerIcon = (service: ServiceLocation) => {
    if (service.type === 'office') return Building2;
    if (service.type_category === 'luxury-car') return Car;
    if (service.type_category === 'adventure-package') return Mountain;
    return MapPin;
  };

  const getMarkerColor = (service: ServiceLocation) => {
    if (service.type === 'office') return 'bg-black';
    if (service.type_category === 'luxury-car') return 'bg-blue-500';
    if (service.type_category === 'adventure-package') return 'bg-green-500';
    return 'bg-gray-500';
  };

  // Filtering and pricing functions
  const getCurrencySymbol = (code?: string) => {
    const symbols: Record<string, string> = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'CHF': 'CHF'
    };
    return symbols[code || 'EUR'] || '€';
  };

  const getServicePrice = (service: ServiceLocation) => {
    const price = service.price_per_day || service.price;
    const currency = getCurrencySymbol(service.currency);
    if (!price) return 'Contact for pricing';

    if (service.price_per_day) {
      return `${currency}${price.toLocaleString()}/day`;
    }
    return `${currency}${price.toLocaleString()}`;
  };

  const filteredServices = services.filter(service => {
    // Search filter
    if (searchTerm) {
      const searchFields = [
        service.name,
        service.title,
        service.location,
        service.destination,
        service.city
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchFields.includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'office' && service.type !== 'office') return false;
      if (selectedCategory === 'luxury-car' && service.type_category !== 'luxury-car') return false;
      if (selectedCategory === 'adventure' && service.type_category !== 'adventure-package') return false;
    }

    // Price filter
    if (priceRange !== 'all' && service.type !== 'office') {
      const price = service.price_per_day || service.price || 0;
      switch (priceRange) {
        case 'under-1000':
          return price < 1000;
        case '1000-5000':
          return price >= 1000 && price <= 5000;
        case 'over-5000':
          return price > 5000;
        default:
          return true;
      }
    }

    return true;
  });

  const handleServiceClick = (service: ServiceLocation) => {
    setSelectedLocation(service);
    setShowPopup(true);
    setSidebarCollapsed(true); // Collapse sidebar when service is selected

    if (mapRef.current && service.lat && service.lng) {
      mapRef.current.flyTo({
        center: [service.lng, service.lat],
        zoom: 8,
        duration: 2000
      });
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gray-100 ${className}`}>
      {/* Floating Services Sidebar */}
      <div className={`absolute top-4 left-4 bottom-4 z-20 transition-all duration-300 ${
        sidebarCollapsed ? 'w-12' : 'w-96'
      }`}>
        <div className="h-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Our Services</h2>
                <p className="text-xs text-gray-600">Explore locations & pricing</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search services..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Filter size={14} />
                  </button>
                </div>

                {showFilters && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        <option value="all">All Categories</option>
                        <option value="office">Offices</option>
                        <option value="luxury-car">Luxury Cars</option>
                        <option value="adventure">Adventures</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Price Range</label>
                      <select
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        <option value="all">All Prices</option>
                        <option value="under-1000">Under €1,000</option>
                        <option value="1000-5000">€1,000 - €5,000</option>
                        <option value="over-5000">Over €5,000</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Services List */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {filteredServices.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => handleServiceClick(service)}
                        className="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 group"
                      >
                        <div className="flex gap-3">
                          {service.image_url && (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={service.image_url}
                                alt={service.name || service.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-medium text-gray-900 text-sm truncate pr-2">
                                {service.name || service.title}
                              </h3>
                              {service.is_featured && (
                                <div className="bg-black text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 flex-shrink-0">
                                  <Star size={8} />
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-gray-500 mb-2 truncate">
                              {service.location || service.destination || service.city}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium bg-gray-100 text-gray-700">
                                {service.type_category === 'luxury-car' && <Car size={8} />}
                                {service.type_category === 'adventure-package' && <Mountain size={8} />}
                                {service.type === 'office' && <Building2 size={8} />}
                                {service.type === 'office' ? 'Office' :
                                 service.type_category === 'luxury-car' ? 'Car' :
                                 service.type_category === 'adventure-package' ? 'Adventure' : 'Service'}
                              </div>

                              <div className="text-xs font-semibold text-gray-900">
                                {service.type === 'office' ? '24/7' : getServicePrice(service)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredServices.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm mb-2">No services found</p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('all');
                            setPriceRange('all');
                          }}
                          className="text-black hover:underline text-xs font-medium"
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent'
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        scrollZoom={true}
        dragRotate={true}
        touchZoomRotate={true}
        minZoom={2}
        maxZoom={8}
        doubleClickZoom={false}
        touchPitch={false}
      >
        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <NavigationControl showCompass={true} showZoom={true} />
          <FullscreenControl />
          <GeolocateControl />
        </div>

        {/* Service Markers */}
        {services.map((service) => {
          const IconComponent = getMarkerIcon(service);
          return (
            <Marker
              key={service.id}
              longitude={service.lng}
              latitude={service.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(service);
              }}
            >
              <div className="relative cursor-pointer group">
                <div className={`p-2 ${getMarkerColor(service)} rounded-lg shadow-lg transform transition-transform group-hover:scale-110 border-2 border-white`}>
                  <IconComponent size={16} className="text-white" />
                  {service.is_featured && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center border border-white">
                      <Star size={8} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-current rotate-45" />
              </div>
            </Marker>
          );
        })}

        {/* Location Popup */}
        {showPopup && selectedLocation && (
          <Popup
            longitude={selectedLocation.lng}
            latitude={selectedLocation.lat}
            anchor="bottom"
            onClose={() => setShowPopup(false)}
            closeButton={false}
            closeOnClick={false}
            className="z-50"
            offset={20}
            maxWidth="280px"
          >
            <div className="p-0 overflow-hidden rounded-lg shadow-lg bg-white border border-gray-100 min-w-[260px]">
              <div className="flex items-center justify-between bg-black text-white p-3">
                <div className="font-medium text-sm">
                  {selectedLocation.name || selectedLocation.title || "Service Location"}
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-3">
                {selectedLocation.type === 'office' ? (
                  <>
                    <div className="flex items-start gap-2 mb-2">
                      <MapPinned size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-600">{selectedLocation.address}</div>
                        <div className="text-sm text-gray-500">
                          {selectedLocation.city}, {selectedLocation.postcode}
                        </div>
                        <div className="text-sm text-gray-500">{selectedLocation.country}</div>
                      </div>
                    </div>

                    {selectedLocation.hours && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Clock size={16} className="text-gray-500" />
                        <span>{selectedLocation.hours}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-600 mb-2">
                      {selectedLocation.location || selectedLocation.destination}
                    </div>

                    {(selectedLocation.price || selectedLocation.price_per_day) && (
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedLocation.currency || '€'}{selectedLocation.price_per_day || selectedLocation.price}
                        {selectedLocation.price_per_day && <span className="text-sm text-gray-500">/day</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium mt-2 bg-gray-100 text-gray-700 border border-gray-200 w-fit">
                      {selectedLocation.type_category === 'luxury-car' && <Car size={8} />}
                      {selectedLocation.type_category === 'adventure-package' && <Mountain size={8} />}
                      {selectedLocation.type_category === 'luxury-car' ? 'Luxury Car' :
                       selectedLocation.type_category === 'adventure-package' ? 'Adventure' : 'Service'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Loading services...</span>
          </div>
        </div>
      )}
    </div>
  );
}