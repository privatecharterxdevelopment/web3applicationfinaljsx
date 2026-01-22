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
  ArrowRight, Star, Leaf, Percent, Wine, Cigarette,
  Coins, ShoppingCart, FileCheck, Crown, RotateCcw, Bell, UserCheck2, User
} from 'lucide-react';
import QuoteInvoiceModal from './QuoteInvoiceModal';
import AdminSupportDashboard from '../LiveSupportChat/AdminSupportDashboard';

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
  const [activeSection, setActiveSection] = useState('dashboard');
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
  const [allWines, setAllWines] = useState([]);
  const [allCigars, setAllCigars] = useState([]);
  const [allSPVFormations, setAllSPVFormations] = useState([]);
  const [allTokenizationDrafts, setAllTokenizationDrafts] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [allPVCXBalances, setAllPVCXBalances] = useState([]);
  const [allPVCXTransactions, setAllPVCXTransactions] = useState([]);
  const [allFlightBids, setAllFlightBids] = useState([]);
  const [sidebarCounts, setSidebarCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [stats, setStats] = useState({ total: 0, new: 0, repeat: 0, churned: 0, active: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 9;

  // Special CRM access users (with restricted permissions) - all emails lowercase
  const SPECIAL_CRM_USERS = {
    'aziz.electricwala20@gmail.com': { hideCustomers: true }
  };

  // Helper to check if user is a special CRM user (case-insensitive)
  const getSpecialUserConfig = (email) => {
    if (!email) return null;
    const lowerEmail = email.toLowerCase();
    return SPECIAL_CRM_USERS[lowerEmail] || null;
  };

  // Check admin status - check both auth.users metadata AND users table
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        // Check for special CRM users first (case-insensitive)
        const specialConfig = getSpecialUserConfig(user?.email);
        console.log('🔍 CRM Access Check:', { email: user?.email, specialConfig });
        if (specialConfig) {
          setIsAdmin(true);
          console.log('✅ Admin check: Special CRM user granted access:', user.email);
          setLoading(false);
          return;
        }

        // Check 1: auth.users user_metadata (where we set is_admin via auth.admin.updateUserById)
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(user.id);
        const authIsAdmin = authData?.user?.user_metadata?.is_admin === true;

        // Check 2: users table (fallback/legacy)
        const { data: usersData } = await supabaseAdmin.from('users').select('is_admin, user_role').eq('id', user.id).single();
        const tableIsAdmin = usersData?.is_admin || usersData?.user_role === 'admin' || usersData?.user_role === 'super_admin';

        // Admin if either source says so
        setIsAdmin(authIsAdmin || tableIsAdmin);
        console.log('Admin check:', { userId: user.id, authIsAdmin, tableIsAdmin, final: authIsAdmin || tableIsAdmin });
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
        { count: emptyLegsTableCount },
        { count: winesCount },
        { count: cigarsCount },
        { count: spvFormationsCount },
        { count: tokenizationDraftsCount },
        { count: subscriptionsCount }
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
        supabaseAdmin.from('EmptyLegs_').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('wines').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('premium_cigars').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('user_requests').select('*', { count: 'exact', head: true }).eq('type', 'spv_formation'),
        supabaseAdmin.from('tokenization_drafts').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }).not('subscription_tier', 'is', null)
      ]);
      setSidebarCounts({
        customers: authUsersCount,
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
        emptyLegsTable: emptyLegsTableCount || 0,
        wines: winesCount || 0,
        cigars: cigarsCount || 0,
        spvFormations: spvFormationsCount || 0,
        tokenizationDrafts: tokenizationDraftsCount || 0,
        subscriptions: subscriptionsCount || 0
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

      // Enrich with public users data and other tables (with error handling per user)
      const enrichedUsers = await Promise.all(paginatedUsers.map(async (authUser) => {
        try {
          const [
            { data: publicUser },
            { data: bookings },
            { data: requests },
            { data: aiChats },
            { data: supportTickets },
            { data: profile },
            { data: pvcxBalance }
          ] = await Promise.all([
            supabaseAdmin.from('users').select('*').eq('id', authUser.id).maybeSingle(),
            supabaseAdmin.from('user_bookings').select('*').eq('user_id', authUser.id),
            supabaseAdmin.from('user_requests').select('*').eq('user_id', authUser.id),
            supabaseAdmin.from('ai_chat_sessions').select('*').eq('user_id', authUser.id),
            supabaseAdmin.from('support_tickets').select('*').eq('user_id', authUser.id),
            supabaseAdmin.from('user_profiles').select('avatar_url, phone, city, country, wallet_address, pvcx_balance, subscription_tier, nft_holder').eq('user_id', authUser.id).maybeSingle(),
            supabaseAdmin.from('pvcx_balance').select('balance, earned_from_bookings, earned_from_co2').eq('user_id', authUser.id).maybeSingle()
          ]);

          // Merge profile with PVCX balance from dedicated table (pvcx_balance table is source of truth)
          const mergedProfile = {
            ...(profile || {}),
            pvcx_balance: pvcxBalance?.balance ?? profile?.pvcx_balance ?? 0,
            pvcx_from_bookings: pvcxBalance?.earned_from_bookings ?? 0,
            pvcx_from_co2: pvcxBalance?.earned_from_co2 ?? 0
          };

          // Merge auth user data with public user data
          return {
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at, // Use auth.users created_at - this is the REAL registration time
            last_sign_in_at: authUser.last_sign_in_at,
            email_confirmed_at: authUser.email_confirmed_at,
            // Auth provider (google, email, etc.)
            provider: authUser.app_metadata?.provider || authUser.app_metadata?.providers?.[0] || 'email',
            // Phone: check users table first, then user_profiles, then auth.users
            phone: publicUser?.phone || profile?.phone || authUser.phone || null,
            // From user_metadata
            name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || publicUser?.name,
            first_name: authUser.user_metadata?.first_name || publicUser?.first_name,
            last_name: authUser.user_metadata?.last_name || publicUser?.last_name,
            avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || profile?.avatar_url,
            // From public.users table
            is_admin: publicUser?.is_admin,
            user_role: publicUser?.user_role,
            is_active: publicUser?.is_active !== false, // Default to true if not set
            // Related data
            bookings: bookings || [],
            requests: requests || [],
            aiChats: aiChats || [],
            supportTickets: supportTickets || [],
            profile: mergedProfile
          };
        } catch (err) {
          console.error('Error enriching user:', authUser.id, err);
          // Return basic user data even if enrichment fails
          return {
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            email_confirmed_at: authUser.email_confirmed_at,
            provider: authUser.app_metadata?.provider || authUser.app_metadata?.providers?.[0] || 'email',
            phone: authUser.phone,
            name: authUser.user_metadata?.name || authUser.user_metadata?.full_name,
            first_name: authUser.user_metadata?.first_name,
            last_name: authUser.user_metadata?.last_name,
            avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
            is_admin: false,
            user_role: 'user',
            is_active: true,
            bookings: [],
            requests: [],
            aiChats: [],
            supportTickets: [],
            profile: {}
          };
        }
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

    // Fetch from users table
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, name, first_name, last_name, phone, address, country, created_at')
      .in('id', userIds);

    // Also fetch from user_profiles for additional details
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, subscription_tier, subscription_status, nft_holder, kyc_verified, phone, address, city, country, company_name')
      .in('user_id', userIds);

    // Also try auth.users for emails AND user metadata (first_name, last_name from registration)
    let authUserData = {};
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      (authData?.users || []).forEach(u => {
        if (userIds.includes(u.id)) {
          // Extract user metadata where first_name/last_name are stored during signup
          const meta = u.user_metadata || {};
          authUserData[u.id] = {
            email: u.email,
            first_name: meta.first_name || meta.firstName || null,
            last_name: meta.last_name || meta.lastName || null
          };
        }
      });
    } catch (e) { /* ignore auth errors */ }

    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u; });

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

    return items.map(item => {
      const userId = item[userIdField];
      const userData = userMap[userId] || {};
      const profileData = profileMap[userId] || {};
      const authMeta = authUserData[userId] || {};

      // Priority: users table > auth metadata > fallback
      const firstName = userData.first_name || authMeta.first_name || '';
      const lastName = userData.last_name || authMeta.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();

      return {
        ...item,
        users: {
          ...userData,
          ...profileData,
          email: userData.email || authMeta.email || item.client_email || null,
          first_name: firstName || null,
          last_name: lastName || null,
          name: fullName || userData.name || profileData.company_name || null,
          full_name: fullName || userData.name || null,
          phone: userData.phone || profileData.phone || null,
          address: userData.address || profileData.address || null,
          city: profileData.city || null,
          country: userData.country || profileData.country || null,
          company_name: profileData.company_name || null,
          subscription_tier: profileData.subscription_tier || null,
          subscription_status: profileData.subscription_status || null,
          nft_holder: profileData.nft_holder || false,
          kyc_verified: profileData.kyc_verified || false
        }
      };
    });
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
      // Fetch ALL AI chat sessions (no limit - admin needs to see all)
      const { data, error } = await supabaseAdmin.from('ai_chat_sessions').select('*').order('created_at', { ascending: false });
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

  // Fetch all AI chat requests (cart items sent by users) - from BOTH tables
  const fetchAllChatRequests = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch from chat_requests (legacy) - NO LIMIT for admin
      const { data: chatReqData, error: chatReqError } = await supabaseAdmin
        .from('chat_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (chatReqError) console.error('Chat requests fetch error:', chatReqError);

      // Fetch from user_requests where source is ai_chat (new submissions) - NO LIMIT for admin
      const { data: userReqData, error: userReqError } = await supabaseAdmin
        .from('user_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (userReqError) console.error('User requests fetch error:', userReqError);

      // Filter user_requests to include AI chat submissions
      // Check multiple indicators: source field, has conversation, or has cart items in data
      const aiChatUserRequests = (userReqData || []).filter(r =>
        r.data?.source === 'ai_chat' ||
        r.data?.conversation?.length > 0 ||
        r.data?.items?.length > 0 ||
        r.data?.created_via === 'sphera_ai_assistant'
      );

      console.log('AI Chat User Requests found:', aiChatUserRequests.length, aiChatUserRequests.map(r => ({
        id: r.id,
        type: r.type,
        hasConversation: r.data?.conversation?.length || 0,
        hasItems: r.data?.items?.length || 0,
        source: r.data?.source
      })));

      // Normalize data structure - map user_requests to match chat_requests format
      const normalizedUserRequests = aiChatUserRequests.map(r => {
        // Parse data if it's a string (shouldn't be, but just in case)
        let data = r.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (e) { data = {}; }
        }

        const convLen = data?.conversation?.length || 0;
        const itemsLen = data?.items?.length || 0;
        console.log(`📦 Request ${r.id?.slice(0,8)}: ${convLen} messages, ${itemsLen} items, keys: ${data ? Object.keys(data).join(',') : 'no data'}`);

        return {
          ...r,
          data: data, // Keep parsed data
          cart_items: data?.items || data?.cart_items || [],
          cart_total: data?.total || data?.cart_total || 0,
          conversation_history: data?.conversation || [],
          query: data?.notes || data?.query || '',
          service_type: r.type
        };
      });

      // Combine both sources, remove duplicates by id
      const combined = [...(chatReqData || []), ...normalizedUserRequests];
      const uniqueById = combined.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );

      // Sort by date
      uniqueById.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Enrich ALL requests - no limit for admin CRM
      const enriched = await enrichWithUserData(uniqueById);
      setAllChatRequests(enriched);
    } catch (err) { console.error('Error fetching chat requests:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch empty leg bookings (Coingate payments) - includes operator info from EmptyLegs_ table
  const fetchEmptyLegBookings = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin.from('user_bookings').select('*').eq('booking_type', 'empty_leg').order('created_at', { ascending: false }).limit(100);
      if (error) console.error('Empty leg bookings fetch error:', error);
      const enriched = await enrichWithUserData(data || []);

      // Fetch operator info from EmptyLegs_ table for each booking
      const withOperator = await Promise.all(enriched.map(async (booking) => {
        // Try to get operator from EmptyLegs_ table using service_id
        const serviceId = booking.service_id || booking.empty_leg_id || booking.metadata?.empty_leg_id;
        if (serviceId) {
          const { data: emptyLeg } = await supabaseAdmin
            .from('EmptyLegs_')
            .select('operator')
            .eq('id', serviceId)
            .single();
          if (emptyLeg?.operator) {
            return { ...booking, operator: emptyLeg.operator };
          }
        }
        // Fallback: check if operator is stored in booking details/metadata
        const operator = booking.details?.operator || booking.metadata?.operator || booking.service_details?.operator;
        return { ...booking, operator: operator || null };
      }));

      setAllEmptyLegBookings(withOperator);
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

  // Fetch wines inventory
  const fetchAllWines = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin.from('wines').select('*').order('name', { ascending: true });
      if (error) console.error('Wines fetch error:', error);
      console.log('Wines fetched:', data?.length, 'records');
      setAllWines(data || []);
    } catch (err) { console.error('Error fetching wines:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch cigars inventory
  const fetchAllCigars = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin.from('premium_cigars').select('*').order('brand', { ascending: true });
      if (error) console.error('Cigars fetch error:', error);
      console.log('Cigars fetched:', data?.length, 'records');
      setAllCigars(data || []);
    } catch (err) { console.error('Error fetching cigars:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch SPV Formation requests from user_requests table
  const fetchSPVFormations = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('user_requests')
        .select('*')
        .eq('type', 'spv_formation')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) console.error('SPV formations fetch error:', error);
      const enriched = await enrichWithUserData(data || []);
      console.log('SPV formations fetched:', enriched?.length, 'records');
      setAllSPVFormations(enriched);
    } catch (err) { console.error('Error fetching SPV formations:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch Tokenization Drafts from tokenization_drafts table
  const fetchTokenizationDrafts = useCallback(async () => {
    setRefreshing(true);
    try {
      // First try to fetch all drafts (including any status)
      let query = supabaseAdmin.from('tokenization_drafts').select('*');

      // Try with order first
      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

      if (error) {
        console.error('Tokenization drafts fetch error:', error);
        // Try without order if that fails
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('tokenization_drafts')
          .select('*')
          .limit(100);
        if (fallbackError) {
          console.error('Tokenization drafts fallback fetch error:', fallbackError);
          setAllTokenizationDrafts([]);
        } else {
          console.log('Tokenization drafts (fallback) fetched:', fallbackData?.length, 'records');
          const enriched = await enrichWithUserData(fallbackData || []);
          setAllTokenizationDrafts(enriched);
        }
      } else {
        console.log('Tokenization drafts fetched:', data?.length, 'records', data);
        const enriched = await enrichWithUserData(data || []);
        setAllTokenizationDrafts(enriched);
      }
    } catch (err) {
      console.error('Error fetching tokenization drafts:', err);
      setAllTokenizationDrafts([]);
    }
    finally { setRefreshing(false); }
  }, []);

  // Fetch ALL subscriptions from user_profiles - shows subscription data
  const fetchAllSubscriptions = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .not('subscription_tier', 'is', null)
        .order('created_at', { ascending: false });
      if (error) console.error('Subscriptions fetch error:', error);
      const enriched = await enrichWithUserData(data || []);
      console.log('Subscriptions fetched:', enriched?.length, 'records');
      setAllSubscriptions(enriched);
    } catch (err) { console.error('Error fetching subscriptions:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch PVCX token balances and transactions
  const fetchPVCXData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch from pvcx_balance table (main source of truth)
      const { data: balances, error: balError } = await supabaseAdmin
        .from('pvcx_balance')
        .select('*')
        .order('balance', { ascending: false });

      if (balError) {
        console.log('pvcx_balance table error, checking user_profiles for pvcx_balance field');
        // Fallback: fetch from user_profiles if pvcx_balance table doesn't exist
        const { data: profiles } = await supabaseAdmin
          .from('user_profiles')
          .select('user_id, pvcx_balance')
          .not('pvcx_balance', 'is', null)
          .order('pvcx_balance', { ascending: false });

        const enrichedProfiles = await enrichWithUserData(profiles || [], 'user_id');
        setAllPVCXBalances(enrichedProfiles);
      } else {
        const enriched = await enrichWithUserData(balances || [], 'user_id');
        setAllPVCXBalances(enriched);
      }

      // Try to fetch transactions
      const { data: txns, error: txError } = await supabaseAdmin
        .from('pvcx_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!txError) {
        const enrichedTxns = await enrichWithUserData(txns || [], 'user_id');
        setAllPVCXTransactions(enrichedTxns);
      } else {
        console.log('PVCX transactions table may not exist yet');
        setAllPVCXTransactions([]);
      }
    } catch (err) { console.error('Error fetching PVCX data:', err); }
    finally { setRefreshing(false); }
  }, []);

  // Fetch flight bids with route and user data
  const fetchFlightBids = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch bids with route details from fixed_offers
      const { data: bids, error } = await supabaseAdmin
        .from('flight_bids')
        .select(`
          *,
          route:route_id (
            id,
            title,
            origin,
            destination,
            price,
            currency,
            aircraft_type,
            image_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('flight_bids fetch error:', error.message);
        setAllFlightBids([]);
        return;
      }

      console.log('Fetched flight bids:', bids?.length || 0);

      // Enrich with user data from auth.users
      const enrichedBids = await Promise.all((bids || []).map(async (bid) => {
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(bid.user_id);
          return {
            ...bid,
            user: userData?.user ? {
              id: userData.user.id,
              email: userData.user.email,
              name: userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0],
              provider: userData.user.app_metadata?.provider || 'email'
            } : null
          };
        } catch {
          return { ...bid, user: null };
        }
      }));

      setAllFlightBids(enrichedBids);
    } catch (err) {
      console.error('Error fetching flight bids:', err);
      setAllFlightBids([]);
    }
    finally { setRefreshing(false); }
  }, []);

  // Fetch recent notifications (latest entries across all tables)
  const fetchNotifications = useCallback(async () => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

      // Fetch recent items from multiple tables in parallel
      const [bookingsRes, requestsRes, supportRes, spvRes, tokenRes, subsRes] = await Promise.all([
        supabaseAdmin.from('user_bookings').select('id, user_id, service_type, created_at').gte('created_at', oneDayAgo).order('created_at', { ascending: false }).limit(5),
        supabaseAdmin.from('user_requests').select('id, user_id, type, created_at').gte('created_at', oneDayAgo).order('created_at', { ascending: false }).limit(5),
        supabaseAdmin.from('support_tickets').select('id, user_id, subject, created_at').gte('created_at', oneDayAgo).order('created_at', { ascending: false }).limit(5),
        supabaseAdmin.from('user_requests').select('id, user_id, data, created_at').eq('type', 'spv_formation').gte('created_at', oneDayAgo).order('created_at', { ascending: false }).limit(5),
        supabaseAdmin.from('tokenization_drafts').select('id, user_id, asset_name, created_at').gte('created_at', oneDayAgo).order('created_at', { ascending: false }).limit(5),
        supabaseAdmin.from('user_profiles').select('user_id, subscription_tier, created_at').not('subscription_tier', 'is', null).gte('created_at', oneDayAgo).order('created_at', { ascending: false }).limit(5),
      ]);

      // Combine and format notifications
      const allNotifs = [
        ...(bookingsRes.data || []).map(b => ({ id: `booking-${b.id}`, type: 'booking', label: `New ${b.service_type?.replace('_', ' ') || 'booking'}`, created_at: b.created_at, section: 'activity' })),
        ...(requestsRes.data || []).filter(r => r.type !== 'spv_formation').map(r => ({ id: `request-${r.id}`, type: 'request', label: `New ${r.type?.replace('_', ' ') || 'request'}`, created_at: r.created_at, section: 'activity' })),
        ...(supportRes.data || []).map(s => ({ id: `support-${s.id}`, type: 'support', label: `Support: ${s.subject?.slice(0, 30) || 'New ticket'}`, created_at: s.created_at, section: 'support' })),
        ...(spvRes.data || []).map(s => ({ id: `spv-${s.id}`, type: 'spv', label: `SPV Formation: ${s.data?.spv_name || 'New request'}`, created_at: s.created_at, section: 'spv-formation' })),
        ...(tokenRes.data || []).map(t => ({ id: `token-${t.id}`, type: 'tokenization', label: `Tokenization: ${t.asset_name || 'New draft'}`, created_at: t.created_at, section: 'tokenization' })),
        ...(subsRes.data || []).map(s => ({ id: `sub-${s.user_id}`, type: 'subscription', label: `New ${s.subscription_tier} subscription`, created_at: s.created_at, section: 'subscriptions' })),
      ];

      // Sort by date and take top 15
      const sorted = allNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 15);
      setNotifications(sorted);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    if (isAdmin) {
      fetchNotifications();
      // Refresh notifications every 2 minutes
      const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchNotifications]);

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
      case 'ai-requests': fetchAllChatRequests(); break;
      case 'support': fetchAllSupport(); break;
      case 'transactions': fetchAllTransactions(); break;
      case 'subscriptions': fetchAllSubscriptions(); break;
      case 'chat-messages': fetchAllChatMessages(); break;
      case 'chat-requests': fetchAllChatRequests(); break;
      case 'empty-legs': fetchEmptyLegBookings(); break;
      case 'emptylegs-table': fetchEmptyLegsFromTable(); break;
      case 'wines': fetchAllWines(); break;
      case 'cigars': fetchAllCigars(); break;
      case 'spv-formation': fetchSPVFormations(); break;
      case 'tokenization': fetchTokenizationDrafts(); break;
      case 'pvcx': fetchPVCXData(); break;
      case 'bids': fetchFlightBids(); break;
      default: fetchCustomers();
    }
  }, [isAdmin, activeSection, fetchCustomers, fetchAllBookings, fetchAllRequests, fetchAllAiChats, fetchAllSupport, fetchAllTransactions, fetchAllChatMessages, fetchAllChatRequests, fetchEmptyLegBookings, fetchEmptyLegsFromTable, fetchAllWines, fetchAllCigars, fetchSPVFormations, fetchTokenizationDrafts, fetchAllSubscriptions, fetchPVCXData, fetchFlightBids, fetchSidebarCounts]);

  const getUserName = (c) => c?.name || `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || c?.email?.split('@')[0] || 'Unknown';
  const getUserRole = (c) => c?.user_role || (c?.bookings?.length > 5 ? 'VIP' : c?.bookings?.length > 0 ? 'Active' : 'New');
  const isRepeatCustomer = (c) => (c?.bookings?.length || 0) > 1;
  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  // Sidebar menu items
  // ENHANCED MENU - includes Web3 sections
  const allMenuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', count: null },
    { id: 'customers', icon: Users, label: 'Customers', count: sidebarCounts.customers },
    { id: 'activity', icon: Activity, label: 'Customer Activity', count: (sidebarCounts.bookings || 0) + (sidebarCounts.requests || 0) + (sidebarCounts.chatRequests || 0) },
    { id: 'ai-chats', icon: Sparkles, label: 'AI Chats', count: sidebarCounts.aiChats },
    { id: 'live-support', icon: MessageSquare, label: 'Live Support', count: null },
    { id: 'invoice-generator', icon: FileText, label: 'Invoice Generator', count: null },
    { id: 'support', icon: Ticket, label: 'Support', count: sidebarCounts.support },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', count: sidebarCounts.transactions },
    { id: 'bids', icon: Tag, label: 'Flight Bids', count: allFlightBids.length || null },
    { id: 'inventory', icon: Package, label: 'Inventory', count: (sidebarCounts.emptyLegsTable || 0) + (sidebarCounts.wines || 0) + (sidebarCounts.cigars || 0) },
    { id: 'subscriptions', icon: Crown, label: 'Subscriptions', count: sidebarCounts.subscriptions },
    { id: 'spv-formation', icon: Building2, label: 'SPV Formation', count: sidebarCounts.spvFormations },
    { id: 'tokenization', icon: Coins, label: 'Tokenized Assets', count: sidebarCounts.tokenizationDrafts },
    { id: 'pvcx', icon: Zap, label: 'PVCX Tokens', count: allPVCXBalances.length || null },
  ];

  // Filter menu items based on user permissions (case-insensitive)
  const userConfig = getSpecialUserConfig(user?.email);
  const menuItems = allMenuItems.filter(item => {
    // Hide customers for users with hideCustomers flag
    if (item.id === 'customers' && userConfig?.hideCustomers) {
      return false;
    }
    return true;
  });

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
              {activeSection === 'ai-chats' ? 'AI Chats' :
               activeSection === 'activity' ? 'Customer Activity' :
               activeSection === 'inventory' ? 'Inventory' :
               activeSection.replace('-', ' ')}
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
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-gray-100 rounded-lg relative"
                >
                  <Bell size={18} className="text-gray-500" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[400px] overflow-hidden">
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                      <span className="text-xs text-gray-500">Last 24 hours</span>
                    </div>
                    <div className="overflow-y-auto max-h-[320px]">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">No recent activity</div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => { setActiveSection(n.section); setShowNotifications(false); }}
                            className="w-full px-4 py-3 hover:bg-gray-50 border-b border-gray-50 text-left flex items-start gap-3"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              n.type === 'booking' ? 'bg-blue-100' :
                              n.type === 'support' ? 'bg-orange-100' :
                              n.type === 'spv' ? 'bg-purple-100' :
                              n.type === 'tokenization' ? 'bg-indigo-100' :
                              n.type === 'subscription' ? 'bg-yellow-100' :
                              'bg-gray-100'
                            }`}>
                              {n.type === 'booking' && <Plane size={14} className="text-blue-600" />}
                              {n.type === 'support' && <Ticket size={14} className="text-orange-600" />}
                              {n.type === 'spv' && <Building2 size={14} className="text-purple-600" />}
                              {n.type === 'tokenization' && <Coins size={14} className="text-indigo-600" />}
                              {n.type === 'subscription' && <Crown size={14} className="text-yellow-600" />}
                              {n.type === 'request' && <ShoppingCart size={14} className="text-gray-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">{n.label}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(n.created_at).toLocaleString('en-US', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-gray-400 flex-shrink-0 mt-1" />
                          </button>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={() => { fetchNotifications(); }}
                        className="w-full py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-2"
                      >
                        <RefreshCcw size={14} /> Refresh
                      </button>
                    </div>
                  </div>
                )}
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

          {/* UNIFIED Customer Activity Section - combines bookings, requests, chat-requests */}
          {activeSection === 'activity' && (
            <UnifiedActivitySection
              bookings={allBookings}
              emptyLegBookings={allEmptyLegBookings}
              requests={allRequests}
              chatRequests={allChatRequests}
              refreshing={refreshing}
              onRefreshBookings={fetchAllBookings}
              onRefreshEmptyLegs={fetchEmptyLegBookings}
              onRefreshRequests={fetchAllRequests}
              onRefreshChatRequests={fetchAllChatRequests}
              supabaseAdmin={supabaseAdmin}
              sidebarCounts={sidebarCounts}
              currentAdminEmail={user?.email}
            />
          )}

          {/* AI Conversations Section - from ai_chat_sessions */}
          {activeSection === 'ai-chats' && (
            <AiChatsSection chats={allAiChats} requests={allChatRequests} refreshing={refreshing} onRefresh={() => { fetchAllAiChats(); fetchAllChatRequests(); }} supabaseAdmin={supabaseAdmin} currentAdminEmail={user?.email} />
          )}

          {/* Live Support Section */}
          {activeSection === 'live-support' && (
            <AdminSupportDashboard />
          )}

          {/* Invoice Generator Section */}
          {activeSection === 'invoice-generator' && (
            <InvoiceGeneratorSection customers={customers} supabaseAdmin={supabaseAdmin} />
          )}

          {/* Support Section */}
          {activeSection === 'support' && (
            <SupportSection tickets={allSupport} refreshing={refreshing} onRefresh={fetchAllSupport} supabaseAdmin={supabaseAdmin} currentAdminEmail={user?.email} />
          )}

          {/* Transactions Section */}
          {activeSection === 'transactions' && (
            <TransactionsSection transactions={allTransactions} refreshing={refreshing} onRefresh={fetchAllTransactions} />
          )}

          {/* UNIFIED Inventory Section - combines empty legs, wines, cigars */}
          {activeSection === 'inventory' && (
            <UnifiedInventorySection
              emptyLegs={allEmptyLegsFromTable}
              wines={allWines}
              cigars={allCigars}
              refreshing={refreshing}
              onRefreshEmptyLegs={fetchEmptyLegsFromTable}
              onRefreshWines={fetchAllWines}
              onRefreshCigars={fetchAllCigars}
              sidebarCounts={sidebarCounts}
            />
          )}

          {/* SPV Formation Section */}
          {activeSection === 'spv-formation' && (
            <SPVFormationSection
              formations={allSPVFormations}
              refreshing={refreshing}
              onRefresh={fetchSPVFormations}
              supabaseAdmin={supabaseAdmin}
              currentAdminEmail={user?.email}
            />
          )}

          {/* Tokenization Section */}
          {activeSection === 'tokenization' && (
            <TokenizationSection
              drafts={allTokenizationDrafts}
              refreshing={refreshing}
              onRefresh={fetchTokenizationDrafts}
              supabaseAdmin={supabaseAdmin}
              currentAdminEmail={user?.email}
            />
          )}

          {/* Subscriptions Section */}
          {activeSection === 'subscriptions' && (
            <SubscriptionsSection
              subscriptions={allSubscriptions}
              refreshing={refreshing}
              onRefresh={fetchAllSubscriptions}
              supabaseAdmin={supabaseAdmin}
            />
          )}

          {/* PVCX Tokens Section - Only eltesto can send tokens */}
          {activeSection === 'pvcx' && (
            <PVCXSection
              balances={allPVCXBalances}
              transactions={allPVCXTransactions}
              refreshing={refreshing}
              onRefresh={fetchPVCXData}
              supabaseAdmin={supabaseAdmin}
              currentAdminEmail={user?.email}
              customers={customers}
            />
          )}

          {/* Flight Bids Section */}
          {activeSection === 'bids' && (
            <BidsSection
              bids={allFlightBids}
              refreshing={refreshing}
              onRefresh={fetchFlightBids}
              supabaseAdmin={supabaseAdmin}
            />
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
  // SIMPLIFIED - Only 6 main cards matching the new menu structure
  const cards = [
    { label: 'Customers', value: sidebarCounts.customers, icon: Users, color: 'blue', section: 'customers' },
    { label: 'Customer Activity', value: (sidebarCounts.bookings || 0) + (sidebarCounts.requests || 0) + (sidebarCounts.chatRequests || 0), icon: Activity, color: 'green', section: 'activity' },
    { label: 'AI Conversations', value: sidebarCounts.aiChats, icon: Sparkles, color: 'indigo', section: 'ai-chats' },
    { label: 'Support Tickets', value: sidebarCounts.support, icon: Ticket, color: 'red', section: 'support' },
    { label: 'Transactions', value: sidebarCounts.transactions, icon: CreditCard, color: 'emerald', section: 'transactions' },
    { label: 'Inventory', value: (sidebarCounts.emptyLegsTable || 0) + (sidebarCounts.wines || 0) + (sidebarCounts.cigars || 0), icon: Package, color: 'purple', section: 'inventory' },
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
    rose: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => onNavigate(card.section)}
          className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md transition-shadow"
        >
          <div className={`w-12 h-12 ${colorClasses[card.color]} rounded-lg flex items-center justify-center mb-3`}>
            <card.icon size={20} />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{(card.value || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">{card.label}</p>
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
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRequestForQuote, setSelectedRequestForQuote] = useState(null);

  // Open quote/invoice modal for a request
  const openQuoteModal = (request, userData) => {
    setSelectedRequestForQuote({ request, user: userData });
    setShowQuoteModal(true);
  };

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
                      <button
                        onClick={() => openQuoteModal(r, r.users)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                      >
                        <FileText size={16} /> Create Quote/Invoice
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quote/Invoice Modal */}
      {showQuoteModal && selectedRequestForQuote && (
        <QuoteInvoiceModal
          request={selectedRequestForQuote.request}
          user={selectedRequestForQuote.user}
          onClose={() => {
            setShowQuoteModal(false);
            setSelectedRequestForQuote(null);
          }}
        />
      )}
    </>
  );
};

// ============================================
// EMPTY LEGS SECTION - COINGATE PAYMENTS
// ============================================
const EmptyLegsSection = ({ bookings, refreshing, onRefresh }) => {
  const [expandedBooking, setExpandedBooking] = useState(null);

  // Generate PCX booking ID from booking id
  const generatePCXId = (bookingId) => {
    if (!bookingId) return 'PCX-000000';
    const shortId = bookingId.replace(/-/g, '').slice(-8).toUpperCase();
    return `PCX-${shortId}`;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700',
      refunded: 'bg-purple-100 text-purple-700',
      confirming: 'bg-blue-100 text-blue-700'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const getBookingStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-500',
      pending: 'bg-yellow-500',
      cancelled: 'bg-red-500',
      completed: 'bg-blue-500'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-500';
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Empty Leg Bookings ({bookings.length})</h2>
          <p className="text-xs text-gray-500">Crypto payments via Coingate</p>
        </div>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><Tag className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">No empty leg bookings found</p></div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b, i) => {
            const isExpanded = expandedBooking === b.id;
            // Get data from both direct fields and nested objects
            const bookingData = b.details || b.booking_data || b.metadata || {};

            // Extract all possible field locations
            const origin = b.origin || bookingData.origin || bookingData.departure_city || bookingData.from || bookingData.departure_airport;
            const destination = b.destination || bookingData.destination || bookingData.arrival_city || bookingData.to || bookingData.arrival_airport;
            const departureDate = b.departure_date || bookingData.departure_date || bookingData.date;
            const aircraft = b.aircraft_type || bookingData.aircraft_type || bookingData.aircraft || bookingData.category;
            const passengers = b.passengers || bookingData.passengers || bookingData.max_passengers;
            const serviceTitle = b.service_title || bookingData.title || bookingData.service_title;
            const totalAmount = b.total_amount || b.total_price || bookingData.total_price || bookingData.price || 0;
            const basePrice = b.base_price || bookingData.base_price || 0;
            const contactName = b.contact_name || bookingData.contact_name;
            const contactEmail = b.contact_email || bookingData.contact_email || b.users?.email;
            const contactPhone = b.contact_phone || bookingData.contact_phone;
            const specialRequests = b.special_requests || bookingData.special_requests;
            const walletAddress = b.wallet_address || bookingData.wallet_address;

            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                      <Plane size={22} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{generatePCXId(b.id)}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-sm font-medium text-gray-900">
                          {origin || 'N/A'} → {destination || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">
                          {contactEmail || b.users?.email || 'Unknown user'} • {new Date(b.created_at).toLocaleString()}
                        </p>
                        {b.operator && (
                          <>
                            <span className="text-xs text-gray-300">|</span>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              Operator: {b.operator}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {departureDate && (
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-gray-900">{new Date(departureDate).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{aircraft || 'Aircraft TBD'}</p>
                      </div>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPaymentStatusColor(b.payment_status)}`}>
                      {b.payment_status || 'pending'}
                    </span>
                    <span className="text-sm font-bold text-gray-900">${Number(totalAmount).toLocaleString()}</span>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-100">
                    {/* Booking ID Banner */}
                    <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Tag size={16} className="text-amber-600" />
                        <div>
                          <p className="text-xs text-amber-600 font-medium">Booking Reference</p>
                          <p className="text-lg font-bold text-amber-700">{generatePCXId(b.id)}</p>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getBookingStatusColor(b.booking_status)}`} title={b.booking_status || 'pending'} />
                    </div>

                    {/* Flight Details */}
                    <div className="px-5 py-4">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Flight Details</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-gray-200 col-span-2">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Plane size={12} /> Route</p>
                          <p className="text-sm font-semibold text-gray-900">{origin || 'N/A'} → {destination || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Departure Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {departureDate ? new Date(departureDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Aircraft</p>
                          <p className="text-sm font-medium text-gray-900">{aircraft || 'N/A'}</p>
                        </div>
                        {passengers && (
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Users size={12} /> Passengers</p>
                            <p className="text-sm font-medium text-gray-900">{passengers}</p>
                          </div>
                        )}
                        {serviceTitle && (
                          <div className="bg-white p-3 rounded-lg border border-gray-200 col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Service Title</p>
                            <p className="text-sm font-medium text-gray-900">{serviceTitle}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operator Info - ADMIN ONLY */}
                    {b.operator && (
                      <div className="px-5 py-4 border-t border-gray-200">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Building2 size={14} /> Operator Information
                        </p>
                        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <Building2 size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-blue-900">{b.operator}</p>
                              <p className="text-xs text-blue-600">Aircraft Operator</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Customer Info */}
                    {(contactName || contactEmail || contactPhone) && (
                      <div className="px-5 py-4 border-t border-gray-200">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Customer Information</p>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-6">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-gray-500" />
                          </div>
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            {contactName && (
                              <div>
                                <p className="text-xs text-gray-500">Name</p>
                                <p className="text-sm font-medium text-gray-900">{contactName}</p>
                              </div>
                            )}
                            {contactEmail && (
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <a href={`mailto:${contactEmail}`} className="text-sm font-medium text-blue-600 hover:underline">{contactEmail}</a>
                              </div>
                            )}
                            {contactPhone && (
                              <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <a href={`tel:${contactPhone}`} className="text-sm font-medium text-blue-600 hover:underline">{contactPhone}</a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Info */}
                    <div className="px-5 py-4 border-t border-gray-200">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <CreditCard size={14} /> Coingate Payment Details
                      </p>
                      <div className="bg-white p-4 rounded-lg border-2 border-amber-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Payment Status</p>
                            <p className={`text-sm font-bold ${b.payment_status === 'paid' ? 'text-green-600' : b.payment_status === 'confirming' ? 'text-blue-600' : 'text-yellow-600'}`}>
                              {b.payment_status?.toUpperCase() || 'PENDING'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Coingate Order ID</p>
                            <p className="text-sm font-mono text-gray-900">{b.coingate_order_id || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Base Price</p>
                            <p className="text-sm font-medium text-gray-900">${Number(basePrice).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total (with VAT)</p>
                            <p className="text-sm font-bold text-emerald-600">${Number(totalAmount).toLocaleString()}</p>
                          </div>
                        </div>
                        {walletAddress && (
                          <div className="mt-3 pt-3 border-t border-amber-100">
                            <p className="text-xs text-gray-500">Wallet Address</p>
                            <p className="text-xs font-mono text-gray-700 break-all">{walletAddress}</p>
                          </div>
                        )}
                        {b.coingate_payment_url && (
                          <div className="mt-3 pt-3 border-t border-amber-100">
                            <a href={b.coingate_payment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 hover:underline flex items-center gap-1">
                              View Payment Page <ArrowRight size={12} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Special Requests */}
                    {specialRequests && (
                      <div className="px-5 py-4 border-t border-gray-200">
                        <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-2">Special Requests</p>
                        <div className="bg-white p-4 rounded-lg border-l-4 border-violet-500">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{specialRequests}</p>
                        </div>
                      </div>
                    )}

                    {/* Raw Data */}
                    <div className="px-5 py-4 border-t border-gray-200">
                      <details className="bg-white rounded-lg border border-gray-200">
                        <summary className="px-4 py-2 text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-50">View Full Booking Data (JSON)</summary>
                        <pre className="px-4 py-3 text-xs text-gray-700 overflow-auto max-h-48 bg-gray-50">{JSON.stringify(b, null, 2)}</pre>
                      </details>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-5 py-4 bg-white border-t flex items-center gap-3">
                      <a
                        href={`mailto:${contactEmail || b.users?.email}?subject=Re: Your Empty Leg Booking ${generatePCXId(b.id)}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        <Mail size={16} /> Contact Customer
                      </a>
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                        <FileText size={16} /> Generate Invoice
                      </button>
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200">
                        <ShieldCheck size={16} /> Confirm Booking
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
// CHAT REQUESTS SECTION - WOOCOMMERCE-STYLE CART VIEW
// ============================================
const ChatRequestsSection = ({ requests, refreshing, onRefresh }) => {
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRequestForQuote, setSelectedRequestForQuote] = useState(null);

  // Open quote/invoice modal for a request
  const openQuoteModal = (request, userData) => {
    setSelectedRequestForQuote({ request, user: userData });
    setShowQuoteModal(true);
  };

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

  // Get proper category name from type
  const getCategoryName = (type) => {
    const categoryNames = {
      'jet': 'Private Jet Charter',
      'jets': 'Private Jet Charter',
      'private_jet': 'Private Jet Charter',
      'helicopter': 'Helicopter Charter',
      'helicopters': 'Helicopter Charter',
      'yacht': 'Yacht Charter',
      'yachts': 'Yacht Charter',
      'taxi': 'Airport Transfer',
      'transfer': 'Airport Transfer',
      'ground_transport': 'Ground Transport',
      'taxi_cars': 'Ground Transport',
      'empty_legs': 'Empty Leg Flight',
      'emptyleg': 'Empty Leg Flight',
      'wine': 'Premium Wines',
      'wines': 'Premium Wines',
      'champagne': 'Champagne',
      'cigars': 'Premium Cigars',
      'caviar': 'Caviar & Delicacies',
      'delicatesse': 'Delicacies',
      'delicacies': 'Delicacies',
      'custom_extra': 'Custom Extra',
      'adventure': 'Adventure Package',
      'concierge': 'Concierge Service',
      'restaurant': 'Restaurant Reservation',
      'flowers': 'Flowers & Gifts'
    };
    return categoryNames[type?.toLowerCase()] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service';
  };

  // Format item display - prioritize exact product name
  const formatItemName = (item) => {
    // Always prioritize the exact product name
    if (item.name) return item.name;
    if (item.title) return item.title;
    if (item.displayTitle) return item.displayTitle;
    if (item.service_name) return item.service_name;
    // Fallback to aircraft type or route
    if (item.aircraft_type) return item.aircraft_type;
    if (item.from && item.to) return `${item.from} → ${item.to}`;
    // Last resort: category name
    if (item.type) return getCategoryName(item.type);
    return 'Service Item';
  };

  // Get category subtitle (shown below product name)
  const formatItemCategory = (item) => {
    const type = item.type || item.category || item.service_type;
    return getCategoryName(type);
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
                                          <p className="text-xs text-gray-500">{formatItemCategory(item)}</p>
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
                                        {getCategoryName(r.service_type) || 'Travel Request'}
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
                      <button
                        onClick={() => openQuoteModal(r, r.users)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                      >
                        <FileText size={16} /> Create Quote/Invoice
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quote/Invoice Modal */}
      {showQuoteModal && selectedRequestForQuote && (
        <QuoteInvoiceModal
          request={selectedRequestForQuote.request}
          user={selectedRequestForQuote.user}
          onClose={() => {
            setShowQuoteModal(false);
            setSelectedRequestForQuote(null);
          }}
        />
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
// AI CHATS SECTION - UNIFIED: CONVERSATIONS + LINKED REQUESTS
// ============================================
const AiChatsSection = ({ chats, requests, refreshing, onRefresh, supabaseAdmin, currentAdminEmail }) => {
  const [expandedChat, setExpandedChat] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'with_requests', 'no_requests'
  const [markingViewed, setMarkingViewed] = useState(null);

  // Mark chat as viewed by admin
  const markAsViewed = async (chatId, currentMetadata) => {
    if (!supabaseAdmin || !currentAdminEmail) return;
    // Skip if already viewed
    if (currentMetadata?._viewed_by) return;

    try {
      setMarkingViewed(chatId);
      const updatedMetadata = {
        ...(currentMetadata || {}),
        _viewed_by: currentAdminEmail,
        _viewed_at: new Date().toISOString()
      };

      await supabaseAdmin
        .from('ai_chat_sessions')
        .update({ metadata: updatedMetadata })
        .eq('id', chatId);

      onRefresh();
    } catch (err) {
      console.error('Error marking chat as viewed:', err);
    } finally {
      setMarkingViewed(null);
    }
  };

  // Check if chat is new (unviewed)
  const isNewChat = (c) => !c.metadata?._viewed_by;

  // Find requests that match a conversation (same user, created after conversation)
  const findLinkedRequests = (chat) => {
    if (!requests || !chat.user_id) return [];
    const chatTime = new Date(chat.created_at).getTime();
    return requests.filter(r => {
      const reqTime = new Date(r.created_at).getTime();
      // Same user AND request was created within 24 hours after conversation started
      return r.user_id === chat.user_id && reqTime >= chatTime && reqTime - chatTime < 24 * 60 * 60 * 1000;
    });
  };

  // Pre-calculate which chats have requests for filtering (with original index for numbering)
  const chatsWithRequestStatus = chats.map((c, idx) => ({
    ...c,
    hasRequests: findLinkedRequests(c).length > 0,
    originalNumber: chats.length - idx
  }));

  // Filter chats based on selected filter
  const filteredChats = chatsWithRequestStatus.filter(c => {
    if (filter === 'with_requests') return c.hasRequests;
    if (filter === 'no_requests') return !c.hasRequests;
    return true; // 'all'
  });

  // Count for filter badges
  const withRequestsCount = chatsWithRequestStatus.filter(c => c.hasRequests).length;
  const noRequestsCount = chatsWithRequestStatus.filter(c => !c.hasRequests).length;

  // Get service type info
  const getServiceInfo = (type) => {
    if (!type) return { label: 'Request', color: 'bg-gray-100 text-gray-700' };
    const t = type.toLowerCase();
    if (t.includes('jet') || t.includes('flight')) return { label: 'Private Jet', color: 'bg-blue-100 text-blue-700' };
    if (t.includes('helicopter')) return { label: 'Helicopter', color: 'bg-orange-100 text-orange-700' };
    if (t.includes('yacht')) return { label: 'Yacht', color: 'bg-cyan-100 text-cyan-700' };
    if (t.includes('car') || t.includes('ground')) return { label: 'Luxury Car', color: 'bg-purple-100 text-purple-700' };
    if (t.includes('empty')) return { label: 'Empty Leg', color: 'bg-green-100 text-green-700' };
    if (t.includes('medevac')) return { label: 'MEDEVAC', color: 'bg-red-100 text-red-700' };
    return { label: type.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">AI Conversations & Requests ({chats.length})</h2>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All ({chats.length})
        </button>
        <button
          onClick={() => setFilter('with_requests')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'with_requests'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          With Requests ({withRequestsCount})
        </button>
        <button
          onClick={() => setFilter('no_requests')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'no_requests'
              ? 'bg-gray-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          No Requests ({noRequestsCount})
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : filteredChats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border"><Sparkles className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500">{filter === 'all' ? 'No AI conversations found' : filter === 'with_requests' ? 'No conversations with requests' : 'All conversations have requests'}</p></div>
      ) : (
        <div className="space-y-3">
          {filteredChats.map((c, i) => {
            const isExpanded = expandedChat === c.id;
            const messages = c.messages || [];
            const messageCount = Array.isArray(messages) ? messages.length : 0;
            const chatNumber = c.originalNumber;
            const linkedRequests = findLinkedRequests(c);
            const isNew = isNewChat(c);
            const viewedBy = c.metadata?._viewed_by;

            return (
              <div key={i} className={`bg-white rounded-xl border overflow-hidden ${isNew ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}`}>
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    if (isNew) markAsViewed(c.id, c.metadata);
                    setExpandedChat(isExpanded ? null : c.id);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm relative">
                      #{chatNumber}
                      {isNew && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded font-mono">
                          {c.id?.slice(0, 8).toUpperCase()}
                        </span>
                        {isNew && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded">NEW</span>
                        )}
                        <p className="text-sm font-medium text-gray-900">{c.title || 'AI Conversation'}</p>
                        {viewedBy && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <Eye size={10} /> {viewedBy.split('@')[0]}
                          </span>
                        )}
                        {linkedRequests.length > 0 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                            {linkedRequests.length} REQUEST{linkedRequests.length > 1 ? 'S' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{c.users?.full_name || c.users?.name || c.users?.email?.split('@')[0] || 'Unknown'}</span>
                        {' • '}{c.users?.email || c.user_id?.slice(0, 8)}
                      </p>
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
                    {/* CONVERSATION */}
                    <p className="text-xs font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                      <MessageSquare size={14} /> CONVERSATION ({messageCount} messages)
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto mb-4 bg-white rounded-lg border p-3">
                      {Array.isArray(messages) && messages.length > 0 ? messages.map((msg, idx) => (
                        <div key={idx} className={`p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50 border-l-4 border-gray-300'}`}>
                          <span className={`text-[10px] font-bold uppercase ${msg.role === 'user' ? 'text-blue-600' : 'text-gray-500'}`}>
                            {msg.role === 'user' ? 'USER' : 'AI'}:
                          </span>
                          <span className="ml-2 text-gray-800">{(msg.content || msg.text || '').slice(0, 300)}{(msg.content || msg.text || '').length > 300 ? '...' : ''}</span>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500 italic">No messages</p>
                      )}
                    </div>

                    {/* LINKED REQUESTS */}
                    {linkedRequests.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <ShoppingCart size={14} /> SUBMITTED REQUESTS ({linkedRequests.length})
                        </p>
                        <div className="space-y-2">
                          {linkedRequests.map((req, idx) => {
                            const items = req.cart_items || req.data?.items || [];
                            const serviceInfo = getServiceInfo(req.type || req.service_type);
                            return (
                              <div key={idx} className="bg-white rounded-lg border-2 border-green-200 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${serviceInfo.color}`}>
                                      {serviceInfo.label}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(req.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <StatusBadge status={req.status} />
                                </div>
                                {items.length > 0 && (
                                  <div className="space-y-1">
                                    {items.slice(0, 3).map((item, iidx) => (
                                      <div key={iidx} className="text-sm text-gray-700 flex justify-between">
                                        <span>{item.name || item.title || item.type || 'Item'}</span>
                                        <span className="font-medium">{item.total_price ? `$${item.total_price.toLocaleString()}` : '-'}</span>
                                      </div>
                                    ))}
                                    {items.length > 3 && (
                                      <p className="text-xs text-gray-400">+{items.length - 3} more items</p>
                                    )}
                                  </div>
                                )}
                                {req.cart_total || req.data?.total ? (
                                  <div className="mt-2 pt-2 border-t flex justify-between">
                                    <span className="text-sm font-medium">Total</span>
                                    <span className="text-sm font-bold text-green-700">
                                      ${(req.cart_total || req.data?.total || 0).toLocaleString()}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {linkedRequests.length === 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                        No request submitted from this conversation yet
                      </div>
                    )}

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
// SUPPORT SECTION - WITH FULL MESSAGE CONTENT & STATUS MANAGEMENT
// ============================================
const SupportSection = ({ tickets, refreshing, onRefresh, supabaseAdmin, currentAdminEmail }) => {
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [markingViewed, setMarkingViewed] = useState(null);

  // Mark ticket as viewed by admin
  const markAsViewed = async (ticketId, ticketData) => {
    if (!supabaseAdmin || !currentAdminEmail) return;
    // Skip if already viewed
    if (ticketData?._viewed_by) return;

    try {
      setMarkingViewed(ticketId);
      const updatedData = {
        ...(ticketData || {}),
        _viewed_by: currentAdminEmail,
        _viewed_at: new Date().toISOString()
      };

      await supabaseAdmin
        .from('support_tickets')
        .update({ ticket_data: updatedData })
        .eq('id', ticketId);

      onRefresh();
    } catch (err) {
      console.error('Error marking ticket as viewed:', err);
    } finally {
      setMarkingViewed(null);
    }
  };

  // Check if ticket is new (unviewed)
  const isNewTicket = (t) => !t.ticket_data?._viewed_by;

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      normal: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return colors[priority?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  // Get client display name
  const getClientName = (t) => {
    return t.users?.full_name || t.users?.name || t.ticket_data?.user_name ||
           `${t.users?.first_name || ''} ${t.users?.last_name || ''}`.trim() ||
           t.users?.email?.split('@')[0] || 'Unknown Client';
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin not available');
      return;
    }
    try {
      setUpdatingStatus(ticketId);

      // Build update object - only include status field as the minimum
      const updateData = { status: newStatus };

      // Try to update with just status first (most reliable)
      const { error } = await supabaseAdmin
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) {
        console.error('Support ticket update error:', error);
        throw error;
      }

      onRefresh(); // Refresh the list
    } catch (err) {
      console.error('Error updating ticket status:', err);
      alert(`Failed to update ticket status: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Using standard status values that match support_tickets_status_check constraint
  const statusOptions = [
    { value: 'open', label: 'Open', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-700' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-700' }
  ];

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
            const clientName = getClientName(t);
            const isNew = isNewTicket(t);
            const viewedBy = t.ticket_data?._viewed_by;

            return (
              <div key={i} className={`bg-white rounded-xl border overflow-hidden ${isNew ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}`}>
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    if (isNew) markAsViewed(t.id, t.ticket_data);
                    setExpandedTicket(isExpanded ? null : t.id);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center relative">
                      <Ticket size={18} className="text-orange-600" />
                      {isNew && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{t.subject || 'No Subject'}</p>
                        {isNew && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded">NEW</span>
                        )}
                        {viewedBy && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <Eye size={10} /> {viewedBy.split('@')[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{clientName}</span> • {t.users?.email || '-'} • {t.type || 'general'}
                      </p>
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
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">User Name</p>
                        <p className="text-sm font-medium text-gray-900">{t.ticket_data?.user_name || t.users?.email?.split('@')[0] || 'Unknown'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">User Email</p>
                        <p className="text-sm font-medium text-gray-900">{t.ticket_data?.user_email || t.users?.email || 'Unknown'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Category</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{t.ticket_data?.category || t.tags?.[0] || 'General'}</p>
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

                    {/* Status Management */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-3">Update Ticket Status</p>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={(e) => { e.stopPropagation(); updateTicketStatus(t.id, opt.value); }}
                            disabled={updatingStatus === t.id || t.status === opt.value}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              t.status === opt.value
                                ? `${opt.color} ring-2 ring-offset-1 ring-gray-400`
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } ${updatingStatus === t.id ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            {updatingStatus === t.id ? '...' : opt.label}
                          </button>
                        ))}
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
      <div className="flex flex-col gap-1 items-end">
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${isRepeatCustomer(customer) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
          {isRepeatCustomer(customer) ? 'Repeat' : 'New'}
        </span>
        <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${customer.provider === 'google' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {customer.provider === 'google' ? '🔵 Google' : '✉️ Email'}
        </span>
      </div>
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

    <div className="grid grid-cols-4 gap-2 mb-3 text-center">
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
      <div className="p-2 bg-purple-50 rounded-lg">
        <p className="text-lg font-semibold text-purple-600">{(customer.profile?.pvcx_balance || 0).toLocaleString()}</p>
        <p className="text-[10px] text-purple-500">PVCX</p>
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
          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Provider</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Country</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Bookings</th>
          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Requests</th>
          <th className="text-center px-4 py-3 text-xs font-medium text-purple-500 uppercase">PVCX</th>
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
            <td className="px-4 py-3 text-center">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${c.provider === 'google' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {c.provider === 'google' ? 'Google' : 'Email'}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{c.profile?.phone || 'Not provided'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{c.profile?.country || 'Not provided'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{new Date(c.created_at).toLocaleDateString()}</td>
            <td className="px-4 py-3 text-center"><span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">{c.bookings?.length || 0}</span></td>
            <td className="px-4 py-3 text-center"><span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">{c.requests?.length || 0}</span></td>
            <td className="px-4 py-3 text-center"><span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">{(c.profile?.pvcx_balance || 0).toLocaleString()}</span></td>
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
  const [data, setData] = useState({ bookings: [], requests: [], aiChats: [], supportTickets: [], transactions: [], subscriptions: [], kycApps: [], userProfile: null });
  const [updatingKyc, setUpdatingKyc] = useState(false);

  const fetchAllUserData = async () => {
    setLoading(true);
    try {
      const [{ data: bookings }, { data: requests }, { data: aiChats }, { data: supportTickets }, { data: transactions }, { data: subscriptions }, { data: kycApps }, { data: userProfile }] = await Promise.all([
        supabaseAdmin.from('user_bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabaseAdmin.from('user_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabaseAdmin.from('ai_chat_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabaseAdmin.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabaseAdmin.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabaseAdmin.from('user_subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabaseAdmin.from('kyc_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabaseAdmin.from('user_profiles').select('kyc_status, kyc_hash, kyc_verified_at, verification_level').eq('user_id', user.id).maybeSingle()
      ]);
      setData({ bookings: bookings || [], requests: requests || [], aiChats: aiChats || [], supportTickets: supportTickets || [], transactions: transactions || [], subscriptions: subscriptions || [], kycApps: kycApps || [], userProfile: userProfile });
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAllUserData();
  }, [user.id]);

  // Update KYC status
  const updateKycStatus = async (newStatus, newLevel) => {
    setUpdatingKyc(true);
    try {
      const updateData = {
        kyc_status: newStatus,
        verification_level: newLevel,
        updated_at: new Date().toISOString()
      };
      if (newStatus === 'verified') {
        updateData.kyc_verified_at = new Date().toISOString();
      }

      // Check if user_profile exists
      const { data: existing } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin.from('user_profiles').update(updateData).eq('user_id', user.id);
      } else {
        await supabaseAdmin.from('user_profiles').insert({ user_id: user.id, ...updateData });
      }

      // Refresh data
      fetchAllUserData();
    } catch (err) {
      console.error('Error updating KYC:', err);
      alert('Failed to update KYC status');
    } finally {
      setUpdatingKyc(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'kyc', label: 'KYC', icon: ShieldCheck },
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
                  {data.userProfile?.kyc_status === 'verified' ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1"><ShieldCheck size={12} /> KYC Verified (L{data.userProfile?.verification_level || 0})</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1"><ShieldAlert size={12} /> KYC Pending</span>
                  )}
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
              {activeTab === 'kyc' && (
                <div className="space-y-6">
                  {/* Current KYC Status */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <ShieldCheck size={18} /> KYC Verification Status
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                          data.userProfile?.kyc_status === 'verified'
                            ? 'bg-green-100 text-green-700'
                            : data.userProfile?.kyc_status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {data.userProfile?.kyc_status === 'verified' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                          {data.userProfile?.kyc_status?.charAt(0).toUpperCase() + data.userProfile?.kyc_status?.slice(1) || 'Pending'}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Verification Level</p>
                        <p className="text-2xl font-semibold text-gray-900">Level {data.userProfile?.verification_level || 0}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Verified At</p>
                        <p className="text-sm font-medium text-gray-900">
                          {data.userProfile?.kyc_verified_at
                            ? new Date(data.userProfile.kyc_verified_at).toLocaleString()
                            : 'Not verified yet'}
                        </p>
                      </div>
                    </div>

                    {/* KYC Hash */}
                    {data.userProfile?.kyc_hash && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                        <p className="text-xs text-gray-500 mb-1">KYC Hash</p>
                        <p className="text-sm font-mono text-gray-900 break-all">{data.userProfile.kyc_hash}</p>
                      </div>
                    )}

                    {/* Admin Controls */}
                    <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-4">Admin Controls</p>

                      <div className="space-y-4">
                        {/* Status Change */}
                        <div>
                          <p className="text-xs text-gray-600 mb-2">Change KYC Status:</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateKycStatus('pending', 0)}
                              disabled={updatingKyc || data.userProfile?.kyc_status === 'pending'}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                data.userProfile?.kyc_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                              } ${updatingKyc ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              Pending
                            </button>
                            <button
                              onClick={() => updateKycStatus('verified', 1)}
                              disabled={updatingKyc || (data.userProfile?.kyc_status === 'verified' && data.userProfile?.verification_level === 1)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                data.userProfile?.kyc_status === 'verified' && data.userProfile?.verification_level === 1
                                  ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                              } ${updatingKyc ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              Verified (L1)
                            </button>
                            <button
                              onClick={() => updateKycStatus('verified', 2)}
                              disabled={updatingKyc || (data.userProfile?.kyc_status === 'verified' && data.userProfile?.verification_level === 2)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                data.userProfile?.kyc_status === 'verified' && data.userProfile?.verification_level === 2
                                  ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                              } ${updatingKyc ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              Verified (L2)
                            </button>
                            <button
                              onClick={() => updateKycStatus('verified', 3)}
                              disabled={updatingKyc || (data.userProfile?.kyc_status === 'verified' && data.userProfile?.verification_level === 3)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                data.userProfile?.kyc_status === 'verified' && data.userProfile?.verification_level === 3
                                  ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                              } ${updatingKyc ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              Verified (L3)
                            </button>
                            <button
                              onClick={() => updateKycStatus('rejected', 0)}
                              disabled={updatingKyc || data.userProfile?.kyc_status === 'rejected'}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                data.userProfile?.kyc_status === 'rejected'
                                  ? 'bg-red-100 text-red-700 ring-2 ring-red-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                              } ${updatingKyc ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              Rejected
                            </button>
                            {updatingKyc && <Loader2 size={18} className="animate-spin text-blue-600 ml-2" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KYC Applications History */}
                  {data.kycApps.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-medium text-gray-900 mb-4">KYC Application History</h3>
                      <div className="space-y-3">
                        {data.kycApps.map((app, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">Application #{app.id?.slice(0, 8)}</span>
                              <StatusBadge status={app.status} />
                            </div>
                            <p className="text-xs text-gray-500">Submitted: {new Date(app.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

// ============================================
// WINES INVENTORY SECTION
// ============================================
const WinesSection = ({ wines, refreshing, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedWine, setExpandedWine] = useState(null);

  const filteredWines = wines.filter(wine =>
    wine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wine.producer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wine.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wine.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (wine) => {
    if (wine.price_range_eur) return wine.price_range_eur;
    if (wine.typical_price_eur) return `€${wine.typical_price_eur.toLocaleString()}`;
    if (wine.price_usd) return `$${wine.price_usd.toLocaleString()}`;
    if (wine.price) return `€${wine.price.toLocaleString()}`;
    return 'Price on request';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Wines Inventory</h2>
          <p className="text-sm text-gray-500">Total: {wines.length} wines in database - Click card to view full details</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search wines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <button onClick={onRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">
            <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Wine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWines.map((wine) => {
          const isExpanded = expandedWine === wine.id;
          return (
            <div
              key={wine.id}
              className={`bg-white rounded-xl border ${isExpanded ? 'border-rose-300 ring-2 ring-rose-100' : 'border-gray-200'} overflow-hidden hover:shadow-lg transition-all cursor-pointer`}
              onClick={() => setExpandedWine(isExpanded ? null : wine.id)}
            >
              <div className="flex">
                {wine.image_url ? (
                  <img src={wine.image_url} alt={wine.name} className="w-24 h-32 object-cover" />
                ) : (
                  <div className="w-24 h-32 bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                    <Wine className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{wine.name}</h3>
                      {wine.vintage && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{wine.vintage}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {wine.is_active !== false && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                      )}
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{wine.producer}</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="capitalize">{wine.type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Region:</span>
                      <span>{wine.region || wine.country || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-bold text-lg text-green-600">{formatPrice(wine)}</span>
                    </div>
                    {wine.rating_points && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rating:</span>
                        <span className="font-medium">{wine.rating_points} pts</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                  {/* Price Details */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                      <DollarSign size={14} /> PRICING INFORMATION
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {wine.typical_price_eur && (
                        <div><span className="text-gray-500">Typical Price:</span> <span className="font-bold text-green-700">€{wine.typical_price_eur.toLocaleString()}</span></div>
                      )}
                      {wine.price_range_eur && (
                        <div><span className="text-gray-500">Price Range:</span> <span className="font-bold text-green-700">{wine.price_range_eur}</span></div>
                      )}
                      {wine.price_usd && (
                        <div><span className="text-gray-500">USD Price:</span> <span className="font-bold text-green-700">${wine.price_usd.toLocaleString()}</span></div>
                      )}
                      {wine.price && (
                        <div><span className="text-gray-500">Base Price:</span> <span className="font-bold text-green-700">€{wine.price.toLocaleString()}</span></div>
                      )}
                      {wine.bottle_size && (
                        <div><span className="text-gray-500">Bottle Size:</span> <span className="font-medium">{wine.bottle_size}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Wine Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Producer</p>
                      <p className="text-sm font-medium">{wine.producer || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Country</p>
                      <p className="text-sm font-medium">{wine.country || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Region/Appellation</p>
                      <p className="text-sm font-medium">{wine.region || wine.appellation || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Grape Variety</p>
                      <p className="text-sm font-medium">{wine.grape_variety || wine.varietal || 'N/A'}</p>
                    </div>
                    {wine.alcohol_content && (
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Alcohol</p>
                        <p className="text-sm font-medium">{wine.alcohol_content}%</p>
                      </div>
                    )}
                    {wine.vintage && (
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Vintage</p>
                        <p className="text-sm font-medium">{wine.vintage}</p>
                      </div>
                    )}
                  </div>

                  {/* Full Description */}
                  {(wine.description || wine.tasting_notes) && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-rose-800 mb-2 flex items-center gap-1">
                        <FileText size={14} /> FULL DESCRIPTION
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {wine.description || wine.tasting_notes}
                      </p>
                    </div>
                  )}

                  {/* Tasting Notes (separate if both exist) */}
                  {wine.description && wine.tasting_notes && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-purple-800 mb-2">TASTING NOTES</h4>
                      <p className="text-sm text-gray-700">{wine.tasting_notes}</p>
                    </div>
                  )}

                  {/* Food Pairing */}
                  {wine.food_pairing && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-amber-800 mb-2">FOOD PAIRING</h4>
                      <p className="text-sm text-gray-700">{wine.food_pairing}</p>
                    </div>
                  )}

                  {/* Stock Info */}
                  {(wine.stock_quantity !== undefined || wine.availability) && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${wine.stock_quantity > 0 || wine.availability === 'in_stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {wine.stock_quantity !== undefined ? `${wine.stock_quantity} in stock` : wine.availability}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredWines.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Wine className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No wines found</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// CIGARS INVENTORY SECTION
// ============================================
const CigarsSection = ({ cigars, refreshing, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCigar, setExpandedCigar] = useState(null);

  const filteredCigars = cigars.filter(cigar =>
    cigar.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cigar.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cigar.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cigar.strength?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (cigar) => {
    if (cigar.price_per_stick_usd) return `$${cigar.price_per_stick_usd}`;
    if (cigar.price_per_stick) return `$${cigar.price_per_stick}`;
    if (cigar.price_range) return cigar.price_range;
    if (cigar.price) return `$${cigar.price}`;
    return 'Price on request';
  };

  const formatBoxPrice = (cigar) => {
    if (cigar.price_per_box_usd) return `$${cigar.price_per_box_usd}`;
    if (cigar.box_price) return `$${cigar.box_price}`;
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Premium Cigars & Delicacies</h2>
          <p className="text-sm text-gray-500">Total: {cigars.length} items in database - Click card to view full details</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search cigars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button onClick={onRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">
            <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Cigar Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCigars.map((cigar) => {
          const isExpanded = expandedCigar === cigar.id;
          const boxPrice = formatBoxPrice(cigar);
          return (
            <div
              key={cigar.id}
              className={`bg-white rounded-xl border ${isExpanded ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-200'} overflow-hidden hover:shadow-lg transition-all cursor-pointer`}
              onClick={() => setExpandedCigar(isExpanded ? null : cigar.id)}
            >
              <div className="flex">
                {cigar.image_url ? (
                  <img src={cigar.image_url} alt={cigar.name} className="w-24 h-28 object-cover" />
                ) : (
                  <div className="w-24 h-28 bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center">
                    <Cigarette className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{cigar.brand}</h3>
                      <p className="text-xs text-gray-600">{cigar.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {cigar.is_active !== false && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                      )}
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Origin:</span>
                      <span>{cigar.origin || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Strength:</span>
                      <span className="capitalize">{cigar.strength || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Price/Stick:</span>
                      <span className="font-bold text-lg text-green-600">{formatPrice(cigar)}</span>
                    </div>
                    {boxPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Box Price:</span>
                        <span className="font-semibold text-green-600">{boxPrice}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                  {/* Price Details */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                      <DollarSign size={14} /> PRICING INFORMATION
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Per Stick:</span> <span className="font-bold text-green-700">{formatPrice(cigar)}</span></div>
                      {boxPrice && (
                        <div><span className="text-gray-500">Per Box:</span> <span className="font-bold text-green-700">{boxPrice}</span></div>
                      )}
                      {cigar.box_count && (
                        <div><span className="text-gray-500">Sticks/Box:</span> <span className="font-medium">{cigar.box_count}</span></div>
                      )}
                      {cigar.price_range && (
                        <div><span className="text-gray-500">Price Range:</span> <span className="font-bold text-green-700">{cigar.price_range}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Cigar Specifications */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Brand</p>
                      <p className="text-sm font-medium">{cigar.brand || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Origin</p>
                      <p className="text-sm font-medium">{cigar.origin || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Strength</p>
                      <p className="text-sm font-medium capitalize">{cigar.strength || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Wrapper</p>
                      <p className="text-sm font-medium">{cigar.wrapper || 'N/A'}</p>
                    </div>
                    {cigar.ring_gauge && (
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Ring Gauge</p>
                        <p className="text-sm font-medium">{cigar.ring_gauge}</p>
                      </div>
                    )}
                    {cigar.length && (
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Length</p>
                        <p className="text-sm font-medium">{cigar.length}"</p>
                      </div>
                    )}
                    {cigar.vitola && (
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Vitola/Shape</p>
                        <p className="text-sm font-medium">{cigar.vitola}</p>
                      </div>
                    )}
                    {cigar.filler && (
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Filler</p>
                        <p className="text-sm font-medium">{cigar.filler}</p>
                      </div>
                    )}
                    {cigar.binder && (
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Binder</p>
                        <p className="text-sm font-medium">{cigar.binder}</p>
                      </div>
                    )}
                  </div>

                  {/* Flavor Profile */}
                  {cigar.flavor_profile && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                        <Sparkles size={14} /> FLAVOR PROFILE
                      </h4>
                      <p className="text-sm text-gray-700">{cigar.flavor_profile}</p>
                    </div>
                  )}

                  {/* Full Description */}
                  {(cigar.description || cigar.notes) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-1">
                        <FileText size={14} /> FULL DESCRIPTION
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {cigar.description || cigar.notes}
                      </p>
                    </div>
                  )}

                  {/* Pairing Suggestions */}
                  {cigar.pairing_suggestions && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-purple-800 mb-2">PAIRING SUGGESTIONS</h4>
                      <p className="text-sm text-gray-700">{cigar.pairing_suggestions}</p>
                    </div>
                  )}

                  {/* Stock Info */}
                  {(cigar.stock_quantity !== undefined || cigar.availability) && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${cigar.stock_quantity > 0 || cigar.availability === 'in_stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {cigar.stock_quantity !== undefined ? `${cigar.stock_quantity} in stock` : cigar.availability}
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  {cigar.rating && (
                    <div className="flex items-center gap-2 text-xs">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium">{cigar.rating}/100</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCigars.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Cigarette className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No cigars found</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// UNIFIED CUSTOMER ACTIVITY SECTION
// Combines: Bookings, Empty Legs, Requests, AI Cart Requests
// ============================================
const UnifiedActivitySection = ({
  bookings,
  emptyLegBookings,
  requests,
  chatRequests,
  refreshing,
  onRefreshBookings,
  onRefreshEmptyLegs,
  onRefreshRequests,
  onRefreshChatRequests,
  supabaseAdmin,
  sidebarCounts,
  currentAdminEmail
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedItem, setExpandedItem] = useState(null);
  const [markingViewed, setMarkingViewed] = useState(null);

  // Mark an entry as viewed by the current admin
  const markAsViewed = async (item) => {
    if (!supabaseAdmin || !currentAdminEmail) return;

    // Determine table and data field based on source
    let table, dataField, currentData;
    if (item._source === 'booking') {
      table = 'user_bookings';
      dataField = 'booking_data';
      currentData = item.booking_data || {};
    } else if (item._source === 'request') {
      table = 'user_requests';
      dataField = 'data';
      currentData = item.data || {};
    } else if (item._source === 'cart') {
      table = 'chat_requests';
      dataField = 'data';
      currentData = item.data || {};
    } else {
      return;
    }

    // Skip if already viewed
    if (currentData._viewed_by) return;

    try {
      setMarkingViewed(item.id);
      const updatedData = {
        ...currentData,
        _viewed_by: currentAdminEmail,
        _viewed_at: new Date().toISOString()
      };

      await supabaseAdmin
        .from(table)
        .update({ [dataField]: updatedData })
        .eq('id', item.id);

      // Refresh the appropriate data
      if (item._source === 'booking') onRefreshBookings();
      else if (item._source === 'request') onRefreshRequests();
      else if (item._source === 'cart') onRefreshChatRequests();
    } catch (err) {
      console.error('Error marking entry as viewed:', err);
    } finally {
      setMarkingViewed(null);
    }
  };

  // Check if item is new (unviewed)
  const isNewItem = (item) => {
    if (item._source === 'booking') return !item.booking_data?._viewed_by;
    if (item._source === 'request') return !item.data?._viewed_by;
    if (item._source === 'cart') return !item.data?._viewed_by;
    return false;
  };

  // Get who viewed the item
  const getViewedBy = (item) => {
    if (item._source === 'booking') return item.booking_data?._viewed_by;
    if (item._source === 'request') return item.data?._viewed_by;
    if (item._source === 'cart') return item.data?._viewed_by;
    return null;
  };

  // Refresh all data
  const handleRefreshAll = () => {
    onRefreshBookings();
    onRefreshEmptyLegs();
    onRefreshRequests();
    onRefreshChatRequests();
  };

  // Tab configuration
  const tabs = [
    { id: 'all', label: 'All Activity', count: (bookings?.length || 0) + (requests?.length || 0) + (chatRequests?.length || 0) },
    { id: 'bookings', label: 'Paid Bookings', count: sidebarCounts?.bookings || bookings?.length || 0 },
    { id: 'requests', label: 'Requests', count: sidebarCounts?.requests || requests?.length || 0 },
    { id: 'cart', label: 'AI Cart', count: sidebarCounts?.chatRequests || chatRequests?.length || 0 },
  ];

  // Merge all data into unified timeline
  const getAllActivity = () => {
    const all = [];

    // Add bookings
    (bookings || []).forEach(b => {
      all.push({
        ...b,
        _source: 'booking',
        _date: b.created_at,
        _status: b.payment_status || 'paid',
        _type: b.service_type
      });
    });

    // Add requests
    (requests || []).forEach(r => {
      all.push({
        ...r,
        _source: 'request',
        _date: r.created_at,
        _status: r.status || 'pending',
        _type: r.service_type
      });
    });

    // Add AI cart requests
    (chatRequests || []).forEach(c => {
      all.push({
        ...c,
        _source: 'cart',
        _date: c.created_at,
        _status: c.status || 'pending',
        _type: c.service_type
      });
    });

    // Sort by date (newest first)
    return all.sort((a, b) => new Date(b._date) - new Date(a._date));
  };

  // Filter by active tab
  const getFilteredActivity = () => {
    const all = getAllActivity();
    if (activeTab === 'all') return all;
    if (activeTab === 'bookings') return all.filter(a => a._source === 'booking');
    if (activeTab === 'requests') return all.filter(a => a._source === 'request');
    if (activeTab === 'cart') return all.filter(a => a._source === 'cart');
    return all;
  };

  const filteredActivity = getFilteredActivity();

  // Get icon based on service type
  const getIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('jet') || t.includes('flight') || t.includes('empty')) return Plane;
    if (t.includes('helicopter') || t.includes('heli')) return Zap;
    if (t.includes('car') || t.includes('ground') || t.includes('transfer')) return Car;
    if (t.includes('yacht') || t.includes('boat')) return Ship;
    return Package;
  };

  // Get status badge
  const getStatusBadge = (item) => {
    const status = item._status?.toLowerCase();
    const source = item._source;

    if (source === 'booking' && status === 'paid') {
      return { label: 'PAID', color: 'bg-green-100 text-green-700' };
    }
    if (status === 'completed') {
      return { label: 'COMPLETED', color: 'bg-green-100 text-green-700' };
    }
    if (status === 'in_progress') {
      return { label: 'IN PROGRESS', color: 'bg-blue-100 text-blue-700' };
    }
    if (status === 'pending' || status === 'pending_crypto') {
      return { label: 'PENDING', color: 'bg-yellow-100 text-yellow-700' };
    }
    if (status === 'cancelled' || status === 'failed') {
      return { label: 'CANCELLED', color: 'bg-red-100 text-red-700' };
    }
    return { label: source.toUpperCase(), color: 'bg-gray-100 text-gray-700' };
  };

  // Get source badge
  const getSourceBadge = (source) => {
    if (source === 'booking') return { label: 'Booking', color: 'bg-emerald-50 text-emerald-600' };
    if (source === 'request') return { label: 'Request', color: 'bg-blue-50 text-blue-600' };
    if (source === 'cart') return { label: 'AI Cart', color: 'bg-purple-50 text-purple-600' };
    return { label: 'Unknown', color: 'bg-gray-50 text-gray-600' };
  };

  // Get display info from item
  const getDisplayInfo = (item) => {
    const data = item.booking_data || item.data || item.details || item.cart_items || {};
    return {
      title: item.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service',
      from: data.from || data.origin || item.origin || '-',
      to: data.to || data.destination || item.destination || '-',
      date: data.departure_date || data.date || item.departure_date,
      passengers: data.passengers || item.passengers,
      price: item.total_amount || item.total_price || data.price || item.budget,
      email: item.users?.email || item.user_email || item.contact_email
    };
  };

  return (
    <div>
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Activity List */}
      {refreshing ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredActivity.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
          <Package className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No activity found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivity.slice(0, 50).map((item, idx) => {
            const isExpanded = expandedItem === (item.id || idx);
            const Icon = getIcon(item._type);
            const statusBadge = getStatusBadge(item);
            const sourceBadge = getSourceBadge(item._source);
            const info = getDisplayInfo(item);
            const isNew = isNewItem(item);
            const viewedBy = getViewedBy(item);

            return (
              <div key={item.id || idx} className={`bg-white rounded-xl border overflow-hidden ${isNew ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}`}>
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    if (isNew) markAsViewed(item);
                    setExpandedItem(isExpanded ? null : (item.id || idx));
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center relative">
                      <Icon size={18} className="text-white" />
                      {isNew && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{info.title}</p>
                        {isNew && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded">NEW</span>
                        )}
                        {viewedBy && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <Eye size={10} /> {viewedBy.split('@')[0]}
                          </span>
                        )}
                        {info.from !== '-' && info.to !== '-' && (
                          <span className="text-xs text-gray-500">{info.from} → {info.to}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{info.email || item.user_id?.slice(0, 8)}</span>
                        {info.date && (
                          <span className="text-xs text-gray-400">• {new Date(info.date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {info.price && (
                      <span className="text-sm font-semibold text-gray-900">
                        ${Number(info.price).toLocaleString()}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${sourceBadge.color}`}>
                      {sourceBadge.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-gray-400 mb-1">User ID</p>
                        <p className="text-gray-700 font-mono text-[10px]">{item.user_id || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Created</p>
                        <p className="text-gray-700">{new Date(item._date).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Passengers</p>
                        <p className="text-gray-700">{info.passengers || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Status</p>
                        <p className="text-gray-700">{item._status || '-'}</p>
                      </div>
                    </div>
                    {(item.notes || item.special_requests) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-gray-400 text-xs mb-1">Notes</p>
                        <p className="text-gray-700 text-sm">{item.notes || item.special_requests}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// UNIFIED INVENTORY SECTION
// Combines: Empty Legs, Wines, Cigars
// ============================================
const UnifiedInventorySection = ({
  emptyLegs,
  wines,
  cigars,
  refreshing,
  onRefreshEmptyLegs,
  onRefreshWines,
  onRefreshCigars,
  sidebarCounts
}) => {
  const [activeTab, setActiveTab] = useState('empty-legs');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);

  // Refresh all data
  const handleRefreshAll = () => {
    onRefreshEmptyLegs();
    onRefreshWines();
    onRefreshCigars();
  };

  // Tab configuration
  const tabs = [
    { id: 'empty-legs', label: 'Empty Legs', icon: Plane, count: sidebarCounts?.emptyLegsTable || emptyLegs?.length || 0 },
    { id: 'wines', label: 'Wines', icon: Wine, count: sidebarCounts?.wines || wines?.length || 0 },
    { id: 'cigars', label: 'Cigars', icon: Cigarette, count: sidebarCounts?.cigars || cigars?.length || 0 },
  ];

  // Filter items by search
  const filterBySearch = (items, fields) => {
    if (!searchTerm) return items || [];
    const term = searchTerm.toLowerCase();
    return (items || []).filter(item =>
      fields.some(field => item[field]?.toLowerCase().includes(term))
    );
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    if (activeTab === 'empty-legs') {
      return filterBySearch(emptyLegs, ['from_city', 'to_city', 'aircraft_type', 'operator']);
    }
    if (activeTab === 'wines') {
      return filterBySearch(wines, ['name', 'producer', 'region', 'country', 'type']);
    }
    if (activeTab === 'cigars') {
      return filterBySearch(cigars, ['name', 'brand', 'origin', 'wrapper']);
    }
    return [];
  };

  const currentData = getCurrentData();

  return (
    <div>
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {refreshing ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : currentData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
          <Package className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No items found</p>
        </div>
      ) : activeTab === 'empty-legs' ? (
        // Empty Legs - Detailed List View
        <div className="space-y-3">
          {currentData.slice(0, 50).map((item, idx) => {
            const isExpanded = expandedItem === (item.id || idx);
            return (
              <div key={item.id || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header Row - Always visible */}
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedItem(isExpanded ? null : (item.id || idx))}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Plane size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {item.from_city || item.from || 'Origin'} → {item.to_city || item.to || 'Destination'}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          item.status === 'available' ? 'bg-green-100 text-green-700' :
                          item.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                          item.status === 'expired' ? 'bg-red-100 text-red-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {item.status?.toUpperCase() || 'AVAILABLE'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {item.aircraft_type || item.aircraft || 'Aircraft'} • {item.category || 'Jet'}
                        {item.operator && <span className="ml-2 text-blue-600 font-medium">• {item.operator}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ${Number(item.price_usd || item.price || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.departure_date ? new Date(item.departure_date).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {/* Route Details */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-[10px] uppercase text-gray-500 font-medium mb-2">Route</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">From:</span>
                            <span className="font-medium text-gray-900">{item.from_city || item.from || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">IATA:</span>
                            <span className="font-medium text-gray-900">{item.from_iata || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Country:</span>
                            <span className="font-medium text-gray-900">{item.from_country || '-'}</span>
                          </div>
                          <div className="border-t border-gray-100 my-2" />
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">To:</span>
                            <span className="font-medium text-gray-900">{item.to_city || item.to || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">IATA:</span>
                            <span className="font-medium text-gray-900">{item.to_iata || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Country:</span>
                            <span className="font-medium text-gray-900">{item.to_country || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Aircraft Details */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-[10px] uppercase text-gray-500 font-medium mb-2">Aircraft</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-medium text-gray-900">{item.aircraft_type || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Model:</span>
                            <span className="font-medium text-gray-900">{item.aircraft_model || item.aircraft || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Category:</span>
                            <span className="font-medium text-gray-900">{item.category || item.aircraft_category || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Capacity:</span>
                            <span className="font-medium text-gray-900">{item.capacity || item.pax || '-'} pax</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">YOM:</span>
                            <span className="font-medium text-gray-900">{item.yom || item.year_of_manufacture || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Schedule Details */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-[10px] uppercase text-gray-500 font-medium mb-2">Schedule</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Date:</span>
                            <span className="font-medium text-gray-900">
                              {item.departure_date ? new Date(item.departure_date).toLocaleDateString() : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Departure:</span>
                            <span className="font-medium text-gray-900">{item.departure_time || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Arrival:</span>
                            <span className="font-medium text-gray-900">{item.arrival_time || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Flight Time:</span>
                            <span className="font-medium text-gray-900">{item.flight_time || item.duration || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Valid Until:</span>
                            <span className="font-medium text-gray-900">
                              {item.valid_until ? new Date(item.valid_until).toLocaleDateString() : '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Operator */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-[10px] uppercase text-gray-500 font-medium mb-2">Pricing & Operator</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Price USD:</span>
                            <span className="font-bold text-green-600">${Number(item.price_usd || item.price || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Original Price:</span>
                            <span className="font-medium text-gray-900">
                              {item.currency || 'EUR'} {Number(item.price || item.price_eur || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="border-t border-gray-100 my-2" />
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Operator:</span>
                            <span className="font-bold text-blue-600">{item.operator || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Source:</span>
                            <span className="font-medium text-gray-900">{item.source || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">ID:</span>
                            <span className="font-mono text-[10px] text-gray-500">{item.id?.slice(0, 8) || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-[10px] uppercase text-gray-500 font-medium mb-2">Regions</p>
                        <div className="flex gap-4">
                          <div className="text-xs">
                            <span className="text-gray-500">From Continent: </span>
                            <span className="font-medium">{item.from_continent || '-'}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">To Continent: </span>
                            <span className="font-medium">{item.to_continent || '-'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-[10px] uppercase text-gray-500 font-medium mb-2">Metadata</p>
                        <div className="flex gap-4">
                          <div className="text-xs">
                            <span className="text-gray-500">Created: </span>
                            <span className="font-medium">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">Updated: </span>
                            <span className="font-medium">{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes if available */}
                    {(item.notes || item.description || item.special_notes) && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                          <strong>Notes:</strong> {item.notes || item.description || item.special_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {currentData.slice(0, 30).map((item, idx) => {

            // Wines Card
            if (activeTab === 'wines') {
              return (
                <div key={item.id || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                        <Wine size={18} className="text-rose-600" />
                      </div>
                      <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700">
                        {item.type?.toUpperCase() || 'WINE'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{item.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{item.producer || item.region}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.vintage || item.year || '-'}</span>
                      <span className="font-semibold text-gray-900">
                        {item.typical_price_eur || item.price_range_eur
                          ? `€${Number(item.typical_price_eur || 0).toLocaleString()}`
                          : item.price ? `€${Number(item.price).toLocaleString()}` : 'Price on request'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Cigars Card
            if (activeTab === 'cigars') {
              return (
                <div key={item.id || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Cigarette size={18} className="text-amber-600" />
                      </div>
                      {item.rating && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
                          <Star size={10} className="fill-amber-500" />
                          {item.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{item.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{item.brand || item.origin}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.size || item.wrapper || '-'}</span>
                      <span className="font-semibold text-gray-900">
                        {item.price_usd ? `$${Number(item.price_usd).toLocaleString()}` : item.price ? `$${Number(item.price).toLocaleString()}` : 'Price on request'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// AI CHAT REQUESTS SECTION - Cart items from AI Chat
// ============================================
const AiChatRequestsSection = ({ requests, refreshing, onRefresh, supabaseAdmin, currentAdminEmail }) => {
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [markingViewed, setMarkingViewed] = useState(null);

  // Mark request as viewed by admin
  const markAsViewed = async (requestId, currentData) => {
    if (!supabaseAdmin || !currentAdminEmail) return;
    // Skip if already viewed
    if (currentData?._viewed_by) return;

    try {
      setMarkingViewed(requestId);
      const updatedData = {
        ...(currentData || {}),
        _viewed_by: currentAdminEmail,
        _viewed_at: new Date().toISOString()
      };

      await supabaseAdmin
        .from('chat_requests')
        .update({ data: updatedData })
        .eq('id', requestId);

      onRefresh();
    } catch (err) {
      console.error('Error marking request as viewed:', err);
    } finally {
      setMarkingViewed(null);
    }
  };

  // Check if request is new (unviewed)
  const isNewRequest = (r) => !r.data?._viewed_by;

  const updateRequestStatus = async (requestId, newStatus) => {
    if (!supabaseAdmin) return;
    try {
      setUpdatingStatus(requestId);
      const { error } = await supabaseAdmin
        .from('chat_requests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error updating request status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Map service types to display labels and icons
  const getServiceInfo = (type) => {
    if (!type) return { label: 'Service Request', icon: Plane, color: 'bg-gray-100 text-gray-700' };
    const t = type.toLowerCase();
    if (t.includes('jet') || t.includes('private_jet') || t.includes('flight')) {
      return { label: 'Private Jet', icon: Plane, color: 'bg-blue-100 text-blue-700' };
    }
    if (t.includes('helicopter') || t.includes('heli')) {
      return { label: 'Helicopter', icon: Zap, color: 'bg-orange-100 text-orange-700' };
    }
    if (t.includes('yacht') || t.includes('boat')) {
      return { label: 'Yacht Charter', icon: Ship, color: 'bg-cyan-100 text-cyan-700' };
    }
    if (t.includes('car') || t.includes('transfer') || t.includes('ground') || t.includes('luxury_car')) {
      return { label: 'Luxury Car', icon: Car, color: 'bg-purple-100 text-purple-700' };
    }
    if (t.includes('empty') || t.includes('leg')) {
      return { label: 'Empty Leg', icon: Plane, color: 'bg-green-100 text-green-700' };
    }
    return { label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), icon: Plane, color: 'bg-gray-100 text-gray-700' };
  };

  // Extract service types from cart items
  const getServiceTypesFromCart = (cartItems) => {
    const types = new Set();
    cartItems.forEach(item => {
      const itemType = item.type || item.service_type || item.category;
      if (itemType) {
        const info = getServiceInfo(itemType);
        types.add(info.label);
      }
    });
    return Array.from(types);
  };

  // Get user display name
  const getUserDisplayName = (userData) => {
    if (!userData) return null;
    if (userData.name && userData.name.trim()) return userData.name.trim();
    if (userData.full_name && userData.full_name.trim()) return userData.full_name.trim();
    if (userData.first_name || userData.last_name) {
      return `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
    }
    return null;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">AI Chats ({requests.length})</h2>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
          <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No AI chat requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r, i) => {
            const isExpanded = expandedRequest === r.id;
            const cartItems = r.cart_items || [];
            const requestNumber = requests.length - i; // Reverse numbering so newest is highest

            // Get service type - first from main field, then from cart items
            const mainServiceInfo = getServiceInfo(r.service_type);
            const cartServiceTypes = getServiceTypesFromCart(cartItems);
            const primaryServiceLabel = r.service_type ? mainServiceInfo.label : (cartServiceTypes[0] || 'Service Request');
            const ServiceIcon = mainServiceInfo.icon;
            const serviceColor = mainServiceInfo.color;

            // Get user name
            const userName = getUserDisplayName(r.users);
            const userEmail = r.users?.email || '';

            // View tracking
            const isNew = isNewRequest(r);
            const viewedBy = r.data?._viewed_by;

            return (
              <div key={i} className={`bg-white rounded-xl border overflow-hidden ${isNew ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}`}>
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    if (isNew) markAsViewed(r.id, r.data);
                    setExpandedRequest(isExpanded ? null : r.id);
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Request Number Badge */}
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm relative">
                      #{requestNumber}
                      {isNew && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div>
                      {/* Request ID + Service Type Label */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded font-mono">
                          {r.id?.slice(0, 8).toUpperCase()}
                        </span>
                        {isNew && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded">NEW</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${serviceColor}`}>
                          {primaryServiceLabel}
                        </span>
                        {viewedBy && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <Eye size={10} /> {viewedBy.split('@')[0]}
                          </span>
                        )}
                        {cartServiceTypes.length > 1 && (
                          <span className="text-xs text-gray-400">+{cartServiceTypes.length - 1} more</span>
                        )}
                      </div>
                      {/* User Name (prominent) + Email (secondary) */}
                      <div className="flex items-center gap-2 mt-1">
                        {userName ? (
                          <>
                            <p className="text-sm font-medium text-gray-900">{userName}</p>
                            <span className="text-xs text-gray-400">({userEmail})</span>
                          </>
                        ) : (
                          <p className="text-sm text-gray-600">{userEmail || r.user_id?.slice(0, 8)}</p>
                        )}
                        <span className="text-xs text-gray-400">• {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status} />
                    {r.cart_total && (
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">
                        ${Number(r.cart_total).toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                    {/* Request Details */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Customer</p>
                        <p className="text-sm font-bold text-gray-900">{userName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{userEmail}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Service Type</p>
                        <div className="flex flex-wrap gap-1">
                          {cartServiceTypes.length > 0 ? (
                            cartServiceTypes.map((type, idx) => (
                              <span key={idx} className={`px-2 py-0.5 rounded text-xs font-semibold ${getServiceInfo(type).color}`}>
                                {type}
                              </span>
                            ))
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${serviceColor}`}>{primaryServiceLabel}</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Route</p>
                        <p className="text-sm font-medium text-gray-900">{r.from_location || '-'} → {r.to_location || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Dates</p>
                        <p className="text-sm font-medium text-gray-900">
                          {r.date_start ? new Date(r.date_start).toLocaleDateString() : '-'}
                          {r.date_end && ` - ${new Date(r.date_end).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    {/* Conversation History - Full chat that led to this request */}
                    {(() => {
                      // Get conversation from multiple possible sources
                      const conversation = r.conversation_history || r.data?.conversation || [];
                      const hasConversation = conversation?.length > 0;
                      const query = r.query || r.data?.notes;

                      // Debug: log what we have
                      console.log('📋 Request conversation check:', r.id?.slice(0,8), {
                        'r.data exists': !!r.data,
                        'r.data keys': r.data ? Object.keys(r.data) : 'no data',
                        'r.conversation_history': r.conversation_history?.length || 0,
                        'r.data.conversation': r.data?.conversation?.length || 0,
                        'final conversation': conversation?.length || 0
                      });

                      if (!hasConversation && !query) return null;

                      return (
                        <div className="bg-white p-4 rounded-lg border-2 border-indigo-200 mb-4">
                          <p className="text-xs font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                            <MessageSquare size={14} /> CONVERSATION HISTORY ({conversation?.length || 0} messages)
                          </p>
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {hasConversation ? (
                              conversation.filter(msg => msg.role === 'user' || msg.role === 'assistant').map((msg, idx) => (
                                <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold uppercase ${msg.role === 'user' ? 'text-blue-700' : 'text-gray-600'}`}>
                                      {msg.role === 'user' ? 'USER' : 'AI'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content || msg.text || msg.message}</p>
                                </div>
                              ))
                            ) : query ? (
                              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <span className="text-[10px] font-bold uppercase text-blue-700">USER REQUEST</span>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{query}</p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Cart Items - THE MAIN FEATURE */}
                    {cartItems.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border-2 border-green-200 mb-4">
                        <p className="text-xs font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <ShoppingCart size={14} /> CART ITEMS ({cartItems.length})
                        </p>
                        <div className="space-y-2">
                          {cartItems.map((item, idx) => {
                            const itemInfo = getServiceInfo(item.type || item.service_type);
                            const ItemIcon = itemInfo.icon;
                            return (
                              <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${itemInfo.color.split(' ')[0]}`}>
                                    <ItemIcon size={14} className={itemInfo.color.split(' ')[1]} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${itemInfo.color}`}>
                                        {itemInfo.label}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                                      {item.displayTitle || item.name || item.title || 'Service Request'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {item.from || item.origin || ''} {item.to || item.destination ? `→ ${item.to || item.destination}` : ''}
                                      {item.date && ` • ${new Date(item.date).toLocaleDateString()}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {item.price || item.totalWithFee ? `$${Number(item.totalWithFee || item.price || 0).toLocaleString()}` : '-'}
                                  </p>
                                  {item.passengers && (
                                    <p className="text-xs text-gray-500">{item.passengers} pax</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {r.cart_total && (
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-green-200">
                            <span className="text-sm font-medium text-gray-700">Total</span>
                            <span className="text-lg font-bold text-green-700">${Number(r.cart_total).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {['pending', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled'].map(status => (
                        <button
                          key={status}
                          onClick={(e) => { e.stopPropagation(); updateRequestStatus(r.id, status); }}
                          disabled={updatingStatus === r.id || r.status === status}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            r.status === status
                              ? 'bg-indigo-100 text-indigo-700 ring-2 ring-offset-1 ring-indigo-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } ${updatingStatus === r.id ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                      <a
                        href={`mailto:${r.users?.email}?subject=Your PrivatecharterX Request`}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 ml-auto"
                      >
                        <Mail size={14} /> Email User
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
// SPV FORMATION SECTION - Full user details + Claim feature
// ============================================
const SPVFormationSection = ({ formations, refreshing, onRefresh, supabaseAdmin, currentAdminEmail }) => {
  const [expandedFormation, setExpandedFormation] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [claimingId, setClaimingId] = useState(null);

  const updateStatus = async (id, newStatus) => {
    if (!supabaseAdmin) {
      alert('Database connection not available');
      return;
    }
    try {
      setUpdatingStatus(id);
      // Only update status field - most reliable
      const { error } = await supabaseAdmin
        .from('user_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('SPV status update error:', error);
        alert(`Failed to update status: ${error.message}`);
        return;
      }
      onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Claim/Accept a case - stores in data JSON field since claimed_by column may not exist
  const claimCase = async (id, adminEmail) => {
    if (!supabaseAdmin) {
      alert('Database connection not available');
      return;
    }
    if (!adminEmail) {
      alert('Admin email not available');
      return;
    }
    try {
      setClaimingId(id);

      // First get the current data to merge with
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('user_requests')
        .select('data')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching current data:', fetchError);
      }

      // Merge claim info into the data JSON field
      const updatedData = {
        ...(current?.data || {}),
        _claimed_by: adminEmail,
        _claimed_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('user_requests')
        .update({
          status: 'processing',
          data: updatedData
        })
        .eq('id', id);

      if (error) {
        console.error('SPV claim error:', error);
        alert(`Failed to claim case: ${error.message}`);
        return;
      }
      onRefresh();
    } catch (err) {
      console.error('Error claiming case:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setClaimingId(null);
    }
  };

  // Get client display name - uses ACTUAL form field names
  const getClientName = (f) => {
    const data = f.data || {};
    // Try directors first for the main contact
    const firstDirector = data.directors?.[0];
    const directorName = firstDirector?.fullName || '';
    return f.users?.full_name || f.users?.name || directorName ||
           f.users?.email?.split('@')[0] || 'Unknown Client';
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">SPV Formation Requests ({formations.length})</h2>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : formations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
          <Building2 className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No SPV formation requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {formations.map((f, i) => {
            const isExpanded = expandedFormation === f.id;
            const data = f.data || {};
            const clientName = getClientName(f);
            // Get jurisdiction details
            const jurisdictionDetails = data.jurisdictionDetails || {};

            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedFormation(isExpanded ? null : f.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {data.companyName || 'SPV Formation Request'}
                        </p>
                        {data.selectedTier && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            data.selectedTier === 'premium' ? 'bg-purple-100 text-purple-700' :
                            data.selectedTier === 'budget' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {data.selectedTier?.toUpperCase()}
                          </span>
                        )}
                        {(f.claimed_by || data._claimed_by) && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <UserCheck2 size={10} /> {(f.claimed_by || data._claimed_by).split('@')[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{clientName}</span> • {f.users?.email || f.client_email || '-'} • {data.jurisdiction || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={f.status} />
                    <span className="text-xs text-gray-500">{new Date(f.created_at).toLocaleDateString()}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                    {/* CLIENT/CONTACT INFO */}
                    <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                      <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <User size={14} /> Client & Contact Information
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Contact Email</p>
                          <p className="text-sm font-medium text-gray-900">{data.contactEmail || f.users?.email || f.client_email || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Contact Phone</p>
                          <p className="text-sm text-gray-900">{data.contactPhone || f.users?.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Preferred Contact</p>
                          <p className="text-sm text-gray-900 capitalize">{data.preferredContactMethod || 'Email'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Preferred Language</p>
                          <p className="text-sm text-gray-900 capitalize">{data.preferredLanguage || 'English'}</p>
                        </div>
                        {f.users?.subscription_tier && (
                          <div>
                            <p className="text-xs text-gray-500">Subscription</p>
                            <p className="text-sm text-gray-900 capitalize">{f.users.subscription_tier}</p>
                          </div>
                        )}
                        {(f.users?.kyc_verified || f.users?.nft_holder) && (
                          <div className="flex items-center gap-3">
                            {f.users?.kyc_verified && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">KYC</span>
                            )}
                            {f.users?.nft_holder && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">NFT</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SPV COMPANY DETAILS - USING CORRECT FIELD NAMES */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Company Name</p>
                        <p className="text-sm font-medium text-gray-900">{data.companyName || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Jurisdiction</p>
                        <p className="text-sm font-medium text-gray-900">{data.jurisdiction || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Service Tier</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{data.selectedTier || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Business Activity</p>
                        <p className="text-sm font-medium text-gray-900">{data.businessActivity || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Est. Annual Revenue</p>
                        <p className="text-sm font-medium text-gray-900">{data.estimatedAnnualRevenue || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Formation Duration</p>
                        <p className="text-sm font-medium text-gray-900">{jurisdictionDetails.duration || '-'}</p>
                      </div>
                    </div>

                    {/* Jurisdiction Details */}
                    {jurisdictionDetails && (
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Tax Rate</p>
                          <p className="text-sm font-medium text-gray-900">{jurisdictionDetails.tax || '-'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Jurisdiction Description</p>
                          <p className="text-sm text-gray-900">{jurisdictionDetails.description || '-'}</p>
                        </div>
                      </div>
                    )}

                    {/* Company Description */}
                    {data.companyDescription && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Company Description</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.companyDescription}</p>
                      </div>
                    )}

                    {/* DIRECTORS - USING CORRECT FIELD NAMES */}
                    {data.directors && data.directors.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-3">Directors ({data.directors.length})</p>
                        <div className="space-y-3">
                          {data.directors.map((d, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500">Full Name</p>
                                  <p className="text-sm font-medium text-gray-900">{d.fullName || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Nationality</p>
                                  <p className="text-sm text-gray-900">{d.nationality || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Residency</p>
                                  <p className="text-sm text-gray-900">{d.residency || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Email</p>
                                  <p className="text-sm text-gray-900">{d.email || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Phone</p>
                                  <p className="text-sm text-gray-900">{d.phone || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Passport No.</p>
                                  <p className="text-sm text-gray-900">{d.passportNumber || '-'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SHAREHOLDERS - USING CORRECT FIELD NAMES */}
                    {data.shareholders && data.shareholders.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-3">Shareholders ({data.shareholders.length})</p>
                        <div className="space-y-3">
                          {data.shareholders.map((s, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500">Full Name</p>
                                  <p className="text-sm font-medium text-gray-900">{s.fullName || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Nationality</p>
                                  <p className="text-sm text-gray-900">{s.nationality || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Ownership %</p>
                                  <p className="text-sm font-medium text-blue-600">{s.ownership ? `${s.ownership}%` : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Email</p>
                                  <p className="text-sm text-gray-900">{s.email || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Phone</p>
                                  <p className="text-sm text-gray-900">{s.phone || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Passport No.</p>
                                  <p className="text-sm text-gray-900">{s.passportNumber || '-'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ADDITIONAL SERVICES */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-3">Additional Services Requested</p>
                      <div className="flex flex-wrap gap-2">
                        {data.needsNomineeDirector && <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Nominee Director</span>}
                        {data.needsNomineeShareholder && <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Nominee Shareholder</span>}
                        {data.needsBankAccountGuarantee && <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">Bank Account Guarantee</span>}
                        {data.needsAccounting && <span className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">Accounting</span>}
                        {data.needsSubstancePackage && <span className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">Substance Package</span>}
                        {data.needsVATRegistration && <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">VAT Registration</span>}
                        {data.needsExpressService && <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full">Express Service</span>}
                        {data.needsStrategySession && <span className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">Strategy Session</span>}
                        {data.needsDueDiligence && <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Due Diligence</span>}
                        {data.needsLegalConsulting && <span className="px-3 py-1 text-xs bg-pink-100 text-pink-700 rounded-full">Legal Consulting ({data.legalConsultingHours}h)</span>}
                        {data.planningToTokenizeAssets && <span className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">Tokenization Planned</span>}
                        {!data.needsNomineeDirector && !data.needsNomineeShareholder && !data.needsBankAccountGuarantee && !data.needsAccounting &&
                         !data.needsSubstancePackage && !data.needsVATRegistration && !data.needsExpressService && !data.needsStrategySession &&
                         !data.needsDueDiligence && !data.needsLegalConsulting && !data.planningToTokenizeAssets && (
                          <span className="text-xs text-gray-500">No additional services selected</span>
                        )}
                      </div>
                    </div>

                    {/* Full Data (Debug) */}
                    <details className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                      <summary className="text-xs font-semibold text-gray-700 cursor-pointer">Full Form Data (Debug - Click to expand)</summary>
                      <pre className="mt-2 text-xs text-gray-600 overflow-x-auto bg-gray-50 p-3 rounded-lg max-h-60 overflow-y-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </details>

                    {/* Claim/Accept Case */}
                    {!(f.claimed_by || data._claimed_by) && (
                      <div className="bg-yellow-50 rounded-lg p-3 mb-4 border border-yellow-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-yellow-600" />
                          <span className="text-sm text-yellow-800">This case is not yet assigned to anyone</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); claimCase(f.id, currentAdminEmail); }}
                          disabled={claimingId === f.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                          <UserCheck2 size={14} /> {claimingId === f.id ? 'Claiming...' : 'Accept / Take Case'}
                        </button>
                      </div>
                    )}

                    {(f.claimed_by || data._claimed_by) && (
                      <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200 flex items-center gap-2">
                        <UserCheck2 size={16} className="text-green-600" />
                        <span className="text-sm text-green-800">
                          Claimed by <span className="font-medium">{f.claimed_by || data._claimed_by}</span>
                          {(f.claimed_at || data._claimed_at) && <span className="text-green-600"> on {new Date(f.claimed_at || data._claimed_at).toLocaleDateString()}</span>}
                        </span>
                      </div>
                    )}

                    {/* Status Actions - using values allowed by user_requests_status_check constraint */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {['pending', 'processing', 'completed', 'cancelled'].map(status => (
                        <button
                          key={status}
                          onClick={(e) => { e.stopPropagation(); updateStatus(f.id, status); }}
                          disabled={updatingStatus === f.id || f.status === status}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            f.status === status
                              ? 'bg-blue-100 text-blue-700 ring-2 ring-offset-1 ring-blue-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } ${updatingStatus === f.id ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                      ))}
                      <a
                        href={`mailto:${f.users?.email || f.client_email}?subject=Your SPV Formation Request`}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 ml-auto"
                      >
                        <Mail size={14} /> Email User
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
// TOKENIZATION SECTION - Full form data + Claim feature
// ============================================
const TokenizationSection = ({ drafts, refreshing, onRefresh, supabaseAdmin, currentAdminEmail }) => {
  const [expandedDraft, setExpandedDraft] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [claimingId, setClaimingId] = useState(null);

  const updateStatus = async (id, newStatus) => {
    if (!supabaseAdmin) {
      alert('Database connection not available');
      return;
    }
    try {
      setUpdatingStatus(id);
      // Only update status field - most reliable
      const { error } = await supabaseAdmin
        .from('tokenization_drafts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Tokenization status update error:', error);
        alert(`Failed to update status: ${error.message}`);
        return;
      }
      onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Claim/Accept a case - stores in form_data JSON field since claimed_by column may not exist
  const claimCase = async (id, adminEmail) => {
    if (!supabaseAdmin) {
      alert('Database connection not available');
      return;
    }
    if (!adminEmail) {
      alert('Admin email not available');
      return;
    }
    try {
      setClaimingId(id);

      // First get the current form_data to merge with
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('tokenization_drafts')
        .select('form_data')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching current data:', fetchError);
      }

      // Merge claim info into the form_data JSON field
      const updatedFormData = {
        ...(current?.form_data || {}),
        _claimed_by: adminEmail,
        _claimed_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('tokenization_drafts')
        .update({
          status: 'processing',
          form_data: updatedFormData
        })
        .eq('id', id);

      if (error) {
        console.error('Tokenization claim error:', error);
        alert(`Failed to claim case: ${error.message}`);
        return;
      }
      onRefresh();
    } catch (err) {
      console.error('Error claiming case:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setClaimingId(null);
    }
  };

  // Get client display name
  const getClientName = (d) => {
    return d.users?.full_name || d.users?.name ||
           d.users?.email?.split('@')[0] || 'Unknown Client';
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Tokenization Requests ({drafts.length})</h2>
        <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
          <Coins className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No tokenization requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d, i) => {
            const isExpanded = expandedDraft === d.id;
            const clientName = getClientName(d);

            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedDraft(isExpanded ? null : d.id)}
                >
                  <div className="flex items-center gap-4">
                    {d.logo_url ? (
                      <img src={d.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Coins size={18} className="text-purple-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {d.asset_name || 'Unnamed Asset'}
                          {d.token_symbol && <span className="ml-2 text-xs font-mono text-gray-500">${d.token_symbol}</span>}
                        </p>
                        {(d.claimed_by || d.form_data?._claimed_by) && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <UserCheck2 size={10} /> {(d.claimed_by || d.form_data?._claimed_by).split('@')[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{clientName}</span> • {d.users?.email || '-'} • {d.asset_category || d.token_type || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={d.status} />
                    {d.asset_value && (
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-700">
                        €{Number(d.asset_value).toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{new Date(d.created_at).toLocaleDateString()}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                    {/* Header Image */}
                    {d.header_image_url && (
                      <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
                        <img src={d.header_image_url} alt="" className="w-full h-32 object-cover" />
                      </div>
                    )}

                    {/* CLIENT INFO - PROMINENT */}
                    <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
                      <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                        <User size={14} /> Client Information
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="text-sm font-medium text-gray-900">{clientName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm text-gray-900">{d.users?.email || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm text-gray-900">{d.users?.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Country</p>
                          <p className="text-sm text-gray-900">{d.users?.country || d.jurisdiction || '-'}</p>
                        </div>
                        {d.users?.subscription_tier && (
                          <div>
                            <p className="text-xs text-gray-500">Subscription</p>
                            <p className="text-sm text-gray-900 capitalize">{d.users.subscription_tier}</p>
                          </div>
                        )}
                        {(d.users?.kyc_verified || d.users?.nft_holder) && (
                          <div className="flex items-center gap-3">
                            {d.users?.kyc_verified && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">KYC Verified</span>
                            )}
                            {d.users?.nft_holder && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">NFT Holder</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Claim/Accept Case */}
                    {!(d.claimed_by || d.form_data?._claimed_by) && (
                      <div className="bg-yellow-50 rounded-lg p-3 mb-4 border border-yellow-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-yellow-600" />
                          <span className="text-sm text-yellow-800">This case is not yet assigned to anyone</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); claimCase(d.id, currentAdminEmail); }}
                          disabled={claimingId === d.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                          <UserCheck2 size={14} /> {claimingId === d.id ? 'Claiming...' : 'Accept / Take Case'}
                        </button>
                      </div>
                    )}

                    {(d.claimed_by || d.form_data?._claimed_by) && (
                      <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200 flex items-center gap-2">
                        <UserCheck2 size={16} className="text-green-600" />
                        <span className="text-sm text-green-800">
                          Claimed by <span className="font-medium">{d.claimed_by || d.form_data?._claimed_by}</span>
                          {(d.claimed_at || d.form_data?._claimed_at) && <span className="text-green-600"> on {new Date(d.claimed_at || d.form_data?._claimed_at).toLocaleDateString()}</span>}
                        </span>
                      </div>
                    )}

                    {/* Asset Info Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Asset Name</p>
                        <p className="text-sm font-medium text-gray-900">{d.asset_name || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Category</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{d.asset_category || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Asset Value</p>
                        <p className="text-sm font-medium text-gray-900">{d.asset_value ? `€${Number(d.asset_value).toLocaleString()}` : '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="text-sm font-medium text-gray-900">{d.asset_location || '-'}</p>
                      </div>
                    </div>

                    {/* Token Config Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Token Type</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {d.token_type === 'utility' ? 'UTO' : d.token_type === 'security' ? 'STO' : d.token_type || '-'}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Token Symbol</p>
                        <p className="text-sm font-mono font-medium text-gray-900">${d.token_symbol || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Total Supply</p>
                        <p className="text-sm font-medium text-gray-900">{d.total_supply ? Number(d.total_supply).toLocaleString() : '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Price per Token</p>
                        <p className="text-sm font-medium text-gray-900">{d.price_per_token ? `€${Number(d.price_per_token).toLocaleString()}` : '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Expected APY</p>
                        <p className="text-sm font-medium text-green-600">{d.expected_apy ? `${d.expected_apy}%` : '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Lockup Period</p>
                        <p className="text-sm font-medium text-gray-900">{d.lockup_period ? `${d.lockup_period} months` : '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Jurisdiction</p>
                        <p className="text-sm font-medium text-gray-900">{d.jurisdiction || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Package</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{d.membership_package || '-'}</p>
                      </div>
                    </div>

                    {/* Wallet Verification */}
                    {d.wallet_signature && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                        <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <FileCheck size={14} /> WALLET VERIFIED
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Issuer Wallet</p>
                            <p className="text-xs font-mono text-gray-700 break-all">{d.issuer_wallet_address || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Signer</p>
                            <p className="text-xs font-mono text-gray-700 break-all">{d.signer_address || '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {d.asset_description && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Asset Description</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{d.asset_description}</p>
                      </div>
                    )}

                    {/* Documents from form_data */}
                    {d.form_data && (
                      <details className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                        <summary className="text-xs font-semibold text-gray-700 cursor-pointer">Documents & Full Form Data</summary>
                        <div className="mt-3 space-y-2">
                          {d.form_data.prospectus?.url && (
                            <a href={d.form_data.prospectus.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                              <FileText size={14} /> Prospectus
                            </a>
                          )}
                          {d.form_data.legalOpinion?.url && (
                            <a href={d.form_data.legalOpinion.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                              <FileText size={14} /> Legal Opinion
                            </a>
                          )}
                          {d.form_data.ownershipProof?.url && (
                            <a href={d.form_data.ownershipProof.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                              <FileText size={14} /> Ownership Proof
                            </a>
                          )}
                          {d.form_data.insurance?.url && (
                            <a href={d.form_data.insurance.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                              <FileText size={14} /> Insurance
                            </a>
                          )}
                        </div>
                        <pre className="mt-3 text-xs text-gray-600 overflow-x-auto bg-gray-50 p-3 rounded-lg">
                          {JSON.stringify(d.form_data, null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Status Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {['draft', 'submitted', 'in_progress', 'approved', 'rejected'].map(status => (
                        <button
                          key={status}
                          onClick={(e) => { e.stopPropagation(); updateStatus(d.id, status); }}
                          disabled={updatingStatus === d.id || d.status === status}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            d.status === status
                              ? 'bg-purple-100 text-purple-700 ring-2 ring-offset-1 ring-purple-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } ${updatingStatus === d.id ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                      ))}
                      <a
                        href={`mailto:${d.users?.email}?subject=Your Tokenization Request - ${d.asset_name || 'Asset'}`}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 ml-auto"
                      >
                        <Mail size={14} /> Email User
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
// SUBSCRIPTIONS SECTION - All user subscriptions
// ============================================
const SubscriptionsSection = ({ subscriptions, refreshing, onRefresh, supabaseAdmin }) => {
  const [expandedSub, setExpandedSub] = useState(null);
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const getTierColor = (tier) => {
    const t = tier?.toLowerCase();
    if (t === 'elite' || t === 'professional') return 'bg-purple-100 text-purple-700';
    if (t === 'traveller') return 'bg-blue-100 text-blue-700';
    if (t === 'explorer') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === 'active') return 'bg-green-100 text-green-700';
    if (s === 'cancelled' || s === 'expired') return 'bg-red-100 text-red-700';
    if (s === 'past_due') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysUntilRenewal = (resetDate) => {
    if (!resetDate) return null;
    const reset = new Date(resetDate);
    const now = new Date();
    const diff = Math.ceil((reset - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Filter subscriptions
  const filteredSubs = subscriptions.filter(s => {
    if (filterTier !== 'all' && s.subscription_tier?.toLowerCase() !== filterTier) return false;
    if (filterStatus !== 'all' && s.subscription_status?.toLowerCase() !== filterStatus) return false;
    return true;
  });

  // Stats
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.subscription_status === 'active').length,
    elite: subscriptions.filter(s => s.subscription_tier?.toLowerCase() === 'elite').length,
    traveller: subscriptions.filter(s => s.subscription_tier?.toLowerCase() === 'traveller').length,
    explorer: subscriptions.filter(s => s.subscription_tier?.toLowerCase() === 'explorer').length
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Subscriptions ({subscriptions.length})</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All Tiers</option>
            <option value="elite">Elite</option>
            <option value="traveller">Traveller</option>
            <option value="explorer">Explorer</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="past_due">Past Due</option>
          </select>
          <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Crown size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.elite}</p>
              <p className="text-xs text-gray-500">Elite</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plane size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.traveller}</p>
              <p className="text-xs text-gray-500">Traveller</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Globe size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.explorer}</p>
              <p className="text-xs text-gray-500">Explorer</p>
            </div>
          </div>
        </div>
      </div>

      {refreshing ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : filteredSubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
          <Crown className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No subscriptions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubs.map((s, i) => {
            const isExpanded = expandedSub === s.user_id;
            const daysUntilRenewal = getDaysUntilRenewal(s.chats_reset_date);

            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedSub(isExpanded ? null : s.user_id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      s.subscription_tier?.toLowerCase() === 'elite' ? 'bg-purple-100' :
                      s.subscription_tier?.toLowerCase() === 'traveller' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <Crown size={18} className={
                        s.subscription_tier?.toLowerCase() === 'elite' ? 'text-purple-600' :
                        s.subscription_tier?.toLowerCase() === 'traveller' ? 'text-blue-600' : 'text-green-600'
                      } />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {s.users?.email || s.name || s.user_id?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Subscribed {formatDate(s.subscription_started_at || s.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTierColor(s.subscription_tier)}`}>
                      {s.subscription_tier?.toUpperCase() || 'FREE'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(s.subscription_status)}`}>
                      {s.subscription_status?.replace(/_/g, ' ').toUpperCase() || 'INACTIVE'}
                    </span>
                    {daysUntilRenewal !== null && daysUntilRenewal > 0 && daysUntilRenewal <= 7 && (
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                        <RotateCcw size={10} /> {daysUntilRenewal}d
                      </span>
                    )}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                    {/* Subscription Details */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">User Email</p>
                        <p className="text-sm font-medium text-gray-900">{s.users?.email || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Subscription Tier</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{s.subscription_tier || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{s.subscription_status?.replace(/_/g, ' ') || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Stripe Customer</p>
                        <p className="text-xs font-mono text-gray-700">{s.stripe_customer_id || '-'}</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Started</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(s.subscription_started_at || s.created_at)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Current Period Start</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(s.current_period_start)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Current Period End</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(s.current_period_end)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Next Renewal</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {formatDate(s.chats_reset_date)}
                          {daysUntilRenewal !== null && daysUntilRenewal > 0 && (
                            <span className={`text-xs ${daysUntilRenewal <= 7 ? 'text-yellow-600' : 'text-gray-500'}`}>
                              ({daysUntilRenewal} days)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Chats Used</p>
                        <p className="text-sm font-medium text-gray-900">
                          {s.chats_used || 0} / {s.chats_limit === null ? '∞' : s.chats_limit}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">NFT Holder</p>
                        <p className="text-sm font-medium text-gray-900">{s.nft_holder ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">KYC Verified</p>
                        <p className="text-sm font-medium text-gray-900">{s.kyc_verified ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(s.updated_at)}</p>
                      </div>
                    </div>

                    {/* Stripe Subscription ID */}
                    {s.stripe_subscription_id && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                        <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-2">
                          <CreditCard size={14} /> Stripe Subscription
                        </p>
                        <p className="text-xs font-mono text-blue-800">{s.stripe_subscription_id}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <a
                        href={`mailto:${s.users?.email}?subject=Your PrivatecharterX Subscription`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        <Mail size={14} /> Email User
                      </a>
                      {s.stripe_subscription_id && (
                        <a
                          href={`https://dashboard.stripe.com/subscriptions/${s.stripe_subscription_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                        >
                          <CreditCard size={14} /> View in Stripe
                        </a>
                      )}
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
// PVCX TOKENS SECTION - All admins can send tokens
// ============================================
const PVCXSection = ({ balances, transactions, refreshing, onRefresh, supabaseAdmin, currentAdminEmail, customers }) => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [sendSource, setSendSource] = useState('bookings'); // 'bookings' or 'co2'
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('balances');

  // All admins can send tokens (CRM is already admin-only)
  const canSendTokens = true;
  const isEltesto = true; // Allow all CRM admins to send tokens

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Send PVCX tokens to a user
  const sendTokens = async () => {
    if (!supabaseAdmin || !selectedUser || !sendAmount) {
      alert('Please select a user and enter an amount');
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    try {
      setSending(true);

      // Get user's current balance from pvcx_balance table
      const { data: balanceData, error: balanceError } = await supabaseAdmin
        .from('pvcx_balance')
        .select('*')
        .eq('user_id', selectedUser.id)
        .single();

      const currentBalance = parseFloat(balanceData?.balance) || 0;
      const currentFromBookings = parseFloat(balanceData?.earned_from_bookings) || 0;
      const currentFromCO2 = parseFloat(balanceData?.earned_from_co2) || 0;

      // Calculate new values based on source
      const newBalance = currentBalance + amount;
      const newFromBookings = sendSource === 'bookings' ? currentFromBookings + amount : currentFromBookings;
      const newFromCO2 = sendSource === 'co2' ? currentFromCO2 + amount : currentFromCO2;

      // Upsert pvcx_balance with new values
      const { error: updateError } = await supabaseAdmin
        .from('pvcx_balance')
        .upsert({
          user_id: selectedUser.id,
          balance: newBalance,
          earned_from_bookings: newFromBookings,
          earned_from_co2: newFromCO2,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (updateError) {
        console.error('Error updating balance:', updateError);
        alert(`Failed to update balance: ${updateError.message}`);
        return;
      }

      // Also update user_profiles for backwards compatibility
      try {
        await supabaseAdmin
          .from('user_profiles')
          .upsert({
            user_id: selectedUser.id,
            pvcx_balance: newBalance,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } catch (profileErr) {
        console.log('Could not update user_profiles:', profileErr);
      }

      // Try to record transaction
      try {
        await supabaseAdmin
          .from('pvcx_transactions')
          .insert({
            user_id: selectedUser.id,
            amount: amount,
            type: 'credit',
            source: sendSource, // 'bookings' or 'co2'
            note: sendNote || `${sendSource === 'bookings' ? 'Booking reward' : 'CO2 offset reward'} from ${currentAdminEmail}`,
            admin_email: currentAdminEmail,
            balance_after: newBalance,
            created_at: new Date().toISOString()
          });
      } catch (txErr) {
        console.log('Could not record transaction (table may not exist):', txErr);
      }

      // Create notification for user
      try {
        const sourceLabel = sendSource === 'bookings' ? 'booking rewards' : 'CO2 offset rewards';
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: selectedUser.id,
            type: 'pvcx_received',
            title: 'PVCX Tokens Received! 🎉',
            message: `You received ${amount.toLocaleString()} PVCX from ${sourceLabel}. Your new balance is ${newBalance.toLocaleString()} PVCX.`,
            is_read: false,
            created_at: new Date().toISOString()
          });
        console.log('✅ PVCX notification created for user:', selectedUser.id);
      } catch (notifErr) {
        console.error('❌ Could not create notification:', notifErr);
      }

      alert(`Successfully sent ${amount.toLocaleString()} PVCX (${sendSource}) to ${selectedUser.email || selectedUser.name || 'user'}`);
      setShowSendModal(false);
      setSelectedUser(null);
      setSendAmount('');
      setSendNote('');
      setSendSource('bookings');
      onRefresh();
    } catch (err) {
      console.error('Error sending tokens:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Calculate totals
  const totalSupply = balances.reduce((sum, b) => sum + (b.pvcx_balance || b.balance || 0), 0);
  const holdersCount = balances.filter(b => (b.pvcx_balance || b.balance || 0) > 0).length;

  // Filter customers for send modal
  const filteredCustomers = customers.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (c.email?.toLowerCase().includes(term) ||
            c.name?.toLowerCase().includes(term) ||
            c.user_metadata?.name?.toLowerCase().includes(term));
  }).slice(0, 20);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">PVCX Token Management</h2>
          <p className="text-xs text-gray-500">Track and distribute PVCX tokens to users</p>
        </div>
        <div className="flex items-center gap-3">
          {canSendTokens && (
            <button
              onClick={() => setShowSendModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
            >
              <Zap size={16} /> Send Tokens
            </button>
          )}
          <button onClick={onRefresh} disabled={refreshing} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCcw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Total Supply</p>
              <p className="text-3xl font-bold mt-1">{totalSupply.toLocaleString()}</p>
              <p className="text-purple-200 text-xs mt-1">PVCX</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Coins size={28} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Token Holders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{holdersCount}</p>
              <p className="text-gray-500 text-xs mt-1">Users with balance</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={28} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Transactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{transactions.length}</p>
              <p className="text-gray-500 text-xs mt-1">All time</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <Activity size={28} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'balances' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Balances ({balances.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'transactions' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Transactions ({transactions.length})
        </button>
      </div>

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <>
          {refreshing ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
          ) : balances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
              <Coins className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No PVCX holders yet</p>
              {isEltesto && (
                <button
                  onClick={() => setShowSendModal(true)}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Send First Tokens
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Balance</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">% of Supply</th>
                    {isEltesto && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {balances.map((b, i) => {
                    const balance = b.pvcx_balance || b.balance || 0;
                    const percentage = totalSupply > 0 ? ((balance / totalSupply) * 100).toFixed(2) : 0;
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                              {(b.users?.name?.[0] || b.users?.email?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{b.users?.name || b.users?.full_name || '-'}</p>
                              <p className="text-xs text-gray-500">{b.user_id?.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{b.users?.email || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-purple-600">{balance.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 ml-1">PVCX</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{percentage}%</td>
                        {isEltesto && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedUser({ id: b.user_id, email: b.users?.email, name: b.users?.name });
                                setShowSendModal(true);
                              }}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200"
                            >
                              + Send More
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <>
          {refreshing ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
              <Activity className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.type === 'credit' ? (
                          <TrendingUp size={18} className="text-green-600" />
                        ) : (
                          <TrendingDown size={18} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tx.type === 'credit' ? '+' : '-'}{tx.amount?.toLocaleString()} PVCX
                        </p>
                        <p className="text-xs text-gray-500">{tx.note || 'Token transfer'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{tx.users?.email || tx.user_id?.slice(0, 8) + '...'}</p>
                      <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Send Modal */}
      {showSendModal && isEltesto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Send PVCX Tokens</h2>
                <p className="text-xs text-gray-500">Transfer tokens to a user's balance</p>
              </div>
              <button onClick={() => setShowSendModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium">
                        {(selectedUser.name?.[0] || selectedUser.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedUser.name || selectedUser.email}</p>
                        <p className="text-xs text-gray-500">{selectedUser.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-purple-600 text-sm hover:underline">
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by email or name..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {searchTerm && (
                      <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 text-center">No users found</div>
                        ) : (
                          filteredCustomers.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSelectedUser({
                                  id: c.id,
                                  email: c.email,
                                  name: c.user_metadata?.name || c.name || c.email?.split('@')[0]
                                });
                                setSearchTerm('');
                              }}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                                {(c.email?.[0] || '?').toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{c.user_metadata?.name || c.email?.split('@')[0]}</p>
                                <p className="text-xs text-gray-500">{c.email}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Source Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Token Source</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSendSource('bookings')}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      sendSource === 'bookings'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Plane size={16} />
                    From Bookings
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendSource('co2')}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      sendSource === 'co2'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Leaf size={16} />
                    From CO2
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {sendSource === 'bookings'
                    ? 'Rewards earned from flight/charter bookings'
                    : 'Rewards earned from CO2 offset purchases'}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (PVCX)</label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="Enter amount..."
                  min="1"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note (optional)</label>
                <input
                  type="text"
                  value={sendNote}
                  onChange={(e) => setSendNote(e.target.value)}
                  placeholder="Reason for transfer..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={sendTokens}
                disabled={sending || !selectedUser || !sendAmount}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {sending ? 'Sending...' : 'Send Tokens'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

// ============================================
// FLIGHT BIDS SECTION
// View and manage flight bids from users
// ============================================
const BidsSection = ({ bids, refreshing, onRefresh, supabaseAdmin }) => {
  const [selectedBid, setSelectedBid] = useState(null);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [updating, setUpdating] = useState(false);

  const updateBidStatus = async (bidId, status, counter = null) => {
    setUpdating(true);
    try {
      const updateData = { status };
      if (counter) updateData.counter_amount = parseFloat(counter);

      const { error } = await supabaseAdmin
        .from('flight_bids')
        .update(updateData)
        .eq('id', bidId);

      if (error) throw error;
      onRefresh();
      setShowCounterModal(false);
      setCounterAmount('');
    } catch (err) {
      console.error('Error updating bid:', err);
      alert('Failed to update bid');
    }
    setUpdating(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'accepted': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'countered': return 'bg-blue-100 text-blue-700';
      case 'withdrawn': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Flight Bids</h2>
          <p className="text-gray-500 text-sm mt-1">{bids.length} total bids</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Bids Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {refreshing ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : bids.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Tag size={40} className="mx-auto mb-3 opacity-50" />
            <p>No flight bids yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">List Price</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bid Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bid Time</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departure</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bids.map((bid) => (
                <tr key={bid.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bid.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{bid.user?.email || 'No email'}</p>
                      {bid.user?.provider && bid.user.provider !== 'email' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded mt-1 inline-block">
                          {bid.user.provider}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{bid.route?.title || 'Unknown Route'}</p>
                      <p className="text-xs text-gray-500">
                        {bid.route?.origin?.split('(')[0]?.trim()} → {bid.route?.destination?.split('(')[0]?.trim()}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-500">
                      €{bid.route?.price?.toLocaleString() || 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      €{bid.bid_amount?.toLocaleString()}
                    </span>
                    {bid.counter_amount && (
                      <p className="text-xs text-blue-600">Counter: €{bid.counter_amount.toLocaleString()}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        {bid.created_at ? new Date(bid.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {bid.created_at ? new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        {bid.departure_date ? new Date(bid.departure_date).toLocaleDateString() : 'Flexible'}
                      </p>
                      <p className="text-xs text-gray-500">{bid.passengers} pax</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bid.status)}`}>
                      {bid.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {bid.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateBidStatus(bid.id, 'accepted')}
                          disabled={updating}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => { setSelectedBid(bid); setShowCounterModal(true); }}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg"
                        >
                          Counter
                        </button>
                        <button
                          onClick={() => updateBidStatus(bid.id, 'rejected')}
                          disabled={updating}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {bid.status !== 'pending' && (
                      <span className="text-xs text-gray-400">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Counter Offer Modal */}
      {showCounterModal && selectedBid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Counter Offer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Original bid: €{selectedBid.bid_amount?.toLocaleString()} for {selectedBid.flight?.title}
            </p>
            <input
              type="number"
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              placeholder="Enter counter amount (€)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCounterModal(false); setCounterAmount(''); }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateBidStatus(selectedBid.id, 'countered', counterAmount)}
                disabled={!counterAmount || updating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Sending...' : 'Send Counter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// INVOICE GENERATOR SECTION
// Comprehensive invoice/quote creation tool
// ============================================
const InvoiceGeneratorSection = ({ customers, supabaseAdmin }) => {
  const [documentType, setDocumentType] = useState('invoice'); // 'invoice' or 'quote'
  const [customerMode, setCustomerMode] = useState('select'); // 'select' or 'manual'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [manualCustomer, setManualCustomer] = useState({ name: '', email: '', phone: '', company: '', address: '' });
  const [services, setServices] = useState([]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due upon receipt');
  const [discount, setDiscount] = useState({ type: 'fixed', value: 0 });
  const [taxRate, setTaxRate] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Service type configurations
  const SERVICE_TYPES = [
    { id: 'private_jet', label: 'Private Jet Charter', icon: Plane, color: 'bg-blue-100 text-blue-700' },
    { id: 'empty_leg', label: 'Empty Leg Flight', icon: Plane, color: 'bg-green-100 text-green-700' },
    { id: 'helicopter', label: 'Helicopter Charter', icon: Zap, color: 'bg-orange-100 text-orange-700' },
    { id: 'ground_transport', label: 'Ground Transport', icon: Car, color: 'bg-purple-100 text-purple-700' },
    { id: 'yacht', label: 'Yacht Charter', icon: Ship, color: 'bg-cyan-100 text-cyan-700' },
    { id: 'travel_package', label: 'Travel Package (Multi-Leg)', icon: Globe, color: 'bg-indigo-100 text-indigo-700' },
    { id: 'adventure', label: 'Adventure / Experience', icon: Star, color: 'bg-amber-100 text-amber-700' },
    { id: 'concierge', label: 'Concierge Service', icon: Building2, color: 'bg-pink-100 text-pink-700' },
    { id: 'wine', label: 'Wine & Spirits', icon: Wine, color: 'bg-rose-100 text-rose-700' },
    { id: 'custom', label: 'Custom Service', icon: FileText, color: 'bg-gray-100 text-gray-700' }
  ];

  // Initialize
  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    setValidUntil(date.toISOString().split('T')[0]);
    setInvoiceNumber(`INV-${Date.now().toString(36).toUpperCase()}`);
  }, []);

  // Filter customers for search
  const filteredCustomers = customerSearch.length > 1
    ? (customers || []).filter(c =>
        c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.first_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.last_name?.toLowerCase().includes(customerSearch.toLowerCase())
      ).slice(0, 10)
    : [];

  // Add service
  const addService = (typeId = 'private_jet') => {
    const serviceType = SERVICE_TYPES.find(s => s.id === typeId) || SERVICE_TYPES[0];
    const newService = {
      id: Date.now(),
      type: serviceType.id,
      description: '',
      // Route info
      legs: [{ from: '', to: '', date: '', time: '', aircraft: '', operator: '' }], // For multi-leg support
      // Details
      passengers: '',
      aircraftModel: '',
      operator: '',
      duration: '',
      // Pricing
      quantity: 1,
      unitPrice: 0,
      // Extra details
      details: ''
    };
    setServices(prev => [...prev, newService]);
  };

  // Update service
  const updateService = (id, field, value) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Update leg in service
  const updateLeg = (serviceId, legIndex, field, value) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        const newLegs = [...s.legs];
        newLegs[legIndex] = { ...newLegs[legIndex], [field]: value };
        return { ...s, legs: newLegs };
      }
      return s;
    }));
  };

  // Add leg to service
  const addLeg = (serviceId) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        return { ...s, legs: [...s.legs, { from: '', to: '', date: '', time: '', aircraft: '', operator: '' }] };
      }
      return s;
    }));
  };

  // Remove leg from service
  const removeLeg = (serviceId, legIndex) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId && s.legs.length > 1) {
        const newLegs = s.legs.filter((_, i) => i !== legIndex);
        return { ...s, legs: newLegs };
      }
      return s;
    }));
  };

  // Remove service
  const removeService = (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // Calculate totals
  const subtotal = services.reduce((sum, s) => sum + (s.quantity * s.unitPrice), 0);
  const discountAmount = discount.type === 'percent' ? (subtotal * discount.value / 100) : discount.value;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  // Get customer info
  const getCustomerInfo = () => {
    if (customerMode === 'select' && selectedCustomer) {
      return {
        name: selectedCustomer.name || `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() || 'Client',
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || selectedCustomer.profile?.phone || '',
        company: selectedCustomer.profile?.company_name || '',
        address: selectedCustomer.profile?.address || ''
      };
    }
    return manualCustomer;
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    const customerInfo = getCustomerInfo();
    if (!customerInfo.name && !customerInfo.email) {
      alert('Please select or enter customer information');
      return;
    }
    if (services.length === 0) {
      alert('Please add at least one service');
      return;
    }

    setGenerating(true);
    try {
      // Build invoice data
      const invoiceData = {
        type: documentType,
        number: invoiceNumber,
        date: new Date().toISOString(),
        validUntil: documentType === 'quote' ? validUntil : null,
        paymentTerms: documentType === 'invoice' ? paymentTerms : null,
        client: customerInfo,
        services: services.map(s => {
          const sType = SERVICE_TYPES.find(t => t.id === s.type);
          return {
            type: s.type,
            typeLabel: sType?.label || s.type,
            description: s.description || sType?.label || 'Service',
            legs: s.legs,
            passengers: s.passengers,
            aircraftModel: s.aircraftModel,
            operator: s.operator,
            duration: s.duration,
            details: s.details,
            quantity: s.quantity,
            unitPrice: s.unitPrice,
            total: s.quantity * s.unitPrice
          };
        }),
        subtotal,
        discount: discountAmount > 0 ? { type: discount.type, value: discount.value, amount: discountAmount } : null,
        tax: taxRate > 0 ? { rate: taxRate, amount: taxAmount } : null,
        total,
        notes,
        currency: 'USD'
      };

      // Generate HTML for PDF
      const html = generateInvoiceHTML(invoiceData);

      // Download as PDF using html2pdf
      const filename = `PrivateCharterX_${invoiceData.number}.pdf`;

      // Use the existing PDF generator from pdfHtmlGenerator
      const { downloadHTMLAsPDF } = await import('../../services/pdfHtmlGenerator');
      await downloadHTMLAsPDF(html, filename);

      alert('Invoice generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Generate Invoice HTML
  const generateInvoiceHTML = (data) => {
    const servicesHTML = data.services.map(s => {
      let legsHTML = '';
      if (s.legs && s.legs.length > 0) {
        legsHTML = s.legs.map((leg, i) => `
          <div style="font-size: 11px; color: #666; margin-left: 10px; padding: 4px 0; border-left: 2px solid #e5e7eb; padding-left: 8px;">
            ${s.legs.length > 1 ? `<strong>Leg ${i + 1}:</strong> ` : ''}
            ${leg.from || '-'} → ${leg.to || '-'}
            ${leg.date ? ` • ${leg.date}` : ''}
            ${leg.time ? ` at ${leg.time}` : ''}
            ${leg.aircraft ? ` • ${leg.aircraft}` : ''}
            ${leg.operator ? ` • Op: ${leg.operator}` : ''}
          </div>
        `).join('');
      }

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong style="color: #111827;">${s.description || s.typeLabel}</strong>
            ${legsHTML}
            ${s.passengers ? `<div style="font-size: 11px; color: #666;">Passengers: ${s.passengers}</div>` : ''}
            ${s.aircraftModel ? `<div style="font-size: 11px; color: #666;">Aircraft: ${s.aircraftModel}</div>` : ''}
            ${s.operator ? `<div style="font-size: 11px; color: #666;">Operator: ${s.operator}</div>` : ''}
            ${s.duration ? `<div style="font-size: 11px; color: #666;">Duration: ${s.duration}</div>` : ''}
            ${s.details ? `<div style="font-size: 11px; color: #888; margin-top: 4px;">${s.details}</div>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${s.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${Number(s.unitPrice).toLocaleString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${Number(s.total).toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.5; background: #fff; }
          .pdf-container { max-width: 800px; margin: 0 auto; padding: 40px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #111; }
          .logo { font-size: 24px; font-weight: 700; color: #111; }
          .logo span { color: #666; font-weight: 400; }
          .doc-info { text-align: right; }
          .doc-type { font-size: 28px; font-weight: 700; color: #111; text-transform: uppercase; }
          .doc-number { font-size: 14px; color: #666; margin-top: 4px; }
          .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .party { flex: 1; }
          .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
          .party-name { font-size: 16px; font-weight: 600; color: #111; }
          .party-detail { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f9fafb; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 2px solid #e5e7eb; }
          .totals { margin-left: auto; width: 280px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .total-row.final { font-size: 18px; font-weight: 700; border-top: 2px solid #111; padding-top: 12px; margin-top: 8px; }
          .notes { background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 30px; }
          .notes-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <div class="header">
            <div>
              <div class="logo">PrivateCharterX<span> Aviation</span></div>
              <div style="font-size: 12px; color: #666; margin-top: 8px;">
                Luxury Aviation Services<br>
                hello@privatecharterx.com<br>
                +1 (888) PCX-JETS
              </div>
            </div>
            <div class="doc-info">
              <div class="doc-type">${data.type}</div>
              <div class="doc-number">#${data.number}</div>
              <div style="font-size: 12px; color: #666; margin-top: 8px;">
                Date: ${new Date(data.date).toLocaleDateString()}<br>
                ${data.validUntil ? `Valid Until: ${new Date(data.validUntil).toLocaleDateString()}` : ''}
                ${data.paymentTerms ? `Payment: ${data.paymentTerms}` : ''}
              </div>
            </div>
          </div>

          <div class="parties">
            <div class="party">
              <div class="party-label">Bill To</div>
              <div class="party-name">${data.client.name || 'Client'}</div>
              ${data.client.company ? `<div class="party-detail">${data.client.company}</div>` : ''}
              <div class="party-detail">${data.client.email || ''}</div>
              ${data.client.phone ? `<div class="party-detail">${data.client.phone}</div>` : ''}
              ${data.client.address ? `<div class="party-detail">${data.client.address}</div>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Service Description</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 20%; text-align: right;">Unit Price</th>
                <th style="width: 20%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${servicesHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>$${data.subtotal.toLocaleString()}</span>
            </div>
            ${data.discount ? `
              <div class="total-row" style="color: #dc2626;">
                <span>Discount ${data.discount.type === 'percent' ? `(${data.discount.value}%)` : ''}</span>
                <span>-$${data.discount.amount.toLocaleString()}</span>
              </div>
            ` : ''}
            ${data.tax ? `
              <div class="total-row">
                <span>Tax (${data.tax.rate}%)</span>
                <span>$${data.tax.amount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="total-row final">
              <span>Total ${data.currency}</span>
              <span>$${data.total.toLocaleString()}</span>
            </div>
          </div>

          ${data.notes ? `
            <div class="notes">
              <div class="notes-label">Notes & Terms</div>
              <div style="font-size: 12px; color: #666; white-space: pre-wrap;">${data.notes}</div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Thank you for choosing PrivateCharterX</p>
            <p style="margin-top: 4px;">This ${data.type} was generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const getServiceIcon = (typeId) => {
    const service = SERVICE_TYPES.find(s => s.id === typeId);
    const Icon = service?.icon || FileText;
    return Icon;
  };

  const getServiceColor = (typeId) => {
    const service = SERVICE_TYPES.find(s => s.id === typeId);
    return service?.color || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Invoice Generator</h2>
          <p className="text-sm text-gray-500">Create professional invoices and quotes</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
            placeholder="Invoice #"
          />
        </div>
      </div>

      {/* Document Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setDocumentType('invoice')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            documentType === 'invoice'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileText size={16} className="inline mr-2" />
          Invoice (Final Bill)
        </button>
        <button
          onClick={() => setDocumentType('quote')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            documentType === 'quote'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileCheck size={16} className="inline mr-2" />
          Quote (Proposal)
        </button>
      </div>

      {/* Customer Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <User size={16} />
            Customer Information
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCustomerMode('select')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                customerMode === 'select' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Select Existing
            </button>
            <button
              onClick={() => setCustomerMode('manual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                customerMode === 'manual' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Manual Entry
            </button>
          </div>
        </div>

        {customerMode === 'select' ? (
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
                placeholder="Search customers by name or email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900"
              />
            </div>
            {filteredCustomers.length > 0 && !selectedCustomer && (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {filteredCustomers.map(c => {
                  const customerPhone = c.phone || c.profile?.phone || null;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                        {(c.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                      {customerPhone && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone size={12} />
                          {customerPhone}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedCustomer && (() => {
              const displayPhone = selectedCustomer.phone || selectedCustomer.profile?.phone || null;
              return (
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium">
                      {(selectedCustomer.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedCustomer.name || `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() || 'Client'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail size={12} /> {selectedCustomer.email}
                      </p>
                      {displayPhone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone size={12} /> {displayPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-gray-200 rounded">
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
              <input
                type="text"
                value={manualCustomer.name}
                onChange={(e) => setManualCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
              <input
                type="email"
                value={manualCustomer.email}
                onChange={(e) => setManualCustomer(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <input
                type="text"
                value={manualCustomer.phone}
                onChange={(e) => setManualCustomer(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 234 567 8900"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
              <input
                type="text"
                value={manualCustomer.company}
                onChange={(e) => setManualCustomer(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Company Name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
              <input
                type="text"
                value={manualCustomer.address}
                onChange={(e) => setManualCustomer(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St, City, Country"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Services Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={16} />
            Services
          </h3>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => { if (e.target.value) addService(e.target.value); e.target.value = ''; }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              defaultValue=""
            >
              <option value="" disabled>+ Add Service</option>
              {SERVICE_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Package size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-2">No services added yet</p>
            <p className="text-xs text-gray-400">Select a service type from the dropdown above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service, sIndex) => {
              const ServiceIcon = getServiceIcon(service.type);
              const serviceColor = getServiceColor(service.type);
              const isMultiLeg = service.type === 'travel_package';

              return (
                <div key={service.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Service Header */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${serviceColor}`}>
                        <ServiceIcon size={16} />
                      </div>
                      <select
                        value={service.type}
                        onChange={(e) => updateService(service.id, 'type', e.target.value)}
                        className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
                      >
                        {SERVICE_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => removeService(service.id)}
                      className="p-1.5 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Service Details */}
                  <div className="p-4 space-y-4">
                    <input
                      type="text"
                      value={service.description}
                      onChange={(e) => updateService(service.id, 'description', e.target.value)}
                      placeholder="Service description (e.g., London to Paris Private Jet Charter)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />

                    {/* Legs Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          {isMultiLeg ? 'Itinerary Legs' : 'Route Details'}
                        </span>
                        {isMultiLeg && (
                          <button
                            onClick={() => addLeg(service.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            + Add Leg
                          </button>
                        )}
                      </div>
                      {service.legs.map((leg, legIndex) => (
                        <div key={legIndex} className="bg-gray-50 rounded-lg p-3 space-y-2">
                          {isMultiLeg && service.legs.length > 1 && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700">Leg {legIndex + 1}</span>
                              <button
                                onClick={() => removeLeg(service.id, legIndex)}
                                className="text-xs text-red-500 hover:text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          <div className="grid grid-cols-4 gap-2">
                            <div className="relative">
                              <MapPin size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={leg.from}
                                onChange={(e) => updateLeg(service.id, legIndex, 'from', e.target.value)}
                                placeholder="From"
                                className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded text-xs"
                              />
                            </div>
                            <div className="relative">
                              <MapPin size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={leg.to}
                                onChange={(e) => updateLeg(service.id, legIndex, 'to', e.target.value)}
                                placeholder="To"
                                className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded text-xs"
                              />
                            </div>
                            <input
                              type="date"
                              value={leg.date}
                              onChange={(e) => updateLeg(service.id, legIndex, 'date', e.target.value)}
                              className="px-2 py-1.5 border border-gray-200 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={leg.time}
                              onChange={(e) => updateLeg(service.id, legIndex, 'time', e.target.value)}
                              placeholder="Time"
                              className="px-2 py-1.5 border border-gray-200 rounded text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={leg.aircraft}
                              onChange={(e) => updateLeg(service.id, legIndex, 'aircraft', e.target.value)}
                              placeholder="Aircraft/Vehicle"
                              className="px-2 py-1.5 border border-gray-200 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={leg.operator}
                              onChange={(e) => updateLeg(service.id, legIndex, 'operator', e.target.value)}
                              placeholder="Operator"
                              className="px-2 py-1.5 border border-gray-200 rounded text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Passengers</label>
                        <input
                          type="text"
                          value={service.passengers}
                          onChange={(e) => updateService(service.id, 'passengers', e.target.value)}
                          placeholder="4"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Aircraft Model</label>
                        <input
                          type="text"
                          value={service.aircraftModel}
                          onChange={(e) => updateService(service.id, 'aircraftModel', e.target.value)}
                          placeholder="Citation XLS"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Operator</label>
                        <input
                          type="text"
                          value={service.operator}
                          onChange={(e) => updateService(service.id, 'operator', e.target.value)}
                          placeholder="NetJets"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Duration</label>
                        <input
                          type="text"
                          value={service.duration}
                          onChange={(e) => updateService(service.id, 'duration', e.target.value)}
                          placeholder="2h 30m"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                        />
                      </div>
                    </div>

                    <textarea
                      value={service.details}
                      onChange={(e) => updateService(service.id, 'details', e.target.value)}
                      placeholder="Additional details, amenities, special requests..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                    />

                    {/* Pricing */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">Qty:</label>
                          <input
                            type="number"
                            value={service.quantity}
                            onChange={(e) => updateService(service.id, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm text-center"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">× Price:</label>
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              value={service.unitPrice}
                              onChange={(e) => updateService(service.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-32 pl-7 pr-2 py-1.5 border border-gray-200 rounded text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          ${(service.quantity * service.unitPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Totals & Options */}
      <div className="grid grid-cols-2 gap-6">
        {/* Options */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Options</h3>

          {/* Discount */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Discount</span>
            <div className="flex items-center gap-2">
              <select
                value={discount.type}
                onChange={(e) => setDiscount(prev => ({ ...prev, type: e.target.value }))}
                className="px-2 py-1.5 border border-gray-200 rounded text-sm"
              >
                <option value="fixed">$ Fixed</option>
                <option value="percent">% Percent</option>
              </select>
              <input
                type="number"
                value={discount.value}
                onChange={(e) => setDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                min="0"
                className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-right"
              />
            </div>
          </div>

          {/* Tax */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tax Rate (%)</span>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.1"
              className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-right"
            />
          </div>

          {/* Valid Until / Payment Terms */}
          {documentType === 'quote' ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Valid Until</span>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded text-sm"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Terms</span>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded text-sm"
              >
                <option value="Due upon receipt">Due upon receipt</option>
                <option value="Net 7">Net 7 days</option>
                <option value="Net 15">Net 15 days</option>
                <option value="Net 30">Net 30 days</option>
                <option value="50% upfront">50% upfront</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes & Terms</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment instructions, terms and conditions..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-900 rounded-xl p-5 text-white">
          <h3 className="text-sm font-semibold mb-4">Summary</h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Discount {discount.type === 'percent' ? `(${discount.value}%)` : ''}
                </span>
                <span className="text-red-400">-${discountAmount.toLocaleString()}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax ({taxRate}%)</span>
                <span>${taxAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-700">
              <span>Total</span>
              <span>${total.toLocaleString()} USD</span>
            </div>
          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={generating || services.length === 0}
            className="w-full mt-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText size={18} />
                Generate {documentType === 'invoice' ? 'Invoice' : 'Quote'} PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
