import { supabase } from '../lib/supabase';
import type {
  Hotel,
  HotelSearchParams,
  HotelSearchResult,
  HotelDetails,
  HotelReview,
  HotelBooking,
  HotelBookingFormData,
  PrebookResponse,
  City
} from '../types/hotel';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

class HotelService {
  private async callLiteAPI(action: string, params: any): Promise<{ data: any; error: any }> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/liteapi-hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
        },
        body: JSON.stringify({ action, params })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('LiteAPI error:', data);
        return { data: null, error: data.error || 'API request failed' };
      }

      return { data, error: null };
    } catch (err) {
      console.error('LiteAPI call failed:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Search hotels by various criteria
   */
  async searchHotels(params: HotelSearchParams): Promise<{ data: HotelSearchResult[] | null; error: any }> {
    try {
      const { data, error } = await this.callLiteAPI('searchHotels', {
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults: params.adults,
        children: params.children || 0,
        currency: params.currency || 'USD',
        guestNationality: params.guestNationality || 'US',
        occupancies: [{
          adults: params.adults,
          children: params.children || 0
        }],
        ...(params.cityCode && { cityCode: params.cityCode }),
        ...(params.countryCode && { countryCode: params.countryCode }),
        ...(params.latitude && params.longitude && {
          latitude: params.latitude,
          longitude: params.longitude,
          radius: params.radius || 10
        }),
        ...(params.iataCode && { iataCode: params.iataCode }),
        ...(params.hotelIds && { hotelIds: params.hotelIds }),
        ...(params.starRating && { starRating: params.starRating }),
        ...(params.minPrice && { minPrice: params.minPrice }),
        ...(params.maxPrice && { maxPrice: params.maxPrice }),
        limit: params.limit || 50
      });

      if (error) {
        return { data: null, error };
      }

      // Transform LiteAPI response to our format
      const results: HotelSearchResult[] = (data.data || []).map((item: any) => ({
        hotel: this.transformHotelData(item),
        rooms: this.transformRoomsData(item.rooms || []),
        totalRate: item.minRate || item.rooms?.[0]?.rates?.[0]?.totalRate || 0,
        currency: params.currency || 'USD'
      }));

      return { data: results, error: null };
    } catch (err) {
      console.error('searchHotels error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get detailed hotel information
   */
  async getHotelDetails(hotelId: string): Promise<{ data: HotelDetails | null; error: any }> {
    try {
      const { data, error } = await this.callLiteAPI('getHotelDetails', { hotelId });

      if (error) {
        return { data: null, error };
      }

      const hotel = this.transformHotelDetails(data.data);
      return { data: hotel, error: null };
    } catch (err) {
      console.error('getHotelDetails error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get hotel reviews
   */
  async getHotelReviews(hotelId: string, limit = 20): Promise<{ data: HotelReview[] | null; error: any }> {
    try {
      const { data, error } = await this.callLiteAPI('getHotelReviews', { hotelId, limit });

      if (error) {
        return { data: null, error };
      }

      const reviews: HotelReview[] = (data.data || []).map((r: any) => ({
        reviewId: r.id || String(Math.random()),
        rating: r.rating || 0,
        title: r.title,
        comment: r.comment || r.text || '',
        author: r.author || 'Guest',
        date: r.date || new Date().toISOString(),
        pros: r.pros,
        cons: r.cons
      }));

      return { data: reviews, error: null };
    } catch (err) {
      console.error('getHotelReviews error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get cities list for a country
   */
  async getCities(countryCode: string): Promise<{ data: City[] | null; error: any }> {
    try {
      const { data, error } = await this.callLiteAPI('getCities', { countryCode });

      if (error) {
        return { data: null, error };
      }

      return { data: data.data || [], error: null };
    } catch (err) {
      console.error('getCities error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Prebook - verify rate availability before booking
   */
  async prebook(rateId: string): Promise<{ data: PrebookResponse | null; error: any }> {
    try {
      const { data, error } = await this.callLiteAPI('prebook', { rateId });

      if (error) {
        return { data: null, error };
      }

      return {
        data: {
          prebookId: data.data?.prebookId,
          rateId: data.data?.rateId,
          status: data.data?.status,
          totalRate: data.data?.totalRate,
          currency: data.data?.currency,
          cancellationPolicy: data.data?.cancellationPolicy,
          priceChanged: data.data?.priceChanged || false,
          newRate: data.data?.newRate
        },
        error: null
      };
    } catch (err) {
      console.error('prebook error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Create hotel booking in our database
   */
  async createHotelBooking(formData: HotelBookingFormData): Promise<{ data: HotelBooking | null; error: any }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated' };
      }

      const bookingData = {
        user_id: user.id,
        hotel_id: formData.selectedHotel?.hotelId,
        hotel_name: formData.selectedHotel?.name,
        hotel_address: formData.selectedHotel?.address,
        hotel_city: formData.selectedHotel?.city,
        hotel_image: formData.selectedHotel?.mainImage || formData.selectedHotel?.images?.[0],
        check_in_date: formData.checkInDate?.toISOString().split('T')[0],
        check_out_date: formData.checkOutDate?.toISOString().split('T')[0],
        room_type: formData.selectedRoom?.roomName || formData.selectedRate?.roomType,
        room_count: formData.rooms,
        guests: formData.adults + formData.children,
        total_price: formData.totalPrice,
        currency: formData.currency || 'USD',
        payment_method: formData.paymentMethod,
        payment_status: 'pending',
        booking_status: 'pending',
        guest_name: `${formData.guestInfo.firstName} ${formData.guestInfo.lastName}`,
        guest_email: formData.guestInfo.email,
        guest_phone: formData.guestInfo.phone,
        special_requests: formData.guestInfo.specialRequests,
        wallet_address: formData.walletAddress
      };

      const { data, error } = await supabase
        .from('hotel_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error('Error creating hotel booking:', error);
        return { data: null, error };
      }

      // Also save to user_requests for notifications
      try {
        await supabase.from('user_requests').insert([{
          user_id: user.id,
          type: 'hotel_booking',
          status: 'pending',
          data: {
            booking_id: data.id,
            hotel_name: bookingData.hotel_name,
            hotel_city: bookingData.hotel_city,
            check_in_date: bookingData.check_in_date,
            check_out_date: bookingData.check_out_date,
            room_type: bookingData.room_type,
            guests: bookingData.guests,
            total_price: bookingData.total_price,
            currency: bookingData.currency,
            guest_email: bookingData.guest_email,
            timestamp: new Date().toISOString()
          }
        }]);
      } catch (reqErr) {
        console.warn('Failed to save to user_requests:', reqErr);
      }

      return { data: this.transformBookingResponse(data), error: null };
    } catch (err) {
      console.error('createHotelBooking error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get user's hotel bookings
   */
  async getUserHotelBookings(userId: string): Promise<{ data: HotelBooking[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('hotel_bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      return {
        data: (data || []).map(this.transformBookingResponse),
        error: null
      };
    } catch (err) {
      console.error('getUserHotelBookings error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get single hotel booking by ID
   */
  async getHotelBooking(id: string): Promise<{ data: HotelBooking | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('hotel_bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data: this.transformBookingResponse(data), error: null };
    } catch (err) {
      console.error('getHotelBooking error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    id: string,
    status: HotelBooking['bookingStatus'],
    paymentStatus?: HotelBooking['paymentStatus']
  ): Promise<{ data: HotelBooking | null; error: any }> {
    try {
      const updateData: any = { booking_status: status };
      if (paymentStatus) updateData.payment_status = paymentStatus;

      const { data, error } = await supabase
        .from('hotel_bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data: this.transformBookingResponse(data), error: null };
    } catch (err) {
      console.error('updateBookingStatus error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Cancel hotel booking
   */
  async cancelBooking(id: string): Promise<{ data: HotelBooking | null; error: any }> {
    return this.updateBookingStatus(id, 'cancelled', 'cancelled');
  }

  /**
   * Validate booking form data
   */
  validateBookingData(formData: HotelBookingFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.selectedHotel) errors.push('Please select a hotel');
    if (!formData.selectedRate) errors.push('Please select a room rate');
    if (!formData.checkInDate) errors.push('Check-in date is required');
    if (!formData.checkOutDate) errors.push('Check-out date is required');
    if (formData.adults < 1) errors.push('At least 1 adult is required');
    if (!formData.guestInfo.firstName?.trim()) errors.push('First name is required');
    if (!formData.guestInfo.lastName?.trim()) errors.push('Last name is required');
    if (!formData.guestInfo.email?.trim()) errors.push('Email is required');
    if (!formData.guestInfo.phone?.trim()) errors.push('Phone number is required');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.guestInfo.email && !emailRegex.test(formData.guestInfo.email)) {
      errors.push('Valid email address is required');
    }

    // Date validation
    if (formData.checkInDate && formData.checkOutDate) {
      if (formData.checkOutDate <= formData.checkInDate) {
        errors.push('Check-out date must be after check-in date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Transform functions
  private transformHotelData(item: any): Hotel {
    return {
      hotelId: item.hotelId || item.id,
      name: item.name || item.hotelName,
      address: item.address || '',
      city: item.city || item.cityName || '',
      country: item.country || item.countryName || '',
      countryCode: item.countryCode || '',
      latitude: item.latitude || 0,
      longitude: item.longitude || 0,
      starRating: item.starRating || item.stars || 0,
      rating: item.rating || item.guestRating,
      reviewCount: item.reviewCount || item.reviews,
      description: item.description,
      images: item.images || (item.mainImage ? [item.mainImage] : []),
      mainImage: item.mainImage || item.images?.[0],
      amenities: item.amenities || item.facilities || [],
      facilities: item.facilities || [],
      checkInTime: item.checkInTime,
      checkOutTime: item.checkOutTime,
      currency: item.currency || 'USD',
      minRate: item.minRate || item.rooms?.[0]?.rates?.[0]?.totalRate
    };
  }

  private transformHotelDetails(item: any): HotelDetails {
    return {
      ...this.transformHotelData(item),
      fullDescription: item.fullDescription || item.description,
      policies: item.policies,
      nearbyAttractions: item.nearbyAttractions,
      contact: item.contact
    };
  }

  private transformRoomsData(rooms: any[]): any[] {
    return rooms.map(room => ({
      roomId: room.roomId || room.id,
      roomName: room.roomName || room.name,
      roomType: room.roomType || room.type,
      description: room.description,
      maxOccupancy: room.maxOccupancy || room.maxGuests || 2,
      bedType: room.bedType,
      size: room.size,
      sizeUnit: room.sizeUnit || 'sqm',
      images: room.images || [],
      amenities: room.amenities || [],
      rates: (room.rates || []).map((rate: any) => ({
        rateId: rate.rateId || rate.id,
        rateName: rate.rateName || rate.name,
        totalRate: rate.totalRate || rate.price,
        currency: rate.currency || 'USD',
        boardType: rate.boardType || rate.mealPlan || 'Room Only',
        cancellation: rate.cancellation || { refundable: false, cancelPolicyInfos: [] },
        roomType: rate.roomType || room.roomType,
        maxOccupancy: rate.maxOccupancy || room.maxOccupancy || 2,
        images: rate.images || room.images || [],
        amenities: rate.amenities || room.amenities || []
      }))
    }));
  }

  private transformBookingResponse(item: any): HotelBooking {
    return {
      id: item.id,
      liteapiBookingId: item.liteapi_booking_id,
      userId: item.user_id,
      hotelId: item.hotel_id,
      hotelName: item.hotel_name,
      hotelAddress: item.hotel_address,
      hotelCity: item.hotel_city,
      hotelImage: item.hotel_image,
      checkInDate: item.check_in_date,
      checkOutDate: item.check_out_date,
      roomType: item.room_type,
      roomCount: item.room_count,
      guests: item.guests,
      totalPrice: item.total_price,
      currency: item.currency,
      paymentMethod: item.payment_method,
      paymentStatus: item.payment_status,
      bookingStatus: item.booking_status,
      guestName: item.guest_name,
      guestEmail: item.guest_email,
      guestPhone: item.guest_phone,
      specialRequests: item.special_requests,
      confirmationCode: item.confirmation_code,
      coingateOrderId: item.coingate_order_id,
      coingatePaymentUrl: item.coingate_payment_url,
      transactionHash: item.transaction_hash,
      walletAddress: item.wallet_address,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }
}

export const hotelService = new HotelService();
