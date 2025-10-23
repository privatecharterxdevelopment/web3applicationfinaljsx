import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type TokenizationDraft = Database['public']['Tables']['tokenization_drafts']['Row'];
type TokenizationDraftInsert = Database['public']['Tables']['tokenization_drafts']['Insert'];
type TokenizationDraftUpdate = Database['public']['Tables']['tokenization_drafts']['Update'];

export interface TokenizationFormData {
  // Asset Information
  assetName: string;
  assetCategory: string;
  description: string;
  assetValue: string;
  location: string;
  images: any[];
  logo: File | null;
  headerImage: File | null;

  // Token Configuration
  tokenStandard: string;
  totalSupply: string;
  tokenSymbol: string;
  pricePerToken: string;
  minimumInvestment: string;
  expectedAPY: string;
  revenueDistribution: 'monthly' | 'quarterly' | 'annually';
  revenueCurrency: 'USDC' | 'USDT';
  lockupPeriod: string;
  hasSPV: boolean | null;
  spvDetails: string;
  operator: 'owner' | 'third-party' | 'pcx-partners' | '';
  accessRights: string;
  validityPeriod: string;
  isTransferable: boolean;
  isBurnable: boolean;
  managementFee: number;
  issuerWalletAddress: string;

  // Compliance
  jurisdiction: string;

  // Legal Documents
  prospectus: File | null;
  legalOpinion: File | null;
  ownershipProof: File | null;
  insurance: File | null;

  // Smart Contract
  needsAudit: boolean;

  // Payment Package (UTO only)
  membershipPackage?: 'starter' | 'professional' | 'enterprise' | null;
  packageAddons?: {
    customDesign: boolean;
    auditedContract: boolean;
  };
}

/**
 * Calculate package fees based on membership tier
 */
function calculatePackageFees(packageType: 'starter' | 'professional' | 'enterprise') {
  const packages = {
    starter: { setupFee: 2999, monthlyFee: 299 },
    professional: { setupFee: 4999, monthlyFee: 499 },
    enterprise: { setupFee: 7999, monthlyFee: 799 }
  };
  return packages[packageType];
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucket: 'tokenization-images' | 'tokenization-documents',
  userId: string,
  fileType: 'logo' | 'header' | 'document'
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${fileType}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload exception:', error);
    return null;
  }
}

/**
 * Save tokenization draft to database
 */
export async function saveDraft(
  userId: string,
  tokenType: 'utility' | 'security',
  currentStep: number,
  formData: TokenizationFormData,
  draftId?: string
): Promise<{ success: boolean; draftId?: string; error?: string }> {
  try {
    // Upload logo if exists
    let logoUrl = null;
    if (formData.logo) {
      logoUrl = await uploadFile(formData.logo, 'tokenization-images', userId, 'logo');
    }

    // Upload header image if exists
    let headerImageUrl = null;
    if (formData.headerImage) {
      headerImageUrl = await uploadFile(formData.headerImage, 'tokenization-images', userId, 'header');
    }

    const draftData: TokenizationDraftUpdate = {
      user_id: userId,
      token_type: tokenType,
      current_step: currentStep,
      status: 'draft',
      asset_name: formData.assetName || null,
      asset_category: formData.assetCategory || null,
      asset_description: formData.description || null,
      asset_value: formData.assetValue ? parseFloat(formData.assetValue) : null,
      asset_location: formData.location || null,
      logo_url: logoUrl,
      header_image_url: headerImageUrl,
      token_standard: formData.tokenStandard || null,
      total_supply: formData.totalSupply ? parseInt(formData.totalSupply) : null,
      token_symbol: formData.tokenSymbol || null,
      price_per_token: formData.pricePerToken ? parseFloat(formData.pricePerToken) : null,
      minimum_investment: formData.minimumInvestment ? parseFloat(formData.minimumInvestment) : null,
      expected_apy: formData.expectedAPY ? parseFloat(formData.expectedAPY) : null,
      revenue_distribution: formData.revenueDistribution || null,
      revenue_currency: formData.revenueCurrency || null,
      lockup_period: formData.lockupPeriod ? parseInt(formData.lockupPeriod) : null,
      has_spv: formData.hasSPV,
      spv_details: formData.spvDetails || null,
      operator: formData.operator || null,
      management_fee: formData.managementFee || null,
      access_rights: formData.accessRights || null,
      validity_period: formData.validityPeriod || null,
      is_transferable: formData.isTransferable,
      is_burnable: formData.isBurnable,
      jurisdiction: formData.jurisdiction || null,
      needs_audit: formData.needsAudit,
      issuer_wallet_address: formData.issuerWalletAddress || null,
      form_data: formData as any, // Store complete form data as JSON backup
      updated_at: new Date().toISOString()
    };

    // Add payment package data for UTOs
    if (tokenType === 'utility' && formData.membershipPackage) {
      const fees = calculatePackageFees(formData.membershipPackage);
      draftData.membership_package = formData.membershipPackage;
      draftData.package_setup_fee = fees.setupFee;
      draftData.package_monthly_fee = fees.monthlyFee;
      draftData.package_custom_design = formData.packageAddons?.customDesign || false;
      draftData.package_audited_contract = formData.packageAddons?.auditedContract || false;

      // Set payment status based on audit requirement
      if (formData.packageAddons?.auditedContract) {
        draftData.payment_status = 'manual_review'; // Requires manual contact for audit
      } else {
        draftData.payment_status = 'pending'; // Normal payment flow
      }
    }

    if (draftId) {
      // Update existing draft
      const { data, error } = await supabase
        .from('tokenization_drafts')
        .update(draftData)
        .eq('id', draftId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update draft error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, draftId: data.id };
    } else {
      // Create new draft
      const { data, error } = await supabase
        .from('tokenization_drafts')
        .insert(draftData as TokenizationDraftInsert)
        .select()
        .single();

      if (error) {
        console.error('Create draft error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, draftId: data.id };
    }
  } catch (error: any) {
    console.error('Save draft exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load draft by ID
 */
export async function loadDraft(
  draftId: string,
  userId: string
): Promise<{ success: boolean; draft?: TokenizationDraft; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('tokenization_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Load draft error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, draft: data };
  } catch (error: any) {
    console.error('Load draft exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all user drafts
 */
export async function getUserDrafts(
  userId: string
): Promise<{ success: boolean; drafts?: TokenizationDraft[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('tokenization_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get drafts error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, drafts: data || [] };
  } catch (error: any) {
    console.error('Get drafts exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete draft
 */
export async function deleteDraft(
  draftId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('tokenization_drafts')
      .delete()
      .eq('id', draftId)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete draft error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Delete draft exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Submit draft for review
 */
export async function submitDraft(
  draftId: string,
  userId: string,
  signatureData?: {
    termsAccepted: boolean;
    declarationAccepted: boolean;
    signature: {
      message: string;
      signature: string;
      address: string;
      timestamp: string;
    };
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status: 'submitted',
      submitted_at: new Date().toISOString()
    };

    // Add signature data if provided
    if (signatureData) {
      updateData.terms_accepted = signatureData.termsAccepted;
      updateData.wallet_signature = signatureData.signature.signature;
      updateData.signature_timestamp = signatureData.signature.timestamp;
      updateData.signer_address = signatureData.signature.address;
    }

    const { data, error } = await supabase
      .from('tokenization_drafts')
      .update(updateData)
      .eq('id', draftId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Submit draft error:', error);
      return { success: false, error: error.message };
    }

    // Send notification to user about submission
    try {
      const tokenType = data.token_type === 'utility' ? 'UTO' : 'STO';
      const estimatedDays = data.token_type === 'utility' ? '14 days' : '14-30 days';

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'tokenization_submitted',
          title: `${tokenType} Tokenization Request Submitted`,
          message: `Your tokenization request for "${data.asset_name}" has been submitted successfully. Our team will review it within 24-48 hours. Estimated timeline to ${data.token_type === 'utility' ? 'NFT marketplace listing' : 'launch'}: ${estimatedDays}.`,
          metadata: {
            tokenization_id: draftId,
            asset_name: data.asset_name,
            token_type: data.token_type,
            token_symbol: data.token_symbol
          },
          is_read: false
        });
    } catch (notifError) {
      console.error('Failed to send submission notification:', notifError);
      // Don't fail the submission if notification fails
    }

    // Record transaction for transparency
    try {
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          wallet_address: data.signer_address?.toLowerCase(),
          transaction_type: 'tokenization_submission',
          category: 'wallet_signature',
          amount: 0,
          currency: 'USD',
          status: 'completed',
          description: `Submitted ${data.token_type === 'utility' ? 'UTO' : 'STO'} tokenization request: ${data.asset_name}`,
          signature: data.wallet_signature,
          metadata: {
            tokenization_id: draftId,
            asset_name: data.asset_name,
            token_type: data.token_type,
            token_symbol: data.token_symbol,
            token_standard: data.token_standard,
            total_supply: data.total_supply,
            issuer_wallet_address: data.issuer_wallet_address
          }
        });
    } catch (txError) {
      console.error('Failed to record tokenization submission transaction:', txError);
      // Don't fail the submission if transaction recording fails
    }

    return { success: true };
  } catch (error: any) {
    console.error('Submit draft exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Convert draft to form data for loading
 */
export function draftToFormData(draft: TokenizationDraft): Partial<TokenizationFormData> {
  return {
    assetName: draft.asset_name || '',
    assetCategory: draft.asset_category || '',
    description: draft.asset_description || '',
    assetValue: draft.asset_value?.toString() || '',
    location: draft.asset_location || '',
    tokenStandard: draft.token_standard || '',
    totalSupply: draft.total_supply?.toString() || '',
    tokenSymbol: draft.token_symbol || '',
    pricePerToken: draft.price_per_token?.toString() || '',
    minimumInvestment: draft.minimum_investment?.toString() || '',
    expectedAPY: draft.expected_apy?.toString() || '',
    revenueDistribution: draft.revenue_distribution || 'quarterly',
    revenueCurrency: draft.revenue_currency || 'USDC',
    lockupPeriod: draft.lockup_period?.toString() || '',
    hasSPV: draft.has_spv,
    spvDetails: draft.spv_details || '',
    operator: draft.operator || '',
    accessRights: draft.access_rights || '',
    validityPeriod: draft.validity_period || '',
    isTransferable: draft.is_transferable,
    isBurnable: draft.is_burnable,
    managementFee: draft.management_fee || 2,
    jurisdiction: draft.jurisdiction || '',
    needsAudit: draft.needs_audit,
    issuerWalletAddress: draft.issuer_wallet_address || '',
    // Files need to be handled separately
    images: [],
    logo: null,
    headerImage: null,
    prospectus: null,
    legalOpinion: null,
    ownershipProof: null,
    insurance: null,
  };
}
