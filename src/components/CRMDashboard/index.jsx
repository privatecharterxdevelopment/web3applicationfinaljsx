import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../context/AuthContext';
import {
  Users, UserPlus, UserCheck, RefreshCcw, Activity,
  Search, LayoutGrid, List, ChevronLeft, ChevronRight,
  X, Mail, Phone, MapPin, Calendar, Plane, Car, Ship,
  CreditCard, MessageSquare, FileText, ShieldCheck,
  DollarSign, Eye, Copy, MoreVertical,
  TrendingUp, TrendingDown, Loader2, ShieldAlert, ChevronDown,
  Home, BarChart3, Briefcase, Tag, Globe, Zap,
  Building2, Sparkles, Ticket, Clock, Package, AlertCircle,
  ArrowRight, Star, Leaf, Percent
} from 'lucide-react';

// ============================================
// ADMIN SUPABASE CLIENT - BYPASSES RLS
// ============================================
const supabaseUrl = 'https://oubecmstqtzdnevyqavu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91YmVjbXN0cXR6ZG5ldnlxYXZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA5NzQxMiwiZXhwIjoyMDY2NjczNDEyfQ.35V_vACN8pmSKku3yOvtijmwUpdnPHR2-UqPm7rfMIA';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ============================================
// MAIN CRM DASHBOARD
// ============================================
const CRMDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('customers');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Data states
  const [customers, setCustomers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [allAiChats, setAllAiChats] = useState([]);
  const [allSupport, setAllSupport] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allChatMessages, setAllChatMessages] = useState([]);
  const [allChatRequests, setAllChatRequests] = useState([]);
  const [allEmptyLegBookings, setAllEmptyLegBookings] = useState([]);
  const [allEmptyLegsFromTable, setAllEmptyLegsFromTable] = useState([]);
  const [sidebarCounts, setSidebarCounts] = useState({});

  const [stats, setStats] = useState({ total: 0, new: 0, repeat: 0, churned: 0, active: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 9;

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const { data } = await supabaseAdmin.from('users').select('is_admin, user_role').eq('id', user.id).single();
        if (data) setIsAdmin(data.is_admin || data.user_role === 'admin' || data.user_role === 'super_admin');
      } catch (err) { console.error('Error checking admin:', err); }
      setLoading(false);
    };
    checkAdmin();
  }, [user?.id]);

  // Fetch sidebar counts - use auth.users for real user count
  const fetchSidebarCounts = useCallback(async () => {
    try {
      // Get auth users count separately (real registered users)
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      const authUsersCount = authData?.total || 0;

      const [
        { count: bookingsCount },
        { count: requestsCount },
        { count: aiChatsCount },
        { count: supportCount },
        { count: transactionsCount },
        { count: jetsCount },
        { count: carsCount },
        { count: yachtsCount },
        { count: helicoptersCount },
        { count: chatMessagesCount },
        { count: chatRequestsCount },
        { count: emptyLegBookingsCount },
        { count: emptyLegsTableCount }
      ] = await Promise.all([
        supabaseAdmin.from('user_bookings').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('user_requests').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('ai_chat_sessions').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('support_tickets').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('user_bookings').select('*', { count: 'exact', head: true }).or('service_type.eq.private_jet,service_type.eq.jet'),
        supabaseAdmin.from('user_bookings').select('*', { count: 'exact', head: true }).or('service_type.eq.luxury_car,service_type.eq.car,service_type.eq.ground_transport'),
        supabaseAdmin.from('user_bookings').select('*', { count: 'exact', head: true }).eq('service_type', 'yacht'),
        supabaseAdmin.from('user_bookings').select('*', { count: 'exact', head: true }).eq('service_type', 'helicopter'),
        supabaseAdmin.from('chat_messages').select('*', { count: 'exact', head: true }).eq('sender_type', 'user'),
        supabaseAdmin.from('chat_requests').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('user_bookings').select('*', { count: 'exact', head: true }).eq('booking_type', 'empty_leg'),
        supabaseAdmin.from('EmptyLegs_').select('*', { count: 'exact', head: true })
      ]);
      setSidebarCounts({
        customers: authUsersCount, // Use auth.users count - the REAL number of registered users
        bookings: bookingsCount || 0,
        requests: requestsCount || 0,
        aiChats: aiChatsCount || 0,
        support: supportCount || 0,
        transactions: transactionsCount || 0,
        jets: jetsCount || 0,
        cars: carsCount || 0,
        yachts: yachtsCount || 0,
        helicopters: helicoptersCount || 0,
        chatMessages: chatMessagesCount || 0,
        chatRequests: chatRequestsCount || 0,
        emptyLegBookings: emptyLegBookingsCount || 0,
        emptyLegsTable: emptyLegsTableCount || 0
      });
    } catch (err) { console.error('Error fetching counts:', err); }
  }, []);

  // Fetch customers from AUTH.USERS (real source of truth) - SORTED BY LATEST FIRST
  const fetchCustomers = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch ALL users from auth.users - need to get all for proper sorting
      let allAuthUsers = [];
      let page = 1;
      const perPage = 100; // Fetch in batches of 100
      let hasMore = true;

      while (hasMore) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          page: page,
          perPage: perPage
        });

        if (authError) {
          console.error('Error fetching auth users:', authError);
          break;
        }

        const users = authData?.users || [];
        allAuthUsers = [...allAuthUsers, ...users];

        // Check if there are more pages
        hasMore = users.length === perPage;
        page++;
      }

      const totalCount = allAuthUsers.length;
      console.log('Fetched ALL auth.users:', totalCount);

      // Sort ALL users by created_at descending (newest first)
      const sortedUsers = [...allAuthUsers].sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });

      // Apply search filter if present
      let filteredUsers = sortedUsers;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredUsers = sortedUsers.filter(u =>
          u.email?.toLowerCase().includes(term) ||
          u.user_metadata?.name?.toLowerCase().includes(term) ||
          u.user_metadata?.first_name?.toLowerCase().includes(term) ||
          u.user_metadata?.last_name?.toLowerCase().includes(term)
        );
      }

      // Now paginate the sorted/filtered results
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize;
      const paginatedUsers = filteredUsers.slice(from, to);

      console.log('Users after sort (newest first):', paginatedUsers.slice(0, 3).map(u => ({ email: u.email, created_at: u.created_at })));

      // Enrich with public users data and other tables
      const enrichedUsers = await Promise.all(paginatedUsers.map(async (authUser) => {
        const [
          { data: publicUser },
          { data: bookings },
          { data: requests },
          { data: aiChats },
          { data: supportTickets },
          { data: profile }
        ] = await Promise.all([
          supabaseAdmin.from('users').select('*').eq('id', authUser.id).single(),
          supabaseAdmin.from('user_bookings').select('*').eq('user_id', authUser.id),
          supabaseAdmin.from('user_requests').select('*').eq('user_id', authUser.id),
          supabaseAdmin.from('ai_chat_sessions').select('*').eq('user_id', authUser.id),
          supabaseAdmin.from('support_tickets').select('*').eq('user_id', authUser.id),
          supabaseAdmin.from('user_profiles').select('avatar_url, phone, city, country, wallet_address').eq('user_id', authUser.id).single()
        ]);

        // Merge auth user data with public user data
        return {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at, // Use auth.users created_at - this is the REAL registration time
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          phone: authUser.phone,
          // From user_metadata
          name: authUser.user_metadata?.name || publicUser?.name,
          first_name: authUser.user_metadata?.first_name || publicUser?.first_name,
          last_name: authUser.user_metadata?.last_name || publicUser?.last_name,
          avatar_url: authUser.user_metadata?.avatar_url || profile?.avatar_url,
          // From public.users table
          is_admin: publicUser?.is_admin,
          user_role: publicUser?.user_role,
          is_active: publicUser?.is_active,
          // Related data
          bookings: bookings || [],
          requests: requests || [],
          aiChats: aiChats || [],
          supportTickets: supportTickets || [],
          profile: profile || {}
        };
      }));

      setCustomers(enrichedUsers);
      setTotalPages(Math.ceil(filteredUsers.length / pageSize));

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStats({
        total: totalCount,
        new: sortedUsers.filter(c => new Date(c.created_at) > thirtyDaysAgo).length,
        repeat: enrichedUsers.filter(c => c.bookings.length > 1).length,
        churned: Math.floor(totalCount * 0.03),
        active: enrichedUsers.filter(c => c.is_active !== false).length
      });
    } catch (err) { console.error('Error:', err); }
    finally { setRefreshing(false); }
  }, [currentPage, searchTerm]);

  // Helper to enrich data with user info
  const enrichWithUserData = async (items, userIdField = 'user_id') => {
    if (!items || items.length === 0) return [];
    const userIds = [...new Set(items.map(item => item[userIdField]).filter(Boolean))];
    if (userIds.length === 0) return items;

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, name, first_name, last_name')
      .in('id', userIds);

    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u; });

    return items.map(item => ({
      ...item,
      users: userMap[item[userIdField]] || null
    }));
  };

  // Fetch all bookings
  const fetchAllBookings = useCallback(async (serviceFilter = null) => {
    setRefreshing(true);
    try {
      let query = supabaseAdmin.from('user_bookings').select('*').order('created_at', { ascending: false }).limit(100);
      if (serviceFilter) {
        if (serviceFilter === 'jet') query = query.or('service_type.eq.private_jet,service_type.eq.jet,service_type.eq.empty_leg');
        else if (serviceFilter === 'car') query = query.or('service_type.eq.luxury_car,service_type.eq.car,service_type.eq.ground_transport');
        else query = query.eq('service_type', serviceFilter);
      }
      const { data, error } = await query;
      if (error) console.error('Bookings fetch error:', error);
      const enriched = await enrichWithUserData(data || []);
      setAllBookings(enriched);
    } catch (err) { console.error('Error fetching bookings:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch all requests
  const fetchAllRequests = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin.from('user_requests').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) console.error('Requests fetch error:', error);
      const enriched = await enrichWithUserData(data || []);
      setAllRequests(enriched);
    } catch (err) { console.error('Error fetching requests:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch all AI chats
  const fetchAllAiChats = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin.from('ai_chat_sessions').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) console.error('AI chats fetch error:', error);
      const enriched = await enrichWithUserData(data || []);
      setAllAiChats(enriched);
    } catch (err) { console.error('Error fetching AI chats:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch all support tickets
  const fetchAllSupport = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) console.error('Support fetch error:', error);
      const enriched = await enrichWithUserData(data || []);
      setAllSupport(enriched);
    } catch (err) { console.error('Error fetching support:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch all transactions
  const fetchAllTransactions = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin.from('transactions').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) console.error('Transactions fetch error:', error);
      const enriched = await enrichWithUserData(data || []);
      setAllTransactions(enriched);
    } catch (err) { console.error('Error fetching transactions:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch all chat messages from users
  const fetchAllChatMessages = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin.from('chat_messages').select('*').eq('sender_type', 'user').order('created_at', { ascending: false }).limit(200);
      if (error) console.error('Chat messages fetch error:', error);
      const enriched = await enrichWithUserData(data || []);
      setAllChatMessages(enriched);
    } catch (err) { console.error('Error fetching chat messages:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch all AI chat requests (cart items sent by users)
  const fetchAllChatRequests = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin.from('chat_requests').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) console.error('Chat requests fetch error:', error);
      const enriched = await enrichWithUserData(data || []);
      setAllChatRequests(enriched);
    } catch (err) { console.error('Error fetching chat requests:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch empty leg bookings (Coingate payments)
  const fetchEmptyLegBookings = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin.from('user_bookings').select('*').eq('booking_type', 'empty_leg').order('created_at', { ascending: false }).limit(100);
      if (error) console.error('Empty leg bookings fetch error:', error);
      const enriched = await enrichWithUserData(data || []);
      setAllEmptyLegBookings(enriched);
    } catch (err) { console.error('Error fetching empty leg bookings:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch empty legs from EmptyLegs_ table
  const fetchEmptyLegsFromTable = useCallback(async () => {
    setRefreshing(true);
    try {
      // EmptyLegs_ table uses departure_date, not created_at
      const { data, error } = await supabaseAdmin.from('EmptyLegs_').select('*').order('departure_date', { ascending: true }).limit(200);
      if (error) {
        console.error('EmptyLegs_ fetch error:', error);
        // Try without ordering if that fails
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin.from('EmptyLegs_').select('*').limit(200);
        if (fallbackError) console.error('EmptyLegs_ fallback error:', fallbackError);
        setAllEmptyLegsFromTable(fallbackData || []);
      } else {
        console.log('EmptyLegs_ fetched:', data?.length, 'records');
        setAllEmptyLegsFromTable(data || []);
      }
    } catch (err) { console.error('Error fetching EmptyLegs_:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Effect to fetch data based on active section
  useEffect(() => {
    if (!isAdmin) return;
    fetchSidebarCounts();

    switch (activeSection) {
      case 'customers': fetchCustomers(); break;
      case 'bookings': fetchAllBookings(); break;
      case 'jets': fetchAllBookings('jet'); break;
      case 'cars': fetchAllBookings('car'); break;
      case 'yachts': fetchAllBookings('yacht'); break;
      case 'helicopters': fetchAllBookings('helicopter'); break;
      case 'requests': fetchAllRequests(); break;
      case 'ai-chats': fetchAllAiChats(); break;
      case 'support': fetchAllSupport(); break;
      case 'transactions': fetchAllTransactions(); break;
      case 'chat-messages': fetchAllChatMessages(); break;
      case 'chat-requests': fetchAllChatRequests(); break;
      case 'empty-legs': fetchEmptyLegBookings(); break;
      case 'emptylegs-table': fetchEmptyLegsFromTable(); break;
      default: fetchCustomers();
    }
  }, [isAdmin, activeSection, fetchCustomers, fetchAllBookings, fetchAllRequests, fetchAllAiChats, fetchAllSupport, fetchAllTransactions, fetchAllChatMessages, fetchAllChatRequests, fetchEmptyLegBookings, fetchEmptyLegsFromTable, fetchSidebarCounts]);

  const getUserName = (c) => c?.name || `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || c?.email?.split('@')[0] || 'Unknown';
  const getUserRole = (c) => c?.user_role || (c?.bookings?.length > 5 ? 'VIP' : c?.bookings?.length > 0 ? 'Active' : 'New');
  const isRepeatCustomer = (c) => (c?.bookings?.length || 0) > 1;
  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  // Sidebar menu items
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', count: null },
    { id: 'customers', icon: Users, label: 'Customers', count: sidebarCounts.customers },
    { id: 'bookings', icon: Calendar, label: 'All Bookings', count: sidebarCounts.bookings },
    { id: 'jets', icon: Plane, label: 'Jet Bookings', count: sidebarCounts.jets },
    { id: 'empty-legs', icon: Tag, label: 'Empty Leg Bookings', count: sidebarCounts.emptyLegBookings },
    { id: 'emptylegs-table', icon: Globe, label: 'EmptyLegs Inventory', count: sidebarCounts.emptyLegsTable },
    { id: 'cars', icon: Car, label: 'Car Rentals', count: sidebarCounts.cars },
    { id: 'yachts', icon: Ship, label: 'Yacht Charters', count: sidebarCounts.yachts },
    { id: 'helicopters', icon: Zap, label: 'Helicopters', count: sidebarCounts.helicopters },
    { id: 'requests', icon: FileText, label: 'Requests', count: sidebarCounts.requests },
    { id: 'chat-requests', icon: Package, label: 'AI Cart Requests', count: sidebarCounts.chatRequests },
    { id: 'chat-messages', icon: MessageSquare, label: 'Chat Messages', count: sidebarCounts.chatMessages },
    { id: 'ai-chats', icon: Sparkles, label: 'AI Conversations', count: sidebarCounts.aiChats },
    { id: 'support', icon: Ticket, label: 'Support', count: sidebarCounts.support },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', count: sidebarCounts.transactions },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
          <button onClick={onClose} className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-['Inter',sans-serif]">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col fixed h-full z-40">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email?.split('@')[0] || 'Admin'}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setCurrentPage(1); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all mb-1 ${
                activeSection === item.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
              {item.count !== null && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeSection === item.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={16} /> Close CRM
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60">
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 capitalize">
              {activeSection === 'ai-chats' ? 'AI Chat Sessions' : activeSection.replace('-', ' ')}
            </h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard Overview */}
          {activeSection === 'dashboard' && (
            <DashboardOverview sidebarCounts={sidebarCounts} onNavigate={setActiveSection} />
          )}

          {/* Customers Section */}
          {activeSection === 'customers' && (
            <CustomersSection
              customers={customers}
              stats={stats}
              viewMode={viewMode}
              setViewMode={setViewMode}
              refreshing={refreshing}
              fetchCustomers={fetchCustomers}
              getUserName={getUserName}
              getUserRole={getUserRole}
              isRepeatCustomer={isRepeatCustomer}
              copyToClipboard={copyToClipboard}
              setSelectedUser={setSelectedUser}
              setShowUserModal={setShowUserModal}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          )}

          {/* Bookings Sections */}
          {['bookings', 'jets', 'cars', 'yachts', 'helicopters'].includes(activeSection) && (
            <BookingsSection
              bookings={allBookings}
              refreshing={refreshing}
              onRefresh={() => {
                if (activeSection === 'jets') fetchAllBookings('jet');
                else if (activeSection === 'cars') fetchAllBookings('car');
                else if (activeSection === 'yachts') fetchAllBookings('yacht');
                else if (activeSection === 'helicopters') fetchAllBookings('helicopter');
                else fetchAllBookings();
              }}
              title={activeSection === 'bookings' ? 'All Bookings' : `${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Bookings`}
            />
          )}

          {/* Empty Legs Section */}
          {activeSection === 'empty-legs' && (
            <EmptyLegsSection bookings={allEmptyLegBookings} refreshing={refreshing} onRefresh={fetchEmptyLegBookings} />
          )}

          {/* Requests Section */}
          {activeSection === 'requests' && (
            <RequestsSection requests={allRequests} refreshing={refreshing} onRefresh={fetchAllRequests} supabaseAdmin={supabaseAdmin} />
          )}

          {/* Chat Requests Section (AI Cart) */}
          {activeSection === 'chat-requests' && (
            <ChatRequestsSection requests={allChatRequests} refreshing={refreshing} onRefresh={fetchAllChatRequests} />
          )}

          {/* Chat Messages Section */}
          {activeSection === 'chat-messages' && (
            <ChatMessagesSection messages={allChatMessages} refreshing={refreshing} onRefresh={fetchAllChatMessages} />
          )}

          {/* AI Chats Section */}
          {activeSection === 'ai-chats' && (
            <AiChatsSection chats={allAiChats} refreshing={refreshing} onRefresh={fetchAllAiChats} />
          )}

          {/* Support Section */}
          {activeSection === 'support' && (
            <SupportSection tickets={allSupport} refreshing={refreshing} onRefresh={fetchAllSupport} />
          )}

          {/* Transactions Section */}
          {activeSection === 'transactions' && (
            <TransactionsSection transactions={allTransactions} refreshing={refreshing} onRefresh={fetchAllTransactions} />
          )}

          {/* EmptyLegs Table Section */}
          {activeSection === 'emptylegs-table' && (
            <EmptyLegsTableSection emptyLegs={allEmptyLegsFromTable} refreshing={refreshing} onRefresh={fetchEmptyLegsFromTable} />
          )}
        </div>
      </main>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={() => { setShowUserModal(false); setSelectedUser(null); }} getUserName={getUserName} />
      )}
    </div>
  );
};

// ============================================
// DASHBOARD OVERVIEW
// ============================================
const DashboardOverview = ({ sidebarCounts, onNavigate }) => {
  const cards = [
    { label: 'Total Customers', value: sidebarCounts.customers, icon: Users, color: 'blue', section: 'customers' },
    { label: 'All Bookings', value: sidebarCounts.bookings, icon: Calendar, color: 'green', section: 'bookings' },
    { label: 'Jet Bookings', value: sidebarCounts.jets, icon: Plane, color: 'purple', section: 'jets' },
    { label: 'Empty Leg Bookings', value: sidebarCounts.emptyLegBookings, icon: Tag, color: 'amber', section: 'empty-legs' },
    { label: 'EmptyLegs Inventory', value: sidebarCounts.emptyLegsTable, icon: Globe, color: 'teal', section: 'emptylegs-table' },
    { label: 'Car Rentals', value: sidebarCounts.cars, icon: Car, color: 'orange', section: 'cars' },
    { label: 'Yacht Charters', value: sidebarCounts.yachts, icon: Ship, color: 'cyan', section: 'yachts' },
    { label: 'Helicopters', value: sidebarCounts.helicopters, icon: Zap, color: 'yellow', section: 'helicopters' },
    { label: 'Requests', value: sidebarCounts.requests, icon: FileText, color: 'pink', section: 'requests' },
    { label: 'AI Cart Requests', value: sidebarCounts.chatRequests, icon: Package, color: 'violet', section: 'chat-requests' },
    { label: 'AI Conversations', value: sidebarCounts.aiChats, icon: Sparkles, color: 'indigo', section: 'ai-chats' },
    { label: 'Support Tickets', value: sidebarCounts.support, icon: Ticket, color: 'red', section: 'support' },
    { label: 'Transactions', value: sidebarCounts.transactions, icon: CreditCard, color: 'emerald', section: 'transactions' },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    cyan: 'bg-cyan-100 text-cyan-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    pink: 'bg-pink-100 text-pink-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    red: 'bg-red-100 text-red-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
    teal: 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => onNavigate(card.section)}
          className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
        >
          <div className={`w-10 h-10 ${colorClasses[card.color]} rounded-lg flex items-center justify-center mb-3`}>
            <card.icon size={18} />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{(card.value || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500">{card.label}</p>
        </button>
      ))}
    </div>
  );
};

// ============================================
// CUSTOMERS SECTION
// ============================================
const CustomersSection = ({ customers, stats, viewMode, setViewMode, refreshing, fetchCustomers, getUserName, getUserRole, isRepeatCustomer, copyToClipboard, setSelectedUser, setShowUserModal, currentPage, totalPages, setCurrentPage }) => (
  <>
    {/* Stats */}
    <div className="grid grid-cols-5 gap-4 mb-6">
      <StatCard label="Total Customers" value={stats.total} change={2.5} icon={Users} />
      <StatCard label="New (30 days)" value={stats.new} change={2.86} icon={UserPlus} />
      <StatCard label="Repeat Customers" value={stats.repeat} change={-0.12} icon={RefreshCcw} />
      <StatCard label="Churned" value={stats.churned} change={4.3} icon={UserCheck} />
      <StatCard label="Active" value={stats.active} change={12.3} icon={Activity} />
    </div>

    {/* Filters */}
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-medium text-gray-900">All Customers</h2>
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}>
            <LayoutGrid size={16} className="text-gray-600" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}>
            <List size={16} className="text-gray-600" />
          </button>
        </div>
        <button onClick={fetchCustomers} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>

    {/* Customer Grid/List */}
    {refreshing && customers.length === 0 ? (
      <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
    ) : customers.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><Users className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">No customers found</p></div>
    ) : viewMode === 'grid' ? (
      <div className="grid grid-cols-3 gap-4">
        {customers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} getUserName={getUserName} getUserRole={getUserRole} isRepeatCustomer={isRepeatCustomer} copyToClipboard={copyToClipboard} onViewDetails={() => { setSelectedUser(customer); setShowUserModal(true); }} />
        ))}
      </div>
    ) : (
      <CustomerTable customers={customers} getUserName={getUserName} getUserRole={getUserRole} isRepeatCustomer={isRepeatCustomer} onViewDetails={(c) => { setSelectedUser(c); setShowUserModal(true); }} />
    )}

    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
  </>
);

// ============================================
// BOOKINGS SECTION - CLEAN & DETAILED VIEW
// ============================================
const BookingsSection = ({ bookings, refreshing, onRefresh, title }) => {
  const [expandedBooking, setExpandedBooking] = useState(null);

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700',
      refunded: 'bg-purple-100 text-purple-700',
      failed: 'bg-red-100 text-red-700',
      authorized: 'bg-blue-100 text-blue-700',
      pending_crypto: 'bg-orange-100 text-orange-700'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const getServiceIcon = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('jet') || t.includes('flight') || t.includes('empty_leg')) return Plane;
    if (t.includes('car') || t.includes('ground') || t.includes('transfer')) return Car;
    if (t.includes('yacht') || t.includes('boat')) return Ship;
    if (t.includes('helicopter') || t.includes('heli')) return Zap;
    return Calendar;
  };

  const formatServiceType = (type) => {
    if (!type) return 'Unknown Service';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Extract booking details from various possible data structures
  const getBookingDetails = (b) => {
    const data = b.booking_data || b.data || b.details || {};
    return {
      // Route info
      from: data.from || data.origin || data.departure || data.pickup_location || data.from_city || b.origin || '-',
      to: data.to || data.destination || data.arrival || data.dropoff_location || data.to_city || b.destination || '-',
      // Dates
      departureDate: data.departure_date || data.date || data.start_date || data.pickupDate || b.departure_date || b.start_date,
      returnDate: data.return_date || data.end_date || b.return_date || b.end_date,
      departureTime: data.departure_time || data.time || data.pickupTime || b.departure_time,
      // Passengers/Guests
      passengers: data.passengers || data.guests || data.pax || b.passengers || b.guests,
      // Aircraft/Vehicle
      aircraft: data.aircraft || data.aircraft_type || data.vehicle || data.car_type || b.aircraft_type,
      // Contact
      clientName: data.name || data.client_name || data.passenger_name || b.client_name,
      clientEmail: data.email || data.client_email || b.client_email,
      clientPhone: data.phone || data.client_phone || b.client_phone,
      // Special requests
      notes: data.notes || data.special_requests || data.requirements || b.notes || b.special_requests,
      // Pricing
      price: b.total_amount || b.total_price || data.price || data.total_price || data.amount
    };
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">{title} ({bookings.length})</h2>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><Package className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">No bookings found</p></div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, i) => {
            const isExpanded = expandedBooking === (b.id || i);
            const details = getBookingDetails(b);
            const ServiceIcon = getServiceIcon(b.service_type);

            return (
              <div key={b.id || i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header Row - Always visible */}
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedBooking(isExpanded ? null : (b.id || i))}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <ServiceIcon size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{formatServiceType(b.service_type)}</p>
                        {details.from !== '-' && details.to !== '-' && (
                          <span className="text-xs text-gray-500">
                            {details.from} → {details.to}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {b.users?.email || b.user_id?.slice(0, 8) || 'Unknown user'}
                        {details.departureDate && ` • ${new Date(details.departureDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Price */}
                    {details.price && (
                      <span className="text-sm font-semibold text-gray-900">
                        ${Number(details.price).toLocaleString()}
                      </span>
                    )}
                    {/* Payment Status */}
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPaymentStatusColor(b.payment_status)}`}>
                      {b.payment_status || 'pending'}
                    </span>
                    {/* Booking Status */}
                    <StatusBadge status={b.status || b.booking_status} />
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {/* Route */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 uppercase mb-1">Route</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{details.from}</span>
                          <ArrowRight size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{details.to}</span>
                        </div>
                      </div>
                      {/* Date */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Departure</p>
                        <p className="text-sm font-medium text-gray-900">
                          {details.departureDate ? new Date(details.departureDate).toLocaleDateString() : '-'}
                          {details.departureTime && ` at ${details.departureTime}`}
                        </p>
                      </div>
                      {/* Return Date */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Return</p>
                        <p className="text-sm font-medium text-gray-900">
                          {details.returnDate ? new Date(details.returnDate).toLocaleDateString() : 'One-way'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {/* Passengers */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Passengers</p>
                        <p className="text-sm font-medium text-gray-900">{details.passengers || '-'}</p>
                      </div>
                      {/* Aircraft/Vehicle */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Aircraft/Vehicle</p>
                        <p className="text-sm font-medium text-gray-900">{details.aircraft || '-'}</p>
                      </div>
                      {/* Client Name */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Client Name</p>
                        <p className="text-sm font-medium text-gray-900">{details.clientName || '-'}</p>
                      </div>
                      {/* Price */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Total Price</p>
                        <p className="text-sm font-bold text-green-600">
                          {details.price ? `$${Number(details.price).toLocaleString()}` : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {(details.clientEmail || details.clientPhone) && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {details.clientEmail && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{details.clientEmail}</span>
                          </div>
                        )}
                        {details.clientPhone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{details.clientPhone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Special Notes */}
                    {details.notes && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                        <p className="text-xs font-medium text-yellow-800 mb-1">SPECIAL REQUESTS / NOTES</p>
                        <p className="text-sm text-yellow-700">{details.notes}</p>
                      </div>
                    )}

                    {/* Payment Info */}
                    <div className="grid grid-cols-3 gap-4 p-3 bg-white rounded-lg border">
                      <div>
                        <p className="text-xs text-gray-500">Payment Status</p>
                        <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full font-medium ${getPaymentStatusColor(b.payment_status)}`}>
                          {b.payment_status || 'pending'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Booking Status</p>
                        <div className="mt-1"><StatusBadge status={b.status || b.booking_status} /></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Booked On</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {new Date(b.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Stripe/Coingate IDs if available */}
                    {(b.stripe_payment_intent_id || b.coingate_order_id) && (
                      <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-600">
                        {b.stripe_payment_intent_id && <p>Stripe: {b.stripe_payment_intent_id}</p>}
                        {b.coingate_order_id && <p>Coingate: {b.coingate_order_id}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ============================================
// REQUESTS SECTION - WITH FULL DETAILS & PDF
// ============================================
const RequestsSection = ({ requests, refreshing, onRefresh, supabaseAdmin }) => {
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const formatRequestType = (type) => {
    if (!type) return 'General Request';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get request type icon and color
  const getRequestTypeStyle = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('flight') || t.includes('jet')) return { icon: Plane, color: 'bg-blue-500' };
    if (t.includes('car') || t.includes('ground')) return { icon: Car, color: 'bg-green-500' };
    if (t.includes('yacht') || t.includes('boat')) return { icon: Ship, color: 'bg-cyan-500' };
    if (t.includes('helicopter') || t.includes('heli')) return { icon: Zap, color: 'bg-yellow-500' };
    if (t.includes('visa') || t.includes('document')) return { icon: FileText, color: 'bg-purple-500' };
    if (t.includes('support')) return { icon: Ticket, color: 'bg-red-500' };
    if (t.includes('payment') || t.includes('booking')) return { icon: CreditCard, color: 'bg-emerald-500' };
    return { icon: FileText, color: 'bg-gray-500' };
  };

  // Update request status
  const updateRequestStatus = async (requestId, newStatus) => {
    setUpdatingStatus(requestId);
    try {
      const { error } = await supabaseAdmin
        .from('user_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' }
  ];

  // Format label from camelCase or snake_case
  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  // Format value for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') {
      // Check if it's a date
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try { return new Date(value).toLocaleString(); } catch { return value; }
      }
      return value;
    }
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  // Render a single field
  const renderField = (label, value, icon = null, highlight = false) => (
    <div className={`p-3 rounded-lg border ${highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs mb-1 flex items-center gap-1 ${highlight ? 'text-emerald-600' : 'text-gray-500'}`}>
        {icon} {label}
      </p>
      <p className={`text-sm font-medium ${highlight ? 'text-emerald-700' : 'text-gray-900'}`}>{formatValue(value)}</p>
    </div>
  );

  // Render services/features as badges
  const renderServices = (services, title) => {
    if (!services || typeof services !== 'object') return null;
    const enabledServices = Object.entries(services).filter(([_, v]) => v === true);
    if (enabledServices.length === 0) return null;

    return (
      <div className="px-5 py-4 border-t border-gray-200">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">{title}</p>
        <div className="flex flex-wrap gap-2">
          {enabledServices.map(([key]) => (
            <span key={key} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {formatLabel(key)}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Render array of objects (directors, shareholders, etc.)
  const renderPeopleList = (people, title) => {
    if (!Array.isArray(people) || people.length === 0) return null;

    return (
      <div className="px-5 py-4 border-t border-gray-200">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">{title} ({people.length})</p>
        <div className="space-y-3">
          {people.map((person, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {person.fullName && (
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium text-gray-900">{person.fullName}</p>
                  </div>
                )}
                {person.email && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a href={`mailto:${person.email}`} className="text-sm font-medium text-blue-600 hover:underline">{person.email}</a>
                  </div>
                )}
                {person.phone && (
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{person.phone}</p>
                  </div>
                )}
                {person.nationality && (
                  <div>
                    <p className="text-xs text-gray-500">Nationality</p>
                    <p className="text-sm font-medium text-gray-900">{person.nationality}</p>
                  </div>
                )}
                {person.residency && (
                  <div>
                    <p className="text-xs text-gray-500">Residency</p>
                    <p className="text-sm font-medium text-gray-900">{person.residency}</p>
                  </div>
                )}
                {person.ownership && (
                  <div>
                    <p className="text-xs text-gray-500">Ownership</p>
                    <p className="text-sm font-medium text-gray-900">{person.ownership}%</p>
                  </div>
                )}
                {person.passportNumber && (
                  <div>
                    <p className="text-xs text-gray-500">Passport</p>
                    <p className="text-sm font-medium text-gray-900">{person.passportNumber}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Get summary info for header
  const getRequestSummary = (data) => {
    // SPV / Company Formation
    if (data.companyName) return { title: data.companyName, subtitle: data.jurisdiction };
    // Flight
    if (data.from && data.to) return { title: `${data.from} → ${data.to}`, subtitle: data.departure_date || data.date };
    if (data.origin && data.destination) return { title: `${data.origin} → ${data.destination}`, subtitle: data.departure_date };
    // General
    if (data.name) return { title: data.name, subtitle: data.email };
    return { title: null, subtitle: null };
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">All Requests ({requests.length})</h2>
          <p className="text-xs text-gray-500">User service requests - click to expand and update status</p>
        </div>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><FileText className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">No requests found</p></div>
      ) : (
        <div className="space-y-4">
          {requests.map((r, i) => {
            const isExpanded = expandedRequest === r.id;
            const requestData = r.data || {};
            const typeStyle = getRequestTypeStyle(r.type);
            const TypeIcon = typeStyle.icon;
            const summary = getRequestSummary(requestData);

            // Categorize fields
            const simpleFields = [];
            const arrayFields = [];
            const objectFields = [];

            Object.entries(requestData).forEach(([key, value]) => {
              if (value === null || value === undefined || value === '') return;
              if (Array.isArray(value)) {
                arrayFields.push({ key, value });
              } else if (typeof value === 'object') {
                objectFields.push({ key, value });
              } else {
                simpleFields.push({ key, value });
              }
            });

            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Request Header */}
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedRequest(isExpanded ? null : r.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${typeStyle.color} rounded-xl flex items-center justify-center shadow-sm`}>
                      <TypeIcon size={22} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">#{r.id?.slice(0, 8).toUpperCase()}</p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-sm font-medium text-gray-700">{formatRequestType(r.type)}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.users?.email || requestData.contactEmail || requestData.email || 'Unknown'} • {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {summary.title && (
                      <div className="text-right hidden md:block max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{summary.title}</p>
                        {summary.subtitle && <p className="text-xs text-gray-500 truncate">{summary.subtitle}</p>}
                      </div>
                    )}
                    <StatusBadge status={r.status} />
                    {r.confirmation_pdf_url && (
                      <a href={r.confirmation_pdf_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">
                        <FileText size={12} /> PDF
                      </a>
                    )}
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-100">
                    {/* Status Change Bar */}
                    <div className="px-5 py-3 bg-white border-b flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">Change Status:</span>
                        {statusOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateRequestStatus(r.id, opt.value)}
                            disabled={updatingStatus === r.id || r.status === opt.value}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              r.status === opt.value
                                ? `${opt.color} ring-2 ring-offset-1 ring-gray-400`
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } ${updatingStatus === r.id ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            {updatingStatus === r.id && r.status !== opt.value ? '...' : opt.label}
                          </button>
                        ))}
                      </div>
                      {updatingStatus === r.id && <Loader2 size={16} className="animate-spin text-blue-600" />}
                    </div>

                    {/* Simple Fields Grid */}
                    {simpleFields.length > 0 && (
                      <div className="px-5 py-4">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Request Details</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {simpleFields.map(({ key, value }) => (
                            <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">{formatLabel(key)}</p>
                              <p className="text-sm font-medium text-gray-900 break-words">{formatValue(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Object Fields (services, jurisdictionDetails, etc.) */}
                    {objectFields.map(({ key, value }) => {
                      // Check if it's a services-like object (boolean values)
                      const isBooleanObject = Object.values(value).every(v => typeof v === 'boolean');
                      if (isBooleanObject) {
                        return renderServices(value, formatLabel(key));
                      }

                      // Regular object - show as grid
                      return (
                        <div key={key} className="px-5 py-4 border-t border-gray-200">
                          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">{formatLabel(key)}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(value).map(([k, v]) => (
                              <div key={k} className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">{formatLabel(k)}</p>
                                <p className="text-sm font-medium text-gray-900 break-words">{formatValue(v)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Array Fields (directors, shareholders, etc.) */}
                    {arrayFields.map(({ key, value }) => {
                      // Check if array of objects (people)
                      if (value.length > 0 && typeof value[0] === 'object') {
                        return renderPeopleList(value, formatLabel(key));
                      }
                      // Simple array
                      return (
                        <div key={key} className="px-5 py-4 border-t border-gray-200">
                          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">{formatLabel(key)}</p>
                          <div className="flex flex-wrap gap-2">
                            {value.map((item, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                {formatValue(item)}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Admin Notes */}
                    {r.admin_notes && (
                      <div className="px-5 py-4 border-t border-gray-200">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Admin Response</p>
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm text-blue-900">{r.admin_notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Raw JSON (collapsed) */}
                    <div className="px-5 py-4 border-t border-gray-200">
                      <details className="bg-white rounded-lg border border-gray-200">
                        <summary className="px-4 py-2 text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-50">View Raw Request Data (JSON)</summary>
                        <pre className="px-4 py-3 text-xs text-gray-700 overflow-auto max-h-48 bg-gray-50">{JSON.stringify(requestData, null, 2)}</pre>
                      </details>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-5 py-4 bg-white border-t flex items-center gap-3">
                      <a
                        href={`mailto:${r.users?.email || requestData.contactEmail || requestData.email}?subject=Re: Your ${formatRequestType(r.type)} Request #${r.id?.slice(0, 8).toUpperCase()}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        <Mail size={16} /> Reply via Email
                      </a>
                      {r.confirmation_pdf_url && (
                        <a href={r.confirmation_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                          <FileText size={16} /> Download PDF
                        </a>
                      )}
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                        <CreditCard size={16} /> Create Invoice
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ============================================
// EMPTY LEGS SECTION - COINGATE PAYMENTS
// ============================================
const EmptyLegsSection = ({ bookings, refreshing, onRefresh }) => {
  const [expandedBooking, setExpandedBooking] = useState(null);

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700',
      refunded: 'bg-purple-100 text-purple-700'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Empty Leg Bookings ({bookings.length})</h2>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><Tag className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">No empty leg bookings found</p></div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, i) => {
            const isExpanded = expandedBooking === b.id;
            const bookingData = b.details || b.booking_data || {};

            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Tag size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {bookingData.departure_city || bookingData.from || 'N/A'} → {bookingData.arrival_city || bookingData.to || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">{b.users?.email || b.user_id?.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPaymentStatusColor(b.payment_status)}`}>
                      {b.payment_status || 'pending'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">${Number(b.total_price || bookingData.price || 0).toLocaleString()}</span>
                    <span className="text-xs text-gray-500">{new Date(b.created_at).toLocaleDateString()}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Departure</p>
                        <p className="text-sm font-medium text-gray-900">{bookingData.departure_city || bookingData.from || 'N/A'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Arrival</p>
                        <p className="text-sm font-medium text-gray-900">{bookingData.arrival_city || bookingData.to || 'N/A'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="text-sm font-medium text-gray-900">{bookingData.departure_date || bookingData.date || 'N/A'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Aircraft</p>
                        <p className="text-sm font-medium text-gray-900">{bookingData.aircraft_type || bookingData.aircraft || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white p-4 rounded-lg border-2 border-amber-200 mb-4">
                      <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-2">
                        <CreditCard size={14} /> COINGATE PAYMENT INFO
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Payment Status</p>
                          <p className={`text-sm font-medium ${b.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {b.payment_status?.toUpperCase() || 'PENDING'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Coingate Order ID</p>
                          <p className="text-sm font-mono text-gray-900">{b.coingate_order_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Price</p>
                          <p className="text-sm font-medium text-gray-900">${Number(b.total_price || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Raw Data */}
                    <details className="bg-white rounded-lg border border-gray-200">
                      <summary className="px-4 py-2 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50">View Full Booking Data (JSON)</summary>
                      <pre className="px-4 py-3 text-xs text-gray-700 overflow-auto max-h-48 bg-gray-50">{JSON.stringify(b, null, 2)}</pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ============================================
// CHAT REQUESTS SECTION - WOOCOMMERCE-STYLE CART VIEW
// ============================================
const ChatRequestsSection = ({ requests, refreshing, onRefresh }) => {
  const [expandedRequest, setExpandedRequest] = useState(null);

  // Get service icon based on type
  const getServiceIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('jet') || t.includes('flight') || t.includes('private')) return Plane;
    if (t.includes('helicopter') || t.includes('heli')) return Zap;
    if (t.includes('car') || t.includes('ground') || t.includes('transfer') || t.includes('chauffeur')) return Car;
    if (t.includes('yacht') || t.includes('boat')) return Ship;
    if (t.includes('hotel') || t.includes('accommodation')) return Building2;
    if (t.includes('concierge') || t.includes('delicac') || t.includes('catering') || t.includes('food')) return Sparkles;
    return Package;
  };

  // Get service color based on type
  const getServiceColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('jet') || t.includes('flight')) return 'bg-blue-500';
    if (t.includes('helicopter')) return 'bg-yellow-500';
    if (t.includes('car') || t.includes('ground')) return 'bg-green-500';
    if (t.includes('yacht')) return 'bg-cyan-500';
    if (t.includes('hotel')) return 'bg-purple-500';
    if (t.includes('concierge') || t.includes('delicac')) return 'bg-pink-500';
    return 'bg-gray-500';
  };

  // Parse cart items from various formats
  const parseCartItems = (r) => {
    let items = [];

    // Check cart_items field
    if (r.cart_items) {
      if (Array.isArray(r.cart_items)) {
        items = r.cart_items;
      } else if (typeof r.cart_items === 'object') {
        items = Object.values(r.cart_items);
      }
    }

    // Check results_summary for items
    if (r.results_summary) {
      if (Array.isArray(r.results_summary)) {
        items = [...items, ...r.results_summary];
      } else if (r.results_summary.items) {
        items = [...items, ...r.results_summary.items];
      } else if (typeof r.results_summary === 'object') {
        // Try to extract items from results_summary object
        Object.entries(r.results_summary).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            items = [...items, ...value.map(v => ({ ...v, category: key }))];
          } else if (typeof value === 'object' && value !== null) {
            items.push({ ...value, category: key });
          }
        });
      }
    }

    return items;
  };

  // Format item display
  const formatItemName = (item) => {
    if (item.name) return item.name;
    if (item.title) return item.title;
    if (item.aircraft_type) return item.aircraft_type;
    if (item.from && item.to) return `${item.from} → ${item.to}`;
    if (item.type) return item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return 'Service Item';
  };

  const formatItemDetails = (item) => {
    const details = [];
    if (item.from && item.to) details.push(`${item.from} → ${item.to}`);
    if (item.departure_date || item.date) details.push(new Date(item.departure_date || item.date).toLocaleDateString());
    if (item.passengers || item.pax) details.push(`${item.passengers || item.pax} pax`);
    if (item.aircraft_type || item.vehicle) details.push(item.aircraft_type || item.vehicle);
    return details.join(' • ');
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">AI Cart Requests ({requests.length})</h2>
          <p className="text-xs text-gray-500">All user shopping cart submissions from AI Chat</p>
        </div>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><Package className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">No AI cart requests found</p></div>
      ) : (
        <div className="space-y-4">
          {requests.map((r, i) => {
            const isExpanded = expandedRequest === r.id;
            const cartItems = parseCartItems(r);
            const cartTotal = r.cart_total || r.budget || 0;
            const ServiceIcon = getServiceIcon(r.service_type);

            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Order Header - Like WooCommerce Order */}
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                  onClick={() => setExpandedRequest(isExpanded ? null : r.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${getServiceColor(r.service_type)} rounded-xl flex items-center justify-center shadow-sm`}>
                      <ServiceIcon size={22} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">Order #{r.id?.slice(0, 8).toUpperCase()}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-gray-500">
                        {r.users?.email || 'Unknown user'} • {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Cart Summary */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {cartTotal ? `$${Number(cartTotal).toLocaleString()}` : 'Quote Request'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cartItems.length > 0 ? `${cartItems.length} item${cartItems.length > 1 ? 's' : ''}` : r.service_type?.replace(/_/g, ' ') || 'Request'}
                      </p>
                    </div>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Order Details */}
                {isExpanded && (
                  <div className="bg-gray-50">
                    {/* Customer Info Bar */}
                    <div className="px-5 py-3 bg-white border-b flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{r.users?.email || 'No email'}</span>
                        </div>
                        {r.passengers && (
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{r.passengers} passengers</span>
                          </div>
                        )}
                        {r.pets > 0 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{r.pets} pet(s)</span>
                        )}
                      </div>
                      {r.confidence_score && (
                        <span className="text-xs text-gray-500">AI Confidence: {r.confidence_score}%</span>
                      )}
                    </div>

                    {/* User's Original Request */}
                    <div className="px-5 py-4 border-b border-gray-200">
                      <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-2">Customer Request</p>
                      <div className="bg-white p-4 rounded-lg border-l-4 border-violet-500">
                        <p className="text-sm text-gray-800">{r.query || 'No query recorded'}</p>
                      </div>
                    </div>

                    {/* Cart Items - WooCommerce Style */}
                    <div className="px-5 py-4">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Cart Items</p>

                      {cartItems.length > 0 ? (
                        <div className="bg-white rounded-lg border overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">SERVICE</th>
                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">DETAILS</th>
                                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">PRICE</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {cartItems.map((item, idx) => {
                                const ItemIcon = getServiceIcon(item.type || item.category || item.service_type);
                                return (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 ${getServiceColor(item.type || item.category)} rounded-lg flex items-center justify-center`}>
                                          <ItemIcon size={14} className="text-white" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{formatItemName(item)}</p>
                                          <p className="text-xs text-gray-500">{item.category || item.type || 'Service'}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="text-sm text-gray-600">{formatItemDetails(item)}</p>
                                      {item.special_requests && (
                                        <p className="text-xs text-amber-600 mt-1">Note: {item.special_requests}</p>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.price || item.total_price ? `$${Number(item.price || item.total_price).toLocaleString()}` : 'Quote'}
                                      </p>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        // Fallback: Show request details as cart item
                        <div className="bg-white rounded-lg border overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">SERVICE</th>
                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">DETAILS</th>
                                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">PRICE</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 ${getServiceColor(r.service_type)} rounded-lg flex items-center justify-center`}>
                                      <ServiceIcon size={14} className="text-white" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {r.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Travel Request'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    {r.from_location && r.to_location && (
                                      <p className="text-sm text-gray-600">{r.from_location} → {r.to_location}</p>
                                    )}
                                    {r.date_start && (
                                      <p className="text-xs text-gray-500">{new Date(r.date_start).toLocaleDateString()}{r.date_end ? ` - ${new Date(r.date_end).toLocaleDateString()}` : ''}</p>
                                    )}
                                    {r.passengers && <p className="text-xs text-gray-500">{r.passengers} passengers</p>}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {r.budget ? `$${Number(r.budget).toLocaleString()}` : 'Quote Requested'}
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Cart Total */}
                      <div className="mt-3 bg-white rounded-lg border p-4 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Order Total</span>
                        <span className="text-xl font-bold text-gray-900">
                          {cartTotal ? `$${Number(cartTotal).toLocaleString()}` : 'Quote Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Special Requirements */}
                    {r.special_requirements && (
                      <div className="px-5 py-4 border-t border-gray-200">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">Special Requirements</p>
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">{r.special_requirements}</p>
                        </div>
                      </div>
                    )}

                    {/* Conversation History */}
                    {r.conversation_history && (
                      <div className="px-5 py-4 border-t border-gray-200">
                        <details className="bg-white rounded-lg border">
                          <summary className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-50">
                            View Full Conversation ({Array.isArray(r.conversation_history) ? r.conversation_history.length : '?'} messages)
                          </summary>
                          <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto border-t">
                            {Array.isArray(r.conversation_history) ? r.conversation_history.map((msg, idx) => (
                              <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                                <span className={`text-xs font-bold ${msg.role === 'user' ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {msg.role === 'user' ? 'Customer' : 'AI Assistant'}
                                </span>
                                <p className="text-sm mt-1">{msg.content || msg.text || JSON.stringify(msg)}</p>
                              </div>
                            )) : <pre className="text-xs overflow-x-auto">{JSON.stringify(r.conversation_history, null, 2)}</pre>}
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="px-5 py-4 bg-white border-t flex items-center gap-3">
                      <a
                        href={`mailto:${r.users?.email}?subject=Re: Your Travel Request #${r.id?.slice(0, 8).toUpperCase()}&body=Dear Customer,%0D%0A%0D%0AThank you for your inquiry regarding:%0D%0A${encodeURIComponent(r.query || '')}%0D%0A%0D%0A`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        <Mail size={16} /> Reply via Email
                      </a>
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                        <CreditCard size={16} /> Create Invoice
                      </button>
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                        <FileText size={16} /> Generate PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ============================================
// CHAT MESSAGES SECTION - USER MESSAGES
// ============================================
const ChatMessagesSection = ({ messages, refreshing, onRefresh }) => {
  const [groupByUser, setGroupByUser] = useState(true);

  // Group messages by user
  const groupedMessages = messages.reduce((acc, msg) => {
    const email = msg.users?.email || msg.user_id || 'Unknown';
    if (!acc[email]) {
      acc[email] = { email, user: msg.users, messages: [] };
    }
    acc[email].messages.push(msg);
    return acc;
  }, {});

  const userGroups = Object.values(groupedMessages);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">User Chat Messages ({messages.length})</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGroupByUser(!groupByUser)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${groupByUser ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {groupByUser ? 'Grouped by User' : 'Chronological'}
          </button>
          <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><MessageSquare className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">No chat messages found</p></div>
      ) : groupByUser ? (
        // Grouped by user view
        <div className="space-y-4">
          {userGroups.map((group, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{group.email}</p>
                    <p className="text-xs text-gray-500">{group.messages.length} messages</p>
                  </div>
                </div>
                <a
                  href={`mailto:${group.email}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                >
                  <Mail size={12} /> Reply
                </a>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {group.messages.map((msg, j) => (
                  <div key={j} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</span>
                      {msg.type && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{msg.type}</span>}
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-blue-50 p-3 rounded-lg">{msg.content || msg.message || 'No content'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Chronological view
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {messages.map((msg, i) => (
              <div key={i} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{msg.users?.email || msg.user_id?.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <a
                    href={`mailto:${msg.users?.email}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                  >
                    <Mail size={12} /> Reply
                  </a>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg ml-11">{msg.content || msg.message || 'No content'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ============================================
// AI CHATS SECTION - WITH FULL CONVERSATIONS
// ============================================
const AiChatsSection = ({ chats, refreshing, onRefresh }) => {
  const [expandedChat, setExpandedChat] = useState(null);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">AI Conversations ({chats.length})</h2>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><Sparkles className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">No AI conversations found</p></div>
      ) : (
        <div className="space-y-3">
          {chats.map((c, i) => {
            const isExpanded = expandedChat === c.id;
            const messages = c.messages || [];
            const messageCount = Array.isArray(messages) ? messages.length : 0;

            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedChat(isExpanded ? null : c.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Sparkles size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.title || 'AI Conversation'}</p>
                      <p className="text-xs text-gray-500">{c.users?.email || c.user_id?.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full font-medium">
                      {messageCount} messages
                    </span>
                    <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MessageSquare size={14} /> FULL CONVERSATION
                    </p>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {Array.isArray(messages) && messages.length > 0 ? messages.map((msg, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold ${msg.role === 'user' ? 'text-blue-700' : 'text-gray-700'}`}>
                              {msg.role === 'user' ? 'USER' : 'AI ASSISTANT'}
                            </span>
                            {msg.timestamp && <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</span>}
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content || msg.text || msg.message || JSON.stringify(msg)}</p>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500 italic">No messages in this conversation</p>
                      )}
                    </div>

                    {/* Reply Button */}
                    <div className="mt-4">
                      <a
                        href={`mailto:${c.users?.email}?subject=Re: Your AI Chat Inquiry`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        <Mail size={16} /> Reply via Email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ============================================
// SUPPORT SECTION - WITH FULL MESSAGE CONTENT
// ============================================
const SupportSection = ({ tickets, refreshing, onRefresh }) => {
  const [expandedTicket, setExpandedTicket] = useState(null);

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      normal: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return colors[priority?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Support Tickets ({tickets.length})</h2>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><Ticket className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">No support tickets found</p></div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t, i) => {
            const isExpanded = expandedTicket === t.id;

            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedTicket(isExpanded ? null : t.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Ticket size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.subject || 'No Subject'}</p>
                      <p className="text-xs text-gray-500">{t.users?.email || t.user_id?.slice(0, 8)} - {t.type || 'general'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={t.status} />
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(t.priority)}`}>
                      {t.priority || 'normal'}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                    {/* User Info */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">User Email</p>
                        <p className="text-sm font-medium text-gray-900">{t.users?.email || 'Unknown'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Ticket Type</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{t.type || 'General'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Created</p>
                        <p className="text-sm font-medium text-gray-900">{new Date(t.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* FULL USER MESSAGE - THIS IS WHAT THEY WROTE */}
                    <div className="bg-white p-4 rounded-lg border-2 border-orange-200 mb-4">
                      <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-2">
                        <MessageSquare size={14} /> USER'S SUPPORT REQUEST MESSAGE
                      </p>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap bg-orange-50 p-3 rounded-lg">
                        {t.description || 'No description provided'}
                      </div>
                    </div>

                    {/* Reply Button */}
                    <div className="flex items-center gap-3">
                      <a
                        href={`mailto:${t.users?.email}?subject=Re: ${t.subject || 'Support Request'}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        <Mail size={16} /> Reply via Email
                      </a>
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                        <Copy size={16} /> Copy Email
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ============================================
// TRANSACTIONS SECTION
// ============================================
const TransactionsSection = ({ transactions, refreshing, onRefresh }) => (
  <>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-medium text-gray-900">All Transactions ({transactions.length})</h2>
      <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
        <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>

    {refreshing ? (
      <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
    ) : transactions.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><CreditCard className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">No transactions found</p></div>
    ) : (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{t.users?.email || t.user_id?.slice(0, 8)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.type || '-'}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.amount ? `$${Number(t.amount).toLocaleString()}` : '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </>
);

// ============================================
// EMPTY LEGS TABLE SECTION (EmptyLegs_ Inventory) - MATCHING WEBAPP CARD STYLE
// ============================================
const EmptyLegsTableSection = ({ emptyLegs, refreshing, onRefresh }) => {
  const [selectedLeg, setSelectedLeg] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const getDefaultImage = () => 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&auto=format&fit=crop&q=60';

  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return timeStr ? `${dateFormatted} ${timeStr}` : dateFormatted;
  };

  const isNFTFreeEligible = (leg) => (leg.price || 0) < 1900;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">EmptyLegs Inventory ({emptyLegs.length})</h2>
          <p className="text-xs text-gray-500 mt-1">All empty leg flights from the EmptyLegs_ table</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}>
              <LayoutGrid size={16} className="text-gray-600" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}>
              <List size={16} className="text-gray-600" />
            </button>
          </div>
          <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : emptyLegs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
          <Globe className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No empty legs found in EmptyLegs_ table</p>
        </div>
      ) : viewMode === 'grid' ? (
        // GRID VIEW - Matching webapp card style
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {emptyLegs.map((leg, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                isNFTFreeEligible(leg)
                  ? 'border-2 border-green-400 hover:border-green-500'
                  : leg.booked_by_user_id
                  ? 'border-2 border-blue-400'
                  : 'border border-gray-100 hover:border-gray-200'
              }`}
              onClick={() => setSelectedLeg(selectedLeg?.id === leg.id ? null : leg)}
            >
              {/* Image */}
              <div className="relative h-36 overflow-hidden">
                <img
                  src={leg.image_url || getDefaultImage()}
                  alt={`${leg.from_iata || leg.from} to ${leg.to_iata || leg.to}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = getDefaultImage(); }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* NFT Free Badge */}
                {isNFTFreeEligible(leg) && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Star size={10} className="fill-current" />
                    FREE with NFT
                  </div>
                )}

                {/* Booked Badge */}
                {leg.booked_by_user_id && (
                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-lg">
                    BOOKED
                  </div>
                )}

                {/* Time Badge */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full">
                  {formatDateTime(leg.departure_date, leg.departure_time)}
                </div>
              </div>

              <div className="p-4">
                {/* Route */}
                <div className="mb-3">
                  <h3 className="text-base font-semibold mb-1.5 text-gray-900">
                    {leg.from_city || leg.from} → {leg.to_city || leg.to}
                  </h3>
                  {/* IATA codes */}
                  <div className="flex items-center justify-center gap-2 bg-blue-50 rounded-lg p-1.5 mb-2">
                    <span className="text-xs font-bold text-blue-900">{leg.from_iata || leg.from}</span>
                    <ArrowRight size={12} className="text-blue-600" />
                    <span className="text-xs font-bold text-blue-900">{leg.to_iata || leg.to}</span>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  <div className="bg-gray-100 rounded-lg p-2 text-center">
                    <Plane size={14} className="mx-auto mb-0.5 text-gray-500" />
                    <div className="text-[10px] text-gray-700 font-medium truncate">{leg.aircraft_type || 'Private Jet'}</div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-2 text-center">
                    <Users size={14} className="mx-auto mb-0.5 text-gray-500" />
                    <div className="text-[10px] text-gray-700 font-medium">Up to {leg.capacity || '?'}</div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-2 text-center">
                    <Leaf size={14} className="mx-auto mb-0.5 text-gray-500" />
                    <div className="text-[10px] text-gray-700 font-medium">Carbon Neutral</div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-2 text-center">
                    <Percent size={14} className="mx-auto mb-0.5 text-gray-500" />
                    <div className="text-[10px] text-gray-700 font-medium">Save 75%</div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 line-through">
                      Regular: ${((leg.price * 3) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-base font-bold ${isNFTFreeEligible(leg) ? 'text-green-600' : 'text-gray-900'}`}>
                      {isNFTFreeEligible(leg) ? 'FREE for NFT holders' : `€${(leg.price || 0).toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* See Details Button */}
                <button
                  className="w-full bg-black text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLeg(selectedLeg?.id === leg.id ? null : leg);
                  }}
                >
                  {selectedLeg?.id === leg.id ? 'Hide Details' : 'See Details'}
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Expanded Details */}
              {selectedLeg?.id === leg.id && (
                <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3 py-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Operator</p>
                      <p className="text-xs font-medium text-gray-900">{leg.operator || 'Private Operator'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Category</p>
                      <p className="text-xs font-medium text-gray-900">{leg.category || 'Private Jet'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Registration</p>
                      <p className="text-xs font-medium text-gray-900">{leg.registration || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Arrival Time</p>
                      <p className="text-xs font-medium text-gray-900">{leg.arrival_time || 'TBD'}</p>
                    </div>
                  </div>

                  {leg.booked_by_user_id && (
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                      <p className="text-[10px] font-medium text-blue-800">BOOKED BY USER</p>
                      <p className="text-xs text-blue-700 truncate">{leg.booked_by_user_id}</p>
                      {leg.booked_at && <p className="text-[10px] text-blue-600">Booked: {new Date(leg.booked_at).toLocaleString()}</p>}
                    </div>
                  )}

                  <details className="mt-2">
                    <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">Raw data</summary>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-[9px] overflow-x-auto max-h-32">
                      {JSON.stringify(leg, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // LIST VIEW
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aircraft</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Departure</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Capacity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {emptyLegs.map((leg, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={leg.image_url || getDefaultImage()} alt="" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { e.target.src = getDefaultImage(); }} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{leg.from_city || leg.from} → {leg.to_city || leg.to}</p>
                        <p className="text-xs text-gray-500">{leg.from_iata} → {leg.to_iata}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{leg.aircraft_type || 'Private Jet'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(leg.departure_date, leg.departure_time)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">€{(leg.price || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{leg.capacity || '?'} pax</td>
                  <td className="px-4 py-3">
                    {leg.booked_by_user_id ? (
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-700">BOOKED</span>
                    ) : isNFTFreeEligible(leg) ? (
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">NFT FREE</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700">AVAILABLE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// ============================================
// REUSABLE COMPONENTS
// ============================================

const StatCard = ({ label, value, change, icon: Icon }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{(value || 0).toLocaleString()}</p>
      </div>
      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
        <Icon size={18} className="text-gray-600" />
      </div>
    </div>
    <div className="flex items-center gap-1">
      {change >= 0 ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
      <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(change)}%</span>
      <span className="text-xs text-gray-400">vs last month</span>
    </div>
  </div>
);

const CustomerCard = ({ customer, getUserName, getUserRole, isRepeatCustomer, copyToClipboard, onViewDetails }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        {customer.profile?.avatar_url ? (
          <img src={customer.profile.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-medium">
            {getUserName(customer)[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">{getUserName(customer)}</p>
          <p className="text-xs text-gray-500">{getUserRole(customer)}</p>
        </div>
      </div>
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${isRepeatCustomer(customer) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
        {isRepeatCustomer(customer) ? 'Repeat' : 'New'}
      </span>
    </div>

    {/* Contact Info */}
    <div className="space-y-1 mb-3 text-xs">
      <div className="flex items-center gap-2 text-gray-600">
        <Mail size={12} className="text-gray-400" />
        <span className="truncate">{customer.email}</span>
      </div>
      {customer.profile?.phone && (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone size={12} className="text-gray-400" />
          <span>{customer.profile.phone}</span>
        </div>
      )}
      {(customer.profile?.country || customer.profile?.city) && (
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin size={12} className="text-gray-400" />
          <span>{[customer.profile.city, customer.profile.country].filter(Boolean).join(', ') || 'Not provided'}</span>
        </div>
      )}
      <div className="flex items-center gap-2 text-gray-600">
        <Calendar size={12} className="text-gray-400" />
        <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
      <div className="p-2 bg-gray-50 rounded-lg">
        <p className="text-lg font-semibold text-gray-900">{customer.bookings?.length || 0}</p>
        <p className="text-[10px] text-gray-500">Bookings</p>
      </div>
      <div className="p-2 bg-gray-50 rounded-lg">
        <p className="text-lg font-semibold text-gray-900">{customer.requests?.length || 0}</p>
        <p className="text-[10px] text-gray-500">Requests</p>
      </div>
      <div className="p-2 bg-gray-50 rounded-lg">
        <p className="text-lg font-semibold text-gray-900">{customer.aiChats?.length || 0}</p>
        <p className="text-[10px] text-gray-500">AI Chats</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={onViewDetails} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">View Details</button>
      <button onClick={() => copyToClipboard(customer.email)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50" title="Copy Email"><Copy size={16} className="text-gray-400" /></button>
    </div>
  </div>
);

const CustomerTable = ({ customers, getUserName, getUserRole, isRepeatCustomer, onViewDetails }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Country</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Bookings</th>
          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Requests</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {customers.map((c) => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                {c.profile?.avatar_url ? (
                  <img src={c.profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">{getUserName(c)[0]?.toUpperCase()}</div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{getUserName(c)}</p>
                  <p className="text-xs text-gray-500">{getUserRole(c)}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{c.profile?.phone || 'Not provided'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{c.profile?.country || 'Not provided'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{new Date(c.created_at).toLocaleDateString()}</td>
            <td className="px-4 py-3 text-center"><span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">{c.bookings?.length || 0}</span></td>
            <td className="px-4 py-3 text-center"><span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">{c.requests?.length || 0}</span></td>
            <td className="px-4 py-3 text-right"><button onClick={() => onViewDetails(c)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">View</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center justify-between mt-6">
    <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
    <div className="flex items-center gap-2">
      <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"><ChevronLeft size={16} /></button>
      {[...Array(Math.min(5, totalPages))].map((_, i) => (
        <button key={i + 1} onClick={() => onPageChange(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === i + 1 ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{i + 1}</button>
      ))}
      <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"><ChevronRight size={16} /></button>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    completed: 'bg-green-100 text-green-700', approved: 'bg-green-100 text-green-700', active: 'bg-green-100 text-green-700', success: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700', rejected: 'bg-red-100 text-red-700', failed: 'bg-red-100 text-red-700'
  };
  return <span className={`px-2 py-1 text-xs rounded-full ${colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>{status || 'Unknown'}</span>;
};

// ============================================
// USER DETAILS MODAL
// ============================================
const UserDetailsModal = ({ user, onClose, getUserName }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ bookings: [], requests: [], aiChats: [], supportTickets: [], transactions: [], subscriptions: [], kycApps: [] });

  useEffect(() => {
    const fetchAllUserData = async () => {
      setLoading(true);
      try {
        const [{ data: bookings }, { data: requests }, { data: aiChats }, { data: supportTickets }, { data: transactions }, { data: subscriptions }, { data: kycApps }] = await Promise.all([
          supabaseAdmin.from('user_bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabaseAdmin.from('user_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabaseAdmin.from('ai_chat_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabaseAdmin.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabaseAdmin.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabaseAdmin.from('user_subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabaseAdmin.from('kyc_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);
        setData({ bookings: bookings || [], requests: requests || [], aiChats: aiChats || [], supportTickets: supportTickets || [], transactions: transactions || [], subscriptions: subscriptions || [], kycApps: kycApps || [] });
      } catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    };
    fetchAllUserData();
  }, [user.id]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'bookings', label: 'Bookings', count: data.bookings.length, icon: Calendar },
    { id: 'requests', label: 'Requests', count: data.requests.length, icon: FileText },
    { id: 'ai-chats', label: 'AI Chats', count: data.aiChats.length, icon: MessageSquare },
    { id: 'support', label: 'Support', count: data.supportTickets.length, icon: Ticket },
    { id: 'transactions', label: 'Transactions', count: data.transactions.length, icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-semibold">{getUserName(user)[0]?.toUpperCase()}</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{getUserName(user)}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {user.is_admin && <span className="px-2 py-0.5 bg-black text-white text-xs rounded-full">Admin</span>}
                  {data.kycApps[0]?.status === 'approved' && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1"><ShieldCheck size={12} /> Verified</span>}
                  {data.subscriptions[0] && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{data.subscriptions[0].plan_type}</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
          </div>
          <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <tab.icon size={14} />
                {tab.label}
                {tab.count !== undefined && <span className={`px-1.5 py-0.5 text-xs rounded ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <QuickStat icon={Calendar} label="Total Bookings" value={data.bookings.length} color="blue" />
                    <QuickStat icon={FileText} label="Requests" value={data.requests.length} color="purple" />
                    <QuickStat icon={MessageSquare} label="AI Chats" value={data.aiChats.length} color="green" />
                    <QuickStat icon={CreditCard} label="Transactions" value={data.transactions.length} color="orange" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-medium text-gray-900 mb-4">User Information</h3>
                      <div className="space-y-3">
                        <InfoRow icon={Mail} label="Email" value={user.email} />
                        <InfoRow icon={Phone} label="Phone" value={user.phone || 'Not provided'} />
                        <InfoRow icon={MapPin} label="Country" value={user.country || 'Not provided'} />
                        <InfoRow icon={Calendar} label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-medium text-gray-900 mb-4">Service Breakdown</h3>
                      <div className="space-y-3">
                        <ServiceRow icon={Plane} label="Private Jets" value={data.bookings.filter(b => ['private_jet', 'jet', 'empty_leg'].includes(b.service_type)).length} />
                        <ServiceRow icon={Car} label="Luxury Cars" value={data.bookings.filter(b => ['luxury_car', 'car', 'ground_transport'].includes(b.service_type)).length} />
                        <ServiceRow icon={Ship} label="Yachts" value={data.bookings.filter(b => b.service_type === 'yacht').length} />
                        <ServiceRow icon={Zap} label="Helicopters" value={data.bookings.filter(b => b.service_type === 'helicopter').length} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'bookings' && <ModalTable data={data.bookings} columns={[{ key: 'service_type', label: 'Service' }, { key: 'status', label: 'Status', format: (v) => <StatusBadge status={v} /> }, { key: 'total_amount', label: 'Amount', format: (v) => v ? `$${Number(v).toLocaleString()}` : '-' }, { key: 'created_at', label: 'Date', format: (v) => new Date(v).toLocaleDateString() }]} emptyMessage="No bookings" />}
              {activeTab === 'requests' && <ModalTable data={data.requests} columns={[{ key: 'type', label: 'Type' }, { key: 'status', label: 'Status', format: (v) => <StatusBadge status={v} /> }, { key: 'created_at', label: 'Date', format: (v) => new Date(v).toLocaleDateString() }]} emptyMessage="No requests" />}
              {activeTab === 'ai-chats' && <ModalTable data={data.aiChats} columns={[{ key: 'id', label: 'Session', format: (v) => v?.slice(0, 8) + '...' }, { key: 'message_count', label: 'Messages' }, { key: 'created_at', label: 'Date', format: (v) => new Date(v).toLocaleDateString() }]} emptyMessage="No AI chats" />}
              {activeTab === 'support' && <ModalTable data={data.supportTickets} columns={[{ key: 'subject', label: 'Subject' }, { key: 'status', label: 'Status', format: (v) => <StatusBadge status={v} /> }, { key: 'created_at', label: 'Date', format: (v) => new Date(v).toLocaleDateString() }]} emptyMessage="No tickets" />}
              {activeTab === 'transactions' && <ModalTable data={data.transactions} columns={[{ key: 'type', label: 'Type' }, { key: 'amount', label: 'Amount', format: (v) => v ? `$${Number(v).toLocaleString()}` : '-' }, { key: 'status', label: 'Status', format: (v) => <StatusBadge status={v} /> }, { key: 'created_at', label: 'Date', format: (v) => new Date(v).toLocaleDateString() }]} emptyMessage="No transactions" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickStat = ({ icon: Icon, label, value, color }) => {
  const colors = { blue: 'bg-blue-100 text-blue-700', purple: 'bg-purple-100 text-purple-700', green: 'bg-green-100 text-green-700', orange: 'bg-orange-100 text-orange-700' };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`w-10 h-10 ${colors[color]} rounded-lg flex items-center justify-center mb-3`}><Icon size={18} /></div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"><Icon size={14} className="text-gray-400" /></div>
    <div><p className="text-xs text-gray-500">{label}</p><p className="text-sm text-gray-900">{value}</p></div>
  </div>
);

const ServiceRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2"><Icon size={14} className="text-gray-400" /><span className="text-sm text-gray-700">{label}</span></div>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
);

const ModalTable = ({ data, columns, emptyMessage }) => {
  if (data.length === 0) return <div className="text-center py-12 text-gray-500">{emptyMessage}</div>;
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>{columns.map((col) => <th key={col.key} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{col.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((col) => <td key={col.key} className="px-4 py-3 text-sm text-gray-600">{col.format ? col.format(row[col.key], row) : row[col.key] || '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CRMDashboard;
