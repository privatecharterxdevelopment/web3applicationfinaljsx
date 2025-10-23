/**
 * Event Card Component
 * 
 * Displays event information from Ticketmaster or Eventbrite
 * Redirects users to external platform for booking
 */

import React from 'react';
import { Calendar, MapPin, ExternalLink, Ticket, Clock } from 'lucide-react';

const EventCard = ({ event, onClick }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (priceInfo) => {
    if (!priceInfo) return 'Price TBA';
    if (priceInfo.min === 0 && priceInfo.max === 0) return 'FREE';
    if (priceInfo.min === priceInfo.max) {
      return `${priceInfo.currency} ${priceInfo.min.toFixed(2)}`;
    }
    return `${priceInfo.currency} ${priceInfo.min.toFixed(2)} - ${priceInfo.max.toFixed(2)}`;
  };

  const getPlatformBadge = (platform) => {
    const badges = {
      ticketmaster: { color: 'bg-blue-500', text: 'Ticketmaster' },
      eventbrite: { color: 'bg-orange-500', text: 'Eventbrite' }
    };
    return badges[platform] || { color: 'bg-gray-500', text: platform };
  };

  const platformBadge = getPlatformBadge(event.platform);

  const handleCardClick = (e) => {
    // If clicking the external link button, let it handle navigation
    if (e.target.closest('a')) return;
    
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <div
      className="group relative bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Platform Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className={`${platformBadge.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
          {platformBadge.text}
        </span>
      </div>

      {/* Event Image */}
      {event.image && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
              {event.category}
              {event.subcategory && ` • ${event.subcategory}`}
            </span>
          </div>
        </div>
      )}

      {/* Event Details */}
      <div className="space-y-3">
        {/* Event Name */}
        <h3 className="text-xl font-bold text-white line-clamp-2 group-hover:text-blue-300 transition-colors">
          {event.name}
        </h3>

        {/* Date & Time */}
        <div className="flex items-center space-x-2 text-gray-300">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{formatDate(event.date)}</span>
        </div>

        {/* Venue Location */}
        <div className="flex items-start space-x-2 text-gray-300">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">{event.venue.name}</div>
            {event.venue.city && (
              <div className="text-gray-400">
                {event.venue.city}
                {event.venue.state && `, ${event.venue.state}`}
                {event.venue.country && ` • ${event.venue.country}`}
              </div>
            )}
            {event.onlineEvent && (
              <div className="text-green-400 font-semibold mt-1">🌐 Online Event</div>
            )}
          </div>
        </div>

        {/* Description (truncated) */}
        {event.description && (
          <p className="text-gray-400 text-sm line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-xs text-gray-400">Price</div>
              <div className="text-lg font-bold text-white">
                {formatPrice(event.price)}
              </div>
            </div>
          </div>

          {/* External Link Button */}
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Get Tickets</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-2 text-xs">
          {event.status === 'onsale' && (
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>On Sale Now</span>
            </span>
          )}
          {event.salesInfo?.isFree && (
            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-semibold">
              FREE EVENT
            </span>
          )}
          {event.status === 'offsale' && (
            <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
