import React, { useState, useEffect } from 'react';
import { Car, Plane, FileText, Clock, Check, X, ChevronRight, Search, Filter, AlertTriangle } from 'lucide-react';
import { getUserRequests } from '../services/requests';
import { formatDistanceToNow } from 'date-fns';
import ReviewDisputeModal from './Modals/ReviewDisputeModal';

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
    const data = request.data;
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
    <div className="w-full h-full p-6 overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">My Requests</h1>
          <p className="text-sm text-gray-600 mt-1">Track all your service requests</p>
        </div>
      </div>

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
          {filteredRequests.map((request) => (
            <div key={request.id}>
              {request.type === 'taxi_concierge' ? renderTaxiRequest(request) : renderGenericRequest(request)}
            </div>
          ))}
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
