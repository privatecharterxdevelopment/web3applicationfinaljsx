/**
 * NFT Benefits Service
 * 
 * Handles NFT holder benefits:
 * - 10% discount on all bookings
 * - 1 FREE service per NFT (≤$1,500 USD)
 * - Visual indicators (green pulsing border, badge)
 */

import { supabase } from '../lib/supabase';
import { web3Service } from '../lib/web3';

const FREE_SERVICE_LIMIT_USD = 1500;
const NFT_DISCOUNT_PERCENTAGE = 0.10; // 10%

class NFTBenefitsService {
  /**
   * Check if user has NFT
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<{hasNFT: boolean, nfts: Array}>}
   */
  async checkUserNFTs(walletAddress) {
    if (!walletAddress) {
      return { hasNFT: false, nfts: [] };
    }

    try {
      const nfts = await web3Service.getUserNFTs(walletAddress);
      return {
        hasNFT: nfts && nfts.length > 0,
        nfts: nfts || []
      };
    } catch (error) {
      console.error('Error checking NFTs:', error);
      return { hasNFT: false, nfts: [] };
    }
  }

  /**
   * Calculate pricing for service with NFT benefits
   * @param {number} basePrice - Base price from operator (EUR)
   * @param {string} userTier - User subscription tier
   * @param {boolean} hasNFT - Whether user has NFT
   * @returns {Object} Pricing details
   */
  calculatePrice(basePrice, userTier = 'explorer', hasNFT = false) {
    // Commission rates by tier (internal, never shown to user)
    const COMMISSION_RATES = {
      explorer: 0.20,      // 20%
      starter: 0.15,       // 15%
      professional: 0.12,  // 12%
      elite: 0.10,         // 10%
      nft: 0.00            // 0% (NFT holders don't pay commission, just get 10% discount)
    };

    let commission = basePrice * COMMISSION_RATES[userTier];
    let totalBeforeDiscount = basePrice + commission;
    let nftDiscount = 0;

    // Apply NFT 10% discount on FINAL price
    if (hasNFT) {
      nftDiscount = totalBeforeDiscount * NFT_DISCOUNT_PERCENTAGE;
      commission = commission - nftDiscount; // Reduce our commission by discount amount
    }

    const finalPrice = basePrice + commission;

    return {
      basePrice,           // Operator gets this (never shown to user)
      commission,          // We earn this (never shown to user)
      nftDiscount,         // Discount applied (never shown to user)
      finalPrice,          // ONLY this is shown to user
      discountPercentage: hasNFT ? 10 : 0
    };
  }

  /**
   * Check if service is eligible for FREE with NFT
   * @param {number} priceUSD - Service price in USD
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<{eligible: boolean, nftTokenId: string|null, alreadyUsed: boolean}>}
   */
  async checkFreeEligibility(priceUSD, walletAddress) {
    if (!walletAddress) {
      return { eligible: false, nftTokenId: null, alreadyUsed: false };
    }

    // Check if price is within limit
    if (priceUSD > FREE_SERVICE_LIMIT_USD) {
      return { eligible: false, nftTokenId: null, alreadyUsed: false };
    }

    // Check if user has NFTs
    const { hasNFT, nfts } = await this.checkUserNFTs(walletAddress);
    if (!hasNFT) {
      return { eligible: false, nftTokenId: null, alreadyUsed: false };
    }

    // Check which NFTs have unused benefits
    for (const nft of nfts) {
      const alreadyUsed = await this.hasUsedFreeBenefit(walletAddress, nft.tokenId);
      if (!alreadyUsed) {
        return {
          eligible: true,
          nftTokenId: nft.tokenId,
          alreadyUsed: false
        };
      }
    }

    // All NFTs have been used
    return { eligible: false, nftTokenId: null, alreadyUsed: true };
  }

  /**
   * Check if specific NFT has already used its free benefit
   * @param {string} walletAddress - User's wallet address
   * @param {string} nftTokenId - NFT token ID
   * @returns {Promise<boolean>}
   */
  async hasUsedFreeBenefit(walletAddress, nftTokenId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('nft_benefits_used')
        .select('id')
        .eq('user_id', user.id)
        .eq('nft_token_id', nftTokenId)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking NFT benefit usage:', error);
      return false;
    }
  }

  /**
   * Mark NFT benefit as used
   * @param {Object} params - Benefit usage details
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async markBenefitAsUsed({
    walletAddress,
    nftTokenId,
    serviceId,
    serviceType,
    serviceValue,
    serviceName
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('nft_benefits_used')
        .insert([{
          user_id: user.id,
          wallet_address: walletAddress,
          nft_token_id: nftTokenId,
          service_id: serviceId,
          service_type: serviceType,
          service_value: serviceValue,
          service_name: serviceName,
          used_at: new Date().toISOString()
        }]);

      if (error) throw error;

      console.log(`✅ NFT benefit used: ${nftTokenId} for ${serviceName}`);
      return { success: true };
    } catch (error) {
      console.error('Error marking NFT benefit as used:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get service display information with NFT benefits
   * @param {Object} service - Service object
   * @param {string} walletAddress - User's wallet address
   * @param {string} userTier - User subscription tier
   * @returns {Promise<Object>} Display information
   */
  async getServiceDisplayInfo(service, walletAddress, userTier = 'explorer') {
    const basePrice = service.price || service.hourly_rate_eur || service.total_price || 0;
    const { hasNFT } = await this.checkUserNFTs(walletAddress);

    // Calculate pricing
    const pricing = this.calculatePrice(basePrice, userTier, hasNFT);

    // Check if eligible for free
    const priceUSD = pricing.finalPrice * 1.10; // Rough EUR to USD conversion
    const freeEligibility = await this.checkFreeEligibility(priceUSD, walletAddress);

    return {
      ...service,
      displayPrice: pricing.finalPrice,
      originalPrice: null, // Never show original price to user
      hasNFTDiscount: hasNFT && !freeEligibility.eligible,
      isFreeWithNFT: freeEligibility.eligible,
      nftTokenId: freeEligibility.nftTokenId,
      showPulsingBorder: freeEligibility.eligible,
      showNFTBadge: freeEligibility.eligible,
      discountPercentage: pricing.discountPercentage
    };
  }

  /**
   * Get all used NFT benefits for user
   * @returns {Promise<Array>}
   */
  async getUserBenefitsHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('nft_benefits_used')
        .select('*')
        .eq('user_id', user.id)
        .order('used_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching benefits history:', error);
      return [];
    }
  }

  /**
   * Get remaining free benefits for user
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<{total: number, used: number, remaining: number}>}
   */
  async getRemainingFreeBenefits(walletAddress) {
    try {
      const { nfts } = await this.checkUserNFTs(walletAddress);
      const total = nfts.length;

      const usedBenefits = await this.getUserBenefitsHistory();
      const used = usedBenefits.length;

      return {
        total,
        used,
        remaining: Math.max(0, total - used)
      };
    } catch (error) {
      console.error('Error calculating remaining benefits:', error);
      return { total: 0, used: 0, remaining: 0 };
    }
  }
}

export const nftBenefitsService = new NFTBenefitsService();
export default nftBenefitsService;
