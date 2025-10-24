import React, { useState, useEffect } from 'react';
import { Rocket, Loader2, TrendingUp, Users, Clock, CheckCircle, Plus, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from 'wagmi';

export default function MyLaunches() {
  const { user } = useAuth();
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [userLaunches, setUserLaunches] = useState([]);

  useEffect(() => {
    if (user?.id || address) {
      fetchUserLaunches();
    } else {
      setLoading(false);
    }
  }, [user?.id, address]);

  const fetchUserLaunches = async () => {
    setLoading(true);
    try {
      // Fetch user's waitlist entries from database
      const { data, error } = await supabase
        .from('launchpad_waitlist')
        .select(`
          *,
          launch:launchpad_projects(*)
        `)
        .or(`user_id.eq.${user?.id},wallet_address.eq.${address?.toLowerCase()}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching launches:', error);
        setUserLaunches([]);
      } else {
        setUserLaunches(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setUserLaunches([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="w-full h-full overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-gray-900 mb-2">My Launches</h1>
            <p className="text-gray-600">Track your waitlist entries and launches</p>
          </div>

          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Loading your launches...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">My Launches</h1>
          <p className="text-gray-600">Track your waitlist entries and launches</p>
        </div>

        {/* Launches Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Loading launches...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userLaunches.map((entry) => {
              const launch = entry.launch;
              const progress = launch?.current_waitlist || 0;
              const target = launch?.target_waitlist || 100;
              const progressPercentage = target > 0 ? (progress / target) * 100 : 0;

              return (
                <div key={entry.id} className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Rocket size={24} className="text-white" />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(launch?.status || 'upcoming')}`}>
                      {launch?.status || 'upcoming'}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {launch?.name || 'Launch Project'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {launch?.description || 'No description available'}
                  </p>

                  {/* Waitlist Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-500">Waitlist Progress</span>
                      <span className="font-medium text-gray-900">
                        {progress}/{target}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {progressPercentage >= 100
                        ? 'Target reached! Launch starting soon...'
                        : `${(100 - progressPercentage).toFixed(0)}% to launch`}
                    </p>
                  </div>

                  {/* Stats */}
                  {launch?.token_price && (
                    <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Token Price</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(launch.token_price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Supply</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {launch.total_supply?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Join Date */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={14} />
                    <span>Joined {new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {userLaunches.length === 0 && (
              <div className="col-span-full">
                <div className="bg-white/60 backdrop-blur-xl border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <Rocket size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">No launch waitlists yet</p>
                  <p className="text-xs text-gray-500 mb-4">Browse launchpad to join upcoming projects</p>
                  <button
                    onClick={() => window.location.href = '/launchpad'}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                  >
                    <Package size={16} />
                    Browse Launchpad
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
