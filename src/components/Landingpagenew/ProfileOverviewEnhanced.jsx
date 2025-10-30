import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, FileText, TrendingUp, Receipt, DollarSign, AlertCircle,
  CheckCircle, X, MoreVertical, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function ProfileOverviewEnhanced() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState('requests');

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    newRequests: 0,
    tokenizationProjects: 0,
    totalTransactions: 0,
    pvcxBalance: 0,
    incidents: 0
  });

  const [balance, setBalance] = useState({
    current: 0,
    monthlyIncome: 0,
    monthlyExpense: 0
  });

  const [chartData, setChartData] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchBalance(),
        fetchChartData(),
        fetchRecentRequests(),
        fetchRecentTransactions()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Get bookings count
      const { count: bookingsCount } = await supabase
        .from('booking_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get new/pending requests
      const { count: newRequestsCount } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      // Get tokenization projects
      const { count: tokenCount } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'tokenization');

      // Get transactions
      const { count: transCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get PVCX balance
      const { data: pvcxData } = await supabase
        .from('pvcx_transactions')
        .select('amount, transaction_type')
        .eq('user_id', user.id);

      const pvcxBalance = pvcxData?.reduce((sum, t) => {
        return sum + (t.transaction_type === 'credit' ? t.amount : -t.amount);
      }, 0) || 0;

      setMetrics({
        totalBookings: bookingsCount || 0,
        newRequests: newRequestsCount || 0,
        tokenizationProjects: tokenCount || 0,
        totalTransactions: transCount || 0,
        pvcxBalance: Math.round(pvcxBalance),
        incidents: 0 // Can add failed transactions count later
      });

      setPendingCount(newRequestsCount || 0);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get total bookings value
      const { data: bookings } = await supabase
        .from('booking_requests')
        .select('total_price')
        .eq('user_id', user.id);

      const totalBookingValue = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

      // Monthly income (bookings this month)
      const { data: monthlyBookings } = await supabase
        .from('booking_requests')
        .select('total_price')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth);

      const monthlyIncome = monthlyBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

      // Monthly expenses (transactions this month)
      const { data: monthlyExpenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .in('category', ['booking', 'service', 'subscription'])
        .gte('created_at', startOfMonth);

      const monthlyExpense = monthlyExpenses?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      setBalance({
        current: totalBookingValue,
        monthlyIncome,
        monthlyExpense
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      // Generate simple 30-day chart data
      const days = 30;
      const data = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Simple mock data - could be replaced with real daily aggregation
        data.push({
          date: date.getTime(),
          value: balance.current * (0.95 + Math.random() * 0.1)
        });
      }

      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const { data } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  const dashboardCards = [
    {
      id: 'bookings',
      icon: ShoppingBag,
      title: 'Bookings',
      subtitle: 'All service bookings',
      label: 'TOTAL',
      value: metrics.totalBookings
    },
    {
      id: 'requests',
      icon: FileText,
      title: 'Requests',
      subtitle: 'Pending approvals',
      label: 'NEW REQUESTS',
      value: String(metrics.newRequests).padStart(2, '0')
    },
    {
      id: 'tokenization',
      icon: TrendingUp,
      title: 'Tokenization',
      subtitle: 'Asset projects',
      label: 'PROJECTS',
      value: metrics.tokenizationProjects
    },
    {
      id: 'transactions',
      icon: Receipt,
      title: 'Transactions',
      subtitle: 'All payments',
      label: 'TOTAL',
      value: metrics.totalTransactions
    },
    {
      id: 'pvcx',
      icon: DollarSign,
      title: 'PVCX Rewards',
      subtitle: 'Token balance',
      label: 'BALANCE',
      value: metrics.pvcxBalance
    },
    {
      id: 'incidents',
      icon: AlertCircle,
      title: 'Incidents',
      subtitle: 'Failed transactions',
      label: 'ISSUES',
      value: metrics.incidents
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button className="text-sm font-medium text-gray-900 border-b-2 border-gray-900 pb-4">
                Company dashboard
              </button>
              <button className="text-sm text-gray-400 pb-4">
                Send money
              </button>
              <button className="text-sm text-gray-400 pb-4">
                Exchange funds
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <ArrowUpRight size={16} className="text-gray-400" />
                <span className="text-gray-500">Monthly income</span>
                <span className="font-semibold text-gray-900">{formatCurrency(balance.monthlyIncome)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <ArrowDownRight size={16} className="text-gray-400" />
                <span className="text-gray-500">Monthly expense</span>
                <span className="font-semibold text-gray-900">{formatCurrency(balance.monthlyExpense)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-8">
            {/* Balance Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="text-xs text-gray-500 mb-2">Balance (current month)</div>
              <div className="text-4xl font-semibold text-gray-900 mb-6">
                {formatCurrency(balance.current)}
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#000000"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Dashboard Cards */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-900 mb-4">My Dashboard</div>
              <div className="grid grid-cols-3 gap-4">
                {dashboardCards.map((card) => {
                  const Icon = card.icon;
                  const isSelected = selectedCard === card.id;

                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card.id)}
                      className={`bg-white rounded-lg border ${
                        isSelected ? 'border-gray-900' : 'border-gray-200'
                      } p-5 text-left hover:border-gray-400 transition-colors`}
                    >
                      <Icon size={20} className="text-gray-900 mb-3" />
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {card.title}
                      </div>
                      <div className="text-xs text-gray-500 mb-4">
                        {card.subtitle}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {card.label}
                        </span>
                        <span className="text-2xl font-semibold text-gray-900">
                          {card.value}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Requests */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">User Requests</div>
                <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs">🔔</span>
                </button>
              </div>
              <div className="space-y-3">
                {recentRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(request.created_at)} {new Date(request.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {request.data?.total_price && (
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(request.data.total_price)}
                        </span>
                      )}
                      <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-green-100 flex items-center justify-center">
                        <CheckCircle size={16} className="text-gray-600" />
                      </button>
                      <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center">
                        <X size={16} className="text-gray-600" />
                      </button>
                      <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                        <MoreVertical size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Expenses */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">Last expenses</div>
                  <div className="text-xs text-gray-400">{formatDate(new Date().toISOString())}</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  - {formatCurrency(balance.monthlyExpense)}
                </div>
              </div>
              <div className="space-y-3">
                {recentTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                        💳
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.description || 'Transaction'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(transaction.created_at)} {new Date(transaction.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        - {formatCurrency(transaction.amount)}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {transaction.category?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="text-sm font-medium text-gray-900 mb-4">
                Requests to manage
              </div>
              <div className="text-6xl font-bold text-gray-900 mb-4">
                {pendingCount}
              </div>
              <div className="text-xs text-gray-500 mb-6">
                Verify all the requests<br />
                Manage permissions
              </div>
              <button
                onClick={() => {
                  const event = new CustomEvent('navigate-to-view', { detail: { view: 'my-requests' } });
                  window.dispatchEvent(event);
                }}
                className="w-full px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Check requests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
