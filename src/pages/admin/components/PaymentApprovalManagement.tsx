import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  AlertCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  CreditCard
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface PartnerBooking {
  id: string;
  booking_id: string;
  partner_id: string;
  customer_id: string;
  service_id: string;
  service_type: string;
  pickup_location: string;
  dropoff_location: string;
  total_amount: number;
  currency: string;
  commission_rate: number;
  commission_amount: number;
  partner_earnings: number;
  payment_status: string;
  payment_approval_status: string;
  status: string;
  stripe_payment_intent_id: string;
  created_at: string;
  partner?: {
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
    logo_url: string;
  };
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function PaymentApprovalManagement() {
  const [bookings, setBookings] = useState<PartnerBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<PartnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('awaiting_approval');
  const [selectedBooking, setSelectedBooking] = useState<PartnerBooking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookingsList();
  }, [bookings, searchTerm, filterStatus]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_bookings')
        .select(`
          *,
          partner:users!partner_id(first_name, last_name, company_name, email, logo_url),
          customer:users!customer_id(first_name, last_name, email)
        `)
        .in('payment_status', ['held_escrow'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookingsList = () => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.partner?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.partner?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.partner?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.booking_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.payment_approval_status === filterStatus);
    }

    setFilteredBookings(filtered);
  };

  const handleApprovePayment = async (booking: PartnerBooking) => {
    if (!confirm(`Approve payment of ${booking.currency} ${booking.total_amount.toFixed(2)} to ${booking.partner?.company_name || booking.partner?.first_name}?\n\nPartner will receive: ${booking.currency} ${booking.partner_earnings.toFixed(2)}\nPlatform commission: ${booking.currency} ${booking.commission_amount.toFixed(2)} (${(booking.commission_rate * 100).toFixed(0)}%)`)) {
      return;
    }

    setActionLoading(true);
    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call backend API to capture payment and transfer to partner
      const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/admin/approve-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          partnerId: booking.partner_id,
          adminId: user.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve payment');
      }

      // Refresh list
      await fetchBookings();
      setShowDetailModal(false);
      alert(`Payment approved! ${booking.currency} ${booking.partner_earnings.toFixed(2)} transferred to partner.`);
    } catch (error: any) {
      console.error('Error approving payment:', error);
      alert(`Failed to approve payment: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async (booking: PartnerBooking) => {
    const reason = prompt('Please provide a reason for rejecting this payment:');
    if (!reason) return;

    if (!confirm(`Reject payment and refund customer?\n\nAmount: ${booking.currency} ${booking.total_amount.toFixed(2)}\nReason: ${reason}`)) {
      return;
    }

    setActionLoading(true);
    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call backend API to reject payment
      const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/admin/reject-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          adminId: user.id,
          reason
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject payment');
      }

      // Refresh list
      await fetchBookings();
      setShowDetailModal(false);
      alert('Payment rejected and customer refunded.');
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      alert(`Failed to reject payment: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getPaymentApprovalBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      pending: <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">Pending</span>,
      awaiting_approval: <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium flex items-center gap-1">
        <Clock size={12} />
        Awaiting Approval
      </span>,
      approved: <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Approved</span>,
      rejected: <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Rejected</span>
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading payment approvals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve partner payments held in escrow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
            <span className="text-xs text-yellow-700">Awaiting Approval:</span>
            <span className="ml-2 text-sm font-semibold text-yellow-900">
              {bookings.filter(b => b.payment_approval_status === 'awaiting_approval' || b.payment_status === 'held_escrow').length}
            </span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-xs text-gray-500">Total Held:</span>
            <span className="ml-2 text-sm font-semibold text-gray-900">
              €{bookings
                .filter(b => b.payment_status === 'held_escrow')
                .reduce((sum, b) => sum + b.total_amount, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">How Payment Approval Works</h3>
            <p className="text-xs text-gray-700 mt-1">
              1. Customer books service → Payment held in escrow (NOT captured)<br />
              2. Partner confirms service completion → Moves to "Awaiting Approval"<br />
              3. Admin reviews and approves → Payment captured + transferred to partner<br />
              4. Partner receives earnings (minus commission) via Stripe Connect
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by partner, customer, or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No bookings awaiting approval
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.service_type.replace('_', ' ').replace('-', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">{booking.booking_id?.slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {booking.partner?.logo_url ? (
                          <img
                            src={booking.partner.logo_url}
                            alt="Logo"
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User size={16} className="text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {booking.partner?.company_name || `${booking.partner?.first_name} ${booking.partner?.last_name}`}
                          </p>
                          <p className="text-xs text-gray-500">{booking.partner?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {booking.customer?.first_name} {booking.customer?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{booking.customer?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">
                          {booking.currency} {booking.total_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Partner: {booking.currency} {booking.partner_earnings.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Fee: {booking.currency} {booking.commission_amount.toFixed(2)} ({(booking.commission_rate * 100).toFixed(0)}%)
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPaymentApprovalBadge(booking.payment_approval_status || 'awaiting_approval')}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailModal(true);
                        }}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-black transition-colors flex items-center gap-1"
                      >
                        <Eye size={12} />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment Approval Review</h2>
                  <p className="text-sm text-gray-500 mt-1">Booking ID: {selectedBooking.booking_id}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Payment Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={16} />
                  Payment Summary
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedBooking.currency} {selectedBooking.total_amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Partner Receives</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedBooking.currency} {selectedBooking.partner_earnings.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Platform Fee ({(selectedBooking.commission_rate * 100).toFixed(0)}%)</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {selectedBooking.currency} {selectedBooking.commission_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Partner Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Partner Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                  {selectedBooking.partner?.logo_url ? (
                    <img
                      src={selectedBooking.partner.logo_url}
                      alt="Logo"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={32} className="text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedBooking.partner?.company_name ||
                       `${selectedBooking.partner?.first_name} ${selectedBooking.partner?.last_name}`}
                    </p>
                    <p className="text-sm text-gray-500">{selectedBooking.partner?.email}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{selectedBooking.customer?.email}</p>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Booking Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Service Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {selectedBooking.service_type.replace('_', ' ').replace('-', ' ')}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedBooking.payment_status.replace('_', ' ')}
                    </p>
                  </div>
                  {selectedBooking.pickup_location && (
                    <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin size={12} />
                        Pickup Location
                      </p>
                      <p className="text-sm text-gray-900">{selectedBooking.pickup_location}</p>
                    </div>
                  )}
                  {selectedBooking.dropoff_location && (
                    <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin size={12} />
                        Dropoff Location
                      </p>
                      <p className="text-sm text-gray-900">{selectedBooking.dropoff_location}</p>
                    </div>
                  )}
                  {selectedBooking.stripe_payment_intent_id && (
                    <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <CreditCard size={12} />
                        Stripe Payment Intent
                      </p>
                      <code className="text-xs text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                        {selectedBooking.stripe_payment_intent_id}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedBooking.payment_status === 'held_escrow' && (
              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleRejectPayment(selectedBooking)}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Reject & Refund
                </button>
                <button
                  onClick={() => handleApprovePayment(selectedBooking)}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approve Payment
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
