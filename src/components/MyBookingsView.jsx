import React, { useState, useEffect } from 'react';
import {
  Plane, Mountain, Leaf, Clock, Check, X, ChevronRight, Search,
  Wallet, ExternalLink, Copy, CheckCircle, Calendar, Users, MapPin,
  Receipt, Bitcoin, Sparkles, ArrowLeft, ChevronDown, Building2, Star, Bed,
  FileText, Download, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { generateBookingConfirmationPDF, generateRequestConfirmationPDF, downloadPDF, savePDFToStorage } from '../services/pdfGeneratorService';
import { generateBookingConfirmationHTML, generateRequestConfirmationHTML, downloadHTMLAsPDF } from '../services/pdfHtmlGenerator';

const MyBookingsView = ({ user, onBack }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(null); // Track which booking's PDF is generating

  // Handle PDF download for a booking
  const handleDownloadPDF = async (booking, e) => {
    if (e) e.stopPropagation();
    setGeneratingPDF(booking.id);
    try {
      // For cart_checkout bookings, use the request confirmation with cart items
      if (booking.booking_type === 'cart_checkout' && booking.service_details?.cart_items?.length > 0) {
        // Import and use the request HTML generator for cart items
        const { generateRequestConfirmationHTML } = await import('../services/pdfHtmlGenerator');

        const pdfRequest = {
          id: booking.id,
          type: 'cart_checkout',
          service_type: 'cart_checkout',
          created_at: booking.created_at,
          client_email: user?.email,
          data: {
            estimated_total: booking.total_amount
          }
        };

        const htmlContent = generateRequestConfirmationHTML(pdfRequest, booking.service_details.cart_items, {
          userName: user?.user_metadata?.full_name || user?.user_metadata?.name || 'Valued Client',
          userEmail: user?.email
        });
        await downloadHTMLAsPDF(htmlContent, `PrivateCharterX_Booking_${booking.id.substring(0, 8).toUpperCase()}.pdf`);

        // Save jsPDF version to storage for admin CRM access
        try {
          const { blob, filename } = await generateBookingConfirmationPDF(booking);
          await savePDFToStorage(blob, filename, 'cart_checkout', booking.id);
        } catch (storageErr) {
          console.warn('Could not save PDF to storage:', storageErr);
        }
      } else {
        // Generate beautiful HTML-based PDF (user-facing)
        const htmlContent = generateBookingConfirmationHTML(booking, {
          userName: user?.user_metadata?.full_name || user?.user_metadata?.name || 'Valued Client',
          userEmail: user?.email
        });
        await downloadHTMLAsPDF(htmlContent, `PrivateCharterX_Booking_${booking.id.substring(0, 8).toUpperCase()}.pdf`);

        // Save jsPDF version to storage for admin CRM access
        try {
          const { blob, filename } = await generateBookingConfirmationPDF(booking);
          await savePDFToStorage(blob, filename, booking.booking_type || 'booking', booking.id);
        } catch (storageErr) {
          console.warn('Could not save PDF to storage:', storageErr);
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPDF(null);
    }
  };

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  // Check if CoinGate session has expired (default 60 minutes)
  const isPaymentExpired = (booking) => {
    // Check metadata.coingate_expire_at first
    if (booking.metadata?.coingate_expire_at) {
      return new Date(booking.metadata.coingate_expire_at) < new Date();
    }
    // Fallback: CoinGate sessions expire after 60 minutes
    const createdAt = new Date(booking.created_at);
    const expiryTime = new Date(createdAt.getTime() + 60 * 60 * 1000); // 60 minutes
    return new Date() > expiryTime;
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Fetch regular bookings including metadata
      const { data: regularBookings, error: regularError } = await supabase
        .from('user_bookings')
        .select('*, booking_transactions(*), metadata')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch hotel bookings
      const { data: hotelBookings, error: hotelError } = await supabase
        .from('hotel_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch adventure and flight bookings from user_requests
      const { data: adventureRequests, error: adventureError } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['adventure_package', 'fixed_offer', 'flight_ticket', 'commercial_flight'])
        .order('created_at', { ascending: false });

      // Transform adventure requests to match booking structure
      const transformedAdventureBookings = (adventureRequests || []).map(req => ({
        id: req.id,
        booking_type: req.type,
        service_title: req.data?.offer_title || req.data?.title || `${req.data?.departure_airport || ''} → ${req.data?.arrival_airport || ''}`,
        service_image_url: req.data?.offer_image || req.data?.image_url,
        origin: req.data?.offer_origin || req.data?.departure_airport,
        destination: req.data?.offer_destination || req.data?.arrival_airport,
        departure_date: req.data?.selected_dates?.from || req.data?.departure_date,
        return_date: req.data?.selected_dates?.to || req.data?.return_date,
        passengers: req.data?.passengers || 1,
        base_price: req.data?.pricing?.base_price || req.data?.pricing?.total,
        total_amount: req.data?.pricing?.total || req.data?.pricing?.base_price,
        currency: req.data?.pricing?.currency || 'USD',
        payment_status: req.status === 'completed' ? 'paid' : req.status,
        booking_status: req.status,
        crypto_currency: req.data?.payment_method,
        created_at: req.created_at,
        // Adventure-specific fields
        aircraft_type: req.data?.offer_aircraft_type,
        customer_name: req.data?.customer_details?.name,
        customer_email: req.data?.customer_details?.email,
        special_requests: req.data?.customer_details?.special_requests,
        is_adventure: req.type === 'adventure_package' || req.type === 'fixed_offer',
        is_flight: req.type === 'flight_ticket' || req.type === 'commercial_flight'
      }));

      // Transform hotel bookings to match regular booking structure
      const transformedHotelBookings = (hotelBookings || []).map(hotel => ({
        id: hotel.id,
        booking_type: 'hotel_booking',
        service_title: hotel.hotel_name,
        origin: hotel.hotel_city,
        destination: null,
        departure_date: hotel.check_in_date,
        return_date: hotel.check_out_date,
        passengers: hotel.guests,
        base_price: hotel.total_price,
        total_amount: hotel.total_price,
        currency: hotel.currency || 'USD',
        payment_status: hotel.payment_status,
        booking_status: hotel.booking_status,
        crypto_currency: hotel.crypto_currency,
        coingate_payment_url: hotel.coingate_payment_url,
        transaction_hash: hotel.transaction_hash,
        created_at: hotel.created_at,
        // Hotel-specific fields
        hotel_image: hotel.hotel_image,
        hotel_address: hotel.hotel_address,
        room_type: hotel.room_type,
        room_count: hotel.room_count,
        check_in_date: hotel.check_in_date,
        check_out_date: hotel.check_out_date,
        guest_name: hotel.guest_name,
        guest_email: hotel.guest_email,
        special_requests: hotel.special_requests
      }));

      // Combine and sort all bookings by created_at
      const allBookings = [
        ...(regularBookings || []),
        ...transformedHotelBookings,
        ...transformedAdventureBookings
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Mark expired pending payments and update their status in the database
      const processedBookings = allBookings.map(booking => {
        if (booking.payment_status === 'pending' && booking.coingate_payment_url) {
          const expired = isPaymentExpired(booking);
          if (expired) {
            // Update status in database (fire and forget)
            supabase
              .from(booking.booking_type === 'hotel_booking' ? 'hotel_bookings' : 'user_bookings')
              .update({ payment_status: 'expired' })
              .eq('id', booking.id)
              .then(() => console.log(`Marked booking ${booking.id} as expired`));

            return { ...booking, payment_status: 'expired' };
          }
        }
        return booking;
      });

      setBookings(processedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingTitle = (booking) => {
    // For cart checkout, show item count
    if (booking.booking_type === 'cart_checkout') {
      const itemCount = booking.service_details?.cart_items?.length || 0;
      if (itemCount > 0) {
        // Try to get the first item's name or a summary
        const firstItem = booking.service_details.cart_items[0];
        const firstName = firstItem?.name || firstItem?.title || firstItem?.rawItemName;
        if (firstName && itemCount > 1) {
          return `${firstName} + ${itemCount - 1} more`;
        } else if (firstName) {
          return firstName;
        }
      }
      return `Cart Order (${itemCount} items)`;
    }
    if (booking.service_title && !booking.service_title.includes('undefined')) {
      return booking.service_title;
    }
    if (booking.booking_type === 'hotel_booking' && booking.origin) {
      return `${booking.service_title || 'Hotel'} - ${booking.origin}`;
    }
    if (booking.origin && booking.destination) {
      return `${booking.origin} → ${booking.destination}`;
    }
    const typeLabels = {
      empty_leg: 'Empty Leg Flight',
      adventure_package: 'Adventure Package',
      fixed_offer: 'Adventure Package',
      co2_certificate: 'CO2 Certificate',
      hotel_booking: 'Hotel Booking',
      flight_ticket: 'Flight Booking',
      commercial_flight: 'Flight Booking'
    };
    return typeLabels[booking.booking_type] || 'Private Charter Booking';
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const num = parseFloat(amount || 0);
    const symbols = { USD: '$', EUR: '€', GBP: '£', CHF: 'CHF ' };
    const symbol = symbols[currency] || '$';
    return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getPaymentStatusStyle = (status) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-600 border-amber-200',
      confirming: 'bg-blue-50 text-blue-600 border-blue-200',
      paid: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      expired: 'bg-gray-50 text-gray-400 border-gray-200',
      cancelled: 'bg-gray-50 text-gray-400 border-gray-200',
      refunded: 'bg-purple-50 text-purple-600 border-purple-200',
      failed: 'bg-red-50 text-red-500 border-red-200'
    };
    return styles[status] || styles.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
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
    if (type === 'empty_leg') return <Plane size={14} />;
    if (type === 'adventure_package' || type === 'fixed_offer') return <Mountain size={14} />;
    if (type === 'co2_certificate') return <Leaf size={14} />;
    if (type === 'hotel_booking') return <Building2 size={14} />;
    if (type === 'cart_checkout') return <Receipt size={14} />;
    if (type === 'flight_ticket' || type === 'commercial_flight') return <Plane size={14} />;
    return <Plane size={14} />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      empty_leg: 'Empty Leg',
      adventure_package: 'Adventure',
      fixed_offer: 'Adventure',
      co2_certificate: 'CO2 Offset',
      hotel_booking: 'Hotel',
      cart_checkout: 'Cart Order',
      flight_ticket: 'Flight',
      commercial_flight: 'Flight'
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

  const paidBookings = bookings.filter(b => b.payment_status === 'paid');
  const pendingBookings = bookings.filter(b => b.payment_status === 'pending');
  const totalSpentUSD = paidBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
  const pvcxEarned = totalSpentUSD * 0.015;

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'hotel_booking') return booking.booking_type === 'hotel_booking';
    if (filter === 'adventures') return booking.is_adventure || booking.booking_type === 'adventure_package' || booking.booking_type === 'fixed_offer';
    if (filter === 'flights') return booking.is_flight || booking.booking_type === 'flight_ticket' || booking.booking_type === 'commercial_flight';
    return booking.payment_status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-gray-500 font-light">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={18} className="text-gray-500" />
              </button>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">My Bookings</h1>
              <p className="text-xs text-gray-400 mt-0.5">{bookings.length} total bookings</p>
            </div>
          </div>
        </div>

        {/* Stats - Minimal Inline */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div>
            <span className="text-gray-400">Confirmed</span>
            <span className="ml-2 font-medium text-gray-900">{paidBookings.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Pending</span>
            <span className="ml-2 font-medium text-gray-900">{pendingBookings.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Total</span>
            <span className="ml-2 font-medium text-gray-900">${totalSpentUSD.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles size={12} className="text-emerald-500" />
            <span className="text-gray-400">PVCX</span>
            <span className="ml-1 font-medium text-emerald-600">+{pvcxEarned.toFixed(2)}</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-4 flex-wrap">
          {['all', 'paid', 'pending', 'adventures', 'flights'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === status
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All' : status === 'paid' ? 'Confirmed' : status === 'pending' ? 'Pending' : status === 'adventures' ? 'Adventures' : 'Flights'}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-6 py-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plane size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBookings.map(booking => {
              const isExpanded = expandedId === booking.id;

              return (
                <div
                  key={booking.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all"
                >
                  {/* Main Row */}
                  <div
                    className="px-4 py-3 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  >
                    {/* Type Icon */}
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 flex-shrink-0">
                      {getTypeIcon(booking.booking_type)}
                    </div>

                    {/* Title & Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getBookingTitle(booking)}
                        </p>
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${getPaymentStatusStyle(booking.payment_status)}`}>
                          {getStatusLabel(booking.payment_status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        <span>{getTypeLabel(booking.booking_type)}</span>
                        {booking.departure_date && (
                          <>
                            <span>•</span>
                            <span>{format(new Date(booking.departure_date), 'MMM d, yyyy')}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(booking.total_amount, booking.currency)}
                      </p>
                      {booking.crypto_currency && (
                        <p className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                          <Bitcoin size={10} />
                          {booking.crypto_currency}
                        </p>
                      )}
                    </div>

                    {/* Expand Icon */}
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-50">
                      {/* Cart Checkout - Show all cart items */}
                      {booking.booking_type === 'cart_checkout' && booking.service_details?.cart_items?.length > 0 ? (
                        <div className="mb-4">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Order Items ({booking.service_details.cart_items.length})</p>
                          <div className="space-y-2">
                            {booking.service_details.cart_items.map((item, idx) => {
                              const itemIcon = {
                                'empty_legs': '✈️',
                                'emptyleg': '✈️',
                                'empty_leg': '✈️',
                                'jet': '✈️',
                                'helicopter': '🚁',
                                'yacht': '🛥️',
                                'wine': '🍷',
                                'wines': '🍷',
                                'champagne': '🍾',
                                'cigars': '🚬',
                                'caviar': '🥂',
                                'delicatesse': '🍾',
                                'delicacies': '🍾',
                                'ground_transport': '🚕',
                                'taxi': '🚕',
                                'concierge': '🎩',
                                'restaurant': '🍽️',
                                'flowers': '💐'
                              }[item.type?.toLowerCase()] || '📋';

                              const categoryName = {
                                'empty_legs': 'Empty Leg Flight',
                                'emptyleg': 'Empty Leg Flight',
                                'empty_leg': 'Empty Leg Flight',
                                'jet': 'Private Jet Charter',
                                'helicopter': 'Helicopter Charter',
                                'yacht': 'Yacht Charter',
                                'wine': 'Premium Wines',
                                'wines': 'Premium Wines',
                                'champagne': 'Champagne',
                                'cigars': 'Premium Cigars',
                                'caviar': 'Caviar & Delicacies',
                                'delicatesse': 'Delicacies',
                                'delicacies': 'Delicacies',
                                'ground_transport': 'Ground Transport',
                                'taxi': 'Airport Transfer',
                                'concierge': 'Concierge Service',
                                'restaurant': 'Restaurant',
                                'flowers': 'Flowers & Gifts'
                              }[item.type?.toLowerCase()] || item.type?.replace(/_/g, ' ');

                              const itemName = item.name || item.title || item.rawItemName || categoryName;
                              const itemPrice = item.price || item.basePrice || item.price_usd || 0;
                              const hasRoute = item.from || item.to || item.from_city || item.to_city;

                              return (
                                <div key={idx} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                                  <span className="text-lg">{itemIcon}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{itemName}</p>
                                    <p className="text-[10px] text-gray-500">{categoryName}</p>
                                    {hasRoute && (
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        {item.from || item.from_city} → {item.to || item.to_city}
                                      </p>
                                    )}
                                    {item.departure_date && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {format(new Date(item.departure_date), 'MMM d, yyyy')}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {formatCurrency(itemPrice, item.currency || 'USD')}
                                    </p>
                                    {item.quantity > 1 && (
                                      <p className="text-[10px] text-gray-500">x{item.quantity}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : booking.booking_type === 'hotel_booking' ? (
                        /* Hotel-specific details */
                        <div className="mb-4">
                          {/* Hotel image and info */}
                          {booking.hotel_image && (
                            <div className="mb-3">
                              <img
                                src={booking.hotel_image}
                                alt={booking.service_title}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {booking.check_in_date && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Check-in</p>
                                <p className="text-sm text-gray-900">{format(new Date(booking.check_in_date), 'MMM d, yyyy')}</p>
                              </div>
                            )}
                            {booking.check_out_date && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Check-out</p>
                                <p className="text-sm text-gray-900">{format(new Date(booking.check_out_date), 'MMM d, yyyy')}</p>
                              </div>
                            )}
                            {booking.room_type && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Room</p>
                                <p className="text-sm text-gray-900">{booking.room_type}</p>
                              </div>
                            )}
                            {booking.passengers && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Guests</p>
                                <p className="text-sm text-gray-900">{booking.passengers}</p>
                              </div>
                            )}
                            {booking.room_count && booking.room_count > 1 && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Rooms</p>
                                <p className="text-sm text-gray-900">{booking.room_count}</p>
                              </div>
                            )}
                            {booking.hotel_address && (
                              <div className="col-span-2">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Address</p>
                                <p className="text-sm text-gray-900">{booking.hotel_address}</p>
                              </div>
                            )}
                          </div>
                          {booking.special_requests && (
                            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Special Requests</p>
                              <p className="text-xs text-gray-600">{booking.special_requests}</p>
                            </div>
                          )}
                        </div>
                      ) : (booking.is_adventure || booking.booking_type === 'adventure_package' || booking.booking_type === 'fixed_offer') ? (
                        /* Adventure-specific details */
                        <div className="mb-4">
                          {/* Adventure image */}
                          {booking.service_image_url && (
                            <div className="mb-3">
                              <img
                                src={booking.service_image_url}
                                alt={booking.service_title}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {booking.origin && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">From</p>
                                <p className="text-sm text-gray-900">{booking.origin}</p>
                              </div>
                            )}
                            {booking.destination && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">To</p>
                                <p className="text-sm text-gray-900">{booking.destination}</p>
                              </div>
                            )}
                            {booking.departure_date && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Departure</p>
                                <p className="text-sm text-gray-900">{format(new Date(booking.departure_date), 'MMM d, yyyy')}</p>
                              </div>
                            )}
                            {booking.return_date && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Return</p>
                                <p className="text-sm text-gray-900">{format(new Date(booking.return_date), 'MMM d, yyyy')}</p>
                              </div>
                            )}
                            {booking.passengers && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Passengers</p>
                                <p className="text-sm text-gray-900">{booking.passengers}</p>
                              </div>
                            )}
                            {booking.aircraft_type && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Aircraft</p>
                                <p className="text-sm text-gray-900">{booking.aircraft_type}</p>
                              </div>
                            )}
                            {booking.customer_name && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Guest</p>
                                <p className="text-sm text-gray-900">{booking.customer_name}</p>
                              </div>
                            )}
                            {booking.customer_email && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Email</p>
                                <p className="text-sm text-gray-900 truncate">{booking.customer_email}</p>
                              </div>
                            )}
                          </div>
                          {booking.special_requests && (
                            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Special Requests</p>
                              <p className="text-xs text-gray-600">{booking.special_requests}</p>
                            </div>
                          )}
                        </div>
                      ) : (booking.booking_type === 'commercial_flight' || booking.booking_type === 'flight_ticket') ? (
                        /* Commercial Flight details */
                        <div className="mb-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {booking.origin && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">From</p>
                                <p className="text-sm text-gray-900 font-medium">{booking.origin}</p>
                              </div>
                            )}
                            {booking.destination && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">To</p>
                                <p className="text-sm text-gray-900 font-medium">{booking.destination}</p>
                              </div>
                            )}
                            {booking.departure_date && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Departure</p>
                                <p className="text-sm text-gray-900">{format(new Date(booking.departure_date), 'MMM d, yyyy')}</p>
                              </div>
                            )}
                            {booking.return_date && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Return</p>
                                <p className="text-sm text-gray-900">{format(new Date(booking.return_date), 'MMM d, yyyy')}</p>
                              </div>
                            )}
                            {booking.passengers && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Passengers</p>
                                <p className="text-sm text-gray-900">{booking.passengers}</p>
                              </div>
                            )}
                            {(booking.aircraft_type || booking.metadata?.airline) && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Airline</p>
                                <p className="text-sm text-gray-900">{booking.aircraft_type || booking.metadata?.airline}</p>
                              </div>
                            )}
                            {booking.metadata?.flight_number && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Flight</p>
                                <p className="text-sm text-gray-900">{booking.metadata.flight_number}</p>
                              </div>
                            )}
                            {booking.metadata?.cabin_class && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Cabin</p>
                                <p className="text-sm text-gray-900 capitalize">{booking.metadata.cabin_class}</p>
                              </div>
                            )}
                          </div>

                          {/* Passenger Details */}
                          {booking.metadata?.passengers && booking.metadata.passengers.length > 0 && (
                            <div className="mt-3">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Travelers</p>
                              <div className="space-y-1">
                                {booking.metadata.passengers.map((pax, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <Users size={12} className="text-gray-400" />
                                    <span className="text-gray-900">{pax.givenName} {pax.familyName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Selected Seats */}
                          {booking.metadata?.selected_seats && booking.metadata.selected_seats.length > 0 && (
                            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                              <p className="text-[10px] text-blue-600 uppercase tracking-wide mb-1">Selected Seats</p>
                              <p className="text-sm text-blue-900">
                                {booking.metadata.selected_seats.map(s => s.seatDesignator).join(', ')}
                              </p>
                            </div>
                          )}

                          {/* Baggage Info */}
                          {booking.metadata?.baggage && (
                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                              {booking.metadata.baggage.checkedBags > 0 && (
                                <span>{booking.metadata.baggage.checkedBags} checked bag{booking.metadata.baggage.checkedBags > 1 ? 's' : ''}</span>
                              )}
                              {booking.metadata.baggage.cabinBags > 0 && (
                                <span>{booking.metadata.baggage.cabinBags} cabin bag{booking.metadata.baggage.cabinBags > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          )}

                          {/* Booking Reference */}
                          {booking.metadata?.booking_reference && (
                            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Booking Reference</p>
                              <p className="text-lg font-mono font-bold text-gray-900">{booking.metadata.booking_reference}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Regular booking details */
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          {booking.origin && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide">From</p>
                              <p className="text-sm text-gray-900">{booking.origin}</p>
                            </div>
                          )}
                          {booking.destination && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide">To</p>
                              <p className="text-sm text-gray-900">{booking.destination}</p>
                            </div>
                          )}
                          {booking.passengers && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Passengers</p>
                              <p className="text-sm text-gray-900">{booking.passengers}</p>
                            </div>
                          )}
                          {booking.aircraft_type && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Aircraft</p>
                              <p className="text-sm text-gray-900">{booking.aircraft_type}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Breakdown */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        {(() => {
                          const basePrice = parseFloat(booking.base_price || 0);
                          const platformFee = booking.platform_fee || Math.round(basePrice * 0.025 * 100) / 100;
                          const vatRate = 0.081; // 8.1% Swiss VAT
                          const vatAmount = booking.vat_amount || Math.round(basePrice * vatRate * 100) / 100;
                          const total = booking.total_amount || (basePrice + platformFee + vatAmount);

                          return (
                            <>
                              <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-gray-500">Base Price</span>
                                <span className="text-gray-900">{formatCurrency(basePrice, booking.currency)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-gray-500">Platform Fee (2.5%)</span>
                                <span className="text-gray-900">+{formatCurrency(platformFee, booking.currency)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-gray-500">VAT (8.1% CH)</span>
                                <span className="text-gray-900">+{formatCurrency(vatAmount, booking.currency)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                                <span className="font-medium text-gray-900">Total</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(total, booking.currency)}</span>
                              </div>
                            </>
                          );
                        })()}
                        {booking.payment_status === 'paid' && (
                          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-200">
                            <span className="text-emerald-600 flex items-center gap-1">
                              <Sparkles size={10} />
                              PVCX Reward
                            </span>
                            <span className="text-emerald-600">+{(parseFloat(booking.total_amount || 0) * 0.015).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Transaction Hash */}
                      {booking.transaction_hash && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-gray-500">TX:</span>
                          <code className="text-[10px] text-gray-600 bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                            {booking.transaction_hash}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(booking.transaction_hash, booking.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {copiedHash === booking.id ? <CheckCircle size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {booking.payment_status === 'pending' && booking.coingate_payment_url && (
                          isPaymentExpired(booking) ? (
                            <div className="flex-1 py-2 bg-gray-200 text-gray-500 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed">
                              <Clock size={12} />
                              Session Expired
                            </div>
                          ) : (
                            <a
                              href={booking.coingate_payment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Wallet size={12} />
                              Complete Payment
                            </a>
                          )
                        )}
                        {/* Download PDF Button - Always available */}
                        <button
                          onClick={(e) => handleDownloadPDF(booking, e)}
                          disabled={generatingPDF === booking.id}
                          className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {generatingPDF === booking.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Download size={12} />
                          )}
                          {generatingPDF === booking.id ? 'Generating...' : 'Download PDF'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(booking);
                          }}
                          className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                    {getTypeIcon(selectedBooking.booking_type)}
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{getBookingTitle(selectedBooking)}</h2>
                    <p className="text-xs text-gray-500">{getTypeLabel(selectedBooking.booking_type)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getPaymentStatusStyle(selectedBooking.payment_status)}`}>
                  {getStatusLabel(selectedBooking.payment_status)}
                </span>
              </div>

              {/* Hotel-specific modal content */}
              {selectedBooking.booking_type === 'hotel_booking' ? (
                <>
                  {/* Hotel image */}
                  {selectedBooking.hotel_image && (
                    <div className="rounded-xl overflow-hidden">
                      <img
                        src={selectedBooking.hotel_image}
                        alt={selectedBooking.service_title}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  {/* Hotel location */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Building2 size={14} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedBooking.origin}</p>
                        {selectedBooking.hotel_address && (
                          <p className="text-xs text-gray-500">{selectedBooking.hotel_address}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hotel Details */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedBooking.check_in_date && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Calendar size={14} className="text-gray-400 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400">Check-in</p>
                        <p className="text-xs font-medium text-gray-900">
                          {format(new Date(selectedBooking.check_in_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {selectedBooking.check_out_date && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Calendar size={14} className="text-gray-400 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400">Check-out</p>
                        <p className="text-xs font-medium text-gray-900">
                          {format(new Date(selectedBooking.check_out_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {selectedBooking.room_type && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Bed size={14} className="text-gray-400 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400">Room</p>
                        <p className="text-xs font-medium text-gray-900">{selectedBooking.room_type}</p>
                      </div>
                    )}
                    {selectedBooking.passengers && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Users size={14} className="text-gray-400 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400">Guests</p>
                        <p className="text-xs font-medium text-gray-900">{selectedBooking.passengers}</p>
                      </div>
                    )}
                  </div>

                  {selectedBooking.special_requests && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Special Requests</p>
                      <p className="text-xs text-gray-600">{selectedBooking.special_requests}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Route */}
                  {(selectedBooking.origin || selectedBooking.destination) && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">From</p>
                          <p className="text-sm font-medium text-gray-900">{selectedBooking.origin || '-'}</p>
                        </div>
                        <Plane size={14} className="text-gray-400" />
                        <div className="flex-1 text-right">
                          <p className="text-xs text-gray-400">To</p>
                          <p className="text-sm font-medium text-gray-900">{selectedBooking.destination || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-3">
                    {selectedBooking.departure_date && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Calendar size={14} className="text-gray-400 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400">Date</p>
                        <p className="text-xs font-medium text-gray-900">
                          {format(new Date(selectedBooking.departure_date), 'MMM d')}
                        </p>
                      </div>
                    )}
                    {selectedBooking.passengers && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Users size={14} className="text-gray-400 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400">Passengers</p>
                        <p className="text-xs font-medium text-gray-900">{selectedBooking.passengers}</p>
                      </div>
                    )}
                    {selectedBooking.crypto_currency && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Bitcoin size={14} className="text-gray-400 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-400">Paid with</p>
                        <p className="text-xs font-medium text-gray-900">{selectedBooking.crypto_currency}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Payment Summary */}
              <div className="bg-gray-900 text-white rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">Payment Summary</p>
                {(() => {
                  const basePrice = parseFloat(selectedBooking.base_price || 0);
                  const platformFee = selectedBooking.platform_fee || Math.round(basePrice * 0.025 * 100) / 100;
                  const vatRate = 0.081; // 8.1% Swiss VAT
                  const vatAmount = selectedBooking.vat_amount || Math.round(basePrice * vatRate * 100) / 100;
                  const total = selectedBooking.total_amount || (basePrice + platformFee + vatAmount);

                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Base Price</span>
                        <span>{formatCurrency(basePrice, selectedBooking.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform Fee (2.5%)</span>
                        <span>+{formatCurrency(platformFee, selectedBooking.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">VAT (8.1% CH)</span>
                        <span>+{formatCurrency(vatAmount, selectedBooking.currency)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-700 font-medium">
                        <span>Total</span>
                        <span>{formatCurrency(total, selectedBooking.currency)}</span>
                      </div>
                      {selectedBooking.payment_status === 'paid' && (
                        <div className="flex justify-between pt-2 border-t border-gray-700 text-emerald-400">
                          <span className="flex items-center gap-1">
                            <Sparkles size={12} />
                            PVCX Earned
                          </span>
                          <span>+{(total * 0.015).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Transaction */}
              {selectedBooking.transaction_hash && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-gray-600 bg-gray-100 px-3 py-2 rounded-lg flex-1 truncate">
                      {selectedBooking.transaction_hash}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedBooking.transaction_hash, 'modal')}
                      className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-lg"
                    >
                      {copiedHash === 'modal' ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Payment CTA */}
              {selectedBooking.payment_status === 'pending' && selectedBooking.coingate_payment_url && (
                isPaymentExpired(selectedBooking) ? (
                  <div className="w-full py-3 bg-gray-200 text-gray-500 font-medium rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <Clock size={16} />
                    Payment Session Expired
                  </div>
                ) : (
                  <a
                    href={selectedBooking.coingate_payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                  >
                    <Wallet size={16} />
                    Complete Payment
                    <ExternalLink size={14} />
                  </a>
                )
              )}

              {/* Download PDF Button - Only show when paid */}
              {selectedBooking?.payment_status === 'paid' && (
                <button
                  onClick={() => handleDownloadPDF(selectedBooking)}
                  disabled={generatingPDF === selectedBooking?.id}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {generatingPDF === selectedBooking?.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  Download Confirmation PDF
                </button>
              )}

              {/* Timestamp */}
              <p className="text-[10px] text-gray-400 text-center pt-2">
                Booked {formatDistanceToNow(new Date(selectedBooking.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsView;
