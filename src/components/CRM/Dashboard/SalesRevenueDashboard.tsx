import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Calendar, Award, Target, ExternalLink, Building2, Check, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';

interface SalesData {
  user_id: string;
  user_name: string;
  monthly_revenue: number;
  total_deals: number;
  avg_deal_size: number;
  department: string;
}

interface RecentActivity {
  id: string;
  action: string;
  user_name: string;
  details: any;
  created_at: string;
}

interface RecentSale {
  id: string;
  company_name: string;
  deal_amount: number;
  deal_date: string;
  status: string;
  sales_person: string;
  commission_amount: number;
}

export const SalesRevenueDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSalesData();
    fetchRecentActivities();
    fetchRecentSales();
  }, [timeRange]);

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      
      // Get date range based on selected time range
      const currentDate = new Date();
      let startDate = new Date();
      
      if (timeRange === 'month') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      } else if (timeRange === 'quarter') {
        const quarter = Math.floor(currentDate.getMonth() / 3);
        startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
      } else if (timeRange === 'year') {
        startDate = new Date(currentDate.getFullYear(), 0, 1);
      }

      // Fetch real sales deals from the database
      const { data: salesDeals, error } = await supabase
        .from('sales_deals')
        .select(`
          id,
          deal_amount,
          sales_user_id,
          status,
          deal_date,
          system_users!sales_user_id (name, department)
        `)
        .gte('deal_date', startDate.toISOString().split('T')[0])
        .lte('deal_date', currentDate.toISOString().split('T')[0])
        .eq('status', 'closed');

      if (error) throw error;

      // Group by user and calculate metrics
      const userSalesMap = new Map<string, SalesData>();
      let periodTotal = 0;

      salesDeals?.forEach(deal => {
        const userId = deal.sales_user_id;
        const userName = deal.system_users?.name || 'Unknown';
        const department = deal.system_users?.department || 'Unknown';
        const amount = deal.deal_amount || 0;

        periodTotal += amount;

        if (userSalesMap.has(userId)) {
          const existing = userSalesMap.get(userId)!;
          existing.monthly_revenue += amount;
          existing.total_deals += 1;
          existing.avg_deal_size = existing.monthly_revenue / existing.total_deals;
        } else {
          userSalesMap.set(userId, {
            user_id: userId,
            user_name: userName,
            monthly_revenue: amount,
            total_deals: 1,
            avg_deal_size: amount,
            department
          });
        }
      });

      setSalesData(Array.from(userSalesMap.values()).sort((a, b) => b.monthly_revenue - a.monthly_revenue));
      setCurrentMonthTotal(periodTotal);
    } catch (err: any) {
      console.error('Error fetching sales data:', err);
      showError('Error', 'Failed to load sales performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select(`
          id,
          action,
          details,
          created_at,
          system_users!user_id (name)
        `)
        .in('action', ['order_created', 'client_added', 'deal_closed', 'company_added', 'partner_deal_status_change', 'client_status_change'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedActivities = data?.map(activity => ({
        id: activity.id,
        action: activity.action,
        user_name: activity.system_users?.name || 'Unknown',
        details: activity.details,
        created_at: activity.created_at
      })) || [];

      setRecentActivities(formattedActivities);
    } catch (err: any) {
      console.error('Error fetching recent activities:', err);
      showError('Error', 'Failed to load recent activities');
    }
  };

  const fetchRecentSales = async () => {
    try {
      setIsRefreshing(true);
      // Fetch real sales deals from the database
      const { data, error } = await supabase
        .from('sales_deals')
        .select(`
          id,
          deal_amount,
          deal_date,
          status,
          commission_amount,
          partners!partner_id (company_name),
          system_users!sales_user_id (name)
        `)
        .eq('status', 'closed')
        .order('deal_date', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Format the data
      const formattedSales: RecentSale[] = data?.map(deal => ({
        id: deal.id,
        company_name: deal.partners?.company_name || 'Unknown Company',
        deal_amount: deal.deal_amount,
        deal_date: deal.deal_date,
        status: deal.status,
        sales_person: deal.system_users?.name || 'Unknown',
        commission_amount: deal.commission_amount || 0
      })) || [];
      
      setRecentSales(formattedSales);
    } catch (err: any) {
      console.error('Error fetching recent sales:', err);
      showError('Error', 'Failed to load recent sales data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatActivityMessage = (activity: RecentActivity) => {
    switch (activity.action) {
      case 'order_created':
        return `created a new order for ${activity.details?.service_name || 'service'}`;
      case 'client_added':
        return `added a new client: ${activity.details?.client_name || 'Unknown'}`;
      case 'deal_closed':
        return `closed a deal worth $${activity.details?.amount?.toLocaleString() || '0'}`;
      case 'company_added':
        return `added a new company: ${activity.details?.company_name || 'Unknown'}`;
      case 'partner_deal_status_change':
        return `updated ${activity.details?.company_name || 'a company'} to ${activity.details?.new_status || 'new status'}`;
      case 'client_status_change':
        return `updated ${activity.details?.client_name || 'a client'} to ${activity.details?.new_status || 'new status'}`;
      default:
        return activity.action.replace('_', ' ');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'month': return 'Current Month';
      case 'quarter': return 'Current Quarter';
      case 'year': return 'Year to Date';
      default: return 'Current Month';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
          <div className="p-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
          <div className="p-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Sales Performance */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Sales Performance
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchSalesData}
              className="text-sm text-gray-600 hover:text-black flex items-center space-x-1"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">Year to Date</option>
            </select>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{getTimeRangeLabel()} Revenue</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-black">${currentMonthTotal.toLocaleString()}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-black">Top Performers</h3>
              <button 
                onClick={() => window.location.hash = "#sales-crm"}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>View All</span>
              </button>
            </div>
            {salesData.slice(0, 5).map((sales, index) => (
              <div key={sales.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-black">{sales.user_name}</p>
                    <p className="text-xs text-gray-500">{sales.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-black">${sales.monthly_revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{sales.total_deals} deals</p>
                </div>
              </div>
            ))}
            
            {salesData.length === 0 && (
              <div className="text-center py-4">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No sales data for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Recent Sales
          </h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={fetchRecentSales}
              className="text-sm text-gray-600 hover:text-black flex items-center space-x-1"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Refresh</span>
            </button>
            <button 
              onClick={() => window.location.hash = "#sales-crm"}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View All</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Company</th>
                <th className="text-left p-4 font-medium text-gray-700">Sales Rep</th>
                <th className="text-left p-4 font-medium text-gray-700">Amount</th>
                <th className="text-left p-4 font-medium text-gray-700">Commission</th>
                <th className="text-left p-4 font-medium text-gray-700">Date</th>
                <th className="text-left p-4 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-black">{sale.company_name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-700">{sale.sales_person}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-black">${sale.deal_amount.toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-green-600 font-medium">${sale.commission_amount.toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-600">{new Date(sale.deal_date).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 rounded-full flex items-center space-x-1 bg-green-100 text-green-800">
                      <Check className="w-3 h-3" />
                      <span>Closed</span>
                    </span>
                  </td>
                </tr>
              ))}
              {recentSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No recent sales</p>
                    <button 
                      onClick={fetchRecentSales}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Refresh Data
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Recent Team Activities
          </h2>
          <button 
            onClick={() => window.location.hash = "#activity"}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View All</span>
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-black">
                    <span className="font-medium">{activity.user_name}</span>{' '}
                    {formatActivityMessage(activity)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{getTimeAgo(activity.created_at)}</p>
                </div>
              </div>
            ))}
            
            {recentActivities.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No recent activities</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};