import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Shield, CheckCircle, Clock, XCircle,
  AlertCircle, Edit, Plus, ExternalLink, Sparkles, DollarSign, Plane,
  Coins, Building2, Leaf, Users, Activity, Crown, ChevronRight, MessageSquare,
  Headphones, X
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { web3Service } from '../../lib/web3';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../../services/subscriptionService';

// Dashboard components
import MultiLineChart from '../Dashboard/MultiLineChart';
import DashboardCard from '../Dashboard/DashboardCard';
import BalanceHeader from '../Dashboard/BalanceHeader';
import RecentActivity from '../Dashboard/RecentActivity';
import QuickStats from '../Dashboard/QuickStats';
import ChatWidget from './ChatWidget';

export default function ProfileOverview() {
  const { user } = useAuth();
  const { address: walletAddress, isConnected, chain } = useAccount();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);

  // Dashboard data
  const [chartData, setChartData] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [quickStats, setQuickStats] = useState({
    memberSince: '-',
    totalValue: 0,
    completionRate: 0,
    activityScore: 0
  });
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expense: 0
  });

  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Support chat state
  const [showSupportChat, setShowSupportChat] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch NFTs when wallet is connected
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!isConnected || !walletAddress || chain?.id !== 8453) {
        setNfts([]);
        return;
      }

      setLoadingNFTs(true);
      try {
        const nftResult = await web3Service.getUserNFTsViaAlchemy(walletAddress);
        setNfts(nftResult);
      } catch (error) {
        console.error('Failed to fetch NFTs:', error);
        setNfts([]);
      } finally {
        setLoadingNFTs(false);
      }
    };

    fetchNFTs();
  }, [isConnected, walletAddress, chain?.id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchChartData(),
        fetchDashboardMetrics(),
        fetchRecentActivities(),
        calculateMonthlyStats(),
        calculateQuickStats(),
        fetchSubscriptionData()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionData = async () => {
    setLoadingSubscription(true);
    try {
      const profile = await subscriptionService.getUserProfile(user.id);
      const stats = await subscriptionService.getChatStats(user.id);
      setSubscriptionData({
        tier: profile?.subscription_tier || 'explorer',
        status: profile?.subscription_status || 'active',
        chatsUsed: stats?.chatsUsed || 0,
        chatsLimit: stats?.chatsLimit || 1,
        chatsRemaining: stats?.chatsRemaining,
        unlimited: stats?.unlimited || false,
        resetDate: profile?.chats_reset_date,
        currentPeriodEnd: profile?.current_period_end
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscriptionData({
        tier: 'explorer',
        status: 'active',
        chatsUsed: 0,
        chatsLimit: 1, // Free tier: 1 chat only
        chatsRemaining: 1,
        unlimited: false
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setProfileData(data || {
        kyc_status: 'not_started',
        wallet_address: null,
        created_at: user.created_at
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_lifetime_chart_data', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching chart data:', error);
        setChartData([]);
        return;
      }

      setChartData(data || []);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_dashboard_metrics', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching dashboard metrics:', error);
        setDashboardMetrics(null);
        return;
      }

      setDashboardMetrics(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setDashboardMetrics(null);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data: requests } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivities(requests || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setRecentActivities([]);
    }
  };

  const calculateMonthlyStats = async () => {
    try {
      const startDate = startOfMonth(new Date()).toISOString();

      // Calculate monthly income (bookings, PVCX credits)
      const { data: bookings } = await supabase
        .from('booking_requests')
        .select('total_price')
        .eq('user_id', user.id)
        .gte('created_at', startDate);

      const { data: pvcxCredits } = await supabase
        .from('pvcx_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('transaction_type', 'credit')
        .gte('created_at', startDate);

      const bookingIncome = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
      const pvcxIncome = pvcxCredits?.reduce((sum, p) => sum + (p.amount || 0), 0) * 0.01 || 0; // $0.01 per PVCX

      // Calculate monthly expenses (tokenization fees, services)
      const { data: expenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .in('category', ['booking', 'service', 'subscription'])
        .gte('created_at', startDate);

      const totalExpense = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      setMonthlyStats({
        income: bookingIncome + pvcxIncome,
        expense: totalExpense
      });
    } catch (error) {
      console.error('Error calculating monthly stats:', error);
    }
  };

  const calculateQuickStats = async () => {
    try {
      // Member since
      const memberSince = user?.created_at
        ? format(new Date(user.created_at), 'MMM yyyy')
        : '-';

      // Total value from transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, currency')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const totalValue = transactions?.reduce((sum, t) => {
        const usdValue = t.currency === 'EUR' ? t.amount * 1.1 : t.amount;
        return sum + usdValue;
      }, 0) || 0;

      // Completion rate
      const { data: allRequests } = await supabase
        .from('user_requests')
        .select('status')
        .eq('user_id', user.id);

      const completed = allRequests?.filter(r => r.status === 'completed').length || 0;
      const total = allRequests?.length || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Activity score (based on total actions)
      const activityScore = Math.min(total * 10, 1000); // Max 1000

      setQuickStats({
        memberSince,
        totalValue,
        completionRate,
        activityScore
      });
    } catch (error) {
      console.error('Error calculating quick stats:', error);
    }
  };

  const getKYCStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-500/20 text-green-700 border-green-500/40';
      case 'pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/40';
      case 'rejected': return 'bg-red-500/20 text-red-700 border-red-500/40';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/40';
    }
  };

  const getKYCStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  // Dashboard card click handlers
  const handleTransactionsClick = () => {
    // Navigate to transactions page or show modal
    console.log('Navigate to transactions');
  };

  const handleBookingsClick = () => {
    navigate('/dashboard/my-requests');
  };

  const handleTokenizationClick = () => {
    navigate('/dashboard/tokenization');
  };

  const handleDAOClick = () => {
    navigate('/dashboard/daos');
  };

  const handlePVCXClick = () => {
    // Show PVCX wallet modal or navigate
    console.log('Navigate to PVCX wallet');
  };

  const handleCO2Click = () => {
    navigate('/dashboard/co2-certificates');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600">Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  // Calculate total portfolio balance
  const totalBalance = (dashboardMetrics?.total_transaction_volume || 0) + (quickStats.totalValue || 0);

  return (
    <div className="w-full h-full bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tighter">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto font-light">
            Track your portfolio, bookings, and activities in one place
          </p>
        </div>

        {/* Balance Header */}
        <BalanceHeader
          totalBalance={totalBalance}
          monthlyIncome={monthlyStats.income}
          monthlyExpense={monthlyStats.expense}
          loading={loading}
        />

        {/* Quick Stats */}
        <QuickStats stats={quickStats} loading={loading} />

        {/* Multi-Line Chart */}
        <MultiLineChart data={chartData} loading={loading} />

        {/* Dashboard Cards Grid - 6 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
          {/* Card 1: Total Transactions */}
          <DashboardCard
            icon={Activity}
            title="Total Transactions"
            value={(dashboardMetrics?.web3_transactions || 0) + (dashboardMetrics?.fiat_transactions || 0)}
            subtitle={`$${Number(dashboardMetrics?.total_transaction_volume || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} total volume`}
            badge={`${dashboardMetrics?.web3_transactions || 0} Web3`}
            badgeColor="bg-purple-100 text-purple-700"
            onClick={handleTransactionsClick}
            loading={loading}
          />

          {/* Card 2: RWS Bookings */}
          <DashboardCard
            icon={Plane}
            title="RWS Bookings"
            value={dashboardMetrics?.total_bookings || 0}
            subtitle={`€${Number(dashboardMetrics?.booking_revenue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} revenue`}
            badge={`${dashboardMetrics?.pending_bookings || 0} Pending`}
            badgeColor="bg-amber-100 text-amber-700"
            onClick={handleBookingsClick}
            loading={loading}
          />

          {/* Card 3: Tokenization Projects */}
          <DashboardCard
            icon={Coins}
            title="Tokenization Projects"
            value={dashboardMetrics?.tokenization_projects || 0}
            subtitle={`$${Number(dashboardMetrics?.total_token_value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} total value`}
            badge={`${dashboardMetrics?.active_tokens || 0} Active`}
            badgeColor="bg-blue-100 text-blue-700"
            onClick={handleTokenizationClick}
            loading={loading}
          />

          {/* Card 4: DAO Participation */}
          <DashboardCard
            icon={Users}
            title="DAO Participation"
            value={dashboardMetrics?.dao_count || 0}
            subtitle={`${Number(dashboardMetrics?.total_governance_tokens || 0).toLocaleString('en-US')} voting power`}
            badge={`${dashboardMetrics?.active_proposals || 0} Active`}
            badgeColor="bg-indigo-100 text-indigo-700"
            onClick={handleDAOClick}
            loading={loading}
          />

          {/* Card 5: PVCX Rewards */}
          <DashboardCard
            icon={DollarSign}
            title="PVCX Rewards"
            value={`${Number(dashboardMetrics?.pvcx_balance || 0).toLocaleString('en-US')} $PVCX`}
            subtitle={`${Number(dashboardMetrics?.pvcx_earned_total || 0).toLocaleString('en-US')} total earned`}
            badge={`${Number(dashboardMetrics?.pvcx_from_bookings || 0).toLocaleString('en-US')} from bookings`}
            badgeColor="bg-green-100 text-green-700"
            onClick={handlePVCXClick}
            loading={loading}
          />

          {/* Card 6: CO2 Impact */}
          <DashboardCard
            icon={Leaf}
            title="CO2 Impact"
            value={`${Number(dashboardMetrics?.tons_offset || 0).toFixed(1)} tons`}
            subtitle={`${dashboardMetrics?.co2_certificates || 0} certificates`}
            badge={`€${Number(dashboardMetrics?.total_co2_investment || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} invested`}
            badgeColor="bg-emerald-100 text-emerald-700"
            onClick={handleCO2Click}
            loading={loading}
          />
        </div>

        {/* Grid Layout for Additional Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity
              activities={recentActivities}
              loading={loading}
              onViewAll={handleBookingsClick}
            />
          </div>

          {/* Right Column - KYC & NFT Cards */}
          <div className="space-y-6">
            {/* KYC Verification Card */}
            <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={20} className="text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">KYC Verification</h2>
              </div>

              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${getKYCStatusColor(profileData?.kyc_status || 'not_started')}`}>
                {getKYCStatusIcon(profileData?.kyc_status || 'not_started')}
                <span className="font-medium capitalize">
                  {profileData?.kyc_status === 'not_started' ? 'Not Started' : profileData?.kyc_status || 'Not Started'}
                </span>
              </div>

              {profileData?.kyc_status !== 'verified' && (
                <button className="mt-4 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                  {profileData?.kyc_status === 'not_started' ? 'Start Verification' : 'View Status'}
                </button>
              )}

              <p className="mt-4 text-xs text-gray-500">
                {profileData?.kyc_status === 'verified'
                  ? 'Your account is fully verified'
                  : 'Complete KYC to unlock all features'}
              </p>
            </div>

            {/* NFT Membership Card */}
            <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={20} className="text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">VIP Membership NFT</h2>
              </div>

              {loadingNFTs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                </div>
              ) : !isConnected || chain?.id !== 8453 ? (
                <div className="text-center py-6">
                  <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                    <div className="text-center">
                      <Sparkles size={48} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 font-medium">Connect Wallet</p>
                      <p className="text-xs text-gray-300 mt-1">on Base Network</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Connect your wallet on Base to see your NFT membership
                  </p>
                </div>
              ) : nfts.length > 0 ? (
                <div>
                  <div className="relative group">
                    <div className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                      <video
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      >
                        <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4" type="video/mp4" />
                      </video>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                        ✓ OWNED
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-900">{nfts[0].name}</h3>
                      <span className="text-xs font-medium text-gray-500">#{nfts[0].tokenId}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      VIP Membership • {nfts[0].discountPercent}% Discount Active
                    </p>
                    <a
                      href="https://opensea.io/collection/privatecharterx-membership-card"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors text-sm font-medium"
                    >
                      <ExternalLink size={14} />
                      View on OpenSea
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <a
                    href="https://opensea.io/collection/privatecharterx-membership-card"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-900 transition-all duration-300 cursor-pointer mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="text-center relative z-10">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 transition-transform">
                          <Plus size={40} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Your NFT Here</p>
                        <p className="text-xs text-gray-400 mt-2">Click to buy on OpenSea</p>
                      </div>
                    </div>
                  </a>
                  <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-200/50">
                    <h4 className="text-xs font-bold text-gray-900 mb-2">Unlock VIP Benefits:</h4>
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Free Empty Leg Flight
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Up to 10% Permanent Discount
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Priority Support & Access
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        $PVCX Token Rewards
                      </li>
                    </ul>
                    <a
                      href="https://opensea.io/collection/privatecharterx-membership-card"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium mt-4"
                    >
                      <ExternalLink size={14} />
                      Buy on OpenSea
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Subscription Card */}
            <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Crown size={20} className="text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
                </div>
                <button
                  onClick={() => navigate('/dashboard/subscriptions')}
                  className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
                >
                  Manage <ChevronRight size={14} />
                </button>
              </div>

              {loadingSubscription ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div>
                  {/* Current Plan Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      subscriptionData?.tier === 'elite' ? 'bg-gray-900 text-white' :
                      subscriptionData?.tier === 'business' ? 'bg-gray-800 text-white' :
                      subscriptionData?.tier === 'pro' ? 'bg-gray-700 text-white' :
                      subscriptionData?.tier === 'starter' ? 'bg-gray-600 text-white' :
                      'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}>
                      {subscriptionData?.tier === 'elite' ? 'Elite' :
                       subscriptionData?.tier === 'business' ? 'Business' :
                       subscriptionData?.tier === 'pro' ? 'Professional' :
                       subscriptionData?.tier === 'starter' ? 'Starter' : 'Explorer'}
                    </div>
                    {subscriptionData?.status === 'active' && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Chat Usage */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 flex items-center gap-1.5">
                        <MessageSquare size={14} />
                        AI Conversations
                      </span>
                      <span className="font-medium text-gray-900">
                        {subscriptionData?.unlimited ? (
                          'Unlimited'
                        ) : (
                          `${subscriptionData?.chatsUsed || 0} / ${subscriptionData?.chatsLimit || 2}`
                        )}
                      </span>
                    </div>
                    {!subscriptionData?.unlimited && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            (subscriptionData?.chatsUsed / subscriptionData?.chatsLimit) >= 0.9
                              ? 'bg-red-500'
                              : (subscriptionData?.chatsUsed / subscriptionData?.chatsLimit) >= 0.7
                                ? 'bg-yellow-500'
                                : 'bg-gray-900'
                          }`}
                          style={{
                            width: `${Math.min(100, ((subscriptionData?.chatsUsed || 0) / (subscriptionData?.chatsLimit || 2)) * 100)}%`
                          }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200/50">
                      <p className="text-xs text-gray-500 mb-1">Remaining</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {subscriptionData?.unlimited ? '∞' : (subscriptionData?.chatsRemaining || 0)}
                      </p>
                    </div>
                    <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200/50">
                      <p className="text-xs text-gray-500 mb-1">Resets</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {subscriptionData?.resetDate
                          ? format(new Date(subscriptionData.resetDate), 'MMM d')
                          : subscriptionData?.tier === 'explorer' ? 'Never' : '-'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Upgrade CTA for free users */}
                  {subscriptionData?.tier === 'explorer' && (
                    <button
                      onClick={() => navigate('/dashboard/subscriptions')}
                      className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Crown size={16} />
                      Upgrade Plan
                    </button>
                  )}

                  {/* Plan Features for paid users */}
                  {subscriptionData?.tier !== 'explorer' && (
                    <div>
                      <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200/50 mb-3">
                        <p className="text-xs text-gray-500 mb-2">Your Plan Includes:</p>
                        <ul className="space-y-1.5 text-xs text-gray-700">
                          {subscriptionData?.tier === 'starter' && (
                            <>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> 5 AI chats/month</li>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> 50 messages per chat</li>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> Email support</li>
                            </>
                          )}
                          {subscriptionData?.tier === 'pro' && (
                            <>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> 25 AI chats/month</li>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> 100 messages per chat</li>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> Priority support</li>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> Quote comparison</li>
                            </>
                          )}
                          {subscriptionData?.tier === 'elite' && (
                            <>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> Unlimited AI chats</li>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> Unlimited messages</li>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> 24/7 VIP support</li>
                              <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" /> Personal concierge</li>
                            </>
                          )}
                        </ul>
                      </div>
                      {subscriptionData?.currentPeriodEnd && (
                        <p className="text-xs text-gray-500 text-center mb-3">
                          Renews: {format(new Date(subscriptionData.currentPeriodEnd), 'MMM d, yyyy')}
                        </p>
                      )}
                      <button
                        onClick={() => navigate('/dashboard/subscriptions')}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-300"
                      >
                        Manage Subscription
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Support Card */}
            <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Headphones size={20} className="text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Support</h2>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Need help with your account, bookings, or have any questions? Our support team is here to assist you.
              </p>

              <button
                onClick={() => setShowSupportChat(true)}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} />
                Start Support Chat
              </button>

              <div className="mt-4 pt-4 border-t border-gray-200/50">
                <p className="text-xs text-gray-500 mb-2">Other ways to reach us:</p>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <Mail size={12} />
                    support@privatecharterx.com
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Chat Modal */}
      {showSupportChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md h-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => setShowSupportChat(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
            {/* Embedded Chat Widget */}
            <ChatWidget
              isVisible={showSupportChat}
              onClose={() => setShowSupportChat(false)}
              embedded={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
