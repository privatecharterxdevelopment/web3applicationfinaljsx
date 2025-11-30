import React, { useState } from 'react';
import { Star, MapPin, Clock, Phone, ExternalLink, Calendar, Users, X } from 'lucide-react';

/**
 * Restaurant Card Component
 * Displays restaurant info from Google Places with reservation functionality
 */

// Star Rating Component
const StarRating = ({ rating, totalRatings }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={`${
              i < fullStars
                ? 'text-yellow-400 fill-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-gray-900">{rating?.toFixed(1)}</span>
      {totalRatings && (
        <span className="text-xs text-gray-500">({totalRatings.toLocaleString()})</span>
      )}
    </div>
  );
};

// Reservation Modal Component
const ReservationModal = ({ restaurant, onClose, onConfirm }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!date || !time) {
      alert('Please select date and time');
      return;
    }
    onConfirm({
      restaurant,
      date,
      time,
      guests,
      notes
    });
  };

  // Generate time slots
  const timeSlots = [];
  for (let h = 12; h <= 22; h++) {
    timeSlots.push(`${h}:00`);
    timeSlots.push(`${h}:30`);
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden">
        {/* Header with Image */}
        <div className="relative h-40">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-xl font-bold text-white">{restaurant.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">{restaurant.cuisineIcon}</span>
              <StarRating rating={restaurant.rating} />
              <span className="text-white/80 text-sm">{restaurant.priceLevelText}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Date
            </label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={14} className="inline mr-1" />
              Time
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all"
            >
              <option value="">Select time...</option>
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users size={14} className="inline mr-1" />
              Number of Guests
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                -
              </button>
              <span className="text-lg font-semibold w-8 text-center">{guests}</span>
              <button
                onClick={() => setGuests(Math.min(20, guests + 1))}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Window seat, celebration, dietary requirements..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
            >
              Add to Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Restaurant Card Component
const RestaurantCard = ({ restaurant, onReserve, compact = false }) => {
  const [showReservation, setShowReservation] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleReservationConfirm = (reservationData) => {
    setShowReservation(false);
    if (onReserve) {
      onReserve(reservationData);
    }
  };

  const fallbackImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';

  if (compact) {
    // Compact version for inline display
    return (
      <>
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 cursor-pointer group">
          <img
            src={imageError ? fallbackImage : restaurant.image}
            alt={restaurant.name}
            onError={() => setImageError(true)}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{restaurant.cuisineIcon}</span>
              <h4 className="font-semibold text-gray-900 truncate">{restaurant.name}</h4>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={restaurant.rating} />
              <span className="text-sm text-gray-500">{restaurant.priceLevelText}</span>
            </div>
          </div>
          <button
            onClick={() => setShowReservation(true)}
            className="flex-shrink-0 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Reserve
          </button>
        </div>

        {showReservation && (
          <ReservationModal
            restaurant={restaurant}
            onClose={() => setShowReservation(false)}
            onConfirm={handleReservationConfirm}
          />
        )}
      </>
    );
  }

  // Full card version
  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={imageError ? fallbackImage : restaurant.image}
            alt={restaurant.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Price badge */}
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium">
            {restaurant.priceLevelText}
          </div>

          {/* Open/Closed badge */}
          {restaurant.isOpen !== undefined && (
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium ${
              restaurant.isOpen
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {restaurant.isOpen ? 'Open Now' : 'Closed'}
            </div>
          )}

          {/* Cuisine Icon */}
          <div className="absolute bottom-3 left-3 w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-lg">
            {restaurant.cuisineIcon}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
            {restaurant.name}
          </h3>

          <StarRating rating={restaurant.rating} totalRatings={restaurant.totalRatings} />

          {/* Description */}
          {restaurant.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {restaurant.description}
            </p>
          )}

          <div className="flex items-start gap-1.5 mt-2 text-gray-500">
            <MapPin size={14} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs line-clamp-1">{restaurant.address}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowReservation(true)}
              className="flex-1 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Request Reservation
            </button>
            {restaurant.url && (
              <a
                href={restaurant.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={18} className="text-gray-600" />
              </a>
            )}
          </div>
        </div>
      </div>

      {showReservation && (
        <ReservationModal
          restaurant={restaurant}
          onClose={() => setShowReservation(false)}
          onConfirm={handleReservationConfirm}
        />
      )}
    </>
  );
};

// Restaurant Results Grid Component
export const RestaurantResults = ({ restaurants, location, onReserve, loading = false }) => {
  if (loading) {
    return (
      <div className="w-full my-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurants || restaurants.length === 0) {
    return null;
  }

  return (
    <div className="w-full my-4 animate-fade-in">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <h3 className="font-semibold text-gray-900">
              Restaurants near {location}
            </h3>
          </div>
          <span className="text-sm text-gray-500">
            {restaurants.length} found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restaurants.map(restaurant => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onReserve={onReserve}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
