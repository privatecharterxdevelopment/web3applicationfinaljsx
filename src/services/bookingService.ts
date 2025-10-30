import { supabase } from '../lib/supabase';
import type { BookingRequest, BookingFormData } from '../types/booking';

class BookingService {
  /**
   * Transform component state data into database format
   */
  private transformBookingData(formData: BookingFormData): Omit<BookingRequest, 'id' | 'created_at' | 'updated_at'> {
    if (!formData.origin || !formData.destination || !formData.departureDate || !formData.selectedJet) {
      throw new Error('Missing required booking data');
    }

    return {
      // Flight Route
      origin_airport_code: formData.origin.code,
      destination_airport_code: formData.destination.code,

      // Flight Details
      departure_date: formData.departureDate.toISOString().split('T')[0], // YYYY-MM-DD
      departure_time: formData.departureTime,
      passengers: formData.passengers,
      luggage: formData.luggage,
      pets: formData.pets,

      // Aircraft Selection
      selected_jet_category: formData.selectedJet.id,

      // Services Selection
      aviation_services: formData.selectedAviationServices,
      luxury_services: formData.selectedLuxuryServices,

      // Carbon Offset
      carbon_option: formData.carbonOption as 'none' | 'full',
      carbon_nft_wallet: formData.carbonOption === 'full' ? formData.walletAddress : undefined,

      // Pricing
      total_price: formData.totalPrice,
      currency: 'EUR',
      payment_method: formData.selectedPayment as 'bank' | 'card' | 'crypto',

      // Contact Information
      contact_name: formData.contact.name,
      contact_email: formData.contact.email,
      contact_phone: formData.contact.phone,
      contact_company: formData.contact.company || undefined,

      // Web3 Integration
      wallet_address: formData.walletAddress || undefined,
      nft_discount_applied: formData.discountPercent > 0,

      // Status
      status: 'pending' as const
    };
  }

  /**
   * Create a new booking request
   */
  async createBookingRequest(formData: BookingFormData): Promise<{ data: BookingRequest | null; error: any }> {
    try {
      const bookingData = this.transformBookingData(formData);

      // Get current session to ensure auth context is established
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        return { data: null, error: sessionError };
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('User error:', userError);
        return { data: null, error: userError };
      }

      // Add user_id if user is logged in
      const bookingWithUser = {
        ...bookingData,
        user_id: user?.id || null
      };

      // Force session refresh to ensure RLS gets the correct auth context
      await supabase.auth.refreshSession();

      // Ensure we're using the authenticated client
      const { data, error } = await supabase
        .from('booking_requests')
        .insert([bookingWithUser])
        .select()
        .single();

      if (error) {
        console.error('Error creating booking request:', error);
        return { data: null, error };
      }

      console.log('Booking request created successfully:', data);

      // PARALLEL SAVE: Also save to user_requests for email notifications
      // This triggers the email notification system without breaking existing workflow
      if (user?.id && data) {
        try {
          const userRequestPayload = {
            user_id: user.id,
            type: 'private_jet_charter', // Default to private jet, can be enhanced later
            status: 'pending',
            data: {
              booking_request_id: data.id,
              origin: data.origin_airport_code,
              destination: data.destination_airport_code,
              departure_date: data.departure_date,
              departure_time: data.departure_time,
              passengers: data.passengers,
              luggage: data.luggage,
              pets: data.pets,
              aircraft_type: data.selected_jet_category,
              aviation_services: data.aviation_services,
              luxury_services: data.luxury_services,
              carbon_option: data.carbon_option,
              carbon_nft_wallet: data.carbon_nft_wallet,
              total_price: data.total_price,
              currency: data.currency,
              payment_method: data.payment_method,
              contact_name: data.contact_name,
              contact_email: data.contact_email,
              contact_phone: data.contact_phone,
              contact_company: data.contact_company,
              wallet_address: data.wallet_address,
              nft_discount_applied: data.nft_discount_applied,
              booking_source: 'unified_booking_flow',
              timestamp: new Date().toISOString()
            }
          };

          const { error: userRequestError } = await supabase
            .from('user_requests')
            .insert([userRequestPayload]);

          if (userRequestError) {
            console.warn('Failed to save to user_requests (email notification may not work):', userRequestError);
            // Don't fail the whole request - booking_requests save succeeded
          } else {
            console.log('✅ Parallel save to user_requests successful - email notifications will be sent');
          }
        } catch (parallelSaveError) {
          console.warn('Parallel save to user_requests failed:', parallelSaveError);
          // Continue - main booking was successful
        }
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error in createBookingRequest:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get booking requests for a specific user
   */
  async getUserBookingRequests(userId: string): Promise<{ data: BookingRequest[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user booking requests:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error in getUserBookingRequests:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get a specific booking request by ID
   */
  async getBookingRequest(id: string): Promise<{ data: BookingRequest | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching booking request:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error in getBookingRequest:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update booking status (admin only)
   */
  async updateBookingStatus(id: string, status: BookingRequest['status'], notes?: string): Promise<{ data: BookingRequest | null; error: any }> {
    try {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;

      const { data, error } = await supabase
        .from('booking_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating booking status:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error in updateBookingStatus:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Validate booking form data
   */
  validateBookingData(formData: BookingFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!formData.origin) errors.push('Origin airport is required');
    if (!formData.destination) errors.push('Destination airport is required');
    if (!formData.departureDate) errors.push('Departure date is required');
    if (!formData.selectedJet) errors.push('Aircraft selection is required');
    if (!formData.contact.name.trim()) errors.push('Contact name is required');
    if (!formData.contact.email.trim()) errors.push('Contact email is required');
    if (!formData.contact.phone.trim()) errors.push('Contact phone is required');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contact.email && !emailRegex.test(formData.contact.email)) {
      errors.push('Valid email address is required');
    }

    // Carbon NFT wallet validation
    if (formData.carbonOption === 'full' && formData.walletAddress) {
      const walletRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!walletRegex.test(formData.walletAddress)) {
        errors.push('Valid Ethereum wallet address is required for carbon NFT');
      }
    }

    // Passenger validation
    if (formData.passengers < 1) errors.push('At least 1 passenger is required');
    if (formData.selectedJet && formData.passengers > formData.selectedJet.capacity) {
      errors.push(`Selected aircraft can accommodate maximum ${formData.selectedJet.capacity} passengers`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const bookingService = new BookingService();