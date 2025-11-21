import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Campaign {
  id: string;
  creator_wallet: string;
  title: string;
  description: string;
  category: 'defi' | 'nft' | 'gaming' | 'dao' | 'infrastructure' | 'other';
  header_image_url: string | null;
  cover_image_url: string | null;
  goal_amount: number;
  raised_amount: number;
  currency: string;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  status: 'draft' | 'pending_payment' | 'live' | 'successful' | 'failed' | 'cancelled';
  campaign_contract_address: string | null;
  safe_address: string | null;
  launch_fee_paid: boolean;
  launch_fee_tx_hash: string | null;
  backer_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Backer {
  id: string;
  campaign_id: string;
  wallet_address: string;
  amount: number;
  currency: string;
  tx_hash: string;
  block_number: number | null;
  status: 'pending' | 'confirmed' | 'refunded';
  contributed_at: string;
}

export interface Transaction {
  id: string;
  campaign_id: string;
  wallet_address: string;
  amount: number;
  tx_hash: string;
  block_number: number | null;
  status: 'pending' | 'confirmed' | 'rejected';
  type: 'contribution' | 'refund' | 'withdrawal';
  created_at: string;
  confirmed_at: string | null;
}

export interface CampaignUpdate {
  id: string;
  campaign_id: string;
  creator_wallet: string;
  title: string;
  content: string;
  created_at: string;
}
