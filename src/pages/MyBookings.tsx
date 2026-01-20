import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Calendar, MapPin, Users, Clock, ChevronRight, Download,
  CheckCircle, AlertCircle, Clock3, XCircle, Filter, Search,
  Ticket, Package, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';

interface Booking {
  id: string;
  type: string;
  status: string;
  created_at: string;
  data: {
    offer_id?: string;
    offer_title?: string;
    offer_origin?: string;
    offer_destination?: string;
    offer_aircraft_type?: string;
    offer_image?: string;
    selected_dates?: {
      from?: string;
      to?: string;
    };
    passengers?: number;
    pricing?: {
      total?: number;
      currency?: string;
    };
    customer_details?: {
      name?: string;
      email?: string;
    };
    // Flight ticket specific
    departure_airport?: string;
    arrival_airport?: string;
    departure_date?: string;
    return_date?: string;
    flight_class?: string;
    airline?: string;
    trip_type?: string;
  };
}

type TabType = 'all' | 'adventures' | 'flights';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchBookings();
    }
  }, [user?.id]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user?.id)
        .in('type', ['adventure_package', 'fixed_offer', 'flight_ticket', 'commercial_flight'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle size={14} />;
      case 'pending':
      case 'in_progress':
        return <Clock3 size={14} />;
      case 'cancelled':
        return <XCircle size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredBookings = bookings.filter((booking) => {
    // Tab filter
    if (activeTab === 'adventures') {
      if (!['adventure_package', 'fixed_offer'].includes(booking.type)) return false;
    } else if (activeTab === 'flights') {
      if (!['flight_ticket', 'commercial_flight'].includes(booking.type)) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && booking.status !== statusFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = booking.data?.offer_title?.toLowerCase() || '';
      const origin = (booking.data?.offer_origin || booking.data?.departure_airport || '').toLowerCase();
      const destination = (booking.data?.offer_destination || booking.data?.arrival_airport || '').toLowerCase();
      if (!title.includes(query) && !origin.includes(query) && !destination.includes(query)) {
        return false;
      }
    }

    return true;
  });

  const adventuresCount = bookings.filter(b => ['adventure_package', 'fixed_offer'].includes(b.type)).length;
  const flightsCount = bookings.filter(b => ['flight_ticket', 'commercial_flight'].includes(b.type)).length;

  const renderBookingCard = (booking: Booking) => {
    const isAdventure = ['adventure_package', 'fixed_offer'].includes(booking.type);
    const isFlight = ['flight_ticket', 'commercial_flight'].includes(booking.type);

    return (
      <div
        key={booking.id}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-48 h-32 md:h-auto bg-gray-100 relative flex-shrink-0">
            {booking.data?.offer_image ? (
              <img
                src={booking.data.offer_image}
                alt={booking.data.offer_title || 'Booking'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isAdventure ? (
                  <Package size={32} className="text-gray-300" />
                ) : (
                  <Ticket size={32} className="text-gray-300" />
                )}
              </div>
            )}
            {/* Type Badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isAdventure ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isAdventure ? 'Adventure' : 'Flight'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 md:p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {booking.data?.offer_title ||
                   (isFlight ? `${booking.data?.departure_airport} → ${booking.data?.arrival_airport}` : 'Booking')}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={14} />
                  <span>
                    {booking.data?.offer_origin || booking.data?.departure_airport || 'N/A'}
                    {' → '}
                    {booking.data?.offer_destination || booking.data?.arrival_airport || 'N/A'}
                  </span>
                </div>
              </div>
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {isAdventure && (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{formatDate(booking.data?.selected_dates?.from || '')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} className="text-gray-400" />
                    <span>{booking.data?.passengers || 1} passenger{(booking.data?.passengers || 1) > 1 ? 's' : ''}</span>
                  </div>
                  {booking.data?.offer_aircraft_type && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Plane size={14} className="text-gray-400" />
                      <span>{booking.data.offer_aircraft_type}</span>
                    </div>
                  )}
                </>
              )}
              {isFlight && (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{formatDate(booking.data?.departure_date || '')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} className="text-gray-400" />
                    <span>{booking.data?.passengers || 1} passenger{(booking.data?.passengers || 1) > 1 ? 's' : ''}</span>
                  </div>
                  {booking.data?.flight_class && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Ticket size={14} className="text-gray-400" />
                      <span>{booking.data.flight_class}</span>
                    </div>
                  )}
                  {booking.data?.airline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Plane size={14} className="text-gray-400" />
                      <span>{booking.data.airline}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                {booking.data?.pricing?.total && (
                  <p className="text-lg font-semibold text-gray-900">
                    {booking.data.pricing.currency === 'EUR' ? '€' : '$'}
                    {booking.data.pricing.total.toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Booked on {formatDate(booking.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/requests/${booking.id}`)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Details
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage your adventure packages and flight bookings</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('adventures')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'adventures'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package size={16} />
            Adventures ({adventuresCount})
          </button>
          <button
            onClick={() => setActiveTab('flights')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'flights'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Ticket size={16} />
            Flights ({flightsCount})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-48 h-32 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'adventures' ? (
                <Package size={32} className="text-gray-400" />
              ) : activeTab === 'flights' ? (
                <Ticket size={32} className="text-gray-400" />
              ) : (
                <Calendar size={32} className="text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No bookings found' : 'No bookings yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : activeTab === 'adventures'
                ? 'Browse our adventure packages to get started'
                : activeTab === 'flights'
                ? 'Search for flights to book your next trip'
                : 'Start planning your next adventure'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => navigate('/adventures')}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Browse Adventures
              </button>
              <button
                onClick={() => navigate('/flight-tickets')}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Search Flights
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(renderBookingCard)}
          </div>
        )}

        {/* Quick Stats */}
        {bookings.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{bookings.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Pending</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Confirmed</p>
              <p className="text-2xl font-semibold text-green-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Completed</p>
              <p className="text-2xl font-semibold text-blue-600">
                {bookings.filter(b => b.status === 'completed').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
