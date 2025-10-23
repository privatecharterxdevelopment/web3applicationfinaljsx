import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

interface CreateRequestOptions {
  userId: string;
  type: 'flight_quote' | 'support' | 'document' | 'visa' | 'payment' | 'booking' | 'cancellation' | 'modification' | 'private_jet_charter' | 'fixed_offer' | 'helicopter_charter' | 'empty_leg' | 'luxury_car_rental';
  data: any;
}

export const createRequest = async ({ userId, type, data }: CreateRequestOptions) => {
  try {
    const { data: request, error } = await supabase
      .from('user_requests')
      .insert([{
        user_id: userId,
        type,
        data,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return { request, error: null };
  } catch (error) {
    logger.error('Error creating request:', error);
    return { request: null, error: 'Failed to create request' };
  }
};

export const getUserRequests = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_requests')
      .select(`
        *,
        admin:admin_id (
          name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { requests: data, error: null };
  } catch (error) {
    logger.error('Error fetching user requests:', error);
    return { requests: null, error: 'Failed to fetch requests' };
  }
};

export const updateRequestStatus = async (requestId: string, status: string, adminId?: string, notes?: string) => {
  try {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    if (adminId) {
      updates.admin_id = adminId;
    }

    if (notes) {
      updates.admin_notes = notes;
    }

    const { error } = await supabase
      .from('user_requests')
      .update(updates)
      .eq('id', requestId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    logger.error('Error updating request status:', error);
    return { success: false, error: 'Failed to update request status' };
  }
};

export const getRequestHistory = async (userId: string, type?: string) => {
  try {
    let query = supabase
      .from('user_requests')
      .select(`
        *,
        admin:admin_id (
          name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { history: data, error: null };
  } catch (error) {
    logger.error('Error fetching request history:', error);
    return { history: null, error: 'Failed to fetch request history' };
  }
};