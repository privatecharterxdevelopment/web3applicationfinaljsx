/**
 * Subscription Management Page
 *
 * Manage Plan - Shows:
 * - Current plan overview with usage stats
 * - Spending summary
 * - Transaction history
 * - Stripe portal for plan management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, MessageSquare, TrendingUp, Calendar, CreditCard,
  CheckCircle, DollarSign, Receipt, ArrowRight, Mail, Settings,
  ExternalLink, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import stripeService from '../services/stripeService';

const SubscriptionManagement = ({ onNavigateToPlans }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Handle navigation to plans - use prop if provided, otherwise use router
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

  // Open Stripe Customer Portal for subscription management
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
      explorer: 'Explorer (Free)',
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
      explorer: {
        chats: '1 total',
        support: 'Email',
        concierge: 'No'
      },
      starter: {
        chats: '15/month',
        support: 'Email + Voice',
        concierge: 'No'
      },
      pro: {
        chats: '30/month',
        support: 'Priority',
        concierge: 'Yes'
      },
      elite: {
        chats: 'Unlimited',
        support: '24/7 VIP',
        concierge: 'Yes'
      }
    };
    return features[tier] || features.explorer;
  };

  const getTierPrice = (tier) => {
    const prices = {
      explorer: 0,
      starter: 20,
      pro: 40,
      elite: 130
    };
    return prices[tier] || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white/50 backdrop-blur-xl border border-gray-200 rounded-2xl p-8 text-center">
          <Crown size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to manage your subscription</h2>
          <p className="text-gray-500 mb-6">View your plan details, usage stats, and billing history</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
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
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-900 mb-1">Manage Plan</h1>
        <p className="text-gray-500 font-light">View your subscription and billing details</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Plan & Usage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan Card */}
          <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  subscriptionData.tier === 'elite' ? 'bg-gray-900 text-white' :
                  subscriptionData.tier === 'pro' ? 'bg-gray-700 text-white' :
                  subscriptionData.tier === 'starter' ? 'bg-gray-600 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Crown size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                  <p className="text-gray-600">{getTierDisplayName(subscriptionData.tier)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {subscriptionData.status === 'active' && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                    <CheckCircle size={14} />
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Plan Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Monthly Price</p>
                <p className="text-2xl font-light text-gray-900">
                  <span className="font-light">${getTierPrice(subscriptionData.tier)}</span>
                  <span className="text-sm font-light text-gray-500">/mo</span>
                </p>
              </div>
              {subscriptionData.currentPeriodEnd && isPaidPlan && (
                <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Next Billing Date</p>
                  <p className="text-lg font-light text-gray-900">
                    {formatDate(subscriptionData.currentPeriodEnd)}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {subscriptionData.tier !== 'elite' && (
                <button
                  onClick={handleViewPlans}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <TrendingUp size={16} />
                  Upgrade Plan
                </button>
              )}

              {isPaidPlan && (
                <button
                  onClick={handleManageBilling}
                  disabled={processingPortal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-200 disabled:opacity-50"
                >
                  {processingPortal ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Settings size={16} />
                  )}
                  Manage Billing
                  <ExternalLink size={14} className="text-gray-400" />
                </button>
              )}

              <button
                onClick={handleViewPlans}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium border border-gray-200"
              >
                <CreditCard size={16} />
                View All Plans
              </button>
            </div>

            {portalError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={16} />
                {portalError}
              </div>
            )}
          </div>

          {/* AI Chat Usage Card */}
          <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare size={20} className="text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">AI Chat Usage</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <MessageSquare size={14} />
                  Conversations
                </div>
                <div className="text-xl font-light text-gray-900">
                  {subscriptionData.unlimited ? 'Unlimited' : `${subscriptionData.chatsUsed} / ${subscriptionData.chatsLimit}`}
                </div>
                {!subscriptionData.unlimited && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
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
                )}
              </div>
              <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <TrendingUp size={14} />
                  Remaining
                </div>
                <div className="text-xl font-light text-gray-900">
                  {subscriptionData.unlimited ? '∞' : subscriptionData.chatsRemaining}
                </div>
              </div>
              <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Calendar size={14} />
                  Resets
                </div>
                <div className="text-xl font-light text-gray-900">
                  {subscriptionData.resetDate
                    ? formatDate(subscriptionData.resetDate)
                    : subscriptionData.tier === 'explorer' ? 'Never' : '-'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Spending Summary Card */}
          <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={18} />
              Spending Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">Total Spent</div>
                <div className="text-2xl font-light text-gray-900">
                  ${spendingSummary?.total_spent?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">This Month</div>
                <div className="text-2xl font-light text-gray-900">
                  ${spendingSummary?.this_month?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">Last Month</div>
                <div className="text-2xl font-light text-gray-900">
                  ${spendingSummary?.last_month?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">Member Since</div>
                <div className="text-lg font-light text-gray-900">
                  {spendingSummary?.member_since ? formatDate(spendingSummary.member_since) : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Features & Support */}
        <div className="space-y-6">
          {/* Plan Features */}
          <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Plan Features</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">AI Chats</span>
                <span className="font-medium text-gray-900">{planFeatures.chats}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Support</span>
                <span className="font-medium text-gray-900">{planFeatures.support}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Concierge</span>
                <span className="font-medium text-gray-900">{planFeatures.concierge}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {isPaidPlan && (
            <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleManageBilling}
                  disabled={processingPortal}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-500" />
                    <span>Update Payment Method</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={handleManageBilling}
                  disabled={processingPortal}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Receipt size={16} className="text-gray-500" />
                    <span>View Invoices</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={handleManageBilling}
                  disabled={processingPortal}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-red-600"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>Cancel Subscription</span>
                  </div>
                  <ExternalLink size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          )}

          {/* Need Help */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-gray-500" />
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

      {/* Transaction History - Full Width */}
      <div className="mt-6 bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Receipt size={18} />
            Transaction History
          </h3>
          <span className="text-xs text-gray-500">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No transactions yet</p>
            <p className="text-gray-400 text-xs mt-1">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-gray-50/80 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tx.type === 'refund' ? 'bg-red-100 text-red-600' :
                    tx.status === 'completed' ? 'bg-green-100 text-green-600' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {tx.type === 'refund' ? (
                      <TrendingUp size={18} className="rotate-180" />
                    ) : (
                      <CreditCard size={18} />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {getTransactionTypeLabel(tx.type)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tx.tier && `${getTierDisplayName(tx.tier)} Plan`}
                      {tx.previous_tier && tx.tier && ` (from ${getTierDisplayName(tx.previous_tier)})`}
                      {tx.description && ` • ${tx.description}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${tx.type === 'refund' ? 'text-red-600' : 'text-gray-900'}`}>
                    {tx.type === 'refund' ? '-' : ''}${parseFloat(tx.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(tx.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;
