'use client';

import React, { useState, useEffect, useRef } from 'react';
import Map, {
  Source,
  Layer,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  GeolocateControl
} from 'react-map-gl';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  X,
  Search,
  Car,
  Mountain,
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  DollarSign,
  Calendar,
  ArrowRight,
  Wifi,
  Users,
  Euro,
  Send,
  Check,
  Settings,
  Heart,
  Share,
  Menu,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

// Import components and services
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { airportsStaticService } from '../services/airportsStaticService';
import { createRequest } from '../services/requests';
import { useAuth } from '../context/AuthContext';

const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJpdmF0ZWNoYXJ0ZXJ4IiwiYSI6ImNtN2Z4empwNzA2Z2wyanM3NWN2Znpmbm4ifQ.nuvmpND_qtdsauY-n8F_9g';

const initialViewState = {
  longitude: 10.0,
  latitude: 51.0,
  zoom: 4.0,
  pitch: 0,
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

const currencies = [
  { code: 'EUR', symbol: '€', icon: Euro },
  { code: 'USD', symbol: '$', icon: DollarSign },
  { code: 'GBP', symbol: '£', icon: DollarSign },
  { code: 'CHF', symbol: 'CHF', icon: DollarSign },
];

const getCurrencySymbol = (code) => {
  return currencies.find(c => c.code === code)?.symbol || code;
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

const geocodeLocation = async (location) => {
  if (!location) {
    console.warn('No location provided for geocoding');
    return null;
  }

  console.log('🗺️ Geocoding location:', location);

  try {
    const airports = await airportsStaticService.searchAirports(location, 1);
    if (airports.length > 0) {
      console.log('✅ Found coordinates via airport service:', airports[0]);
      return {
        lat: airports[0].lat,
        lng: airports[0].lng
      };
    }

    console.log('🔄 Trying Mapbox geocoding for:', location);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      console.log('✅ Found coordinates via Mapbox:', { lat, lng });
      return { lat, lng };
    } else {
      console.warn('❌ No results from Mapbox for:', location);
    }
  } catch (error) {
    console.error('💥 Geocoding failed for:', location, error);
  }

  return null;
};

function EnhancedServicesMap() {
  const { user, isAuthenticated } = useAuth();
  const [viewState, setViewState] = useState(initialViewState);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(false);
  const mapRef = useRef();
  const isMobile = useIsMobile();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [luxuryCars, setLuxuryCars] = useState([]);
  const [adventurePackages, setAdventurePackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLuxuryCars = async () => {
    console.log('🚗 Starting to fetch luxury cars...');
    try {
      const { data, error } = await supabase
        .from('luxury_cars')
        .select('*')
        .limit(50);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setLuxuryCars([]);
        return;
      }

      const carsWithCoords = await Promise.all(
        data.map(async (car) => {
          const coords = await geocodeLocation(car.location);
          return {
            ...car,
            lat: coords?.lat,
            lng: coords?.lng,
            type_category: 'luxury-car',
            price: car.price_per_day,
            name: car.name,
            title: car.name
          };
        })
      );

      const validCars = carsWithCoords.filter(car => car.lat && car.lng);
      setLuxuryCars(validCars);

    } catch (error) {
      console.error('💥 Error fetching luxury cars:', error);
      setError(prev => prev || `Failed to fetch luxury cars: ${error.message}`);
    }
  };

  const fetchAdventurePackages = async () => {
    console.log('🏔️ Starting to fetch adventure packages...');
    try {
      const { data, error } = await supabase
        .from('fixed_offers')
        .select('*')
        .limit(50);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setAdventurePackages([]);
        return;
      }

      const packagesWithCoords = await Promise.all(
        data.map(async (pkg) => {
          const location = pkg.destination || pkg.origin;
          const coords = await geocodeLocation(location);
          return {
            ...pkg,
            lat: coords?.lat,
            lng: coords?.lng,
            type_category: 'adventure-package',
            name: pkg.title
          };
        })
      );

      const validPackages = packagesWithCoords.filter(pkg => pkg.lat && pkg.lng);
      setAdventurePackages(validPackages);

    } catch (error) {
      console.error('💥 Error fetching adventure packages:', error);
      setError(prev => prev || `Failed to fetch adventure packages: ${error.message}`);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchLuxuryCars(),
          fetchAdventurePackages()
        ]);
      } catch (err) {
        setError(`Failed to load services: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const allServices = [
    ...OFFICE_LOCATIONS,
    ...luxuryCars,
    ...adventurePackages
  ];

  const filteredServices = allServices.filter(service => {
    const matchesSearch = searchTerm === '' ||
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      service.type_category === selectedCategory ||
      (selectedCategory === 'office' && service.type === 'office');

    const servicePrice = service.price_per_day || service.price || 0;
    const matchesPrice = priceRange === 'all' ||
      (priceRange === 'budget' && servicePrice < 5000) ||
      (priceRange === 'mid' && servicePrice >= 5000 && servicePrice < 20000) ||
      (priceRange === 'luxury' && servicePrice >= 20000);

    return matchesSearch && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'featured':
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      case 'price-low':
        return (a.price_per_day || a.price || 0) - (b.price_per_day || b.price || 0);
      case 'price-high':
        return (b.price_per_day || b.price || 0) - (a.price_per_day || a.price || 0);
      case 'name':
        return (a.name || a.title || '').localeCompare(b.name || b.title || '');
      default:
        return 0;
    }
  });

  useEffect(() => {
    if (mapRef.current && viewState.zoom >= 14 && !is3DMode) {
      setIs3DMode(true);
      mapRef.current.easeTo({
        pitch: 60,
        bearing: 45,
        duration: 1000
      });
    } else if (mapRef.current && viewState.zoom < 12 && is3DMode) {
      setIs3DMode(false);
      mapRef.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
    }
  }, [viewState.zoom, is3DMode]);

  useEffect(() => {
    if (isMobile) return;

    let isActive = true;
    let animationId = null;

    const animate = () => {
      if (!isActive || !mapLoaded || !mapRef.current || rotationPaused) return;

      const shouldRotate = !searchTerm &&
        selectedCategory === 'all' &&
        !selectedLocation &&
        !showPopup;

      if (shouldRotate) {
        setViewState(prev => ({
          ...prev,
          bearing: (prev.bearing + 0.03) % 360,
          transitionDuration: 0
        }));

        if (isActive) {
          animationId = requestAnimationFrame(animate);
        }
      }
    };

    if (mapLoaded && !rotationPaused) {
      const timeoutId = setTimeout(() => {
        if (isActive && !searchTerm && selectedCategory === 'all' && !selectedLocation) {
          animationId = requestAnimationFrame(animate);
        }
      }, 2000);

      return () => {
        isActive = false;
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        clearTimeout(timeoutId);
      };
    }

    return () => {
      isActive = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [mapLoaded, searchTerm, selectedCategory, isMobile, rotationPaused, selectedLocation, showPopup]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsCtrlPressed(false);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleWheel = (e) => {
      if ((e.ctrlKey || e.metaKey) && mapRef.current) {
        const mapContainer = mapRef.current.getContainer();
        const rect = mapContainer.getBoundingClientRect();
        const isOverMap = e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom;

        if (isOverMap) {
          e.preventDefault();
          e.stopPropagation();

          const map = mapRef.current.getMap();
          const zoomDelta = e.deltaY > 0 ? -1 : 1;
          const currentZoom = map.getZoom();
          const newZoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), currentZoom + zoomDelta));

          map.easeTo({
            zoom: newZoom,
            duration: 250
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleMapLoad = () => {
    if (!mapLoaded) {
      setMapLoaded(true);
    }
  };

  const handleMarkerClick = (location) => {
    if (!location) return;
    setSelectedLocation(location);
    setShowPopup(true);
    setRotationPaused(true);
  };

  const handleMapClick = () => {
    setRotationPaused(true);
  };

  const getMarkerIcon = (service) => {
    if (service.type === 'office') return Building2;
    if (service.type_category === 'luxury-car') return Car;
    if (service.type_category === 'adventure-package') return Mountain;
    return MapPin;
  };

  const getServicePrice = (service) => {
    if (service.price_per_day) {
      return `${getCurrencySymbol(service.currency)} ${service.price_per_day.toLocaleString()}/day`;
    }
    if (service.price) {
      return `${getCurrencySymbol(service.currency)} ${service.price.toLocaleString()}`;
    }
    if (service.price_on_request) {
      return 'Price on Request';
    }
    return 'Contact for pricing';
  };

  const getMarkerSize = () => isMobile ? 20 : 16;
  const getMarkerPadding = () => isMobile ? 'p-3' : 'p-2';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      fontWeight: '400',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    }}>
      <Header />

      <main className="flex-1">
        <div className="relative h-screen">
          <div className="absolute inset-0 mt-[88px] p-8">
            <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden relative">

              {/* Collapsible Monochromatic Sidebar */}
              <div className={`absolute left-4 top-4 bottom-4 bg-white/95 backdrop-blur-xl border border-gray-200/50 flex flex-col rounded-2xl shadow-2xl z-10 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-96'
                }`}>

                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-20"
                >
                  <ChevronLeft
                    size={14}
                    className={`text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                  />
                </button>

                {sidebarCollapsed ? (
                  <div className="p-4 flex flex-col items-center gap-4 pt-8">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Search size={16} className="text-gray-600" />
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <SlidersHorizontal size={16} className="text-gray-600" />
                    </div>
                    <div className="text-xs text-gray-500 font-medium transform -rotate-90 mt-4">
                      {filteredServices.length}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-6 border-b border-gray-200 flex-shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-semibold text-gray-900">Services</h1>
                        <div className="text-sm text-gray-500">{filteredServices.length} results</div>
                      </div>

                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Search services..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setRotationPaused(true);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                        <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'luxury-car', label: 'Cars' },
                          { id: 'adventure-package', label: 'Adventures' },
                          { id: 'office', label: 'Offices' }
                        ].map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === category.id
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                              }`}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-lg w-full justify-center"
                      >
                        <SlidersHorizontal size={16} />
                        Filters
                        {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {showFilters && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'all', label: 'All' },
                                { id: 'budget', label: '< €5k' },
                                { id: 'mid', label: '€5k-20k' },
                                { id: 'luxury', label: '€20k+' }
                              ].map((range) => (
                                <button
                                  key={range.id}
                                  onClick={() => setPriceRange(range.id)}
                                  className={`px-3 py-2 rounded-lg text-xs transition-all ${priceRange === range.id
                                      ? 'bg-black text-white'
                                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                >
                                  {range.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                              <option value="featured">Featured</option>
                              <option value="price-low">Price: Low to High</option>
                              <option value="price-high">Price: High to Low</option>
                              <option value="name">Name A-Z</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                        </div>
                      ) : error ? (
                        <div className="text-center py-12 px-6">
                          <p className="text-red-600 mb-3 text-sm">{error}</p>
                          <button
                            onClick={() => window.location.reload()}
                            className="text-gray-700 hover:text-black underline text-sm font-medium"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="p-6 pt-0 space-y-4">
                          {filteredServices.map((service) => (
                            <div
                              key={service.id}
                              className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 group"
                              onClick={() => {
                                setSelectedLocation(service);
                                setShowPopup(true);
                                setRotationPaused(true);

                                if (mapRef.current && service.lat && service.lng) {
                                  mapRef.current.flyTo({
                                    center: [service.lng, service.lat],
                                    zoom: 12,
                                    pitch: is3DMode ? 60 : 0,
                                    bearing: is3DMode ? 45 : 0,
                                    duration: 2000
                                  });
                                }
                              }}
                            >
                              <div className="flex gap-4 p-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={service.image_url || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=200&q=80'}
                                    alt={service.name || service.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate pr-2">
                                      {service.name || service.title}
                                    </h3>
                                    {service.is_featured && (
                                      <div className="bg-black text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0">
                                        <Star size={8} />
                                      </div>
                                    )}
                                  </div>

                                  <p className="text-xs text-gray-500 mb-2 truncate">
                                    {service.location || service.destination || service.city}
                                  </p>

                                  <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium mb-2 bg-gray-100 text-gray-700 border border-gray-200">
                                    {service.type_category === 'luxury-car' && <Car size={8} />}
                                    {service.type_category === 'adventure-package' && <Mountain size={8} />}
                                    {service.type === 'office' && <Building2 size={8} />}
                                    {service.type || service.package_type || 'Office'}
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-gray-900">
                                      {(service.price_per_day || service.price) ? getServicePrice(service) : 'Contact for pricing'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {filteredServices.length === 0 && (
                            <div className="text-center py-12">
                              <p className="text-gray-500 mb-3 text-sm">No services found</p>
                              <button
                                onClick={() => {
                                  setSearchTerm('');
                                  setSelectedCategory('all');
                                  setPriceRange('all');
                                  setRotationPaused(false);
                                }}
                                className="text-gray-700 hover:text-black underline text-sm font-medium"
                              >
                                Clear all filters
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="w-full h-full relative rounded-3xl overflow-hidden">
                <Map
                  ref={mapRef}
                  {...viewState}
                  onMove={evt => setViewState(evt.viewState)}
                  onLoad={handleMapLoad}
                  onClick={handleMapClick}
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    zIndex: 1
                  }}
                  mapStyle={is3DMode ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/light-v11"}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  attributionControl={false}
                  scrollZoom={isCtrlPressed || isFullscreen}
                  dragRotate={true}
                  touchZoomRotate={true}
                  minZoom={2}
                  maxZoom={18}
                  doubleClickZoom={false}
                  touchPitch={true}
                  projection="mercator"
                >

                  {is3DMode && mapLoaded && (
                    <>
                      <Source
                        id="mapbox-dem"
                        type="raster-dem"
                        url="mapbox://mapbox.mapbox-terrain-dem-v1"
                        tileSize={512}
                        maxzoom={14}
                      />
                      <Source
                        id="composite"
                        type="vector"
                        url="mapbox://mapbox.mapbox-streets-v8"
                      >
                        <Layer
                          id="building-3d"
                          source-layer="building"
                          type="fill-extrusion"
                          minzoom={14}
                          paint={{
                            'fill-extrusion-color': [
                              'case',
                              ['boolean', ['feature-state', 'hover'], false],
                              '#ff0000',
                              '#aaa'
                            ],
                            'fill-extrusion-height': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              15, 0,
                              15.05, ['coalesce', ['get', 'height'], 30]
                            ],
                            'fill-extrusion-base': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              15, 0,
                              15.05, ['coalesce', ['get', 'min_height'], 0]
                            ],
                            'fill-extrusion-opacity': 0.8
                          }}
                        />
                      </Source>
                    </>
                  )}

                  <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                    <NavigationControl showCompass={true} showZoom={true} />
                    {!isMobile && <FullscreenControl />}
                    <GeolocateControl
                      trackUserLocation
                      showUserHeading={true}
                      showAccuracyCircle={false}
                    />

                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <button
                        onClick={() => {
                          const newMode = !is3DMode;
                          setIs3DMode(newMode);

                          if (mapRef.current) {
                            if (newMode) {
                              mapRef.current.easeTo({
                                pitch: 60,
                                bearing: 45,
                                zoom: Math.max(viewState.zoom, 12),
                                duration: 1500
                              });
                            } else {
                              mapRef.current.easeTo({
                                pitch: 0,
                                bearing: 0,
                                duration: 1500
                              });
                            }
                          }
                        }}
                        className="flex items-center w-full px-3 py-2 transition-all duration-200 hover:bg-gray-50"
                        title={is3DMode ? 'Switch to 2D View' : 'Switch to 3D View'}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${is3DMode ? 'bg-black' : 'bg-gray-200'
                            }`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${is3DMode ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                          </div>

                          <span className="text-sm font-medium text-gray-700">
                            3D View
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {filteredServices.map((service) => {
                    if (service.type === 'office') {
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
                            <div className={`${getMarkerPadding()} bg-gradient-to-b from-gray-600 to-gray-800 rounded-lg shadow-xl transform transition-transform group-hover:scale-110 relative border-2 border-white`}>
                              <IconComponent size={getMarkerSize()} className="text-white" />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 border border-white" />
                          </div>
                        </Marker>
                      );
                    }

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
                          <div className="w-5 h-5 bg-gradient-to-b from-gray-500 to-gray-700 rounded-full shadow-xl transform transition-transform group-hover:scale-125 relative border-2 border-white">
                            {service.is_featured && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full flex items-center justify-center border border-white">
                                <Star size={8} className="text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </Marker>
                    );
                  })}

                  {showPopup && selectedLocation && (
                    <Popup
                      longitude={selectedLocation.lng}
                      latitude={selectedLocation.lat}
                      anchor="bottom"
                      onClose={() => {
                        setShowPopup(false);
                        setRotationPaused(false);
                      }}
                      closeButton={false}
                      closeOnClick={false}
                      className="z-50"
                      offset={25}
                      maxWidth="350px"
                    >
                      <div className="p-0 overflow-hidden rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border border-gray-100">
                        {selectedLocation.image_url && (
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={selectedLocation.image_url}
                              alt={selectedLocation.name || selectedLocation.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                            {selectedLocation.is_featured && (
                              <div className="absolute top-3 right-3 bg-black text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 shadow-lg">
                                <Star size={12} />
                                Featured
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {selectedLocation.name || selectedLocation.title}
                            </h3>
                            <button
                              onClick={() => {
                                setShowPopup(false);
                                setRotationPaused(false);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="mb-4">
                            <span className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full font-medium bg-gray-100 text-gray-800">
                              {selectedLocation.type_category === 'luxury-car' && <Car size={14} />}
                              {selectedLocation.type_category === 'adventure-package' && <Mountain size={14} />}
                              {selectedLocation.type === 'office' && <Building2 size={14} />}
                              {selectedLocation.type || selectedLocation.package_type || 'Office'}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-gray-600">
                              <MapPin size={16} />
                              <span className="text-sm font-medium">
                                {selectedLocation.location || selectedLocation.destination || selectedLocation.city}
                              </span>
                            </div>

                            {(selectedLocation.price_per_day || selectedLocation.price) && (
                              <div className="flex items-center gap-3 text-gray-600">
                                <DollarSign size={16} />
                                <span className="text-sm font-semibold">{getServicePrice(selectedLocation)}</span>
                              </div>
                            )}

                            {selectedLocation.duration && (
                              <div className="flex items-center gap-3 text-gray-600">
                                <Clock size={16} />
                                <span className="text-sm font-medium">{selectedLocation.duration}</span>
                              </div>
                            )}
                          </div>

                          {selectedLocation.type === 'office' && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={12} />
                                <span className="font-medium">{selectedLocation.hours}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  )}
                </Map>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="absolute top-32 left-8 z-20">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-gray-200/50">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading 3D services...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute top-32 left-8 z-20">
              <div className="bg-red-50/90 backdrop-blur-xl border border-red-200/50 rounded-2xl p-4 max-w-md shadow-xl">
                <p className="text-red-700 text-sm mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-red-600 underline text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default EnhancedServicesMap;
