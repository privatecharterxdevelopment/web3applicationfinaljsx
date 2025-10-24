import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Users, MapPin, Plane, DollarSign,
  Edit2, Check, X, ShoppingCart, Leaf, ChevronDown
} from 'lucide-react';

/**
 * Unified Booking Card Component
 *
 * Supports all service types: jets, helicopters, cars, yachts, adventures
 * Features:
 * - Date/time modification (except empty legs)
 * - Passenger count adjustment
 * - CO2 certificate selection
 * - Real-time price estimation
 * - Add to cart functionality
 */
const BookingCard = ({ item, serviceType, onAddToCart }) => {
  // Booking modification state
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(item.departure_date || item.date || getTomorrowDate());
  const [time, setTime] = useState(item.departure_time || '09:00');
  const [passengers, setPassengers] = useState(item.max_passengers || item.passenger_capacity || 1);
  const [showCO2Options, setShowCO2Options] = useState(false);
  const [selectedCO2Project, setSelectedCO2Project] = useState('rainforest');
  const [certificateType, setCertificateType] = useState('classic');

  // Pricing calculation
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [co2Emissions, setCo2Emissions] = useState(0);
  const [co2Cost, setCo2Cost] = useState(0);

  // Check if this service type allows modifications
  const isEmptyLeg = serviceType === 'empty-legs';
  const canModifyDateTime = !isEmptyLeg;

  // Get max passengers for this service
  const maxPassengers = item.max_passengers || item.passenger_capacity || item.seats || item.max_guests || 12;

  // CO2 Projects
  const co2Projects = [
    {
      id: 'rainforest',
      name: 'Rainforest Conservation - Amazon',
      location: 'Brazil',
      icon: '🌳',
      description: 'REDD+ Forest Protection - Protects 50,000 hectares'
    },
    {
      id: 'wind',
      name: 'Wind Energy - India',
      location: 'Tamil Nadu, India',
      icon: '💨',
      description: '250 MW clean energy capacity'
    },
    {
      id: 'ocean',
      name: 'Ocean Cleanup - Pacific',
      location: 'Pacific Ocean',
      icon: '🌊',
      description: 'Removes 1 ton of plastic per ton CO₂'
    },
    {
      id: 'solar',
      name: 'Solar Farms - Morocco',
      location: 'Morocco',
      icon: '☀️',
      description: '500 MW solar capacity'
    }
  ];

  // CO2 emission rates (tons per km)
  const co2Rates = {
    'Very Light Jet': 0.00053,
    'Light Jet': 0.00080,
    'Midsize Jet': 0.00107,
    'Super Midsize': 0.00133,
    'Heavy Jet': 0.00160,
    'Ultra Long Range': 0.00187,
    'VIP Airliner': 0.00240,
    'Turboprop': 0.00035,
    'Helicopter': 0.00040
  };

  // Calculate estimated price and CO2
  useEffect(() => {
    calculateEstimates();
  }, [date, time, passengers]);

  function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.setDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  function calculateEstimates() {
    let basePrice = 0;
    let distance = 0;
    let emissionRate = 0;

    // Calculate base price based on service type
    switch (serviceType) {
      case 'empty-legs':
        basePrice = item.price || 0;
        distance = item.distance_km || 0;
        emissionRate = co2Rates[item.category] || 0.00107;
        break;

      case 'jets':
        const hourlyRate = item.hourly_rate || 0;
        const estimatedHours = 2; // Default estimate
        basePrice = hourlyRate * estimatedHours;
        distance = estimatedHours * 800; // Rough km estimate
        emissionRate = co2Rates[item.category] || 0.00107;
        break;

      case 'helicopters':
        const heliRate = item.hourly_rate || 0;
        const heliHours = 1; // Default estimate
        basePrice = heliRate * heliHours;
        distance = heliHours * 200;
        emissionRate = co2Rates['Helicopter'] || 0.00040;
        break;

      case 'luxury-cars':
        const dailyRate = item.daily_rate || 0;
        basePrice = dailyRate;
        emissionRate = 0; // Cars handled separately
        break;

      case 'yachts':
        const yachtDailyRate = item.daily_rate || 0;
        const days = 3; // Default estimate
        basePrice = yachtDailyRate * days;
        break;

      case 'adventures':
        basePrice = item.price_from || 0;
        break;

      default:
        basePrice = item.price || 0;
    }

    // Calculate CO2 emissions
    const emissions = distance * emissionRate;
    const co2Price = emissions * 80; // €80 per ton

    setEstimatedPrice(basePrice);
    setCo2Emissions(emissions);
    setCo2Cost(co2Price);
  }

  const handleAddToCart = () => {
    const cartItem = {
      ...item,
      serviceType,
      modifiedDate: date,
      modifiedTime: time,
      modifiedPassengers: passengers,
      co2Certificate: {
        included: isEmptyLeg,
        type: certificateType,
        project: selectedCO2Project,
        emissions: co2Emissions,
        cost: isEmptyLeg ? 0 : co2Cost
      },
      estimatedPrice: estimatedPrice + (isEmptyLeg ? 0 : co2Cost),
      addedAt: new Date().toISOString()
    };

    if (onAddToCart) {
      onAddToCart(cartItem);
    }
  };

  const formatPrice = (price) => {
    return `CHF ${price.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with Image */}
      <div className="relative h-48 bg-gray-100">
        <img
          src={item.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={item.title || item.name || item.aircraft_type}
          className="w-full h-full object-cover"
        />
        {isEmptyLeg && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Empty Leg - Save 50%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {item.aircraft_type || item.title || item.name || `${item.manufacturer} ${item.model}`}
        </h3>

        {/* Route (for jets/helicopters/empty legs) */}
        {(item.from_city || item.departure_city) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPin size={16} />
            <span>{item.from_city || item.departure_city} → {item.to_city || item.arrival_city}</span>
          </div>
        )}

        {/* Modification Section */}
        <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Booking Details</span>
            {canModifyDateTime && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
                {isEditing ? 'Done' : 'Modify'}
              </button>
            )}
          </div>

          {/* Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>Date</span>
            </div>
            {isEditing && canModifyDateTime ? (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                min={getTomorrowDate()}
              />
            ) : (
              <span className="text-sm font-medium text-gray-900">
                {new Date(date).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>

          {/* Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>Time</span>
            </div>
            {isEditing && canModifyDateTime ? (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
            ) : (
              <span className="text-sm font-medium text-gray-900">
                {time || 'TBD'}
                {isEmptyLeg && <span className="ml-2 text-xs text-gray-500">(Fixed)</span>}
              </span>
            )}
          </div>

          {/* Passengers */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users size={16} />
              <span>Passengers</span>
            </div>
            {isEditing && canModifyDateTime ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                >
                  -
                </button>
                <span className="text-sm font-medium w-8 text-center">{passengers}</span>
                <button
                  onClick={() => setPassengers(Math.min(maxPassengers, passengers + 1))}
                  className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-900">
                {passengers} / {maxPassengers}
              </span>
            )}
          </div>

          {isEmptyLeg && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠️ Empty legs have fixed dates and times (aircraft repositioning)
            </div>
          )}
        </div>

        {/* CO2 Certificate Section */}
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <button
            onClick={() => setShowCO2Options(!showCO2Options)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Leaf className="text-green-600" size={18} />
              <span className="text-sm font-semibold text-green-900">
                CO₂ Certificate {isEmptyLeg && '(FREE Included)'}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-green-600 transition-transform ${showCO2Options ? 'rotate-180' : ''}`}
            />
          </button>

          {showCO2Options && (
            <div className="mt-3 space-y-3">
              {/* Emissions Info */}
              {co2Emissions > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Estimated CO₂:</span>
                  <span className="font-semibold text-gray-900">{co2Emissions.toFixed(2)} tons</span>
                </div>
              )}

              {/* Certificate Type */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">Certificate Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCertificateType('classic')}
                    className={`px-3 py-2 text-xs rounded border ${
                      certificateType === 'classic'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    📄 Classic PDF
                  </button>
                  <button
                    onClick={() => setCertificateType('blockchain')}
                    className={`px-3 py-2 text-xs rounded border ${
                      certificateType === 'blockchain'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    🔗 NFT Certificate
                  </button>
                </div>
              </div>

              {/* Project Selection */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">Support Project</label>
                <div className="space-y-2">
                  {co2Projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedCO2Project(project.id)}
                      className={`w-full p-2 text-left rounded border transition-colors ${
                        selectedCO2Project === project.id
                          ? 'bg-green-100 border-green-500'
                          : 'bg-white border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{project.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate">
                            {project.name}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {project.description}
                          </div>
                        </div>
                        {selectedCO2Project === project.id && (
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {!isEmptyLeg && co2Cost > 0 && (
                <div className="flex justify-between text-xs pt-2 border-t border-green-200">
                  <span className="text-gray-600">Certificate Cost:</span>
                  <span className="font-semibold text-green-700">+ {formatPrice(co2Cost)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Base Price:</span>
            <span className="text-sm font-medium text-gray-900">{formatPrice(estimatedPrice)}</span>
          </div>
          {!isEmptyLeg && co2Cost > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">CO₂ Certificate:</span>
              <span className="text-sm font-medium text-gray-900">{formatPrice(co2Cost)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-gray-300">
            <span className="text-base font-semibold text-gray-900">Estimated Total:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(estimatedPrice + (isEmptyLeg ? 0 : co2Cost))}
            </span>
          </div>
          {serviceType === 'jets' && (
            <p className="text-xs text-gray-500 mt-1">* Final price depends on route and flight time</p>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default BookingCard;
