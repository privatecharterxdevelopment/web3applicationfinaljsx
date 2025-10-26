import React, { useState, useEffect } from 'react';
import {
  Building2,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  Bell,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ChevronRight,
  Wallet,
  CreditCard,
  MapPin,
  Star,
  ExternalLink,
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PartnerDashboardProps {
  user: any;
  onNavigate?: (view: string) => void;
}

export default function PartnerDashboard({ user, onNavigate }: PartnerDashboardProps) {
  const [stats, setStats] = useState({
    activeServices: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    pendingPayouts: 0,
    partnerPoints: 0 // Reduced points system for partners
  });

  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPartnerData();
    }
  }, [user?.id]);

  const loadPartnerData = async () => {
    setLoading(true);
    try {
      // Load partner services
      const { data: services } = await supabase
        .from('partner_services')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setMyServices(services || []);

      // Load partner bookings
      const { data: bookings } = await supabase
        .from('partner_bookings')
        .select('*, partner_services(*), users!customer_id(*)')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentBookings(bookings || []);

      // Calculate stats
      const active = services?.filter(s => s.status === 'approved').length || 0;
      const pending = bookings?.filter(b => b.status === 'pending').length || 0;
      const completed = bookings?.filter(b => b.status === 'completed').length || 0;
      const earnings = bookings
        ?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0) || 0;

      // Load pending payouts
      const { data: payouts } = await supabase
        .from('partner_payouts')
        .select('amount')
        .eq('partner_id', user.id)
        .eq('status', 'pending');

      const pendingAmount = payouts?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

      // Partner points (reduced compared to customers - only 10% of earnings)
      const points = Math.floor(earnings * 0.1);

      setStats({
        activeServices: active,
        pendingBookings: pending,
        completedBookings: completed,
        totalEarnings: earnings,
        pendingPayouts: pendingAmount,
        partnerPoints: points
      });

    } catch (error) {
      console.error('Error loading partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/partners/accept-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          partnerId: user.id
        })
      });

      const result = await response.json();

      if (result.success) {
        // Reload bookings to show updated status
        await loadPartnerData();
        console.log('Booking accepted successfully');
      } else {
        console.error('Failed to accept booking:', result.error);
        alert('Failed to accept booking. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert('Failed to accept booking. Please try again.');
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    const reason = prompt('Please provide a reason for rejecting this booking (optional):');

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/partners/reject-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          partnerId: user.id,
          reason: reason || 'Partner declined'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Reload bookings
        await loadPartnerData();
        console.log('Booking rejected successfully');
      } else {
        console.error('Failed to reject booking:', result.error);
        alert('Failed to reject booking. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Failed to reject booking. Please try again.');
    }
  };

  const handleConfirmArrival = async (bookingId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/partners/capture-and-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          partnerId: user.id
        })
      });

      const result = await response.json();

      if (result.success) {
        // Reload bookings and show payment processed
        await loadPartnerData();
        alert(`Payment processed! You received €${result.transfer.amount.toFixed(2)}. Commission: €${result.transfer.commission.toFixed(2)}`);
      } else {
        console.error('Failed to confirm arrival:', result.error);
        alert('Failed to process payment. Please try again.');
      }
    } catch (error) {
      console.error('Error confirming arrival:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending_approval': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'draft': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-1">
              {user?.company_name || 'Partner Dashboard'}
            </h1>
            <p className="text-gray-500 text-sm">
              Manage your services and bookings
              {!user?.partner_verified && (
                <span className="ml-2 px-2 py-1 bg-yellow-50 text-yellow-600 text-xs rounded-full">
                  Verification Pending
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                try {
                  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                  const response = await fetch(`${apiUrl}/partners/express-dashboard-link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partnerId: user.id })
                  });
                  const result = await response.json();
                  if (result.success) {
                    window.open(result.url, '_blank');
                  } else {
                    alert('Failed to open Stripe Dashboard');
                  }
                } catch (error) {
                  console.error('Error opening Stripe Dashboard:', error);
                  alert('Failed to open Stripe Dashboard');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Manage Account
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => onNavigate?.('post-service')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Post Service
            </button>
          </div>
        </div>

        {/* Stats Grid - Glassmorphic */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Services */}
          <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Package className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.activeServices}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Active Services</h3>
          </div>

          {/* Pending Bookings */}
          <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Pending Bookings</h3>
          </div>

          {/* Total Earnings */}
          <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                €{stats.totalEarnings.toFixed(0)}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Earnings</h3>
          </div>

          {/* Partner Points (Reduced) */}
          <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.partnerPoints}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Partner Points</h3>
            <p className="text-xs text-gray-400 mt-1">10% of earnings</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Bookings - 2 columns */}
          <div className="lg:col-span-2 backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Booking Requests</h2>
              <button
                onClick={() => onNavigate?.('bookings')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {recentBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No booking requests yet</p>
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-white/40 rounded-lg hover:bg-white/60 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {booking.partner_services?.service_type === 'auto' && <Package className="w-5 h-5 text-gray-700" />}
                        {booking.partner_services?.service_type === 'taxi' && <MapPin className="w-5 h-5 text-gray-700" />}
                        {booking.partner_services?.service_type === 'limousine' && <Building2 className="w-5 h-5 text-gray-700" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {booking.partner_services?.title || 'Service'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {booking.users?.first_name} {booking.users?.last_name} • {new Date(booking.booking_date).toLocaleDateString()}
                        </p>
                        {booking.pickup_location && (
                          <p className="text-xs text-gray-400 mt-1">
                            {booking.pickup_location} → {booking.dropoff_location || 'Destination'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        €{parseFloat(booking.total_amount).toFixed(0)}
                      </span>

                      {booking.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleAcceptBooking(booking.id);
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Accept
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleRejectBooking(booking.id);
                            }}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      ) : booking.status === 'confirmed' ? (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleConfirmArrival(booking.id);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Confirm Arrival
                        </button>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions - 1 column */}
          <div className="space-y-4">

            {/* My Services Summary */}
            <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">My Services</h2>
                <button
                  onClick={() => onNavigate?.('services')}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  View all
                </button>
              </div>

              <div className="space-y-2">
                {myServices.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs mb-3">No services yet</p>
                    <button
                      onClick={() => onNavigate?.('post-service')}
                      className="text-xs text-gray-900 hover:underline"
                    >
                      Post your first service
                    </button>
                  </div>
                ) : (
                  myServices.slice(0, 3).map((service) => (
                    <div
                      key={service.id}
                      className="p-3 bg-white/40 rounded-lg hover:bg-white/60 transition-all cursor-pointer"
                      onClick={() => onNavigate?.(`service/${service.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{service.title}</h4>
                          <p className="text-xs text-gray-500">{service.service_location}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(service.status)}`}>
                          {service.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payouts Summary */}
            <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payouts</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/40 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    €{stats.pendingPayouts.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/40 rounded-lg">
                  <div className="flex items-center gap-2">
                    {user?.payment_method === 'iban' ? (
                      <CreditCard className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Wallet className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-sm text-gray-600">Method</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.payment_method === 'iban' ? 'Bank Transfer' : 'Crypto Wallet'}
                  </span>
                </div>

                <button
                  onClick={() => onNavigate?.('payouts')}
                  className="w-full py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                >
                  View Payment History
                </button>
              </div>
            </div>

            {/* Partner Info */}
            {!user?.partner_verified && (
              <div className="backdrop-blur-md bg-yellow-50/60 border border-yellow-200/20 rounded-2xl shadow-lg p-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-900 mb-1">
                      Verification Pending
                    </h3>
                    <p className="text-xs text-yellow-700">
                      Your account is currently under review. You'll be notified once approved.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.completedBookings}</div>
              <p className="text-sm text-gray-600">Completed Bookings</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.completedBookings > 0
                  ? `€${(stats.totalEarnings / stats.completedBookings).toFixed(0)}`
                  : '€0'}
              </div>
              <p className="text-sm text-gray-600">Average Booking Value</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.completedBookings > 0 && stats.pendingBookings > 0
                  ? `${((stats.completedBookings / (stats.completedBookings + stats.pendingBookings)) * 100).toFixed(0)}%`
                  : '0%'}
              </div>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
