import { supabase } from '../lib/supabase';

/**
 * AI Chat Service
 * Handles saving and loading chat sessions to/from Supabase
 */

export const chatService = {
  /**
   * Create a new chat session
   */
  async createChat(userId, title = 'New Conversation', initialMessage = null) {
    try {
      const messages = initialMessage ? [initialMessage] : [];

      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          user_id: userId,
          title,
          messages
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Chat created:', data.id);
      return { success: true, chat: data };
    } catch (error) {
      console.error('❌ Error creating chat:', error);
      return { success: false, error };
    }
  },

  /**
   * Load all chats for a user
   */
  async loadUserChats(userId) {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      console.log(`✅ Loaded ${data.length} chats for user`);
      return { success: true, chats: data };
    } catch (error) {
      console.error('❌ Error loading chats:', error);
      return { success: false, error, chats: [] };
    }
  },

  /**
   * Load a specific chat by ID
   */
  async loadChat(chatId, userId) {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('id', chatId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return { success: true, chat: data };
    } catch (error) {
      console.error('❌ Error loading chat:', error);
      return { success: false, error };
    }
  },

  /**
   * Update chat messages
   */
  async updateChatMessages(chatId, messages, userId) {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .update({ messages })
        .eq('id', chatId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, chat: data };
    } catch (error) {
      console.error('❌ Error updating chat messages:', error);
      return { success: false, error };
    }
  },

  /**
   * Update chat title
   */
  async updateChatTitle(chatId, title, userId) {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .update({ title })
        .eq('id', chatId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, chat: data };
    } catch (error) {
      console.error('❌ Error updating chat title:', error);
      return { success: false, error };
    }
  },

  /**
   * Delete a chat
   */
  async deleteChat(chatId, userId) {
    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log('✅ Chat deleted:', chatId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting chat:', error);
      return { success: false, error };
    }
  },

  /**
   * Generate chat title from first message (AI-powered)
   */
  generateTitle(firstMessage) {
    // Simple title generation - take first 50 chars
    if (!firstMessage) return 'New Conversation';

    const text = firstMessage.content || firstMessage.text || '';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }
};
