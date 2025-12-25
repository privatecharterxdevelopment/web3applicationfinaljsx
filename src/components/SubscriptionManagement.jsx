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
      navigate('/dashboard/subscriptions/plans');
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
        tier: profile?.subscription_tier || null,
        status: profile?.subscription_status || 'inactive',
        chatsUsed: stats?.chatsUsed || 0,
        chatsLimit: stats?.chatsLimit || 0,
        chatsRemaining: stats?.chatsRemaining,
        unlimited: stats?.unlimited || false,
        // Subscription dates
        resetDate: profile?.chats_reset_date,
        currentPeriodStart: profile?.current_period_start,
        currentPeriodEnd: profile?.current_period_end,
        createdAt: profile?.created_at,
        // Stripe IDs
        stripeCustomerId: profile?.stripe_customer_id,
        stripeSubscriptionId: profile?.stripe_subscription_id
      });
      setSpendingSummary(summary);
      setTransactions(txHistory);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscriptionData({
        tier: null,
        status: 'inactive',
        chatsUsed: 0,
        chatsLimit: 0,
        chatsRemaining: 0,
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
      traveller: 'Traveller',
      elite: 'Elite Club'
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
        chats: '5/month',
        messages: '10/chat',
        support: 'Email',
        concierge: 'No',
        highlights: ['Empty Legs', 'Restaurants', 'Ground Transport', 'Catering']
      },
      traveller: {
        chats: '10/month',
        messages: '25/chat',
        support: 'Priority',
        concierge: 'Yes',
        highlights: ['All Explorer +', 'MEDEVAC', 'Concierge', 'Event Booking']
      },
      elite: {
        chats: 'Unlimited',
        messages: 'Unlimited',
        support: '24/7 Phone',
        concierge: 'Yes',
        highlights: ['All Traveller +', 'MembershipX Card', 'VIP Events', '2x Transfers/mo']
      }
    };
    return features[tier] || features.explorer;
  };

  const getTierPrice = (tier) => {
    const prices = { explorer: 99, traveller: 199, elite: 999 };
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
        <div className="w-16 h-16">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
          </video>
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
            className="px-6 py-2.5 bg-white/60 text-gray-700 rounded-lg hover:bg-white/80 transition-colors text-sm font-medium border border-gray-200/50"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const planFeatures = getPlanFeatures(subscriptionData?.tier);
  const isPaidPlan = subscriptionData?.tier && ['explorer', 'traveller', 'elite'].includes(subscriptionData?.tier);
  const hasSubscription = !!subscriptionData?.tier;

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
                  ? 'bg-white/70 text-gray-700 border border-gray-200/50'
                  : 'text-gray-500 hover:bg-white/50'
              }`}
              style={filter === status ? { backdropFilter: 'blur(8px)' } : {}}
            >
              {status === 'all' ? 'All' : status === 'completed' ? 'Completed' : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* No Subscription Banner - Monochromatic light gray glass */}
        {!hasSubscription && (
          <div
            className="bg-white/70 rounded-2xl p-6 border border-gray-200/60"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center border border-gray-200/50">
                <Crown size={24} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">No Active Subscription</h3>
                <p className="text-gray-500 text-sm mt-0.5">Choose a membership plan to unlock AI-powered travel planning</p>
              </div>
              <button
                onClick={handleViewPlans}
                className="px-5 py-2.5 bg-white/60 text-gray-700 rounded-xl text-sm font-medium hover:bg-white/80 transition-colors border border-gray-200/50"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                View Plans
              </button>
            </div>
          </div>
        )}

        {/* Current Plan Card - Expandable - Glass style */}
        {hasSubscription && (
        <div className="bg-white/70 border border-gray-100/80 rounded-xl overflow-hidden hover:border-gray-200/80 transition-all" style={{ backdropFilter: 'blur(10px)' }}>
          <div
            className="px-4 py-3 flex items-center gap-4 cursor-pointer"
            onClick={() => setShowPlanDetails(!showPlanDetails)}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/60 text-gray-600 border border-gray-200/50" style={{ backdropFilter: 'blur(8px)' }}>
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
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Chats Used</p>
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
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Messages/Chat</p>
                  <p className="text-sm text-gray-900">{planFeatures.messages}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Support</p>
                  <p className="text-sm text-gray-900">{planFeatures.support}</p>
                </div>
              </div>

              {/* Feature Highlights */}
              {planFeatures.highlights && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {planFeatures.highlights.map((highlight, idx) => (
                    <span key={idx} className="px-2 py-1 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200/50">
                      {highlight}
                    </span>
                  ))}
                </div>
              )}

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
                            : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(100, (subscriptionData.chatsUsed / subscriptionData.chatsLimit) * 100)}%` }}
                    />
                  </div>
                  {subscriptionData.resetDate && (
                    <p className="text-[10px] text-gray-400 mt-2">Resets {formatDate(subscriptionData.resetDate)}</p>
                  )}
                </div>
              )}

              {/* Subscription Dates */}
              {(subscriptionData.currentPeriodStart || subscriptionData.currentPeriodEnd) && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Billing Period</p>
                  <div className="grid grid-cols-2 gap-3">
                    {subscriptionData.currentPeriodStart && (
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-gray-400" />
                        <div>
                          <p className="text-[10px] text-gray-400">Started</p>
                          <p className="text-xs text-gray-700 font-medium">{formatDate(subscriptionData.currentPeriodStart)}</p>
                        </div>
                      </div>
                    )}
                    {subscriptionData.currentPeriodEnd && (
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-emerald-500" />
                        <div>
                          <p className="text-[10px] text-gray-400">Renews</p>
                          <p className="text-xs text-emerald-600 font-medium">{formatDate(subscriptionData.currentPeriodEnd)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="bg-white/60 text-gray-700 rounded-xl p-4 mb-3 border border-gray-200/50" style={{ backdropFilter: 'blur(8px)' }}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-3">Spending Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">This Month</span>
                    <span className="text-gray-700">${spendingSummary?.this_month?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Month</span>
                    <span className="text-gray-700">${spendingSummary?.last_month?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200/50 font-medium">
                    <span className="text-gray-700">Total Spent</span>
                    <span className="text-gray-900">${totalSpent.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions - Monochromatic light gray glass */}
              <div className="flex items-center gap-2">
                {subscriptionData.tier !== 'elite' && (
                  <button
                    onClick={handleViewPlans}
                    className="flex-1 py-2 bg-white/60 text-gray-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 hover:bg-white/80 transition-colors border border-gray-200/50"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    <TrendingUp size={12} />
                    Upgrade Plan
                  </button>
                )}
                {isPaidPlan && (
                  <button
                    onClick={handleManageBilling}
                    disabled={processingPortal}
                    className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200/50 rounded-lg bg-white/50 hover:bg-white/70 transition-colors flex items-center gap-1.5"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    {processingPortal ? <Loader2 size={12} className="animate-spin" /> : <Settings size={12} />}
                    Manage Billing
                    <ExternalLink size={10} className="text-gray-400" />
                  </button>
                )}
                <button
                  onClick={handleViewPlans}
                  className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200/50 rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
                  style={{ backdropFilter: 'blur(8px)' }}
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
        )}

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
