import React, { useState, useEffect } from 'react';
import { Car, Plane, FileText, Clock, Check, X, ChevronRight, Search, Filter, AlertTriangle } from 'lucide-react';
import { getUserRequests } from '../services/requests';
import { formatDistanceToNow } from 'date-fns';
import ReviewDisputeModal from './modals/ReviewDisputeModal';

const MyRequestsView = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { requests: data, error } = await getUserRequests(user.id);
      if (!error && data) {
        console.log('📥 Loaded requests:', data);
        console.log('📊 Request types:', data.map(r => ({ id: r.id.slice(0,8), type: r.type, dataType: typeof r.data })));
        setRequests(data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    if (status === 'pending') return <Clock size={16} />;
    if (status === 'confirmed' || status === 'completed') return <Check size={16} />;
    if (status === 'rejected' || status === 'cancelled') return <X size={16} />;
    return <Clock size={16} />;
  };

  const getTypeIcon = (type) => {
    if (type === 'taxi_concierge') return <Car size={24} />;
    if (type.includes('jet') || type.includes('helicopter')) return <Plane size={24} />;
    return <FileText size={24} />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      taxi_concierge: 'Taxi/Concierge',
      private_jet_charter: 'Private Jet Charter',
      helicopter_charter: 'Helicopter Charter',
      empty_leg: 'Empty Leg',
      luxury_car_rental: 'Luxury Car Rental',
      luxury_car: 'Luxury Car',
      adventure_package: 'Adventure Package',
      co2_certificate: 'CO2 Certificate',
      fixed_offer: 'Fixed Offer',
      spv_formation: 'SPV Formation',
      tokenization: 'Asset Tokenization'
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = searchQuery === '' ||
      getTypeLabel(req.type).toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(req.data).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderTaxiRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          {/* Car Image */}
          {data.carImage && (
            <div className="flex-shrink-0">
              <img src={data.carImage} alt={data.carName} className="w-24 h-16 object-contain rounded-lg bg-white p-2" />
            </div>
          )}

          {/* Request Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Car size={18} className="text-gray-700" />
                  <h3 className="text-base font-semibold text-gray-800">{data.carName}</h3>
                </div>
                <p className="text-xs text-gray-600">{data.carSeats} seats</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Route Info */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-black"></div>
                <span className="text-sm text-gray-800 font-medium">{data.from}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-800 font-medium">{data.to}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Distance</p>
                <p className="text-sm font-semibold text-gray-800">{data.distance} km</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">ETA</p>
                <p className="text-sm font-semibold text-gray-800">{data.eta} min</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Pickup Time</p>
                <p className="text-sm font-semibold text-gray-800">{data.pickupDate === 'Now' ? 'Now' : `${data.pickupDate} ${data.pickupTime}`}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Passengers</p>
                <p className="text-sm font-semibold text-gray-800">{data.passengers}</p>
              </div>
            </div>

            {/* Price */}
            <div className="p-3 bg-gradient-to-r from-gray-800 to-black rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-300">Estimated Price</p>
                <p className="text-base font-bold text-white">{data.priceRange}</p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {/* Dispute Button - Only show for completed rides */}
            {request.status === 'completed' && (
              <div className="mt-4">
                {!request.disputed ? (
                  <button
                    onClick={() => {
                      setSelectedBooking(request);
                      setShowDisputeModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <AlertTriangle size={16} />
                    Dispute Payment
                  </button>
                ) : (
                  <div className="text-center py-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-700 font-medium">⚠ Dispute Submitted - Admin will contact you</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyLegRequest = (request) => {
    // Parse data if it's a string
    let data = request.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = {};
      }
    }
    data = data || {};
    console.log('Rendering Empty Leg Request:', { type: request.type, data });
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Plane size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">Empty Leg Flight</h3>
                <p className="text-sm text-gray-700 font-medium">{data.flight_route || `${data.from_city} → ${data.to_city}`}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Route Info */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-black"></div>
                <span className="text-sm text-gray-800 font-medium">{data.from_city || data.from_iata}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span className="text-sm text-gray-800 font-medium">{data.to_city || data.to_iata}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {data.aircraft_type && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Aircraft</p>
                  <p className="text-sm font-semibold text-gray-800">{data.aircraft_type}</p>
                </div>
              )}
              {data.departure_date && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Departure</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(data.departure_date).toLocaleDateString()}</p>
                </div>
              )}
              {data.passengers && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Passengers</p>
                  <p className="text-sm font-semibold text-gray-800">{data.passengers}</p>
                </div>
              )}
              {data.luggage && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Luggage</p>
                  <p className="text-sm font-semibold text-gray-800">{data.luggage}</p>
                </div>
              )}
            </div>

            {/* Price */}
            {data.price && (
              <div className="p-3 bg-gradient-to-r from-pink-600 to-pink-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-pink-100">Price</p>
                  <p className="text-base font-bold text-white">{typeof data.price === 'number' ? `$${data.price.toLocaleString()}` : data.price}</p>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAdventureRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Plane size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">{data.adventure_name || 'Adventure Package'}</h3>
                <p className="text-xs text-gray-600">Package ID: {data.adventure_id || request.id.slice(0, 8)}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {data.destination && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Destination</p>
                  <p className="text-sm font-semibold text-gray-800">{data.destination}</p>
                </div>
              )}
              {data.duration && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-gray-800">{data.duration}</p>
                </div>
              )}
              {(data.participants || data.guests) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Guests</p>
                  <p className="text-sm font-semibold text-gray-800">{data.guests || data.participants}</p>
                </div>
              )}
              {data.start_date && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Start Date</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(data.start_date).toLocaleDateString()}</p>
                </div>
              )}
              {data.end_date && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">End Date</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(data.end_date).toLocaleDateString()}</p>
                </div>
              )}
              {data.payment_method === 'crypto' && data.crypto_currency && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                  <p className="text-sm font-semibold text-gray-800">💰 {data.crypto_currency}</p>
                </div>
              )}
            </div>

            {/* Activities */}
            {data.activities && Array.isArray(data.activities) && data.activities.length > 0 && (
              <div className="mb-3 p-3 bg-amber-50 rounded-lg">
                <p className="text-xs font-medium text-amber-900 mb-2">Activities:</p>
                <div className="flex flex-wrap gap-1">
                  {data.activities.map((activity, idx) => (
                    <span key={idx} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            {data.price && (
              <div className="p-3 bg-gradient-to-r from-amber-600 to-amber-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-amber-100">Total Price</p>
                  <p className="text-base font-bold text-white">{typeof data.price === 'number' ? `$${data.price.toLocaleString()}` : data.price}</p>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLuxuryCarRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Car size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">{data.car_name || `${data.brand} ${data.model}`}</h3>
                <p className="text-xs text-gray-600">{data.category || 'Luxury Car Rental'}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {data.year && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Year</p>
                  <p className="text-sm font-semibold text-gray-800">{data.year}</p>
                </div>
              )}
              {data.rental_duration_type && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Rental Duration</p>
                  <p className="text-sm font-semibold text-gray-800">{data.rental_duration_count} {data.rental_duration_type}</p>
                </div>
              )}
              {data.pickup_date && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Pickup</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(data.pickup_date).toLocaleDateString()} {data.pickup_time}</p>
                </div>
              )}
              {data.dropoff_date && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Dropoff</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(data.dropoff_date).toLocaleDateString()} {data.dropoff_time}</p>
                </div>
              )}
            </div>

            {/* Location Info */}
            {(data.pickup_location || data.dropoff_location) && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                {data.pickup_location && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-black"></div>
                    <span className="text-sm text-gray-800 font-medium">{data.pickup_location}</span>
                  </div>
                )}
                {data.dropoff_location && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-800 font-medium">{data.dropoff_location}</span>
                  </div>
                )}
              </div>
            )}

            {/* Price */}
            {(data.total_price || data.estimated_price) && (
              <div className="p-3 bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-300">Total Price</p>
                  <p className="text-base font-bold text-white">
                    {typeof (data.total_price || data.estimated_price) === 'number'
                      ? `$${(data.total_price || data.estimated_price).toLocaleString()}`
                      : (data.total_price || data.estimated_price)}
                  </p>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPrivateJetRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Plane size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">Private Jet Charter</h3>
                <p className="text-sm text-gray-700 font-medium">{data.aircraft_model || data.manufacturer}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {data.passenger_capacity && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Capacity</p>
                  <p className="text-sm font-semibold text-gray-800">{data.passenger_capacity} passengers</p>
                </div>
              )}
              {data.range && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Range</p>
                  <p className="text-sm font-semibold text-gray-800">{data.range}</p>
                </div>
              )}
              {data.has_nft && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                    <span className="text-sm text-purple-800">🎫 NFT Discount Applied: {data.nft_discount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHelicopterRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Plane size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">Helicopter Charter</h3>
                <p className="text-sm text-gray-700 font-medium">{data.helicopter_name || data.manufacturer}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {data.passengers && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Passengers</p>
                  <p className="text-sm font-semibold text-gray-800">{data.passengers}</p>
                </div>
              )}
              {data.flight_duration && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-gray-800">{data.flight_duration} hours</p>
                </div>
              )}
              {data.hourly_rate && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Hourly Rate</p>
                  <p className="text-sm font-semibold text-gray-800">${data.hourly_rate}/hr</p>
                </div>
              )}
            </div>

            {/* Special Requests */}
            {data.special_requests && (
              <div className="mb-3 p-3 bg-teal-50 rounded-lg">
                <p className="text-xs font-medium text-teal-900 mb-1">Special Requests:</p>
                <p className="text-xs text-teal-800">{data.special_requests}</p>
              </div>
            )}

            {/* Price */}
            {(data.discounted_price || data.total_price) && (
              <div className="p-3 bg-gradient-to-r from-teal-600 to-teal-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-teal-100">Total Price</p>
                  <p className="text-base font-bold text-white">
                    ${(data.discounted_price || data.total_price).toLocaleString()}
                  </p>
                </div>
                {data.has_nft && data.nft_discount && (
                  <p className="text-xs text-teal-100 mt-1">🎫 NFT Discount: {data.nft_discount}</p>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCO2CertificateRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <FileText size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">CO2 Offset Certificate</h3>
                <p className="text-sm text-gray-700 font-medium">{data.project_name}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Project Info */}
            <div className="mb-3 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-900 mb-1">
                <span className="font-medium">Provider:</span> {data.ngo_provider}
              </p>
              <p className="text-xs text-green-900">
                <span className="font-medium">Location:</span> {data.location}, {data.country}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {data.quantity_tons && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Quantity</p>
                  <p className="text-sm font-semibold text-gray-800">{data.quantity_tons} tons CO2</p>
                </div>
              )}
              {data.certification_standard && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Standard</p>
                  <p className="text-sm font-semibold text-gray-800">{data.certification_standard}</p>
                </div>
              )}
              {data.category && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Category</p>
                  <p className="text-sm font-semibold text-gray-800">{data.category}</p>
                </div>
              )}
              {data.payment_method && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Payment</p>
                  <p className="text-sm font-semibold text-gray-800">{data.payment_method}</p>
                </div>
              )}
            </div>

            {/* Price */}
            {data.total_price && (
              <div className="p-3 bg-gradient-to-r from-green-600 to-green-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-100">Total Price</p>
                  <p className="text-base font-bold text-white">${data.total_price.toLocaleString()} {data.currency}</p>
                </div>
                {data.price_per_ton && (
                  <p className="text-xs text-green-100 mt-1">${data.price_per_ton}/ton</p>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFixedOfferRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Plane size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">{data.offer_title}</h3>
                <p className="text-xs text-gray-600">Fixed Offer</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Route Info */}
            {(data.origin || data.offer_origin) && (data.destination || data.offer_destination) && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-black"></div>
                  <span className="text-sm text-gray-800 font-medium">{data.origin || data.offer_origin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-sm text-gray-800 font-medium">{data.destination || data.offer_destination}</span>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {(data.offer_aircraft_type || data.aircraft_type) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Aircraft</p>
                  <p className="text-sm font-semibold text-gray-800">{data.offer_aircraft_type || data.aircraft_type}</p>
                </div>
              )}
              {(data.departure_date || data.departure_date_formatted) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Departure</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {data.departure_date_formatted || new Date(data.departure_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {(data.offer_passengers || data.passengers) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Passengers</p>
                  <p className="text-sm font-semibold text-gray-800">{data.offer_passengers || data.passengers}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {data.offer_description && (
              <div className="mb-3 p-3 bg-cyan-50 rounded-lg">
                <p className="text-xs text-cyan-900">{data.offer_description}</p>
              </div>
            )}

            {/* Message */}
            {data.message && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-900 mb-1">Your Message:</p>
                <p className="text-xs text-gray-800">{data.message}</p>
              </div>
            )}

            {/* Price */}
            {(data.offer_price || data.price) && (
              <div className="p-3 bg-gradient-to-r from-cyan-600 to-cyan-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-cyan-100">Price</p>
                  <p className="text-base font-bold text-white">
                    {typeof (data.offer_price || data.price) === 'number'
                      ? `${(data.offer_price || data.price).toLocaleString()} ${data.offer_currency || data.currency || 'USD'}`
                      : (data.offer_price || data.price)}
                  </p>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGenericRequest = (request) => {
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-xl flex items-center justify-center text-white flex-shrink-0">
            {getTypeIcon(request.type)}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">{getTypeLabel(request.type)}</h3>
                <p className="text-xs text-gray-600">Request ID: {request.id.slice(0, 8)}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </div>

            {request.admin_notes && (
              <div className="p-3 bg-blue-50 rounded-lg mb-3">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full px-6 pt-3 pb-6 overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requests..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all"
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white/35 border border-gray-300/50 rounded-xl p-1" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          {['all', 'pending', 'confirmed', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === status
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-sm text-gray-600">Loading requests...</div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-600">No requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            // Route to specific render function based on request type
            switch (request.type) {
              case 'taxi_concierge':
                return <div key={request.id}>{renderTaxiRequest(request)}</div>;
              case 'empty_leg':
                return <div key={request.id}>{renderEmptyLegRequest(request)}</div>;
              case 'adventure_package':
                return <div key={request.id}>{renderAdventureRequest(request)}</div>;
              case 'luxury_car':
              case 'luxury_car_rental':
                return <div key={request.id}>{renderLuxuryCarRequest(request)}</div>;
              case 'private_jet_charter':
                return <div key={request.id}>{renderPrivateJetRequest(request)}</div>;
              case 'helicopter_charter':
                return <div key={request.id}>{renderHelicopterRequest(request)}</div>;
              case 'co2_certificate':
                return <div key={request.id}>{renderCO2CertificateRequest(request)}</div>;
              case 'fixed_offer':
                return <div key={request.id}>{renderFixedOfferRequest(request)}</div>;
              default:
                return <div key={request.id}>{renderGenericRequest(request)}</div>;
            }
          })}
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && selectedBooking && (
        <ReviewDisputeModal
          booking={selectedBooking}
          mode="dispute"
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedBooking(null);
            loadRequests(); // Reload to show updated dispute status
          }}
        />
      )}
    </div>
  );
};

export default MyRequestsView;
