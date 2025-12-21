// MyActivityView.jsx - Unified activity view for all user bookings, requests, and chats
// Design: Matches SubscriptionManagement pattern with expandable list, filter tabs, and minimal glassmorphic styling
// PENDING section shows: Empty Legs + Extras that are PAYABLE (with status: paid, pending, or expired)
import React, { useState, useEffect } from 'react';
import {
  Plane, Clock, Check, X, ChevronDown, Loader2, CreditCard,
  AlertCircle, MessageSquare, Wine, Anchor, Car,
  Package, Activity, ArrowLeft, Timer
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, format, isToday, isYesterday, parseISO, differenceInMinutes } from 'date-fns';

const MyActivityView = ({ user, initialFilter, onBack }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter || 'all');
  const [expandedId, setExpandedId] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadActivity();
    }
  }, [user?.id]);

  // Update filter if initialFilter prop changes
  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  // Check if CoinGate payment session has expired (60 minutes default)
  const isPaymentExpired = (item) => {
    // Already paid - not expired
    if (item.payment_status === 'paid' || item.payment_status === 'confirmed') return false;

    // Check coingate_expire_at in metadata
    if (item.metadata?.coingate_expire_at) {
      return new Date(item.metadata.coingate_expire_at) < new Date();
    }

    // Check departure_date for empty legs - expired if departure has passed
    const departureDate = item.departure_date || item.data?.departure_date ||
                          item.cart_items?.[0]?.departure_date;
    if (departureDate && new Date(departureDate) < new Date()) {
      return true;
    }

    // For pending payments with coingate_order_id, check 60 min expiry
    if (item.coingate_order_id || item.metadata?.coingate_order_id) {
      const createdAt = new Date(item.created_at);
      const expiryTime = new Date(createdAt.getTime() + 60 * 60 * 1000); // 60 minutes
      return new Date() > expiryTime;
    }

    return false;
  };

  // Check if item is payable (empty legs or extras with price)
  const isPayableItem = (item) => {
    const type = (item.type || item.booking_type || item.service_type || '').toLowerCase();
    // Empty legs are directly payable
    if (type.includes('empty_leg') || type.includes('emptyleg')) return true;
    // Wines/champagne/cigars/extras are payable
    if (type.includes('wine') || type.includes('champagne') || type.includes('cigar') ||
        type.includes('extra') || type.includes('custom_extra')) return true;
    // Cart items with payable content
    if (item.cart_items?.some(ci =>
      ci.type?.includes('empty_leg') || ci.type?.includes('wine') || ci.type?.includes('extra')
    )) return true;
    return false;
  };

  // Load all activity from tables
  const loadActivity = async () => {
    setLoading(true);
    try {
      const [bookingsRes, requestsRes, chatRequestsRes] = await Promise.all([
        supabase
          .from('user_bookings')
          .select('*, metadata')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('chat_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      // Normalize bookings (paid items from user_bookings)
      const bookings = (bookingsRes.data || []).map(b => {
        const expired = isPaymentExpired(b);
        const payable = isPayableItem(b);
        return {
          ...b,
          source: 'booking',
          isPayable: payable,
          isExpired: expired,
          activityType: getBookingType(b),
          displayTitle: getBookingTitle(b),
          displayRoute: getBookingRoute(b),
          displayPrice: b.total_amount || b.base_price,
          displayDate: b.departure_date || b.created_at,
          activityStatus: getBookingStatus(b, expired, payable)
        };
      });

      // Normalize user_requests
      const requests = (requestsRes.data || []).map(r => {
        const dataSource = r.data?.source?.toLowerCase?.() || '';
        const isFromAI = r.type === 'ai_chat_bulk' ||
                         r.type === 'custom_request' ||
                         dataSource.includes('ai') ||
                         dataSource.includes('sphera') ||
                         dataSource === 'ai_chat';
        const expired = isPaymentExpired(r);
        const payable = isPayableItem(r);
        return {
          ...r,
          source: 'request',
          isFromAI,
          isPayable: payable,
          isExpired: expired,
          activityType: getRequestType(r),
          displayTitle: getRequestTitle(r),
          displayRoute: getRequestRoute(r),
          displayPrice: getRequestPrice(r),
          displayDate: r.created_at,
          activityStatus: getRequestStatus(r, expired, payable)
        };
      });

      // Normalize chat_requests (AI cart submissions)
      const chatRequests = (chatRequestsRes.data || []).map(cr => {
        const expired = isPaymentExpired(cr);
        const cartItems = cr.cart_items || [];
        const payableItems = cartItems.filter(ci =>
          ci.type?.includes('empty_leg') || ci.type?.includes('wine') ||
          ci.type?.includes('extra') || ci.type?.includes('champagne')
        );
        const payable = isPayableItem(cr) || payableItems.length > 0;

        // Get activity type from first cart item
        const firstItem = cartItems[0];
        const itemType = (firstItem?.type || '').toLowerCase();
        let activityType = 'cart';
        if (itemType.includes('jet')) activityType = 'jet';
        else if (itemType.includes('heli')) activityType = 'helicopter';
        else if (itemType.includes('empty')) activityType = 'empty_leg';
        else if (itemType.includes('ground') || itemType.includes('taxi') || itemType.includes('transfer')) activityType = 'car';
        else if (itemType.includes('yacht')) activityType = 'yacht';
        else if (itemType.includes('wine')) activityType = 'wine';

        return {
          ...cr,
          source: 'chat_request',
          isFromAI: true,
          isPayable: payable,
          isExpired: expired,
          payableItems,
          activityType,
          displayTitle: getChatRequestTitle(cr, cartItems), // Pass ALL items, not just payable
          displayRoute: getChatRequestRoute(cr, cartItems),
          displayPrice: cr.cart_total || cartItems.reduce((sum, i) => sum + (i.price || i.totalWithFee || 0), 0),
          displayDate: cr.created_at,
          activityStatus: getChatRequestStatus(cr, expired, payable)
        };
      });

      // Merge and sort by date
      const allActivity = [...bookings, ...requests, ...chatRequests]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setActivities(allActivity);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  // Service type labels for readable display
  const serviceTypeLabels = {
    'jet': 'Private Jet Charter',
    'jets': 'Private Jet Charter',
    'private_jet': 'Private Jet Charter',
    'helicopter': 'Helicopter Charter',
    'helicopters': 'Helicopter Charter',
    'empty_leg': 'Empty Leg Flight',
    'empty_legs': 'Empty Leg Flight',
    'emptyleg': 'Empty Leg Flight',
    'ground_transport': 'Ground Transport',
    'taxi': 'Ground Transport',
    'transfer': 'Ground Transport',
    'yacht': 'Yacht Charter',
    'yachts': 'Yacht Charter',
    'wine': 'Wine Order',
    'wines': 'Wine Order',
    'concierge': 'Concierge Service',
    'luxury_car': 'Luxury Car',
    'luxury_cars': 'Luxury Car',
    'adventure': 'Adventure Experience',
    'fixed_offer': 'Fixed Offer'
  };

  // Get chat request title - extract actual service types from ALL items
  const getChatRequestTitle = (cr, allItems) => {
    const items = allItems || cr.cart_items || [];

    if (items.length > 0) {
      const first = items[0];
      const type = (first.type || '').toLowerCase();

      // Get readable label from type
      let label = serviceTypeLabels[type];

      // If no direct match, try to match partial
      if (!label) {
        for (const [key, val] of Object.entries(serviceTypeLabels)) {
          if (type.includes(key)) {
            label = val;
            break;
          }
        }
      }

      // Fallback to item name or formatted type
      if (!label) {
        label = first.name || first.title || first.aircraft_type ||
                type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service';
      }

      // Add count if multiple items
      if (items.length > 1) {
        return `${label} +${items.length - 1} more`;
      }

      return label;
    }

    // Fallback to service_type field from chat_requests table
    if (cr.service_type) {
      return serviceTypeLabels[cr.service_type] ||
             cr.service_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return 'Concierge Request';
  };

  // Get chat request route
  const getChatRequestRoute = (cr, items) => {
    const flightItem = items?.find(i => i.from && i.to);
    if (flightItem) {
      return `${flightItem.from || flightItem.from_city} → ${flightItem.to || flightItem.to_city}`;
    }
    return null;
  };

  // Get chat request status - IMPORTANT: Different status for payable vs non-payable items
  const getChatRequestStatus = (cr, isExpired, isPayable = false) => {
    if (cr.payment_status === 'paid' || cr.status === 'paid') {
      return { label: 'PAID', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' };
    }
    if (isExpired && isPayable) {
      return { label: 'EXPIRED', bgColor: 'bg-gray-50', textColor: 'text-gray-400', borderColor: 'border-gray-200' };
    }
    if (cr.status === 'completed') {
      return { label: 'COMPLETED', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' };
    }
    if (cr.status === 'in_progress') {
      return { label: 'IN PROGRESS', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' };
    }
    // For payable items (empty legs, extras) - show PENDING PAYMENT
    if (isPayable) {
      return { label: 'PENDING PAYMENT', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' };
    }
    // For non-payable items (jets, helicopters, yachts) - show QUOTE PENDING
    return { label: 'QUOTE PENDING', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' };
  };

  // Get booking type from data
  const getBookingType = (booking) => {
    const type = booking.booking_type || booking.service_type;
    if (type?.includes('empty_leg')) return 'empty_leg';
    if (type?.includes('jet')) return 'jet';
    if (type?.includes('helicopter')) return 'helicopter';
    if (type?.includes('yacht')) return 'yacht';
    if (type?.includes('car')) return 'car';
    if (type?.includes('wine')) return 'wine';
    if (type?.includes('cart')) return 'cart';
    return type || 'booking';
  };

  // Get booking title
  const getBookingTitle = (booking) => {
    if (booking.service_title) return booking.service_title;
    const type = booking.booking_type || 'Booking';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get booking route
  const getBookingRoute = (booking) => {
    if (booking.from_location && booking.to_location) {
      return `${booking.from_location} → ${booking.to_location}`;
    }
    return null;
  };

  // Get booking status - Bookings are typically already paid items
  const getBookingStatus = (booking, isExpired = false, isPayable = false) => {
    if (booking.payment_status === 'paid' || booking.status === 'confirmed') {
      return { label: 'PAID', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' };
    }
    if (isExpired && isPayable) {
      return { label: 'EXPIRED', bgColor: 'bg-gray-50', textColor: 'text-gray-400', borderColor: 'border-gray-200' };
    }
    if (booking.payment_status === 'pending' && isPayable) {
      return { label: 'PENDING PAYMENT', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' };
    }
    if (isPayable) {
      return { label: 'PENDING PAYMENT', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' };
    }
    return { label: 'QUOTE PENDING', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' };
  };

  // Get request type - extract from items if available
  const getRequestType = (request) => {
    // First, try to get type from the actual items in data
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    const items = data.items || data.cart_items || [];
    if (items.length > 0) {
      const itemType = (items[0].type || '').toLowerCase();
      if (itemType.includes('jet')) return 'jet';
      if (itemType.includes('heli')) return 'helicopter';
      if (itemType.includes('empty')) return 'empty_leg';
      if (itemType.includes('ground') || itemType.includes('taxi') || itemType.includes('transfer')) return 'car';
      if (itemType.includes('yacht')) return 'yacht';
      if (itemType.includes('wine') || itemType.includes('cigar')) return 'wine';
    }

    // Fallback to request.type field
    const type = request.type || 'request';
    if (type.includes('empty_leg') || type.includes('emptyleg')) return 'empty_leg';
    if (type.includes('jet') || type.includes('aircraft')) return 'jet';
    if (type.includes('helicopter') || type.includes('heli')) return 'helicopter';
    if (type.includes('yacht')) return 'yacht';
    if (type.includes('car') || type.includes('transfer') || type.includes('taxi')) return 'car';
    if (type.includes('wine') || type.includes('cigar')) return 'wine';
    if (type.includes('cart') || type.includes('ai_chat')) return 'cart';
    return type;
  };

  // Get request title - extract actual service types from items
  const getRequestTitle = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    // For custom requests, use the provided name
    if (request.type === 'custom_request') return data.name || 'Custom Request';

    // Extract items from various data structures
    const items = data.items || data.cart_items || [];

    if (items.length > 0) {
      const first = items[0];
      const type = (first.type || '').toLowerCase();

      // Get readable label from type
      let label = serviceTypeLabels[type];

      // If no direct match, try to match partial
      if (!label) {
        for (const [key, val] of Object.entries(serviceTypeLabels)) {
          if (type.includes(key)) {
            label = val;
            break;
          }
        }
      }

      // Fallback to item properties or formatted type
      if (!label) {
        label = first.title || first.aircraft_type || first.name ||
                type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service';
      }

      // Add count if multiple items
      if (items.length > 1) {
        return `${label} +${items.length - 1} more`;
      }

      return label;
    }

    // Fallback to request type
    return request.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Request';
  };

  // Get request route
  const getRequestRoute = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    const items = data.items || data.cart_items || [];
    if (items.length > 0) {
      const firstItem = items[0];
      const from = firstItem.from || firstItem.from_city || firstItem.origin || firstItem.departure_airport ||
                   (firstItem.legs && firstItem.legs[0]?.from);
      const to = firstItem.to || firstItem.to_city || firstItem.destination || firstItem.arrival_airport ||
                 (firstItem.legs && firstItem.legs[firstItem.legs.length - 1]?.location);
      if (from && to) return `${from} → ${to}`;
    }

    if (data.from && data.to) return `${data.from} → ${data.to}`;
    return null;
  };

  // Get request price
  const getRequestPrice = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    if (data.summary?.grand_total) return data.summary.grand_total;

    const items = data.items || data.cart_items || [];
    if (items.length > 0) {
      return items.reduce((sum, item) => sum + (item.price || item.totalWithFee || 0), 0);
    }

    return data.price || 0;
  };

  // Get request status - IMPORTANT: Different status for payable vs non-payable items
  const getRequestStatus = (request, isExpired = false, isPayable = false) => {
    if (request.status === 'completed' || request.payment_status === 'paid') {
      return { label: 'PAID', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' };
    }
    if (isExpired && isPayable) {
      // Only show EXPIRED for payable items (empty legs, extras)
      return { label: 'EXPIRED', bgColor: 'bg-gray-50', textColor: 'text-gray-400', borderColor: 'border-gray-200' };
    }
    if (request.status === 'in_progress') {
      return { label: 'IN PROGRESS', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' };
    }
    if (request.status === 'cancelled') {
      return { label: 'CANCELLED', bgColor: 'bg-gray-50', textColor: 'text-gray-400', borderColor: 'border-gray-200' };
    }
    // For payable items (empty legs, extras) - show PENDING PAYMENT
    if (isPayable) {
      return { label: 'PENDING PAYMENT', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' };
    }
    // For non-payable items (jets, helicopters, yachts) - show QUOTE PENDING
    return { label: 'QUOTE PENDING', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' };
  };

  // Get activity icon
  const getActivityIcon = (type) => {
    const icons = {
      empty_leg: Plane,
      emptyleg: Plane,
      jet: Plane,
      helicopter: Plane,
      yacht: Anchor,
      car: Car,
      transfer: Car,
      taxi: Car,
      wine: Wine,
      cart: Package,
      booking: Package,
      request: MessageSquare
    };
    return icons[type] || Package;
  };

  // Format date header
  const formatDateHeader = (dateKey) => {
    const date = parseISO(dateKey);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const dateKey = format(parseISO(activity.created_at), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {});

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'paid') return activity.activityStatus.label === 'PAID';
    if (filter === 'pending') {
      // Pending section: Show ONLY payable items (empty legs, extras) that are not yet paid
      // Include: pending payment, expired (so user knows it expired)
      // Exclude: non-payable requests (quote pending, etc)
      if (!activity.isPayable) return false;
      return ['PENDING PAYMENT', 'EXPIRED'].includes(activity.activityStatus.label);
    }
    if (filter === 'expired') return activity.isExpired === true;
    if (filter === 'requests') return activity.source === 'request' && !activity.isPayable;
    if (filter === 'ai') return activity.isFromAI === true;
    return true;
  });

  // Separate into 4 sections:
  // 1. REQUESTS - Non-AI quote requests (jets, helicopters, yachts submitted via forms)
  const requestActivities = filteredActivities.filter(a =>
    !a.isFromAI &&
    ['QUOTE PENDING', 'IN PROGRESS'].includes(a.activityStatus.label)
  );

  // 2. PENDING PAYMENTS - Payable items NOT from AI chat (direct empty leg bookings)
  //    AI cart items go to AI REQUESTS section instead
  const pendingPaymentActivities = filteredActivities.filter(a =>
    !a.isFromAI &&
    a.isPayable &&
    ['PENDING PAYMENT', 'EXPIRED'].includes(a.activityStatus.label)
  );

  // 3. PAID - All paid/completed items from any source
  const paidActivities = filteredActivities.filter(a =>
    a.activityStatus.label === 'PAID' || a.activityStatus.label === 'COMPLETED'
  );

  // 4. AI REQUESTS - ALL items from AI chat that are not paid yet
  //    This includes empty legs, wine, jets, etc - all cart submissions
  const aiRequestActivities = filteredActivities.filter(a =>
    a.isFromAI === true &&
    !['PAID', 'COMPLETED'].includes(a.activityStatus.label)
  );

  // Group by date helper
  const groupByDate = (items) => items.reduce((groups, activity) => {
    const dateKey = format(parseISO(activity.created_at), 'yyyy-MM-dd');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(activity);
    return groups;
  }, {});

  const requestsGrouped = groupByDate(requestActivities);
  const pendingGrouped = groupByDate(pendingPaymentActivities);
  const paidGrouped = groupByDate(paidActivities);
  const aiGrouped = groupByDate(aiRequestActivities);

  // Calculate stats - focused on payable items
  const paidCount = activities.filter(a => a.activityStatus.label === 'PAID').length;
  const pendingPayableCount = activities.filter(a =>
    a.isPayable && a.activityStatus.label === 'PENDING PAYMENT'
  ).length;
  const expiredCount = activities.filter(a => a.isExpired).length;
  // Only count paid items in total value
  const totalPaidValue = activities
    .filter(a => a.activityStatus.label === 'PAID')
    .reduce((sum, a) => sum + (a.displayPrice || 0), 0);

  // Handle Pay Now for empty legs
  const handlePayNow = async (activity) => {
    setProcessingPayment(activity.id);
    try {
      let data = activity.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = {}; }
      }

      const items = data?.items || data?.cart_items || [];
      const firstItem = items[0] || data || {};

      const response = await fetch('/api/coingate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'empty_leg',
          serviceId: data.empty_leg_id || firstItem.id || activity.id,
          priceUSD: Math.round(activity.displayPrice * 100) / 100,
          email: user.email,
          contactName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
          serviceTitle: activity.displayTitle,
          serviceDescription: activity.displayRoute || 'Empty Leg Flight',
          orderDescription: `Empty Leg: ${activity.displayRoute || 'Flight'}`,
          requestId: activity.id
        })
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        window.open(result.paymentUrl, '_blank');
      } else {
        throw new Error(result.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(null);
    }
  };

  // Check if item can be paid now
  const canPayNow = (activity) => {
    // Already paid or expired - can't pay
    if (activity.activityStatus.label === 'PAID') return false;
    if (activity.isExpired) return false;

    // Must be payable and have a price
    if (!activity.isPayable) return false;
    if (!activity.displayPrice || activity.displayPrice <= 0) return false;

    // Cancelled items can't be paid
    if (activity.status === 'cancelled') return false;

    return true;
  };

  // Get time remaining for payment (for CoinGate sessions)
  const getTimeRemaining = (activity) => {
    if (activity.isExpired || activity.activityStatus.label === 'PAID') return null;

    // Check coingate_expire_at first
    if (activity.metadata?.coingate_expire_at) {
      const expireAt = new Date(activity.metadata.coingate_expire_at);
      const now = new Date();
      if (expireAt > now) {
        const mins = differenceInMinutes(expireAt, now);
        return mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
      }
    }

    // For items with coingate_order_id, calculate 60 min from creation
    if (activity.coingate_order_id || activity.metadata?.coingate_order_id) {
      const createdAt = new Date(activity.created_at);
      const expiryTime = new Date(createdAt.getTime() + 60 * 60 * 1000);
      const now = new Date();
      if (expiryTime > now) {
        const mins = differenceInMinutes(expiryTime, now);
        return mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
      }
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
          </video>
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
              <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">My Activity</h1>
              <p className="text-xs text-gray-400 mt-0.5">All bookings, requests, and orders</p>
            </div>
          </div>
        </div>

        {/* Stats - Minimal Inline */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div>
            <span className="text-gray-400">Total</span>
            <span className="ml-2 font-medium text-gray-900">{activities.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Paid</span>
            <span className="ml-2 font-medium text-emerald-600">{paidCount}</span>
          </div>
          <div>
            <span className="text-gray-400">Pending Payment</span>
            <span className="ml-2 font-medium text-amber-600">{pendingPayableCount}</span>
          </div>
          {expiredCount > 0 && (
            <div>
              <span className="text-gray-400">Expired</span>
              <span className="ml-2 font-medium text-gray-400">{expiredCount}</span>
            </div>
          )}
          {totalPaidValue > 0 && (
            <div>
              <span className="text-gray-400">Paid Value</span>
              <span className="ml-2 font-medium text-emerald-600">${totalPaidValue.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-4">
          {[
            { id: 'all', label: 'All' },
            { id: 'paid', label: 'Paid' },
            { id: 'pending', label: 'Pending' },
            { id: 'requests', label: 'Requests' },
            { id: 'ai', label: 'AI Chat' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-white/70 text-gray-700 border border-gray-200/50'
                  : 'text-gray-500 hover:bg-white/50'
              }`}
              style={filter === f.id ? { backdropFilter: 'blur(8px)' } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {/* Empty State */}
        {filteredActivities.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {filter !== 'all' ? 'No activity matching this filter' : 'No activity yet'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="px-4 py-2 bg-white/60 text-gray-700 text-sm rounded-lg hover:bg-white/80 transition-all border border-gray-200/50"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                Show All
              </button>
            )}
          </div>
        )}

        {/* Activity List - 4 Sections: Requests, Pending Payments, Paid, AI Requests */}
        <div className="space-y-8">

          {/* 1. REQUESTS - Quote pending (jets, helicopters, yachts) */}
          {requestActivities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <h3 className="text-sm font-medium text-gray-700">Requests</h3>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{requestActivities.length}</span>
              </div>
              <div className="space-y-4">
                {Object.entries(requestsGrouped)
                  .sort(([a], [b]) => new Date(b) - new Date(a))
                  .map(([dateKey, dateActivities]) => (
                    <div key={`requests-${dateKey}`}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">
                        {formatDateHeader(dateKey)}
                      </p>
                      <div className="space-y-2">
                        {dateActivities.map(activity => {
                          const Icon = getActivityIcon(activity.activityType);
                          const isExpanded = expandedId === activity.id;
                          return (
                            <ActivityCard
                              key={activity.id}
                              activity={activity}
                              Icon={Icon}
                              isExpanded={isExpanded}
                              showPayNow={false}
                              expandedId={expandedId}
                              setExpandedId={setExpandedId}
                              handlePayNow={handlePayNow}
                              processingPayment={processingPayment}
                              getTimeRemaining={getTimeRemaining}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 2. PENDING PAYMENTS - Empty legs + Extras awaiting payment */}
          {pendingPaymentActivities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <h3 className="text-sm font-medium text-gray-700">Pending Payments</h3>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{pendingPaymentActivities.length}</span>
              </div>
              <div className="space-y-4">
                {Object.entries(pendingGrouped)
                  .sort(([a], [b]) => new Date(b) - new Date(a))
                  .map(([dateKey, dateActivities]) => (
                    <div key={`pending-${dateKey}`}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">
                        {formatDateHeader(dateKey)}
                      </p>
                      <div className="space-y-2">
                        {dateActivities.map(activity => {
                          const Icon = getActivityIcon(activity.activityType);
                          const isExpanded = expandedId === activity.id;
                          const showPayNow = canPayNow(activity);
                          return (
                            <ActivityCard
                              key={activity.id}
                              activity={activity}
                              Icon={Icon}
                              isExpanded={isExpanded}
                              showPayNow={showPayNow}
                              expandedId={expandedId}
                              setExpandedId={setExpandedId}
                              handlePayNow={handlePayNow}
                              processingPayment={processingPayment}
                              getTimeRemaining={getTimeRemaining}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 3. PAID / CONFIRMED */}
          {paidActivities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <h3 className="text-sm font-medium text-gray-700">Confirmed & Paid</h3>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{paidActivities.length}</span>
              </div>
              <div className="space-y-4">
                {Object.entries(paidGrouped)
                  .sort(([a], [b]) => new Date(b) - new Date(a))
                  .map(([dateKey, dateActivities]) => (
                    <div key={`paid-${dateKey}`}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">
                        {formatDateHeader(dateKey)}
                      </p>
                      <div className="space-y-2">
                        {dateActivities.map(activity => {
                          const Icon = getActivityIcon(activity.activityType);
                          const isExpanded = expandedId === activity.id;
                          return (
                            <ActivityCard
                              key={activity.id}
                              activity={activity}
                              Icon={Icon}
                              isExpanded={isExpanded}
                              showPayNow={false}
                              expandedId={expandedId}
                              setExpandedId={setExpandedId}
                              handlePayNow={handlePayNow}
                              processingPayment={processingPayment}
                              getTimeRemaining={getTimeRemaining}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 4. AI REQUESTS - Submitted from AI chat */}
          {aiRequestActivities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <h3 className="text-sm font-medium text-gray-700">AI Requests</h3>
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{aiRequestActivities.length}</span>
              </div>
              <div className="space-y-4">
                {Object.entries(aiGrouped)
                  .sort(([a], [b]) => new Date(b) - new Date(a))
                  .map(([dateKey, dateActivities]) => (
                    <div key={`ai-${dateKey}`}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">
                        {formatDateHeader(dateKey)}
                      </p>
                      <div className="space-y-2">
                        {dateActivities.map(activity => {
                          const Icon = getActivityIcon(activity.activityType);
                          const isExpanded = expandedId === activity.id;
                          const showPayNow = canPayNow(activity);
                          return (
                            <ActivityCard
                              key={activity.id}
                              activity={activity}
                              Icon={Icon}
                              isExpanded={isExpanded}
                              showPayNow={showPayNow}
                              expandedId={expandedId}
                              setExpandedId={setExpandedId}
                              handlePayNow={handlePayNow}
                              processingPayment={processingPayment}
                              getTimeRemaining={getTimeRemaining}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Activity Card Component
const ActivityCard = ({
  activity, Icon, isExpanded, showPayNow, expandedId, setExpandedId,
  handlePayNow, processingPayment, getTimeRemaining
}) => {
  return (
    <div
      className="bg-white/70 border border-gray-100/80 rounded-xl overflow-hidden hover:border-gray-200/80 transition-all"
      style={{ backdropFilter: 'blur(10px)' }}
    >
      {/* Main Row */}
      <div
        className="px-4 py-3 flex items-center gap-4 cursor-pointer"
        onClick={() => setExpandedId(isExpanded ? null : activity.id)}
      >
        {/* Icon */}
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
            activity.activityStatus.label === 'PAID'
              ? 'bg-gray-900 text-white border-gray-800'
              : 'bg-white/60 text-gray-600 border-gray-200/50'
          }`}
          style={activity.activityStatus.label !== 'PAID' ? { backdropFilter: 'blur(8px)' } : {}}
        >
          <Icon size={16} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.displayTitle}
            </p>
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${activity.activityStatus.bgColor} ${activity.activityStatus.textColor} ${activity.activityStatus.borderColor}`}>
              {activity.activityStatus.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
            {activity.displayRoute && (
              <>
                <span>{activity.displayRoute}</span>
                <span>•</span>
              </>
            )}
            <span>{formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Price display logic - only show price if PAID or PAYABLE with a price */}
        <div className="text-right flex-shrink-0">
          {activity.activityStatus.label === 'PAID' || activity.activityStatus.label === 'COMPLETED' ? (
            activity.displayPrice > 0 ? (
              <>
                <p className="text-sm font-semibold text-emerald-600">
                  ${activity.displayPrice.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">USD • Paid</p>
              </>
            ) : (
              <p className="text-[10px] text-emerald-500 font-medium">Confirmed</p>
            )
          ) : activity.isExpired && activity.isPayable ? (
            <>
              <p className="text-xs font-medium text-gray-400 line-through">
                ${activity.displayPrice?.toLocaleString() || '—'}
              </p>
              <p className="text-[10px] text-red-500">Expired</p>
            </>
          ) : activity.isPayable && activity.displayPrice > 0 ? (
            <>
              <p className="text-sm font-semibold text-gray-900">
                ${activity.displayPrice.toLocaleString()}
              </p>
              <p className="text-[10px] text-amber-500">Pay Now</p>
            </>
          ) : (
            // Non-payable requests - don't show price, just status
            <p className="text-[10px] text-blue-500 font-medium">Quote pending</p>
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
          <ActivityDetails activity={activity} />

          {/* Pay Now for Payable Items (Empty Legs, Extras) */}
          {showPayNow && (
            <div className="mt-4 p-3 bg-amber-50/80 rounded-lg border border-amber-200/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span className="text-xs text-amber-800 font-medium">
                    {activity.activityType === 'empty_leg' || activity.activityType === 'emptyleg'
                      ? 'Empty legs expire quickly - secure now'
                      : 'Complete your payment'}
                  </span>
                </div>
                {getTimeRemaining(activity) && (
                  <div className="flex items-center gap-1 text-xs text-amber-700">
                    <Timer size={12} />
                    <span>{getTimeRemaining(activity)} left</span>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handlePayNow(activity); }}
                disabled={processingPayment === activity.id}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-medium disabled:opacity-50"
              >
                {processingPayment === activity.id ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={14} />
                    Pay Now - ${activity.displayPrice?.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Expired Notice for Payable Items - Show "Try Again" for empty legs */}
          {activity.isPayable && activity.isExpired && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">
                    {activity.activityType === 'empty_leg' || activity.activityType === 'emptyleg'
                      ? 'Empty leg expired'
                      : 'Payment session expired'}
                  </span>
                </div>
                {(activity.activityType === 'empty_leg' || activity.activityType === 'emptyleg') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to AI chat dashboard where user can search again
                      window.location.href = '/dashboard/chat';
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <MessageSquare size={12} />
                    Try Again
                  </button>
                )}
              </div>
              {!(activity.activityType === 'empty_leg' || activity.activityType === 'emptyleg') && (
                <p className="text-xs text-gray-400 mt-1">
                  Please contact support to request a new payment link.
                </p>
              )}
            </div>
          )}

          {/* Reference ID */}
          <div className="flex items-center mt-3">
            <span className="text-[10px] text-gray-300 font-mono">
              Ref: {activity.id?.slice(0, 8)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Activity Details component
const ActivityDetails = ({ activity }) => {
  let data = activity.data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (e) { data = {}; }
  }
  data = data || {};

  const items = data.items || data.cart_items || [];

  return (
    <div className="space-y-3">
      {/* Items list if cart */}
      {items.length > 1 && (
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Items ({items.length})</p>
          <div className="space-y-1">
            {items.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{item.name || item.title || `Item ${idx + 1}`}</span>
                {item.price && (
                  <span className="text-sm text-gray-500">${item.price?.toLocaleString()}</span>
                )}
              </div>
            ))}
            {items.length > 4 && (
              <p className="text-xs text-gray-400 pt-1">+{items.length - 4} more items</p>
            )}
          </div>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(data.passengers || data.pax || items[0]?.passengers) && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Passengers</p>
            <p className="text-sm text-gray-900">{data.passengers || data.pax || items[0]?.passengers}</p>
          </div>
        )}
        {(data.departure_date || items[0]?.departure_date) && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Date</p>
            <p className="text-sm text-gray-900">
              {format(parseISO(data.departure_date || items[0]?.departure_date), 'MMM d, yyyy')}
            </p>
          </div>
        )}
        {(data.aircraft_type || data.aircraft || items[0]?.aircraft_type) && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Aircraft</p>
            <p className="text-sm text-gray-900">{data.aircraft_type || data.aircraft || items[0]?.aircraft_type}</p>
          </div>
        )}
        {activity.source === 'booking' && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Type</p>
            <p className="text-sm text-gray-900">Booking</p>
          </div>
        )}
      </div>

      {/* Transaction hash for bookings */}
      {activity.source === 'booking' && activity.transaction_hash && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Transaction Hash</p>
          <p className="text-xs text-gray-700 font-mono truncate">{activity.transaction_hash}</p>
        </div>
      )}

      {/* Summary for requests with summary data */}
      {data.summary && (
        <div className="bg-white/60 rounded-lg p-3 border border-gray-200/50" style={{ backdropFilter: 'blur(8px)' }}>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Summary</p>
          <div className="space-y-1.5 text-sm">
            {data.summary.services_count > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Services</span>
                <span className="text-gray-700">{data.summary.services_count}</span>
              </div>
            )}
            {data.summary.extras_count > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Extras</span>
                <span className="text-gray-700">{data.summary.extras_count}</span>
              </div>
            )}
            {data.summary.grand_total && (
              <div className="flex justify-between pt-1.5 border-t border-gray-200/50 font-medium">
                <span className="text-gray-700">Total</span>
                <span className="text-gray-900">${data.summary.grand_total.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyActivityView;
