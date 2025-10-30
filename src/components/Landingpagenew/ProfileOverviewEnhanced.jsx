import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, FileText, TrendingUp, Receipt, DollarSign, AlertCircle,
  CheckCircle, X, MoreVertical, ArrowUpRight, ArrowDownRight, ChevronLeft,
  ChevronRight, Calendar as CalendarIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function ProfileOverviewEnhanced() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState('requests');
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
  const [p2pTransactions, setP2pTransactions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchCalendarEvents();
    }
  }, [currentMonth, user?.id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchBalance(),
        fetchChartData(),
        fetchRecentRequests(),
        fetchRecentTransactions(),
        fetchP2PTransactions(),
        fetchCalendarEvents()
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

      // Get incidents (failed transactions)
      const { count: incidentsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'failed');

      setMetrics({
        totalBookings: bookingsCount || 0,
        newRequests: newRequestsCount || 0,
        tokenizationProjects: tokenCount || 0,
        totalTransactions: transCount || 0,
        pvcxBalance: Math.round(pvcxBalance),
        incidents: incidentsCount || 0
      });
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

  const fetchP2PTransactions = async () => {
    try {
      // Fetch P2P marketplace transactions if they exist in launchpad_transactions
      const { data } = await supabase
        .from('launchpad_transactions')
        .select('*')
        .eq('buyer_address', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setP2pTransactions(data || []);
    } catch (error) {
      console.error('Error fetching P2P transactions:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', startOfMonth.toISOString())
        .lte('start_date', endOfMonth.toISOString())
        .order('start_date', { ascending: true });

      setCalendarEvents(data || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const navigateToCategory = (category) => {
    const event = new CustomEvent('navigate-to-category', { detail: { category } });
    window.dispatchEvent(event);
  };

  const handleCardClick = (cardId) => {
    setSelectedCard(cardId);

    // Navigate to appropriate page
    const categoryMap = {
      bookings: 'requests', // Show My Requests for bookings
      requests: 'requests',
      tokenization: 'tokenization',
      transactions: 'transactions',
      pvcx: 'wallet-nfts', // Navigate to wallet for PVCX
      incidents: 'transactions'
    };

    if (categoryMap[cardId]) {
      navigateToCategory(categoryMap[cardId]);
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

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dayDate = new Date(year, month, day);

    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === month &&
             eventDate.getFullYear() === year;
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
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

  const days = getDaysInMonth();
  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() &&
           currentMonth.getMonth() === today.getMonth() &&
           currentMonth.getFullYear() === today.getFullYear();
  };

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
              <button
                onClick={() => navigateToCategory('p2p-trading')}
                className="text-sm text-gray-400 hover:text-gray-700 pb-4 transition-colors"
              >
                Send money
              </button>
              <button
                onClick={() => navigateToCategory('swap')}
                className="text-sm text-gray-400 hover:text-gray-700 pb-4 transition-colors"
              >
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
                      onClick={() => handleCardClick(card.id)}
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

            {/* P2P Transactions Overview */}
            {p2pTransactions.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-gray-900">P2P Trading Activity</div>
                  <button
                    onClick={() => navigateToCategory('p2p-trading')}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {p2pTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          🔄
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            P2P Transaction
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(tx.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {tx.amount_paid ? formatCurrency(tx.amount_paid) : '-'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tx.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

          {/* Right Column - Calendar */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={previousMonth}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <div className="text-sm font-medium text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="mb-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-[10px] text-gray-400 text-center font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <div key={index} className="relative">
                        {day ? (
                          <button
                            className={`w-full aspect-square text-xs flex items-center justify-center rounded transition-colors ${
                              isToday(day)
                                ? 'bg-gray-900 text-white font-semibold'
                                : hasEvents
                                ? 'bg-blue-50 text-gray-900 hover:bg-blue-100'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {day}
                          </button>
                        ) : (
                          <div className="w-full aspect-square"></div>
                        )}
                        {hasEvents && !isToday(day) && (
                          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium text-gray-900">Upcoming Events</div>
                  <button
                    onClick={() => navigateToCategory('calendar')}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    View all
                  </button>
                </div>
                {calendarEvents.length > 0 ? (
                  <div className="space-y-2">
                    {calendarEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 transition-colors">
                        <CalendarIcon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {event.title}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {formatDate(event.start_date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CalendarIcon size={24} className="text-gray-300 mx-auto mb-2" />
                    <div className="text-xs text-gray-400">No upcoming events</div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={() => navigateToCategory('calendar')}
                  className="w-full px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
                >
                  Manage Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
