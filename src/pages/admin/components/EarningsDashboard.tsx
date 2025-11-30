import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  FileText,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Plane,
  Building2,
  Coins,
  Clock
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface EarningsStats {
  subscriptions: {
    total: number;
    mrr: number;
    starter: number;
    pro: number;
    elite: number;
    starterCount: number;
    proCount: number;
    eliteCount: number;
  };
  bookings: {
    total: number;
    paid: number;
    pending: number;
    emptyLegs: number;
    adventures: number;
    co2Certificates: number;
    other: number;
  };
  requests: {
    total: number;
    completed: number;
    pending: number;
    jetCharters: number;
    helicopterCharters: number;
    spvFormations: number;
    tokenization: number;
    yachtCharters: number;
  };
  grandTotal: number;
  monthlyGrowth: number;
}

export default function EarningsDashboard() {
  const [stats, setStats] = useState<EarningsStats>({
    subscriptions: { total: 0, mrr: 0, starter: 0, pro: 0, elite: 0, starterCount: 0, proCount: 0, eliteCount: 0 },
    bookings: { total: 0, paid: 0, pending: 0, emptyLegs: 0, adventures: 0, co2Certificates: 0, other: 0 },
    requests: { total: 0, completed: 0, pending: 0, jetCharters: 0, helicopterCharters: 0, spvFormations: 0, tokenization: 0, yachtCharters: 0 },
    grandTotal: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchAllStats();
  }, [timeFilter]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case 'week':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      default:
        return null;
    }
  };

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      // Fetch subscription stats
      let subscriptionQuery = supabase
        .from('users')
        .select('subscription_tier, subscription_status, subscription_start_date');

      if (dateFilter) {
        subscriptionQuery = subscriptionQuery.gte('subscription_start_date', dateFilter);
      }

      const { data: subscriptionData } = await subscriptionQuery;

      const activeSubscriptions = subscriptionData?.filter(u => u.subscription_status === 'active') || [];
      const starterUsers = activeSubscriptions.filter(u => u.subscription_tier === 'starter');
      const proUsers = activeSubscriptions.filter(u => u.subscription_tier === 'pro');
      const eliteUsers = activeSubscriptions.filter(u => u.subscription_tier === 'elite');

      const subscriptionStats = {
        starterCount: starterUsers.length,
        proCount: proUsers.length,
        eliteCount: eliteUsers.length,
        starter: starterUsers.length * 20, // $20/month
        pro: proUsers.length * 40,         // $40/month
        elite: eliteUsers.length * 130,    // $130/month
        total: 0,
        mrr: 0
      };
      subscriptionStats.total = subscriptionStats.starter + subscriptionStats.pro + subscriptionStats.elite;
      subscriptionStats.mrr = subscriptionStats.total;

      // Fetch booking stats
      let bookingsQuery = supabase
        .from('user_bookings')
        .select('booking_type, total_amount, payment_status, created_at');

      if (dateFilter) {
        bookingsQuery = bookingsQuery.gte('created_at', dateFilter);
      }

      const { data: bookingsData } = await bookingsQuery;

      const paidBookings = bookingsData?.filter(b => b.payment_status === 'paid') || [];
      const pendingBookings = bookingsData?.filter(b => b.payment_status === 'pending') || [];

      const bookingStats = {
        total: paidBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
        paid: paidBookings.length,
        pending: pendingBookings.length,
        emptyLegs: paidBookings.filter(b => b.booking_type === 'empty_leg').reduce((sum, b) => sum + (b.total_amount || 0), 0),
        adventures: paidBookings.filter(b => b.booking_type === 'adventure_package').reduce((sum, b) => sum + (b.total_amount || 0), 0),
        co2Certificates: paidBookings.filter(b => b.booking_type === 'co2_certificate').reduce((sum, b) => sum + (b.total_amount || 0), 0),
        other: paidBookings.filter(b => !['empty_leg', 'adventure_package', 'co2_certificate'].includes(b.booking_type)).reduce((sum, b) => sum + (b.total_amount || 0), 0)
      };

      // Fetch request stats (estimated values for completed requests)
      let requestsQuery = supabase
        .from('user_requests')
        .select('type, status, data, created_at');

      if (dateFilter) {
        requestsQuery = requestsQuery.gte('created_at', dateFilter);
      }

      const { data: requestsData } = await requestsQuery;

      const completedRequests = requestsData?.filter(r => r.status === 'completed') || [];
      const pendingRequests = requestsData?.filter(r => r.status === 'pending' || r.status === 'in_progress') || [];

      // Calculate estimated revenue from requests
      const calculateRequestValue = (request: any) => {
        if (request.data?.price) return request.data.price;
        if (request.data?.total_price) return request.data.total_price;
        if (request.data?.estimated_price) return request.data.estimated_price;
        // Default estimates based on type
        switch (request.type) {
          case 'private_jet_charter': return 25000;
          case 'helicopter_charter': return 5000;
          case 'yacht_charter': return 15000;
          case 'spv_formation': return 10000;
          case 'tokenization_request':
          case 'asset_tokenization':
          case 'rwa_tokenization': return 50000;
          default: return 0;
        }
      };

      const requestStats = {
        total: completedRequests.reduce((sum, r) => sum + calculateRequestValue(r), 0),
        completed: completedRequests.length,
        pending: pendingRequests.length,
        jetCharters: completedRequests.filter(r => r.type === 'private_jet_charter').reduce((sum, r) => sum + calculateRequestValue(r), 0),
        helicopterCharters: completedRequests.filter(r => r.type === 'helicopter_charter').reduce((sum, r) => sum + calculateRequestValue(r), 0),
        yachtCharters: completedRequests.filter(r => r.type === 'yacht_charter').reduce((sum, r) => sum + calculateRequestValue(r), 0),
        spvFormations: completedRequests.filter(r => r.type === 'spv_formation').reduce((sum, r) => sum + calculateRequestValue(r), 0),
        tokenization: completedRequests.filter(r => ['tokenization_request', 'asset_tokenization', 'rwa_tokenization'].includes(r.type)).reduce((sum, r) => sum + calculateRequestValue(r), 0)
      };

      // Calculate grand total
      const grandTotal = subscriptionStats.total + bookingStats.total + requestStats.total;

      // Calculate month-over-month growth
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { data: lastMonthBookings } = await supabase
        .from('user_bookings')
        .select('total_amount')
        .eq('payment_status', 'paid')
        .gte('created_at', new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString())
        .lt('created_at', new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1).toISOString());

      const lastMonthRevenue = lastMonthBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 1;

      const thisMonth = new Date();
      const { data: thisMonthBookings } = await supabase
        .from('user_bookings')
        .select('total_amount')
        .eq('payment_status', 'paid')
        .gte('created_at', new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString());

      const thisMonthRevenue = thisMonthBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const monthlyGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Fetch recent transactions
      const { data: recentData } = await supabase
        .from('user_bookings')
        .select(`
          id,
          service_title,
          total_amount,
          currency,
          payment_status,
          booking_type,
          created_at,
          users:user_id (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentTransactions(recentData || []);

      setStats({
        subscriptions: subscriptionStats,
        bookings: bookingStats,
        requests: requestStats,
        grandTotal,
        monthlyGrowth
      });
    } catch (error) {
      console.error('Error fetching earnings stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Earnings Dashboard</h1>
            <p className="text-sm text-gray-500">Total revenue from subscriptions, bookings & requests</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={fetchAllStats}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Grand Total Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm mb-1">Total Revenue</p>
            <p className="text-4xl font-bold">{formatCurrency(stats.grandTotal)}</p>
            <div className="flex items-center gap-2 mt-2">
              {stats.monthlyGrowth >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-200" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-200" />
              )}
              <span className={`text-sm ${stats.monthlyGrowth >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                {stats.monthlyGrowth.toFixed(1)}% from last month
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-emerald-100 text-sm">MRR (Subscriptions)</div>
            <div className="text-2xl font-semibold">{formatCurrency(stats.subscriptions.mrr)}</div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subscriptions Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Subscriptions</h3>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.subscriptions.total)}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Starter ($20/mo)</span>
              <span className="font-medium text-gray-900">{stats.subscriptions.starterCount} users = {formatCurrency(stats.subscriptions.starter)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Pro ($40/mo)</span>
              <span className="font-medium text-gray-900">{stats.subscriptions.proCount} users = {formatCurrency(stats.subscriptions.pro)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Elite ($130/mo)</span>
              <span className="font-medium text-gray-900">{stats.subscriptions.eliteCount} users = {formatCurrency(stats.subscriptions.elite)}</span>
            </div>
          </div>
        </div>

        {/* Bookings Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Bookings</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.bookings.total)}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Plane className="w-3 h-3" /> Empty Legs
              </span>
              <span className="font-medium text-gray-900">{formatCurrency(stats.bookings.emptyLegs)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Adventures</span>
              <span className="font-medium text-gray-900">{formatCurrency(stats.bookings.adventures)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">CO2 Certificates</span>
              <span className="font-medium text-gray-900">{formatCurrency(stats.bookings.co2Certificates)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Other</span>
              <span className="font-medium text-gray-900">{formatCurrency(stats.bookings.other)}</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Paid: {stats.bookings.paid}</span>
              <span>Pending: {stats.bookings.pending}</span>
            </div>
          </div>
        </div>

        {/* Requests Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Requests (Est.)</h3>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.requests.total)}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Plane className="w-3 h-3" /> Jet Charters
              </span>
              <span className="font-medium text-gray-900">{formatCurrency(stats.requests.jetCharters)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Helicopter Charters</span>
              <span className="font-medium text-gray-900">{formatCurrency(stats.requests.helicopterCharters)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> SPV Formations
              </span>
              <span className="font-medium text-gray-900">{formatCurrency(stats.requests.spvFormations)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Coins className="w-3 h-3" /> Tokenization
              </span>
              <span className="font-medium text-gray-900">{formatCurrency(stats.requests.tokenization)}</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Completed: {stats.requests.completed}</span>
              <span>Pending: {stats.requests.pending}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <a href="/admin/bookings" className="text-sm text-emerald-600 hover:underline">View all</a>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions yet
            </div>
          ) : (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.payment_status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {transaction.payment_status === 'paid' ? (
                      <DollarSign className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 truncate max-w-[200px]">
                      {transaction.service_title || 'Unknown Service'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.users?.name || transaction.users?.email || 'Unknown user'} • {formatDate(transaction.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${transaction.payment_status === 'paid' ? 'text-green-600' : 'text-gray-900'}`}>
                    {formatCurrency(transaction.total_amount, transaction.currency)}
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${
                    transaction.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.payment_status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
