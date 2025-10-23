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
      tokenization_drafts: {
        Row: {
          id: string
          user_id: string
          token_type: 'utility' | 'security' | null
          current_step: number
          status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
          asset_name: string | null
          asset_category: string | null
          asset_description: string | null
          asset_value: number | null
          asset_location: string | null
          logo_url: string | null
          header_image_url: string | null
          token_standard: string | null
          total_supply: number | null
          token_symbol: string | null
          price_per_token: number | null
          minimum_investment: number | null
          expected_apy: number | null
          revenue_distribution: 'monthly' | 'quarterly' | 'annually' | null
          revenue_currency: 'USDC' | 'USDT' | null
          lockup_period: number | null
          has_spv: boolean | null
          spv_details: string | null
          operator: 'owner' | 'third-party' | 'pcx-partners' | null
          management_fee: number | null
          access_rights: string | null
          validity_period: string | null
          is_transferable: boolean
          is_burnable: boolean
          jurisdiction: string | null
          needs_audit: boolean
          prospectus_document_id: string | null
          legal_opinion_document_id: string | null
          ownership_proof_document_id: string | null
          insurance_document_id: string | null
          form_data: Json | null
          terms_accepted: boolean
          wallet_signature: string | null
          signature_timestamp: string | null
          signer_address: string | null
          issuer_wallet_address: string | null
          approved_at: string | null
          waitlist_opens_at: string | null
          marketplace_launch_at: string | null
          estimated_launch_days: number | null
          membership_package: 'starter' | 'professional' | 'enterprise' | null
          package_setup_fee: number | null
          package_monthly_fee: number | null
          package_custom_design: boolean
          package_audited_contract: boolean
          payment_method: 'stripe' | 'crypto' | null
          payment_status: 'pending' | 'completed' | 'failed' | 'manual_review'
          payment_intent_id: string | null
          coingate_order_id: string | null
          created_at: string
          updated_at: string
          submitted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token_type?: 'utility' | 'security' | null
          current_step?: number
          status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
          asset_name?: string | null
          asset_category?: string | null
          asset_description?: string | null
          asset_value?: number | null
          asset_location?: string | null
          logo_url?: string | null
          header_image_url?: string | null
          token_standard?: string | null
          total_supply?: number | null
          token_symbol?: string | null
          price_per_token?: number | null
          minimum_investment?: number | null
          expected_apy?: number | null
          revenue_distribution?: 'monthly' | 'quarterly' | 'annually' | null
          revenue_currency?: 'USDC' | 'USDT' | null
          lockup_period?: number | null
          has_spv?: boolean | null
          spv_details?: string | null
          operator?: 'owner' | 'third-party' | 'pcx-partners' | null
          management_fee?: number | null
          access_rights?: string | null
          validity_period?: string | null
          is_transferable?: boolean
          is_burnable?: boolean
          jurisdiction?: string | null
          needs_audit?: boolean
          prospectus_document_id?: string | null
          legal_opinion_document_id?: string | null
          ownership_proof_document_id?: string | null
          insurance_document_id?: string | null
          form_data?: Json | null
          terms_accepted?: boolean
          wallet_signature?: string | null
          signature_timestamp?: string | null
          signer_address?: string | null
          issuer_wallet_address?: string | null
          approved_at?: string | null
          waitlist_opens_at?: string | null
          marketplace_launch_at?: string | null
          estimated_launch_days?: number | null
          membership_package?: 'starter' | 'professional' | 'enterprise' | null
          package_setup_fee?: number | null
          package_monthly_fee?: number | null
          package_custom_design?: boolean
          package_audited_contract?: boolean
          payment_method?: 'stripe' | 'crypto' | null
          payment_status?: 'pending' | 'completed' | 'failed' | 'manual_review'
          payment_intent_id?: string | null
          coingate_order_id?: string | null
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          token_type?: 'utility' | 'security' | null
          current_step?: number
          status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
          asset_name?: string | null
          asset_category?: string | null
          asset_description?: string | null
          asset_value?: number | null
          asset_location?: string | null
          logo_url?: string | null
          header_image_url?: string | null
          token_standard?: string | null
          total_supply?: number | null
          token_symbol?: string | null
          price_per_token?: number | null
          minimum_investment?: number | null
          expected_apy?: number | null
          revenue_distribution?: 'monthly' | 'quarterly' | 'annually' | null
          revenue_currency?: 'USDC' | 'USDT' | null
          lockup_period?: number | null
          has_spv?: boolean | null
          spv_details?: string | null
          operator?: 'owner' | 'third-party' | 'pcx-partners' | null
          management_fee?: number | null
          access_rights?: string | null
          validity_period?: string | null
          is_transferable?: boolean
          is_burnable?: boolean
          jurisdiction?: string | null
          needs_audit?: boolean
          prospectus_document_id?: string | null
          legal_opinion_document_id?: string | null
          ownership_proof_document_id?: string | null
          insurance_document_id?: string | null
          form_data?: Json | null
          terms_accepted?: boolean
          wallet_signature?: string | null
          signature_timestamp?: string | null
          signer_address?: string | null
          issuer_wallet_address?: string | null
          approved_at?: string | null
          waitlist_opens_at?: string | null
          marketplace_launch_at?: string | null
          estimated_launch_days?: number | null
          membership_package?: 'starter' | 'professional' | 'enterprise' | null
          package_setup_fee?: number | null
          package_monthly_fee?: number | null
          package_custom_design?: boolean
          package_audited_contract?: boolean
          payment_method?: 'stripe' | 'crypto' | null
          payment_status?: 'pending' | 'completed' | 'failed' | 'manual_review'
          payment_intent_id?: string | null
          coingate_order_id?: string | null
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
        }
      }
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
      transactions: {
        Row: {
          id: string
          user_id: string | null
          wallet_address: string | null
          transaction_type: string
          category: 'wallet_signature' | 'fiat_payment' | 'crypto_payment' | 'platform_action'
          amount: number
          currency: string
          status: string
          description: string | null
          signature: string | null
          tx_hash: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          wallet_address?: string | null
          transaction_type: string
          category?: 'wallet_signature' | 'fiat_payment' | 'crypto_payment' | 'platform_action'
          amount?: number
          currency?: string
          status?: string
          description?: string | null
          signature?: string | null
          tx_hash?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          wallet_address?: string | null
          transaction_type?: string
          category?: 'wallet_signature' | 'fiat_payment' | 'crypto_payment' | 'platform_action'
          amount?: number
          currency?: string
          status?: string
          description?: string | null
          signature?: string | null
          tx_hash?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
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