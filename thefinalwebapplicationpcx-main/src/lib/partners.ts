import { supabase } from './supabase';
import { logger } from '../utils/logger';

export interface PartnerApplication {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  businessType: string;
  referralCode?: string;
  message?: string;
}

export interface MembershipTier {
  id: string;
  name: string;
  price: number;
  description: string;
}

export const submitPartnerApplication = async (application: PartnerApplication, userId?: string) => {
  try {
    const { data, error } = await supabase
      .from('partner_applications')
      .insert([{
        company_name: application.companyName,
        contact_name: application.contactName,
        email: application.email,
        phone: application.phone,
        website: application.website,
        business_type: application.businessType,
        referral_code: application.referralCode,
        message: application.message,
        user_id: userId
      }])
      .select();

    if (error) throw error;
    
    // Send notification email (in a real implementation)
    logger.info('Partner application submitted:', data);
    
    return { success: true, data };
  } catch (error) {
    logger.error('Error submitting partner application:', error);
    return { success: false, error };
  }
};

export const validateReferralCode = async (code: string) => {
  try {
    // Check if code matches a partner's email or company name
    const { data, error } = await supabase
      .from('partners')
      .select('id, company_name, email')
      .or(`email.eq.${code},company_name.eq.${code}`)
      .single();

    if (error) {
      // For demo purposes, accept codes longer than 3 characters
      if (code.length > 3) {
        return { valid: true, discount: 0.1 }; // 10% discount
      }
      return { valid: false };
    }

    return { valid: true, discount: 0.1, referrerId: data.id };
  } catch (error) {
    logger.error('Error validating referral code:', error);
    return { valid: false };
  }
};

export const createPartnerCheckout = async (
  tierId: string,
  tierName: string,
  price: number,
  referralCode?: string
) => {
  try {
    const response = await fetch('/.netlify/functions/create-partner-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tierId,
        tierName,
        price,
        currency: 'EUR',
        referralCode
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout');
    }

    return data;
  } catch (error) {
    logger.error('Error creating partner checkout:', error);
    throw error;
  }
};

export const processPartnerPayment = async (
  paymentIntentId: string,
  partnerId: string,
  email: string
) => {
  try {
    const response = await fetch('/.netlify/functions/process-partner-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        partnerId,
        email
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to process payment');
    }

    return data;
  } catch (error) {
    logger.error('Error processing partner payment:', error);
    throw error;
  }
};