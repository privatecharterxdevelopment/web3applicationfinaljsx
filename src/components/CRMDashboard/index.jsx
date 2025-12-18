import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Users, UserCheck, UserX, Clock, Shield, ShieldCheck, ShieldAlert,
  CreditCard, DollarSign, TrendingUp, TrendingDown, Activity,
  MessageSquare, Bell, Calendar, FileText, Search, Filter,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Eye, Edit, Trash2,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Download,
  LayoutDashboard, Wallet, Plane, Car, Building2, Globe,
  Mail, Phone, MapPin, MoreVertical, ExternalLink, Copy,
  Sparkles, Zap, ArrowUpRight, ArrowDownRight, X, Check,
  UserPlus, Settings, LogOut, Menu, Home, BarChart3,
  Ticket, HelpCircle, Send, Loader2, Ban, Lock, Unlock,
  Coins, Bitcoin, Wine, Cigarette, Heart, Ship, UtensilsCrossed,
  HeartPulse, Flag, AlertTriangle, MessagesSquare
} from 'lucide-react';

// Service type icons mapping
const SERVICE_ICONS = {
  private_jet_charter: Plane,
  flight_quote: Plane,
  helicopter_charter: Zap,
  empty_leg: MapPin,
  yacht_charter: Ship,
  luxury_car_rental: Car,
  ground_transport: Car,
  medevac: HeartPulse,
  restaurant_reservation: UtensilsCrossed,
  cigars: Cigarette,
  winery: Wine,
  delicacies: UtensilsCrossed,
  adventure_package: Globe,
  tokenization: Sparkles,
  spv_formation: Building2,
  co2_certificate: Globe,
  custom_request: MessageSquare,
  travel_request: Globe,
  ai_chat_bulk: MessagesSquare,
  default: FileText
};

const getServiceIcon = (type) => {
  return SERVICE_ICONS[type] || SERVICE_ICONS.default;
};

// CRM Main Component
const CRMDashboard = ({ initialTab = 'overview', onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin, user_role')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setIsAdmin(data.is_admin || data.user_role === 'admin' || data.user_role === 'super_admin');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
      setLoading(false);
    };

    checkAdmin();
  }, [user?.id]);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck },
    { id: 'ai-requests', label: 'AI Chat Requests', icon: MessagesSquare, badge: 'Core' },
    { id: 'requests', label: 'Service Requests', icon: FileText },
    { id: 'booking-requests', label: 'Booking Requests', icon: Plane },
    { id: 'coingate', label: 'Crypto Payments', icon: Bitcoin },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'pvcx', label: 'PVCX Token', icon: Coins },
    { id: 'spv', label: 'SPV Formation', icon: Building2 },
    { id: 'nft-benefits', label: 'NFT Benefits', icon: Sparkles },
    { id: 'support', label: 'Support Tickets', icon: Ticket },
    { id: 'chat', label: 'Chat History', icon: MessageSquare },
    { id: 'tokenization', label: 'Tokenization', icon: Sparkles },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading CRM...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-sm border">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access the CRM dashboard.</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-['DM_Sans']">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 fixed h-full z-40`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">CRM Admin</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                      activeTab === item.id ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors`}
          >
            <X size={18} />
            {!sidebarCollapsed && <span>Close CRM</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'kyc' && <KYCTab />}
        {activeTab === 'ai-requests' && <AIChatRequestsTab />}
        {activeTab === 'requests' && <ServiceRequestsTab />}
        {activeTab === 'booking-requests' && <BookingRequestsTab />}
        {activeTab === 'coingate' && <CoinGatePaymentsTab />}
        {activeTab === 'bookings' && <BookingsTab />}
        {activeTab === 'transactions' && <TransactionsTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'pvcx' && <PVCXTokenTab />}
        {activeTab === 'spv' && <SPVFormationTab />}
        {activeTab === 'nft-benefits' && <NFTBenefitsTab />}
        {activeTab === 'support' && <SupportTicketsTab />}
        {activeTab === 'chat' && <ChatHistoryTab />}
        {activeTab === 'tokenization' && <TokenizationTab />}
      </main>
    </div>
  );
};

// Overview Dashboard Tab
const OverviewTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    activeUsers: 0,
    pendingKYC: 0,
    approvedKYC: 0,
    rejectedKYC: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    completedBookings: 0,
    openTickets: 0,
    pendingRequests: 0,
    aiChatRequests: 0,
    coinGatePayments: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentAIRequests, setRecentAIRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch users count
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newUsersToday } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Fetch KYC stats
      const { count: pendingKYC } = await supabase
        .from('kyc_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approvedKYC } = await supabase
        .from('kyc_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Fetch AI Chat Requests count
      const { count: aiChatRequests } = await supabase
        .from('chat_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch CoinGate payments (paid bookings)
      const { count: coinGatePayments } = await supabase
        .from('user_bookings')
        .select('*', { count: 'exact', head: true })
        .not('coingate_order_id', 'is', null);

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, currency')
        .eq('status', 'completed');

      const totalRevenue = transactions?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

      // Fetch bookings
      const { count: pendingBookings } = await supabase
        .from('user_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: completedBookings } = await supabase
        .from('user_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Fetch pending requests
      const { count: pendingRequests } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch support tickets
      const { count: openTickets } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'pending', 'in_progress']);

      // Fetch recent users
      const { data: recent } = await supabase
        .from('users')
        .select('id, email, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent AI Chat requests
      const { data: aiRequests } = await supabase
        .from('chat_requests')
        .select('id, query, service_type, status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: totalUsers || 0,
        newUsersToday: newUsersToday || 0,
        activeUsers: Math.floor((totalUsers || 0) * 0.3),
        pendingKYC: pendingKYC || 0,
        approvedKYC: approvedKYC || 0,
        rejectedKYC: 0,
        totalTransactions: transactions?.length || 0,
        totalRevenue,
        pendingBookings: pendingBookings || 0,
        completedBookings: completedBookings || 0,
        openTickets: openTickets || 0,
        pendingRequests: pendingRequests || 0,
        aiChatRequests: aiChatRequests || 0,
        coinGatePayments: coinGatePayments || 0
      });

      setRecentUsers(recent || []);
      setRecentAIRequests(aiRequests || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500', change: `+${stats.newUsersToday} today` },
    { label: 'AI Chat Requests', value: stats.aiChatRequests, icon: MessagesSquare, color: 'bg-purple-500', change: 'Pending review', important: true },
    { label: 'Pending KYC', value: stats.pendingKYC, icon: ShieldAlert, color: 'bg-yellow-500', change: `${stats.approvedKYC} approved` },
    { label: 'Crypto Payments', value: stats.coinGatePayments, icon: Bitcoin, color: 'bg-orange-500', change: 'CoinGate orders' },
    { label: 'Open Tickets', value: stats.openTickets, icon: Ticket, color: 'bg-red-500', change: 'Needs attention' },
    { label: 'Service Requests', value: stats.pendingRequests, icon: FileText, color: 'bg-indigo-500', change: 'Action required' },
    { label: 'Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500', change: `${stats.totalTransactions} transactions` },
    { label: 'Bookings', value: stats.pendingBookings + stats.completedBookings, icon: Calendar, color: 'bg-cyan-500', change: `${stats.pendingBookings} pending` },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time metrics and activity • AI Chat is core business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`bg-white rounded-xl border ${stat.important ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-200'} p-5 hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon size={20} className="text-white" />
              </div>
              <span className="text-xs text-gray-500">{stat.change}</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent AI Chat Requests - Priority */}
        <div className="bg-white rounded-xl border border-purple-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessagesSquare size={18} className="text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Recent AI Chat Requests</h3>
            </div>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Core Business</span>
          </div>
          <div className="space-y-3">
            {recentAIRequests.map((request) => {
              const ServiceIcon = getServiceIcon(request.service_type);
              return (
                <div key={request.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                      <ServiceIcon size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {request.query?.slice(0, 40) || 'No query'}...
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {request.service_type?.replace(/_/g, ' ') || 'General'}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    request.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {request.status}
                  </span>
                </div>
              );
            })}
            {recentAIRequests.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500">No recent AI requests</div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Registrations</h3>
            <button className="text-xs text-gray-500 hover:text-gray-700">View All</button>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {user.name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500">No recent users</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Chat Requests Tab - CORE BUSINESS
const AIChatRequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const serviceTypes = [
    { value: 'all', label: 'All Services' },
    { value: 'private_jet_charter', label: 'Private Jets' },
    { value: 'helicopter_charter', label: 'Helicopters' },
    { value: 'empty_leg', label: 'Empty Legs' },
    { value: 'medevac', label: 'MedEvac' },
    { value: 'yacht_charter', label: 'Yachts' },
    { value: 'luxury_car_rental', label: 'Luxury Cars' },
    { value: 'restaurant_reservation', label: 'Restaurants' },
    { value: 'winery', label: 'Winery' },
    { value: 'cigars', label: 'Cigars' },
    { value: 'adventure_package', label: 'Adventures' },
    { value: 'travel_request', label: 'Travel Planning' },
  ];

  useEffect(() => {
    fetchRequests();
  }, [filter, serviceFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('chat_requests')
        .select(`
          *,
          users:user_id (id, email, name)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (serviceFilter !== 'all') {
        query = query.eq('service_type', serviceFilter);
      }

      const { data, error } = await query.limit(100);

      if (!error) {
        setRequests(data || []);
      }
    } catch (error) {
      console.error('Error fetching AI chat requests:', error);
    }
    setLoading(false);
  };

  const updateStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('chat_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (!error) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">AI Chat Requests</h1>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Core Business</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            All service requests from AI Chat • Jets, MedEvac, Cigars, Winery, Yachts & more
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          {serviceTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const ServiceIcon = getServiceIcon(request.service_type);
            return (
              <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ServiceIcon size={22} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 capitalize">
                          {request.service_type?.replace(/_/g, ' ') || 'General Request'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          request.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {request.query || 'No query provided'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>User: {request.users?.name || request.users?.email || 'Unknown'}</span>
                        {request.from_location && <span>From: {request.from_location}</span>}
                        {request.to_location && <span>To: {request.to_location}</span>}
                        {request.passengers && <span>Pax: {request.passengers}</span>}
                        {request.budget && <span>Budget: ${request.budget}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(request.id, 'in_progress')}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => updateStatus(request.id, 'completed')}
                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                        >
                          Complete
                        </button>
                      </>
                    )}
                    {request.status === 'in_progress' && (
                      <button
                        onClick={() => updateStatus(request.id, 'completed')}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Eye size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Cart Items if present */}
                {request.cart_items && request.cart_items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500 mb-2 block">Cart Items:</span>
                    <div className="flex flex-wrap gap-2">
                      {request.cart_items.map((item, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                          {item.title || item.name || `Item ${idx + 1}`}
                        </span>
                      ))}
                    </div>
                    {request.cart_total && (
                      <span className="text-sm font-semibold text-gray-900 mt-2 block">
                        Total: ${parseFloat(request.cart_total).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {requests.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
              No AI chat requests found
            </div>
          )}
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <AIChatRequestModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}
    </div>
  );
};

// AI Chat Request Detail Modal
const AIChatRequestModal = ({ request, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {request.service_type?.replace(/_/g, ' ') || 'AI Chat Request'}
            </h2>
            <p className="text-sm text-gray-500">Request ID: {request.id?.slice(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Query */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">User Query</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">{request.query || 'No query'}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">From Location</label>
                <p className="text-sm text-gray-900">{request.from_location || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">To Location</label>
                <p className="text-sm text-gray-900">{request.to_location || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Date Start</label>
                <p className="text-sm text-gray-900">{request.date_start ? new Date(request.date_start).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Date End</label>
                <p className="text-sm text-gray-900">{request.date_end ? new Date(request.date_end).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Passengers</label>
                <p className="text-sm text-gray-900">{request.passengers || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Budget</label>
                <p className="text-sm text-gray-900">{request.budget ? `$${request.budget.toLocaleString()}` : 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Pets</label>
                <p className="text-sm text-gray-900">{request.pets || 0}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Confidence Score</label>
                <p className="text-sm text-gray-900">{request.confidence_score || 'N/A'}%</p>
              </div>
            </div>

            {/* Special Requirements */}
            {request.special_requirements && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Special Requirements</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">{request.special_requirements}</p>
              </div>
            )}

            {/* Conversation History */}
            {request.conversation_history && request.conversation_history.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Conversation History</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-[300px] overflow-y-auto">
                  {request.conversation_history.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                        msg.role === 'user' ? 'bg-black text-white' : 'bg-white border text-gray-700'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// CoinGate Crypto Payments Tab
const CoinGatePaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_bookings')
        .select(`
          *,
          users:user_id (id, email, name)
        `)
        .not('coingate_order_id', 'is', null)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('payment_status', filter);
      }

      const { data, error } = await query.limit(100);

      if (!error) {
        setPayments(data || []);
      }
    } catch (error) {
      console.error('Error fetching CoinGate payments:', error);
    }
    setLoading(false);
  };

  const totalPaid = payments.filter(p => p.payment_status === 'paid' || p.payment_status === 'confirmed')
    .reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Bitcoin size={24} className="text-orange-500" />
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">Crypto Payments</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            CoinGate transactions for Empty Legs & Services • ${totalPaid.toLocaleString()} total received
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirming">Confirming</option>
            <option value="paid">Paid</option>
            <option value="confirmed">Confirmed</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchPayments}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Service</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Payment Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="text-sm font-mono text-gray-600">
                        #{payment.coingate_order_id?.slice(0, 8) || payment.id?.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-900">{payment.users?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{payment.users?.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 capitalize">
                        {payment.booking_type?.replace(/_/g, ' ') || payment.service_title || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-mono">
                          {payment.crypto_currency || 'BTC'}
                        </span>
                        {payment.crypto_amount && (
                          <span className="text-xs text-gray-500">{payment.crypto_amount}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        ${parseFloat(payment.total_amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        payment.payment_status === 'paid' || payment.payment_status === 'confirmed'
                          ? 'bg-green-100 text-green-700' :
                        payment.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        payment.payment_status === 'confirming' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {payment.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="p-12 text-center text-gray-500">No CoinGate payments found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Support Tickets Tab
const SupportTicketsTab = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          users:user_id (id, email, name)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.limit(100);

      if (!error) {
        setTickets(data || []);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    }
    setLoading(false);
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (!error) {
        fetchTickets();
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">User support requests and issues • Including AI Chat issue reports</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm"
          >
            <option value="all">All Tickets</option>
            <option value="pending">Pending</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
            <option value="solved">Solved</option>
          </select>
          <button
            onClick={fetchTickets}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Ticket size={18} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      {ticket.subject || 'Support Request'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ticket.status === 'open' || ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'closed' || ticket.status === 'solved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {ticket.status}
                    </span>
                    {ticket.priority && ticket.priority !== 'normal' && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        ticket.priority === 'high' || ticket.priority === 'urgent'
                          ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {ticket.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {ticket.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>From: {ticket.users?.name || ticket.users?.email || 'Unknown'}</span>
                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                    {ticket.tags && ticket.tags.length > 0 && (
                      <div className="flex gap-1">
                        {ticket.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {(ticket.status === 'pending' || ticket.status === 'open') && (
                    <>
                      <button
                        onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => updateTicketStatus(ticket.id, 'solved')}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                  {ticket.status === 'in_progress' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'solved')}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
              No support tickets found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Service Requests Tab (user_requests)
const ServiceRequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const requestTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'private_jet_charter', label: 'Private Jets' },
    { value: 'helicopter_charter', label: 'Helicopters' },
    { value: 'empty_leg', label: 'Empty Legs' },
    { value: 'medevac', label: 'MedEvac' },
    { value: 'yacht_charter', label: 'Yachts' },
    { value: 'luxury_car_rental', label: 'Luxury Cars' },
    { value: 'restaurant_reservation', label: 'Restaurants' },
    { value: 'tokenization', label: 'Tokenization' },
    { value: 'spv_formation', label: 'SPV Formation' },
    { value: 'travel_request', label: 'Travel Planning' },
    { value: 'custom_request', label: 'Custom' },
  ];

  useEffect(() => {
    fetchRequests();
  }, [filter, typeFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_requests')
        .select(`
          *,
          users:user_id (id, email, name)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query.limit(100);

      if (!error) {
        setRequests(data || []);
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
    }
    setLoading(false);
  };

  const updateStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('user_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (!error) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Service Requests</h1>
          <p className="text-sm text-gray-500 mt-1">{requests.length} total requests</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm"
          >
            {requestTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <button
            onClick={fetchRequests}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const ServiceIcon = getServiceIcon(request.type);
            return (
              <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ServiceIcon size={22} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 capitalize">
                          {request.type?.replace(/_/g, ' ') || 'Request'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          request.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        From: {request.users?.name || request.users?.email || 'Unknown'} • {new Date(request.created_at).toLocaleString()}
                      </div>
                      {request.data && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-hidden">
                            {typeof request.data === 'object' ? JSON.stringify(request.data, null, 2).slice(0, 300) : request.data}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(request.id, 'in_progress')}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => updateStatus(request.id, 'completed')}
                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                        >
                          Complete
                        </button>
                      </>
                    )}
                    {request.status === 'in_progress' && (
                      <button
                        onClick={() => updateStatus(request.id, 'completed')}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {requests.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
              No service requests found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Users Management Tab - Card Based Layout (SaasFactor Style)
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 9;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_profiles (*),
          kyc_applications (status, verification_level),
          user_subscriptions (tier, status),
          user_bookings (id, created_at),
          chat_requests (id, created_at),
          transactions (id, amount, created_at)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (!error) {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  // Calculate if user is "repeat" customer (has bookings/requests)
  const isRepeatCustomer = (user) => {
    const bookingsCount = user.user_bookings?.length || 0;
    const requestsCount = user.chat_requests?.length || 0;
    return (bookingsCount + requestsCount) > 1;
  };

  // Calculate days since registration
  const getDaysSinceRegistration = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (filter === 'verified') matchesFilter = user.kyc_applications?.[0]?.status === 'approved';
    if (filter === 'pending') matchesFilter = user.kyc_applications?.[0]?.status === 'pending';
    if (filter === 'admin') matchesFilter = user.is_admin;

    let matchesCustomerType = true;
    if (customerTypeFilter === 'new') matchesCustomerType = !isRepeatCustomer(user);
    if (customerTypeFilter === 'repeat') matchesCustomerType = isRepeatCustomer(user);

    return matchesSearch && matchesFilter && matchesCustomerType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Stats
  const totalCustomers = users.length;
  const newCustomers = users.filter(u => getDaysSinceRegistration(u.created_at) <= 30).length;
  const repeatCustomers = users.filter(u => isRepeatCustomer(u)).length;
  const activeCustomers = users.filter(u => u.user_bookings?.length > 0 || u.chat_requests?.length > 0).length;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // If a user is selected, show the detail page
  if (selectedUser) {
    return <UserDetailPage user={selectedUser} onBack={() => setSelectedUser(null)} onRefresh={fetchUsers} />;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium text-gray-900 tracking-tight">Customer</h1>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Customer</span>
            <Users size={20} className="text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">{totalCustomers.toLocaleString()}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendingUp size={12} />
            <span>2.5%</span>
            <span className="text-gray-400">Higher than last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">New Customer</span>
            <UserPlus size={20} className="text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">{newCustomers.toLocaleString()}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendingUp size={12} />
            <span>2.86%</span>
            <span className="text-gray-400">Higher than last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Repeat Customer</span>
            <RefreshCw size={20} className="text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">{repeatCustomers.toLocaleString()}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
            <TrendingDown size={12} />
            <span>0.12%</span>
            <span className="text-gray-400">Higher than last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">KYC Verified</span>
            <ShieldCheck size={20} className="text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {users.filter(u => u.kyc_applications?.[0]?.status === 'approved').length.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendingUp size={12} />
            <span>4.3%</span>
            <span className="text-gray-400">Higher than last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active Customers</span>
            <Activity size={20} className="text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">{activeCustomers.toLocaleString()}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendingUp size={12} />
            <span>12.3%</span>
            <span className="text-gray-400">Higher than last month</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-gray-900">All Customer</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 w-64 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none"
          >
            <option value="all">All Leads</option>
            <option value="verified">KYC Verified</option>
            <option value="pending">KYC Pending</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none"
          >
            <option value="all">All Service</option>
            <option value="jets">Private Jets</option>
            <option value="yachts">Yachts</option>
            <option value="cars">Luxury Cars</option>
          </select>

          <select
            value={customerTypeFilter}
            onChange={(e) => { setCustomerTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none"
          >
            <option value="all">Customer Type</option>
            <option value="new">New Customer</option>
            <option value="repeat">Repeat Customer</option>
          </select>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {paginatedUsers.map((user) => {
              const isRepeat = isRepeatCustomer(user);
              const subscription = user.user_subscriptions?.[0];
              const profile = user.user_profiles?.[0];

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
                >
                  {/* Header with Avatar and Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-medium text-gray-600">
                            {user.name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{user.name || 'No Name'}</h3>
                        <p className="text-xs text-gray-500 capitalize">
                          {subscription?.tier ? `${subscription.tier} Member` : 'Free User'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      isRepeat
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {isRepeat ? 'Repeat Customer' : 'New Customer'}
                    </span>
                  </div>

                  {/* Email with Copy */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                    <span className="text-sm text-gray-600 truncate">{user.email}</span>
                    <button
                      onClick={() => copyToClipboard(user.email)}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                    >
                      <Copy size={14} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                    <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Users size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No customers found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} className="text-gray-500" />
                  <ChevronLeft size={16} className="text-gray-500 -ml-2" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} className="text-gray-500" />
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-9 h-9 rounded-lg text-sm font-medium hover:bg-gray-100 text-gray-600"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} className="text-gray-500" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} className="text-gray-500" />
                  <ChevronRight size={16} className="text-gray-500 -ml-2" />
                </button>

                <select
                  value={usersPerPage}
                  className="ml-4 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  disabled
                >
                  <option value={9}>9 / page</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// User Detail Page - Full page view with all tracked interactions
const UserDetailPage = ({ user, onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userBookings, setUserBookings] = useState([]);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [userChatRequests, setUserChatRequests] = useState([]);
  const [userSupportTickets, setUserSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllUserData();
  }, [user.id]);

  const fetchAllUserData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [bookingsRes, transactionsRes, requestsRes, chatRequestsRes, ticketsRes] = await Promise.all([
        supabase.from('user_bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('chat_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      setUserBookings(bookingsRes.data || []);
      setUserTransactions(transactionsRes.data || []);
      setUserRequests(requestsRes.data || []);
      setUserChatRequests(chatRequestsRes.data || []);
      setUserSupportTickets(ticketsRes.data || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    setLoading(false);
  };

  const kycStatus = user.kyc_applications?.[0]?.status;
  const profile = user.user_profiles?.[0];
  const subscription = user.user_subscriptions?.[0];
  const totalSpent = userTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'ai-requests', label: 'AI Chat Requests', count: userChatRequests.length },
    { id: 'bookings', label: 'Bookings', count: userBookings.length },
    { id: 'transactions', label: 'Transactions', count: userTransactions.length },
    { id: 'requests', label: 'Service Requests', count: userRequests.length },
    { id: 'support', label: 'Support Tickets', count: userSupportTickets.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft size={18} />
            Back to Customers
          </button>

          {/* User Info Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-medium text-gray-600">
                    {user.name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-semibold text-gray-900">{user.name || 'No Name'}</h1>
                  {user.is_admin && (
                    <span className="px-2.5 py-1 bg-black text-white rounded-full text-xs font-medium">Admin</span>
                  )}
                  {kycStatus === 'approved' && (
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard size={12} />
                    {subscription?.tier ? `${subscription.tier} Member` : 'Free User'}
                  </span>
                  {profile?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
                      {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">${totalSpent.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{userBookings.length}</div>
                <div className="text-xs text-gray-500">Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{userChatRequests.length}</div>
                <div className="text-xs text-gray-500">AI Requests</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-gray-200 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-black text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500">User ID</label>
                      <p className="text-sm text-gray-900 font-mono">{user.id}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{profile?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Location</label>
                      <p className="text-sm text-gray-900">
                        {[profile?.city, profile?.country].filter(Boolean).join(', ') || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">KYC Status</label>
                      <p className={`text-sm font-medium ${
                        kycStatus === 'approved' ? 'text-green-600' :
                        kycStatus === 'pending' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {kycStatus ? kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1) : 'Not Started'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent AI Requests */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent AI Chat Requests</h3>
                  <div className="space-y-3">
                    {userChatRequests.slice(0, 5).map(req => {
                      const ServiceIcon = getServiceIcon(req.service_type);
                      return (
                        <div key={req.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <ServiceIcon size={16} className="text-purple-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate capitalize">
                              {req.service_type?.replace(/_/g, ' ') || 'General'}
                            </p>
                            <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            req.status === 'completed' ? 'bg-green-100 text-green-700' :
                            req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      );
                    })}
                    {userChatRequests.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No AI requests yet</p>
                    )}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                  <div className="space-y-3">
                    {userTransactions.slice(0, 5).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-900 capitalize">{tx.transaction_type || 'Transaction'}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">${parseFloat(tx.amount || 0).toLocaleString()}</p>
                          <p className={`text-xs ${tx.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                            {tx.status}
                          </p>
                        </div>
                      </div>
                    ))}
                    {userTransactions.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No transactions yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI Requests Tab */}
            {activeTab === 'ai-requests' && (
              <div className="space-y-4">
                {userChatRequests.map(req => {
                  const ServiceIcon = getServiceIcon(req.service_type);
                  return (
                    <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <ServiceIcon size={22} className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900 capitalize">
                              {req.service_type?.replace(/_/g, ' ') || 'General Request'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              req.status === 'completed' ? 'bg-green-100 text-green-700' :
                              req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{req.query || 'No query'}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {req.from_location && <span>From: {req.from_location}</span>}
                            {req.to_location && <span>To: {req.to_location}</span>}
                            {req.passengers && <span>Pax: {req.passengers}</span>}
                            <span>{new Date(req.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {userChatRequests.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <MessagesSquare size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No AI chat requests</p>
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {userBookings.map(booking => (
                  <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          {booking.booking_type === 'empty_leg' ? <MapPin size={20} className="text-gray-500" /> :
                           booking.booking_type === 'jet' ? <Plane size={20} className="text-gray-500" /> :
                           <Calendar size={20} className="text-gray-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {booking.booking_type?.replace(/_/g, ' ') || 'Booking'}
                          </p>
                          {booking.origin && booking.destination && (
                            <p className="text-xs text-gray-500">{booking.origin} → {booking.destination}</p>
                          )}
                          <p className="text-xs text-gray-500">{new Date(booking.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {booking.total_amount && (
                          <p className="text-sm font-semibold text-gray-900">${parseFloat(booking.total_amount).toLocaleString()}</p>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {userBookings.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No bookings yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td className="px-5 py-4 text-sm text-gray-900 capitalize">{tx.transaction_type || 'N/A'}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">${parseFloat(tx.amount || 0).toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>{tx.status}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">{new Date(tx.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {userTransactions.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No transactions</div>
                )}
              </div>
            )}

            {/* Service Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {userRequests.map(req => {
                  const ServiceIcon = getServiceIcon(req.type);
                  return (
                    <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <ServiceIcon size={20} className="text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900 capitalize">
                              {req.type?.replace(/_/g, ' ') || 'Request'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              req.status === 'completed' ? 'bg-green-100 text-green-700' :
                              req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {userRequests.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No service requests</p>
                  </div>
                )}
              </div>
            )}

            {/* Support Tickets Tab */}
            {activeTab === 'support' && (
              <div className="space-y-4">
                {userSupportTickets.map(ticket => (
                  <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Ticket size={20} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{ticket.subject || 'Support Request'}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(ticket.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'solved' || ticket.status === 'closed' ? 'bg-green-100 text-green-700' :
                        ticket.status === 'open' || ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
                {userSupportTickets.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Ticket size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No support tickets</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// User Detail Modal
const UserDetailModal = ({ user, onClose, onRefresh }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [userBookings, setUserBookings] = useState([]);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [userChatRequests, setUserChatRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [user.id]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      const { data: bookings } = await supabase
        .from('user_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserBookings(bookings || []);

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserTransactions(transactions || []);

      // Fetch service requests
      const { data: requests } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserRequests(requests || []);

      // Fetch AI chat requests
      const { data: chatRequests } = await supabase
        .from('chat_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserChatRequests(chatRequests || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    setLoading(false);
  };

  const kycStatus = user.kyc_applications?.[0]?.status;
  const profile = user.user_profiles?.[0];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-medium text-gray-600">
                {user.name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name || 'No name'}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user.is_admin && (
                  <span className="px-2 py-0.5 bg-black text-white text-xs rounded-full">Admin</span>
                )}
                {kycStatus === 'approved' && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200">
          <div className="flex gap-6">
            {['profile', 'ai-requests', 'bookings', 'transactions', 'requests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSection(tab)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeSection === tab
                    ? 'border-black text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'ai-requests' ? 'AI Requests' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeSection === 'profile' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Account Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">User ID</label>
                    <p className="text-sm text-gray-900 font-mono">{user.id}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Joined</label>
                    <p className="text-sm text-gray-900">{new Date(user.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Last Login</label>
                    <p className="text-sm text-gray-900">{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Profile Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Phone</label>
                    <p className="text-sm text-gray-900">{profile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Country</label>
                    <p className="text-sm text-gray-900">{profile?.country || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">City</label>
                    <p className="text-sm text-gray-900">{profile?.city || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Address</label>
                    <p className="text-sm text-gray-900">{profile?.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ai-requests' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
              ) : userChatRequests.length > 0 ? (
                userChatRequests.map((req) => {
                  const ServiceIcon = getServiceIcon(req.service_type);
                  return (
                    <div key={req.id} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <ServiceIcon size={18} className="text-purple-600" />
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {req.service_type?.replace(/_/g, ' ') || 'General'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          req.status === 'completed' ? 'bg-green-100 text-green-700' :
                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{req.query}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">No AI chat requests found</div>
              )}
            </div>
          )}

          {activeSection === 'bookings' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
              ) : userBookings.length > 0 ? (
                userBookings.map((booking) => (
                  <div key={booking.id} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">{booking.booking_type || 'Booking'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(booking.created_at).toLocaleString()}</p>
                    {booking.total_amount && (
                      <p className="text-sm font-semibold text-gray-900 mt-1">${parseFloat(booking.total_amount).toLocaleString()}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No bookings found</div>
              )}
            </div>
          )}

          {activeSection === 'transactions' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
              ) : userTransactions.length > 0 ? (
                userTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">{tx.transaction_type || 'Transaction'}</span>
                      <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {tx.amount} {tx.currency}
                      </span>
                      <p className={`text-xs ${tx.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No transactions found</div>
              )}
            </div>
          )}

          {activeSection === 'requests' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
              ) : userRequests.length > 0 ? (
                userRequests.map((req) => (
                  <div key={req.id} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">{req.type || 'Request'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        req.status === 'completed' ? 'bg-green-100 text-green-700' :
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No requests found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// KYC Verification Tab
const KYCTab = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('kyc_applications')
        .select(`
          *,
          users (id, email, name)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.limit(50);

      if (!error) {
        setApplications(data || []);
      }
    } catch (error) {
      console.error('Error fetching KYC applications:', error);
    }
    setLoading(false);
  };

  const updateKYCStatus = async (appId, newStatus) => {
    try {
      const { error } = await supabase
        .from('kyc_applications')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', appId);

      if (!error) {
        fetchApplications();
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">KYC Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Review identity verification requests</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={fetchApplications} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Shield size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{app.users?.name || app.users?.email || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{app.users?.email}</div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  app.status === 'approved' ? 'bg-green-100 text-green-700' :
                  app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {app.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Verification Level</span>
                  <span className="text-gray-900 font-medium">{app.verification_level || 'Level 1'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Submitted</span>
                  <span className="text-gray-900">{new Date(app.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {app.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateKYCStatus(app.id, 'approved')}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateKYCStatus(app.id, 'rejected')}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {applications.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">No KYC applications found</div>
          )}
        </div>
      )}
    </div>
  );
};

// Transactions Tab
const TransactionsTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select(`*, users (id, email, name)`)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.limit(100);

      if (!error) {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
    setLoading(false);
  };

  const totalAmount = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">{transactions.length} transactions • ${totalAmount.toLocaleString()} total</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
            <Download size={16} />Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4"><span className="text-sm font-mono text-gray-600">{tx.id?.slice(0, 8)}...</span></td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-900">{tx.users?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{tx.users?.email}</div>
                    </td>
                    <td className="px-5 py-4"><span className="text-sm text-gray-600 capitalize">{tx.transaction_type || 'N/A'}</span></td>
                    <td className="px-5 py-4 text-right"><span className="text-sm font-semibold text-gray-900">{parseFloat(tx.amount || 0).toLocaleString()} {tx.currency || 'USD'}</span></td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{tx.status}</span>
                    </td>
                    <td className="px-5 py-4"><span className="text-sm text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && <div className="p-12 text-center text-gray-500">No transactions found</div>}
          </div>
        )}
      </div>
    </div>
  );
};

// Bookings Tab
const BookingsTab = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_bookings')
        .select(`*, users (id, email, name)`)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.limit(100);

      if (!error) {
        setBookings(data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
    setLoading(false);
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const { error } = await supabase
        .from('user_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (!error) fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">{bookings.length} total bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={fetchBookings} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    {booking.booking_type === 'jet' && <Plane size={20} className="text-gray-500" />}
                    {booking.booking_type === 'empty_leg' && <MapPin size={20} className="text-gray-500" />}
                    {booking.booking_type === 'car' && <Car size={20} className="text-gray-500" />}
                    {!['jet', 'empty_leg', 'car'].includes(booking.booking_type) && <Calendar size={20} className="text-gray-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 capitalize">{booking.booking_type || 'Booking'} #{booking.id?.slice(0, 8)}</div>
                    <div className="text-xs text-gray-500">{booking.users?.name || booking.users?.email || 'Unknown'}</div>
                    {booking.origin && booking.destination && (
                      <div className="text-xs text-gray-500 mt-1">{booking.origin} → {booking.destination}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{booking.status}</span>

                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateBookingStatus(booking.id, 'confirmed')} className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                        <Check size={16} />
                      </button>
                      <button onClick={() => updateBookingStatus(booking.id, 'cancelled')} className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {booking.total_amount && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Amount</span>
                  <span className="text-sm font-semibold text-gray-900">${parseFloat(booking.total_amount).toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
          {bookings.length === 0 && <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">No bookings found</div>}
        </div>
      )}
    </div>
  );
};

// Chat History Tab
const ChatHistoryTab = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`*, users (id, email, name)`)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (!error) setChats(data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Chat History</h1>
          <p className="text-sm text-gray-500 mt-1">User AI chat conversations</p>
        </div>
        <button onClick={fetchChats} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
          <RefreshCw size={16} />Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Conversations</h3></div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedChat?.id === chat.id ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageSquare size={16} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{chat.users?.name || chat.users?.email || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 truncate">{chat.title || 'No title'}</div>
                    </div>
                  </div>
                </button>
              ))}
              {chats.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No chats found</div>}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
            {selectedChat ? (
              <div className="h-[600px] flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{selectedChat.users?.name || selectedChat.users?.email}</h3>
                      <p className="text-xs text-gray-500">{selectedChat.title}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(selectedChat.updated_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  {selectedChat.messages?.map((msg, idx) => (
                    <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {(!selectedChat.messages || selectedChat.messages.length === 0) && (
                    <div className="text-center text-gray-500 text-sm py-8">No messages</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[600px] flex items-center justify-center text-gray-500">Select a conversation to view</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Tokenization Tab
const TokenizationTab = () => {
  const [tokenizations, setTokenizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTokenizations();
  }, [filter]);

  const fetchTokenizations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tokenization_drafts')
        .select(`*, users (id, email, name)`)
        .order('created_at', { ascending: false });

      if (filter !== 'all') query = query.eq('status', filter);

      const { data, error } = await query.limit(50);
      if (!error) setTokenizations(data || []);
    } catch (error) {
      console.error('Error fetching tokenizations:', error);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('tokenization_drafts').update({ status: newStatus }).eq('id', id);
      if (!error) fetchTokenizations();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Tokenization Requests</h1>
          <p className="text-sm text-gray-500 mt-1">{tokenizations.length} requests</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm">
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={fetchTokenizations} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokenizations.map((token) => (
            <div key={token.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {token.logo_url ? <img src={token.logo_url} alt="" className="w-full h-full object-cover" /> : <Sparkles size={20} className="text-gray-500" />}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  token.status === 'approved' ? 'bg-green-100 text-green-700' :
                  token.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                  token.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{token.status}</span>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mb-1">{token.asset_name || 'Untitled Asset'}</h3>
              <p className="text-xs text-gray-500 mb-3">{token.users?.name || token.users?.email || 'Unknown'} • {token.token_type || 'N/A'}</p>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="text-gray-900 capitalize">{token.asset_category || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Value</span>
                  <span className="text-gray-900">${(token.asset_value || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Symbol</span>
                  <span className="text-gray-900 font-mono">{token.token_symbol || 'N/A'}</span>
                </div>
              </div>

              {token.status === 'submitted' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(token.id, 'approved')} className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">Approve</button>
                  <button onClick={() => updateStatus(token.id, 'rejected')} className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">Reject</button>
                </div>
              )}
            </div>
          ))}
          {tokenizations.length === 0 && <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">No tokenization requests found</div>}
        </div>
      )}
    </div>
  );
};

// Booking Requests Tab (from booking_requests table)
const BookingRequestsTab = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookingRequests();
  }, [filter]);

  const fetchBookingRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('booking_requests')
        .select(`*, users:user_id (id, email, name)`)
        .order('created_at', { ascending: false });

      if (filter !== 'all') query = query.eq('status', filter);

      const { data, error } = await query.limit(100);
      if (!error) setBookings(data || []);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('booking_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (!error) fetchBookingRequests();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Booking Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Flight booking requests from booking flow • {bookings.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={fetchBookingRequests} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Plane size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {booking.origin_airport_code} → {booking.destination_airport_code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{booking.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {booking.users?.name || booking.users?.email || booking.contact_email} • {new Date(booking.created_at).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                      {booking.departure_date && <span>📅 {booking.departure_date}</span>}
                      {booking.passengers && <span>👥 {booking.passengers} pax</span>}
                      {booking.selected_jet_category && <span>✈️ {booking.selected_jet_category}</span>}
                      {booking.total_price && <span className="font-semibold text-gray-900">💵 ${parseFloat(booking.total_price).toLocaleString()}</span>}
                      {booking.payment_method && <span>💳 {booking.payment_method}</span>}
                    </div>
                    {booking.aviation_services && booking.aviation_services.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {booking.aviation_services.map((service, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{service}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {booking.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(booking.id, 'confirmed')} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">Confirm</button>
                      <button onClick={() => updateStatus(booking.id, 'cancelled')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">Cancel</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {bookings.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Plane size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No booking requests found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Subscriptions Tab
const SubscriptionsTab = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [chatUsage, setChatUsage] = useState([]);
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('profiles');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      // Fetch user profiles with subscription data
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select(`*, users:user_id (id, email, name)`)
        .order('updated_at', { ascending: false })
        .limit(100);

      // Fetch chat usage
      const { data: usage } = await supabase
        .from('chat_usage')
        .select(`*, users:user_id (id, email, name)`)
        .order('started_at', { ascending: false })
        .limit(100);

      // Fetch chat topups
      const { data: topupsData } = await supabase
        .from('chat_topups')
        .select(`*, users:user_id (id, email, name)`)
        .order('purchased_at', { ascending: false })
        .limit(100);

      setSubscriptions(profiles || []);
      setChatUsage(usage || []);
      setTopups(topupsData || []);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    }
    setLoading(false);
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'elite': return 'bg-purple-100 text-purple-700';
      case 'traveller': return 'bg-blue-100 text-blue-700';
      case 'explorer': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">User subscription plans, chat usage & top-ups</p>
        </div>
        <button onClick={fetchSubscriptionData} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { id: 'profiles', label: 'User Profiles', count: subscriptions.length },
          { id: 'usage', label: 'Chat Usage', count: chatUsage.length },
          { id: 'topups', label: 'Top-ups', count: topups.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeSubTab === tab.id ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <>
          {/* User Profiles */}
          {activeSubTab === 'profiles' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tier</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Chats</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Reset Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">{sub.users?.name || 'No name'}</div>
                        <div className="text-xs text-gray-500">{sub.email || sub.users?.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getTierColor(sub.subscription_tier)}`}>
                          {sub.subscription_tier || 'free'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          sub.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {sub.subscription_status || 'inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900">
                        {sub.chats_used || 0} / {sub.chats_limit || 0}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {sub.chats_reset_date ? new Date(sub.chats_reset_date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subscriptions.length === 0 && (
                <div className="text-center py-12 text-gray-500">No subscription profiles found</div>
              )}
            </div>
          )}

          {/* Chat Usage */}
          {activeSubTab === 'usage' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Session ID</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Messages</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Started</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {chatUsage.map((usage) => (
                    <tr key={usage.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">{usage.users?.name || 'No name'}</div>
                        <div className="text-xs text-gray-500">{usage.users?.email}</div>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-gray-500">{usage.chat_session_id?.slice(0, 8)}...</td>
                      <td className="px-5 py-4 text-sm text-gray-900">{usage.message_count || 0}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {usage.started_at ? new Date(usage.started_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          usage.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {usage.completed ? 'Completed' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {chatUsage.length === 0 && (
                <div className="text-center py-12 text-gray-500">No chat usage records found</div>
              )}
            </div>
          )}

          {/* Top-ups */}
          {activeSubTab === 'topups' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Package</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Chats Added</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topups.map((topup) => (
                    <tr key={topup.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">{topup.users?.name || 'No name'}</div>
                        <div className="text-xs text-gray-500">{topup.users?.email}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900 capitalize">{topup.package_type || 'N/A'}</td>
                      <td className="px-5 py-4 text-sm text-gray-900">+{topup.chats_added || 0}</td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">${topup.price_usd || 0}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          topup.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {topup.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {topup.purchased_at ? new Date(topup.purchased_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topups.length === 0 && (
                <div className="text-center py-12 text-gray-500">No top-up records found</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// PVCX Token Tab
const PVCXTokenTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPVCXTransactions();
  }, []);

  const fetchPVCXTransactions = async () => {
    setLoading(true);
    try {
      // Try to fetch from transactions table with PVCX related types
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, users:user_id (id, email, name)`)
        .or('transaction_type.ilike.%pvcx%,transaction_type.ilike.%token%,transaction_type.ilike.%swap%')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error) setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching PVCX transactions:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">PVCX Token Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">Token swaps and PVCX transactions • {transactions.length} records</p>
        </div>
        <button onClick={fetchPVCXTransactions} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Wallet</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-gray-900">{tx.users?.name || 'No name'}</div>
                    <div className="text-xs text-gray-500">{tx.users?.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      {tx.transaction_type || 'token'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">
                    {parseFloat(tx.amount || 0).toLocaleString()} {tx.currency || 'PVCX'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-gray-500">
                    {tx.wallet_address ? `${tx.wallet_address.slice(0, 6)}...${tx.wallet_address.slice(-4)}` : 'N/A'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="text-center py-12">
              <Coins size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No PVCX token transactions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// SPV Formation Tab
const SPVFormationTab = () => {
  const [spvRequests, setSpvRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedSPV, setSelectedSPV] = useState(null);

  useEffect(() => {
    fetchSPVRequests();
  }, [filter]);

  const fetchSPVRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_requests')
        .select(`*, users:user_id (id, email, name)`)
        .eq('type', 'spv_formation')
        .order('created_at', { ascending: false });

      if (filter !== 'all') query = query.eq('status', filter);

      const { data, error } = await query.limit(100);
      if (!error) setSpvRequests(data || []);
    } catch (error) {
      console.error('Error fetching SPV requests:', error);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('user_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (!error) fetchSPVRequests();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">SPV Formation Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Company formation and SPV structure requests • {spvRequests.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={fetchSPVRequests} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spvRequests.map((spv) => {
            const data = spv.data || {};
            return (
              <div key={spv.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Building2 size={22} className="text-indigo-600" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    spv.status === 'completed' ? 'bg-green-100 text-green-700' :
                    spv.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    spv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{spv.status}</span>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-1">{data.companyName || 'Unnamed Company'}</h3>
                <p className="text-xs text-gray-500 mb-3">{spv.users?.name || spv.users?.email || 'Unknown'}</p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Jurisdiction</span>
                    <span className="text-gray-900">{data.jurisdiction || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tier</span>
                    <span className="text-gray-900 capitalize">{data.tier || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Directors</span>
                    <span className="text-gray-900">{data.numberOfDirectors || data.directors?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tokenize Assets</span>
                    <span className="text-gray-900">{data.planningToTokenizeAssets ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mb-3">
                  {new Date(spv.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSPV(spv)}
                    className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100"
                  >
                    View Details
                  </button>
                  {spv.status === 'pending' && (
                    <button onClick={() => updateStatus(spv.id, 'in_progress')} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">
                      Start
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {spvRequests.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
              <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No SPV formation requests found</p>
            </div>
          )}
        </div>
      )}

      {/* SPV Detail Modal */}
      {selectedSPV && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">SPV Request Details</h2>
              <button onClick={() => setSelectedSPV(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-gray-500">Company Name</label>
                <p className="text-sm text-gray-900">{selectedSPV.data?.companyName || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Jurisdiction</label>
                  <p className="text-sm text-gray-900">{selectedSPV.data?.jurisdiction || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Tier</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedSPV.data?.tier || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Business Activity</label>
                <p className="text-sm text-gray-900">{selectedSPV.data?.businessActivity || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <p className="text-sm text-gray-900">{selectedSPV.data?.companyDescription || 'N/A'}</p>
              </div>
              {selectedSPV.data?.directors && (
                <div>
                  <label className="text-xs text-gray-500">Directors</label>
                  <div className="mt-2 space-y-2">
                    {selectedSPV.data.directors.map((d, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="font-medium">{d.fullName}</p>
                        <p className="text-gray-500">{d.email} • {d.nationality}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedSPV.data?.services && (
                <div>
                  <label className="text-xs text-gray-500">Additional Services</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(selectedSPV.data.services).filter(([_, v]) => v).map(([key]) => (
                      <span key={key} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// NFT Benefits Tab
const NFTBenefitsTab = () => {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNFTBenefits();
  }, []);

  const fetchNFTBenefits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nft_benefits_used')
        .select(`*, users:user_id (id, email, name)`)
        .order('used_at', { ascending: false })
        .limit(100);

      if (!error) setBenefits(data || []);
    } catch (error) {
      console.error('Error fetching NFT benefits:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">NFT Benefits Usage</h1>
          <p className="text-sm text-gray-500 mt-1">Track NFT holder benefits and discounts • {benefits.length} records</p>
        </div>
        <button onClick={fetchNFTBenefits} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{benefits.length}</div>
              <div className="text-xs text-gray-500">Benefits Used</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">
                ${benefits.reduce((sum, b) => sum + (parseFloat(b.service_value) || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total Value</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">
                {new Set(benefits.map(b => b.user_id)).size}
              </div>
              <div className="text-xs text-gray-500">Unique Users</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">NFT Token ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Wallet</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Used At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {benefits.map((benefit) => (
                <tr key={benefit.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-gray-900">{benefit.users?.name || 'No name'}</div>
                    <div className="text-xs text-gray-500">{benefit.users?.email}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-mono text-gray-900">#{benefit.nft_token_id}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-900">{benefit.service_name || benefit.service_type}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-green-600">
                    ${parseFloat(benefit.service_value || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-gray-500">
                    {benefit.wallet_address ? `${benefit.wallet_address.slice(0, 6)}...${benefit.wallet_address.slice(-4)}` : 'N/A'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {benefit.used_at ? new Date(benefit.used_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {benefits.length === 0 && (
            <div className="text-center py-12">
              <Sparkles size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No NFT benefits used yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CRMDashboard;
