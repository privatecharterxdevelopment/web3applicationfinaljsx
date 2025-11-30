import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  User,
  Plane,
  Calendar,
  DollarSign,
  CreditCard,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Booking {
  id: string;
  user_id: string;
  booking_type: string;
  service_id: string;
  service_title: string;
  service_description?: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  passengers?: number;
  base_price: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  crypto_currency?: string;
  coingate_order_id?: string;
  coingate_payment_url?: string;
  transaction_hash?: string;
  payment_status: string;
  booking_status: string;
  contact_name?: string;
  contact_email?: string;
  created_at: string;
  paid_at?: string;
  confirmed_at?: string;
  admin_notes?: string;
  users?: {
    name: string;
    email: string;
  };
}

export default function UserBookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, typeFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_bookings')
        .select(`
          *,
          users:user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('payment_status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('booking_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, paymentStatus: string, bookingStatus: string) => {
    try {
      setIsUpdating(true);
      const updateData: any = {
        payment_status: paymentStatus,
        booking_status: bookingStatus,
        updated_at: new Date().toISOString()
      };

      if (paymentStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
        updateData.confirmed_at = new Date().toISOString();
      }

      if (adminNotes.trim()) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('user_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      // Send notification email
      try {
        await supabase.functions.invoke('booking-confirmation-email', {
          body: { bookingId }
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }

      await fetchBookings();
      setShowDetailsModal(false);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirming':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'expired':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'empty_leg':
        return 'Empty Leg';
      case 'adventure_package':
        return 'Adventure';
      case 'co2_certificate':
        return 'CO2 Certificate';
      case 'fixed_offer':
        return 'Fixed Offer';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'empty_leg':
        return <Plane className="w-4 h-4" />;
      case 'adventure_package':
        return <MapPin className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const filteredBookings = bookings.filter(booking => {
    const serviceTitle = booking.service_title || '';
    const userEmail = booking.users?.email || booking.contact_email || '';
    const userName = booking.users?.name || booking.contact_name || '';
    const searchLower = searchTerm.toLowerCase();

    return (
      serviceTitle.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower) ||
      userName.toLowerCase().includes(searchLower) ||
      booking.id.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.payment_status === 'pending').length,
    paid: bookings.filter(b => b.payment_status === 'paid').length,
    totalRevenue: bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Bookings</h1>
            <p className="text-sm text-gray-500">Manage paid bookings and transactions</p>
          </div>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payment</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(stats.totalRevenue)}
              </p>
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
            placeholder="Search by service, user email, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="empty_leg">Empty Leg</option>
            <option value="adventure_package">Adventure</option>
            <option value="co2_certificate">CO2 Certificate</option>
            <option value="fixed_offer">Fixed Offer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirming">Confirming</option>
            <option value="paid">Paid</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No bookings have been made yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service / User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 truncate max-w-[200px]">
                        {booking.service_title || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.users?.email || booking.contact_email || 'Unknown user'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getTypeIcon(booking.booking_type)}
                      {getTypeLabel(booking.booking_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(booking.total_amount, booking.currency)}
                    </div>
                    {booking.crypto_currency && (
                      <div className="text-xs text-gray-500">
                        via {booking.crypto_currency}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                      {booking.payment_status === 'paid' ? <CheckCircle className="w-3 h-3" /> :
                       booking.payment_status === 'pending' ? <Clock className="w-3 h-3" /> :
                       <AlertCircle className="w-3 h-3" />}
                      {booking.payment_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.booking_status)}`}>
                      {booking.booking_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(booking.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setAdminNotes(booking.admin_notes || '');
                        setShowDetailsModal(true);
                      }}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedBooking.service_title || 'Booking Details'}
                  </h2>
                  <p className="text-sm text-gray-500">ID: {selectedBooking.id.slice(0, 8)}...</p>
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
              <div className="space-y-6">
                {/* User & Contact Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Name</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedBooking.users?.name || selectedBooking.contact_name || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Email</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedBooking.users?.email || selectedBooking.contact_email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Service Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500 mb-1">Service</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedBooking.service_title}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Type</div>
                        <div className="text-sm font-medium text-gray-900">
                          {getTypeLabel(selectedBooking.booking_type)}
                        </div>
                      </div>
                      {selectedBooking.origin && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Route</div>
                          <div className="text-sm font-medium text-gray-900">
                            {selectedBooking.origin} → {selectedBooking.destination}
                          </div>
                        </div>
                      )}
                      {selectedBooking.departure_date && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Departure</div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(selectedBooking.departure_date)}
                          </div>
                        </div>
                      )}
                      {selectedBooking.passengers && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Passengers</div>
                          <div className="text-sm font-medium text-gray-900">
                            {selectedBooking.passengers}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                        <div className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(selectedBooking.total_amount, selectedBooking.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Payment Method</div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          {selectedBooking.crypto_currency || selectedBooking.payment_method}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Payment Status</div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedBooking.payment_status)}`}>
                          {selectedBooking.payment_status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Booking Status</div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(selectedBooking.booking_status)}`}>
                          {selectedBooking.booking_status.toUpperCase()}
                        </span>
                      </div>
                      {selectedBooking.transaction_hash && (
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500 mb-1">Transaction Hash</div>
                          <div className="text-sm font-mono text-gray-700 break-all">
                            {selectedBooking.transaction_hash}
                          </div>
                        </div>
                      )}
                      {selectedBooking.coingate_payment_url && (
                        <div className="col-span-2">
                          <a
                            href={selectedBooking.coingate_payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View on CoinGate
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="text-sm">
                          <span className="text-gray-600">Created:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatDate(selectedBooking.created_at)}
                          </span>
                        </div>
                      </div>
                      {selectedBooking.paid_at && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="text-sm">
                            <span className="text-gray-600">Paid:</span>
                            <span className="ml-2 font-medium text-green-600">
                              {formatDate(selectedBooking.paid_at)}
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedBooking.confirmed_at && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <div className="text-sm">
                            <span className="text-gray-600">Confirmed:</span>
                            <span className="ml-2 font-medium text-emerald-600">
                              {formatDate(selectedBooking.confirmed_at)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Admin Notes</h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this booking..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer - Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                {selectedBooking.payment_status === 'pending' && (
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'paid', 'confirmed')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Mark as Paid'}
                  </button>
                )}
                {selectedBooking.booking_status === 'confirmed' && (
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, selectedBooking.payment_status, 'completed')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Mark Completed'}
                  </button>
                )}
                {(selectedBooking.payment_status === 'pending' || selectedBooking.booking_status === 'pending') && (
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled', 'cancelled')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Cancel Booking'}
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
