import React, { useState, useCallback, useEffect } from 'react';
import { X, Search, MapPin, Plane, Clock, AlertTriangle } from 'lucide-react';
import airportsJsonService from '../../../../../services/airportsJsonService';
import { kmToNm } from '../../utils/routeCalculator';

// Popular airports for quick selection
const POPULAR_AIRPORTS = [
  { code: 'LHR', city: 'London', country: 'UK' },
  { code: 'CDG', city: 'Paris', country: 'France' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'ZRH', city: 'Zurich', country: 'Switzerland' },
  { code: 'MXP', city: 'Milan', country: 'Italy' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain' },
  { code: 'DXB', city: 'Dubai', country: 'UAE' },
  { code: 'JFK', city: 'New York', country: 'USA' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore' },
  { code: 'HKG', city: 'Hong Kong', country: 'China' }
];

// Duration options in minutes
const DURATION_OPTIONS = [
  { label: '30 min', value: 30, description: 'Quick refuel' },
  { label: '1 hour', value: 60, description: 'Short stop' },
  { label: '2 hours', value: 120, description: 'Business meeting' },
  { label: '4 hours', value: 240, description: 'Extended stop' },
  { label: '8 hours', value: 480, description: 'Half day' },
  { label: 'Overnight', value: 720, description: '12+ hours' }
];

const AddStopModal = ({ onSelect, onClose, previousPoint, nextPoint, jetRange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [stopDuration, setStopDuration] = useState(120); // Default 2 hours
  const [customDuration, setCustomDuration] = useState('');

  // Calculate distance from previous point
  const calculateDistanceFromPrev = useCallback((airport) => {
    if (!previousPoint?.lat || !airport?.lat) return null;

    const R = 6371; // Earth's radius in km
    const dLat = (airport.lat - previousPoint.lat) * Math.PI / 180;
    const dLon = (airport.lon - previousPoint.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(previousPoint.lat * Math.PI / 180) * Math.cos(airport.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, [previousPoint]);

  // Check if airport is within jet range
  const isWithinRange = useCallback((airport) => {
    if (!jetRange || !previousPoint?.lat) return true;
    const distance = calculateDistanceFromPrev(airport);
    if (!distance) return true;
    const safeRange = jetRange / 1.2; // 20% safety buffer
    return distance <= safeRange;
  }, [jetRange, calculateDistanceFromPrev, previousPoint]);

  // Search airports
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setIsSearching(true);
      const results = await airportsJsonService.searchAirports(query);
      setSearchResults(results.slice(0, 10));
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, []);

  // Select airport from popular list
  const handleSelectPopular = async (popular) => {
    const results = await airportsJsonService.searchAirports(popular.code);
    if (results.length > 0) {
      setSelectedAirport(results[0]);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!selectedAirport) return;

    const duration = stopDuration === 'custom' ? parseInt(customDuration) || 120 : stopDuration;
    onSelect(selectedAirport, duration);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Add Stop</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search airport or city..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
              autoFocus
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 px-1">Search Results</p>
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                {searchResults.map((airport) => {
                  const distance = calculateDistanceFromPrev(airport);
                  const withinRange = isWithinRange(airport);

                  return (
                    <button
                      key={airport.code}
                      onClick={() => setSelectedAirport(airport)}
                      className={`w-full px-3 py-2 text-left flex items-center gap-3 transition-colors ${
                        selectedAirport?.code === airport.code
                          ? 'bg-gray-900 text-white'
                          : withinRange
                            ? 'hover:bg-gray-100'
                            : 'opacity-50'
                      }`}
                    >
                      <span className={`text-xs font-mono font-bold ${
                        selectedAirport?.code === airport.code ? 'text-white' : 'text-gray-900'
                      }`}>
                        {airport.code}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${
                          selectedAirport?.code === airport.code ? 'text-white' : 'text-gray-700'
                        }`}>
                          {airport.city}, {airport.country}
                        </p>
                        <p className={`text-xs truncate ${
                          selectedAirport?.code === airport.code ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {airport.name}
                        </p>
                      </div>
                      {distance && (
                        <span className={`text-xs ${
                          selectedAirport?.code === airport.code ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {Math.round(kmToNm(distance))} nm
                        </span>
                      )}
                      {!withinRange && (
                        <AlertTriangle size={14} className="text-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popular Airports */}
          {!searchQuery && !selectedAirport && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 px-1">Popular Airports</p>
              <div className="grid grid-cols-3 gap-2">
                {POPULAR_AIRPORTS.map((airport) => (
                  <button
                    key={airport.code}
                    onClick={() => handleSelectPopular(airport)}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors"
                  >
                    <p className="text-xs font-mono font-bold text-gray-900">{airport.code}</p>
                    <p className="text-[10px] text-gray-500">{airport.city}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Airport & Duration */}
          {selectedAirport && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              {/* Selected Airport Display */}
              <div className="p-3 bg-gray-900 text-white rounded-xl">
                <div className="flex items-center gap-3">
                  <Plane size={18} />
                  <div>
                    <p className="text-sm font-medium">
                      {selectedAirport.city} ({selectedAirport.code})
                    </p>
                    <p className="text-xs text-gray-400">{selectedAirport.name}</p>
                  </div>
                </div>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Stop Duration</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStopDuration(option.value)}
                      className={`px-3 py-2 rounded-lg text-center transition-colors ${
                        stopDuration === option.value
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <p className="text-xs font-medium">{option.label}</p>
                      <p className={`text-[10px] ${
                        stopDuration === option.value ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Overnight Warning */}
              {stopDuration >= 480 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-700">Overnight Stop</p>
                    <p className="text-[10px] text-amber-600">
                      This requires double confirmation from our coordinators and may affect aircraft availability.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
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
              onClick={handleConfirm}
              disabled={!selectedAirport}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                selectedAirport
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Add Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStopModal;
