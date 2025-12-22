import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Plane,
  Ship,
  Zap,
  Car,
  FileText,
  Activity,
  Clock,
  CheckCircle,
  X,
  RefreshCw,
  Shield,
  CreditCard,
  Bot,
  Wallet,
  Package,
  Eye,
  Mail,
  Phone,
  MapPin,
  Globe,
  UserCheck,
  Ticket,
  Search,
  Bell,
  MessageSquare,
  DollarSign,
  Copy
} from 'lucide-react';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';

interface DashboardMetric {
  id: string;
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

interface DashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeTab: externalActiveTab, setActiveTab: externalSetActiveTab }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Use external tab control if provided, otherwise use internal state
  const [internalActiveTab, setInternalActiveTab] = useState<string>('dashboard');
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = externalSetActiveTab || setInternalActiveTab;

  // Map sidebar section to tab view (dashboard = overview)
  const currentView = activeTab === 'dashboard' ? 'overview' : activeTab;
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Metrics state
  const [metrics, setMetrics] = useState<DashboardMetric[]>([
    { id: 'total_users', title: 'Registered Users', value: 0, icon: <Users className="w-6 h-6" />, color: 'blue' },
    { id: 'total_requests', title: 'User Requests', value: 0, icon: <FileText className="w-6 h-6" />, color: 'green' },
    { id: 'total_bookings', title: 'Bookings', value: 0, icon: <Calendar className="w-6 h-6" />, color: 'purple' },
    { id: 'empty_legs', title: 'Empty Legs', value: 0, icon: <Plane className="w-6 h-6" />, color: 'orange' },
    { id: 'active_subscriptions', title: 'Active Subscriptions', value: 0, icon: <CreditCard className="w-6 h-6" />, color: 'indigo' },
    { id: 'pending_kyc', title: 'Pending KYC', value: 0, icon: <Shield className="w-6 h-6" />, color: 'yellow' },
  ]);

  // Data states
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [emptyLegs, setEmptyLegs] = useState<any[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [kycApplications, setKycApplications] = useState<any[]>([]);
  const [tokenizationDrafts, setTokenizationDrafts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all data on mount
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchRegisteredUsers(),
        fetchUserRequests(),
        fetchUserBookings(),
        fetchEmptyLegs(),
        fetchUserSubscriptions(),
        fetchKycApplications(),
        fetchTokenizationDrafts(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
    showSuccess('Dashboard refreshed');
  };

  const fetchMetrics = async () => {
    try {
      console.log('📊 Fetching metrics...');
      const [
        usersCount,
        requestsCount,
        bookingsCount,
        emptyLegsCount,
        activeSubsCount,
        pendingKycCount
      ] = await Promise.all([
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('user_requests').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('user_bookings').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('EmptyLegs_').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).neq('subscription_tier', 'explorer'),
        supabaseAdmin.from('kyc_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      console.log('📊 Metrics results:', {
        users: usersCount,
        requests: requestsCount,
        bookings: bookingsCount,
        emptyLegs: emptyLegsCount,
        subscriptions: activeSubsCount,
        kyc: pendingKycCount
      });

      // Log any errors
      if (usersCount.error) console.error('❌ Users count error:', usersCount.error);
      if (requestsCount.error) console.error('❌ Requests count error:', requestsCount.error);
      if (bookingsCount.error) console.error('❌ Bookings count error:', bookingsCount.error);
      if (emptyLegsCount.error) console.error('❌ EmptyLegs count error:', emptyLegsCount.error);
      if (activeSubsCount.error) console.error('❌ Subscriptions count error:', activeSubsCount.error);
      if (pendingKycCount.error) console.error('❌ KYC count error:', pendingKycCount.error);

      setMetrics(prev => [
        { ...prev[0], value: usersCount.count || 0 },
        { ...prev[1], value: requestsCount.count || 0 },
        { ...prev[2], value: bookingsCount.count || 0 },
        { ...prev[3], value: emptyLegsCount.count || 0 },
        { ...prev[4], value: activeSubsCount.count || 0 },
        { ...prev[5], value: pendingKycCount.count || 0 },
      ]);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchRegisteredUsers = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegisteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setRegisteredUsers([]);
    }
  };

  const fetchUserRequests = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRequests(data || []);
    } catch (error) {
      console.error('Error fetching user requests:', error);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserBookings(data || []);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
  };

  const fetchEmptyLegs = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('EmptyLegs_')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmptyLegs(data || []);
    } catch (error) {
      console.error('Error fetching empty legs:', error);
      setEmptyLegs([]);
    }
  };

  const fetchUserSubscriptions = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .not('subscription_tier', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUserSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchKycApplications = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('kyc_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKycApplications(data || []);
    } catch (error) {
      console.error('Error fetching KYC applications:', error);
    }
  };

  const fetchTokenizationDrafts = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('tokenization_drafts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokenizationDrafts(data || []);
    } catch (error) {
      console.error('Error fetching tokenization drafts:', error);
      setTokenizationDrafts([]);
    }
  };

  // Helper to get user email by ID
  const getUserEmail = (userId: string) => {
    const user = registeredUsers.find(u => u.id === userId);
    return user?.email || 'Unknown';
  };

  // Helper to get full user by ID
  const getUserById = (userId: string) => {
    return registeredUsers.find(u => u.id === userId);
  };

  // Helper to format price - FIXED to handle all price fields properly
  const formatPrice = (price: number | string | undefined | null, currency: string = 'USD') => {
    if (price === undefined || price === null || price === '') return 'N/A';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num) || num === 0) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
  };

  // Helper to extract total price from request/booking data - handles all possible field names
  const extractTotalPrice = (item: any): number => {
    // Check direct fields first (bookings.ts structure)
    if (item.total_amount && !isNaN(parseFloat(item.total_amount))) {
      return parseFloat(item.total_amount);
    }
    if (item.total_price && !isNaN(parseFloat(item.total_price))) {
      return parseFloat(item.total_price);
    }
    if (item.base_price && !isNaN(parseFloat(item.base_price))) {
      return parseFloat(item.base_price);
    }
    // Check inside data JSONB field - all possible field names (AI Chat structure)
    const data = item.data || {};
    const priceFields = [
      data.total,
      data.total_price_usd,
      data.total_price,
      data.estimated_total,
      data.price,
      data.grandTotal,
      data.amount,
      data.total_amount
    ];
    for (const price of priceFields) {
      if (price !== undefined && price !== null && !isNaN(parseFloat(price))) {
        return parseFloat(price);
      }
    }
    // Sum cart items if available
    if (data.cart_items && Array.isArray(data.cart_items) && data.cart_items.length > 0) {
      return data.cart_items.reduce((sum: number, cartItem: any) => {
        const itemPrice = cartItem.total_price_usd || cartItem.total_price || cartItem.price || 0;
        return sum + (parseFloat(itemPrice) || 0);
      }, 0);
    }
    return 0;
  };

  // Helper to get email from request/booking - checks all possible fields
  const extractEmail = (item: any): string => {
    // Direct fields (bookings.ts structure first)
    if (item.contact_email) return item.contact_email;
    if (item.email) return item.email;
    if (item.user_email) return item.user_email;
    if (item.client_email) return item.client_email;
    // Data JSONB field (AI Chat structure)
    const data = item.data || {};
    if (data.client_email) return data.client_email;
    if (data.email) return data.email;
    if (data.contact_email) return data.contact_email;
    if (data.user_email) return data.user_email;
    // Metadata field (bookings.ts can store in metadata)
    const metadata = item.metadata || {};
    if (metadata.email) return metadata.email;
    if (metadata.contact_email) return metadata.contact_email;
    // Try to get from user_id
    if (item.user_id) {
      const user = getUserById(item.user_id);
      if (user?.email) return user.email;
    }
    return 'Unknown';
  };

  // Helper to get contact name from request/booking
  const extractContactName = (item: any): string => {
    // Direct fields (bookings.ts structure)
    if (item.contact_name) return item.contact_name;
    // Data JSONB field
    const data = item.data || {};
    if (data.contact_name) return data.contact_name;
    if (data.first_name || data.last_name) {
      return `${data.first_name || ''} ${data.last_name || ''}`.trim();
    }
    // Metadata field
    const metadata = item.metadata || {};
    if (metadata.contact_name) return metadata.contact_name;
    // User lookup
    if (item.user_id) {
      const user = getUserById(item.user_id);
      if (user) {
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || '';
      }
    }
    return '';
  };

  // Helper to safely extract location string - handles objects and strings
  const extractLocation = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      // Could be {city: 'X', iata: 'Y'} or {name: 'X'} or similar
      return value.city || value.name || value.location || value.airport || value.label || '';
    }
    return String(value);
  };

  // Helper to get route from item
  const extractRoute = (item: any): { from: string; to: string } | null => {
    const data = item.data || {};
    // Check direct fields first (bookings.ts)
    const origin = extractLocation(item.origin) || extractLocation(data.from_city) || extractLocation(data.from) || extractLocation(data.origin) || extractLocation(data.departure) || '';
    const dest = extractLocation(item.destination) || extractLocation(data.to_city) || extractLocation(data.to) || extractLocation(data.destination) || extractLocation(data.arrival) || '';
    if (origin || dest) {
      return { from: origin || 'N/A', to: dest || 'N/A' };
    }
    return null;
  };

  // Update KYC status
  const handleKycStatusUpdate = async (kycId: string, userId: string, newStatus: string) => {
    try {
      const { error: kycError } = await supabaseAdmin
        .from('kyc_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', kycId);

      if (kycError) throw kycError;

      if (newStatus === 'approved') {
        await supabaseAdmin
          .from('users')
          .update({ email_verified: true })
          .eq('id', userId);

        await supabaseAdmin
          .from('user_profiles')
          .update({ is_verified: true, kyc_status: 'approved' })
          .eq('user_id', userId);
      }

      showSuccess(`KYC status updated to ${newStatus}`);
      fetchKycApplications();
      fetchMetrics();
    } catch (error) {
      console.error('Error updating KYC status:', error);
      showError('Failed to update KYC status');
    }
  };

  // Update request status
  const handleRequestStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      // Find the request to get user_id for notification
      const request = userRequests.find(r => r.id === requestId);
      const previousStatus = request?.status;

      const { error } = await supabaseAdmin
        .from('user_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for the user when status changes
      if (request?.user_id && previousStatus !== newStatus) {
        const statusMessages: Record<string, { title: string; message: string }> = {
          'in_progress': {
            title: 'Request In Progress',
            message: `Your ${request.data?.serviceType || 'travel'} request is now being processed by our team.`
          },
          'confirmed': {
            title: 'Request Confirmed!',
            message: `Great news! Your ${request.data?.serviceType || 'travel'} request has been confirmed.`
          },
          'completed': {
            title: 'Request Completed',
            message: `Your ${request.data?.serviceType || 'travel'} request has been completed. Thank you for choosing PrivateCharterX!`
          },
          'cancelled': {
            title: 'Request Cancelled',
            message: `Your ${request.data?.serviceType || 'travel'} request has been cancelled. Please contact support if you have questions.`
          }
        };

        const notificationInfo = statusMessages[newStatus];
        if (notificationInfo) {
          try {
            await supabaseAdmin.from('notifications').insert({
              user_id: request.user_id,
              type: 'booking_update',
              title: notificationInfo.title,
              message: notificationInfo.message,
              data: {
                request_id: requestId,
                old_status: previousStatus,
                new_status: newStatus,
                service_type: request.data?.serviceType
              },
              read: false
            });
          } catch (notifError) {
            console.warn('Failed to create user notification:', notifError);
          }
        }
      }

      showSuccess(`Request status updated to ${newStatus}`);
      fetchUserRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      showError('Failed to update request status');
    }
  };

  // Update booking status
  const handleBookingStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      // Find the booking to get user_id for notification
      const booking = userBookings.find(b => b.id === bookingId);
      const previousStatus = booking?.status;

      const { error } = await supabaseAdmin
        .from('user_bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      // Create notification for the user when status changes
      if (booking?.user_id && previousStatus !== newStatus) {
        const statusMessages: Record<string, { title: string; message: string }> = {
          'in_progress': {
            title: 'Booking In Progress',
            message: `Your ${booking.data?.serviceType || 'travel'} booking is now being processed by our team.`
          },
          'confirmed': {
            title: 'Booking Confirmed!',
            message: `Great news! Your ${booking.data?.serviceType || 'travel'} booking has been confirmed.`
          },
          'completed': {
            title: 'Booking Completed',
            message: `Your ${booking.data?.serviceType || 'travel'} booking has been completed. Thank you for choosing PrivateCharterX!`
          },
          'cancelled': {
            title: 'Booking Cancelled',
            message: `Your ${booking.data?.serviceType || 'travel'} booking has been cancelled. Please contact support if you have questions.`
          }
        };

        const notificationInfo = statusMessages[newStatus];
        if (notificationInfo) {
          try {
            await supabaseAdmin.from('notifications').insert({
              user_id: booking.user_id,
              type: 'booking_update',
              title: notificationInfo.title,
              message: notificationInfo.message,
              data: {
                booking_id: bookingId,
                old_status: previousStatus,
                new_status: newStatus,
                service_type: booking.data?.serviceType
              },
              read: false
            });
          } catch (notifError) {
            console.warn('Failed to create user notification:', notifError);
          }
        }
      }

      showSuccess(`Booking status updated to ${newStatus}`);
      fetchUserBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      showError('Failed to update booking status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
      paid: 'bg-green-100 text-green-800',
      confirmed: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      available: 'bg-green-100 text-green-800',
      booked: 'bg-blue-100 text-blue-800',
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getRequestTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      empty_leg: <Plane className="w-4 h-4" />,
      helicopter_charter: <Zap className="w-4 h-4" />,
      adventure_package: <Package className="w-4 h-4" />,
      luxury_car_rental: <Car className="w-4 h-4" />,
      tokenization: <Wallet className="w-4 h-4" />,
      taxi_concierge: <Car className="w-4 h-4" />,
      nft_free_flight: <Plane className="w-4 h-4" />,
      yacht_charter: <Ship className="w-4 h-4" />,
      jet_charter: <Plane className="w-4 h-4" />,
    };
    return icons[type] || <FileText className="w-4 h-4" />;
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#f8f9fa] min-h-screen">
      {/* Header - Clean Minimal Design */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl text-gray-800 font-medium">Platform CRM</h1>
          <p className="text-sm text-gray-400">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2.5 text-gray-400 hover:text-gray-600 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid - Clean Minimal Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-50 text-gray-400">
                {metric.icon}
              </div>
            </div>
            <p className="text-2xl text-gray-800 mb-1">{metric.value.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{metric.title}</p>
          </div>
        ))}
      </div>

      {/* Revenue Summary - Clean Cards */}
      {currentView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">Total Bookings Revenue</p>
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <p className="text-2xl text-gray-800">
              ${userBookings.reduce((sum, b) => sum + extractTotalPrice(b), 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">{userBookings.length} bookings</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">Total Requests Value</p>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl text-gray-800">
              ${userRequests.reduce((sum, r) => sum + extractTotalPrice(r), 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">{userRequests.length} requests</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">Paid Bookings</p>
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl text-gray-800">
              ${userBookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + extractTotalPrice(b), 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">{userBookings.filter(b => b.payment_status === 'paid').length} paid</p>
          </div>
        </div>
      )}

      {/* Page Title based on current view - Clean minimal */}
      {currentView !== 'overview' && (
        <div className="mb-6">
          <h2 className="text-lg text-gray-800 font-medium">
            {currentView === 'users' ? 'Registered Users' :
             currentView === 'requests' ? 'User Requests' :
             currentView === 'bookings' ? 'User Bookings' :
             currentView === 'emptylegs' ? 'Empty Legs' :
             currentView === 'subscriptions' ? 'Subscriptions' :
             currentView === 'kyc' ? 'KYC Verification' :
             currentView === 'tokenization' ? 'Tokenization Requests' : 'Dashboard'}
          </h2>
          {currentView === 'requests' && (
            <p className="text-sm text-gray-400 mt-0.5">Jets, Helicopters, Yachts, Cars, Adventures</p>
          )}
          {currentView === 'tokenization' && (
            <p className="text-sm text-gray-400 mt-0.5">UTOs, STOs, SPVs, Tokenized Assets</p>
          )}
        </div>
      )}

      {/* Overview Tab - Clean Minimal Design */}
      {currentView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Users */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-sm text-gray-600">Recent Registrations</h2>
              <button onClick={() => setActiveTab('users')} className="text-xs text-gray-400 hover:text-gray-600">
                View All
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {registeredUsers.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        {(u.first_name?.[0] || u.email?.[0] || 'U').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{u.first_name || u.email?.split('@')[0]} {u.last_name || ''}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-300">{formatDateShort(u.created_at)}</span>
                </div>
              ))}
              {registeredUsers.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No users yet</p>
              )}
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-sm text-gray-600">Recent Requests</h2>
              <button onClick={() => setActiveTab('requests')} className="text-xs text-gray-400 hover:text-gray-600">
                View All
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {userRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-start justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      {getRequestTypeIcon(request.type || request.data?.item_type)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 capitalize">{(request.type || request.data?.item_type)?.replace(/_/g, ' ') || 'Request'}</p>
                      <p className="text-xs text-gray-400">{extractEmail(request)}</p>
                      {extractTotalPrice(request) > 0 && (
                        <p className="text-xs text-green-600">${extractTotalPrice(request).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              ))}
              {userRequests.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No requests yet</p>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-sm text-gray-600">Recent Bookings</h2>
              <button onClick={() => setActiveTab('bookings')} className="text-xs text-gray-400 hover:text-gray-600">
                View All
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {userBookings.slice(0, 5).map((booking) => {
                const bookingType = booking.booking_type || booking.service_type || booking.data?.type || 'booking';
                const bookingStatus = booking.booking_status || booking.status || 'pending';
                return (
                <div key={booking.id} className="flex items-start justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm text-gray-700 capitalize">{bookingType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{extractEmail(booking)}</p>
                    {extractTotalPrice(booking) > 0 && (
                      <p className="text-xs text-green-600">
                        {booking.currency === 'EUR' ? '€' : '$'}{extractTotalPrice(booking).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`text-[11px] px-2 py-1 rounded-full ${getStatusBadge(bookingStatus)}`}>
                      {bookingStatus}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${getStatusBadge(booking.payment_status || 'pending')}`}>
                      {booking.payment_status || 'pending'}
                    </span>
                  </div>
                </div>
                );
              })}
              {userBookings.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No bookings yet</p>
              )}
            </div>
          </div>

          {/* Pending KYC */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-sm text-gray-600">Pending KYC</h2>
              <button onClick={() => setActiveTab('kyc')} className="text-xs text-gray-400 hover:text-gray-600">
                View All
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {kycApplications.filter(k => k.status === 'pending').slice(0, 5).map((kyc) => {
                const kycUser = getUserById(kyc.user_id);
                const kycEmail = kyc.email || kycUser?.email || 'Unknown';
                const kycName = kyc.first_name ? `${kyc.first_name} ${kyc.last_name || ''}`.trim() :
                               kycUser ? `${kycUser.first_name || ''} ${kycUser.last_name || ''}`.trim() : '';
                return (
                <div key={kyc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm text-gray-700">{kycEmail}</p>
                    {kycName && <p className="text-xs text-gray-500">{kycName}</p>}
                    <p className="text-xs text-gray-300">{formatDateShort(kyc.created_at)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleKycStatusUpdate(kyc.id, kyc.user_id, 'approved')}
                      className="px-2.5 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs hover:bg-green-100 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleKycStatusUpdate(kyc.id, kyc.user_id, 'rejected')}
                      className="px-2.5 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );})}
              {kycApplications.filter(k => k.status === 'pending').length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No pending KYC</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registered Users Tab - CLEAN MINIMAL DESIGN like reference */}
      {currentView === 'users' && (
        <div>
          {/* Header with Search */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">All Customers</p>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-44 focus:outline-none focus:border-gray-300"
                />
              </div>
              <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white">
                <option>All Leads</option>
              </select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white">
                <option>Customer Type</option>
              </select>
            </div>
          </div>

          {/* User Cards Grid - Clean Style like reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredUsers.map((u) => {
              const userReqs = userRequests.filter(r => r.user_id === u.id || extractEmail(r) === u.email);
              const userBooks = userBookings.filter(b => b.user_id === u.id || extractEmail(b) === u.email);
              const isNewUser = new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              const isRepeat = userReqs.length + userBooks.length > 1;

              return (
                <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm">
                          {(u.first_name?.[0] || u.email?.[0] || 'U').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-900 text-[15px]">{u.first_name || u.email?.split('@')[0]} {u.last_name || ''}</p>
                        <p className="text-gray-400 text-xs">{u.subscription_tier || 'Customer'}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border ${
                      isNewUser ? 'border-green-200 text-green-600 bg-green-50' :
                      isRepeat ? 'border-blue-200 text-blue-600 bg-blue-50' :
                      'border-gray-200 text-gray-500'
                    }`}>
                      {isNewUser ? 'New Customer' : isRepeat ? 'Repeat Customer' : 'Customer'}
                    </span>
                  </div>

                  {/* Email with Copy */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                    <span className="text-sm text-gray-600 truncate">{u.email}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(u.email);
                      }}
                      className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedItem({ ...u, type: 'user' });
                        setShowDetailModal(true);
                      }}
                      className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                    <button className="p-2.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Activity className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {registeredUsers.length > 0 && (
            <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
              <span>Page 1 of {Math.ceil(registeredUsers.length / 9)}</span>
              <div className="flex items-center space-x-1">
                <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">&lt;</button>
                <button className="px-3 py-1.5 bg-gray-900 text-white rounded">1</button>
                <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">2</button>
                <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">3</button>
                <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">&gt;</button>
              </div>
            </div>
          )}

          {registeredUsers.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No registered users found</p>
            </div>
          )}
        </div>
      )}


      {/* User Requests Tab - Clean Minimal Design */}
      {currentView === 'requests' && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Type</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">User</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Route/Service</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Date</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Pax</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Price</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">PDF</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Status</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Created</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="text-gray-400">
                          {getRequestTypeIcon(request.type || request.data?.item_type)}
                        </div>
                        <div>
                          <span className="capitalize text-sm text-gray-700">{(request.type || request.data?.item_type)?.replace(/_/g, ' ')}</span>
                          {request.data?.aircraft_type && (
                            <p className="text-xs text-gray-400">{request.data?.aircraft_type}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{extractEmail(request)}</p>
                      <p className="text-xs text-gray-400">{extractContactName(request)}</p>
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const route = extractRoute(request);
                        if (route) {
                          return (
                            <div className="flex items-center space-x-1 text-sm">
                              <span className="text-gray-700">{route.from}</span>
                              <span className="text-gray-300">→</span>
                              <span className="text-gray-700">{route.to}</span>
                            </div>
                          );
                        }
                        return <span className="text-sm text-gray-400">{request.data?.name || request.data?.title || '-'}</span>;
                      })()}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {request.data?.date || request.data?.departure_date ? (
                        <div>
                          <p className="text-gray-700">{formatDateShort(request.data?.date || request.data?.departure_date)}</p>
                          {request.data?.time && <p className="text-xs text-gray-400">{request.data?.time}</p>}
                        </div>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {request.data?.passengers || request.data?.pax || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-5 py-4">
                      {extractTotalPrice(request) > 0 ? (
                        <>
                          <p className="text-sm text-green-600">
                            ${extractTotalPrice(request).toLocaleString()}
                          </p>
                          {request.data?.cart_items?.length > 1 && (
                            <p className="text-xs text-gray-400">{request.data.cart_items.length} items</p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-300">TBD</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {(request.pdf_url || request.data?.pdf_url) ? (
                        <a
                          href={request.pdf_url || request.data?.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-1 bg-orange-50 text-orange-500 rounded-lg text-xs hover:bg-orange-100 transition-colors"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">{formatDateShort(request.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem({ ...request, type: 'request' });
                            setShowDetailModal(true);
                          }}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-xs hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleRequestStatusUpdate(request.id, 'in_progress')}
                              className="px-2.5 py-1.5 bg-blue-50 text-blue-500 rounded-lg text-xs hover:bg-blue-100 transition-colors"
                            >
                              Process
                            </button>
                            <button
                              onClick={() => handleRequestStatusUpdate(request.id, 'completed')}
                              className="px-2.5 py-1.5 bg-green-50 text-green-500 rounded-lg text-xs hover:bg-green-100 transition-colors"
                            >
                              Complete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {userRequests.length === 0 && (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No user requests found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bookings Tab - Clean Minimal Design */}
      {currentView === 'bookings' && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Service</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">User</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Route/Details</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Date</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Pax</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Total Price</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">PDF</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Status</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Payment</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userBookings.map((booking) => {
                  // Extract booking type - supports both structures
                  const bookingType = booking.booking_type || booking.service_type || booking.data?.type || 'booking';
                  const serviceTitle = booking.service_title || booking.data?.name || booking.data?.title || 'Service';
                  const route = extractRoute(booking);
                  const origin = route?.from || '';
                  const destination = route?.to || '';
                  const departureDate = booking.departure_date || booking.data?.date || booking.data?.departure_date;
                  const passengers = booking.passengers || booking.data?.passengers || booking.data?.pax || null;
                  const aircraftType = booking.aircraft_type || booking.data?.aircraft_type || booking.data?.aircraft || '';
                  const bookingStatus = booking.booking_status || booking.status || 'pending';

                  return (
                  <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="text-gray-400">
                          {bookingType.includes('empty_leg') && <Plane className="w-4 h-4" />}
                          {bookingType.includes('adventure') && <Package className="w-4 h-4" />}
                          {bookingType.includes('co2') && <Globe className="w-4 h-4" />}
                          {bookingType.includes('jet') && <Plane className="w-4 h-4" />}
                          {bookingType.includes('yacht') && <Ship className="w-4 h-4" />}
                          {bookingType.includes('helicopter') && <Zap className="w-4 h-4" />}
                          {bookingType.includes('car') && <Car className="w-4 h-4" />}
                          {!bookingType.match(/empty_leg|adventure|co2|jet|yacht|helicopter|car/) && <Calendar className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="capitalize text-sm text-gray-700">{bookingType.replace(/_/g, ' ')}</span>
                          {aircraftType && <p className="text-xs text-gray-400">{aircraftType}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{extractEmail(booking)}</p>
                      <p className="text-xs text-gray-400">{extractContactName(booking)}</p>
                    </td>
                    <td className="px-5 py-4">
                      {(origin || destination) ? (
                        <div className="flex items-center space-x-1 text-sm">
                          <span className="text-gray-700">{origin || 'N/A'}</span>
                          <span className="text-gray-300">→</span>
                          <span className="text-gray-700">{destination || 'N/A'}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 truncate max-w-[150px] block">{serviceTitle}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {departureDate ? (
                        <p className="text-gray-700">{formatDateShort(departureDate)}</p>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {passengers || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-5 py-4">
                      {extractTotalPrice(booking) > 0 ? (
                        <p className="text-sm text-green-600">
                          {booking.currency === 'EUR' ? '€' : '$'}{extractTotalPrice(booking).toLocaleString()}
                        </p>
                      ) : (
                        <span className="text-xs text-gray-300">TBD</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {(booking.pdf_url || booking.data?.pdf_url) ? (
                        <a
                          href={booking.pdf_url || booking.data?.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-1 bg-orange-50 text-orange-500 rounded-lg text-xs hover:bg-orange-100 transition-colors"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full ${getStatusBadge(bookingStatus)}`}>
                        {bookingStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full ${getStatusBadge(booking.payment_status || 'pending')}`}>
                        {booking.payment_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem({ ...booking, type: 'booking' });
                            setShowDetailModal(true);
                          }}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-xs hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}
                            className="px-2.5 py-1.5 bg-green-50 text-green-500 rounded-lg text-xs hover:bg-green-100 transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {userBookings.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No bookings found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty Legs Tab - Clean Minimal Design */}
      {currentView === 'emptylegs' && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Route</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Aircraft</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Date</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Price</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Status</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emptyLegs.map((leg) => (
                  <tr key={leg.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2.5">
                        <Plane className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-700">{leg.departure_city || leg.from_location || 'N/A'}</p>
                          <p className="text-xs text-gray-400">→ {leg.arrival_city || leg.to_location || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{leg.aircraft_type || leg.aircraft || 'N/A'}</p>
                      <p className="text-xs text-gray-400">{leg.seats || leg.passengers || 0} seats</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {formatDateShort(leg.departure_date || leg.date)}
                    </td>
                    <td className="px-5 py-4 text-sm text-green-600">
                      €{(leg.price || leg.estimated_price || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full ${getStatusBadge(leg.status || 'available')}`}>
                        {leg.status || 'available'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => {
                          setSelectedItem({ ...leg, type: 'emptyleg' });
                          setShowDetailModal(true);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-xs hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {emptyLegs.length === 0 && (
              <div className="text-center py-16">
                <Plane className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No empty legs found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscriptions Tab - Clean Minimal Design */}
      {currentView === 'subscriptions' && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">User</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Tier</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Status</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Chats Used</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Updated</th>
                </tr>
              </thead>
              <tbody>
                {userSubscriptions.map((sub) => {
                  const subUser = getUserById(sub.user_id);
                  const subEmail = sub.email || subUser?.email || 'Unknown';
                  return (
                  <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{subEmail}</p>
                      {subUser && <p className="text-xs text-gray-400">{subUser.first_name} {subUser.last_name || ''}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full capitalize ${
                        sub.subscription_tier === 'elite' ? 'bg-purple-50 text-purple-600' :
                        sub.subscription_tier === 'pro' ? 'bg-blue-50 text-blue-600' :
                        sub.subscription_tier === 'starter' ? 'bg-green-50 text-green-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {sub.subscription_tier || 'explorer'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full ${getStatusBadge(sub.subscription_status || 'active')}`}>
                        {sub.subscription_status || 'active'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {sub.chats_used || 0} / {sub.chats_limit === null ? '∞' : sub.chats_limit || 1}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">{formatDateShort(sub.updated_at)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {userSubscriptions.length === 0 && (
              <div className="text-center py-16">
                <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No subscriptions found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KYC Tab - Clean Minimal Design */}
      {currentView === 'kyc' && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">User</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Status</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Submitted</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycApplications.map((kyc) => {
                  const kycUser = getUserById(kyc.user_id);
                  const kycEmail = kyc.email || kycUser?.email || 'Unknown';
                  const kycName = kyc.first_name ? `${kyc.first_name} ${kyc.last_name || ''}`.trim() :
                                 kycUser ? `${kycUser.first_name || ''} ${kycUser.last_name || ''}`.trim() : '';
                  return (
                  <tr key={kyc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{kycEmail}</p>
                      {kycName && <p className="text-xs text-gray-400">{kycName}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full ${getStatusBadge(kyc.status)}`}>
                        {kyc.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">{formatDate(kyc.created_at)}</td>
                    <td className="px-5 py-4">
                      {kyc.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleKycStatusUpdate(kyc.id, kyc.user_id, 'approved')}
                            className="flex items-center space-x-1 px-2.5 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleKycStatusUpdate(kyc.id, kyc.user_id, 'rejected')}
                            className="flex items-center space-x-1 px-2.5 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {kyc.status === 'approved' ? 'Verified' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {kycApplications.length === 0 && (
              <div className="text-center py-16">
                <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No KYC applications found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tokenization Tab - Web3.0 Services - Clean Minimal Design */}
      {currentView === 'tokenization' && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Asset</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Type</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Token</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Value</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">SPV</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Status</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">User</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Created</th>
                  <th className="px-5 py-4 text-left text-xs text-gray-400 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokenizationDrafts.map((draft) => (
                  <tr key={draft.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">{draft.asset_name || 'Unnamed Asset'}</p>
                          <p className="text-xs text-gray-400">{draft.asset_category || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full ${
                        draft.token_type === 'utility'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}>
                        {draft.token_type === 'utility' ? 'UTO' : 'STO'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-mono text-gray-700">{draft.token_symbol || 'N/A'}</p>
                      <p className="text-xs text-gray-400">{draft.total_supply?.toLocaleString() || 0} tokens</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{formatPrice(draft.asset_value)}</p>
                      <p className="text-xs text-gray-400">{formatPrice(draft.price_per_token)}/token</p>
                    </td>
                    <td className="px-5 py-4">
                      {draft.has_spv ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-[11px]">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">No</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full ${getStatusBadge(draft.status)}`}>
                        {draft.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-gray-400">{getUserEmail(draft.user_id)}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">{formatDateShort(draft.created_at)}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => {
                          setSelectedItem({ ...draft, type: 'tokenization' });
                          setShowDetailModal(true);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-purple-50 text-purple-500 rounded-lg text-xs hover:bg-purple-100 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tokenizationDrafts.length === 0 && (
              <div className="text-center py-16">
                <Wallet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No tokenization requests found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal - Clean Design */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className={`bg-white rounded-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl ${selectedItem.type === 'user' ? 'max-w-3xl' : 'max-w-2xl'}`}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-gray-800 font-medium">
                {selectedItem.type === 'user' ? 'Client Profile' :
                 selectedItem.type === 'booking' ? 'Booking Details' :
                 selectedItem.type === 'emptyleg' ? 'Empty Leg Details' :
                 selectedItem.type === 'tokenization' ? 'Tokenization Details' :
                 'Request Details'}
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedItem(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* User Details - COMPLETE CLIENT PROFILE */}
              {selectedItem.type === 'user' && (() => {
                // Get all requests and bookings for this user
                const userReqs = userRequests.filter(r =>
                  r.user_id === selectedItem.id ||
                  extractEmail(r) === selectedItem.email
                );
                const userBooks = userBookings.filter(b =>
                  b.user_id === selectedItem.id ||
                  extractEmail(b) === selectedItem.email
                );
                const userKyc = kycApplications.find(k => k.user_id === selectedItem.id);
                const userTokenization = tokenizationDrafts.filter(t => t.user_id === selectedItem.id);

                // Calculate total spent
                const totalSpent = [...userReqs, ...userBooks].reduce((sum, item) =>
                  sum + extractTotalPrice(item), 0
                );

                return (
                <div className="space-y-4">
                  {/* User Header */}
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {(selectedItem.first_name?.[0] || selectedItem.email?.[0] || 'U').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold">{selectedItem.first_name} {selectedItem.last_name || ''}</h4>
                      <p className="text-gray-500">{selectedItem.email}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${selectedItem.email_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {selectedItem.email_verified ? 'Verified' : 'Unverified'}
                        </span>
                        <span className="text-xs text-gray-500">Since {formatDateShort(selectedItem.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-700">{userReqs.length}</p>
                      <p className="text-xs text-blue-600">Requests</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-700">{userBooks.length}</p>
                      <p className="text-xs text-green-600">Bookings</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-700">${totalSpent.toLocaleString()}</p>
                      <p className="text-xs text-purple-600">Total Value</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-700">{userKyc ? (userKyc.status === 'approved' ? '✓' : '⏳') : '-'}</p>
                      <p className="text-xs text-orange-600">KYC</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedItem.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedItem.phone || 'No phone'}</span>
                    </div>
                  </div>

                  {/* User Requests History */}
                  {userReqs.length > 0 && (
                    <div className="border-t pt-4">
                      <h5 className="font-semibold mb-3 flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Requests ({userReqs.length})</span>
                      </h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userReqs.map((req) => (
                          <div key={req.id} className="p-2 bg-blue-50 rounded flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium capitalize">{(req.type || req.data?.item_type)?.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-gray-500">{formatDateShort(req.created_at)}</p>
                            </div>
                            <div className="text-right">
                              {extractTotalPrice(req) > 0 && (
                                <p className="text-sm font-bold text-green-700">${extractTotalPrice(req).toLocaleString()}</p>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(req.status)}`}>
                                {req.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* User Bookings History */}
                  {userBooks.length > 0 && (
                    <div className="border-t pt-4">
                      <h5 className="font-semibold mb-3 flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span>Bookings ({userBooks.length})</span>
                      </h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userBooks.map((book) => (
                          <div key={book.id} className="p-2 bg-green-50 rounded flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium capitalize">{book.service_type || book.data?.type?.replace(/_/g, ' ') || 'Booking'}</p>
                              <p className="text-xs text-gray-500">{formatDateShort(book.created_at)}</p>
                            </div>
                            <div className="text-right">
                              {extractTotalPrice(book) > 0 && (
                                <p className="text-sm font-bold text-green-700">${extractTotalPrice(book).toLocaleString()}</p>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(book.status)}`}>
                                {book.status || 'pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tokenization Requests */}
                  {userTokenization.length > 0 && (
                    <div className="border-t pt-4">
                      <h5 className="font-semibold mb-3 flex items-center space-x-2">
                        <Wallet className="w-4 h-4 text-purple-600" />
                        <span>Tokenization ({userTokenization.length})</span>
                      </h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userTokenization.map((token) => (
                          <div key={token.id} className="p-2 bg-purple-50 rounded flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">{token.asset_name}</p>
                              <p className="text-xs text-gray-500">{token.token_type === 'utility' ? 'UTO' : 'STO'} - {token.token_symbol}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{formatPrice(token.asset_value)}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(token.status)}`}>
                                {token.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Activity */}
                  {userReqs.length === 0 && userBooks.length === 0 && userTokenization.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No activity yet for this user</p>
                    </div>
                  )}
                </div>
                );
              })()}

              {/* Booking Details - ENHANCED */}
              {selectedItem.type === 'booking' && (
                <div className="space-y-4">
                  {/* Header with Service Type and Status */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {selectedItem.service_type === 'jet' && <Plane className="w-6 h-6 text-blue-600" />}
                      {selectedItem.service_type === 'yacht' && <Ship className="w-6 h-6 text-cyan-600" />}
                      {selectedItem.service_type === 'helicopter' && <Zap className="w-6 h-6 text-purple-600" />}
                      {selectedItem.service_type === 'car' && <Car className="w-6 h-6 text-green-600" />}
                      {!['jet', 'yacht', 'helicopter', 'car'].includes(selectedItem.service_type) && <Calendar className="w-6 h-6 text-gray-600" />}
                      <div>
                        <p className="font-bold capitalize">{selectedItem.service_type || selectedItem.data?.service_type || selectedItem.data?.type || 'Booking'}</p>
                        <p className="text-xs text-gray-500">ID: {selectedItem.id?.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadge(selectedItem.status)}`}>
                        {selectedItem.status || 'pending'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(selectedItem.payment_status || 'pending')}`}>
                        Payment: {selectedItem.payment_status || 'pending'}
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-xs text-blue-600 uppercase font-medium">User Email</p>
                      <p className="text-sm font-medium">{selectedItem.contact_email || selectedItem.email || selectedItem.user_email || selectedItem.data?.client_email || selectedItem.data?.email || getUserEmail(selectedItem.user_id) || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 uppercase font-medium">User ID</p>
                      <p className="text-sm font-mono text-xs">{selectedItem.user_id?.slice(0, 12) || 'N/A'}...</p>
                    </div>
                    {(selectedItem.data?.contact_name || selectedItem.data?.first_name) && (
                      <div>
                        <p className="text-xs text-blue-600 uppercase font-medium">Contact Name</p>
                        <p className="text-sm font-medium">{selectedItem.data?.contact_name || `${selectedItem.data?.first_name || ''} ${selectedItem.data?.last_name || ''}`}</p>
                      </div>
                    )}
                    {(selectedItem.data?.phone || selectedItem.data?.contact_phone) && (
                      <div>
                        <p className="text-xs text-blue-600 uppercase font-medium">Phone</p>
                        <p className="text-sm font-medium">{selectedItem.data?.phone || selectedItem.data?.contact_phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Route Information (for transport services) */}
                  {(() => {
                    const route = extractRoute(selectedItem);
                    if (!route) return null;
                    return (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 uppercase font-medium mb-2">Route</p>
                        <div className="flex items-center justify-center space-x-4">
                          <div className="text-center">
                            <p className="font-bold">{route.from}</p>
                          </div>
                          <Plane className="w-5 h-5 text-green-600" />
                          <div className="text-center">
                            <p className="font-bold">{route.to}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Service Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Date & Time */}
                    {(selectedItem.data?.date || selectedItem.data?.departure_date || selectedItem.data?.booking_date) && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Date</p>
                        <p className="text-sm font-medium">{formatDateShort(selectedItem.data?.date || selectedItem.data?.departure_date || selectedItem.data?.booking_date)}</p>
                      </div>
                    )}
                    {(selectedItem.data?.time || selectedItem.data?.departure_time) && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Time</p>
                        <p className="text-sm font-medium">{selectedItem.data?.time || selectedItem.data?.departure_time}</p>
                      </div>
                    )}
                    {selectedItem.data?.return_date && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Return Date</p>
                        <p className="text-sm font-medium">{formatDateShort(selectedItem.data?.return_date)}</p>
                      </div>
                    )}
                    {/* Passengers */}
                    {(selectedItem.data?.passengers || selectedItem.data?.pax || selectedItem.data?.guests) && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Passengers/Guests</p>
                        <p className="text-sm font-medium">{selectedItem.data?.passengers || selectedItem.data?.pax || selectedItem.data?.guests}</p>
                      </div>
                    )}
                    {/* Aircraft/Vehicle/Yacht */}
                    {(selectedItem.data?.aircraft || selectedItem.data?.aircraft_type || selectedItem.data?.vehicle || selectedItem.data?.yacht_name || selectedItem.data?.name) && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Aircraft/Vehicle</p>
                        <p className="text-sm font-medium">{selectedItem.data?.aircraft || selectedItem.data?.aircraft_type || selectedItem.data?.vehicle || selectedItem.data?.yacht_name || selectedItem.data?.name}</p>
                      </div>
                    )}
                    {/* Flight Time / Duration */}
                    {(selectedItem.data?.flight_time || selectedItem.data?.duration) && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Duration</p>
                        <p className="text-sm font-medium">{selectedItem.data?.flight_time || selectedItem.data?.duration}</p>
                      </div>
                    )}
                    {/* Service Name */}
                    {(selectedItem.data?.title || selectedItem.data?.service_name) && (
                      <div className="p-2 bg-gray-50 rounded col-span-2">
                        <p className="text-xs text-gray-500 uppercase">Service</p>
                        <p className="text-sm font-medium">{selectedItem.data?.title || selectedItem.data?.service_name}</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing Section */}
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 uppercase font-medium mb-2">Pricing</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(selectedItem.data?.base_price || selectedItem.data?.base_price_usd) && (
                        <div>
                          <p className="text-xs text-gray-500">Base Price</p>
                          <p className="text-sm font-bold">{formatPrice(selectedItem.data?.base_price_usd || selectedItem.data?.base_price)}</p>
                        </div>
                      )}
                      {selectedItem.data?.vat_amount && (
                        <div>
                          <p className="text-xs text-gray-500">VAT (8.1%)</p>
                          <p className="text-sm font-medium">{formatPrice(selectedItem.data?.vat_amount)}</p>
                        </div>
                      )}
                      {selectedItem.data?.service_fee && (
                        <div>
                          <p className="text-xs text-gray-500">Service Fee</p>
                          <p className="text-sm font-medium">{formatPrice(selectedItem.data?.service_fee)}</p>
                        </div>
                      )}
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-xs text-gray-500">Total Price</p>
                        <p className="text-lg font-bold text-purple-700">
                          {formatPrice(selectedItem.total_price || selectedItem.data?.total_price_usd || selectedItem.data?.total_price || selectedItem.data?.price || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {(selectedItem.data?.payment_method || selectedItem.data?.payment_id || selectedItem.data?.transaction_id) && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-600 uppercase font-medium mb-2">Payment Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedItem.data?.payment_method && (
                          <div>
                            <p className="text-xs text-gray-500">Method</p>
                            <p className="text-sm font-medium capitalize">{selectedItem.data?.payment_method}</p>
                          </div>
                        )}
                        {(selectedItem.data?.payment_id || selectedItem.data?.transaction_id) && (
                          <div>
                            <p className="text-xs text-gray-500">Transaction ID</p>
                            <p className="text-sm font-mono">{selectedItem.data?.payment_id || selectedItem.data?.transaction_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PDF Download Link */}
                  {(selectedItem.data?.pdf_url || selectedItem.pdf_url) && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600 uppercase font-medium mb-2">PDF Confirmation</p>
                      <a
                        href={selectedItem.data?.pdf_url || selectedItem.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">Download PDF</span>
                      </a>
                    </div>
                  )}

                  {/* Special Requests / Notes */}
                  {(selectedItem.data?.special_requests || selectedItem.data?.notes || selectedItem.data?.message) && (
                    <div className="border-t pt-4">
                      <p className="text-xs text-gray-500 uppercase mb-2">Special Requests / Notes</p>
                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedItem.data?.special_requests || selectedItem.data?.notes || selectedItem.data?.message}</p>
                    </div>
                  )}

                  {/* Cart Items (if multiple services) */}
                  {selectedItem.data?.cart_items && selectedItem.data?.cart_items.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>Booked Items ({selectedItem.data?.cart_items.length})</span>
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedItem.data?.cart_items.map((item: any, idx: number) => (
                          <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.name || item.title || item.aircraft_type || 'Item'}</p>
                                <p className="text-xs text-gray-500 capitalize">{item.type?.replace(/_/g, ' ')}</p>
                                {item.route && <p className="text-xs text-gray-500">{item.route}</p>}
                                {(item.from || item.to) && <p className="text-xs text-gray-500">{extractLocation(item.from)} → {extractLocation(item.to)}</p>}
                              </div>
                              <p className="font-bold">{formatPrice(item.total_price_usd || item.total_price || item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Created</p>
                      <p>{formatDate(selectedItem.created_at)}</p>
                    </div>
                    {selectedItem.updated_at && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Updated</p>
                        <p>{formatDate(selectedItem.updated_at)}</p>
                      </div>
                    )}
                  </div>

                  {/* Raw Data (collapsible for debugging) */}
                  {(selectedItem.data || selectedItem.booking_data) && (
                    <details className="border-t pt-4">
                      <summary className="cursor-pointer text-sm text-gray-500 hover:text-black">View Raw Booking Data</summary>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto mt-2 max-h-60">
                        {JSON.stringify(selectedItem.data || selectedItem.booking_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Empty Leg Details */}
              {selectedItem.type === 'emptyleg' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4 py-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{selectedItem.departure_city || selectedItem.from_location}</p>
                      <p className="text-xs text-gray-500">Departure</p>
                    </div>
                    <Plane className="w-6 h-6 text-blue-500" />
                    <div className="text-center">
                      <p className="text-lg font-bold">{selectedItem.arrival_city || selectedItem.to_location}</p>
                      <p className="text-xs text-gray-500">Arrival</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Aircraft</p>
                      <p className="text-sm">{selectedItem.aircraft_type || selectedItem.aircraft || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Seats</p>
                      <p className="text-sm">{selectedItem.seats || selectedItem.passengers || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Date</p>
                      <p className="text-sm">{formatDateShort(selectedItem.departure_date || selectedItem.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Price</p>
                      <p className="text-lg font-bold">€{(selectedItem.price || selectedItem.estimated_price || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Status</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(selectedItem.status || 'available')}`}>
                        {selectedItem.status || 'available'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Details - ENHANCED */}
              {selectedItem.type === 'request' && (
                <div className="space-y-4">
                  {/* Header with Request Type and Status */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getRequestTypeIcon(selectedItem.requestType || selectedItem.data?.item_type)}
                      <div>
                        <p className="font-medium capitalize">{(selectedItem.requestType || selectedItem.data?.item_type || 'Request')?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">ID: {selectedItem.id?.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusBadge(selectedItem.status)}`}>
                      {selectedItem.status}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-xs text-blue-600 uppercase font-medium">User Email</p>
                      <p className="text-sm font-medium">{selectedItem.client_email || selectedItem.data?.client_email || getUserEmail(selectedItem.user_id) || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 uppercase font-medium">User ID</p>
                      <p className="text-sm font-mono text-xs">{selectedItem.user_id?.slice(0, 12) || 'N/A'}...</p>
                    </div>
                  </div>

                  {/* Route Information (for transport services) */}
                  {(() => {
                    const route = extractRoute(selectedItem);
                    if (!route) return null;
                    return (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 uppercase font-medium mb-2">Route</p>
                        <div className="flex items-center justify-center space-x-4">
                          <div className="text-center">
                            <p className="font-bold">{route.from}</p>
                          </div>
                          <Plane className="w-5 h-5 text-green-600" />
                          <div className="text-center">
                            <p className="font-bold">{route.to}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Service Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Date & Time */}
                    {(selectedItem.data?.date || selectedItem.data?.departure_date) && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Date</p>
                        <p className="text-sm font-medium">{formatDateShort(selectedItem.data?.date || selectedItem.data?.departure_date)}</p>
                      </div>
                    )}
                    {(selectedItem.data?.time || selectedItem.data?.departure_time) && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Time</p>
                        <p className="text-sm font-medium">{selectedItem.data?.time || selectedItem.data?.departure_time}</p>
                      </div>
                    )}
                    {/* Passengers */}
                    {(selectedItem.data?.passengers || selectedItem.data?.pax) && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Passengers</p>
                        <p className="text-sm font-medium">{selectedItem.data?.passengers || selectedItem.data?.pax}</p>
                      </div>
                    )}
                    {/* Aircraft/Vehicle */}
                    {(selectedItem.data?.aircraft || selectedItem.data?.aircraft_type || selectedItem.data?.vehicle) && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Aircraft/Vehicle</p>
                        <p className="text-sm font-medium">{selectedItem.data?.aircraft || selectedItem.data?.aircraft_type || selectedItem.data?.vehicle || selectedItem.data?.name}</p>
                      </div>
                    )}
                    {/* Flight Time */}
                    {selectedItem.data?.flight_time && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 uppercase">Flight Time</p>
                        <p className="text-sm font-medium">{selectedItem.data?.flight_time}</p>
                      </div>
                    )}
                    {/* Service Name */}
                    {selectedItem.data?.name && (
                      <div className="p-2 bg-gray-50 rounded col-span-2">
                        <p className="text-xs text-gray-500 uppercase">Service</p>
                        <p className="text-sm font-medium">{selectedItem.data?.name || selectedItem.data?.title}</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing Section */}
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 uppercase font-medium mb-2">Pricing</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selectedItem.data?.base_price_usd && (
                        <div>
                          <p className="text-xs text-gray-500">Base Price</p>
                          <p className="text-sm font-bold">{formatPrice(selectedItem.data?.base_price_usd)}</p>
                        </div>
                      )}
                      {selectedItem.data?.vat_amount && (
                        <div>
                          <p className="text-xs text-gray-500">VAT (8.1%)</p>
                          <p className="text-sm font-medium">{formatPrice(selectedItem.data?.vat_amount)}</p>
                        </div>
                      )}
                      {selectedItem.data?.service_fee && (
                        <div>
                          <p className="text-xs text-gray-500">Service Fee</p>
                          <p className="text-sm font-medium">{formatPrice(selectedItem.data?.service_fee)}</p>
                        </div>
                      )}
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-xs text-gray-500">Total Price</p>
                        <p className="text-lg font-bold text-purple-700">
                          {formatPrice(selectedItem.data?.total_price_usd || selectedItem.data?.total_price || selectedItem.data?.estimated_total || selectedItem.data?.price)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PDF Download Link */}
                  {selectedItem.data?.pdf_url && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600 uppercase font-medium mb-2">PDF Confirmation</p>
                      <a
                        href={selectedItem.data?.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">Download PDF</span>
                      </a>
                    </div>
                  )}

                  {/* Cart Items (if multiple services) */}
                  {selectedItem.data?.cart_items && selectedItem.data?.cart_items.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>Cart Items ({selectedItem.data?.cart_items.length})</span>
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedItem.data?.cart_items.map((item: any, idx: number) => (
                          <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.name || item.title || item.aircraft_type || 'Item'}</p>
                                <p className="text-xs text-gray-500">{item.type?.replace(/_/g, ' ')}</p>
                                {item.route && <p className="text-xs text-gray-500">{item.route}</p>}
                              </div>
                              <p className="font-bold">{formatPrice(item.total_price_usd || item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Created</p>
                      <p>{formatDate(selectedItem.created_at)}</p>
                    </div>
                    {selectedItem.updated_at && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Updated</p>
                        <p>{formatDate(selectedItem.updated_at)}</p>
                      </div>
                    )}
                  </div>

                  {/* Raw Data (collapsible for debugging) */}
                  {selectedItem.data && (
                    <details className="border-t pt-4">
                      <summary className="cursor-pointer text-sm text-gray-500 hover:text-black">View Raw Data</summary>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto mt-2 max-h-60">
                        {JSON.stringify(selectedItem.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Tokenization Request Details */}
              {selectedItem.type === 'tokenization' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Wallet className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="font-bold">{selectedItem.asset_name}</p>
                        <p className="text-xs text-gray-500">{selectedItem.token_type === 'utility' ? 'UTO' : 'STO'} - {selectedItem.token_symbol}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusBadge(selectedItem.status)}`}>
                      {selectedItem.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 uppercase">Asset Value</p>
                      <p className="text-lg font-bold">{formatPrice(selectedItem.asset_value)}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 uppercase">Token Supply</p>
                      <p className="text-lg font-bold">{selectedItem.total_supply?.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 uppercase">Price/Token</p>
                      <p className="font-medium">{formatPrice(selectedItem.price_per_token)}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 uppercase">Expected APY</p>
                      <p className="font-medium">{selectedItem.expected_apy}%</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 uppercase">Has SPV</p>
                      <p className="font-medium">{selectedItem.has_spv ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 uppercase">Jurisdiction</p>
                      <p className="font-medium">{selectedItem.jurisdiction || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedItem.issuer_wallet_address && (
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-indigo-600 uppercase font-medium">Issuer Wallet</p>
                      <p className="font-mono text-xs break-all">{selectedItem.issuer_wallet_address}</p>
                    </div>
                  )}

                  {selectedItem.asset_description && (
                    <div className="border-t pt-4">
                      <p className="text-xs text-gray-500 uppercase mb-2">Description</p>
                      <p className="text-sm">{selectedItem.asset_description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
