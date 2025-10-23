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
          chats_limit: 2,
          chats_used: 0,
          chats_reset_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now for explorer
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
          chatsUsed: profile.chats_used,
          tier: profile.subscription_tier
        };
      }

      // Check if limit reached
      const canStart = profile.chats_used < profile.chats_limit;

      return {
        canStart,
        unlimited: false,
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
   * Upgrade user subscription
   */
  async upgradeSubscription(userId, newTier, stripeSubscriptionId, stripeCustomerId) {
    try {
      // Get tier details
      const { data: tierData } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('id', newTier)
        .single();

      if (!tierData) throw new Error('Invalid subscription tier');

      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: newTier,
          subscription_status: 'active',
          chats_limit: tierData.chats_limit,
          chats_used: 0, // Reset on upgrade
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
}

export const subscriptionService = new SubscriptionService();
