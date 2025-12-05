// Hotel booking types for LiteAPI integration

export interface HotelSearchParams {
  cityCode?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  placeId?: string;
  iataCode?: string;
  hotelIds?: string[];
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children?: number;
  rooms?: number;
  currency?: string;
  guestNationality?: string;
  starRating?: number[];
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface HotelOccupancy {
  adults: number;
  children?: number;
  childrenAges?: number[];
}

export interface HotelRate {
  rateId: string;
  rateName: string;
  totalRate: number;
  currency: string;
  boardType: string; // 'Room Only', 'Breakfast', 'Half Board', 'Full Board', 'All Inclusive'
  cancellation: {
    cancelPolicyInfos: Array<{
      cancelTime: string;
      amount: number;
      currency: string;
      type: string;
    }>;
    refundable: boolean;
  };
  roomType: string;
  maxOccupancy: number;
  images?: string[];
  amenities?: string[];
}

export interface HotelRoom {
  roomId: string;
  roomName: string;
  roomType: string;
  description?: string;
  maxOccupancy: number;
  bedType?: string;
  size?: number;
  sizeUnit?: string;
  images?: string[];
  amenities?: string[];
  rates: HotelRate[];
}

export interface Hotel {
  hotelId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  starRating: number;
  rating?: number; // Guest rating
  reviewCount?: number;
  description?: string;
  images: string[];
  mainImage?: string;
  amenities: string[];
  facilities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  currency: string;
  minRate?: number;
  rooms?: HotelRoom[];
}

export interface HotelSearchResult {
  hotel: Hotel;
  rooms: HotelRoom[];
  totalRate: number;
  currency: string;
}

export interface HotelDetails extends Hotel {
  fullDescription?: string;
  policies?: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
    children: string;
    pets: string;
  };
  nearbyAttractions?: Array<{
    name: string;
    distance: string;
  }>;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface HotelReview {
  reviewId: string;
  rating: number;
  title?: string;
  comment: string;
  author: string;
  date: string;
  pros?: string;
  cons?: string;
}

export interface PrebookResponse {
  prebookId: string;
  rateId: string;
  status: string;
  totalRate: number;
  currency: string;
  cancellationPolicy: any;
  priceChanged: boolean;
  newRate?: number;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country?: string;
  specialRequests?: string;
}

export interface HotelBookingRequest {
  prebookId: string;
  guestInfo: GuestInfo;
  roomCount: number;
  totalPrice: number;
  currency: string;
  paymentMethod: 'bank' | 'card' | 'crypto';
  walletAddress?: string;
}

export interface HotelBooking {
  id: string;
  liteapiBookingId?: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  hotelAddress: string;
  hotelCity: string;
  hotelImage?: string;
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  roomCount: number;
  guests: number;
  totalPrice: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'confirming' | 'paid' | 'expired' | 'cancelled' | 'failed';
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  confirmationCode?: string;
  coingateOrderId?: string;
  coingatePaymentUrl?: string;
  transactionHash?: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelBookingFormData {
  // Search criteria
  destination: string;
  destinationType: 'city' | 'coordinates' | 'iata';
  cityCode?: string;
  latitude?: number;
  longitude?: number;
  iataCode?: string;

  // Dates
  checkInDate: Date | null;
  checkOutDate: Date | null;

  // Occupancy
  adults: number;
  children: number;
  rooms: number;

  // Selected hotel & room
  selectedHotel: Hotel | null;
  selectedRoom: HotelRoom | null;
  selectedRate: HotelRate | null;

  // Guest info
  guestInfo: GuestInfo;

  // Payment
  totalPrice: number;
  currency: string;
  paymentMethod: 'bank' | 'card' | 'crypto';
  walletAddress?: string;
}

// City data from LiteAPI
export interface City {
  cityCode: string;
  cityName: string;
  countryCode: string;
  countryName: string;
}
