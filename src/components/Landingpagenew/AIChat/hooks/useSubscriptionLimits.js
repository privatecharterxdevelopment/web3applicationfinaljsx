// useSubscriptionLimits Hook
// Manages subscription tier checks and limits

import { useState, useCallback, useEffect } from 'react';
import { subscriptionService } from '../../../../services/subscriptionService';
import {
  SUBSCRIPTION_TIERS,
  getTierLimits,
  hasUnlimitedAccess,
  getMessageLimit
} from '../utils/constants';

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
      const profile = await subscriptionService.getUserProfile(user.id);
      const tier = profile?.subscription_tier;
      const tierConfig = getTierLimits(tier);

      setLimits({
        tier: tier,
        chats_limit: profile?.chats_limit || 0,
        chats_used: profile?.chats_used || 0,
        messages_per_chat: tierConfig.messagesPerChat || 0,
        unlimited_chats: hasUnlimitedAccess(tier),
        unlimited_messages: hasUnlimitedAccess(tier),
        break_the_price: tierConfig.breakThePrice || false,
        features: tierConfig.features || [],
        has_subscription: !!tier && profile?.subscription_status === 'active'
      });
      setError(null);
    } catch (err) {
      console.error('Error loading subscription limits:', err);
      setError(err);
      // Default to no subscription on error
      setLimits({
        tier: null,
        chats_limit: 0,
        chats_used: 0,
        messages_per_chat: 0,
        unlimited_chats: false,
        unlimited_messages: false,
        break_the_price: false,
        features: [],
        has_subscription: false
      });
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
    if (!user?.id) return { canStart: false, requiresSubscription: true, chatsUsed: 0, chatsLimit: 0 };

    try {
      return await subscriptionService.canStartNewChat(user.id);
    } catch (err) {
      console.error('Error checking chat limit:', err);
      return { canStart: false, requiresSubscription: true, chatsUsed: 0, chatsLimit: 0 };
    }
  }, [user?.id, isAdmin]);

  // Check if user can send message in chat
  const canSendMessage = useCallback((currentMessageCount) => {
    if (isAdmin) return true;
    if (!limits?.has_subscription) return false;

    // Use centralized helper for unlimited check
    if (hasUnlimitedAccess(limits.tier)) return true;

    const maxMessages = getMessageLimit(limits.tier);
    return currentMessageCount < maxMessages;
  }, [limits, isAdmin]);

  // Check if user can use Break the Price feature (Traveller and Elite only)
  const canUseBreakThePrice = useCallback(() => {
    if (isAdmin) return true;
    if (!limits?.has_subscription) return false;

    // Use centralized tier config for breakThePrice access
    const tierConfig = getTierLimits(limits.tier);
    return tierConfig.breakThePrice === true;
  }, [limits, isAdmin]);

  // Get tier display name
  const getTierDisplayName = useCallback(() => {
    if (!limits?.tier) return 'No Subscription';

    const names = {
      'free': 'Free',
      'essential': 'Essential',
      'starter': 'Essential',
      [SUBSCRIPTION_TIERS.EXPLORER]: 'Explorer',
      [SUBSCRIPTION_TIERS.TRAVELLER]: 'Traveller',
      [SUBSCRIPTION_TIERS.ELITE]: 'Elite Club'
    };

    return names[limits.tier] || 'No Subscription';
  }, [limits]);

  // Check if user has unlimited messages
  const hasUnlimitedMessages = useCallback(() => {
    if (isAdmin) return true;
    // Use centralized helper for unlimited access check
    return hasUnlimitedAccess(limits?.tier);
  }, [limits, isAdmin]);

  // Get remaining chats
  const getRemainingChats = useCallback(async () => {
    if (isAdmin) return Infinity;
    if (!user?.id) return 0;

    try {
      const result = await subscriptionService.canStartNewChat(user.id);
      if (result.unlimited) return Infinity;
      return result.chatsRemaining || 0;
    } catch {
      return 0;
    }
  }, [user?.id, isAdmin]);

  // Get remaining messages for current chat
  const getRemainingMessages = useCallback((currentMessageCount) => {
    if (hasUnlimitedMessages()) return Infinity;
    if (!limits?.has_subscription) return 0;

    // Use centralized helper for message limit
    const maxMessages = getMessageLimit(limits?.tier);
    return Math.max(0, maxMessages - currentMessageCount);
  }, [limits, hasUnlimitedMessages]);

  // Check if user has access to a specific feature
  const hasFeatureAccess = useCallback((feature) => {
    if (isAdmin) return true;
    if (!limits?.has_subscription) return false;
    return limits?.features?.includes(feature) || false;
  }, [limits, isAdmin]);

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
    hasFeatureAccess,

    // Direct access
    tier: limits?.tier || null,
    hasSubscription: limits?.has_subscription || false,
    isElite: limits?.tier === SUBSCRIPTION_TIERS.ELITE,
    isTraveller: limits?.tier === SUBSCRIPTION_TIERS.TRAVELLER,
    isExplorer: limits?.tier === SUBSCRIPTION_TIERS.EXPLORER,
    requiresSubscription: !limits?.has_subscription
  };
}

export default useSubscriptionLimits;
