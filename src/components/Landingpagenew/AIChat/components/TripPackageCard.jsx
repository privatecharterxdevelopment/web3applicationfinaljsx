/**
 * TripPackageCard Component
 * Displays a complete trip package with multiple segments
 * Allows user to add entire package to cart
 */

import React, { useState } from 'react';
import {
  Plane,
  Car,
  Ship,
  MapPin,
  Calendar,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Edit3,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Segment type icons
const SEGMENT_ICONS = {
  jet: Plane,
  helicopter: Plane,
  flight: Plane,
  ground_transfer: Car,
  car: Car,
  luxury_car: Car,
  yacht: Ship,
  boat: Ship,
  hotel: MapPin,
  accommodation: MapPin,
  activity: Sparkles,
  other: MapPin
};

// Segment type labels
const SEGMENT_LABELS = {
  jet: 'Private Jet',
  helicopter: 'Helicopter',
  flight: 'Flight',
  ground_transfer: 'Ground Transfer',
  car: 'Chauffeur Service',
  luxury_car: 'Luxury Car',
  yacht: 'Yacht Charter',
  boat: 'Boat Transfer',
  hotel: 'Accommodation',
  accommodation: 'Accommodation',
  activity: 'Activity',
  other: 'Service'
};

const TripPackageCard = ({
  tripPackage,
  onAddToCart,
  onEditSegment,
  onRemoveSegment,
  isInCart = false
}) => {
  const [expanded, setExpanded] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  if (!tripPackage) return null;

  const {
    name,
    description,
    segments = [],
    estimatedTotal,
    currency = 'EUR',
    occasion,
    passengers,
    dateRange,
    notes
  } = tripPackage;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await onAddToCart(tripPackage);
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'TBD';
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                Custom Trip Package
              </span>
            </div>
            <h3 className="text-lg font-semibold">{name || 'Your Trip'}</h3>
            {description && (
              <p className="text-sm text-gray-300 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Trip meta info */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-300">
          {occasion && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
              <Sparkles size={12} />
              {occasion}
            </span>
          )}
          {passengers && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
              <Users size={12} />
              {passengers} pax
            </span>
          )}
          {dateRange && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
              <Calendar size={12} />
              {dateRange}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
            <MapPin size={12} />
            {segments.length} segments
          </span>
        </div>
      </div>

      {/* Segments List */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {segments.map((segment, idx) => {
            const Icon = SEGMENT_ICONS[segment.type] || MapPin;
            const label = SEGMENT_LABELS[segment.type] || 'Service';

            return (
              <div
                key={idx}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Segment number & icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Icon size={18} className="text-gray-600" />
                  </div>

                  {/* Segment details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {idx + 1}. {label}
                      </span>
                      {segment.date && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(segment.date)}
                        </span>
                      )}
                    </div>

                    <h4 className="font-medium text-gray-900 text-sm">
                      {segment.name || segment.description || `${segment.from} → ${segment.to}`}
                    </h4>

                    {/* Route info */}
                    {(segment.from || segment.to) && (
                      <p className="text-xs text-gray-600 mt-1">
                        {segment.from && <span className="font-medium">{segment.from}</span>}
                        {segment.from && segment.to && ' → '}
                        {segment.to && <span className="font-medium">{segment.to}</span>}
                      </p>
                    )}

                    {/* Additional details */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {segment.duration && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded">
                          <Clock size={10} />
                          {segment.duration}
                        </span>
                      )}
                      {segment.passengers && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded">
                          <Users size={10} />
                          {segment.passengers} pax
                        </span>
                      )}
                      {segment.aircraft && (
                        <span className="text-[10px] text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">
                          {segment.aircraft}
                        </span>
                      )}
                      {segment.vehicle && (
                        <span className="text-[10px] text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">
                          {segment.vehicle}
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {segment.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        {segment.notes}
                      </p>
                    )}
                  </div>

                  {/* Segment price */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(segment.estimatedPrice)}
                    </p>
                    {segment.priceNote && (
                      <p className="text-[10px] text-gray-500">{segment.priceNote}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer with total and actions */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        {/* Notes */}
        {notes && (
          <div className="flex items-start gap-2 mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{notes}</p>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Estimated Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(estimatedTotal)}
            </p>
            <p className="text-[10px] text-gray-500">
              Final price confirmed after review by our team
            </p>
          </div>

          {isInCart ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={20} />
              <span className="text-sm font-medium">Added to Cart</span>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors"
            >
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  Add Trip to Cart
                </>
              )}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onEditSegment && onEditSegment(tripPackage)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit3 size={14} />
            Adjust Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripPackageCard;
