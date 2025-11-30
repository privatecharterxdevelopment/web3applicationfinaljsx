import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  User,
  Mail,
  Calendar,
  DollarSign,
  Crown,
  TrendingUp,
  Bell
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Subscription {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  chats_used: number;
  chats_limit: number;
  messages_per_chat: number;
  created_at: string;
  updated_at: string;
  users?: {
    name: string;
    email: string;
  };
}

interface SubscriptionEvent {
  id: string;
  user_id: string;
  event_type: string;
  tier: string;
  amount?: number;
  created_at: string;
}

export default function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recentEvents, setRecentEvents] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSubscriptions();
    fetchRecentEvents();
  }, [tierFilter, statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);

      // Fetch users with their subscription tier from user_profiles or similar
      let query = supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          subscription_tier,
          subscription_status,
          stripe_customer_id,
          stripe_subscription_id,
          subscription_period_start,
          subscription_period_end,
          chats_used_this_month,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      // Only filter by tier if user has a subscription
      if (tierFilter !== 'all') {
        query = query.eq('subscription_tier', tierFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching subscriptions:', error);
        // Try alternate approach - users table might have different structure
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (!usersError && usersData) {
          // Map users to subscription format
          const mappedSubs = usersData
            .filter((u: any) => u.subscription_tier && u.subscription_tier !== 'explorer')
            .map((u: any) => ({
              id: u.id,
              user_id: u.id,
              tier: u.subscription_tier || 'explorer',
              status: u.subscription_status || 'active',
              stripe_customer_id: u.stripe_customer_id,
              stripe_subscription_id: u.stripe_subscription_id,
              current_period_start: u.subscription_period_start,
              current_period_end: u.subscription_period_end,
              chats_used: u.chats_used_this_month || 0,
              chats_limit: getTierLimit(u.subscription_tier),
              messages_per_chat: getTierMessages(u.subscription_tier),
              created_at: u.created_at,
              updated_at: u.updated_at,
              users: {
                name: u.name || 'Unknown',
                email: u.email || 'No email'
              }
            }));
          setSubscriptions(mappedSubs);
        }
        return;
      }

      // Map data to subscription format
      const mappedSubs = (data || [])
        .filter((u: any) => u.subscription_tier && u.subscription_tier !== 'explorer')
        .map((u: any) => ({
          id: u.id,
          user_id: u.id,
          tier: u.subscription_tier || 'explorer',
          status: u.subscription_status || 'active',
          stripe_customer_id: u.stripe_customer_id,
          stripe_subscription_id: u.stripe_subscription_id,
          current_period_start: u.subscription_period_start,
          current_period_end: u.subscription_period_end,
          chats_used: u.chats_used_this_month || 0,
          chats_limit: getTierLimit(u.subscription_tier),
          messages_per_chat: getTierMessages(u.subscription_tier),
          created_at: u.created_at,
          updated_at: u.updated_at,
          users: {
            name: u.name || 'Unknown',
            email: u.email || 'No email'
          }
        }));

      setSubscriptions(mappedSubs);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentEvents = async () => {
    try {
      // Fetch recent subscription events/changes
      const { data, error } = await supabase
        .from('subscription_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setRecentEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const getTierLimit = (tier: string): number => {
    switch (tier) {
      case 'starter':
        return 5;
      case 'pro':
        return 20;
      case 'elite':
        return -1; // Unlimited
      default:
        return 0;
    }
  };

  const getTierMessages = (tier: string): number => {
    switch (tier) {
      case 'starter':
        return 50;
      case 'pro':
        return 100;
      case 'elite':
        return -1; // Unlimited
      default:
        return 0;
    }
  };

  const getTierPrice = (tier: string): number => {
    switch (tier) {
      case 'starter':
        return 20;
      case 'pro':
        return 40;
      case 'elite':
        return 130;
      default:
        return 0;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'starter':
        return 'bg-blue-100 text-blue-800';
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      case 'elite':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const userName = sub.users?.name || '';
    const userEmail = sub.users?.email || '';
    const searchLower = searchTerm.toLowerCase();

    return (
      userName.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower) ||
      sub.id.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: subscriptions.length,
    starter: subscriptions.filter(s => s.tier === 'starter').length,
    pro: subscriptions.filter(s => s.tier === 'pro').length,
    elite: subscriptions.filter(s => s.tier === 'elite').length,
    mrr: subscriptions.reduce((sum, s) => sum + getTierPrice(s.tier), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-sm text-gray-500">Manage user subscriptions and billing</p>
          </div>
        </div>
        <button
          onClick={() => { fetchSubscriptions(); fetchRecentEvents(); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <User className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Starter ($20)</p>
              <p className="text-2xl font-bold text-blue-600">{stats.starter}</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pro ($40)</p>
              <p className="text-2xl font-bold text-purple-600">{stats.pro}</p>
            </div>
            <Crown className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Elite ($130)</p>
              <p className="text-2xl font-bold text-amber-600">{stats.elite}</p>
            </div>
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-green-600">${stats.mrr}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Recent Events Banner */}
      {recentEvents.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Recent Subscription Events</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentEvents.slice(0, 5).map((event) => (
              <span
                key={event.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm border border-gray-200"
              >
                <span className={`w-2 h-2 rounded-full ${
                  event.event_type === 'subscription_created' ? 'bg-green-500' :
                  event.event_type === 'subscription_upgraded' ? 'bg-blue-500' :
                  event.event_type === 'subscription_canceled' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}></span>
                <span className="font-medium text-gray-700 capitalize">
                  {event.event_type.replace(/_/g, ' ')}
                </span>
                <span className="text-gray-500">- {event.tier}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Tiers</option>
            <option value="starter">Starter</option>
            <option value="pro">Professional</option>
            <option value="elite">Elite</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscriptions Found</h3>
          <p className="text-gray-500">
            {searchTerm || tierFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No users have subscribed yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period End
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {sub.users?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sub.users?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTierColor(sub.tier)}`}>
                        {sub.tier === 'elite' && <Crown className="w-3 h-3 mr-1" />}
                        {sub.tier.toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        ${getTierPrice(sub.tier)}/mo
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {sub.chats_used}
                      </span>
                      <span className="text-gray-500">
                        /{sub.chats_limit === -1 ? '∞' : sub.chats_limit} chats
                      </span>
                    </div>
                    {sub.chats_limit > 0 && (
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                        <div
                          className={`h-full rounded-full ${
                            sub.chats_used / sub.chats_limit > 0.9 ? 'bg-red-500' :
                            sub.chats_used / sub.chats_limit > 0.7 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((sub.chats_used / sub.chats_limit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                      {sub.status === 'active' ? <CheckCircle className="w-3 h-3" /> :
                       sub.status === 'past_due' ? <AlertCircle className="w-3 h-3" /> :
                       <XCircle className="w-3 h-3" />}
                      {sub.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sub.current_period_end
                      ? formatDate(sub.current_period_end)
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedSubscription(sub);
                        setShowDetailsModal(true);
                      }}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTierColor(selectedSubscription.tier).replace('text-', 'bg-').split(' ')[0]}`}>
                  <Crown className="w-6 h-6 text-current" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedSubscription.users?.name || 'Subscription Details'}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedSubscription.users?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* Plan Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Subscription Plan</h3>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierColor(selectedSubscription.tier)}`}>
                        <Crown className="w-4 h-4 mr-1" />
                        {selectedSubscription.tier.toUpperCase()}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${getTierPrice(selectedSubscription.tier)}/mo
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Chats per Month</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedSubscription.chats_limit === -1 ? 'Unlimited' : selectedSubscription.chats_limit}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Messages per Chat</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedSubscription.messages_per_chat === -1 ? 'Unlimited' : selectedSubscription.messages_per_chat}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Stats */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Current Usage</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Chats Used This Month</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedSubscription.chats_used} / {selectedSubscription.chats_limit === -1 ? '∞' : selectedSubscription.chats_limit}
                      </span>
                    </div>
                    {selectedSubscription.chats_limit > 0 && (
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className={`h-full rounded-full transition-all ${
                            selectedSubscription.chats_used / selectedSubscription.chats_limit > 0.9 ? 'bg-red-500' :
                            selectedSubscription.chats_used / selectedSubscription.chats_limit > 0.7 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((selectedSubscription.chats_used / selectedSubscription.chats_limit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Billing Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSubscription.status)}`}>
                          {selectedSubscription.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {selectedSubscription.status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Period End</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedSubscription.current_period_end
                            ? formatDate(selectedSubscription.current_period_end)
                            : 'N/A'}
                        </div>
                      </div>
                      {selectedSubscription.stripe_subscription_id && (
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500 mb-1">Stripe Subscription ID</div>
                          <div className="text-sm font-mono text-gray-700">
                            {selectedSubscription.stripe_subscription_id}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
