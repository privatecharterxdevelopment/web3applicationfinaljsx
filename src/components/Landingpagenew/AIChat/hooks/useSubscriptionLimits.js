// useSubscriptionLimits Hook
// Manages subscription tier checks and limits

import { useState, useCallback, useEffect } from 'react';
import { subscriptionService } from '../../../../services/subscriptionService';
import { TIER_LIMITS, SUBSCRIPTION_TIERS } from '../utils/constants';

export function useSubscriptionLimits({ user, isAdmin }) {
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user's subscription limits
  const loadLimits = useCallback(async () => {
    if (!user?.id) {
      setLimits(null);
      return;
    }

    setLoading(true);
    try {
      const subscriptionLimits = await subscriptionService.getUserSubscriptionLimits(user.id);
      setLimits(subscriptionLimits);
      setError(null);
    } catch (err) {
      console.error('Error loading subscription limits:', err);
      setError(err);
      // Default to explorer tier on error
      setLimits(TIER_LIMITS[SUBSCRIPTION_TIERS.EXPLORER]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load on mount and when user changes
  useEffect(() => {
    loadLimits();
  }, [loadLimits]);

  // Check if user can start a new chat
  const canStartNewChat = useCallback(async () => {
    if (isAdmin) return { canStart: true, chatsUsed: 0, chatsLimit: Infinity };
    if (!user?.id) return { canStart: false, chatsUsed: 0, chatsLimit: 0 };

    try {
      return await subscriptionService.canStartNewChat(user.id);
    } catch (err) {
      console.error('Error checking chat limit:', err);
      return { canStart: true, chatsUsed: 0, chatsLimit: 5 }; // Allow on error
    }
  }, [user?.id, isAdmin]);

  // Check if user can send message in chat
  const canSendMessage = useCallback((currentMessageCount) => {
    if (isAdmin) return true;
    if (!limits) return true; // Allow while loading

    // Elite has unlimited
    if (limits.unlimited_messages) return true;
    if (limits.tier === SUBSCRIPTION_TIERS.ELITE) return true;

    const maxMessages = limits.messages_per_chat ||
                       TIER_LIMITS[limits.tier]?.messagesPerChat ||
                       20;

    return currentMessageCount < maxMessages;
  }, [limits, isAdmin]);

  // Check if user can use Break the Price feature
  const canUseBreakThePrice = useCallback(() => {
    if (isAdmin) return true;
    if (!limits) return false;

    return limits.break_the_price === true ||
           limits.tier === SUBSCRIPTION_TIERS.PRO ||
           limits.tier === SUBSCRIPTION_TIERS.ELITE;
  }, [limits, isAdmin]);

  // Get tier display name
  const getTierDisplayName = useCallback(() => {
    if (!limits?.tier) return 'Explorer';

    const names = {
      [SUBSCRIPTION_TIERS.EXPLORER]: 'Explorer',
      [SUBSCRIPTION_TIERS.STARTER]: 'Starter',
      [SUBSCRIPTION_TIERS.PRO]: 'Professional',
      [SUBSCRIPTION_TIERS.ELITE]: 'Elite'
    };

    return names[limits.tier] || 'Explorer';
  }, [limits]);

  // Check if user has unlimited messages
  const hasUnlimitedMessages = useCallback(() => {
    if (isAdmin) return true;
    return limits?.unlimited_messages === true ||
           limits?.tier === SUBSCRIPTION_TIERS.ELITE;
  }, [limits, isAdmin]);

  // Get remaining chats
  const getRemainingChats = useCallback(async () => {
    if (isAdmin) return Infinity;
    if (!user?.id) return 0;

    try {
      const { chatsUsed, chatsLimit } = await subscriptionService.canStartNewChat(user.id);
      return Math.max(0, chatsLimit - chatsUsed);
    } catch {
      return 5; // Default
    }
  }, [user?.id, isAdmin]);

  // Get remaining messages for current chat
  const getRemainingMessages = useCallback((currentMessageCount) => {
    if (hasUnlimitedMessages()) return Infinity;

    const maxMessages = limits?.messages_per_chat ||
                       TIER_LIMITS[limits?.tier]?.messagesPerChat ||
                       20;

    return Math.max(0, maxMessages - currentMessageCount);
  }, [limits, hasUnlimitedMessages]);

  return {
    limits,
    loading,
    error,
    loadLimits,
    canStartNewChat,
    canSendMessage,
    canUseBreakThePrice,
    getTierDisplayName,
    hasUnlimitedMessages,
    getRemainingChats,
    getRemainingMessages,

    // Direct access
    tier: limits?.tier || SUBSCRIPTION_TIERS.EXPLORER,
    isElite: limits?.tier === SUBSCRIPTION_TIERS.ELITE,
    isPro: limits?.tier === SUBSCRIPTION_TIERS.PRO,
    isStarter: limits?.tier === SUBSCRIPTION_TIERS.STARTER,
    isExplorer: !limits?.tier || limits?.tier === SUBSCRIPTION_TIERS.EXPLORER
  };
}

export default useSubscriptionLimits;
