import React, { useState } from 'react';
import {
  MapPin,
  Star,
  Phone,
  Globe,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Navigation,
  MessageSquare,
  Car
} from 'lucide-react';

/**
 * PlaceCard - Displays rich place information from Google Places API
 * Shows photo, ratings, reviews, contact info, and opening hours
 * Monochromatic, glassmorphic design matching the chat UI
 */
const PlaceCard = ({ place, onRequestTransfer, showAlternatives = false, alternatives = [] }) => {
  const [showReviews, setShowReviews] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!place) return null;

  const {
    name,
    fullAddress,
    category,
    rating,
    reviewCount,
    priceLevel,
    photos = [],
    mainPhoto,
    website,
    phone,
    googleMapsUrl,
    openingHours,
    description,
    reviews = [],
    features = {}
  } = place;

  // Render star rating - monochromatic style
  const renderStars = (ratingValue) => {
    if (!ratingValue) return null;
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    return (
      <div className="flex items-center gap-px">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={11}
            className={`${
              i < fullStars
                ? 'fill-gray-800 text-gray-800'
                : i === fullStars && hasHalfStar
                ? 'fill-gray-400 text-gray-400'
                : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  // Get feature badges
  const getFeatureBadges = () => {
    const badges = [];
    if (features.dineIn) badges.push('Dine-in');
    if (features.takeout) badges.push('Takeout');
    if (features.delivery) badges.push('Delivery');
    if (features.reservable) badges.push('Reservations');
    if (features.servesVegetarianFood) badges.push('Vegetarian');
    if (features.servesWine) badges.push('Wine');
    return badges.slice(0, 3);
  };

  const featureBadges = getFeatureBadges();
  const currentPhoto = photos[activePhotoIndex]?.url || mainPhoto;

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all"
      style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: '340px' }}
    >
      {/* Photo Section */}
      {currentPhoto && !imageError && (
        <div className="relative h-40 bg-gray-50">
          <img
            src={currentPhoto}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {/* Photo navigation dots */}
          {photos.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === activePhotoIndex
                      ? 'bg-white'
                      : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
          {/* Category badge */}
          {category && (
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2 py-0.5 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-medium rounded-full">
                {category}
              </span>
            </div>
          )}
          {/* Price level */}
          {priceLevel && (
            <div className="absolute top-2.5 right-2.5">
              <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-medium rounded-full">
                {priceLevel}
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
              {renderStars(rating)}
              <span className="text-xs font-medium text-gray-600">{rating.toFixed(1)}</span>
              {reviewCount > 0 && (
                <span className="text-xs text-gray-400">({reviewCount.toLocaleString()})</span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-500 mb-2.5 line-clamp-2 leading-relaxed">{description}</p>
        )}

        {/* Feature Badges */}
        {featureBadges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {featureBadges.map((badge, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-medium rounded border border-gray-100"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-1.5 mb-2">
          <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">{fullAddress}</p>
        </div>

        {/* Contact Row */}
        <div className="flex items-center gap-3 text-xs mb-2">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Phone size={11} className="text-gray-400" />
              <span>{phone}</span>
            </a>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Globe size={11} className="text-gray-400" />
              <span>Website</span>
              <ExternalLink size={9} />
            </a>
          )}
        </div>

        {/* Opening Hours Toggle */}
        {openingHours?.weekdayDescriptions?.length > 0 && (
          <div className="pt-2.5 border-t border-gray-50">
            <button
              onClick={() => setShowHours(!showHours)}
              className="flex items-center justify-between w-full text-xs"
            >
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-gray-400" />
                <span className={`font-medium ${
                  openingHours.openNow === true ? 'text-gray-700' :
                  openingHours.openNow === false ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {openingHours.openNow === true ? 'Open now' :
                   openingHours.openNow === false ? 'Closed' : 'Hours'}
                </span>
                {openingHours.openNow === true && (
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                )}
              </div>
              {showHours ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
            </button>
            {showHours && (
              <div className="mt-2 pl-5 space-y-0.5">
                {openingHours.weekdayDescriptions.map((day, idx) => (
                  <p key={idx} className="text-[10px] text-gray-400">{day}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Toggle */}
        {reviews.length > 0 && (
          <div className="pt-2.5 mt-2 border-t border-gray-50">
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="flex items-center justify-between w-full text-xs"
            >
              <div className="flex items-center gap-1.5">
                <MessageSquare size={11} className="text-gray-400" />
                <span className="text-gray-600 font-medium">Reviews</span>
                <span className="text-gray-400">({reviews.length})</span>
              </div>
              {showReviews ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
            </button>
            {showReviews && (
              <div className="mt-2 space-y-2">
                {reviews.map((review, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-gray-700">{review.author}</span>
                      <div className="flex items-center gap-0.5">
                        <Star size={9} className="fill-gray-700 text-gray-700" />
                        <span className="text-[10px] text-gray-500">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{review.text}</p>
                    {review.time && (
                      <p className="text-[9px] text-gray-400 mt-1">{review.time}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-gray-50 flex gap-2">
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded-lg transition-colors border border-gray-100"
            >
              <Navigation size={12} />
              <span>Directions</span>
            </a>
          )}
          {onRequestTransfer && (
            <button
              onClick={() => onRequestTransfer(place)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Car size={12} />
              <span>Book Transfer</span>
            </button>
          )}
        </div>
      </div>

      {/* Alternatives Section */}
      {showAlternatives && alternatives && alternatives.length > 0 && (
        <div className="px-3.5 pb-3.5 pt-1">
          <p className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Also found</p>
          <div className="space-y-1.5">
            {alternatives.slice(0, 2).map((alt, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-lg border border-gray-50"
              >
                {alt.mainPhoto && (
                  <img
                    src={alt.mainPhoto}
                    alt={alt.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-gray-700 truncate">{alt.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {alt.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star size={9} className="fill-gray-600 text-gray-600" />
                        <span className="text-[9px] text-gray-500">{alt.rating}</span>
                      </div>
                    )}
                    {alt.priceLevel && (
                      <span className="text-[9px] text-gray-400">{alt.priceLevel}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceCard;
