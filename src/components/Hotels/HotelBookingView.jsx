import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Calendar, Users, Star, MapPin, Wifi, Car, Coffee,
  Dumbbell, Waves, Utensils, X, ChevronLeft, ChevronRight,
  Building2, Bed, Check, AlertCircle, Loader2, Filter,
  SlidersHorizontal, Heart, Share2, Phone, Mail, Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hotelService } from '../../services/hotelService';
import BuyWithCryptoButton from '../Payment/BuyWithCryptoButton';

// Popular destinations for quick search
const popularDestinations = [
  { city: 'Dubai', countryCode: 'AE', cityCode: 'DXB', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400' },
  { city: 'Paris', countryCode: 'FR', cityCode: 'PAR', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' },
  { city: 'London', countryCode: 'GB', cityCode: 'LON', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400' },
  { city: 'New York', countryCode: 'US', cityCode: 'NYC', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400' },
  { city: 'Tokyo', countryCode: 'JP', cityCode: 'TYO', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400' },
  { city: 'Miami', countryCode: 'US', cityCode: 'MIA', image: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=400' },
];

// Amenity icons mapping
const amenityIcons = {
  'wifi': Wifi,
  'parking': Car,
  'breakfast': Coffee,
  'gym': Dumbbell,
  'pool': Waves,
  'restaurant': Utensils,
  'spa': Waves,
  'default': Check
};

const HotelBookingView = ({ onBack }) => {
  const { user, isAuthenticated } = useAuth();

  // View state
  const [currentView, setCurrentView] = useState('search'); // 'search' | 'results' | 'details' | 'booking' | 'confirmation'

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  // Filter state
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [starRating, setStarRating] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Results state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Selected hotel state
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [hotelReviews, setHotelReviews] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Booking state
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    specialRequests: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('crypto');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

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

  // Prefill user email
  useEffect(() => {
    if (user?.email) {
      setGuestInfo(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  // Calculate nights
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Search hotels
  const handleSearch = async () => {
    if (!selectedDestination && !searchQuery) {
      setSearchError('Please select a destination');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const { data, error } = await hotelService.searchHotels({
        cityCode: selectedDestination?.cityCode,
        countryCode: selectedDestination?.countryCode,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults,
        children,
        currency: 'USD',
        starRating: starRating.length > 0 ? starRating : undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
        limit: 50
      });

      if (error) {
        // For demo, show sample hotels if API fails
        setSearchResults(generateSampleHotels(selectedDestination || { city: searchQuery }));
      } else {
        setSearchResults(data || []);
      }

      setCurrentView('results');
    } catch (err) {
      console.error('Search error:', err);
      // Show sample data for demo
      setSearchResults(generateSampleHotels(selectedDestination || { city: searchQuery }));
      setCurrentView('results');
    } finally {
      setIsSearching(false);
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
        name: `${name} ${destination?.city || 'City'}`,
        address: `${100 + i * 10} Main Street`,
        city: destination?.city || 'City',
        country: destination?.countryCode || 'US',
        countryCode: destination?.countryCode || 'US',
        latitude: 0,
        longitude: 0,
        starRating: 3 + (i % 3),
        rating: 4.0 + (Math.random() * 0.9),
        reviewCount: 100 + Math.floor(Math.random() * 500),
        description: 'Experience luxury and comfort in the heart of the city.',
        images: [
          `https://images.unsplash.com/photo-${1566073771259 + i * 1000}-6a6d97dfc61d?w=800`,
          `https://images.unsplash.com/photo-${1582719508461 + i * 1000}-905c673771fd?w=800`
        ],
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
          size: 35,
          sizeUnit: 'sqm',
          amenities: ['wifi', 'minibar', 'safe', 'air conditioning'],
          rates: [
            {
              rateId: `rate-${i}-1`,
              rateName: 'Best Available Rate',
              totalRate: 150 + Math.floor(Math.random() * 100),
              currency: 'USD',
              boardType: 'Room Only',
              cancellation: { refundable: true, cancelPolicyInfos: [] },
              roomType: 'deluxe',
              maxOccupancy: 2
            },
            {
              rateId: `rate-${i}-2`,
              rateName: 'With Breakfast',
              totalRate: 180 + Math.floor(Math.random() * 100),
              currency: 'USD',
              boardType: 'Breakfast',
              cancellation: { refundable: true, cancelPolicyInfos: [] },
              roomType: 'deluxe',
              maxOccupancy: 2
            }
          ]
        },
        {
          roomId: `room-${i}-2`,
          roomName: 'Executive Suite',
          roomType: 'suite',
          maxOccupancy: 4,
          bedType: 'King + Sofa',
          size: 55,
          sizeUnit: 'sqm',
          amenities: ['wifi', 'minibar', 'safe', 'air conditioning', 'living room'],
          rates: [
            {
              rateId: `rate-${i}-3`,
              rateName: 'Suite Rate',
              totalRate: 300 + Math.floor(Math.random() * 150),
              currency: 'USD',
              boardType: 'Breakfast',
              cancellation: { refundable: true, cancelPolicyInfos: [] },
              roomType: 'suite',
              maxOccupancy: 4
            }
          ]
        }
      ],
      totalRate: 150 + Math.floor(Math.random() * 300),
      currency: 'USD'
    }));
  };

  // View hotel details
  const handleViewHotel = async (hotelResult) => {
    setSelectedHotel(hotelResult);
    setSelectedRoom(null);
    setSelectedRate(null);
    setCurrentView('details');
    setIsLoadingDetails(true);

    try {
      // Try to get more details from API
      const [detailsRes, reviewsRes] = await Promise.all([
        hotelService.getHotelDetails(hotelResult.hotel.hotelId),
        hotelService.getHotelReviews(hotelResult.hotel.hotelId)
      ]);

      if (detailsRes.data) {
        setHotelDetails(detailsRes.data);
      }
      if (reviewsRes.data) {
        setHotelReviews(reviewsRes.data);
      }
    } catch (err) {
      console.error('Error loading hotel details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Select room and proceed to booking
  const handleSelectRoom = (room, rate) => {
    setSelectedRoom(room);
    setSelectedRate(rate);
    setCurrentView('booking');
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (!isAuthenticated) {
      setBookingError('Please login to complete your booking');
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      const nights = calculateNights();
      const totalPrice = (selectedRate?.totalRate || 0) * nights * rooms;

      const bookingData = {
        selectedHotel: selectedHotel?.hotel,
        selectedRoom,
        selectedRate,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        adults,
        children,
        rooms,
        guestInfo,
        totalPrice,
        currency: 'USD',
        paymentMethod,
        destination: selectedDestination?.city || searchQuery,
        destinationType: 'city'
      };

      const { data, error } = await hotelService.createHotelBooking(bookingData);

      if (error) {
        setBookingError(typeof error === 'string' ? error : 'Failed to create booking');
        return;
      }

      setBookingConfirmation(data);
      setCurrentView('confirmation');
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError('An error occurred while processing your booking');
    } finally {
      setIsBooking(false);
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  // Render amenity icon
  const renderAmenityIcon = (amenity) => {
    const normalizedAmenity = amenity.toLowerCase();
    const IconComponent = Object.keys(amenityIcons).find(key => normalizedAmenity.includes(key))
      ? amenityIcons[Object.keys(amenityIcons).find(key => normalizedAmenity.includes(key))]
      : amenityIcons.default;
    return <IconComponent className="w-4 h-4" />;
  };

  // Search View
  const renderSearchView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Find Your Perfect Stay</h1>
        <p className="text-gray-500">Search hotels worldwide with exclusive rates</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={selectedDestination?.city || searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedDestination(null);
              }}
              placeholder="City, airport, or hotel name"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate || new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Guests & Rooms */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adults</label>
            <div className="flex items-center border border-gray-200 rounded-xl">
              <button
                onClick={() => setAdults(Math.max(1, adults - 1))}
                className="px-3 py-3 hover:bg-gray-50 rounded-l-xl transition-colors"
              >
                -
              </button>
              <span className="flex-1 text-center font-medium">{adults}</span>
              <button
                onClick={() => setAdults(Math.min(10, adults + 1))}
                className="px-3 py-3 hover:bg-gray-50 rounded-r-xl transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Children</label>
            <div className="flex items-center border border-gray-200 rounded-xl">
              <button
                onClick={() => setChildren(Math.max(0, children - 1))}
                className="px-3 py-3 hover:bg-gray-50 rounded-l-xl transition-colors"
              >
                -
              </button>
              <span className="flex-1 text-center font-medium">{children}</span>
              <button
                onClick={() => setChildren(Math.min(6, children + 1))}
                className="px-3 py-3 hover:bg-gray-50 rounded-r-xl transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rooms</label>
            <div className="flex items-center border border-gray-200 rounded-xl">
              <button
                onClick={() => setRooms(Math.max(1, rooms - 1))}
                className="px-3 py-3 hover:bg-gray-50 rounded-l-xl transition-colors"
              >
                -
              </button>
              <span className="flex-1 text-center font-medium">{rooms}</span>
              <button
                onClick={() => setRooms(Math.min(5, rooms + 1))}
                className="px-3 py-3 hover:bg-gray-50 rounded-r-xl transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full py-3.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search Hotels
            </>
          )}
        </button>

        {searchError && (
          <p className="text-red-500 text-sm text-center">{searchError}</p>
        )}
      </div>

      {/* Popular Destinations */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Popular Destinations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {popularDestinations.map((dest) => (
            <button
              key={dest.cityCode}
              onClick={() => {
                setSelectedDestination(dest);
                setSearchQuery(dest.city);
              }}
              className={`relative overflow-hidden rounded-xl aspect-[4/3] group transition-all ${
                selectedDestination?.cityCode === dest.cityCode
                  ? 'ring-2 ring-black'
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
              <img
                src={dest.image}
                alt={dest.city}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <p className="font-semibold">{dest.city}</p>
                <p className="text-xs text-white/80">{dest.countryCode}</p>
              </div>
              {selectedDestination?.cityCode === dest.cityCode && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Results View
  const renderResultsView = () => (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('search')}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Search</span>
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Search Summary */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{selectedDestination?.city || searchQuery}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{checkInDate} - {checkOutDate}</span>
            <span className="text-gray-400">({calculateNights()} nights)</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{adults} adults{children > 0 ? `, ${children} children` : ''}</span>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Star Rating</label>
            <div className="flex gap-2">
              {[3, 4, 5].map((stars) => (
                <button
                  key={stars}
                  onClick={() => {
                    setStarRating(prev =>
                      prev.includes(stars) ? prev.filter(s => s !== stars) : [...prev, stars]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                    starRating.includes(stars)
                      ? 'bg-black text-white border-black'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {stars} <Star className="w-3 h-3 fill-current" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range: ${priceRange[0]} - ${priceRange[1]}+
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-gray-500">
        {searchResults.length} hotels found
      </p>

      {/* Hotel Cards */}
      <div className="space-y-4">
        {searchResults.map((result) => (
          <div
            key={result.hotel.hotelId}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="md:w-72 h-48 md:h-auto relative">
                <img
                  src={result.hotel.mainImage || result.hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a6d97dfc61d?w=800'}
                  alt={result.hotel.name}
                  className="w-full h-full object-cover"
                />
                <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors">
                  <Heart className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{result.hotel.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">{renderStars(result.hotel.starRating)}</div>
                      {result.hotel.rating && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-medium">
                          {result.hotel.rating.toFixed(1)}
                        </span>
                      )}
                      {result.hotel.reviewCount && (
                        <span className="text-sm text-gray-500">
                          ({result.hotel.reviewCount} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{result.hotel.address}, {result.hotel.city}</span>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(result.hotel.amenities || []).slice(0, 5).map((amenity, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600"
                    >
                      {renderAmenityIcon(amenity)}
                      <span className="capitalize">{amenity}</span>
                    </span>
                  ))}
                </div>

                {/* Price and CTA */}
                <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${result.totalRate || result.hotel.minRate}
                      <span className="text-sm font-normal text-gray-500">/night</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewHotel(result)}
                    className="px-6 py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    View Rooms
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {searchResults.length === 0 && !isSearching && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hotels found. Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );

  // Hotel Details View
  const renderDetailsView = () => {
    const hotel = hotelDetails || selectedHotel?.hotel;
    const rooms = selectedHotel?.rooms || [];
    const nights = calculateNights();

    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <button
          onClick={() => setCurrentView('results')}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Results</span>
        </button>

        {/* Hotel Header */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Image Gallery */}
          <div className="relative h-64 md:h-80">
            <img
              src={hotel?.mainImage || hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a6d97dfc61d?w=800'}
              alt={hotel?.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div className="bg-white/95 backdrop-blur rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(hotel?.starRating)}</div>
                  {hotel?.rating && (
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-semibold">
                      {hotel.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 bg-white/95 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white transition-colors">
                  <Heart className="w-5 h-5 text-gray-600" />
                </button>
                <button className="w-10 h-10 bg-white/95 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Hotel Info */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{hotel?.name}</h1>
            <div className="flex items-center gap-1 text-gray-500 mb-4">
              <MapPin className="w-4 h-4" />
              <span>{hotel?.address}, {hotel?.city}, {hotel?.country}</span>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-3 mb-4">
              {(hotel?.amenities || []).map((amenity, i) => (
                <span
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-600"
                >
                  {renderAmenityIcon(amenity)}
                  <span className="capitalize">{amenity}</span>
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-gray-600">{hotel?.description || hotelDetails?.fullDescription}</p>
          </div>
        </div>

        {/* Room Selection */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Room</h2>
          <div className="space-y-4">
            {rooms.map((room) => (
              <div key={room.roomId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{room.roomName}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Up to {room.maxOccupancy} guests
                        </span>
                        {room.bedType && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            {room.bedType}
                          </span>
                        )}
                        {room.size && (
                          <span>{room.size} {room.sizeUnit}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Room Amenities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(room.amenities || []).slice(0, 6).map((amenity, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600 capitalize"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>

                  {/* Rate Options */}
                  <div className="space-y-2">
                    {room.rates.map((rate) => (
                      <div
                        key={rate.rateId}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedRate?.rateId === rate.rateId
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSelectRoom(room, rate)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedRate?.rateId === rate.rateId
                              ? 'border-black'
                              : 'border-gray-300'
                          }`}>
                            {selectedRate?.rateId === rate.rateId && (
                              <div className="w-3 h-3 bg-black rounded-full" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{rate.rateName}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Coffee className="w-3 h-3" />
                                {rate.boardType}
                              </span>
                              {rate.cancellation?.refundable && (
                                <span className="text-green-600">Free cancellation</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${rate.totalRate}</p>
                          <p className="text-xs text-gray-500">per night</p>
                          <p className="text-sm font-medium text-gray-700">
                            ${rate.totalRate * nights} total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        {hotelReviews.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Guest Reviews</h2>
            <div className="space-y-4">
              {hotelReviews.slice(0, 5).map((review) => (
                <div key={review.reviewId} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{review.author}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(review.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sticky Book Button */}
        {selectedRate && (
          <div className="sticky bottom-4 bg-white rounded-xl border border-gray-200 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{nights} nights, {rooms} room{rooms > 1 ? 's' : ''}</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${selectedRate.totalRate * nights * rooms}
                  <span className="text-sm font-normal text-gray-500"> total</span>
                </p>
              </div>
              <button
                onClick={() => setCurrentView('booking')}
                className="px-8 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                Continue to Book
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Booking View
  const renderBookingView = () => {
    const hotel = selectedHotel?.hotel;
    const nights = calculateNights();
    const totalPrice = (selectedRate?.totalRate || 0) * nights * rooms;

    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <button
          onClick={() => setCurrentView('details')}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Hotel</span>
        </button>

        <h1 className="text-2xl font-semibold text-gray-900">Complete Your Booking</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Guest Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={guestInfo.firstName}
                    onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={guestInfo.lastName}
                    onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                  <textarea
                    value={guestInfo.specialRequests}
                    onChange={(e) => setGuestInfo({ ...guestInfo, specialRequests: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors resize-none"
                    placeholder="Any special requests or preferences..."
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'crypto', label: 'Pay with Cryptocurrency', desc: 'BTC, ETH, USDT, USDC' },
                  { id: 'card', label: 'Credit/Debit Card', desc: 'Visa, Mastercard, Amex' },
                  { id: 'bank', label: 'Bank Transfer', desc: 'Wire transfer' }
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === method.id
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-black"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {bookingError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{bookingError}</p>
              </div>
            )}

            {/* Book Button */}
            <div className="flex gap-4">
              {paymentMethod === 'crypto' ? (
                <BuyWithCryptoButton
                  serviceType="hotel_booking"
                  serviceTitle={`${hotel?.name} - ${selectedRoom?.roomName}`}
                  serviceDescription={`${nights} nights, ${checkInDate} to ${checkOutDate}`}
                  price={totalPrice}
                  currency="USD"
                  imageUrl={hotel?.mainImage}
                  className="flex-1"
                  size="large"
                  onSuccess={(result) => {
                    setBookingConfirmation({ paymentResult: result });
                    setCurrentView('confirmation');
                  }}
                />
              ) : (
                <button
                  onClick={handleBooking}
                  disabled={isBooking || !guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phone}
                  className="flex-1 py-3.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Confirm Booking - $${totalPrice.toLocaleString()}`
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>

              {/* Hotel Info */}
              <div className="flex gap-3 mb-4 pb-4 border-b border-gray-100">
                <img
                  src={hotel?.mainImage || hotel?.images?.[0]}
                  alt={hotel?.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{hotel?.name}</h3>
                  <div className="flex">{renderStars(hotel?.starRating)}</div>
                  <p className="text-sm text-gray-500">{hotel?.city}</p>
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Check-in</span>
                  <span className="font-medium">{new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Check-out</span>
                  <span className="font-medium">{new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">{nights} night{nights > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Guests</span>
                  <span className="font-medium">{adults + children} guest{adults + children > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Room</span>
                  <span className="font-medium">{selectedRoom?.roomName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rate</span>
                  <span className="font-medium">{selectedRate?.boardType}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">${selectedRate?.totalRate} x {nights} nights</span>
                  <span>${(selectedRate?.totalRate || 0) * nights}</span>
                </div>
                {rooms > 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">x {rooms} rooms</span>
                    <span>${totalPrice}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxes & fees</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-100">
                  <span>Total</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Cancellation Policy */}
              {selectedRate?.cancellation?.refundable && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Free cancellation available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Confirmation View
  const renderConfirmationView = () => {
    const hotel = selectedHotel?.hotel;
    const nights = calculateNights();

    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-green-600" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500">Your reservation has been successfully submitted.</p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-left">
          <div className="flex gap-4 mb-4 pb-4 border-b border-gray-100">
            <img
              src={hotel?.mainImage || hotel?.images?.[0]}
              alt={hotel?.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{hotel?.name}</h3>
              <div className="flex">{renderStars(hotel?.starRating)}</div>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {hotel?.city}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Check-in</p>
              <p className="font-medium">{new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-gray-500">Check-out</p>
              <p className="font-medium">{new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-gray-500">Guest</p>
              <p className="font-medium">{guestInfo.firstName} {guestInfo.lastName}</p>
            </div>
            <div>
              <p className="text-gray-500">Room</p>
              <p className="font-medium">{selectedRoom?.roomName}</p>
            </div>
          </div>

          {bookingConfirmation?.id && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Confirmation Number</p>
              <p className="font-mono font-semibold text-lg">{bookingConfirmation.id.slice(0, 8).toUpperCase()}</p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-gray-50 rounded-xl p-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>A confirmation email has been sent to {guestInfo.email}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Present this confirmation at check-in</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>You can view your booking in "My Bookings"</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setCurrentView('search');
              setSelectedHotel(null);
              setSelectedRoom(null);
              setSelectedRate(null);
              setBookingConfirmation(null);
            }}
            className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Book Another Hotel
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {currentView === 'search' && renderSearchView()}
        {currentView === 'results' && renderResultsView()}
        {currentView === 'details' && renderDetailsView()}
        {currentView === 'booking' && renderBookingView()}
        {currentView === 'confirmation' && renderConfirmationView()}
      </div>
    </div>
  );
};

export default HotelBookingView;
