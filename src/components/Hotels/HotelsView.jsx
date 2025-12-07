import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Calendar, Users, Star, MapPin, Wifi, Car, Coffee,
  Dumbbell, Waves, Utensils, Check, Loader2, Filter,
  SlidersHorizontal, Heart, Building2, Bed, ChevronLeft, ChevronRight,
  ArrowLeft, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hotelService } from '../../services/hotelService';
import FavouriteButton from '../Favourites/FavouriteButton';
import HotelDetailInline from './HotelDetailInline';

// Popular hotels to show by default (instead of city cards)
const popularHotels = [
  {
    hotel: {
      hotelId: 'burj-al-arab',
      name: 'Burj Al Arab Jumeirah',
      address: 'Jumeirah Beach Road',
      city: 'Dubai',
      country: 'AE',
      starRating: 5,
      rating: 4.9,
      reviewCount: 2450,
      description: 'Iconic sail-shaped luxury hotel with opulent suites and world-class dining.',
      mainImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
      amenities: ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'parking'],
      minRate: 1500
    },
    rooms: [{ roomId: 'suite-1', roomName: 'Deluxe Suite', rates: [{ rateId: 'r1', totalRate: 1500, boardType: 'Breakfast', cancellation: { refundable: true } }] }],
    totalRate: 1500
  },
  {
    hotel: {
      hotelId: 'ritz-paris',
      name: 'Ritz Paris',
      address: '15 Place Vendôme',
      city: 'Paris',
      country: 'FR',
      starRating: 5,
      rating: 4.8,
      reviewCount: 1890,
      description: 'Legendary palace hotel in the heart of Paris with timeless elegance.',
      mainImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      amenities: ['wifi', 'spa', 'restaurant', 'gym', 'parking', 'pool'],
      minRate: 1200
    },
    rooms: [{ roomId: 'room-1', roomName: 'Superior Room', rates: [{ rateId: 'r2', totalRate: 1200, boardType: 'Room Only', cancellation: { refundable: true } }] }],
    totalRate: 1200
  },
  {
    hotel: {
      hotelId: 'claridges-london',
      name: "Claridge's",
      address: 'Brook Street, Mayfair',
      city: 'London',
      country: 'GB',
      starRating: 5,
      rating: 4.9,
      reviewCount: 1650,
      description: 'Art Deco masterpiece in Mayfair with impeccable British service.',
      mainImage: 'https://images.unsplash.com/photo-1566073771259-6a6d97dfc61d?w=800',
      amenities: ['wifi', 'spa', 'restaurant', 'gym', 'parking'],
      minRate: 950
    },
    rooms: [{ roomId: 'room-2', roomName: 'Deluxe Room', rates: [{ rateId: 'r3', totalRate: 950, boardType: 'Breakfast', cancellation: { refundable: true } }] }],
    totalRate: 950
  },
  {
    hotel: {
      hotelId: 'plaza-nyc',
      name: 'The Plaza',
      address: '768 5th Avenue',
      city: 'New York',
      country: 'US',
      starRating: 5,
      rating: 4.7,
      reviewCount: 3200,
      description: 'Iconic landmark overlooking Central Park with legendary service.',
      mainImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      amenities: ['wifi', 'spa', 'restaurant', 'gym', 'parking'],
      minRate: 895
    },
    rooms: [{ roomId: 'room-3', roomName: 'Plaza Room', rates: [{ rateId: 'r4', totalRate: 895, boardType: 'Room Only', cancellation: { refundable: true } }] }],
    totalRate: 895
  },
  {
    hotel: {
      hotelId: 'aman-tokyo',
      name: 'Aman Tokyo',
      address: 'Otemachi Tower',
      city: 'Tokyo',
      country: 'JP',
      starRating: 5,
      rating: 4.9,
      reviewCount: 980,
      description: 'Serene urban sanctuary blending Japanese traditions with modern luxury.',
      mainImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
      amenities: ['wifi', 'spa', 'restaurant', 'gym', 'pool'],
      minRate: 1100
    },
    rooms: [{ roomId: 'room-4', roomName: 'Deluxe Room', rates: [{ rateId: 'r5', totalRate: 1100, boardType: 'Breakfast', cancellation: { refundable: true } }] }],
    totalRate: 1100
  },
  {
    hotel: {
      hotelId: 'faena-miami',
      name: 'Faena Miami Beach',
      address: '3201 Collins Avenue',
      city: 'Miami',
      country: 'US',
      starRating: 5,
      rating: 4.8,
      reviewCount: 1420,
      description: 'Theatrical beachfront resort with bold design and vibrant nightlife.',
      mainImage: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800',
      amenities: ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'parking'],
      minRate: 750
    },
    rooms: [{ roomId: 'room-5', roomName: 'Ocean View', rates: [{ rateId: 'r6', totalRate: 750, boardType: 'Room Only', cancellation: { refundable: true } }] }],
    totalRate: 750
  },
  {
    hotel: {
      hotelId: 'hotel-de-paris',
      name: 'Hôtel de Paris Monte-Carlo',
      address: 'Place du Casino',
      city: 'Monaco',
      country: 'MC',
      starRating: 5,
      rating: 4.9,
      reviewCount: 1150,
      description: 'Belle Époque palace overlooking Casino Square with Michelin dining.',
      mainImage: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800',
      amenities: ['wifi', 'spa', 'restaurant', 'gym', 'pool', 'parking'],
      minRate: 1350
    },
    rooms: [{ roomId: 'room-6', roomName: 'Superior Room', rates: [{ rateId: 'r7', totalRate: 1350, boardType: 'Breakfast', cancellation: { refundable: true } }] }],
    totalRate: 1350
  },
  {
    hotel: {
      hotelId: 'marina-bay-sands',
      name: 'Marina Bay Sands',
      address: '10 Bayfront Avenue',
      city: 'Singapore',
      country: 'SG',
      starRating: 5,
      rating: 4.7,
      reviewCount: 5200,
      description: 'Architectural marvel with the world\'s largest rooftop infinity pool.',
      mainImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      amenities: ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'parking'],
      minRate: 550
    },
    rooms: [{ roomId: 'room-7', roomName: 'Deluxe Room', rates: [{ rateId: 'r8', totalRate: 550, boardType: 'Room Only', cancellation: { refundable: true } }] }],
    totalRate: 550
  }
];

// City code mapping
const CITY_CODES = {
  'dubai': 'DXB', 'paris': 'PAR', 'london': 'LON', 'new york': 'NYC',
  'tokyo': 'TYO', 'miami': 'MIA', 'los angeles': 'LAX', 'chicago': 'CHI',
  'san francisco': 'SFO', 'hong kong': 'HKG', 'singapore': 'SIN',
  'sydney': 'SYD', 'barcelona': 'BCN', 'rome': 'ROM', 'milan': 'MIL',
  'monaco': 'MCM', 'nice': 'NCE', 'zurich': 'ZRH', 'geneva': 'GVA',
  'amsterdam': 'AMS', 'berlin': 'BER', 'munich': 'MUC', 'vienna': 'VIE'
};

// Amenity icons mapping
const amenityIcons = {
  'wifi': Wifi, 'parking': Car, 'breakfast': Coffee,
  'gym': Dumbbell, 'pool': Waves, 'restaurant': Utensils,
  'spa': Waves, 'default': Check
};

const HotelsView = ({ onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // View state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'tabs'
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedHotelData, setSelectedHotelData] = useState(null); // For inline hotel detail

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  // Filter state
  const [maxPrice, setMaxPrice] = useState('');
  const [starRating, setStarRating] = useState([]);
  const [regionFilter, setRegionFilter] = useState('all');

  // Results state
  const [hotels, setHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const hotelsPerPage = 6;

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    setCheckInDate(tomorrow.toISOString().split('T')[0]);
    setCheckOutDate(dayAfter.toISOString().split('T')[0]);
  }, []);

  // Calculate nights
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  // Search hotels
  const handleSearch = async () => {
    const destination = selectedDestination?.city || searchQuery;
    if (!destination) {
      setSearchError('Please select a destination');
      return;
    }

    setIsLoading(true);
    setSearchError(null);
    setHotels([]);
    setHasSearched(true);
    setCurrentPage(1);

    try {
      const cityCode = selectedDestination?.cityCode ||
        CITY_CODES[destination.toLowerCase()] ||
        destination.substring(0, 3).toUpperCase();

      const { data, error } = await hotelService.searchHotels({
        cityCode,
        countryCode: selectedDestination?.countryCode,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults,
        children,
        currency: 'USD',
        starRating: starRating.length > 0 ? starRating : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        limit: 50
      });

      if (error) {
        // Return sample hotels for demo
        setHotels(generateSampleHotels(destination));
      } else {
        setHotels(data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setHotels(generateSampleHotels(searchQuery || 'City'));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sample hotels for demo
  const generateSampleHotels = (destination) => {
    const hotelNames = [
      'Grand Plaza Hotel', 'The Ritz Residence', 'Skyline Tower Hotel',
      'Ocean View Resort', 'Metropolitan Suites', 'Park Avenue Hotel',
      'Crown Imperial', 'The Landmark', 'Sapphire Grand', 'Elite Palace'
    ];

    return hotelNames.map((name, i) => ({
      hotel: {
        hotelId: `hotel-${i}`,
        name: `${name} ${destination}`,
        address: `${100 + i * 10} Main Street`,
        city: destination,
        country: selectedDestination?.countryCode || 'US',
        starRating: 3 + (i % 3),
        rating: 4.0 + (Math.random() * 0.9),
        reviewCount: 100 + Math.floor(Math.random() * 500),
        description: 'Experience luxury and comfort in the heart of the city.',
        images: [`https://images.unsplash.com/photo-${1566073771259 + i * 1000}-6a6d97dfc61d?w=800`],
        mainImage: `https://images.unsplash.com/photo-1566073771259-6a6d97dfc61d?w=800`,
        amenities: ['wifi', 'parking', 'breakfast', 'gym', 'pool', 'restaurant'],
        currency: 'USD',
        minRate: 150 + Math.floor(Math.random() * 300)
      },
      rooms: [
        {
          roomId: `room-${i}-1`,
          roomName: 'Deluxe Room',
          roomType: 'deluxe',
          maxOccupancy: 2,
          bedType: 'King',
          rates: [{
            rateId: `rate-${i}-1`,
            totalRate: 150 + Math.floor(Math.random() * 100),
            boardType: 'Room Only',
            cancellation: { refundable: true }
          }]
        }
      ],
      totalRate: 150 + Math.floor(Math.random() * 300),
      currency: 'USD'
    }));
  };

  // Handle hotel click - show inline detail instead of navigating away
  const handleHotelClick = (hotelResult) => {
    setSelectedHotelData({
      hotel: hotelResult.hotel,
      availableRooms: hotelResult.rooms,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults,
      children,
      roomCount: rooms
    });
  };

  // Handle back from hotel detail
  const handleBackFromDetail = () => {
    setSelectedHotelData(null);
  };

  // Filter hotels
  const filteredHotels = hotels.filter(h => {
    if (maxPrice && h.hotel.minRate > parseInt(maxPrice)) return false;
    if (starRating.length > 0 && !starRating.includes(h.hotel.starRating)) return false;
    return true;
  });

  // Paginated hotels
  const paginatedHotels = filteredHotels.slice(
    (currentPage - 1) * hotelsPerPage,
    currentPage * hotelsPerPage
  );

  const totalPages = Math.ceil(filteredHotels.length / hotelsPerPage);

  // Render stars
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  // Render amenity icon
  const getAmenityIcon = (amenity) => {
    const key = Object.keys(amenityIcons).find(k => amenity.toLowerCase().includes(k));
    const IconComponent = key ? amenityIcons[key] : amenityIcons.default;
    return <IconComponent size={12} />;
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDestination(null);
    setMaxPrice('');
    setStarRating([]);
    setRegionFilter('all');
  };

  // If hotel detail is selected, show inline detail view
  if (selectedHotelData) {
    return (
      <HotelDetailInline
        hotelData={selectedHotelData}
        onBack={handleBackFromDetail}
      />
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3">
        <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter">Hotels</h2>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Filter Toggle Button */}
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium transition-all backdrop-blur-xl border ${
              filtersVisible
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
            }`}
            style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
          >
            <SlidersHorizontal size={12} />
            <span>Filters</span>
          </button>

          {/* View Mode Switcher - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100/60 border border-gray-300/50 rounded-lg p-1 backdrop-blur-xl" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('tabs')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === 'tabs'
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tabs
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel - Glassmorphic */}
      {filtersVisible && (
        <div className="bg-gray-100/60 rounded-lg border border-gray-300/50 p-3 md:p-5 mb-4 md:mb-6 backdrop-blur-xl transition-all duration-300" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-4">
            {/* Destination */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Destination</label>
              <input
                type="text"
                placeholder="e.g. Dubai"
                value={selectedDestination?.city || searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedDestination(null);
                }}
                className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              />
            </div>

            {/* Check-in */}
            <div>
              <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Check-in</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              />
            </div>

            {/* Check-out */}
            <div>
              <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Check-out</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate || new Date().toISOString().split('T')[0]}
                className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Max Price</label>
              <input
                type="number"
                placeholder="$500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              />
            </div>

            {/* Search & Clear Buttons */}
            <div className="col-span-2 md:col-span-1 flex items-end gap-2">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span className="hidden md:inline">Search</span>
              </button>
              <button
                onClick={clearFilters}
                className="px-3 md:px-4 py-2 md:py-2.5 bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700 rounded-lg md:rounded-xl text-xs md:text-sm transition-all"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Star Rating Filter */}
          <div className="mt-3 pt-3 border-t border-gray-300/30">
            <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-2">Star Rating</label>
            <div className="flex gap-2">
              {[3, 4, 5].map((stars) => (
                <button
                  key={stars}
                  onClick={() => {
                    setStarRating(prev =>
                      prev.includes(stars) ? prev.filter(s => s !== stars) : [...prev, stars]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs ${
                    starRating.includes(stars)
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white/35 border-gray-300/50 hover:bg-white/40 text-gray-700'
                  }`}
                >
                  {stars} <Star size={12} className="fill-current" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popular Hotels - Show when no search yet */}
      {!hasSearched && !selectedHotelData && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Hotels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
            {popularHotels.map((hotelData) => {
              const hotel = hotelData.hotel;
              const lowestRate = hotel.minRate || hotelData.totalRate;

              return (
                <div
                  key={hotel.hotelId}
                  onClick={() => handleHotelClick(hotelData)}
                  className="bg-white/35 hover:bg-white/40 rounded-xl overflow-hidden hover:shadow-lg cursor-pointer border border-gray-300/50"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  {/* Mobile: Vertical stacked layout */}
                  <div className="md:hidden">
                    <div className="relative h-36 bg-white/10">
                      <img
                        src={hotel.mainImage}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <div className="bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 backdrop-blur-sm">
                          <Building2 size={10} className="text-gray-600" />
                          <span className="text-gray-800">{hotel.starRating}★</span>
                        </div>
                      </div>
                      <FavouriteButton
                        item={{
                          id: hotel.hotelId,
                          type: 'hotel',
                          name: hotel.name,
                          location: hotel.city,
                          image: hotel.mainImage,
                          category: 'Hotel',
                          price: `$${lowestRate}`,
                          metadata: { starRating: hotel.starRating, rating: hotel.rating, amenities: hotel.amenities }
                        }}
                        variant="floating"
                        size={16}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1">{hotel.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MapPin size={10} />
                        <span className="line-clamp-1">{hotel.city}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                          <span className="text-[10px] text-gray-500 block">From</span>
                          <span className="text-xs font-semibold text-gray-800">${lowestRate}</span>
                        </div>
                        <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                          <span className="text-[10px] text-gray-500 block">Rating</span>
                          <span className="text-xs font-semibold text-gray-800">{hotel.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                          <span className="text-[10px] text-gray-500 block">Reviews</span>
                          <span className="text-xs font-semibold text-gray-800">{hotel.reviewCount || 0}</span>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-gray-800 text-white rounded-lg text-xs font-medium">
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Desktop: Horizontal layout */}
                  <div className="hidden md:flex h-64">
                    <div className="w-2/5 bg-white/10 relative flex-shrink-0 rounded-l-xl overflow-hidden">
                      <img
                        src={hotel.mainImage}
                        alt={hotel.name}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                        <div className="flex space-x-1.5">
                          <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 backdrop-blur-sm">
                            <Building2 size={12} className="text-gray-600" />
                            <span className="text-gray-800">{hotel.starRating}★ Hotel</span>
                          </div>
                        </div>
                      </div>
                      <FavouriteButton
                        item={{
                          id: hotel.hotelId,
                          type: 'hotel',
                          name: hotel.name,
                          location: hotel.city,
                          image: hotel.mainImage,
                          category: 'Hotel',
                          price: `$${lowestRate}`,
                          metadata: { starRating: hotel.starRating, rating: hotel.rating, amenities: hotel.amenities }
                        }}
                        variant="floating"
                        size={18}
                      />
                    </div>
                    <div className="flex-1 p-5 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <img
                          src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.glb.png"
                          alt="PrivateCharterX"
                          className="h-6 w-auto object-contain"
                        />
                      </div>
                      <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2 overflow-hidden">{hotel.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                        <MapPin size={14} />
                        <span>{hotel.address}, {hotel.city}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(hotel.amenities || []).slice(0, 5).map((amenity, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 px-2 py-0.5 bg-gray-100/50 rounded text-[10px] text-gray-600 capitalize"
                          >
                            {getAmenityIcon(amenity)}
                            {amenity}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between mt-auto mb-3">
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">From</span>
                          <span className="text-sm font-semibold text-gray-800">${lowestRate}/night</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">Rating</span>
                          <div className="flex items-center gap-1">
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-gray-800">{hotel.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">Reviews</span>
                          <span className="text-sm font-semibold text-gray-800">{hotel.reviewCount || 0}</span>
                        </div>
                      </div>
                      <div className="flex space-x-4 pt-4 border-t border-gray-600/30 text-xs">
                        <span className="text-gray-600 hover:text-gray-800 cursor-pointer">Book now ↗</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-3">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-24 h-24"
            >
              <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
            </video>
            <div className="text-sm text-gray-600">Loading hotels...</div>
          </div>
        </div>
      )}

      {/* Search Results Count */}
      {hasSearched && !isLoading && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {filteredHotels.length} hotel{filteredHotels.length !== 1 ? 's' : ''} found
            {selectedDestination?.city || searchQuery ? ` in ${selectedDestination?.city || searchQuery}` : ''}
          </p>
          {checkInDate && checkOutDate && (
            <p className="text-xs text-gray-500">
              {calculateNights()} night{calculateNights() !== 1 ? 's' : ''} · {adults + children} guest{adults + children !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Grid View - Matching EmptyLegs Design */}
      {!isLoading && hasSearched && (viewMode === 'grid' || window.innerWidth < 768) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
            {paginatedHotels.map((hotelData) => {
              const hotel = hotelData.hotel;
              const lowestRate = hotel.minRate || hotelData.totalRate;

              return (
                <div
                  key={hotel.hotelId}
                  onClick={() => handleHotelClick(hotelData)}
                  className="bg-white/35 hover:bg-white/40 rounded-xl overflow-hidden hover:shadow-lg cursor-pointer border border-gray-300/50"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  {/* Mobile: Vertical stacked layout */}
                  <div className="md:hidden">
                    {/* Image on top */}
                    <div className="relative h-36 bg-white/10">
                      <img
                        src={hotel.mainImage || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a6d97dfc61d?w=800'}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <div className="bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 backdrop-blur-sm">
                          <Building2 size={10} className="text-gray-600" />
                          <span className="text-gray-800">{hotel.starRating}★</span>
                        </div>
                      </div>
                      <FavouriteButton
                        item={{
                          id: hotel.hotelId,
                          type: 'hotel',
                          name: hotel.name,
                          location: hotel.city,
                          image: hotel.mainImage || hotel.images?.[0],
                          category: 'Hotel',
                          price: `$${lowestRate}`,
                          metadata: {
                            starRating: hotel.starRating,
                            rating: hotel.rating,
                            amenities: hotel.amenities
                          }
                        }}
                        variant="floating"
                        size={16}
                      />
                    </div>
                    {/* Content below */}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1">{hotel.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MapPin size={10} />
                        <span className="line-clamp-1">{hotel.city}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                          <span className="text-[10px] text-gray-500 block">From</span>
                          <span className="text-xs font-semibold text-gray-800">${lowestRate}</span>
                        </div>
                        <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                          <span className="text-[10px] text-gray-500 block">Rating</span>
                          <span className="text-xs font-semibold text-gray-800">{hotel.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                          <span className="text-[10px] text-gray-500 block">Reviews</span>
                          <span className="text-xs font-semibold text-gray-800">{hotel.reviewCount || 0}</span>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-gray-800 text-white rounded-lg text-xs font-medium">
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Desktop: Horizontal layout - Matching EmptyLegs */}
                  <div className="hidden md:flex h-64">
                    <div className="w-2/5 bg-white/10 relative flex-shrink-0 rounded-l-xl overflow-hidden">
                      <img
                        src={hotel.mainImage || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a6d97dfc61d?w=800'}
                        alt={hotel.name}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                        <div className="flex space-x-1.5">
                          <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 backdrop-blur-sm">
                            <Building2 size={12} className="text-gray-600" />
                            <span className="text-gray-800">{hotel.starRating}★ Hotel</span>
                          </div>
                        </div>
                      </div>
                      <FavouriteButton
                        item={{
                          id: hotel.hotelId,
                          type: 'hotel',
                          name: hotel.name,
                          location: hotel.city,
                          image: hotel.mainImage || hotel.images?.[0],
                          category: 'Hotel',
                          price: `$${lowestRate}`,
                          metadata: {
                            starRating: hotel.starRating,
                            rating: hotel.rating,
                            amenities: hotel.amenities
                          }
                        }}
                        variant="floating"
                        size={18}
                      />
                    </div>
                    <div className="flex-1 p-5 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <img
                          src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.glb.png"
                          alt="PrivateCharterX"
                          className="h-6 w-auto object-contain"
                        />
                      </div>
                      <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2 overflow-hidden">{hotel.name}</h3>

                      {/* Location */}
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                        <MapPin size={14} />
                        <span>{hotel.address}, {hotel.city}</span>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(hotel.amenities || []).slice(0, 5).map((amenity, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 px-2 py-0.5 bg-gray-100/50 rounded text-[10px] text-gray-600 capitalize"
                          >
                            {getAmenityIcon(amenity)}
                            {amenity}
                          </span>
                        ))}
                      </div>

                      {/* Metrics */}
                      <div className="flex justify-between mt-auto mb-3">
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">From</span>
                          <span className="text-sm font-semibold text-gray-800">${lowestRate}/night</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">Rating</span>
                          <div className="flex items-center gap-1">
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-gray-800">{hotel.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">Reviews</span>
                          <span className="text-sm font-semibold text-gray-800">{hotel.reviewCount || 0}</span>
                        </div>
                      </div>

                      <div className="flex space-x-4 pt-4 border-t border-gray-600/30 text-xs">
                        <span className="text-gray-600 hover:text-gray-800 cursor-pointer">Book now ↗</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {filteredHotels.length > hotelsPerPage && (
            <div className="flex justify-center items-center mt-8 gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                Previous
              </button>

              {(() => {
                const pages = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push('...');
                  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                    if (!pages.includes(i)) pages.push(i);
                  }
                  if (currentPage < totalPages - 2) pages.push('...');
                  if (!pages.includes(totalPages)) pages.push(totalPages);
                }

                return pages.map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg text-sm transition-all ${
                        currentPage === page
                          ? 'bg-gray-800 text-white'
                          : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                      }`}
                      style={currentPage !== page ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                    >
                      {page}
                    </button>
                  )
                );
              })()}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {hasSearched && !isLoading && filteredHotels.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hotels found. Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default HotelsView;
