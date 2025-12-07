import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Mountain,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  MessageSquare,
  DollarSign,
  Plane,
  Check
} from 'lucide-react';

/**
 * AdventureCard - Displays adventure packages from fixed_offers table
 * Shows image, destination, duration, price, and booking options
 * Monochromatic, glassmorphic design matching PlaceCard and HotelCard
 */
const AdventureCard = ({ adventure, onAddToCart, onRequestBooking }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [guests, setGuests] = useState(2);

  if (!adventure) return null;

  const {
    id,
    title,
    name,
    destination,
    origin,
    description,
    price,
    price_on_request,
    duration,
    difficulty_level,
    package_type,
    image_url,
    includes = [],
    highlights = [],
    start_date,
    end_date,
    max_participants,
    min_participants
  } = adventure;

  const displayTitle = title || name || 'Adventure Package';
  const displayPrice = price_on_request ? 'On Request' : price ? `€${price.toLocaleString()}` : 'Contact Us';
  const displayImage = image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

  // Parse includes if it's a string
  const includesList = typeof includes === 'string'
    ? includes.split(',').map(i => i.trim())
    : Array.isArray(includes) ? includes : [];

  // Parse highlights if it's a string
  const highlightsList = typeof highlights === 'string'
    ? highlights.split(',').map(h => h.trim())
    : Array.isArray(highlights) ? highlights : [];

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({
        type: 'adventure',
        item: adventure,
        selectedDate,
        guests,
        totalPrice: price * guests
      });
    }
  };

  const handleRequestBooking = () => {
    if (onRequestBooking) {
      onRequestBooking({
        type: 'adventure',
        item: adventure,
        selectedDate,
        guests
      });
    }
  };

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all hover:shadow-md"
      style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: '360px' }}
    >
      {/* Photo Section */}
      {!imageError && (
        <div className="relative h-44 bg-gray-50">
          <img
            src={displayImage}
            alt={displayTitle}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {/* Package type badge */}
          {package_type && (
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2.5 py-1 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-medium rounded-full flex items-center gap-1">
                <Mountain size={10} />
                {package_type}
              </span>
            </div>
          )}
          {/* Price badge */}
          <div className="absolute top-2.5 right-2.5">
            <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full">
              {displayPrice}
            </span>
          </div>
          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium rounded-full flex items-center gap-1">
                <Clock size={9} />
                {duration}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-4">
        {/* Title and Location */}
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{displayTitle}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            {destination && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={11} className="text-gray-400" />
                <span>{destination}</span>
              </div>
            )}
            {origin && destination && origin !== destination && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Plane size={10} />
                <span>from {origin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
          {difficulty_level && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-[10px] text-gray-600">
              <span className="font-medium">{difficulty_level}</span>
            </div>
          )}
          {max_participants && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-[10px] text-gray-600">
              <Users size={10} />
              <span>Max {max_participants}</span>
            </div>
          )}
          {start_date && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-[10px] text-gray-600">
              <Calendar size={10} />
              <span>{new Date(start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Expandable Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-xs text-gray-500 hover:text-gray-700 transition-colors mb-3"
        >
          <span className="font-medium">{showDetails ? 'Hide details' : 'View details'}</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="space-y-3 mb-4 animate-fadeIn">
            {/* What's Included */}
            {includesList.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Includes</h4>
                <div className="flex flex-wrap gap-1">
                  {includesList.slice(0, 6).map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                      <Check size={8} className="text-gray-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            {highlightsList.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Highlights</h4>
                <ul className="space-y-1">
                  {highlightsList.slice(0, 4).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                      <span className="text-gray-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Date Selection (if dates available) */}
            {(start_date || !price_on_request) && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Select Date</h4>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={start_date || new Date().toISOString().split('T')[0]}
                  max={end_date}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
            )}

            {/* Guests Selection */}
            <div>
              <h4 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Guests</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGuests(Math.max(min_participants || 1, guests - 1))}
                  className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-sm font-medium text-gray-800 w-8 text-center">{guests}</span>
                <button
                  onClick={() => setGuests(Math.min(max_participants || 20, guests + 1))}
                  className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total Price (if not on request) */}
            {!price_on_request && price && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Total ({guests} guests)</span>
                <span className="text-sm font-semibold text-gray-900">€{(price * guests).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {price_on_request ? (
            <button
              onClick={handleRequestBooking}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <MessageSquare size={12} />
              Request Quote
            </button>
          ) : (
            <>
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ShoppingCart size={12} />
                Add to Cart
              </button>
              <button
                onClick={handleRequestBooking}
                className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageSquare size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdventureCard;
