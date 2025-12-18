import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Calendar, 
  Clock, 
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  details: any | null;
  created_at: string | null;
  system_users?: {
    name: string;
    email: string;
    role: string;
  };
}

export const ActivityMonitoringDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchActivities();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('activity-logs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_activity_logs' }, 
          payload => {
            setActivities(prev => [payload.new as ActivityLog, ...prev]);
          }
        )
        .subscribe();
        
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, timeFilter]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let query = supabase
        .from('user_activity_logs')
        .select(`
          *,
          system_users (name, email, role)
        `)
        .order('created_at', { ascending: false });
        
      // Apply time filter
      if (timeFilter !== 'all') {
        const cutoffDate = new Date();
        if (timeFilter === '24h') cutoffDate.setDate(cutoffDate.getDate() - 1);
        if (timeFilter === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7);
        if (timeFilter === '30d') cutoffDate.setDate(cutoffDate.getDate() - 30);
        
        query = query.gte('created_at', cutoffDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setActivities(data || []);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message || 'Failed to fetch activity data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.system_users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.system_users?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(activity.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const formatActivityAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activity data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">System Activity Log</h2>
          <button 
            onClick={fetchActivities}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search activities by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">User</th>
                <th className="text-left p-4 font-medium text-gray-700">Action</th>
                <th className="text-left p-4 font-medium text-gray-700">Details</th>
                <th className="text-left p-4 font-medium text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.slice(0, showAll ? undefined : 10).map((activity) => (
                <tr key={activity.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black">{activity.system_users?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{activity.system_users?.email || 'Unknown'}</p>
                        <p className="text-xs text-gray-400 capitalize">{activity.system_users?.role || 'Unknown'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">{formatActivityAction(activity.action)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="max-w-xs overflow-hidden text-ellipsis">
                      {activity.details ? (
                        <div className="text-xs bg-gray-100 p-2 rounded font-mono max-h-20 overflow-y-auto">
                          <pre className="whitespace-pre-wrap break-words">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No details</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{getTimeAgo(activity.created_at)}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No activities found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search or time filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredActivities.length > 10 && !showAll && (
          <div className="p-4 border-t border-gray-200 text-center">
            <button 
              onClick={() => setShowAll(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center mx-auto space-x-1"
            >
              <span>View All Activities</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {showAll && (
          <div className="p-4 border-t border-gray-200 text-center">
            <button 
              onClick={() => setShowAll(false)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center mx-auto space-x-1"
            >
              <span>Show Less</span>
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};