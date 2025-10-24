// Booking request data types
export interface BookingRequest {
  id?: string;
  
  // Flight Route
  origin_airport_code: string;
  destination_airport_code: string;
  
  // Flight Details
  departure_date: string; // ISO date format
  departure_time: string; // HH:MM format
  passengers: number;
  luggage: number;
  pets: number;
  
  // Aircraft Selection
  selected_jet_category: string;
  
  // Services Selection
  aviation_services: string[]; // Array of service IDs
  luxury_services: string[]; // Array of service IDs
  
  // Carbon Offset
  carbon_option: 'none' | 'full';
  carbon_nft_wallet?: string;
  
  // Pricing
  total_price: number;
  currency: string;
  payment_method: 'bank' | 'card' | 'crypto';
  
  // Contact Information
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_company?: string;
  
  // Web3 Integration
  wallet_address?: string;
  nft_discount_applied: boolean;
  
  // Metadata
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface BookingFormData {
  // Derived from component state
  origin: any; // AirportSearchResult
  destination: any; // AirportSearchResult
  departureDate: Date | null;
  departureTime: string;
  passengers: number;
  luggage: number;
  pets: number;
  selectedJet: any; // Jet category object
  selectedAviationServices: string[];
  selectedLuxuryServices: string[];
  carbonOption: string;
  walletAddress: string;
  selectedPayment: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  totalPrice: number;
  discountPercent: number;
}