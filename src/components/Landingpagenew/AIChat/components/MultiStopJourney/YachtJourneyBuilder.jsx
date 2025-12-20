import React, { useState, useCallback } from 'react';
import {
  X, Plus, Anchor, MapPin, Clock, Route,
  Calendar, Users, ChevronDown, ChevronUp,
  Trash2, Check, Ship, Navigation, Utensils, Car, AlertCircle
} from 'lucide-react';

// Duration options for stays
const STAY_DURATION_OPTIONS = [
  { label: 'Few hours', value: 4 },
  { label: 'Half day', value: 12 },
  { label: '1 day', value: 24 },
  { label: '2 days', value: 48 },
  { label: '3 days', value: 72 },
  { label: '1 week', value: 168 },
  { label: 'Custom', value: 'custom' }
];

// Yacht categories
const YACHT_CATEGORIES = [
  { id: 'superyacht', label: 'Superyacht', hasHelipad: true },
  { id: 'motor_yacht', label: 'Motor Yacht', hasHelipad: false },
  { id: 'sailing_yacht', label: 'Sailing Yacht', hasHelipad: false },
  { id: 'catamaran', label: 'Catamaran', hasHelipad: false },
  { id: 'gulet', label: 'Gulet', hasHelipad: false }
];

// Budget ranges (daily rate in EUR)
const BUDGET_RANGES = [
  { id: 'economy', label: '€5k - €15k/day', min: 5000, max: 15000 },
  { id: 'premium', label: '€15k - €50k/day', min: 15000, max: 50000 },
  { id: 'luxury', label: '€50k - €150k/day', min: 50000, max: 150000 },
  { id: 'ultra', label: '€150k+/day', min: 150000, max: null },
  { id: 'flexible', label: 'Flexible / Open', min: null, max: null }
];

const YachtJourneyBuilder = ({
  yacht,
  onAddToCart,
  onClose,
  existingLegs = [],
  isEditing = false
}) => {
  // Legs state - each leg is a destination with details
  const [legs, setLegs] = useState(existingLegs.length > 0 ? existingLegs : [
    { id: 1, dock: '', location: '', stayDuration: 24, notes: '', services: [] }
  ]);

  // Yacht details
  const [yachtCategory, setYachtCategory] = useState(yacht?.category || 'motor_yacht');
  const [guests, setGuests] = useState(yacht?.max_passengers || 8);
  const [crewIncluded, setCrewIncluded] = useState(true);
  const [departureDate, setDepartureDate] = useState('');
  const [budgetRange, setBudgetRange] = useState('flexible');

  // UI state
  const [expandedLeg, setExpandedLeg] = useState(0);
  const [showAddService, setShowAddService] = useState(null);

  // Special requests
  const [specialRequests, setSpecialRequests] = useState([]);
  const [newRequest, setNewRequest] = useState('');

  // Check if yacht has helipad
  const hasHelipad = YACHT_CATEGORIES.find(c => c.id === yachtCategory)?.hasHelipad || false;

  // Add new leg
  const handleAddLeg = () => {
    const newLeg = {
      id: Date.now(),
      dock: '',
      location: '',
      stayDuration: 24,
      notes: '',
      services: []
    };
    setLegs([...legs, newLeg]);
    setExpandedLeg(legs.length);
  };

  // Update leg
  const handleUpdateLeg = (index, field, value) => {
    const newLegs = [...legs];
    newLegs[index] = { ...newLegs[index], [field]: value };
    setLegs(newLegs);
  };

  // Remove leg
  const handleRemoveLeg = (index) => {
    if (legs.length > 1) {
      setLegs(legs.filter((_, i) => i !== index));
      if (expandedLeg >= legs.length - 1) {
        setExpandedLeg(Math.max(0, legs.length - 2));
      }
    }
  };

  // Add service to leg (restaurant, transfer, etc.)
  const handleAddService = (legIndex, serviceType, details) => {
    const newLegs = [...legs];
    const service = {
      id: Date.now(),
      type: serviceType,
      ...details
    };
    newLegs[legIndex].services = [...(newLegs[legIndex].services || []), service];
    setLegs(newLegs);
    setShowAddService(null);
  };

  // Remove service from leg
  const handleRemoveService = (legIndex, serviceId) => {
    const newLegs = [...legs];
    newLegs[legIndex].services = newLegs[legIndex].services.filter(s => s.id !== serviceId);
    setLegs(newLegs);
  };

  // Add special request
  const handleAddSpecialRequest = () => {
    if (newRequest.trim()) {
      setSpecialRequests([...specialRequests, {
        id: Date.now(),
        text: newRequest.trim(),
        requiresCheck: true
      }]);
      setNewRequest('');
    }
  };

  // Calculate total journey duration
  const totalDuration = legs.reduce((sum, leg) => sum + (leg.stayDuration || 0), 0);
  const totalDays = Math.ceil(totalDuration / 24);

  // Build cart items
  const handleAddToCart = () => {
    const cartItems = [];

    // Get budget range details
    const selectedBudget = BUDGET_RANGES.find(b => b.id === budgetRange);
    const budgetLabel = selectedBudget?.label || 'Flexible';
    const budgetMin = selectedBudget?.min || null;
    const budgetMax = selectedBudget?.max || null;

    // Main yacht charter item
    const yachtItem = {
      id: `yacht-journey-${Date.now()}`,
      cartId: `yacht-journey-${Date.now()}`,
      type: 'yacht_charter',
      serviceType: 'yacht_charter',
      name: yacht?.name || `${YACHT_CATEGORIES.find(c => c.id === yachtCategory)?.label} Charter`,
      category: yachtCategory,
      guests,
      crewIncluded,
      departureDate,
      totalDays,
      // Budget information
      budgetRange: budgetRange,
      budgetLabel: budgetLabel,
      budgetMin: budgetMin,
      budgetMax: budgetMax,
      legs: legs.map((leg, index) => ({
        legNumber: index + 1,
        dock: leg.dock,
        location: leg.location,
        stayDuration: leg.stayDuration,
        stayDurationLabel: STAY_DURATION_OPTIONS.find(d => d.value === leg.stayDuration)?.label || `${leg.stayDuration}h`,
        notes: leg.notes,
        services: leg.services
      })),
      route: legs.map(l => l.location || l.dock).filter(Boolean).join(' → '),
      specialRequests,
      hasHelipad,
      price: 0, // Price on request
      isCustomRequest: true,
      note: `Budget: ${budgetLabel}. Our coordinators will provide a detailed quote based on your itinerary.`,
      addedAt: new Date().toISOString()
    };

    cartItems.push(yachtItem);

    // Add individual services as separate cart items
    legs.forEach((leg, legIndex) => {
      if (leg.services && leg.services.length > 0) {
        leg.services.forEach(service => {
          if (service.type === 'restaurant') {
            cartItems.push({
              id: `restaurant-${service.id}`,
              cartId: `restaurant-${service.id}`,
              type: 'concierge_request',
              serviceType: 'restaurant_reservation',
              name: `Reservation at ${service.name || 'Restaurant'}`,
              linkedToYachtLeg: legIndex + 1,
              location: leg.location,
              details: service.details,
              price: 0,
              isCustomRequest: true,
              addedAt: new Date().toISOString()
            });
          }

          if (service.type === 'ground_transfer') {
            cartItems.push({
              id: `transfer-${service.id}`,
              cartId: `transfer-${service.id}`,
              type: 'transfer',
              serviceType: 'ground_transport',
              name: `Transfer: ${service.from || 'Yacht'} → ${service.to || 'Destination'}`,
              linkedToYachtLeg: legIndex + 1,
              location: leg.location,
              includesReturn: service.includesReturn,
              price: 0,
              isCustomRequest: true,
              addedAt: new Date().toISOString()
            });
          }

          if (service.type === 'helicopter') {
            cartItems.push({
              id: `heli-${service.id}`,
              cartId: `heli-${service.id}`,
              type: 'helicopter',
              serviceType: 'helicopter_charter',
              name: `Helicopter: ${service.from || 'Yacht Helipad'} → ${service.to || 'Destination'}`,
              linkedToYachtLeg: legIndex + 1,
              location: leg.location,
              passengers: service.passengers || guests,
              requiresHelipadCheck: true,
              note: 'Our team will verify helipad availability at destination.',
              price: 0,
              isCustomRequest: true,
              addedAt: new Date().toISOString()
            });
          }
        });
      }
    });

    // Add special requests as separate items
    specialRequests.forEach(request => {
      cartItems.push({
        id: `request-${request.id}`,
        cartId: `request-${request.id}`,
        type: 'concierge_request',
        serviceType: 'custom_request',
        name: 'Special Request',
        description: request.text,
        requiresCheck: true,
        note: 'Our team will check this with the yacht owner/charter company.',
        price: 0,
        isCustomRequest: true,
        addedAt: new Date().toISOString()
      });
    });

    // Add all items to cart
    cartItems.forEach(item => onAddToCart(item));
    onClose();
  };

  const canSubmit = legs.some(leg => leg.location || leg.dock);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Ship size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Yacht Journey' : 'Plan Yacht Journey'}
              </h2>
              <p className="text-xs text-gray-500">{yacht?.name || 'Custom Charter'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Yacht Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Category</label>
              <select
                value={yachtCategory}
                onChange={(e) => setYachtCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              >
                {YACHT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Guests</label>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >−</button>
                <span className="flex-1 text-center text-sm font-medium">{guests}</span>
                <button
                  onClick={() => setGuests(Math.min(20, guests + 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >+</button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Start Date</label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Crew</label>
              <button
                onClick={() => setCrewIncluded(!crewIncluded)}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                  crewIncluded
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                {crewIncluded ? 'Crew Included' : 'Bareboat'}
              </button>
            </div>
          </div>

          {/* Budget Range - Always visible */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Daily Budget Range</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {BUDGET_RANGES.map(range => (
                <button
                  key={range.id}
                  onClick={() => setBudgetRange(range.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    budgetRange === range.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">This helps us find the perfect yacht for your journey</p>
          </div>

          {hasHelipad && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
              <Navigation size={16} />
              <span>This yacht has a helipad - helicopter transfers available</span>
            </div>
          )}

          {/* Journey Legs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Itinerary</label>
              <span className="text-xs text-gray-400">{legs.length} destination{legs.length > 1 ? 's' : ''} • ~{totalDays} day{totalDays > 1 ? 's' : ''}</span>
            </div>

            {legs.map((leg, index) => (
              <div
                key={leg.id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Leg Header */}
                <button
                  onClick={() => setExpandedLeg(expandedLeg === index ? -1 : index)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {leg.location || leg.dock || `Destination ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {STAY_DURATION_OPTIONS.find(d => d.value === leg.stayDuration)?.label || `${leg.stayDuration}h stay`}
                        {leg.services?.length > 0 && ` • ${leg.services.length} service${leg.services.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {legs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLeg(index);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {expandedLeg === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Leg Details */}
                {expandedLeg === index && (
                  <div className="p-4 space-y-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Location/Port</label>
                        <input
                          type="text"
                          value={leg.location}
                          onChange={(e) => handleUpdateLeg(index, 'location', e.target.value)}
                          placeholder="e.g., Portofino, Italy"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Marina/Dock</label>
                        <input
                          type="text"
                          value={leg.dock}
                          onChange={(e) => handleUpdateLeg(index, 'dock', e.target.value)}
                          placeholder="e.g., Porto di Portofino"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Stay Duration</label>
                      <select
                        value={leg.stayDuration}
                        onChange={(e) => handleUpdateLeg(index, 'stayDuration', parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      >
                        {STAY_DURATION_OPTIONS.filter(d => d.value !== 'custom').map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Notes</label>
                      <textarea
                        value={leg.notes}
                        onChange={(e) => handleUpdateLeg(index, 'notes', e.target.value)}
                        placeholder="Any specific requests for this destination..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-gray-400"
                      />
                    </div>

                    {/* Services at this location */}
                    {leg.services?.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Services at this location</label>
                        {leg.services.map(service => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              {service.type === 'restaurant' && <Utensils size={14} className="text-orange-500" />}
                              {service.type === 'ground_transfer' && <Car size={14} className="text-gray-600" />}
                              {service.type === 'helicopter' && <Navigation size={14} className="text-blue-500" />}
                              <span className="text-sm text-gray-700">{service.name || service.to || 'Service'}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveService(index, service.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Service Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const name = prompt('Restaurant name:');
                          if (name) {
                            handleAddService(index, 'restaurant', { name });
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        <Utensils size={12} />
                        Add Restaurant
                      </button>
                      <button
                        onClick={() => {
                          const to = prompt('Transfer destination:');
                          if (to) {
                            const includesReturn = confirm('Include return transfer?');
                            handleAddService(index, 'ground_transfer', {
                              from: leg.dock || 'Yacht',
                              to,
                              includesReturn
                            });
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Car size={12} />
                        Add Transfer
                      </button>
                      {hasHelipad && (
                        <button
                          onClick={() => {
                            const to = prompt('Helicopter destination:');
                            if (to) {
                              handleAddService(index, 'helicopter', {
                                from: 'Yacht Helipad',
                                to,
                                passengers: guests
                              });
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Navigation size={12} />
                          Add Helicopter
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Destination Button */}
            <button
              onClick={handleAddLeg}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
            >
              <Plus size={16} />
              Add Destination
            </button>
          </div>

          {/* Special Requests */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Special Requests</label>
            <p className="text-xs text-gray-500">Requests that need to be checked with the owner/charter company</p>

            {specialRequests.map(request => (
              <div
                key={request.id}
                className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 flex-1">{request.text}</p>
                <button
                  onClick={() => setSpecialRequests(specialRequests.filter(r => r.id !== request.id))}
                  className="p-1 text-amber-400 hover:text-amber-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                value={newRequest}
                onChange={(e) => setNewRequest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialRequest()}
                placeholder="e.g., Can we leave the yacht in a different port?"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              />
              <button
                onClick={handleAddSpecialRequest}
                disabled={!newRequest.trim()}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Summary */}
          {legs.some(l => l.location || l.dock) && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Journey Summary</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Route size={14} />
                <span>{legs.filter(l => l.location || l.dock).map(l => l.location || l.dock).join(' → ')}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>{totalDays} day{totalDays > 1 ? 's' : ''}</span>
                <span>{guests} guest{guests > 1 ? 's' : ''}</span>
                <span>{crewIncluded ? 'With crew' : 'Bareboat'}</span>
                <span className="text-blue-600 font-medium">{BUDGET_RANGES.find(b => b.id === budgetRange)?.label}</span>
                {legs.reduce((sum, l) => sum + (l.services?.length || 0), 0) > 0 && (
                  <span>{legs.reduce((sum, l) => sum + (l.services?.length || 0), 0)} services</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!canSubmit}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                canSubmit
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Check size={16} />
              {isEditing ? 'Update Journey' : 'Add to Cart'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Our coordinators will provide a detailed quote based on your itinerary
          </p>
        </div>
      </div>
    </div>
  );
};

export default YachtJourneyBuilder;
