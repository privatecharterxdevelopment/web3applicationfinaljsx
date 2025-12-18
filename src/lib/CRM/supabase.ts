// Re-export supabase client from main lib - uses the same Privatecharterx-web-DEV database
export { supabase } from '../supabase';

// Database types for CRM
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          type: 'individual' | 'corporate';
          vip_status: boolean | null;
          total_bookings: number | null;
          total_spent: number | null;
          notes: string | null;
          address_street: string | null;
          address_city: string | null;
          address_country: string | null;
          address_zip_code: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          type?: 'individual' | 'corporate';
          vip_status?: boolean | null;
          total_bookings?: number | null;
          total_spent?: number | null;
          notes?: string | null;
          address_street?: string | null;
          address_city?: string | null;
          address_country?: string | null;
          address_zip_code?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          type?: 'individual' | 'corporate';
          vip_status?: boolean | null;
          total_bookings?: number | null;
          total_spent?: number | null;
          notes?: string | null;
          address_street?: string | null;
          address_city?: string | null;
          address_country?: string | null;
          address_zip_code?: string | null;
        };
      };
      system_users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'employee' | 'sales';
          department: string | null;
          phone: string | null;
          hire_date: string | null;
          is_active: boolean | null;
          last_login: string | null;
          total_sales: number | null;
          avatar_url: string | null;
          birthday: string | null;
          address_city: string | null;
          address_country: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'employee' | 'sales';
          department?: string | null;
          phone?: string | null;
          hire_date?: string | null;
          is_active?: boolean | null;
          last_login?: string | null;
          total_sales?: number | null;
          avatar_url?: string | null;
          birthday?: string | null;
          address_city?: string | null;
          address_country?: string | null;
        };
        Update: {
          email?: string;
          name?: string;
          role?: 'admin' | 'employee' | 'sales';
          department?: string | null;
          phone?: string | null;
          hire_date?: string | null;
          is_active?: boolean | null;
          last_login?: string | null;
          total_sales?: number | null;
          avatar_url?: string | null;
          birthday?: string | null;
          address_city?: string | null;
          address_country?: string | null;
          updated_at?: string;
        };
      };
      user_activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          details: any | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          details?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          user_id?: string | null;
          action?: string;
          details?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
      booking_history: {
        Row: {
          id: string;
          booking_id: string;
          changed_by: string | null;
          action: string;
          old_status: string | null;
          new_status: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          changed_by?: string | null;
          action: string;
          old_status?: string | null;
          new_status?: string | null;
          notes?: string | null;
        };
        Update: {
          booking_id?: string;
          changed_by?: string | null;
          action?: string;
          old_status?: string | null;
          new_status?: string | null;
          notes?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          data: any | null;
          is_read: boolean | null;
          created_at: string | null;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          data?: any | null;
          is_read?: boolean | null;
          read_at?: string | null;
        };
        Update: {
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          data?: any | null;
          is_read?: boolean | null;
          read_at?: string | null;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_date: string;
          end_date: string;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          event_type: string;
          created_by: string;
          attendees: string[] | null;
          is_all_day: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          client_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          event_type: string;
          created_by: string;
          attendees?: string[] | null;
          is_all_day?: boolean | null;
          client_id?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          event_type?: string;
          created_by?: string;
          attendees?: string[] | null;
          is_all_day?: boolean | null;
          client_id?: string | null;
        };
      };
      sales_deals: {
        Row: {
          id: string;
          sales_user_id: string | null;
          partner_id: string | null;
          deal_amount: number;
          deal_date: string;
          commission_rate: number | null;
          commission_amount: number | null;
          notes: string | null;
          status: 'pending' | 'closed' | 'cancelled';
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          sales_user_id?: string | null;
          partner_id?: string | null;
          deal_amount?: number;
          deal_date?: string;
          commission_rate?: number | null;
          commission_amount?: number | null;
          notes?: string | null;
          status?: 'pending' | 'closed' | 'cancelled';
        };
        Update: {
          sales_user_id?: string | null;
          partner_id?: string | null;
          deal_amount?: number;
          deal_date?: string;
          commission_rate?: number | null;
          commission_amount?: number | null;
          notes?: string | null;
          status?: 'pending' | 'closed' | 'cancelled';
        };
      };
      partners: {
        Row: {
          id: string;
          user_id: string | null;
          company_name: string;
          contact_name: string;
          email: string;
          phone: string | null;
          website: string | null;
          business_type: string;
          tier_id: string | null;
          status: 'pending' | 'active' | 'inactive' | 'expired';
          payment_id: string | null;
          paid_amount: number | null;
          payment_date: string | null;
          expiry_date: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          company_name: string;
          contact_name: string;
          email: string;
          phone?: string | null;
          website?: string | null;
          business_type: string;
          tier_id?: string | null;
          status?: 'pending' | 'active' | 'inactive' | 'expired';
          payment_id?: string | null;
          paid_amount?: number | null;
          payment_date?: string | null;
          expiry_date?: string | null;
          created_by?: string | null;
        };
        Update: {
          user_id?: string | null;
          company_name?: string;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          website?: string | null;
          business_type?: string;
          tier_id?: string | null;
          status?: 'pending' | 'active' | 'inactive' | 'expired';
          payment_id?: string | null;
          paid_amount?: number | null;
          payment_date?: string | null;
          expiry_date?: string | null;
          created_by?: string | null;
        };
      };
      employee_bookings: {
        Row: {
          id: string;
          booking_number: string;
          employee_id: string | null;
          client_name: string;
          client_email: string;
          client_phone: string | null;
          service_type: 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg';
          departure: string;
          arrival: string;
          departure_date: string;
          departure_time: string | null;
          return_date: string | null;
          return_time: string | null;
          passengers: number;
          aircraft_preference: string | null;
          special_requests: string | null;
          estimated_budget: number | null;
          currency: string | null;
          status: 'pending' | 'assigned' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';
          priority: 'low' | 'normal' | 'high' | 'urgent' | null;
          assigned_to: string | null;
          assigned_at: string | null;
          closed_by: string | null;
          closed_at: string | null;
          final_amount: number | null;
          commission_rate: number | null;
          commission_amount: number | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          booking_number?: string;
          employee_id?: string | null;
          client_name: string;
          client_email: string;
          client_phone?: string | null;
          service_type?: 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg';
          departure: string;
          arrival: string;
          departure_date: string;
          departure_time?: string | null;
          return_date?: string | null;
          return_time?: string | null;
          passengers?: number;
          aircraft_preference?: string | null;
          special_requests?: string | null;
          estimated_budget?: number | null;
          currency?: string | null;
          status?: 'pending' | 'assigned' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';
          priority?: 'low' | 'normal' | 'high' | 'urgent' | null;
          assigned_to?: string | null;
          assigned_at?: string | null;
          closed_by?: string | null;
          closed_at?: string | null;
          final_amount?: number | null;
          commission_rate?: number | null;
          commission_amount?: number | null;
          notes?: string | null;
        };
        Update: {
          booking_number?: string;
          employee_id?: string | null;
          client_name?: string;
          client_email?: string;
          client_phone?: string | null;
          service_type?: 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg';
          departure?: string;
          arrival?: string;
          departure_date?: string;
          departure_time?: string | null;
          return_date?: string | null;
          return_time?: string | null;
          passengers?: number;
          aircraft_preference?: string | null;
          special_requests?: string | null;
          estimated_budget?: number | null;
          currency?: string | null;
          status?: 'pending' | 'assigned' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';
          priority?: 'low' | 'normal' | 'high' | 'urgent' | null;
          assigned_to?: string | null;
          assigned_at?: string | null;
          closed_by?: string | null;
          closed_at?: string | null;
          final_amount?: number | null;
          commission_rate?: number | null;
          commission_amount?: number | null;
          notes?: string | null;
        };
      };
      user_requests: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          data: any;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          admin_notes: string | null;
          admin_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          data?: any;
          admin_notes?: string | null;
          admin_id?: string | null;
        };
        Update: {
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          data?: any;
          admin_notes?: string | null;
          admin_id?: string | null;
          completed_at?: string | null;
        };
      };
    };
  };
}
