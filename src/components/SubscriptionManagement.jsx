/**
 * Subscription Management Page
 * Design: Matches MyBookingsView pattern with expandable list, filter tabs, and minimal styling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, MessageSquare, TrendingUp, Calendar, CreditCard,
  CheckCircle, DollarSign, Receipt, ArrowRight, Mail, Settings,
  ExternalLink, AlertCircle, Loader2, ChevronDown, ArrowLeft, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import stripeService from '../services/stripeService';
import { formatDistanceToNow, format } from 'date-fns';

const SubscriptionManagement = ({ onNavigateToPlans, onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleViewPlans = () => {
    if (onNavigateToPlans) {
      onNavigateToPlans();
    } else {
      navigate('/subscriptions/plans');
    }
  };

  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [spendingSummary, setSpendingSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [processingPortal, setProcessingPortal] = useState(false);
  const [portalError, setPortalError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const [profile, stats, summary, txHistory] = await Promise.all([
        subscriptionService.getUserProfile(user.id),
        subscriptionService.getChatStats(user.id),
        subscriptionService.getSpendingSummary(user.id),
        subscriptionService.getTransactionHistory(user.id, 50)
      ]);

      setSubscriptionData({
        tier: profile?.subscription_tier || 'explorer',
        status: profile?.subscription_status || 'active',
        chatsUsed: stats?.chatsUsed || 0,
        chatsLimit: stats?.chatsLimit || 1,
        chatsRemaining: stats?.chatsRemaining,
        unlimited: stats?.unlimited || false,
        resetDate: profile?.chats_reset_date,
        currentPeriodEnd: profile?.current_period_end,
        stripeCustomerId: profile?.stripe_customer_id,
        stripeSubscriptionId: profile?.stripe_subscription_id
      });
      setSpendingSummary(summary);
      setTransactions(txHistory);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscriptionData({
        tier: 'explorer',
        status: 'active',
        chatsUsed: 0,
        chatsLimit: 1,
        chatsRemaining: 1,
        unlimited: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setProcessingPortal(true);
    setPortalError(null);
    try {
      const { url } = await stripeService.createPortalSession();
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      setPortalError('Unable to open billing portal. Please try again or contact support.');
    } finally {
      setProcessingPortal(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTierDisplayName = (tier) => {
    const names = {
      explorer: 'Explorer',
      starter: 'Starter',
      pro: 'Professional',
      elite: 'Elite'
    };
    return names[tier] || tier;
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      subscription_created: 'Subscription Started',
      subscription_renewed: 'Renewal',
      subscription_upgraded: 'Plan Upgrade',
      subscription_downgraded: 'Plan Downgrade',
      subscription_canceled: 'Cancellation',
      subscription_reactivated: 'Reactivation',
      topup_purchase: 'Chat Top-up',
      refund: 'Refund'
    };
    return labels[type] || type;
  };

  const getPlanFeatures = (tier) => {
    const features = {
      explorer: { chats: '1 total', support: 'Email', concierge: 'No' },
      starter: { chats: '5/month', support: 'Email + Voice', concierge: 'No' },
      pro: { chats: '20/month', support: 'Priority', concierge: 'Yes' },
      elite: { chats: 'Unlimited', support: '24/7 VIP', concierge: 'Yes' }
    };
    return features[tier] || features.explorer;
  };

  const getTierPrice = (tier) => {
    const prices = { explorer: 0, starter: 20, pro: 40, elite: 130 };
    return prices[tier] || 0;
  };

  const getTransactionStatusStyle = (status) => {
    const styles = {
      completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      pending: 'bg-amber-50 text-amber-600 border-amber-200',
      failed: 'bg-red-50 text-red-500 border-red-200',
      refunded: 'bg-purple-50 text-purple-600 border-purple-200'
    };
    return styles[status] || styles.completed;
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'completed') return tx.status === 'completed';
    if (filter === 'pending') return tx.status === 'pending';
    return true;
  });

  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const totalSpent = spendingSummary?.total_spent || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-gray-500 font-light">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-6 py-8">
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <Crown size={40} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Sign in to manage your subscription</h2>
          <p className="text-sm text-gray-500 mb-6">View your plan details, usage stats, and billing history</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const planFeatures = getPlanFeatures(subscriptionData?.tier);
  const isPaidPlan = subscriptionData?.tier !== 'explorer';

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={18} className="text-gray-500" />
              </button>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Manage Plan</h1>
              <p className="text-xs text-gray-400 mt-0.5">View and manage your subscription</p>
            </div>
          </div>
        </div>

        {/* Stats - Minimal Inline */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div>
            <span className="text-gray-400">Plan</span>
            <span className="ml-2 font-medium text-gray-900">{getTierDisplayName(subscriptionData.tier)}</span>
          </div>
          <div>
            <span className="text-gray-400">Status</span>
            <span className="ml-2 font-medium text-emerald-600">{subscriptionData.status === 'active' ? 'Active' : subscriptionData.status}</span>
          </div>
          <div>
            <span className="text-gray-400">Chats</span>
            <span className="ml-2 font-medium text-gray-900">
              {subscriptionData.unlimited ? 'Unlimited' : `${subscriptionData.chatsUsed}/${subscriptionData.chatsLimit}`}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Total Spent</span>
            <span className="ml-2 font-medium text-gray-900">${totalSpent.toFixed(2)}</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-4">
          {['all', 'completed', 'pending'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === status
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All' : status === 'completed' ? 'Completed' : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* Current Plan Card - Expandable */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all">
          <div
            className="px-4 py-3 flex items-center gap-4 cursor-pointer"
            onClick={() => setShowPlanDetails(!showPlanDetails)}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              subscriptionData.tier === 'elite' ? 'bg-gray-900 text-white' :
              subscriptionData.tier === 'pro' ? 'bg-gray-700 text-white' :
              subscriptionData.tier === 'starter' ? 'bg-gray-600 text-white' :
              'bg-gray-100 text-gray-600'
            }`}>
              <Crown size={16} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {getTierDisplayName(subscriptionData.tier)} Plan
                </p>
                {subscriptionData.status === 'active' && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                <span>${getTierPrice(subscriptionData.tier)}/month</span>
                {subscriptionData.currentPeriodEnd && isPaidPlan && (
                  <>
                    <span>•</span>
                    <span>Renews {formatDate(subscriptionData.currentPeriodEnd)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900">{planFeatures.chats}</p>
              <p className="text-[10px] text-gray-400">AI Chats</p>
            </div>

            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${showPlanDetails ? 'rotate-180' : ''}`}
            />
          </div>

          {showPlanDetails && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-50">
              {/* Usage Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Conversations Used</p>
                  <p className="text-sm text-gray-900">
                    {subscriptionData.unlimited ? 'Unlimited' : subscriptionData.chatsUsed}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Remaining</p>
                  <p className="text-sm text-gray-900">
                    {subscriptionData.unlimited ? '∞' : subscriptionData.chatsRemaining}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Support Level</p>
                  <p className="text-sm text-gray-900">{planFeatures.support}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Concierge</p>
                  <p className="text-sm text-gray-900">{planFeatures.concierge}</p>
                </div>
              </div>

              {/* Usage Progress */}
              {!subscriptionData.unlimited && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-500">Usage</span>
                    <span className="text-gray-900">{subscriptionData.chatsUsed} / {subscriptionData.chatsLimit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (subscriptionData.chatsUsed / subscriptionData.chatsLimit) >= 0.9
                          ? 'bg-red-500'
                          : (subscriptionData.chatsUsed / subscriptionData.chatsLimit) >= 0.7
                            ? 'bg-yellow-500'
                            : 'bg-gray-900'
                      }`}
                      style={{ width: `${Math.min(100, (subscriptionData.chatsUsed / subscriptionData.chatsLimit) * 100)}%` }}
                    />
                  </div>
                  {subscriptionData.resetDate && (
                    <p className="text-[10px] text-gray-400 mt-2">Resets {formatDate(subscriptionData.resetDate)}</p>
                  )}
                </div>
              )}

              {/* Payment Summary */}
              <div className="bg-gray-900 text-white rounded-xl p-4 mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">Spending Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">This Month</span>
                    <span>${spendingSummary?.this_month?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Month</span>
                    <span>${spendingSummary?.last_month?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-700 font-medium">
                    <span>Total Spent</span>
                    <span>${totalSpent.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {subscriptionData.tier !== 'elite' && (
                  <button
                    onClick={handleViewPlans}
                    className="flex-1 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors"
                  >
                    <TrendingUp size={12} />
                    Upgrade Plan
                  </button>
                )}
                {isPaidPlan && (
                  <button
                    onClick={handleManageBilling}
                    disabled={processingPortal}
                    className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                  >
                    {processingPortal ? <Loader2 size={12} className="animate-spin" /> : <Settings size={12} />}
                    Manage Billing
                    <ExternalLink size={10} className="text-gray-400" />
                  </button>
                )}
                <button
                  onClick={handleViewPlans}
                  className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Plans
                </button>
              </div>

              {portalError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle size={12} />
                  {portalError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Receipt size={14} />
            Transaction History
            <span className="text-xs text-gray-400 font-normal">({filteredTransactions.length})</span>
          </h3>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map(tx => {
              const isExpanded = expandedId === tx.id;

              return (
                <div
                  key={tx.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all"
                >
                  <div
                    className="px-4 py-3 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'refund' ? 'bg-red-100 text-red-600' :
                      tx.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                      tx.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {tx.type === 'refund' ? (
                        <TrendingUp size={14} className="rotate-180" />
                      ) : (
                        <CreditCard size={14} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getTransactionTypeLabel(tx.type)}
                        </p>
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${getTransactionStatusStyle(tx.status)}`}>
                          {tx.status === 'completed' ? 'Completed' : tx.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        {tx.tier && <span>{getTierDisplayName(tx.tier)} Plan</span>}
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold ${tx.type === 'refund' ? 'text-red-600' : 'text-gray-900'}`}>
                        {tx.type === 'refund' ? '-' : ''}${parseFloat(tx.amount).toFixed(2)}
                      </p>
                    </div>

                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-50">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Transaction ID</p>
                          <p className="text-xs text-gray-900 font-mono truncate">{tx.id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Date</p>
                          <p className="text-sm text-gray-900">{formatDate(tx.created_at)}</p>
                        </div>
                        {tx.previous_tier && (
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Previous Plan</p>
                            <p className="text-sm text-gray-900">{getTierDisplayName(tx.previous_tier)}</p>
                          </div>
                        )}
                        {tx.tier && (
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">New Plan</p>
                            <p className="text-sm text-gray-900">{getTierDisplayName(tx.tier)}</p>
                          </div>
                        )}
                      </div>

                      {tx.description && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">{tx.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Need Help */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Need Help?</p>
              <a
                href="mailto:support@privatecharterx.com"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                support@privatecharterx.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
