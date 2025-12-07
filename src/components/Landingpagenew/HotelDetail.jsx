import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import {
  Search, ShoppingBag, Settings, User, Shield, Building2, Clock, MapPin, Users,
  ExternalLink, Star, Wifi, Car, Coffee, Dumbbell, Waves, Utensils, ChevronLeft,
  Calendar, Bed, Check, X, Loader2, Phone, Globe, Heart, Share2, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { hotelService } from '../../services/hotelService';
import SuccessNotification from '../SuccessNotification';
import CryptoPaymentModal from '../Payment/CryptoPaymentModal';
import BuyWithCryptoButton from '../Payment/BuyWithCryptoButton';

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

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { user } = useAuth();

  // Hotel state
  const [hotel, setHotel] = useState(null);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [hotelReviews, setHotelReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking state
  const [activeTab, setActiveTab] = useState('details');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);

  // UI state
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Guest info
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    specialRequests: ''
  });

  useEffect(() => {
    fetchHotelBooking();
    setDefaultDates();
  }, [id]);

  useEffect(() => {
    if (user?.email) {
      setGuestInfo(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const setDefaultDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    setCheckInDate(tomorrow.toISOString().split('T')[0]);
    setCheckOutDate(dayAfter.toISOString().split('T')[0]);
  };

  const fetchHotelBooking = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from hotel_bookings table first (if viewing a booking)
      const { data: bookingData, error: bookingError } = await supabase
        .from('hotel_bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (!bookingError && bookingData) {
        // This is a booking detail view
        setHotel({
          hotelId: bookingData.hotel_id,
          name: bookingData.hotel_name,
          address: bookingData.hotel_address,
          city: bookingData.hotel_city,
          mainImage: bookingData.hotel_image,
          starRating: bookingData.hotel_star_rating || 4
        });
        setCheckInDate(bookingData.check_in_date);
        setCheckOutDate(bookingData.check_out_date);
        setAdults(bookingData.guests);
        setRooms(bookingData.room_count || 1);
        setSelectedRoom({ roomName: bookingData.room_type });
        setIsLoading(false);
        return;
      }

      // Otherwise try to get hotel details from the API
      const { data: hotelData, error: hotelError } = await hotelService.getHotelDetails(id);

      if (hotelError) {
        // Generate sample hotel for demo
        setHotel(generateSampleHotel(id));
      } else {
        setHotel(hotelData);
      }

      // Try to fetch reviews
      const { data: reviewsData } = await hotelService.getHotelReviews(id);
      setHotelReviews(reviewsData || []);

    } catch (err) {
      console.error('Error fetching hotel:', err);
      setHotel(generateSampleHotel(id));
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleHotel = (hotelId) => ({
    hotelId,
    name: 'Grand Palace Hotel',
    address: '100 Main Boulevard',
    city: 'Dubai',
    country: 'UAE',
    starRating: 5,
    rating: 4.8,
    reviewCount: 450,
    description: 'Experience ultimate luxury at Grand Palace Hotel, featuring world-class amenities, stunning views, and exceptional service.',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a6d97dfc61d?w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
    ],
    mainImage: 'https://images.unsplash.com/photo-1566073771259-6a6d97dfc61d?w=800',
    amenities: ['wifi', 'parking', 'breakfast', 'gym', 'pool', 'spa', 'restaurant', 'bar'],
    checkInTime: '15:00',
    checkOutTime: '11:00',
    rooms: [
      {
        roomId: 'deluxe-1',
        roomName: 'Deluxe Room',
        roomType: 'deluxe',
        maxOccupancy: 2,
        bedType: 'King',
        size: 35,
        sizeUnit: 'sqm',
        amenities: ['wifi', 'minibar', 'safe', 'air conditioning', 'room service'],
        rates: [
          { rateId: 'rate-1', rateName: 'Best Available', totalRate: 250, currency: 'USD', boardType: 'Room Only', cancellation: { refundable: true } },
          { rateId: 'rate-2', rateName: 'With Breakfast', totalRate: 295, currency: 'USD', boardType: 'Breakfast', cancellation: { refundable: true } }
        ]
      },
      {
        roomId: 'suite-1',
        roomName: 'Executive Suite',
        roomType: 'suite',
        maxOccupancy: 4,
        bedType: 'King + Sofa',
        size: 65,
        sizeUnit: 'sqm',
        amenities: ['wifi', 'minibar', 'safe', 'air conditioning', 'living room', 'balcony'],
        rates: [
          { rateId: 'rate-3', rateName: 'Suite Rate', totalRate: 450, currency: 'USD', boardType: 'Breakfast', cancellation: { refundable: true } }
        ]
      }
    ]
  });

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        className={`${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const renderAmenityIcon = (amenity) => {
    const normalized = amenity.toLowerCase();
    const IconComponent = Object.keys(amenityIcons).find(key => normalized.includes(key))
      ? amenityIcons[Object.keys(amenityIcons).find(key => normalized.includes(key))]
      : amenityIcons.default;
    return <IconComponent size={14} />;
  };

  const handleSelectRoom = (room, rate) => {
    setSelectedRoom(room);
    setSelectedRate(rate);
  };

  const handleBooking = async () => {
    if (!user) {
      setError('Please login to complete your booking');
      return;
    }

    setShowCryptoModal(true);
  };

  const nights = calculateNights();
  const totalPrice = selectedRate ? selectedRate.totalRate * nights * rooms : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 size={32} className="animate-spin text-gray-400 mb-3" />
          <p className="text-sm text-gray-500">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Hotel Not Found</h2>
          <p className="text-gray-500 mb-4">The hotel you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard?tab=hotels')}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Browse Hotels
          </button>
        </div>
      </div>
    );
  }

  const images = hotel.images || [hotel.mainImage];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard?tab=hotels')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back to Hotels</span>
          </button>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Heart size={20} className="text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={images[currentImageIndex] || hotel.mainImage}
                alt={hotel.name}
                className="w-full h-64 md:h-96 object-cover"
              />
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium">
                  {hotel.starRating} Star
                </span>
                {hotel.rating && (
                  <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium flex items-center gap-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    {hotel.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Hotel Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">{hotel.name}</h1>
              <div className="flex items-center gap-2 text-gray-500 mb-4">
                <MapPin size={16} />
                <span className="text-sm">{hotel.address}, {hotel.city}</span>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">{renderStars(hotel.starRating)}</div>
                {hotel.reviewCount && (
                  <span className="text-sm text-gray-500">({hotel.reviewCount} reviews)</span>
                )}
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(hotel.amenities || []).map((amenity, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-600"
                  >
                    {renderAmenityIcon(amenity)}
                    <span className="capitalize">{amenity}</span>
                  </span>
                ))}
              </div>

              {/* Description */}
              {hotel.description && (
                <p className="text-gray-600 text-sm leading-relaxed">{hotel.description}</p>
              )}

              {/* Check-in/out times */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6">
                <div>
                  <p className="text-xs text-gray-400">Check-in</p>
                  <p className="text-sm font-medium text-gray-900">{hotel.checkInTime || '15:00'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Check-out</p>
                  <p className="text-sm font-medium text-gray-900">{hotel.checkOutTime || '11:00'}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {['details', 'rooms', 'reviews'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <h3 className="font-medium text-gray-900">About this hotel</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {hotel.description || hotel.fullDescription || 'Experience luxury and comfort at this exceptional hotel, featuring world-class amenities and outstanding service.'}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Location</p>
                    <p className="text-sm text-gray-900">{hotel.city}, {hotel.country}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Category</p>
                    <p className="text-sm text-gray-900">{hotel.starRating} Star Hotel</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rooms' && (
              <div className="space-y-4">
                {(hotel.rooms || []).map(room => (
                  <div key={room.roomId} className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{room.roomName}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            Up to {room.maxOccupancy} guests
                          </span>
                          {room.bedType && (
                            <span className="flex items-center gap-1">
                              <Bed size={14} />
                              {room.bedType}
                            </span>
                          )}
                          {room.size && (
                            <span>{room.size} {room.sizeUnit}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Room amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(room.amenities || []).slice(0, 6).map((amenity, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600 capitalize">
                          {amenity}
                        </span>
                      ))}
                    </div>

                    {/* Rate options */}
                    <div className="space-y-2">
                      {room.rates.map(rate => (
                        <div
                          key={rate.rateId}
                          onClick={() => handleSelectRoom(room, rate)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedRate?.rateId === rate.rateId
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedRate?.rateId === rate.rateId ? 'border-gray-900' : 'border-gray-300'
                            }`}>
                              {selectedRate?.rateId === rate.rateId && (
                                <div className="w-3 h-3 bg-gray-900 rounded-full" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{rate.rateName}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Coffee size={12} />
                                  {rate.boardType}
                                </span>
                                {rate.cancellation?.refundable && (
                                  <span className="text-green-600">Free cancellation</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${rate.totalRate}</p>
                            <p className="text-xs text-gray-500">per night</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                {hotelReviews.length > 0 ? (
                  <div className="space-y-4">
                    {hotelReviews.map((review, idx) => (
                      <div key={idx} className="pb-4 border-b border-gray-100 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{review.author}</span>
                          <div className="flex items-center gap-1">
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Book Your Stay</h3>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Check-in</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Check-out</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Guests</label>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-sm">{adults} Adult{adults > 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setAdults(Math.min(10, adults + 1))}
                    className="px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Rooms */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rooms</label>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setRooms(Math.max(1, rooms - 1))}
                    className="px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-sm">{rooms} Room{rooms > 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setRooms(Math.min(5, rooms + 1))}
                    className="px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Selected Room Summary */}
              {selectedRate && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{selectedRoom?.roomName}</span>
                    <span className="text-gray-900">${selectedRate.totalRate}/night</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{nights} night{nights > 1 ? 's' : ''} × {rooms} room{rooms > 1 ? 's' : ''}</span>
                    <span className="text-gray-900">${totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200 font-medium">
                    <span>Total</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
              )}

              {/* Book Button */}
              {selectedRate ? (
                <BuyWithCryptoButton
                  serviceType="hotel_booking"
                  serviceTitle={`${hotel.name} - ${selectedRoom?.roomName}`}
                  serviceDescription={`${nights} nights, ${checkInDate} to ${checkOutDate}`}
                  price={totalPrice}
                  currency="USD"
                  imageUrl={hotel.mainImage}
                  className="w-full"
                  size="large"
                  onSuccess={(result) => {
                    setShowSuccess(true);
                    setTimeout(() => navigate('/dashboard?tab=bookings'), 2000);
                  }}
                />
              ) : (
                <button
                  disabled
                  className="w-full py-3 bg-gray-200 text-gray-500 font-medium rounded-xl cursor-not-allowed"
                >
                  Select a Room
                </button>
              )}

              {/* Help text */}
              <div className="text-center text-xs text-gray-400 space-y-1">
                <p>✓ Free cancellation available</p>
                <p>✓ Instant confirmation</p>
                <p>✓ 24/7 support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <SuccessNotification
          title="Booking Confirmed!"
          message={`Your booking at ${hotel.name} has been confirmed.`}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
};

export default HotelDetail;
