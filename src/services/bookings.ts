import { supabase } from '../lib/supabase';

export type BookingType = 'empty_leg' | 'adventure_package' | 'co2_certificate';
export type PaymentStatus = 'pending' | 'confirming' | 'paid' | 'expired' | 'cancelled' | 'refunded' | 'failed';
export type BookingStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type CryptoCurrency = 'BTC' | 'ETH' | 'USDT' | 'USDC';

export interface CreateBookingData {
  userId: string;
  bookingType: BookingType;
  serviceId: string;
  serviceTitle: string;
  serviceDescription?: string;
  serviceImageUrl?: string;
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  duration?: string;
  aircraftType?: string;
  co2TonsOffset?: number;
  certificationNumber?: string;
  basePrice: number;
  platformFee?: number;
  processingFee?: number;
  discountAmount?: number;
  discountType?: string;
  totalAmount: number;
  currency?: string;
  cryptoCurrency: CryptoCurrency;
  walletAddress?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  specialRequests?: string;
  metadata?: Record<string, any>;
}

export interface Booking {
  id: string;
  user_id: string;
  booking_type: BookingType;
  request_id: string | null;
  service_id: string;
  service_title: string;
  service_description: string | null;
  service_image_url: string | null;
  origin: string | null;
  destination: string | null;
  departure_date: string | null;
  return_date: string | null;
  passengers: number | null;
  duration: string | null;
  aircraft_type: string | null;
  co2_tons_offset: number | null;
  certification_type: string | null;
  base_price: number;
  platform_fee: number;
  processing_fee: number;
  discount_amount: number;
  discount_type: string | null;
  total_amount: number;
  currency: string;
  payment_method: string;
  crypto_currency: string | null;
  coingate_order_id: string | null;
  coingate_payment_url: string | null;
  coingate_token: string | null;
  crypto_amount: number | null;
  crypto_amount_received: number | null;
  exchange_rate: number | null;
  wallet_address: string | null;
  transaction_hash: string | null;
  block_number: number | null;
  network: string | null;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  special_requests: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  admin_notes: string | null;
  processed_by: string | null;
}

/**
 * Create a new booking and initiate CoinGate payment
 */
export const createBooking = async (data: CreateBookingData): Promise<{
  booking: Booking | null;
  paymentUrl: string | null;
  error: string | null;
}> => {
  try {
    // 1. Create booking record in database
    const bookingData = {
      user_id: data.userId,
      booking_type: data.bookingType,
      service_id: data.serviceId,
      service_title: data.serviceTitle,
      service_description: data.serviceDescription || null,
      service_image_url: data.serviceImageUrl || null,
      origin: data.origin || null,
      destination: data.destination || null,
      departure_date: data.departureDate || null,
      return_date: data.returnDate || null,
      passengers: data.passengers || null,
      duration: data.duration || null,
      aircraft_type: data.aircraftType || null,
      co2_tons_offset: data.co2TonsOffset || null,
      base_price: data.basePrice,
      platform_fee: data.platformFee || 0,
      processing_fee: data.processingFee || 0,
      discount_amount: data.discountAmount || 0,
      discount_type: data.discountType || null,
      total_amount: data.totalAmount,
      currency: data.currency || 'EUR',
      payment_method: `crypto_${data.cryptoCurrency.toLowerCase()}`,
      crypto_currency: data.cryptoCurrency,
      wallet_address: data.walletAddress || null,
      contact_name: data.contactName || null,
      contact_email: data.contactEmail || null,
      contact_phone: data.contactPhone || null,
      special_requests: data.specialRequests || null,
      metadata: data.metadata || {},
      payment_status: 'pending' as PaymentStatus,
      booking_status: 'pending' as BookingStatus
    };

    const { data: booking, error: insertError } = await supabase
      .from('user_bookings')
      .insert([bookingData])
      .select()
      .single();

    if (insertError || !booking) {
      console.error('Error creating booking:', insertError);
      return { booking: null, paymentUrl: null, error: insertError?.message || 'Failed to create booking' };
    }

    // 2. Create CoinGate payment
    try {
      const response = await fetch('/api/coingate/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: data.totalAmount,
          currency: data.currency || 'EUR',
          cryptoCurrency: data.cryptoCurrency,
          title: data.serviceTitle,
          description: `${data.bookingType.replace('_', ' ')} - ${data.serviceTitle}`,
          callbackUrl: `${window.location.origin}/api/coingate/webhook`,
          successUrl: `${window.location.origin}/booking-success?id=${booking.id}`,
          cancelUrl: `${window.location.origin}/booking-cancelled?id=${booking.id}`
        })
      });

      if (response.ok) {
        const paymentData = await response.json();

        // Update booking with CoinGate details
        await supabase
          .from('user_bookings')
          .update({
            coingate_order_id: paymentData.orderId,
            coingate_payment_url: paymentData.paymentUrl,
            coingate_token: paymentData.token,
            crypto_amount: paymentData.cryptoAmount,
            exchange_rate: paymentData.exchangeRate
          })
          .eq('id', booking.id);

        return {
          booking: { ...booking, coingate_payment_url: paymentData.paymentUrl },
          paymentUrl: paymentData.paymentUrl,
          error: null
        };
      } else {
        const errorData = await response.json();
        console.error('CoinGate payment creation failed:', errorData);

        // Mark booking as failed
        await supabase
          .from('user_bookings')
          .update({ payment_status: 'failed' })
          .eq('id', booking.id);

        return {
          booking,
          paymentUrl: null,
          error: errorData.error || 'Failed to create payment'
        };
      }
    } catch (paymentError) {
      console.error('Error creating CoinGate payment:', paymentError);
      return {
        booking,
        paymentUrl: null,
        error: 'Failed to initialize payment'
      };
    }
  } catch (error) {
    console.error('Error in createBooking:', error);
    return { booking: null, paymentUrl: null, error: 'An unexpected error occurred' };
  }
};

/**
 * Get user's bookings
 */
export const getUserBookings = async (userId: string): Promise<{
  bookings: Booking[];
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('user_bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return { bookings: [], error: error.message };
    }

    return { bookings: data || [], error: null };
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    return { bookings: [], error: 'Failed to fetch bookings' };
  }
};

/**
 * Get a single booking by ID
 */
export const getBookingById = async (bookingId: string): Promise<{
  booking: Booking | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('user_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return { booking: null, error: error.message };
    }

    return { booking: data, error: null };
  } catch (error) {
    console.error('Error in getBookingById:', error);
    return { booking: null, error: 'Failed to fetch booking' };
  }
};

/**
 * Update booking payment status (called by webhook)
 */
export const updateBookingPaymentStatus = async (
  bookingId: string,
  status: PaymentStatus,
  transactionDetails?: {
    transactionHash?: string;
    cryptoAmountReceived?: number;
    blockNumber?: number;
    network?: string;
  }
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const updateData: any = {
      payment_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
      updateData.booking_status = 'confirmed';
      updateData.confirmed_at = new Date().toISOString();
    }

    if (transactionDetails) {
      if (transactionDetails.transactionHash) {
        updateData.transaction_hash = transactionDetails.transactionHash;
      }
      if (transactionDetails.cryptoAmountReceived) {
        updateData.crypto_amount_received = transactionDetails.cryptoAmountReceived;
      }
      if (transactionDetails.blockNumber) {
        updateData.block_number = transactionDetails.blockNumber;
      }
      if (transactionDetails.network) {
        updateData.network = transactionDetails.network;
      }
    }

    const { error } = await supabase
      .from('user_bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking status:', error);
      return { success: false, error: error.message };
    }

    // If payment is successful, trigger confirmation email via Edge Function
    if (status === 'paid') {
      try {
        await supabase.functions.invoke('booking-confirmation-email', {
          body: { bookingId }
        });
      } catch (emailError) {
        console.warn('Failed to send confirmation email:', emailError);
        // Don't fail the status update if email fails
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in updateBookingPaymentStatus:', error);
    return { success: false, error: 'Failed to update booking status' };
  }
};

/**
 * Cancel a pending booking
 */
export const cancelBooking = async (bookingId: string, userId: string): Promise<{
  success: boolean;
  error: string | null;
}> => {
  try {
    // Verify ownership and status
    const { data: booking, error: fetchError } = await supabase
      .from('user_bookings')
      .select('id, user_id, payment_status')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (booking.payment_status !== 'pending') {
      return { success: false, error: 'Only pending bookings can be cancelled' };
    }

    const { error } = await supabase
      .from('user_bookings')
      .update({
        payment_status: 'cancelled',
        booking_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error cancelling booking:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    return { success: false, error: 'Failed to cancel booking' };
  }
};

/**
 * Get booking statistics for user
 */
export const getBookingStats = async (userId: string): Promise<{
  total: number;
  paid: number;
  pending: number;
  totalSpent: number;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('user_bookings')
      .select('payment_status, total_amount')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching booking stats:', error);
      return { total: 0, paid: 0, pending: 0, totalSpent: 0, error: error.message };
    }

    const bookings = data || [];
    const total = bookings.length;
    const paid = bookings.filter(b => b.payment_status === 'paid').length;
    const pending = bookings.filter(b => b.payment_status === 'pending').length;
    const totalSpent = bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

    return { total, paid, pending, totalSpent, error: null };
  } catch (error) {
    console.error('Error in getBookingStats:', error);
    return { total: 0, paid: 0, pending: 0, totalSpent: 0, error: 'Failed to fetch stats' };
  }
};

export default {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingPaymentStatus,
  cancelBooking,
  getBookingStats
};
