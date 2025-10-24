/**
 * Chat Request Service
 * Handles saving and managing user chat requests in Supabase
 */

import { supabase } from '../lib/supabase';

class ChatRequestService {
  /**
   * Save a chat request to Supabase
   * @param {Object} requestData - The request data
   * @returns {Promise<Object>} The saved request or error
   */
  async saveChatRequest({
    query,
    conversationHistory,
    serviceType = null,
    fromLocation = null,
    toLocation = null,
    dateStart = null,
    dateEnd = null,
    passengers = null,
    budget = null,
    pets = 0,
    specialRequirements = null,
    confidenceScore = 50,
    hasResults = false,
    resultsCount = 0,
    resultsSummary = null,
    cartItems = null,
    cartTotal = null,
    status = 'pending'
  }) {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.warn('User not authenticated, cannot save chat request');
        return { success: false, error: 'Not authenticated' };
      }

      // Prepare request payload
      const payload = {
        user_id: user.id,
        query: query,
        service_type: serviceType,
        from_location: fromLocation,
        to_location: toLocation,
        date_start: dateStart,
        date_end: dateEnd,
        passengers: passengers,
        budget: budget,
        pets: pets,
        special_requirements: specialRequirements,
        confidence_score: confidenceScore,
        conversation_history: conversationHistory,
        has_results: hasResults,
        results_count: resultsCount,
        results_summary: resultsSummary,
        cart_items: cartItems,
        cart_total: cartTotal,
        status: status
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('chat_requests')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Error saving chat request:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Chat request saved to Supabase:', data.id);
      return { success: true, data };

    } catch (error) {
      console.error('Exception saving chat request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's chat requests
   * @param {string} status - Filter by status (optional)
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} List of chat requests
   */
  async getUserChatRequests(status = null, limit = 50) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'Not authenticated', data: [] };
      }

      let query = supabase
        .from('chat_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching chat requests:', error);
        return { success: false, error: error.message, data: [] };
      }

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('Exception fetching chat requests:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get count of pending requests for user
   * @returns {Promise<number>} Count of pending requests
   */
  async getPendingCount() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) return 0;

      const { count, error } = await supabase
        .from('chat_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error counting pending requests:', error);
        return 0;
      }

      return count || 0;

    } catch (error) {
      console.error('Exception counting pending requests:', error);
      return 0;
    }
  }

  /**
   * Update a chat request status
   * @param {string} requestId - The request ID
   * @param {string} status - New status
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated request or error
   */
  async updateRequestStatus(requestId, status, notes = null) {
    try {
      const payload = { status };
      if (notes) payload.notes = notes;

      const { data, error } = await supabase
        .from('chat_requests')
        .update(payload)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };

    } catch (error) {
      console.error('Exception updating chat request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a chat request
   * @param {string} requestId - The request ID
   * @returns {Promise<Object>} Result
   */
  async deleteRequest(requestId) {
    try {
      const { error } = await supabase
        .from('chat_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error deleting chat request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Exception deleting chat request:', error);
      return { success: false, error: error.message };
    }
  }
}

export const chatRequestService = new ChatRequestService();
export default chatRequestService;
