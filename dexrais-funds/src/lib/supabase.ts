import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  wallet_address: string;
  username: string | null;
  bio: string | null;
  profile_image_url: string | null;
  twitter_handle: string | null;
  discord_handle: string | null;
  website_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  creator_wallet: string;
  title: string;
  description: string;
  short_description: string | null;
  category: 'defi' | 'nft' | 'gaming' | 'dao' | 'infrastructure' | 'social' | 'other';

  // Images
  logo_image_url: string | null;
  header_image_url: string | null;
  cover_image_url: string | null;

  // Funding
  goal_amount: number;
  raised_amount: number;
  currency: string;

  // Timeline
  duration_days: number;
  start_date: string | null;
  end_date: string | null;

  // Status
  status: 'draft' | 'pending_payment' | 'live' | 'successful' | 'failed' | 'cancelled';

  // Blockchain
  campaign_contract_address: string | null;
  safe_address: string | null;
  launch_fee_paid: boolean;
  launch_fee_tx_hash: string | null;

  // Stats
  backer_count: number;
  view_count: number;

  // Metadata
  tags: string[] | null;
  video_url: string | null;
  whitepaper_url: string | null;
  github_url: string | null;

  // Transparency & Company Information
  company_name: string | null;
  company_description: string | null;
  company_location: string | null;
  company_website: string | null;
  company_registration: string | null;

  // DAO Information
  dao_purpose: string | null;
  dao_governance: string | null;

  // Benefits & Utility
  contributor_benefits: string | null;
  utility_type: 'token' | 'nft' | 'rwa' | 'governance' | 'revenue_share' | null;
  token_details: Record<string, any> | null;
  rwa_details: Record<string, any> | null;

  // Risk & Transparency
  risk_factors: string | null;
  legal_structure: string | null;
  audit_report_url: string | null;

  // Team Information
  team_description: string | null;
  team_linkedin: string | null;

  // Social & Communication
  telegram_url: string | null;
  medium_url: string | null;

  // Use of Funds
  funds_allocation: Record<string, number> | null;

  // Timeline & Roadmap
  roadmap: Record<string, any> | null;

  // Pricing Tier
  pricing_tier: 'starter' | 'pro' | 'enterprise' | 'enterprise_audit' | null;
  transaction_fee_percentage: number;

  // Timestamps
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
  refunded_at: string | null;
}

export interface Transaction {
  id: string;
  campaign_id: string | null;
  wallet_address: string;
  amount: number;
  tx_hash: string;
  block_number: number | null;
  status: 'pending' | 'confirmed' | 'rejected' | 'failed';
  type: 'contribution' | 'refund' | 'withdrawal' | 'launch_fee';
  gas_used: number | null;
  gas_price: number | null;
  created_at: string;
  confirmed_at: string | null;
  error_message: string | null;
}

export interface CampaignUpdate {
  id: string;
  campaign_id: string;
  creator_wallet: string;
  title: string;
  content: string;
  image_url: string | null;
  is_milestone: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  campaign_id: string;
  wallet_address: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  wallet_address: string;
  campaign_id: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  target_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  wallet_address: string;
  campaign_id: string | null;
  type: 'contribution' | 'milestone' | 'update' | 'success' | 'refund' | 'comment';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CampaignTeamMember {
  id: string;
  campaign_id: string;
  wallet_address: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  created_at: string;
}

// Storage helpers
export const uploadCampaignImage = async (
  file: File,
  campaignId: string,
  type: 'logo' | 'header' | 'cover'
) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${campaignId}-${type}-${Date.now()}.${fileExt}`;
  const filePath = `${campaignId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('campaign-images')
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('campaign-images')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const uploadProfileImage = async (file: File, walletAddress: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${walletAddress}-${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const { data, error } = await supabase.storage
    .from('user-profiles')
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('user-profiles')
    .getPublicUrl(filePath);

  return publicUrl;
};
