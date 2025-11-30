import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// All supported request types for the user_requests table
// The 'type' column in Supabase is TEXT, so any string is accepted
// This list covers all service types in the platform
export type RequestType =
  | 'flight_quote'
  | 'support'
  | 'document'
  | 'visa'
  | 'payment'
  | 'booking'
  | 'cancellation'
  | 'modification'
  | 'private_jet_charter'
  | 'fixed_offer'
  | 'helicopter_charter'
  | 'empty_leg'
  | 'luxury_car_rental'
  | 'adventure_package'
  | 'spv_formation'
  | 'tokenization'
  | 'taxi_concierge'
  | 'event_booking'
  | 'co2_certificate'
  | 'custom_request'          // Custom AI chat requests
  | 'cart_checkout'           // Cart checkout with multiple items
  | 'restaurant_reservation'  // Restaurant bookings
  | 'yacht_charter'           // Yacht bookings
  | 'ground_transport'        // Ground transport/taxi
  | 'consultation'            // Consultation requests
  | 'ai_chat_bulk'            // AI Chat bulk requests (multiple items)
  | string;                   // Allow any other string for flexibility

interface CreateRequestOptions {
  userId: string;
  type: RequestType;
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
