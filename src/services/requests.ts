import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// Edge function URL for sending request emails
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://txwgcbfpfkxjjxnqjmlq.supabase.co';

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
  | 'travel_request'          // Luxury travel planning requests (min $20K)
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

// Send request confirmation email with PDF attachment
interface SendRequestEmailOptions {
  to: string;
  requestData: {
    id: string;
    type: string;
    created_at: string;
    status?: string;
    user: {
      name: string;
      email: string;
    };
    details: {
      from?: string;
      to?: string;
      date?: string;
      time?: string;
      passengers?: number;
      service_type?: string;
      notes?: string;
      price?: number;
      currency?: string;
    };
  };
  pdfBase64?: string;
  pdfFilename?: string;
}

export const sendRequestConfirmationEmail = async (options: SendRequestEmailOptions) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-request-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        to: options.to,
        requestData: options.requestData,
        pdfBase64: options.pdfBase64,
        pdfFilename: options.pdfFilename,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    const result = await response.json();
    logger.info('Request confirmation email sent:', result.messageId);
    return { success: true, messageId: result.messageId, error: null };
  } catch (error) {
    logger.error('Error sending request confirmation email:', error);
    return { success: false, messageId: null, error: 'Failed to send confirmation email' };
  }
};

// Create request and send confirmation email
interface CreateRequestWithEmailOptions extends CreateRequestOptions {
  userEmail: string;
  userName: string;
  sendEmail?: boolean;
  pdfBase64?: string;
  pdfFilename?: string;
}

export const createRequestWithEmail = async (options: CreateRequestWithEmailOptions) => {
  const { userId, type, data, userEmail, userName, sendEmail = true, pdfBase64, pdfFilename } = options;

  // Create the request first
  const { request, error } = await createRequest({ userId, type, data });

  if (error || !request) {
    return { request: null, error: error || 'Failed to create request' };
  }

  // Send confirmation email if enabled
  if (sendEmail && userEmail) {
    try {
      await sendRequestConfirmationEmail({
        to: userEmail,
        requestData: {
          id: request.id,
          type: request.type,
          created_at: request.created_at,
          status: request.status,
          user: {
            name: userName || 'Valued Client',
            email: userEmail,
          },
          details: {
            from: data.from || data.from_city || data.pickup_location || data.origin,
            to: data.to || data.to_city || data.dropoff_location || data.destination,
            date: data.date || data.pickupDate || data.departure_date,
            time: data.time || data.pickupTime,
            passengers: data.passengers || data.pax,
            service_type: data.service_type || data.category,
            notes: data.notes || data.extraNotes || data.special_requirements,
            price: data.price || data.total || data.estimated_total,
            currency: data.currency || 'USD',
          },
        },
        pdfBase64,
        pdfFilename,
      });
    } catch (emailError) {
      // Log but don't fail the request creation if email fails
      logger.warn('Failed to send confirmation email, but request was created:', emailError);
    }
  }

  return { request, error: null };
};
