/**
 * useSubscriptionNew Hook
 * Manages subscription status, limits, and tier access
 */

import { useState, useCallback, useEffect } from 'react';
import { subscriptionService } from '../../../../services/subscriptionService';

export const useSubscriptionNew = (userId) => {
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
      const { profile, error } = await subscriptionService.getUserProfile(userId);
      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      setUserProfile(profile);

      // Check NFT status
      if (profile?.nft_holder) {
        setUserHasNFT(true);
        setUsedNFTBenefitThisYear(profile?.nft_benefit_used_this_year || false);
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

  // Check if can send message
  const canSendMessage = useCallback((currentMessageCount) => {
    if (!userSubscriptionLimits) return true;

    const tier = userSubscriptionLimits.tier?.toLowerCase();

    // Elite has unlimited
    if (tier === 'elite') return true;

    // Check limits by tier
    const limits = {
      explorer: 10,
      traveller: 25
    };

    const limit = limits[tier] || 10;
    return currentMessageCount < limit;
  }, [userSubscriptionLimits]);

  // Check if user can use Break the Price
  const canUseBreakThePrice = useCallback(() => {
    if (!userSubscriptionLimits) return false;

    const tier = userSubscriptionLimits.tier?.toLowerCase();
    return tier === 'traveller' || tier === 'elite';
  }, [userSubscriptionLimits]);

  // Get tier display name
  const getTierDisplayName = useCallback(() => {
    if (!userSubscriptionLimits?.tier) return 'No Plan';

    const tier = userSubscriptionLimits.tier.toLowerCase();
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }, [userSubscriptionLimits]);

  // Check feature access
  const hasFeatureAccess = useCallback((feature) => {
    if (!userSubscriptionLimits) return false;

    const tier = userSubscriptionLimits.tier?.toLowerCase();

    const featuresByTier = {
      explorer: ['chat', 'search', 'basic_booking'],
      traveller: ['chat', 'search', 'basic_booking', 'break_the_price', 'priority_support'],
      elite: ['chat', 'search', 'basic_booking', 'break_the_price', 'priority_support', 'unlimited_messages', 'free_transfers', 'membershipx_card']
    };

    const tierFeatures = featuresByTier[tier] || featuresByTier.explorer;
    return tierFeatures.includes(feature);
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

  // Check and set message limit reached
  useEffect(() => {
    if (!userSubscriptionLimits) return;

    const tier = userSubscriptionLimits.tier?.toLowerCase();
    if (tier === 'elite') {
      setMessageLimitReached(false);
      return;
    }

    const limits = { explorer: 10, traveller: 25 };
    const limit = limits[tier] || 10;

    setMessageLimitReached(messageCount >= limit);
  }, [messageCount, userSubscriptionLimits]);

  // Load profile on mount
  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadSubscriptionLimits();
    }
  }, [userId, loadUserProfile, loadSubscriptionLimits]);

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
