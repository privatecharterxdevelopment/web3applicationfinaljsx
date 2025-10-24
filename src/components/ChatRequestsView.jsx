import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Users, DollarSign, Package, Clock, CheckCircle, XCircle, AlertCircle, CalendarPlus } from 'lucide-react';
import CreateEventModal from './Calendar/CreateEventModal';

/**
 * ChatRequestsView - Shows user's saved chat requests from AI Chat
 */
const ChatRequestsView = ({ userId, user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed, cancelled
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchChatRequests();
    }
  }, [userId, filter]);

  const fetchChatRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('chat_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching chat requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          label: 'Pending'
        };
      case 'in_progress':
        return {
          icon: AlertCircle,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'In Progress'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'Cancelled'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: status
        };
    }
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'jets':
      case 'private-jet':
        return '✈️';
      case 'helicopters':
      case 'helicopter':
        return '🚁';
      case 'empty_legs':
        return '🛩️';
      case 'luxury_cars':
      case 'cars':
        return '🚗';
      case 'yachts':
      case 'yacht':
        return '🛥️';
      case 'adventures':
      case 'adventure':
        return '🏔️';
      case 'taxi':
        return '🚕';
      default:
        return '📝';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat Requests</h2>
        <p className="text-gray-600">
          View all your travel search requests from AI Chat. Requests with results are automatically completed, while those without matches are reviewed by our team.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === status
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests yet</h3>
          <p className="text-gray-600 mb-6">
            When you search for services in AI Chat that aren't available, they'll be saved here.
          </p>
          <button
            onClick={() => window.location.href = '#ai-chat'}
            className="px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Try AI Chat
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={request.id}
                className={`bg-white rounded-xl border ${statusConfig.border} p-6 hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-3xl">{getServiceIcon(request.service_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.query}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Requested {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bg} ${statusConfig.border} border`}>
                    <StatusIcon size={16} className={statusConfig.color} />
                    <span className={`text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Request Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {request.service_type && (
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Service</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {request.service_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {(request.from_location || request.to_location) && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Route</p>
                        <p className="text-sm font-medium text-gray-900">
                          {request.from_location || 'Any'} → {request.to_location || 'Any'}
                        </p>
                      </div>
                    </div>
                  )}

                  {request.date_start && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(request.date_start).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {request.passengers && (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Passengers</p>
                        <p className="text-sm font-medium text-gray-900">{request.passengers}</p>
                      </div>
                    </div>
                  )}

                  {request.budget && (
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Budget</p>
                        <p className="text-sm font-medium text-gray-900">
                          CHF {request.budget.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Results Summary - Show if request has results */}
                {request.has_results && request.results_summary && (
                  <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-2">✓ Found Results:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(request.results_summary).map(([key, count]) => (
                        <div key={key} className="text-xs">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="ml-1 font-semibold text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Requirements */}
                {request.special_requirements && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Special Requirements:</p>
                    <p className="text-sm text-gray-900">{request.special_requirements}</p>
                  </div>
                )}

                {/* Notes from Admin */}
                {request.notes && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 mb-4">
                    <p className="text-xs text-blue-600 font-medium mb-1">Update from our team:</p>
                    <p className="text-sm text-gray-900">{request.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowCalendarModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <CalendarPlus size={16} />
                    Add to Calendar
                  </button>
                  {request.status === 'confirmed' && (
                    <button
                      onClick={() => window.location.hash = '#calendar'}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                    >
                      <Calendar size={16} />
                      View in Calendar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && selectedRequest && (
        <CreateEventModal
          onClose={() => {
            setShowCalendarModal(false);
            setSelectedRequest(null);
          }}
          onEventCreated={() => {
            setShowCalendarModal(false);
            setSelectedRequest(null);
            fetchChatRequests();
          }}
          user={user}
          linkedChatRequest={selectedRequest}
        />
      )}
    </div>
  );
};

export default ChatRequestsView;
