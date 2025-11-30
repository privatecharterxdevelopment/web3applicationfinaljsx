import { supabase } from '../lib/supabase';

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
        // If profile doesn't exist, create default explorer profile
        if (error.code === 'PGRST116') {
          return await this.createDefaultProfile(userId);
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Create default explorer profile for new users
   * Free tier: 1 chat with 20 messages (lifetime limit)
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
          subscription_tier: 'explorer',
          subscription_status: 'active',
          chats_limit: 1, // Free tier: 1 chat only
          chats_used: 0,
          chats_reset_date: null // No reset for free tier - lifetime limit
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default profile:', error);
      throw error;
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

      // Elite (unlimited)
      if (profile.chats_limit === null) {
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
        unlimitedMessages: false,
        chatsUsed: profile.chats_used,
        chatsLimit: profile.chats_limit,
        chatsRemaining: profile.chats_limit - profile.chats_used,
        tier: profile.subscription_tier,
        resetDate: profile.chats_reset_date
      };
    } catch (error) {
      console.error('Error checking chat availability:', error);
      throw error;
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
   * Check if user has Break the Price access
   */
  async hasBreakThePriceAccess(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      return ['starter', 'pro', 'elite'].includes(profile.subscription_tier);
    } catch (error) {
      console.error('Error checking Break the Price access:', error);
      return false;
    }
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
   */
  async getMessageCount(sessionId) {
    try {
      const { data, error } = await supabase
        .from('chat_usage')
        .select('message_count')
        .eq('chat_session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const count = data?.message_count || 0;
      const MAX_MESSAGES_PER_CHAT = 20;

      return {
        messageCount: count,
        maxMessages: MAX_MESSAGES_PER_CHAT,
        limitReached: count >= MAX_MESSAGES_PER_CHAT,
        messagesRemaining: MAX_MESSAGES_PER_CHAT - count
      };
    } catch (error) {
      console.error('Error getting message count:', error);
      // Return default values on error
      return {
        messageCount: 0,
        maxMessages: 20,
        limitReached: false,
        messagesRemaining: 20
      };
    }
  }

  /**
   * Increment message count for a chat session
   */
  async incrementMessageCount(sessionId) {
    try {
      // First get current count
      const { data: current, error: fetchError } = await supabase
        .from('chat_usage')
        .select('message_count')
        .eq('chat_session_id', sessionId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const newCount = (current?.message_count || 0) + 1;
      const MAX_MESSAGES_PER_CHAT = 20;

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
        maxMessages: MAX_MESSAGES_PER_CHAT,
        limitReached: newCount >= MAX_MESSAGES_PER_CHAT,
        messagesRemaining: MAX_MESSAGES_PER_CHAT - newCount
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
        current_tier: profile?.subscription_tier || 'explorer',
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
