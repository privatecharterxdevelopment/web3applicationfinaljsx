export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'sales' | 'marketing' | 'accountant';
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  department?: string;
  birthday?: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  type: 'individual' | 'corporate';
  vipStatus: boolean;
  totalBookings: number;
  totalSpent: number;
  createdAt: Date;
  notes?: string;
  address?: {
    street: string;
    city: string;
    country: string;
    zipCode: string;
  };
  address_city?: string;
  address_country?: string;
  status?: string;
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  service: 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
  departure: string;
  arrival: string;
  departureDate: Date;
  returnDate?: Date;
  passengers: number;
  specialRequests?: string;
  createdAt: Date;
  assignedTo?: string;
  paymentStatus?: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'cancelled';
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'paypal' | 'crypto' | 'cash' | 'other';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Report {
  id: string;
  title: string;
  type: 'revenue' | 'bookings' | 'clients' | 'performance';
  dateRange: {
    start: Date;
    end: Date;
  };
  data: any;
  createdBy: string;
  createdAt: Date;
}

export interface Newsletter {
  id: string;
  title: string;
  subject: string;
  content: string;
  templateHtml: string;
  createdBy: string;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  newsletterId: string;
  name: string;
  description?: string;
  scheduledFor?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  createdBy: string;
  totalRecipients: number;
  opens: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}