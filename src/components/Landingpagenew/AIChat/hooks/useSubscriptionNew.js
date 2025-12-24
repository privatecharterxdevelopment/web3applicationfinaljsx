/**
 * useSubscriptionNew Hook
 * Manages subscription status, limits, and tier access
 */

import { useState, useCallback, useEffect } from 'react';
import { subscriptionService } from '../../../../services/subscriptionService';
import {
  getTierLimits,
  hasUnlimitedAccess,
  canSendMessage as checkCanSend,
  hasFeatureAccess as checkFeature
} from '../utils/constants';

export const useSubscriptionNew = (user, isAdmin = false) => {
  // Extract userId from user object or use directly if string
  const userId = typeof user === 'string' ? user : user?.id;

  // User Profile & Subscription
  const [userProfile, setUserProfile] = useState(null);
  const [userSubscriptionLimits, setUserSubscriptionLimits] = useState(null);

  // NFT Benefits
  const [userHasNFT, setUserHasNFT] = useState(false);
  const [usedNFTBenefitThisYear, setUsedNFTBenefitThisYear] = useState(false);

  // Limits
  const [messageCount, setMessageCount] = useState(0);
  const [messageLimitReached, setMessageLimitReached] = useState(false);
  const [chatLimitReached, setChatLimitReached] = useState(false);
  const [limitWarningShown, setLimitWarningShown] = useState(false);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    if (!userId) return null;

    try {
      // First check if chat usage needs to be reset (past reset date)
      const wasReset = await subscriptionService.checkAndResetIfNeeded(userId);
      if (wasReset) {
        console.log('🔄 Chat usage was reset due to subscription renewal');
      }

      // Now get the (possibly updated) profile
      const profile = await subscriptionService.getUserProfile(userId);

      console.log('📦 Loaded user profile:', {
        tier: profile?.subscription_tier,
        status: profile?.subscription_status,
        chatsUsed: profile?.chats_used,
        chatsLimit: profile?.chats_limit,
        resetDate: profile?.chats_reset_date,
        userId
      });

      setUserProfile(profile);

      // Check NFT status
      if (profile?.nft_holder) {
        setUserHasNFT(true);
        setUsedNFTBenefitThisYear(profile?.nft_benefit_used_this_year || false);
      }

      // Check if chat limit reached
      const hasSubscription = profile?.subscription_tier && profile?.subscription_status === 'active';
      const hasLimit = profile?.chats_limit !== null && profile?.chats_limit !== undefined;
      const limitReached = hasLimit && profile?.chats_used >= profile?.chats_limit;

      if (hasSubscription && limitReached) {
        console.log('⚠️ Chat limit reached:', {
          used: profile.chats_used,
          limit: profile.chats_limit,
          tier: profile.subscription_tier
        });
        setChatLimitReached(true);
      } else {
        setChatLimitReached(false);
      }

      return profile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }, [userId]);

  // Load subscription limits
  const loadSubscriptionLimits = useCallback(async () => {
    if (!userId) return null;

    try {
      const limits = await subscriptionService.getSubscriptionLimits(userId);
      setUserSubscriptionLimits(limits);
      return limits;
    } catch (error) {
      console.error('Error loading subscription limits:', error);
      return null;
    }
  }, [userId]);

  // Check if can start new chat
  const canStartNewChat = useCallback(async () => {
    if (!userId) return { canStart: false, reason: 'not_authenticated' };

    try {
      return await subscriptionService.canStartNewChat(userId);
    } catch (error) {
      console.error('Error checking chat limit:', error);
      return { canStart: false, reason: 'error' };
    }
  }, [userId]);

  // Check if can send message - using centralized helper
  const canSendMessage = useCallback((currentMessageCount) => {
    if (!userSubscriptionLimits?.tier) return true;
    return checkCanSend(userSubscriptionLimits.tier, currentMessageCount);
  }, [userSubscriptionLimits]);

  // Check if user can use Break the Price - using centralized helper
  const canUseBreakThePrice = useCallback(() => {
    if (!userSubscriptionLimits?.tier) return false;
    const limits = getTierLimits(userSubscriptionLimits.tier);
    return limits.breakThePrice === true;
  }, [userSubscriptionLimits]);

  // Get tier display name
  const getTierDisplayName = useCallback(() => {
    if (!userSubscriptionLimits?.tier) return 'No Plan';

    const tier = userSubscriptionLimits.tier.toLowerCase();
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }, [userSubscriptionLimits]);

  // Check feature access using centralized helper
  const hasFeatureAccess = useCallback((feature) => {
    if (!userSubscriptionLimits?.tier) return false;
    return checkFeature(userSubscriptionLimits.tier, feature);
  }, [userSubscriptionLimits]);

  // Update message count
  const incrementMessageCount = useCallback(() => {
    setMessageCount(prev => prev + 1);
  }, []);

  // Reset message count (for new chat)
  const resetMessageCount = useCallback(() => {
    setMessageCount(0);
    setMessageLimitReached(false);
  }, []);

  // Check and set message limit reached using centralized helpers
  useEffect(() => {
    if (!userSubscriptionLimits?.tier) return;

    // Elite has unlimited messages
    if (hasUnlimitedAccess(userSubscriptionLimits.tier)) {
      setMessageLimitReached(false);
      return;
    }

    const limits = getTierLimits(userSubscriptionLimits.tier);
    setMessageLimitReached(messageCount >= limits.messagesPerChat);
  }, [messageCount, userSubscriptionLimits]);

  // Load profile on mount + handle Stripe success redirect
  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadSubscriptionLimits();
    }

    // Check if returning from Stripe subscription success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('subscription') === 'success' && userId) {
      console.log('🎉 Subscription success detected - refreshing profile');
      // Remove the param from URL to prevent re-triggering
      urlParams.delete('subscription');
      const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);

      // Refresh profile after short delay to ensure Stripe webhook has processed
      setTimeout(() => {
        loadUserProfile();
        loadSubscriptionLimits();
      }, 1500);
    }
  }, [userId, loadUserProfile, loadSubscriptionLimits]);

  // Periodically refresh profile when chat limit is reached (to detect upgrades via webhook)
  useEffect(() => {
    if (!chatLimitReached || !userId) return;

    console.log('🔄 Starting periodic profile refresh (checking for subscription updates)');

    const refreshInterval = setInterval(async () => {
      console.log('🔄 Checking for subscription updates...');
      await loadUserProfile();
    }, 30000); // Check every 30 seconds

    return () => {
      console.log('🔄 Stopping periodic profile refresh');
      clearInterval(refreshInterval);
    };
  }, [chatLimitReached, userId, loadUserProfile]);

  return {
    // Profile
    userProfile,
    setUserProfile,
    loadUserProfile,

    // Subscription Limits
    userSubscriptionLimits,
    setUserSubscriptionLimits,
    loadSubscriptionLimits,

    // NFT
    userHasNFT,
    setUserHasNFT,
    usedNFTBenefitThisYear,
    setUsedNFTBenefitThisYear,

    // Message Limits
    messageCount,
    setMessageCount,
    incrementMessageCount,
    resetMessageCount,
    messageLimitReached,
    setMessageLimitReached,

    // Chat Limits
    chatLimitReached,
    setChatLimitReached,

    // Warning
    limitWarningShown,
    setLimitWarningShown,

    // Checks
    canStartNewChat,
    canSendMessage,
    canUseBreakThePrice,
    hasFeatureAccess,
    getTierDisplayName
  };
};

export default useSubscriptionNew;
