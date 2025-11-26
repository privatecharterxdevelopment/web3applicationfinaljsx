import React, { useState, useEffect } from 'react';
import {
  Plane, Mountain, Leaf, Clock, Check, X, ChevronRight, Search,
  Wallet, ExternalLink, Copy, CheckCircle, Calendar, Users, MapPin,
  Receipt, Bitcoin, Sparkles, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';

const MyBookingsView = ({ user, onBack }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_bookings')
        .select('*, booking_transactions(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBookings(data);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get proper title from booking data - handle undefined cases
  const getBookingTitle = (booking) => {
    // First check if service_title exists and doesn't contain 'undefined'
    if (booking.service_title && !booking.service_title.includes('undefined')) {
      return booking.service_title;
    }
    // Then try origin → destination
    if (booking.origin && booking.destination) {
      return `${booking.origin} → ${booking.destination}`;
    }
    // Fallback based on type
    const typeLabels = {
      empty_leg: 'Empty Leg Flight',
      adventure_package: 'Adventure Package',
      co2_certificate: 'CO2 Certificate'
    };
    return typeLabels[booking.booking_type] || 'Private Charter Booking';
  };

  // Format currency with proper symbol based on booking currency
  const formatCurrency = (amount, currency = 'USD') => {
    const num = parseFloat(amount || 0);
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CHF: 'CHF '
    };
    const symbol = symbols[currency] || '$';
    return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getPaymentStatusStyle = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      confirming: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      expired: 'bg-gray-100 text-gray-500',
      cancelled: 'bg-gray-100 text-gray-500',
      refunded: 'bg-purple-100 text-purple-600',
      failed: 'bg-red-100 text-red-600'
    };
    return styles[status] || styles.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Awaiting Payment',
      confirming: 'Confirming',
      paid: 'Confirmed',
      expired: 'Expired',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
      failed: 'Failed'
    };
    return labels[status] || status;
  };

  const getTypeIcon = (type) => {
    if (type === 'empty_leg') return <Plane size={18} className="text-white" />;
    if (type === 'adventure_package') return <Mountain size={18} className="text-white" />;
    if (type === 'co2_certificate') return <Leaf size={18} className="text-white" />;
    return <Plane size={18} className="text-white" />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      empty_leg: 'Empty Leg',
      adventure_package: 'Adventure',
      co2_certificate: 'CO2 Offset'
    };
    return labels[type] || 'Booking';
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatCryptoAmount = (amount, currency) => {
    if (!amount) return '-';
    const decimals = currency === 'BTC' ? 8 : currency === 'ETH' ? 6 : 2;
    return `${parseFloat(amount).toFixed(decimals)} ${currency}`;
  };

  // Default image based on booking type
  const getDefaultImage = (type) => {
    const defaults = {
      empty_leg: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
      adventure_package: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      co2_certificate: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
    };
    return defaults[type] || defaults.empty_leg;
  };

  // Calculate stats - use actual currency from bookings
  const paidBookings = bookings.filter(b => b.payment_status === 'paid');
  const pendingBookings = bookings.filter(b => b.payment_status === 'pending');
  const totalSpentUSD = paidBookings.reduce((sum, b) => {
    // For stats, we show the amount as-is (could add conversion later)
    return sum + parseFloat(b.total_amount || 0);
  }, 0);
  const pvcxEarned = totalSpentUSD * 0.015; // 1.5% PVCX reward

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' ||
      booking.payment_status === filter ||
      booking.booking_status === filter;
    const matchesSearch = searchQuery === '' ||
      getTypeLabel(booking.booking_type).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getBookingTitle(booking).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-24 h-24 mb-3"
          >
            <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
          </video>
          <p className="text-sm text-gray-500 font-light">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-sm font-light"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        <h1 className="text-3xl font-light text-gray-900 mb-1">My Bookings</h1>
        <p className="text-gray-500 font-light">Your crypto-paid flights, adventures & certificates</p>
      </div>

      {/* Stats Row - Minimal Design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Bookings</p>
          <p className="text-2xl font-light text-gray-900">{bookings.length}</p>
        </div>
        <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Confirmed</p>
          <p className="text-2xl font-light text-gray-900">{paidBookings.length}</p>
        </div>
        <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Total Spent</p>
          <p className="text-2xl font-light text-gray-900">${totalSpentUSD.toLocaleString()}</p>
        </div>
        <div className="bg-black rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">PVCX Earned</p>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-white" />
            <p className="text-2xl font-light text-white">${pvcxEarned.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-light text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black/10"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {['all', 'paid', 'pending'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                filter === status
                  ? 'bg-black text-white'
                  : 'bg-white/50 text-gray-600 hover:bg-white/70 border border-gray-200/50'
              }`}
            >
              {status === 'all' ? 'All' : status === 'paid' ? 'Confirmed' : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Grid - Jets Page Style Cards */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plane size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-light text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-sm text-gray-500 font-light max-w-sm mx-auto">
            Your crypto payments for Empty Legs, Adventures, and CO2 Certificates will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredBookings.map(booking => (
            <div
              key={booking.id}
              onClick={() => setSelectedBooking(booking)}
              className="bg-white/35 hover:bg-white/40 rounded-xl flex h-64 hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            >
              {/* Image Section */}
              <div className="w-2/5 bg-white/10 relative flex-shrink-0 rounded-l-xl overflow-hidden">
                <img
                  src={booking.service_image_url || getDefaultImage(booking.booking_type)}
                  alt={getBookingTitle(booking)}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.target.src = getDefaultImage(booking.booking_type);
                  }}
                />
                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                  <div className="flex space-x-1.5">
                    <div className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 backdrop-blur-sm ${getPaymentStatusStyle(booking.payment_status)}`}>
                      {booking.payment_status === 'paid' && <Check size={10} />}
                      {booking.payment_status === 'pending' && <Clock size={10} />}
                      <span>{getStatusLabel(booking.payment_status)}</span>
                    </div>
                  </div>
                </div>
                {/* Type Badge */}
                <div className="absolute bottom-3 left-3">
                  <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1.5">
                    {getTypeIcon(booking.booking_type)}
                    <span>{getTypeLabel(booking.booking_type)}</span>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-5 flex flex-col">
                {/* Logo */}
                <div className="flex items-center justify-between mb-3">
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.glb.png"
                    alt="PrivateCharterX"
                    className="h-5 w-auto object-contain"
                  />
                  {booking.payment_status === 'paid' && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Sparkles size={12} />
                      <span>+{formatCurrency(parseFloat(booking.total_amount || 0) * 0.015, 'USD')} PVCX</span>
                    </div>
                  )}
                </div>

                {/* Title - Thin Font */}
                <h3 className="text-base font-light text-gray-800 mb-2 line-clamp-2">
                  {getBookingTitle(booking)}
                </h3>

                {/* Description */}
                {booking.service_description && !booking.service_description.includes('undefined') && (
                  <p className="text-xs text-gray-500 font-light mb-3 line-clamp-1">
                    {booking.service_description}
                  </p>
                )}

                {/* Divider */}
                <div className="border-b border-gray-300/50 mb-4" />

                {/* Properties */}
                <div className="flex justify-between mt-auto mb-4">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">Total</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {formatCurrency(booking.total_amount, booking.currency)}
                    </span>
                  </div>
                  {booking.departure_date && (
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">Date</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {format(new Date(booking.departure_date), 'MMM d')}
                      </span>
                    </div>
                  )}
                  {booking.passengers && (
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">Pax</span>
                      <span className="text-sm font-semibold text-gray-800">{booking.passengers}</span>
                    </div>
                  )}
                  {booking.crypto_currency && (
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">Crypto</span>
                      <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                        <Bitcoin size={12} />
                        {booking.crypto_currency}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Links */}
                <div className="flex space-x-4 pt-3 border-t border-gray-300/50 text-xs">
                  <span className="text-gray-600 hover:text-gray-800 cursor-pointer">View details ↗</span>
                  {booking.transaction_hash && (
                    <span className="text-gray-600 hover:text-gray-800 cursor-pointer">View tx ⛓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Image */}
            <div className="relative h-48">
              <img
                src={selectedBooking.service_image_url || getDefaultImage(selectedBooking.booking_type)}
                alt={getBookingTitle(selectedBooking)}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = getDefaultImage(selectedBooking.booking_type);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    {getTypeIcon(selectedBooking.booking_type)}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusStyle(selectedBooking.payment_status)}`}>
                    {getStatusLabel(selectedBooking.payment_status)}
                  </span>
                </div>
                <h2 className="text-xl font-light text-white">
                  {getBookingTitle(selectedBooking)}
                </h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Route */}
              {(selectedBooking.origin || selectedBooking.destination) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Route</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-lg font-light text-gray-900">{selectedBooking.origin || '-'}</p>
                      <p className="text-xs text-gray-500">Departure</p>
                    </div>
                    <div className="flex items-center px-3">
                      <Plane size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-lg font-light text-gray-900">{selectedBooking.destination || '-'}</p>
                      <p className="text-xs text-gray-500">Arrival</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-3">
                {selectedBooking.departure_date && (
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Calendar size={16} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Date</p>
                    <p className="text-sm font-light text-gray-900">
                      {format(new Date(selectedBooking.departure_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                {selectedBooking.passengers && (
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Users size={16} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Passengers</p>
                    <p className="text-sm font-light text-gray-900">{selectedBooking.passengers}</p>
                  </div>
                )}
                {selectedBooking.aircraft_type && (
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Plane size={16} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Aircraft</p>
                    <p className="text-sm font-light text-gray-900 truncate">{selectedBooking.aircraft_type}</p>
                  </div>
                )}
              </div>

              {/* Payment Breakdown - Shows correct currency */}
              <div className="bg-black text-white rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                  <Receipt size={12} />
                  Payment Summary
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Price</span>
                    <span>{formatCurrency(selectedBooking.base_price, selectedBooking.currency)}</span>
                  </div>
                  {selectedBooking.platform_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform Fee (2.5%)</span>
                      <span>{formatCurrency(selectedBooking.platform_fee, selectedBooking.currency)}</span>
                    </div>
                  )}
                  {selectedBooking.coingate_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Processing Fee (1%)</span>
                      <span>{formatCurrency(selectedBooking.coingate_fee, selectedBooking.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-700 font-medium text-base">
                    <span>Total</span>
                    <span>{formatCurrency(selectedBooking.total_amount, selectedBooking.currency)}</span>
                  </div>
                  {selectedBooking.payment_status === 'paid' && (
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="flex items-center gap-1 text-white/80">
                        <Sparkles size={12} />
                        PVCX Earned
                      </span>
                      <span className="text-white/80">+{formatCurrency(parseFloat(selectedBooking.total_amount || 0) * 0.015, 'USD')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Crypto Details */}
              {selectedBooking.crypto_currency && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                    <Bitcoin size={12} />
                    Crypto Payment
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCryptoAmount(selectedBooking.crypto_amount, selectedBooking.crypto_currency)}
                      </span>
                    </div>
                    {selectedBooking.transaction_hash && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Transaction Hash</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono text-gray-800 bg-white px-3 py-2 rounded-lg flex-1 truncate">
                            {selectedBooking.transaction_hash}
                          </p>
                          <button
                            onClick={() => copyToClipboard(selectedBooking.transaction_hash, 'tx')}
                            className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-lg"
                          >
                            {copiedHash === 'tx' ? <CheckCircle size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pending Payment CTA */}
              {selectedBooking.payment_status === 'pending' && selectedBooking.coingate_payment_url && (
                <a
                  href={selectedBooking.coingate_payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-black text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
                >
                  <Wallet size={18} />
                  Complete Payment
                  <ExternalLink size={14} />
                </a>
              )}

              {/* Contact Details */}
              {(selectedBooking.contact_name || selectedBooking.contact_email) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Contact Details</p>
                  {selectedBooking.contact_name && (
                    <p className="text-sm text-gray-700">{selectedBooking.contact_name}</p>
                  )}
                  {selectedBooking.contact_email && (
                    <p className="text-sm text-gray-500">{selectedBooking.contact_email}</p>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-400 text-center pt-2">
                Booked {formatDistanceToNow(new Date(selectedBooking.created_at), { addSuffix: true })}
                {selectedBooking.paid_at && ` • Paid ${formatDistanceToNow(new Date(selectedBooking.paid_at), { addSuffix: true })}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsView;
