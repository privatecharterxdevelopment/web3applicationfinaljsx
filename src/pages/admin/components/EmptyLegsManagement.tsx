import React, { useState, useEffect } from 'react';
import {
  Plane,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Edit,
  Trash2,
  Plus,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface EmptyLeg {
  id: string;
  departure_city: string;
  departure_airport: string;
  departure_iata: string;
  arrival_city: string;
  arrival_airport: string;
  arrival_iata: string;
  departure_date: string;
  departure_time?: string;
  price_eur: number;
  original_price_eur?: number;
  aircraft_type?: string;
  aircraft_model?: string;
  max_passengers?: number;
  flight_duration_hours?: number;
  status: string;
  booking_status?: string;
  booked_by_user_id?: string;
  booked_at?: string;
  created_at: string;
  users?: {
    name: string;
    email: string;
  };
}

interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  booking_type: string;
  service_title: string;
  payment_status: string;
  booking_status: string;
  created_at: string;
  users?: {
    name: string;
    email: string;
  };
}

export default function EmptyLegsManagement() {
  const [emptyLegs, setEmptyLegs] = useState<EmptyLeg[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeg, setSelectedLeg] = useState<EmptyLeg | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchEmptyLegs();
    fetchBookings();

    // Set up real-time subscription for empty legs
    const emptyLegsChannel = supabase
      .channel('empty_legs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'empty_legs' }, () => {
        fetchEmptyLegs();
      })
      .subscribe();

    // Set up real-time subscription for bookings
    const bookingsChannel = supabase
      .channel('bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_bookings' }, (payload) => {
        if (payload.new && (payload.new as any).booking_type === 'empty_leg') {
          fetchBookings();
          fetchEmptyLegs();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(emptyLegsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [statusFilter]);

  const fetchEmptyLegs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('empty_legs')
        .select('*')
        .order('departure_date', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmptyLegs(data || []);
    } catch (error) {
      console.error('Error fetching empty legs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_bookings')
        .select(`
          id,
          user_id,
          service_id,
          booking_type,
          service_title,
          payment_status,
          booking_status,
          created_at,
          users:user_id (
            name,
            email
          )
        `)
        .eq('booking_type', 'empty_leg')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const updateEmptyLegStatus = async (legId: string, newStatus: string) => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('empty_legs')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', legId);

      if (error) throw error;
      await fetchEmptyLegs();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error updating empty leg:', error);
      alert('Failed to update empty leg status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-3 h-3" />;
      case 'booked':
        return <CheckCircle className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Check if empty leg is booked by matching with bookings
  const getBookingForLeg = (legId: string) => {
    return bookings.find(b => b.service_id === legId && b.payment_status === 'paid');
  };

  const filteredEmptyLegs = emptyLegs.filter(leg => {
    const searchLower = searchTerm.toLowerCase();
    return (
      leg.departure_city?.toLowerCase().includes(searchLower) ||
      leg.arrival_city?.toLowerCase().includes(searchLower) ||
      leg.departure_iata?.toLowerCase().includes(searchLower) ||
      leg.arrival_iata?.toLowerCase().includes(searchLower) ||
      leg.aircraft_type?.toLowerCase().includes(searchLower) ||
      leg.aircraft_model?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: emptyLegs.length,
    available: emptyLegs.filter(l => l.status === 'available').length,
    booked: emptyLegs.filter(l => l.status === 'booked' || getBookingForLeg(l.id)).length,
    expired: emptyLegs.filter(l => l.status === 'expired' || new Date(l.departure_date) < new Date()).length,
    totalValue: emptyLegs
      .filter(l => l.status === 'booked' || getBookingForLeg(l.id))
      .reduce((sum, l) => sum + (l.price_eur || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Plane className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Empty Legs</h1>
            <p className="text-sm text-gray-500">Manage empty leg flights with real-time booking sync</p>
          </div>
        </div>
        <button
          onClick={() => { fetchEmptyLegs(); fetchBookings(); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Flights</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Plane className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Booked</p>
              <p className="text-2xl font-bold text-blue-600">{stats.booked}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Booked Value</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by city, airport code, or aircraft..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Empty Legs List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredEmptyLegs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Empty Legs Found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No empty leg flights have been added yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aircraft
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booked By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmptyLegs.map((leg) => {
                const booking = getBookingForLeg(leg.id);
                const isBooked = leg.status === 'booked' || !!booking;
                const isExpired = new Date(leg.departure_date) < new Date() && !isBooked;

                return (
                  <tr key={leg.id} className={`hover:bg-gray-50 ${isExpired ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            <span>{leg.departure_iata || leg.departure_city}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span>{leg.arrival_iata || leg.arrival_city}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {leg.departure_city} → {leg.arrival_city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{leg.aircraft_model || leg.aircraft_type || 'N/A'}</div>
                        {leg.max_passengers && (
                          <div className="text-sm text-gray-500">{leg.max_passengers} passengers</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{formatDate(leg.departure_date)}</div>
                        {leg.departure_time && (
                          <div className="text-sm text-gray-500">{leg.departure_time}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(leg.price_eur)}
                      </div>
                      {leg.original_price_eur && leg.original_price_eur > leg.price_eur && (
                        <div className="text-sm text-gray-500 line-through">
                          {formatCurrency(leg.original_price_eur)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isBooked ? 'bg-blue-100 text-blue-800' :
                        isExpired ? 'bg-gray-100 text-gray-800' :
                        getStatusColor(leg.status)
                      }`}>
                        {getStatusIcon(isBooked ? 'booked' : isExpired ? 'expired' : leg.status)}
                        {isBooked ? 'BOOKED' : isExpired ? 'EXPIRED' : leg.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {booking ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {booking.users?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.users?.email || 'No email'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedLeg(leg);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedLeg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedLeg.departure_iata} → {selectedLeg.arrival_iata}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedLeg.aircraft_model || selectedLeg.aircraft_type}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Route Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Route Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedLeg.departure_iata}</div>
                        <div className="text-sm text-gray-600">{selectedLeg.departure_city}</div>
                        <div className="text-xs text-gray-500">{selectedLeg.departure_airport}</div>
                      </div>
                      <div className="flex-1 px-4">
                        <div className="flex items-center justify-center">
                          <div className="h-0.5 flex-1 bg-gray-300"></div>
                          <Plane className="w-6 h-6 text-orange-500 mx-2 transform rotate-90" />
                          <div className="h-0.5 flex-1 bg-gray-300"></div>
                        </div>
                        {selectedLeg.flight_duration_hours && (
                          <div className="text-center text-xs text-gray-500 mt-1">
                            {selectedLeg.flight_duration_hours}h flight
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedLeg.arrival_iata}</div>
                        <div className="text-sm text-gray-600">{selectedLeg.arrival_city}</div>
                        <div className="text-xs text-gray-500">{selectedLeg.arrival_airport}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flight Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Flight Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Date</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(selectedLeg.departure_date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Time</div>
                        <div className="text-sm font-medium text-gray-900">{selectedLeg.departure_time || 'Flexible'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Aircraft</div>
                        <div className="text-sm font-medium text-gray-900">{selectedLeg.aircraft_model || selectedLeg.aircraft_type || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Max Passengers</div>
                        <div className="text-sm font-medium text-gray-900">{selectedLeg.max_passengers || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Price</div>
                        <div className="text-3xl font-bold text-orange-600">{formatCurrency(selectedLeg.price_eur)}</div>
                        {selectedLeg.original_price_eur && selectedLeg.original_price_eur > selectedLeg.price_eur && (
                          <div className="text-sm text-gray-500 line-through mt-1">
                            {formatCurrency(selectedLeg.original_price_eur)}
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedLeg.status)}`}>
                        {selectedLeg.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Info */}
                {getBookingForLeg(selectedLeg.id) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Booking Information</h3>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      {(() => {
                        const booking = getBookingForLeg(selectedLeg.id);
                        return booking ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Booked By</div>
                              <div className="text-sm font-medium text-gray-900">{booking.users?.name || 'Unknown'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Email</div>
                              <div className="text-sm font-medium text-gray-900">{booking.users?.email || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Payment Status</div>
                              <div className="text-sm font-medium text-green-600">{booking.payment_status.toUpperCase()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Booked At</div>
                              <div className="text-sm font-medium text-gray-900">{formatDate(booking.created_at)}</div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                {selectedLeg.status === 'available' && (
                  <>
                    <button
                      onClick={() => updateEmptyLegStatus(selectedLeg.id, 'booked')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark as Booked'}
                    </button>
                    <button
                      onClick={() => updateEmptyLegStatus(selectedLeg.id, 'cancelled')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Cancel Flight'}
                    </button>
                  </>
                )}
                {selectedLeg.status === 'booked' && (
                  <button
                    onClick={() => updateEmptyLegStatus(selectedLeg.id, 'available')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Make Available'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
