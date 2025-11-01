import React, { useState, useEffect } from 'react';
import {
  User, Mail, Calendar, DollarSign, TrendingUp, Activity, Clock,
  Rocket, CheckCircle, XCircle, AlertCircle, ArrowRight, Bell,
  Wallet, Package, MessageSquare, Heart, MapPin, Plane, Coins, Building2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';

export default function ProfileOverviewEnhanced() {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, requests, investments, waitlists, uto, sto

  // State for live data
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeRequests: 0,
    totalInvestments: 0,
    waitlistCount: 0,
    notifications: 0,
    utoTokens: 0,
    stoTokens: 0
  });

  const [recentRequests, setRecentRequests] = useState([]);
  const [recentInvestments, setRecentInvestments] = useState([]);
  const [waitlistItems, setWaitlistItems] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [utoProjects, setUtoProjects] = useState([]);
  const [stoProjects, setStoProjects] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    }
  }, [user?.id, address]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentRequests(),
        fetchRecentInvestments(),
        fetchWaitlistItems(),
        fetchCalendarEvents(),
        fetchUTOProjects(),
        fetchSTOProjects()
      ]);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total bookings
      const { count: bookingsCount } = await supabase
        .from('booking_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Active requests
      const { count: requestsCount } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing']);

      // Total investments
      const { count: investmentsCount } = await supabase
        .from('launchpad_investments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Waitlist count - combine user and wallet waitlist
      let totalWaitlistCount = 0;

      // Count by user ID
      const { count: userWaitlistCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'waitlist');

      totalWaitlistCount = userWaitlistCount || 0;

      // Also count by wallet if connected (avoid duplicates)
      if (address) {
        const { data: walletWaitlist } = await supabase
          .from('transactions')
          .select('launch_id')
          .eq('wallet_address', address.toLowerCase())
          .eq('type', 'waitlist');

        // Get user's waitlist launch IDs to avoid counting duplicates
        const { data: userWaitlist } = await supabase
          .from('transactions')
          .select('launch_id')
          .eq('user_id', user.id)
          .eq('type', 'waitlist');

        const userLaunchIds = new Set((userWaitlist || []).map(item => item.launch_id));
        const uniqueWalletCount = (walletWaitlist || []).filter(
          item => !userLaunchIds.has(item.launch_id)
        ).length;

        totalWaitlistCount += uniqueWalletCount;
      }

      // Unread notifications
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      // UTO tokens count (if connected)
      let utoCount = 0;
      let stoCount = 0;
      if (address) {
        const { count: utoTokensCount } = await supabase
          .from('launchpad_investments')
          .select('*, launchpad_projects!inner(project_type)', { count: 'exact', head: true })
          .eq('wallet_address', address.toLowerCase())
          .eq('launchpad_projects.project_type', 'uto')
          .eq('status', 'completed');

        // STO tokens count
        const { count: stoTokensCount } = await supabase
          .from('launchpad_investments')
          .select('*, launchpad_projects!inner(project_type)', { count: 'exact', head: true })
          .eq('wallet_address', address.toLowerCase())
          .eq('launchpad_projects.project_type', 'sto')
          .eq('status', 'completed');

        utoCount = utoTokensCount || 0;
        stoCount = stoTokensCount || 0;
      }

      setStats({
        totalBookings: bookingsCount || 0,
        activeRequests: requestsCount || 0,
        totalInvestments: investmentsCount || 0,
        waitlistCount: totalWaitlistCount,
        notifications: notifCount || 0,
        utoTokens: utoCount,
        stoTokens: stoCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchRecentInvestments = async () => {
    try {
      if (!address) return;

      const { data, error } = await supabase
        .from('launchpad_investments')
        .select(`
          *,
          launchpad_projects (
            name,
            token_symbol,
            image_url
          )
        `)
        .eq('wallet_address', address.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentInvestments(data || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
  };

  const fetchWaitlistItems = async () => {
    try {
      let allWaitlistItems = [];

      // Fetch by wallet address if connected
      if (address) {
        const { data: walletData, error: walletError } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .eq('type', 'waitlist')
          .order('created_at', { ascending: false });

        if (!walletError && walletData) {
          allWaitlistItems = [...walletData];
        }
      }

      // Also fetch by user ID if logged in
      if (user) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'waitlist')
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Merge and deduplicate by launch_id
          const walletLaunchIds = new Set(allWaitlistItems.map(item => item.launch_id));
          const newItems = data.filter(item => !walletLaunchIds.has(item.launch_id));
          allWaitlistItems = [...allWaitlistItems, ...newItems];
        }
      }

      setWaitlistItems(allWaitlistItems);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', today.toISOString())
        .lte('start_date', nextWeek.toISOString())
        .order('start_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setCalendarEvents(data || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const fetchUTOProjects = async () => {
    try {
      if (!address) return;

      const { data, error } = await supabase
        .from('launchpad_investments')
        .select(`
          *,
          launchpad_projects (
            id,
            name,
            token_symbol,
            image_url,
            images,
            description,
            project_type,
            status,
            current_raised,
            target_amount,
            token_price
          )
        `)
        .eq('wallet_address', address.toLowerCase())
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter for UTO projects
      const utoData = (data || []).filter(
        inv => inv.launchpad_projects?.project_type === 'uto'
      );
      setUtoProjects(utoData);
    } catch (error) {
      console.error('Error fetching UTO projects:', error);
    }
  };

  const fetchSTOProjects = async () => {
    try {
      if (!address) return;

      const { data, error } = await supabase
        .from('launchpad_investments')
        .select(`
          *,
          launchpad_projects (
            id,
            name,
            token_symbol,
            image_url,
            images,
            description,
            project_type,
            status,
            current_raised,
            target_amount,
            token_price,
            launch_end_date
          )
        `)
        .eq('wallet_address', address.toLowerCase())
        .eq('status', 'completed')
        .order('created_at', { ascending: false});

      if (error) throw error;

      // Filter for STO projects
      const stoData = (data || []).filter(
        inv => inv.launchpad_projects?.project_type === 'sto'
      );
      setStoProjects(stoData);
    } catch (error) {
      console.error('Error fetching STO projects:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount?.toFixed(2) || '0.00'}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleProjectClick = (projectId) => {
    // Navigate to tokenized assets and open the specific project
    navigate('/dashboard', {
      state: {
        openCategory: 'tokenized-assets',
        projectId: projectId
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-light">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <div className="text-center">
          <User size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-3xl font-thin text-gray-900 mb-2 tracking-tight">Not Logged In</h2>
          <p className="text-gray-600 font-light">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-transparent" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-thin text-gray-900 tracking-tighter mb-4">
            Profile
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Welcome back, {user.email?.split('@')[0] || 'User'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
          <StatCard
            icon={<Package size={20} />}
            label="Total Bookings"
            value={stats.totalBookings}
          />
          <StatCard
            icon={<Activity size={20} />}
            label="Active Requests"
            value={stats.activeRequests}
          />
          <StatCard
            icon={<Rocket size={20} />}
            label="Investments"
            value={stats.totalInvestments}
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Waitlist"
            value={stats.waitlistCount}
          />
          <StatCard
            icon={<Bell size={20} />}
            label="Notifications"
            value={stats.notifications}
          />
        </div>

        {/* User Info Card */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 mb-8">
          <h2 className="text-3xl font-thin text-gray-900 mb-6 tracking-tight">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoRow icon={<Mail size={18} />} label="Email" value={user.email} />
            <InfoRow
              icon={<User size={18} />}
              label="User ID"
              value={user.id?.slice(0, 8) + '...' + user.id?.slice(-8)}
            />
            <InfoRow
              icon={<Calendar size={18} />}
              label="Member Since"
              value={formatDate(user.created_at)}
            />
            {isConnected && (
              <InfoRow
                icon={<Wallet size={18} />}
                label="Connected Wallet"
                value={address?.slice(0, 6) + '...' + address?.slice(-4)}
              />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: <Activity size={18} /> },
            { id: 'requests', label: 'Requests', icon: <Package size={18} />, count: stats.activeRequests },
            { id: 'investments', label: 'Investments', icon: <Rocket size={18} />, count: stats.totalInvestments },
            { id: 'waitlists', label: 'Waitlists', icon: <Clock size={18} />, count: stats.waitlistCount },
            { id: 'uto', label: 'UTO Tokens', icon: <Coins size={18} />, count: stats.utoTokens },
            { id: 'sto', label: 'STO Tokens', icon: <Building2 size={18} />, count: stats.stoTokens }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Events */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
              <h3 className="text-2xl font-thin text-gray-900 mb-6 tracking-tight">Upcoming Events</h3>
              {calendarEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-light">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {calendarEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Calendar size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{event.title}</p>
                        <p className="text-sm text-gray-500 font-light mt-1">
                          {formatDate(event.start_date)}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <MapPin size={12} />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
              <h3 className="text-2xl font-thin text-gray-900 mb-6 tracking-tight">Recent Activity</h3>
              {recentRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Activity size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-light">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Package size={18} className="text-gray-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Request'}
                          </p>
                          <p className="text-xs text-gray-500 font-light">
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <h3 className="text-3xl font-thin text-gray-900 mb-6 tracking-tight">All Requests</h3>
            {recentRequests.length === 0 ? (
              <div className="text-center py-20">
                <Package size={64} className="text-gray-300 mx-auto mb-6" />
                <h4 className="text-2xl font-thin text-gray-900 mb-2 tracking-tight">No Requests Yet</h4>
                <p className="text-gray-600 font-light">Your booking requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="p-6 bg-gray-50/50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <Package size={24} className="text-gray-700" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {request.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Request'}
                          </h4>
                          <p className="text-sm text-gray-500 font-light">
                            Created {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    {request.data?.origin && request.data?.destination && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-light">
                        <MapPin size={16} />
                        <span>{request.data.origin} → {request.data.destination}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'investments' && (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <h3 className="text-3xl font-thin text-gray-900 mb-6 tracking-tight">Your Investments</h3>
            {!isConnected ? (
              <div className="text-center py-20">
                <Wallet size={64} className="text-gray-300 mx-auto mb-6" />
                <h4 className="text-2xl font-thin text-gray-900 mb-2 tracking-tight">Connect Your Wallet</h4>
                <p className="text-gray-600 font-light">Connect your wallet to view your investments</p>
              </div>
            ) : recentInvestments.length === 0 ? (
              <div className="text-center py-20">
                <Rocket size={64} className="text-gray-300 mx-auto mb-6" />
                <h4 className="text-2xl font-thin text-gray-900 mb-2 tracking-tight">No Investments Yet</h4>
                <p className="text-gray-600 font-light">Your launchpad investments will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvestments.map((investment) => (
                  <div key={investment.id} className="p-6 bg-gray-50/50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {investment.launchpad_projects?.image_url ? (
                          <img
                            src={investment.launchpad_projects.image_url}
                            alt={investment.launchpad_projects.name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {investment.launchpad_projects?.token_symbol || 'TKN'}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {investment.launchpad_projects?.name || 'Project'}
                          </h4>
                          <p className="text-sm text-gray-500 font-light">
                            Invested {formatDate(investment.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-thin text-gray-900 tracking-tight">
                          {formatCurrency(investment.amount_usd)}
                        </p>
                        <p className="text-sm text-gray-500 font-light mt-1">
                          {investment.token_amount?.toFixed(2)} {investment.launchpad_projects?.token_symbol}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-light">Payment:</span>
                        <span className="px-2 py-1 bg-white rounded-md text-xs font-medium">
                          {investment.payment_method}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-light">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}>
                          {investment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'waitlists' && (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <h3 className="text-3xl font-thin text-gray-900 mb-6 tracking-tight">Waitlist Activities</h3>
            {waitlistItems.length === 0 ? (
              <div className="text-center py-20">
                <Clock size={64} className="text-gray-300 mx-auto mb-6" />
                <h4 className="text-2xl font-thin text-gray-900 mb-2 tracking-tight">No Waitlist Items</h4>
                <p className="text-gray-600 font-light">Join waitlists for upcoming launches to be notified when they go live</p>
              </div>
            ) : (
              <div className="space-y-4">
                {waitlistItems.map((item) => (
                  <div key={item.id} className="p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Clock size={24} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {item.metadata?.launch_name || 'Launch Project'}
                          </h4>
                          <p className="text-sm text-gray-600 font-light">
                            Joined {formatDate(item.created_at)}
                          </p>
                          {item.metadata?.project_type && (
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                              item.metadata.project_type === 'uto' ? 'bg-purple-100 text-purple-700' :
                              item.metadata.project_type === 'sto' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {item.metadata.project_type === 'uto' ? 'UTO' :
                               item.metadata.project_type === 'sto' ? 'STO' :
                               'Crypto'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg">
                        <CheckCircle size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">On Waitlist</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-900 font-light">
                        <Bell size={14} />
                        <span>You'll be notified when this launch goes live</span>
                      </div>
                      {item.wallet_address && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-light">
                          <Wallet size={12} />
                          <span>Wallet: {item.wallet_address.slice(0, 6)}...{item.wallet_address.slice(-4)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'uto' && (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <h3 className="text-3xl font-thin text-gray-900 mb-6 tracking-tight">UTO Token Projects</h3>
            <p className="text-gray-600 font-light mb-8">Utility Token Offerings - Your invested projects</p>
            {!isConnected ? (
              <div className="text-center py-20">
                <Wallet size={64} className="text-gray-300 mx-auto mb-6" />
                <h4 className="text-2xl font-thin text-gray-900 mb-2 tracking-tight">Connect Your Wallet</h4>
                <p className="text-gray-600 font-light">Connect your wallet to view your UTO token investments</p>
              </div>
            ) : utoProjects.length === 0 ? (
              <div className="text-center py-20">
                <Coins size={64} className="text-gray-300 mx-auto mb-6" />
                <h4 className="text-2xl font-thin text-gray-900 mb-2 tracking-tight">No UTO Tokens Yet</h4>
                <p className="text-gray-600 font-light">Your UTO token investments will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {utoProjects.map((investment) => (
                  <div
                    key={investment.id}
                    onClick={() => handleProjectClick(investment.launchpad_projects?.id)}
                    className="p-6 bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm rounded-xl border border-purple-200 hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      {investment.launchpad_projects?.image_url ? (
                        <img
                          src={investment.launchpad_projects.image_url}
                          alt={investment.launchpad_projects.name}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {investment.launchpad_projects?.token_symbol || 'UTO'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">
                          {investment.launchpad_projects?.name || 'UTO Project'}
                        </h4>
                        <p className="text-sm text-gray-600 font-light">
                          {investment.launchpad_projects?.token_symbol || 'TKN'}
                        </p>
                      </div>
                      <ArrowRight size={20} className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-200">
                      <div>
                        <p className="text-xs text-gray-500 font-light mb-1">Your Investment</p>
                        <p className="text-lg font-medium text-gray-900">{formatCurrency(investment.amount_usd)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-light mb-1">Tokens Owned</p>
                        <p className="text-lg font-medium text-gray-900">
                          {investment.token_amount?.toFixed(2)} {investment.launchpad_projects?.token_symbol}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-purple-100 rounded-lg text-xs font-medium text-purple-700">
                        Utility Token
                      </div>
                      <div className="text-xs text-gray-500 font-light">
                        Click to view in tokenized assets
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sto' && (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <h3 className="text-3xl font-thin text-gray-900 mb-6 tracking-tight">STO Token Projects</h3>
            <p className="text-gray-600 font-light mb-8">Security Token Offerings - Your invested projects</p>
            {!isConnected ? (
              <div className="text-center py-20">
                <Wallet size={64} className="text-gray-300 mx-auto mb-6" />
                <h4 className="text-2xl font-thin text-gray-900 mb-2 tracking-tight">Connect Your Wallet</h4>
                <p className="text-gray-600 font-light">Connect your wallet to view your STO token investments</p>
              </div>
            ) : stoProjects.length === 0 ? (
              <div className="text-center py-20">
                <Building2 size={64} className="text-gray-300 mx-auto mb-6" />
                <h4 className="text-2xl font-thin text-gray-900 mb-2 tracking-tight">No STO Tokens Yet</h4>
                <p className="text-gray-600 font-light">Your STO token investments will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stoProjects.map((investment) => (
                  <div
                    key={investment.id}
                    onClick={() => handleProjectClick(investment.launchpad_projects?.id)}
                    className="p-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-sm rounded-xl border border-emerald-200 hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      {investment.launchpad_projects?.image_url ? (
                        <img
                          src={investment.launchpad_projects.image_url}
                          alt={investment.launchpad_projects.name}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {investment.launchpad_projects?.token_symbol || 'STO'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">
                          {investment.launchpad_projects?.name || 'STO Project'}
                        </h4>
                        <p className="text-sm text-gray-600 font-light">
                          {investment.launchpad_projects?.token_symbol || 'TKN'}
                        </p>
                      </div>
                      <ArrowRight size={20} className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200">
                      <div>
                        <p className="text-xs text-gray-500 font-light mb-1">Your Investment</p>
                        <p className="text-lg font-medium text-gray-900">{formatCurrency(investment.amount_usd)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-light mb-1">Tokens Owned</p>
                        <p className="text-lg font-medium text-gray-900">
                          {investment.token_amount?.toFixed(2)} {investment.launchpad_projects?.token_symbol}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-emerald-100 rounded-lg text-xs font-medium text-emerald-700">
                        Security Token
                      </div>
                      <div className="text-xs text-gray-500 font-light">
                        Click to view in tokenized assets
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-600 font-light mb-1">{label}</p>
      <p className="text-4xl font-thin text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}

// Info Row Component
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-gray-100 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-light">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
