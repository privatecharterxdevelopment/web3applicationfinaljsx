export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_documents: {
        Row: {
          id: string
          user_id: string
          document_type: string
          file_path: string | null
          status: string
          admin_notes: string | null
          created_at: string
          updated_at: string
          approved_at: string | null
          approved_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          document_type: string
          file_path?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: string
          file_path?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
        }
      }
      user_requests: {
        Row: {
          id: string
          user_id: string
          type: string
          status: string
          data: Json
          created_at: string
          updated_at: string
          completed_at: string | null
          admin_notes: string | null
          admin_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          status?: string
          data?: Json
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          admin_notes?: string | null
          admin_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          status?: string
          data?: Json
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          admin_notes?: string | null
          admin_id?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
          last_login: string | null
          is_admin: boolean
          email_verified: boolean
          user_role: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
          is_admin?: boolean
          email_verified?: boolean
          user_role?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
          is_admin?: boolean
          email_verified?: boolean
          user_role?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          phone: string | null
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}