import React, { useState } from 'react';
import {
  MapPin,
  Star,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  Utensils,
  Building2,
  ChevronDown,
  ChevronUp,
  Users,
  Bed,
  Calendar,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * HotelCard - Displays hotel information from search results
 * Shows photo, ratings, amenities, rooms, and prices
 * Monochromatic, glassmorphic design matching the chat UI
 */
const HotelCard = ({ hotel, rooms = [], onSelectRoom, onViewDetails, checkIn, checkOut }) => {
  const [showRooms, setShowRooms] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  if (!hotel) return null;

  const {
    hotelId,
    name,
    address,
    city,
    country,
    starRating,
    rating,
    reviewCount,
    mainImage,
    images = [],
    amenities = [],
    minRate,
    currency = 'USD',
    description
  } = hotel;

  // Amenity icons mapping
  const amenityIconMap = {
    'wifi': <Wifi size={11} />,
    'parking': <Car size={11} />,
    'breakfast': <Coffee size={11} />,
    'gym': <Dumbbell size={11} />,
    'pool': <Waves size={11} />,
    'spa': <Waves size={11} />,
    'restaurant': <Utensils size={11} />
  };

  const getAmenityIcon = (amenity) => {
    const key = Object.keys(amenityIconMap).find(k =>
      amenity.toLowerCase().includes(k)
    );
    return key ? amenityIconMap[key] : <Check size={11} />;
  };

  // Render star rating
  const renderStars = (stars) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={11}
        className={`${
          i < stars
            ? 'fill-gray-800 text-gray-800'
            : 'text-gray-200'
        }`}
      />
    ));
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(hotel);
    } else {
      navigate(`/hotel/${hotelId}`);
    }
  };

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all"
      style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: '340px' }}
    >
      {/* Photo Section */}
      {mainImage && !imageError && (
        <div className="relative h-40 bg-gray-50">
          <img
            src={mainImage}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {/* Star Rating Badge */}
          {starRating && (
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2 py-0.5 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-medium rounded-full flex items-center gap-1">
                <Star size={10} className="fill-white" />
                {starRating} Star
              </span>
            </div>
          )}
          {/* Price Badge */}
          {minRate && (
            <div className="absolute top-2.5 right-2.5">
              <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-medium rounded-full">
                From ${minRate}/night
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-3.5">
        {/* Name and Rating */}
        <div className="mb-2.5">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight">{name}</h3>
          {rating && (
            <div className="flex items-center gap-1.5 mt-1">
              {renderStars(Math.floor(rating))}
              <span className="text-xs font-medium text-gray-600">{rating.toFixed(1)}</span>
              {reviewCount > 0 && (
                <span className="text-xs text-gray-400">({reviewCount.toLocaleString()} reviews)</span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-500 mb-2.5 line-clamp-2 leading-relaxed">{description}</p>
        )}

        {/* Address */}
        <div className="flex items-start gap-1.5 mb-2">
          <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            {address}{city ? `, ${city}` : ''}{country ? `, ${country}` : ''}
          </p>
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {amenities.slice(0, 5).map((amenity, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-medium rounded border border-gray-100"
              >
                {getAmenityIcon(amenity)}
                <span className="capitalize">{amenity}</span>
              </span>
            ))}
            {amenities.length > 5 && (
              <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 text-[10px] rounded border border-gray-100">
                +{amenities.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Rooms Toggle */}
        {rooms.length > 0 && (
          <div className="pt-2.5 border-t border-gray-50">
            <button
              onClick={() => setShowRooms(!showRooms)}
              className="flex items-center justify-between w-full text-xs"
            >
              <div className="flex items-center gap-1.5">
                <Bed size={11} className="text-gray-400" />
                <span className="text-gray-600 font-medium">Available Rooms</span>
                <span className="text-gray-400">({rooms.length})</span>
              </div>
              {showRooms ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
            </button>

            {showRooms && (
              <div className="mt-2 space-y-2">
                {rooms.map((room, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-gray-700">{room.roomName}</span>
                      <div className="flex items-center gap-1">
                        <Users size={9} className="text-gray-400" />
                        <span className="text-[10px] text-gray-500">{room.maxOccupancy}</span>
                      </div>
                    </div>
                    {room.rates && room.rates.length > 0 && (
                      <div className="space-y-1.5">
                        {room.rates.slice(0, 2).map((rate, rateIdx) => (
                          <div
                            key={rateIdx}
                            onClick={() => onSelectRoom && onSelectRoom(hotel, room, rate)}
                            className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-100 cursor-pointer hover:border-gray-300 transition-colors"
                          >
                            <div>
                              <p className="text-[10px] text-gray-600">{rate.rateName || rate.boardType}</p>
                              {rate.cancellation?.refundable && (
                                <p className="text-[9px] text-green-600">Free cancellation</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] font-semibold text-gray-900">${rate.totalRate}</p>
                              <p className="text-[9px] text-gray-400">/night</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-gray-50 flex gap-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded-lg transition-colors border border-gray-100"
          >
            <Building2 size={12} />
            <span>View Details</span>
          </button>
          {rooms.length > 0 && onSelectRoom && (
            <button
              onClick={() => {
                const firstRoom = rooms[0];
                const firstRate = firstRoom?.rates?.[0];
                if (firstRoom && firstRate) {
                  onSelectRoom(hotel, firstRoom, firstRate);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Calendar size={12} />
              <span>Book Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
