import { supabase } from '../lib/supabase';

// Tier-specific message limits per chat
const TIER_MESSAGE_LIMITS = {
  essential: 5,    // Essential Basic - 5 messages per chat (Haiku)
  starter: 5,      // Alias for essential (Stripe product name)
  explorer: 10,
  traveller: 25,
  elite: null,     // null = unlimited
  professional: null // Professional tier (if used) = unlimited
};

// Tier-specific chat limits per month
const TIER_CHAT_LIMITS = {
  essential: 10,   // Essential Basic - 10 chats per month
  starter: 10,     // Alias for essential
  explorer: 5,
  traveller: 10,
  elite: null,     // null = unlimited
  professional: null
};

// AI Model per tier - Essential uses Haiku, others use Sonnet
const TIER_AI_MODELS = {
  essential: 'claude-3-5-haiku-20241022',  // Essential Basic uses Haiku (faster, cheaper)
  starter: 'claude-3-5-haiku-20241022',    // Alias for essential
  explorer: 'claude-sonnet-4-20250514',
  traveller: 'claude-sonnet-4-20250514',
  elite: 'claude-sonnet-4-20250514',
  professional: 'claude-sonnet-4-20250514'
};

// Features allowed per tier
const TIER_ALLOWED_FEATURES = {
  essential: ['empty_legs', 'restaurants', 'private_jets_search', 'general_queries'],
  starter: ['empty_legs', 'restaurants', 'private_jets_search', 'general_queries'], // Alias for essential
  explorer: ['empty_legs', 'restaurants', 'ground_transport', 'delicacies', 'cigars', 'winery', 'catering', 'custom_travel_org', 'private_jets', 'helicopters'],
  traveller: ['empty_legs', 'restaurants', 'ground_transport', 'delicacies', 'cigars', 'winery', 'catering', 'custom_travel_org', 'private_jets', 'helicopters', 'medevac', 'concierge', 'group_charter', 'reservations', 'event_booking'],
  elite: ['all'], // Elite has access to everything
  professional: ['all']
};

class SubscriptionService {
  /**
   * Get user's subscription profile
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create default profile (no subscription)
        if (error.code === 'PGRST116') {
          return await this.createDefaultProfile(userId);
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Return a default profile object - no subscription
      return {
        user_id: userId,
        subscription_tier: null,
        subscription_status: 'inactive',
        chats_limit: 0,
        chats_used: 0,
        chats_reset_date: null
      };
    }
  }

  /**
   * Create default profile for new users (no subscription)
   * Users must subscribe to use the AI chat
   */
  async createDefaultProfile(userId) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          email: email,
          subscription_tier: null, // No tier - must subscribe
          subscription_status: 'inactive',
          chats_limit: 0,
          chats_used: 0,
          chats_reset_date: null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default profile:', error);
      // Return a default profile object
      return {
        user_id: userId,
        subscription_tier: null,
        subscription_status: 'inactive',
        chats_limit: 0,
        chats_used: 0,
        chats_reset_date: null
      };
    }
  }

  /**
   * Get all subscription tiers
   */
  async getSubscriptionTiers() {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('active', true)
        .order('price_monthly_usd', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting subscription tiers:', error);
      throw error;
    }
  }

  /**
   * Check if user can start a new chat
   */
  async canStartNewChat(userId) {
    try {
      const profile = await this.getUserProfile(userId);

      // No subscription - cannot start chat
      if (!profile.subscription_tier || profile.subscription_status !== 'active') {
        return {
          canStart: false,
          requiresSubscription: true,
          unlimited: false,
          unlimitedMessages: false,
          chatsUsed: 0,
          chatsLimit: 0,
          chatsRemaining: 0,
          tier: null,
          resetDate: null
        };
      }

      // Elite (unlimited) - chats_limit is null for unlimited
      if (profile.subscription_tier === 'elite' || profile.chats_limit === null) {
        return {
          canStart: true,
          unlimited: true,
          unlimitedMessages: true, // Elite gets unlimited messages per chat
          chatsUsed: profile.chats_used,
          tier: profile.subscription_tier
        };
      }

      // Check if limit reached
      const canStart = profile.chats_used < profile.chats_limit;

      return {
        canStart,
        unlimited: false,
        unlimitedMessages: profile.subscription_tier === 'elite',
        chatsUsed: profile.chats_used,
        chatsLimit: profile.chats_limit,
        chatsRemaining: profile.chats_limit - profile.chats_used,
        tier: profile.subscription_tier,
        resetDate: profile.chats_reset_date
      };
    } catch (error) {
      console.error('Error checking chat availability:', error);
      // On error, require subscription to be safe
      return {
        canStart: false,
        requiresSubscription: true,
        unlimited: false,
        unlimitedMessages: false,
        chatsUsed: 0,
        chatsLimit: 0,
        chatsRemaining: 0,
        tier: null,
        resetDate: null,
        error: true
      };
    }
  }

  /**
   * Check if user has unlimited messages per chat (Elite tier)
   */
  async hasUnlimitedMessages(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      return profile.subscription_tier === 'elite';
    } catch (error) {
      console.error('Error checking unlimited messages:', error);
      return false;
    }
  }

  /**
   * Check if user has Break the Price access (Traveller and Elite only)
   */
  async hasBreakThePriceAccess(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      return ['traveller', 'elite'].includes(profile.subscription_tier);
    } catch (error) {
      console.error('Error checking Break the Price access:', error);
      return false;
    }
  }

  /**
   * Check if user has access to a specific feature based on their tier
   */
  async hasFeatureAccess(userId, feature) {
    try {
      const profile = await this.getUserProfile(userId);
      const tier = profile.subscription_tier;

      if (!tier) return false;

      // Define feature access by tier
      const explorerFeatures = [
        'empty_legs', 'restaurants', 'ground_transport', 'delicacies',
        'cigars', 'winery', 'catering', 'custom_travel_org'
      ];

      const travellerFeatures = [
        ...explorerFeatures,
        'medevac', 'concierge', 'group_charter', 'reservations', 'event_booking'
      ];

      const eliteFeatures = [
        ...travellerFeatures,
        'vip_catering', 'airport_transfers', 'membershipx_card', 'vip_events'
      ];

      if (tier === 'elite') return eliteFeatures.includes(feature);
      if (tier === 'traveller') return travellerFeatures.includes(feature);
      if (tier === 'explorer') return explorerFeatures.includes(feature);

      return false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get subscription limits for a user
   * Returns tier, message limits, chat limits, and renewal info
   */
  async getSubscriptionLimits(userId) {
    try {
      const profile = await this.getUserProfile(userId);

      if (!profile || !profile.subscription_tier || profile.subscription_status !== 'active') {
        return {
          tier: null,
          hasSubscription: false,
          chatsLimit: 0,
          chatsUsed: 0,
          chatsRemaining: 0,
          messagesPerChat: 0,
          unlimitedChats: false,
          unlimitedMessages: false,
          resetDate: null,
          isExpired: true
        };
      }

      const tier = profile.subscription_tier.toLowerCase();
      const messagesPerChat = TIER_MESSAGE_LIMITS[tier] ?? 10;
      const chatsLimit = profile.chats_limit; // Could be null for unlimited
      const chatsUsed = profile.chats_used || 0;

      // Check if subscription needs renewal (past reset date)
      const resetDate = profile.chats_reset_date ? new Date(profile.chats_reset_date) : null;
      const now = new Date();
      const needsRenewal = resetDate && now > resetDate;

      // If past reset date, the webhook should have already reset usage
      // But we'll return info for the UI to handle

      return {
        tier: profile.subscription_tier,
        hasSubscription: true,
        chatsLimit: chatsLimit,
        chatsUsed: chatsUsed,
        chatsRemaining: chatsLimit === null ? null : Math.max(0, chatsLimit - chatsUsed),
        messagesPerChat: messagesPerChat,
        unlimitedChats: chatsLimit === null,
        unlimitedMessages: messagesPerChat === null,
        resetDate: profile.chats_reset_date,
        currentPeriodEnd: profile.current_period_end,
        needsRenewal: needsRenewal,
        breakThePriceAccess: ['traveller', 'elite', 'professional'].includes(tier),
        status: profile.subscription_status
      };
    } catch (error) {
      console.error('Error getting subscription limits:', error);
      return {
        tier: null,
        hasSubscription: false,
        chatsLimit: 0,
        chatsUsed: 0,
        chatsRemaining: 0,
        messagesPerChat: 0,
        unlimitedChats: false,
        unlimitedMessages: false,
        resetDate: null,
        error: true
      };
    }
  }

  /**
   * Get message limit for a specific tier
   */
  getMessageLimitForTier(tier) {
    if (!tier) return 5;
    return TIER_MESSAGE_LIMITS[tier.toLowerCase()] ?? 5;
  }

  /**
   * Get AI model for a specific tier
   * Essential Basic uses Haiku, all others use Sonnet
   */
  getModelForTier(tier) {
    if (!tier) return TIER_AI_MODELS.essential; // Default to Haiku for no subscription
    return TIER_AI_MODELS[tier.toLowerCase()] ?? TIER_AI_MODELS.explorer;
  }

  /**
   * Check if a feature is allowed for the Essential Basic tier
   * Returns { allowed: boolean, upgradeMessage: string | null }
   */
  checkEssentialFeatureAccess(tier, feature) {
    if (!tier) {
      return { allowed: false, upgradeMessage: 'Please subscribe to access this feature.' };
    }

    const tierLower = tier.toLowerCase();

    // Non-essential tiers have full access (based on their tier features)
    if (tierLower !== 'essential') {
      return { allowed: true, upgradeMessage: null };
    }

    // Essential tier - check allowed features
    const allowedFeatures = TIER_ALLOWED_FEATURES.essential;

    // Map feature names to allowed categories
    const featureMap = {
      'empty_legs': 'empty_legs',
      'emptyleg': 'empty_legs',
      'empty_leg': 'empty_legs',
      'restaurant': 'restaurants',
      'restaurants': 'restaurants',
      'dining': 'restaurants',
      'private_jet': 'private_jets_search',
      'jets': 'private_jets_search',
      'jet': 'private_jets_search',
      'general': 'general_queries',
      'info': 'general_queries',
      'search': 'general_queries'
    };

    const mappedFeature = featureMap[feature.toLowerCase()] || feature.toLowerCase();

    if (allowedFeatures.includes(mappedFeature)) {
      return { allowed: true, upgradeMessage: null };
    }

    return {
      allowed: false,
      upgradeMessage: '🔒 This is a premium service. Please upgrade your plan to access this feature.'
    };
  }

  /**
   * Get list of blocked features for Essential tier with upgrade messages
   */
  getEssentialBlockedFeatures() {
    return {
      helicopters: '🔒 Helicopter charters are a premium service. Please upgrade to Explorer or higher.',
      yachts: '🔒 Yacht charters are a premium service. Please upgrade to Explorer or higher.',
      luxury_cars: '🔒 Luxury car rentals are a premium service. Please upgrade to Explorer or higher.',
      concierge: '🔒 Concierge services require Traveller or Elite membership. Please upgrade.',
      medevac: '🔒 MEDEVAC services require Traveller or Elite membership. Please upgrade.',
      booking_jets: '🔒 Private jet bookings require Explorer or higher. You can search and view jets with Essential.',
      group_charter: '🔒 Group charter requests require Traveller or Elite membership. Please upgrade.',
      vip_events: '🔒 VIP event access requires Elite membership. Please upgrade.',
      adventures: '🔒 Adventure packages are a premium service. Please upgrade to Explorer or higher.'
    };
  }

  /**
   * Increment chat usage when user starts a new chat
   */
  async incrementChatUsage(userId) {
    try {
      const { data, error } = await supabase.rpc('increment_chat_usage', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error incrementing chat usage:', error);
      throw error;
    }
  }

  /**
   * Create a new chat session record
   */
  async createChatSession(userId, sessionId) {
    try {
      const { data, error } = await supabase
        .from('chat_usage')
        .insert({
          user_id: userId,
          chat_session_id: sessionId,
          message_count: 0,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  /**
   * Update chat session message count
   */
  async updateChatMessageCount(sessionId, messageCount) {
    try {
      const { data, error } = await supabase
        .from('chat_usage')
        .update({
          message_count: messageCount,
          last_message_at: new Date().toISOString()
        })
        .eq('chat_session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating message count:', error);
      throw error;
    }
  }

  /**
   * Mark chat session as completed
   */
  async completeChat(sessionId) {
    try {
      const { data, error } = await supabase
        .from('chat_usage')
        .update({
          completed: true,
          last_message_at: new Date().toISOString()
        })
        .eq('chat_session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing chat:', error);
      throw error;
    }
  }

  /**
   * Get message count for a chat session
   * Returns the current message count and if limit is reached
   * Now tier-aware: Explorer=10, Traveller=25, Elite=unlimited
   */
  async getMessageCount(sessionId, userId = null) {
    try {
      const { data, error } = await supabase
        .from('chat_usage')
        .select('message_count, user_id')
        .eq('chat_session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const count = data?.message_count || 0;
      const chatUserId = userId || data?.user_id;

      // Get user's tier to determine message limit
      let maxMessages = 10; // Default for explorer
      let isUnlimited = false;

      if (chatUserId) {
        try {
          const profile = await this.getUserProfile(chatUserId);
          let tier = profile?.subscription_tier?.toLowerCase();

          // Normalize tier - 'starter' is alias for 'essential'
          if (tier === 'starter') tier = 'essential';

          if (tier === 'elite' || tier === 'professional') {
            isUnlimited = true;
            maxMessages = null;
          } else if (tier === 'traveller') {
            maxMessages = 25;
          } else if (tier === 'essential') {
            maxMessages = 5; // Essential Basic - 5 messages per chat
          } else {
            maxMessages = 10; // Explorer or default
          }
        } catch (profileError) {
          console.warn('Could not fetch user profile for message limit:', profileError);
        }
      }

      return {
        messageCount: count,
        maxMessages: maxMessages,
        unlimited: isUnlimited,
        limitReached: !isUnlimited && count >= maxMessages,
        messagesRemaining: isUnlimited ? null : Math.max(0, maxMessages - count)
      };
    } catch (error) {
      console.error('Error getting message count:', error);
      // Return default values on error
      return {
        messageCount: 0,
        maxMessages: 10,
        unlimited: false,
        limitReached: false,
        messagesRemaining: 10
      };
    }
  }

  /**
   * Increment message count for a chat session
   * Now tier-aware: Explorer=10, Traveller=25, Elite=unlimited
   */
  async incrementMessageCount(sessionId, userId = null) {
    try {
      // First get current count and user_id
      const { data: current, error: fetchError } = await supabase
        .from('chat_usage')
        .select('message_count, user_id')
        .eq('chat_session_id', sessionId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const newCount = (current?.message_count || 0) + 1;
      const chatUserId = userId || current?.user_id;

      // Get user's tier to determine message limit
      let maxMessages = 10;
      let isUnlimited = false;

      if (chatUserId) {
        try {
          const profile = await this.getUserProfile(chatUserId);
          let tier = profile?.subscription_tier?.toLowerCase();

          // Normalize tier - 'starter' is alias for 'essential'
          if (tier === 'starter') tier = 'essential';

          if (tier === 'elite' || tier === 'professional') {
            isUnlimited = true;
            maxMessages = null;
          } else if (tier === 'traveller') {
            maxMessages = 25;
          } else if (tier === 'essential') {
            maxMessages = 5; // Essential Basic - 5 messages per chat
          } else {
            maxMessages = 10; // Explorer or default
          }
        } catch (profileError) {
          console.warn('Could not fetch user profile for message limit:', profileError);
        }
      }

      // Update message count
      const { data, error } = await supabase
        .from('chat_usage')
        .update({
          message_count: newCount,
          last_message_at: new Date().toISOString()
        })
        .eq('chat_session_id', sessionId)
        .select()
        .single();

      if (error) throw error;

      return {
        messageCount: newCount,
        maxMessages: maxMessages,
        unlimited: isUnlimited,
        limitReached: !isUnlimited && newCount >= maxMessages,
        messagesRemaining: isUnlimited ? null : Math.max(0, maxMessages - newCount)
      };
    } catch (error) {
      console.error('Error incrementing message count:', error);
      throw error;
    }
  }

  /**
   * Upgrade user subscription
   * When upgrading, ADD new chats to remaining instead of resetting
   * e.g., if 5 of 10 chats used and upgrading to 20 chats plan, user gets 5 remaining + 20 new = 25 total available
   */
  async upgradeSubscription(userId, newTier, stripeSubscriptionId, stripeCustomerId) {
    try {
      // Get current profile to calculate remaining chats
      const currentProfile = await this.getUserProfile(userId);

      // Get new tier details
      const { data: tierData } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('id', newTier)
        .single();

      if (!tierData) throw new Error('Invalid subscription tier');

      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Calculate new chats limit: remaining chats + new tier's chats
      let newChatsLimit = tierData.chats_limit;

      // If upgrading (not first subscription), add remaining chats to new limit
      if (currentProfile && currentProfile.chats_limit !== null) {
        const remainingChats = Math.max(0, (currentProfile.chats_limit || 0) - (currentProfile.chats_used || 0));
        // For unlimited tier (null), keep null
        if (tierData.chats_limit === null) {
          newChatsLimit = null;
        } else {
          newChatsLimit = tierData.chats_limit + remainingChats;
        }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: newTier,
          subscription_status: 'active',
          chats_limit: newChatsLimit,
          chats_used: 0, // Reset used counter since we've added remaining to limit
          chats_reset_date: nextMonth,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          subscription_status: 'canceled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Purchase chat top-up
   */
  async purchaseTopUp(userId, packageType, chatsAdded, priceUsd, stripePaymentIntentId) {
    try {
      // Record the purchase
      const { data: topupData, error: topupError } = await supabase
        .from('chat_topups')
        .insert({
          user_id: userId,
          package_type: packageType,
          chats_added: chatsAdded,
          price_usd: priceUsd,
          stripe_payment_intent_id: stripePaymentIntentId,
          status: 'completed',
          purchased_at: new Date().toISOString()
        })
        .select()
        .single();

      if (topupError) throw topupError;

      // Add chats to user's limit
      const { data: updateData, error: updateError } = await supabase.rpc('add_topup_chats', {
        p_user_id: userId,
        p_chats: chatsAdded
      });

      if (updateError) throw updateError;

      return {
        topup: topupData,
        profile: updateData
      };
    } catch (error) {
      console.error('Error purchasing top-up:', error);
      throw error;
    }
  }

  /**
   * Get user's top-up history
   */
  async getTopUpHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('chat_topups')
        .select('*')
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting top-up history:', error);
      throw error;
    }
  }

  /**
   * Get user's chat history
   */
  async getChatHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('chat_usage')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * Get chat usage statistics
   */
  async getChatStats(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      const chatHistory = await this.getChatHistory(userId);

      const totalChatsUsed = chatHistory.length;
      const totalMessages = chatHistory.reduce((sum, chat) => sum + chat.message_count, 0);
      const avgMessagesPerChat = totalChatsUsed > 0 ? Math.round(totalMessages / totalChatsUsed) : 0;

      return {
        tier: profile.subscription_tier,
        chatsUsed: profile.chats_used,
        chatsLimit: profile.chats_limit,
        chatsRemaining: profile.chats_limit !== null ? profile.chats_limit - profile.chats_used : null,
        unlimited: profile.chats_limit === null,
        resetDate: profile.chats_reset_date,
        totalLifetimeChats: totalChatsUsed,
        totalLifetimeMessages: totalMessages,
        avgMessagesPerChat: avgMessagesPerChat
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      throw error;
    }
  }

  /**
   * Get subscription transaction history
   */
  async getTransactionHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('subscription_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Get spending summary for subscription page
   */
  async getSpendingSummary(userId) {
    try {
      // Try using the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_subscription_spending_summary', {
        p_user_id: userId
      });

      if (!rpcError && rpcData) {
        return rpcData;
      }

      // Fallback: calculate manually if RPC not available
      const transactions = await this.getTransactionHistory(userId);
      const profile = await this.getUserProfile(userId);

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const totalSpent = transactions
        .filter(t => t.status === 'completed' && t.type !== 'refund')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const thisMonth = transactions
        .filter(t => {
          const date = new Date(t.created_at);
          return t.status === 'completed' && t.type !== 'refund' && date >= thisMonthStart;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const lastMonth = transactions
        .filter(t => {
          const date = new Date(t.created_at);
          return t.status === 'completed' && t.type !== 'refund' && date >= lastMonthStart && date <= lastMonthEnd;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      return {
        total_spent: totalSpent,
        this_month: thisMonth,
        last_month: lastMonth,
        total_transactions: transactions.length,
        current_tier: profile?.subscription_tier || 'none',
        member_since: transactions.length > 0
          ? transactions[transactions.length - 1].created_at
          : profile?.created_at
      };
    } catch (error) {
      console.error('Error getting spending summary:', error);
      return {
        total_spent: 0,
        this_month: 0,
        last_month: 0,
        total_transactions: 0,
        current_tier: 'explorer',
        member_since: null
      };
    }
  }

  /**
   * Record a subscription transaction
   */
  async recordTransaction(userId, transactionData) {
    try {
      const { data, error } = await supabase
        .from('subscription_transactions')
        .insert({
          user_id: userId,
          type: transactionData.type,
          tier: transactionData.tier,
          previous_tier: transactionData.previousTier,
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          payment_method: transactionData.paymentMethod,
          stripe_payment_intent_id: transactionData.stripePaymentIntentId,
          stripe_invoice_id: transactionData.stripeInvoiceId,
          stripe_subscription_id: transactionData.stripeSubscriptionId,
          status: transactionData.status || 'completed',
          period_start: transactionData.periodStart,
          period_end: transactionData.periodEnd,
          description: transactionData.description,
          metadata: transactionData.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }

  /**
   * Reset chat usage for a new billing period (called on subscription renewal)
   * Also updates the reset date to next month
   */
  async resetChatUsageOnRenewal(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) throw new Error('User profile not found');

      const tier = profile.subscription_tier?.toLowerCase();
      const newChatsLimit = TIER_CHAT_LIMITS[tier] ?? 5;

      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          chats_used: 0,
          chats_limit: newChatsLimit,
          chats_reset_date: nextMonth.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Chat usage reset for user ${userId}: 0/${newChatsLimit} chats`);
      return data;
    } catch (error) {
      console.error('Error resetting chat usage:', error);
      throw error;
    }
  }

  /**
   * Check if user's subscription period has ended and needs renewal reset
   * Returns true if reset was performed
   */
  async checkAndResetIfNeeded(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile || !profile.subscription_tier) return false;

      // Check if subscription is active
      if (profile.subscription_status !== 'active') return false;

      // Check if past reset date
      const resetDate = profile.chats_reset_date ? new Date(profile.chats_reset_date) : null;
      const now = new Date();

      if (!resetDate || now <= resetDate) return false;

      // Past reset date and subscription is active - reset usage
      console.log(`📅 Subscription period ended for user ${userId}, resetting chat usage...`);
      await this.resetChatUsageOnRenewal(userId);
      return true;
    } catch (error) {
      console.error('Error checking/resetting chat usage:', error);
      return false;
    }
  }

  /**
   * Get Break the Price statistics
   */
  async getPriceBreakStats(userId) {
    try {
      const { data, error } = await supabase.rpc('get_price_break_stats', {
        p_user_id: userId
      });

      if (error) {
        // Fallback if function doesn't exist
        const { data: requests } = await supabase
          .from('price_break_requests')
          .select('status, savings_amount')
          .eq('user_id', userId);

        if (!requests) return { total_requests: 0, pending: 0, offers_waiting: 0, accepted: 0, total_savings: 0 };

        return {
          total_requests: requests.length,
          pending: requests.filter(r => ['pending', 'analyzing', 'reviewed'].includes(r.status)).length,
          offers_waiting: requests.filter(r => r.status === 'offer_made').length,
          accepted: requests.filter(r => r.status === 'accepted').length,
          total_savings: requests
            .filter(r => r.status === 'accepted' && r.savings_amount)
            .reduce((sum, r) => sum + parseFloat(r.savings_amount), 0)
        };
      }

      return data;
    } catch (error) {
      console.error('Error getting price break stats:', error);
      return { total_requests: 0, pending: 0, offers_waiting: 0, accepted: 0, total_savings: 0 };
    }
  }
}

export const subscriptionService = new SubscriptionService();
