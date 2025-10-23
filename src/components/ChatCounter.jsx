import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Crown } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from '../context/AuthContext';
import SubscriptionModal from './SubscriptionModal';
import TopUpModal from './TopUpModal';

const ChatCounter = () => {
  const { user } = useAuth();
  const [chatStats, setChatStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      loadChatStats();
      // Refresh every minute
      const interval = setInterval(loadChatStats, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadChatStats = async () => {
    if (!user?.id) return;

    try {
      const stats = await subscriptionService.getChatStats(user.id);
      setChatStats(stats);
    } catch (error) {
      console.error('Error loading chat stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      explorer: 'bg-gray-500',
      starter: 'bg-blue-500',
      pro: 'bg-purple-500',
      business: 'bg-indigo-600',
      elite: 'bg-yellow-500'
    };
    return colors[tier] || 'bg-gray-500';
  };

  const getTierName = (tier) => {
    const names = {
      explorer: 'Explorer',
      starter: 'Starter',
      pro: 'Pro',
      business: 'Business',
      elite: 'Elite'
    };
    return names[tier] || tier;
  };

  const getProgressPercent = () => {
    if (!chatStats) return 0;
    if (chatStats.unlimited) return 100;
    if (chatStats.chatsLimit === 0) return 0;
    return Math.min(100, (chatStats.chatsUsed / chatStats.chatsLimit) * 100);
  };

  const getProgressColor = () => {
    const percent = getProgressPercent();
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!user || loading) {
    return null;
  }

  if (!chatStats) {
    return null;
  }

  const isLowOnChats = !chatStats.unlimited && chatStats.chatsRemaining !== null && chatStats.chatsRemaining <= 3;
  const isOutOfChats = !chatStats.unlimited && chatStats.chatsRemaining === 0;

  return (
    <>
      <div className="relative">
        {/* Counter Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            isOutOfChats
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              : isLowOnChats
              ? 'bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100'
              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <MessageSquare size={16} />
          <span className="text-sm font-medium">
            {chatStats.unlimited ? (
              <span className="flex items-center gap-1">
                <Crown size={14} />
                <span>Unlimited</span>
              </span>
            ) : (
              <span>
                {chatStats.chatsUsed}/{chatStats.chatsLimit}
              </span>
            )}
          </span>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Your Plan</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getTierColor(chatStats.tier)}`}>
                    {getTierName(chatStats.tier)}
                  </span>
                </div>

                {/* Progress */}
                {!chatStats.unlimited && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Chats this month</span>
                      <span className="text-sm font-medium text-gray-900">
                        {chatStats.chatsUsed} / {chatStats.chatsLimit}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor()} transition-all duration-300`}
                        style={{ width: `${getProgressPercent()}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {chatStats.chatsRemaining} chats remaining
                    </p>
                  </div>
                )}

                {/* Unlimited Badge */}
                {chatStats.unlimited && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown size={20} className="text-yellow-600" />
                      <span className="font-medium text-yellow-900">Unlimited Access</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      You have unlimited conversations with Sphera AI
                    </p>
                  </div>
                )}

                {/* Warning */}
                {isLowOnChats && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ You're running low on chats! Top up or upgrade to continue using Sphera AI.
                    </p>
                  </div>
                )}

                {isOutOfChats && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      🚫 You've used all your chats this month. Top up or upgrade to continue.
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Chats</p>
                    <p className="text-lg font-semibold text-gray-900">{chatStats.totalLifetimeChats}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Avg Messages</p>
                    <p className="text-lg font-semibold text-gray-900">{chatStats.avgMessagesPerChat}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {chatStats.tier !== 'elite' && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setShowSubscriptionModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors"
                    >
                      <Crown size={16} />
                      <span>Upgrade Plan</span>
                    </button>
                  )}

                  {!chatStats.unlimited && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setShowTopUpModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors"
                    >
                      <Plus size={16} />
                      <span>Buy More Chats</span>
                    </button>
                  )}

                  {chatStats.resetDate && !chatStats.unlimited && (
                    <p className="text-xs text-center text-gray-500 mt-3">
                      Resets on {new Date(chatStats.resetDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentTier={chatStats.tier}
        onUpgrade={async (tierId) => {
          // Handle Stripe checkout
          console.log('Upgrade to:', tierId);
          // TODO: Implement Stripe checkout
        }}
      />

      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentChats={chatStats}
        onPurchase={async (pkg) => {
          // Handle Stripe payment
          console.log('Purchase top-up:', pkg);
          // TODO: Implement Stripe payment
        }}
      />
    </>
  );
};

export default ChatCounter;
