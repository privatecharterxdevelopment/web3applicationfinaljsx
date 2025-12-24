/**
 * MedevacRequestCard Component
 * Compact, monochromatic design matching PlaceCard style
 * Displays MEDEVAC request summary with Add to Cart action
 */

import React, { useState } from 'react';
import {
  Heart,
  MapPin,
  Users,
  Clock,
  Phone,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2,
  Plane,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const MedevacRequestCard = ({
  medevacRequest,
  urgencyInfo,
  onAddToCart,
  isInCart = false
}) => {
  const [addingToCart, setAddingToCart] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!medevacRequest) return null;

  const {
    urgencyLevel = 'urgent',
    patient = {},
    route = {},
    passengers = {},
    timing = {},
    emergencyContact
  } = medevacRequest;

  // Urgency badge styles - monochromatic with subtle accent
  const urgencyConfig = {
    critical: { label: 'Critical', dot: 'bg-red-500 animate-pulse' },
    urgent: { label: 'Urgent', dot: 'bg-amber-500' },
    standard: { label: 'Standard', dot: 'bg-gray-400' }
  };
  const config = urgencyConfig[urgencyLevel] || urgencyConfig.urgent;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await onAddToCart(medevacRequest);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all"
      style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: '340px' }}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Heart size={16} className="text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Medical Evacuation</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                <span className="text-[10px] text-gray-500 font-medium">{config.label}</span>
              </div>
            </div>
          </div>
          {urgencyLevel === 'critical' && (
            <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-medium rounded border border-red-100">
              Priority
            </span>
          )}
        </div>
      </div>

      {/* Route Summary */}
      <div className="p-3.5 border-b border-gray-50">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-gray-400 uppercase">From</span>
            <p className="text-gray-900 font-medium truncate">{route.origin || 'TBD'}</p>
          </div>
          <Plane size={14} className="text-gray-300 flex-shrink-0 rotate-45" />
          <div className="flex-1 min-w-0 text-right">
            <span className="text-[10px] text-gray-400 uppercase">To</span>
            <p className="text-gray-900 font-medium truncate">{route.destination || 'TBD'}</p>
          </div>
        </div>
      </div>

      {/* Patient Summary */}
      <div className="p-3.5 border-b border-gray-50">
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-gray-400 w-16 flex-shrink-0">Condition</span>
            <span className="text-xs text-gray-700">{patient.condition || 'Not specified'}</span>
          </div>
          {patient.mobilityStatus && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-16 flex-shrink-0">Mobility</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded border border-gray-100">
                {patient.mobilityStatus === 'stretcher' ? 'Stretcher' :
                 patient.mobilityStatus === 'wheelchair' ? 'Wheelchair' :
                 patient.mobilityStatus === 'intensive_care' ? 'ICU' : 'Ambulatory'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      <div className="border-b border-gray-50">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium">Details</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="px-3.5 pb-3.5 space-y-2">
            {/* Passengers */}
            <div className="flex items-center gap-2">
              <Users size={12} className="text-gray-400" />
              <span className="text-xs text-gray-600">
                {passengers.patients || 1} patient, {passengers.medicalEscorts || 0} medical, {passengers.familyEscorts || 0} family
              </span>
            </div>

            {/* Timing */}
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-600">{timing.preferredDateTime || 'ASAP'}</span>
            </div>

            {/* Emergency Contact */}
            {emergencyContact && (
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-gray-400" />
                <span className="text-xs text-gray-600">{emergencyContact}</span>
              </div>
            )}

            {/* Medical Needs */}
            {patient.medicalNeeds && (
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-400 uppercase">Medical Equipment</span>
                <p className="text-xs text-gray-600 mt-0.5">{patient.medicalNeeds}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3.5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] text-gray-400 uppercase">Price</span>
            <p className="text-sm font-semibold text-gray-900">On Request</p>
          </div>

          {isInCart ? (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 size={16} />
              <span className="text-xs font-medium">Added</span>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {addingToCart ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingCart size={14} />
              )}
              <span>Add to Cart</span>
            </button>
          )}
        </div>

        {/* Info note */}
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Our team will contact you within 15 minutes with aircraft options and pricing.
        </p>
      </div>
    </div>
  );
};

export default MedevacRequestCard;
