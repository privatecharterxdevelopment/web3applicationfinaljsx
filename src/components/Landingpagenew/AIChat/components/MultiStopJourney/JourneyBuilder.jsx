import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, Plus, Plane, MapPin, Clock, Route, ArrowRight,
  AlertTriangle, Fuel, Calendar, Users, ChevronDown, ChevronUp,
  Trash2, GripVertical, Check
} from 'lucide-react';
import airportsJsonService from '../../../../../services/airportsJsonService';
import {
  calculateMultiStopRoute,
  formatDuration,
  formatMultiStopRoute,
  kmToNm
} from '../../utils/routeCalculator';
import LegCard from './LegCard';
import AddStopModal from './AddStopModal';
import OvernightWarning from './OvernightWarning';
import FuelNotice from './FuelNotice';

const OVERNIGHT_THRESHOLD_MINUTES = 480; // 8 hours

// Duration options in minutes
const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: '8 hours', value: 480 },
  { label: 'Overnight', value: 720 },
  { label: 'Custom', value: 'custom' }
];

const JourneyBuilder = ({
  jet,
  initialOrigin,
  initialDestination,
  onAddToCart,
  onClose,
  existingStops = [],
  isEditing = false
}) => {
  // Origin and destination state
  const [origin, setOrigin] = useState(initialOrigin || null);
  const [destination, setDestination] = useState(initialDestination || null);
  const [stops, setStops] = useState(existingStops);

  // UI state
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [addStopIndex, setAddStopIndex] = useState(null); // null = add at end, number = insert at index
  const [editingStopIndex, setEditingStopIndex] = useState(null);
  const [showOvernightWarning, setShowOvernightWarning] = useState(false);
  const [overnightStopData, setOvernightStopData] = useState(null);
  const [expandedSection, setExpandedSection] = useState('route');

  // Travel details
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('09:00');
  const [passengers, setPassengers] = useState(1);

  // Origin/destination search
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [showOriginResults, setShowOriginResults] = useState(false);
  const [showDestResults, setShowDestResults] = useState(false);

  // Calculate route details whenever stops change
  const routeDetails = useMemo(() => {
    if (!origin || !destination || !jet) return null;

    const itemWithCoords = {
      ...jet,
      from: origin.city,
      from_city: origin.city,
      from_iata: origin.code,
      originLat: origin.lat,
      originLng: origin.lng,
      to: destination.city,
      to_city: destination.city,
      to_iata: destination.code,
      destLat: destination.lat,
      destLng: destination.lng,
      departure_time: departureTime,
      hourly_rate_eur: jet.hourly_rate_eur || jet.hourly_rate || 0
    };

    return calculateMultiStopRoute(itemWithCoords, stops);
  }, [origin, destination, stops, jet, departureTime]);

  // Detect overnight stays
  const overnightStops = useMemo(() => {
    return stops
      .map((stop, index) => ({ ...stop, index }))
      .filter(stop => stop.stopDuration >= OVERNIGHT_THRESHOLD_MINUTES);
  }, [stops]);

  // Check if new stop creates overnight
  useEffect(() => {
    if (overnightStops.length > 0 && !showOvernightWarning) {
      const lastOvernight = overnightStops[overnightStops.length - 1];
      if (!lastOvernight.acknowledgedOvernight) {
        setOvernightStopData(lastOvernight);
        setShowOvernightWarning(true);
      }
    }
  }, [overnightStops]);

  // Range validation
  const rangeErrors = useMemo(() => {
    if (!routeDetails?.legs || !jet) return [];

    const jetRangeNm = (jet.range_km || 5000) / 1.852;
    const safetyBuffer = 1.2; // 20% safety margin

    return routeDetails.legs
      .map((leg, index) => {
        const legDistanceNm = kmToNm(leg.distance);
        if (legDistanceNm * safetyBuffer > jetRangeNm) {
          return {
            leg: index + 1,
            from: leg.from,
            to: leg.to,
            distance: Math.round(legDistanceNm),
            maxRange: Math.round(jetRangeNm)
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [routeDetails, jet]);

  // Handle airport search
  const handleOriginSearch = useCallback(async (query) => {
    setOriginSearch(query);
    if (query.length >= 2) {
      const results = await airportsJsonService.searchAirports(query);
      setOriginResults(results.slice(0, 8));
      setShowOriginResults(true);
    } else {
      setOriginResults([]);
      setShowOriginResults(false);
    }
  }, []);

  const handleDestSearch = useCallback(async (query) => {
    setDestSearch(query);
    if (query.length >= 2) {
      const results = await airportsJsonService.searchAirports(query);
      setDestResults(results.slice(0, 8));
      setShowDestResults(true);
    } else {
      setDestResults([]);
      setShowDestResults(false);
    }
  }, []);

  const selectOrigin = (airport) => {
    setOrigin({
      name: airport.name,
      code: airport.code,
      city: airport.city,
      country: airport.country,
      lat: airport.lat,
      lng: airport.lon
    });
    setOriginSearch(`${airport.city} (${airport.code})`);
    setShowOriginResults(false);
  };

  const selectDestination = (airport) => {
    setDestination({
      name: airport.name,
      code: airport.code,
      city: airport.city,
      country: airport.country,
      lat: airport.lat,
      lng: airport.lon
    });
    setDestSearch(`${airport.city} (${airport.code})`);
    setShowDestResults(false);
  };

  // Add stop handler
  const handleAddStop = (airport, duration = 120) => {
    const newStop = {
      name: airport.name,
      code: airport.code,
      city: airport.city,
      country: airport.country,
      lat: airport.lat,
      lng: airport.lon,
      stopDuration: duration,
      isOvernight: duration >= OVERNIGHT_THRESHOLD_MINUTES,
      acknowledgedOvernight: false
    };

    if (addStopIndex !== null) {
      // Insert at specific index
      const newStops = [...stops];
      newStops.splice(addStopIndex, 0, newStop);
      setStops(newStops);
    } else {
      // Add at end
      setStops([...stops, newStop]);
    }

    setShowAddStopModal(false);
    setAddStopIndex(null);
  };

  // Update stop duration
  const handleUpdateStopDuration = (index, duration) => {
    const newStops = [...stops];
    newStops[index] = {
      ...newStops[index],
      stopDuration: duration,
      isOvernight: duration >= OVERNIGHT_THRESHOLD_MINUTES,
      acknowledgedOvernight: duration >= OVERNIGHT_THRESHOLD_MINUTES ? false : newStops[index].acknowledgedOvernight
    };
    setStops(newStops);
  };

  // Remove stop
  const handleRemoveStop = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  // Acknowledge overnight warning
  const handleAcknowledgeOvernight = () => {
    if (overnightStopData) {
      const newStops = [...stops];
      newStops[overnightStopData.index] = {
        ...newStops[overnightStopData.index],
        acknowledgedOvernight: true
      };
      setStops(newStops);
    }
    setShowOvernightWarning(false);
    setOvernightStopData(null);
  };

  // Add journey to cart
  const handleAddToCart = () => {
    if (!origin || !destination || !jet) return;

    const hourlyRateUSD = jet.hourly_rate_usd || Math.round((jet.hourly_rate_eur || 0) * 1.09);

    const journeyItem = {
      ...jet,
      cartId: `journey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'jets',
      addedAt: new Date().toISOString(),

      // Origin/Destination
      from_city: origin.city,
      from_iata: origin.code,
      from_airport: origin.name,
      originLat: origin.lat,
      originLng: origin.lng,
      to_city: destination.city,
      to_iata: destination.code,
      to_airport: destination.name,
      destLat: destination.lat,
      destLng: destination.lng,

      // Multi-stop data
      isMultiStop: stops.length > 0,
      stops: stops.map(stop => ({
        ...stop,
        arrivalTime: null, // Will be calculated
        departureTime: null
      })),
      legs: routeDetails?.legs || [],

      // Route info
      route: formatMultiStopRoute(
        origin.code,
        stops,
        destination.code
      ),

      // Totals
      totalDistance: routeDetails?.totalDistance || 0,
      totalDistanceNm: kmToNm(routeDetails?.totalDistance || 0),
      totalFlightTime: routeDetails?.totalFlightTime || 0,
      flightTimeHours: routeDetails?.totalFlightTime || 0,
      estimatedDuration: formatDuration(routeDetails?.totalFlightTime || 0),
      billedHours: routeDetails?.billedHours || 1,

      // Pricing (in USD)
      hourly_rate_usd: hourlyRateUSD,
      estimatedPrice: (routeDetails?.billedHours || 1) * hourlyRateUSD,
      price: (routeDetails?.billedHours || 1) * hourlyRateUSD,
      basePrice: (routeDetails?.billedHours || 1) * hourlyRateUSD,
      priceCalculation: `${routeDetails?.billedHours || 1}h × $${hourlyRateUSD.toLocaleString()}/hr`,
      currency: 'USD',
      isEstimate: true,

      // Travel details
      departure_date: departureDate,
      departure_time: departureTime,
      passengers: passengers,

      // Flags
      hasOvernightStays: overnightStops.length > 0,
      overnightStopIndices: overnightStops.map(s => s.index),
      fuelIncluded: true,

      // Suggested transfers (for all arrival airports)
      suggestedTransfers: [
        ...stops.map(stop => ({
          airport: stop.code,
          city: stop.city,
          name: stop.name,
          isOvernight: stop.isOvernight,
          offered: false,
          cartId: null
        })),
        {
          airport: destination.code,
          city: destination.city,
          name: destination.name,
          isOvernight: false,
          offered: false,
          cartId: null
        }
      ]
    };

    onAddToCart(journeyItem);
    onClose();
  };

  const canAddToCart = origin && destination && rangeErrors.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Route size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Journey' : 'Build Multi-Stop Journey'}
              </h2>
              <p className="text-xs text-gray-500">{jet?.name || jet?.aircraft_model}</p>
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
          {/* Aircraft Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            {jet?.primaryImage && (
              <img
                src={jet.primaryImage}
                alt={jet.name}
                className="w-16 h-12 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{jet?.name || jet?.aircraft_model}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {jet?.max_passengers || jet?.capacity || '—'} pax
                </span>
                <span>{Math.round((jet?.range_km || 0) / 1.852)} nm range</span>
                <span>${(jet?.hourly_rate_usd || Math.round((jet?.hourly_rate_eur || 0) * 1.09)).toLocaleString()}/hr</span>
              </div>
            </div>
          </div>

          {/* Origin */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Departure</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </div>
              <input
                type="text"
                value={originSearch}
                onChange={(e) => handleOriginSearch(e.target.value)}
                onFocus={() => originResults.length > 0 && setShowOriginResults(true)}
                placeholder="Search airport or city..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
              />
              {showOriginResults && originResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {originResults.map((airport) => (
                    <button
                      key={airport.code}
                      onClick={() => selectOrigin(airport)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <span className="text-xs font-mono font-bold text-gray-900">{airport.code}</span>
                      <span className="text-sm text-gray-600">{airport.city}, {airport.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stops */}
          {stops.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Stops</label>
                <span className="text-xs text-gray-400">{stops.length} stop{stops.length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <div
                    key={`stop-${index}`}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border ${
                      stop.isOvernight ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-gray-400">
                      <GripVertical size={14} />
                      <div className={`w-3 h-3 rounded-full ${stop.isOvernight ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{stop.city}</span>
                        <span className="text-xs font-mono text-gray-500">({stop.code})</span>
                        {stop.isOvernight && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                            OVERNIGHT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{stop.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={stop.stopDuration}
                        onChange={(e) => handleUpdateStopDuration(index, parseInt(e.target.value))}
                        className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg"
                      >
                        {DURATION_OPTIONS.filter(d => d.value !== 'custom').map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveStop(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Stop Button */}
          <button
            onClick={() => {
              setAddStopIndex(null);
              setShowAddStopModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
          >
            <Plus size={16} />
            Add Stop
          </button>

          {/* Destination */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Arrival</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
              </div>
              <input
                type="text"
                value={destSearch}
                onChange={(e) => handleDestSearch(e.target.value)}
                onFocus={() => destResults.length > 0 && setShowDestResults(true)}
                placeholder="Search airport or city..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
              />
              {showDestResults && destResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {destResults.map((airport) => (
                    <button
                      key={airport.code}
                      onClick={() => selectDestination(airport)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <span className="text-xs font-mono font-bold text-gray-900">{airport.code}</span>
                      <span className="text-sm text-gray-600">{airport.city}, {airport.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Travel Details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Date</label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Time</label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Passengers</label>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >−</button>
                <span className="flex-1 text-center text-sm font-medium">{passengers}</span>
                <button
                  onClick={() => setPassengers(Math.min(jet?.max_passengers || 14, passengers + 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >+</button>
              </div>
            </div>
          </div>

          {/* Range Errors */}
          {rangeErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Range Exceeded</p>
                  {rangeErrors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600 mt-1">
                      Leg {err.leg} ({err.from} → {err.to}): {err.distance} nm exceeds aircraft range of {err.maxRange} nm
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Route Summary */}
          {routeDetails && origin && destination && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Route Summary</span>
                <span className="text-xs font-mono text-gray-500">
                  {formatMultiStopRoute(origin.code, stops, destination.code)}
                </span>
              </div>

              {/* Legs */}
              {routeDetails.legs?.length > 0 && (
                <div className="space-y-2">
                  {routeDetails.legs.map((leg, index) => (
                    <LegCard
                      key={index}
                      leg={leg}
                      index={index}
                      isLast={index === routeDetails.legs.length - 1}
                      stop={index < stops.length ? stops[index] : null}
                    />
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="pt-3 border-t border-gray-200 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Total Distance</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {Math.round(kmToNm(routeDetails.totalDistance))} nm
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      ({routeDetails.totalDistance.toLocaleString()} km)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Flight Time</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDuration(routeDetails.totalFlightTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Est. Price</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ~${((routeDetails.billedHours || 1) * (jet?.hourly_rate_usd || Math.round((jet?.hourly_rate_eur || 0) * 1.09))).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Price Calculation */}
              <p className="text-xs text-gray-500 text-center">
                {routeDetails.billedHours}h billed × ${(jet?.hourly_rate_usd || Math.round((jet?.hourly_rate_eur || 0) * 1.09)).toLocaleString()}/hr
              </p>
            </div>
          )}

          {/* Fuel Notice */}
          <FuelNotice />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                canAddToCart
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Check size={16} />
              {isEditing ? 'Update Journey' : 'Add Journey to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Stop Modal */}
      {showAddStopModal && (
        <AddStopModal
          onSelect={handleAddStop}
          onClose={() => {
            setShowAddStopModal(false);
            setAddStopIndex(null);
          }}
          previousPoint={addStopIndex === 0 ? origin : (stops[addStopIndex - 1] || origin)}
          nextPoint={addStopIndex === stops.length ? destination : (stops[addStopIndex] || destination)}
          jetRange={jet?.range_km}
        />
      )}

      {/* Overnight Warning */}
      {showOvernightWarning && overnightStopData && (
        <OvernightWarning
          stop={overnightStopData}
          onAcknowledge={handleAcknowledgeOvernight}
          onClose={() => setShowOvernightWarning(false)}
        />
      )}
    </div>
  );
};

export default JourneyBuilder;
