/**
 * VisaRequestCard Component
 * Displays an Express Visa request with all traveler information
 * Allows user to add request to cart for processing
 * Price: $250 USD per person, 24h guarantee in 95% of countries
 */

import React, { useState } from 'react';
import {
  Globe,
  Users,
  Calendar,
  FileText,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Shield,
  AlertTriangle,
  User,
  CreditCard,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const VisaRequestCard = ({
  visaRequest,
  onAddToCart,
  isInCart = false
}) => {
  const [addingToCart, setAddingToCart] = useState(false);
  const [showAllTravelers, setShowAllTravelers] = useState(false);

  if (!visaRequest) return null;

  const {
    destinationCountry,
    travelDate,
    purposeOfVisit,
    numberOfTravelers,
    travelers = [],
    hasMinors,
    minorCount,
    hasExistingEvisaApplication,
    existingApplicationCodes = [],
    additionalNotes,
    intendedEntryPort,
    intendedExitPort,
    processingTime = 'standard',
    processingLabel,
    processingDuration,
    processingFeePerPerson = 0,
    pricePerPerson = 250,
    totalPerPerson,
    totalPrice,
    currency = 'USD'
  } = visaRequest;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await onAddToCart(visaRequest);
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Show first 2 travelers, rest behind toggle
  const visibleTravelers = showAllTravelers ? travelers : travelers.slice(0, 2);
  const hiddenCount = travelers.length - 2;

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🛂</span>
              <span className="text-xs font-bold uppercase tracking-wide">
                Express Visa Service
              </span>
            </div>
            <h3 className="text-lg font-bold">{destinationCountry}</h3>
            <p className="text-sm text-white/80 mt-1">
              {numberOfTravelers} traveler{numberOfTravelers > 1 ? 's' : ''} • {purposeOfVisit || 'Tourism'}
            </p>
          </div>

          {/* Price badge */}
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] uppercase opacity-80">Total</p>
            <p className="text-xl font-bold">{formatPrice(totalPrice)}</p>
          </div>
        </div>
      </div>

      {/* Service Features */}
      <div className="p-3 bg-indigo-50 border-b border-indigo-100">
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-xs text-indigo-700 bg-white px-2 py-1 rounded-full">
            <Clock size={12} />
            {processingDuration || '24h Guarantee'}
          </span>
          <span className="flex items-center gap-1 text-xs text-indigo-700 bg-white px-2 py-1 rounded-full">
            <Globe size={12} />
            95% Countries
          </span>
          <span className="flex items-center gap-1 text-xs text-indigo-700 bg-white px-2 py-1 rounded-full">
            <Shield size={12} />
            Verified Network
          </span>
        </div>
      </div>

      {/* Entry/Exit Ports */}
      {(intendedEntryPort || intendedExitPort) && (
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg">🛬</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Entry Port</p>
                <p className="text-sm font-semibold text-gray-900">{intendedEntryPort || 'TBC'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-lg">🛫</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Exit Port</p>
                <p className="text-sm font-semibold text-gray-900">{intendedExitPort || 'Same as entry'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Time */}
      {processingLabel && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Processing Time</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              processingTime === 'urgent' ? 'bg-red-100 text-red-700' :
              processingTime === 'express' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}>
              {processingLabel}
            </span>
          </div>
        </div>
      )}

      {/* Travel Details */}
      {travelDate && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Calendar size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Travel Date</p>
              <p className="text-sm font-semibold text-gray-900">{travelDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Travelers List */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
          <Users size={16} className="text-indigo-600" />
          Travelers ({numberOfTravelers})
        </h4>

        <div className="space-y-2">
          {visibleTravelers.map((traveler, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User size={14} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {traveler.fullName || `Traveler ${idx + 1}`}
                    {traveler.isUnder12 && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        Under 12
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {traveler.nationality}
                    {traveler.passportNumber && ` • ${traveler.passportNumber}`}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {formatPrice(pricePerPerson)}
              </span>
            </div>
          ))}

          {/* Show more button */}
          {travelers.length > 2 && (
            <button
              onClick={() => setShowAllTravelers(!showAllTravelers)}
              className="w-full flex items-center justify-center gap-1 py-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showAllTravelers ? (
                <>
                  <ChevronUp size={14} />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Show {hiddenCount} more traveler{hiddenCount > 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Minors Notice */}
      {hasMinors && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>{minorCount} traveler(s) under 12 years old</strong> - Special processing included.
              Additional documentation may be required.
            </p>
          </div>
        </div>
      )}

      {/* Existing E-Visa Applications */}
      {hasExistingEvisaApplication && existingApplicationCodes.length > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-800">Existing E-Visa Applications</p>
              <p className="text-xs text-blue-700 mt-0.5">
                {existingApplicationCodes.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {additionalNotes && (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-600">
            <strong>Notes:</strong> {additionalNotes}
          </p>
        </div>
      )}

      {/* Footer with Pricing & Add to Cart */}
      <div className="p-4 bg-gray-50">
        {/* Pricing breakdown */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Service Fee</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</p>
              <p className="text-xs text-gray-500">
                {processingFeePerPerson > 0
                  ? `(${formatPrice(pricePerPerson)} + ${formatPrice(processingFeePerPerson)} admin) × ${numberOfTravelers}`
                  : `(${formatPrice(pricePerPerson)} × ${numberOfTravelers})`
                }
              </p>
            </div>
            {processingFeePerPerson > 0 && (
              <p className="text-[10px] text-amber-600 mt-1">
                +{formatPrice(processingFeePerPerson)}/person admin fee for {processingTime} processing
              </p>
            )}
            <p className="text-[10px] text-gray-400 mt-0.5">
              Excl. visa application fees (paid directly to embassy/consulate)
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
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors"
            >
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  Add Visa to Cart
                </>
              )}
            </button>
          )}
        </div>

        {/* Service guarantee */}
        <div className="flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
          <Shield size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-700">
            <strong>Our Guarantee:</strong> 24h processing through direct government contacts
            and verified agent network in 95% of countries. Travel risk-free without any
            disappointments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisaRequestCard;
