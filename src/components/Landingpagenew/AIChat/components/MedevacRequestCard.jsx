/**
 * MedevacRequestCard Component
 * Displays a MEDEVAC request with all patient information
 * Allows user to add request to cart for immediate processing
 * CRITICAL: This is for life-threatening emergency medical transport
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
  User,
  Activity,
  FileText,
  Shield
} from 'lucide-react';

// Urgency level configurations
const URGENCY_CONFIG = {
  critical: {
    label: 'CRITICAL EMERGENCY',
    emoji: '🚨',
    bgColor: 'bg-gradient-to-r from-red-600 to-red-700',
    borderColor: 'border-red-500',
    textColor: 'text-red-600',
    badgeColor: 'bg-red-500',
    pulseAnimation: true,
    description: 'Immediate life-threatening situation'
  },
  urgent: {
    label: 'URGENT',
    emoji: '⚠️',
    bgColor: 'bg-gradient-to-r from-amber-500 to-amber-600',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-600',
    badgeColor: 'bg-amber-500',
    pulseAnimation: false,
    description: 'Serious medical situation'
  },
  standard: {
    label: 'MEDICAL TRANSPORT',
    emoji: '🏥',
    bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-600',
    badgeColor: 'bg-blue-500',
    pulseAnimation: false,
    description: 'Non-emergency repatriation'
  }
};

// Mobility status labels
const MOBILITY_LABELS = {
  ambulatory: 'Can Walk',
  stretcher: 'Stretcher Required',
  wheelchair: 'Wheelchair',
  intensive_care: 'ICU Setup Required'
};

const MedevacRequestCard = ({
  medevacRequest,
  urgencyInfo,
  onAddToCart,
  isInCart = false
}) => {
  const [addingToCart, setAddingToCart] = useState(false);

  if (!medevacRequest) return null;

  const {
    urgencyLevel = 'urgent',
    patient = {},
    route = {},
    passengers = {},
    timing = {},
    insurance,
    emergencyContact,
    notes
  } = medevacRequest;

  const config = URGENCY_CONFIG[urgencyLevel] || URGENCY_CONFIG.urgent;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await onAddToCart(medevacRequest);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className={`bg-white border-2 ${config.borderColor} rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow`}>
      {/* Header with urgency indicator */}
      <div className={`${config.bgColor} text-white p-4 relative`}>
        {/* Pulse animation for critical cases */}
        {config.pulseAnimation && (
          <div className="absolute inset-0 bg-red-500 animate-pulse opacity-20" />
        )}

        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{config.emoji}</span>
                <span className={`text-xs font-bold uppercase tracking-wide ${
                  config.pulseAnimation ? 'animate-pulse' : ''
                }`}>
                  {config.label}
                </span>
              </div>
              <h3 className="text-lg font-bold">Medical Evacuation Request</h3>
              <p className="text-sm text-white/80 mt-1">{config.description}</p>
            </div>

            {/* Medical cross icon */}
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Heart size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
          <User size={16} className={config.textColor} />
          Patient Information
        </h4>

        <div className="space-y-2">
          {patient.name && patient.name !== 'Patient' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-24">Name:</span>
              <span className="text-sm font-medium text-gray-900">{patient.name}</span>
            </div>
          )}
          {patient.age && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-24">Age:</span>
              <span className="text-sm font-medium text-gray-900">{patient.age} years</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-500 w-24 flex-shrink-0">Condition:</span>
            <span className="text-sm font-medium text-gray-900">{patient.condition}</span>
          </div>
          {patient.medicalNeeds && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 w-24 flex-shrink-0">Medical Needs:</span>
              <span className="text-sm text-gray-700">{patient.medicalNeeds}</span>
            </div>
          )}
          {patient.mobilityStatus && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-24">Mobility:</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                patient.mobilityStatus === 'intensive_care'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {MOBILITY_LABELS[patient.mobilityStatus] || patient.mobilityStatus}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Route Information */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
          <Plane size={16} className={config.textColor} />
          Transport Route
        </h4>

        <div className="flex items-center gap-3">
          {/* Origin */}
          <div className="flex-1 p-3 bg-white rounded-lg border border-gray-200">
            <span className="text-[10px] uppercase text-gray-500 font-medium">From</span>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{route.origin}</p>
            {route.originDetails && (
              <p className="text-xs text-gray-500 mt-0.5">{route.originDetails}</p>
            )}
          </div>

          {/* Arrow */}
          <div className={`w-8 h-8 rounded-full ${config.badgeColor} flex items-center justify-center flex-shrink-0`}>
            <Plane size={14} className="text-white rotate-45" />
          </div>

          {/* Destination */}
          <div className="flex-1 p-3 bg-white rounded-lg border border-gray-200">
            <span className="text-[10px] uppercase text-gray-500 font-medium">To</span>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{route.destination}</p>
            {route.destinationDetails && (
              <p className="text-xs text-gray-500 mt-0.5">{route.destinationDetails}</p>
            )}
          </div>
        </div>
      </div>

      {/* Passengers & Timing */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          {/* Passengers */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <Users size={16} className={config.textColor} />
              Passengers
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Patients:</span>
                <span className="font-medium text-gray-900">{passengers.patients || 1}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Medical Staff:</span>
                <span className="font-medium text-gray-900">{passengers.medicalEscorts || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Family:</span>
                <span className="font-medium text-gray-900">{passengers.familyEscorts || 0}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                <span className="font-medium text-gray-700">Total:</span>
                <span className="font-bold text-gray-900">{passengers.total || 1}</span>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <Clock size={16} className={config.textColor} />
              Timing
            </h4>
            <div className={`p-3 rounded-lg ${
              timing.isEmergency ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className={`text-sm font-bold ${
                timing.isEmergency ? 'text-red-700' : 'text-gray-900'
              }`}>
                {timing.preferredDateTime || 'ASAP'}
              </p>
              {timing.isEmergency && (
                <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Priority Dispatch
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {(emergencyContact || insurance || notes) && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
            <FileText size={16} className={config.textColor} />
            Additional Information
          </h4>

          <div className="space-y-2">
            {emergencyContact && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                <Phone size={14} className="text-gray-500" />
                <div>
                  <span className="text-[10px] uppercase text-gray-500">Emergency Contact</span>
                  <p className="text-sm font-medium text-gray-900">{emergencyContact}</p>
                </div>
              </div>
            )}

            {insurance && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                <Shield size={14} className="text-gray-500" />
                <div>
                  <span className="text-[10px] uppercase text-gray-500">Insurance</span>
                  <p className="text-sm font-medium text-gray-900">{insurance}</p>
                </div>
              </div>
            )}

            {notes && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Notes:</strong> {notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer with Add to Cart */}
      <div className="p-4 bg-gray-50">
        {/* Price info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Pricing</p>
            <p className="text-xl font-bold text-gray-900">On Request</p>
            <p className="text-[10px] text-gray-500">
              Our team will provide immediate quote
            </p>
          </div>

          {isInCart ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={20} />
              <span className="text-sm font-medium">Request Submitted</span>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className={`flex items-center gap-2 px-6 py-3 ${
                urgencyLevel === 'critical'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-900 hover:bg-gray-800'
              } disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors ${
                urgencyLevel === 'critical' ? 'animate-pulse' : ''
              }`}
            >
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  Add MEDEVAC to Cart
                </>
              )}
            </button>
          )}
        </div>

        {/* Urgent notice */}
        <div className={`flex items-start gap-2 p-3 rounded-lg ${
          urgencyLevel === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
        }`}>
          <Activity size={16} className={urgencyLevel === 'critical' ? 'text-red-600' : 'text-blue-600'} />
          <p className={`text-xs ${urgencyLevel === 'critical' ? 'text-red-700' : 'text-blue-700'}`}>
            <strong>Next Steps:</strong> Upon submission, our medical coordination team will immediately:
            <br />• Contact you within 15 minutes
            <br />• Coordinate with medical facilities
            <br />• Arrange appropriate air ambulance
            <br />• Provide detailed quote and timeline
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedevacRequestCard;
