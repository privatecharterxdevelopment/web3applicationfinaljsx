import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plane,
  Leaf,
  FileText,
  Shield,
  Users,
  DollarSign
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdminPermissions } from '../../../hooks/useAdminPermissions';

interface RequestStats {
  total: number;
  pending: number;
  completed: number;
  in_progress: number;
}

interface DashboardStats {
  booking_requests: RequestStats;
  co2_certificate_requests: RequestStats;
  user_requests: RequestStats;
  kyc_applications: RequestStats;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    canManageBookings,
    canManageCO2Requests,
    canManageUserRequests,
    canManageKYC,
    isLoading: permissionsLoading
  } = useAdminPermissions();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Debug: Log current permissions
      console.log('Admin Analytics Debug:', {
        permissionsLoading,
        canManageBookings,
        canManageCO2Requests,
        canManageUserRequests,
        canManageKYC
      });

      // Fetch stats for each request type based on permissions
      const statsPromises = [];
      
      if (canManageBookings) {
        statsPromises.push(
          supabase
            .from('booking_requests')
            .select('status')
            .then(({ data, error }) => ({ 
              table: 'booking_requests', 
              data: error ? null : data,
              error 
            }))
        );
      }

      if (canManageCO2Requests) {
        statsPromises.push(
          supabase
            .from('co2_certificate_requests')
            .select('status')
            .then(({ data, error }) => ({ 
              table: 'co2_certificate_requests', 
              data: error ? null : data,
              error 
            }))
        );
      }

      if (canManageUserRequests) {
        statsPromises.push(
          supabase
            .from('user_requests')
            .select('status')
            .then(({ data, error }) => ({ 
              table: 'user_requests', 
              data: error ? null : data,
              error 
            }))
        );
      }

      if (canManageKYC) {
        statsPromises.push(
          supabase
            .from('kyc_applications')
            .select('status')
            .then(({ data, error }) => ({ 
              table: 'kyc_applications', 
              data: error ? null : data,
              error 
            }))
        );
      }

      const results = await Promise.all(statsPromises);
      
      // Debug: Log query results
      console.log('Query results:', results);
      
      // Process stats
      const processedStats: Partial<DashboardStats> = {};
      
      results.forEach(({ table, data, error }) => {
        if (error) {
          console.error(`Failed to load ${table} stats:`, error);
          return;
        }
        
        if (data) {
          const total = data.length;
          let pending, completed, in_progress;

          // Map status values based on table type
          if (table === 'booking_requests') {
            pending = data.filter(item => item.status === 'pending').length;
            completed = data.filter(item => 
              item.status === 'completed' || 
              item.status === 'confirmed'
            ).length;
            in_progress = data.filter(item => item.status === 'in_progress').length;
          } else if (table === 'co2_certificate_requests') {
            pending = data.filter(item => 
              item.status === 'pending' || 
              item.status === 'under_review'
            ).length;
            completed = data.filter(item => 
              item.status === 'completed' || 
              item.status === 'approved'
            ).length;
            in_progress = data.filter(item => 
              item.status === 'ngo_assigned' ||
              item.status === 'in_progress'
            ).length;
          } else if (table === 'user_requests') {
            pending = data.filter(item => item.status === 'pending').length;
            completed = data.filter(item => item.status === 'completed').length;
            in_progress = data.filter(item => item.status === 'in_progress').length;
          } else if (table === 'kyc_applications') {
            pending = data.filter(item => 
              item.status === 'pending' || 
              item.status === 'under_review'
            ).length;
            completed = data.filter(item => item.status === 'approved').length;
            in_progress = data.filter(item => 
              item.status === 'requires_additional_info'
            ).length;
          } else {
            // Fallback to original logic
            pending = data.filter(item => 
              item.status === 'pending' || 
              item.status === 'under_review'
            ).length;
            completed = data.filter(item => 
              item.status === 'completed' || 
              item.status === 'approved' ||
              item.status === 'confirmed'
            ).length;
            in_progress = data.filter(item => 
              item.status === 'in_progress' ||
              item.status === 'price_proposed' ||
              item.status === 'payment_pending'
            ).length;
          }

          processedStats[table as keyof DashboardStats] = {
            total,
            pending,
            completed,
            in_progress
          };
        }
      });

      setStats(processedStats as DashboardStats);

      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('admin_action_log')
        .select('id, action_type, target_table, created_at, admin_notes')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) {
        console.warn('Failed to load recent activity:', activityError);
        setRecentActivity([]); // Continue without recent activity
      } else if (activityData) {
        const formattedActivity = activityData.map(item => ({
          id: item.id,
          type: item.target_table,
          description: `${item.action_type.charAt(0).toUpperCase() + item.action_type.slice(1)} ${item.target_table.replace('_', ' ')}`,
          timestamp: item.created_at,
          status: item.action_type
        }));
        setRecentActivity(formattedActivity);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [canManageBookings, canManageCO2Requests, canManageUserRequests, canManageKYC]);

  useEffect(() => {
    // Only fetch data when permissions are loaded and not in loading state
    if (!permissionsLoading && (canManageBookings || canManageCO2Requests || canManageUserRequests || canManageKYC)) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, canManageBookings, canManageCO2Requests, canManageUserRequests, canManageKYC, permissionsLoading]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Booking Requests',
      data: stats?.booking_requests,
      icon: Plane,
      color: 'blue',
      visible: canManageBookings
    },
    {
      title: 'CO2 Certificates',
      data: stats?.co2_certificate_requests,
      icon: Leaf,
      color: 'green',
      visible: canManageCO2Requests
    },
    {
      title: 'User Requests',
      data: stats?.user_requests,
      icon: FileText,
      color: 'purple',
      visible: canManageUserRequests
    },
    {
      title: 'KYC Applications',
      data: stats?.kyc_applications,
      icon: Shield,
      color: 'orange',
      visible: canManageKYC
    }
  ].filter(card => card.visible);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = getColorClasses(card.color);
          
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {card.data?.total || 0}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${colorClasses}`}>
                  <Icon size={24} />
                </div>
              </div>
              
              {card.data && (
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-yellow-600">
                    {card.data.pending} pending
                  </span>
                  <span className="text-green-600">
                    {card.data.completed} completed
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Status Overview</h3>
          <div className="space-y-4">
            {statCards.map((card, index) => {
              if (!card.data) return null;
              
              const total = card.data.total;
              const pendingPercent = total > 0 ? (card.data.pending / total) * 100 : 0;
              const completedPercent = total > 0 ? (card.data.completed / total) * 100 : 0;
              const inProgressPercent = total > 0 ? (card.data.in_progress / total) * 100 : 0;
              
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">{card.title}</span>
                    <span className="text-sm text-gray-600">{total} total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-l-full inline-block"
                      style={{ width: `${pendingPercent}%` }}
                    ></div>
                    <div 
                      className="bg-blue-400 h-2 inline-block"
                      style={{ width: `${inProgressPercent}%` }}
                    ></div>
                    <div 
                      className="bg-green-400 h-2 rounded-r-full inline-block"
                      style={{ width: `${completedPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div>
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Admin Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activity.status === 'approve' ? 'bg-green-100 text-green-800' :
                    activity.status === 'reject' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No recent activity to display
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Action Items</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => {
            if (!card.data || card.data.pending === 0) return null;
            
            return (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {card.data.pending} {card.title.toLowerCase()} pending
                    </p>
                    <p className="text-xs text-yellow-600">
                      Requires attention
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}