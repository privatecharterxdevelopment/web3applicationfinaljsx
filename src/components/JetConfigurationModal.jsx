import React, { useState } from 'react';
import { X, Plane, Calendar, Clock, Users, MapPin } from 'lucide-react';
import { airports } from '../data/airports.ts';

/**
 * Jet Configuration Modal
 * Allows users to configure private jet charter details before adding to cart
 */
const JetConfigurationModal = ({ jet, onClose, onAddToCart }) => {
  const [departureAirport, setDepartureAirport] = useState('');
  const [arrivalAirport, setArrivalAirport] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [passengers, setPassengers] = useState(jet.min_passengers || 1);
  const [searchDeparture, setSearchDeparture] = useState('');
  const [searchArrival, setSearchArrival] = useState('');

  // Convert airports object to array
  const airportsList = Object.entries(airports).map(([name, data]) => ({
    name,
    code: data.code,
    region: data.region,
    fullName: `${name} (${data.code})`
  }));

  // Filter airports based on search
  const filteredDepartureAirports = airportsList.filter(airport =>
    airport.fullName.toLowerCase().includes(searchDeparture.toLowerCase()) ||
    airport.code.toLowerCase().includes(searchDeparture.toLowerCase())
  ).slice(0, 10);

  const filteredArrivalAirports = airportsList.filter(airport =>
    airport.fullName.toLowerCase().includes(searchArrival.toLowerCase()) ||
    airport.code.toLowerCase().includes(searchArrival.toLowerCase())
  ).slice(0, 10);

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Calculate estimated price based on category hourly rate
  const estimatedPrice = jet.estimatedHourlyRate || 5000;
  const estimatedTotal = estimatedPrice * 3; // Assume 3 hours average flight

  const handleAddToCart = () => {
    if (!departureAirport || !arrivalAirport || !departureDate || !departureTime) {
      alert('Please fill in all required fields');
      return;
    }

    const configuredJet = {
      ...jet,
      departureAirport,
      arrivalAirport,
      departureDate,
      departureTime,
      passengers,
      estimatedTotal,
      type: 'custom_jet_request',
      name: `${jet.name || jet.model} - Custom Charter`,
      subtitle: `${departureAirport} → ${arrivalAirport} • ${departureDate} at ${departureTime}`,
      configured: true
    };

    onAddToCart(configuredJet);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Configure Charter</h2>
            <p className="text-sm text-gray-600 mt-1">{jet.name || jet.model}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Aircraft Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-4">
              {jet.image && (
                <img
                  src={jet.image}
                  alt={jet.name || jet.model}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{jet.name || jet.model}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>Category: {jet.category}</div>
                  <div>Capacity: {jet.min_passengers}-{jet.max_passengers} pax</div>
                  <div>Hourly Rate: {jet.priceRange}</div>
                  <div>Range: {jet.range_km ? `${jet.range_km.toLocaleString()} km` : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Departure Airport */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Departure Airport *
            </label>
            <input
              type="text"
              value={searchDeparture}
              onChange={(e) => setSearchDeparture(e.target.value)}
              placeholder="Search airport name or code..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            {searchDeparture && filteredDepartureAirports.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredDepartureAirports.map((airport) => (
                  <button
                    key={airport.code}
                    onClick={() => {
                      setDepartureAirport(airport.fullName);
                      setSearchDeparture(airport.fullName);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                  >
                    <div className="font-medium">{airport.name}</div>
                    <div className="text-xs text-gray-500">{airport.code} • {airport.region}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Arrival Airport */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Arrival Airport *
            </label>
            <input
              type="text"
              value={searchArrival}
              onChange={(e) => setSearchArrival(e.target.value)}
              placeholder="Search airport name or code..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            {searchArrival && filteredArrivalAirports.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredArrivalAirports.map((airport) => (
                  <button
                    key={airport.code}
                    onClick={() => {
                      setArrivalAirport(airport.fullName);
                      setSearchArrival(airport.fullName);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                  >
                    <div className="font-medium">{airport.name}</div>
                    <div className="text-xs text-gray-500">{airport.code} • {airport.region}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Departure Date *
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={minDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Departure Time *
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          {/* Passengers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="inline mr-1" />
              Number of Passengers *
            </label>
            <input
              type="number"
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
              min={jet.min_passengers || 1}
              max={jet.max_passengers || 18}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Capacity: {jet.min_passengers}-{jet.max_passengers} passengers
            </p>
          </div>

          {/* Price Estimate */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 mb-2">Estimated Price</h4>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              €{estimatedTotal.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">
              Based on {jet.priceRange} and estimated 3-hour flight. Final price will be calculated by operations team based on exact route, date, and aircraft availability.
            </p>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> This is a custom charter request. Our operations team will review your requirements and provide a detailed quote within 2-4 hours including all fees, taxes, and any additional services.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!departureAirport || !arrivalAirport || !departureDate || !departureTime}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default JetConfigurationModal;
