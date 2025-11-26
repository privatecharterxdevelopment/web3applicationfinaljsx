/**
 * Fee Calculator for FlexibleEscrow
 * Progressive fee structure based on escrow amount
 */

export interface FeeInfo {
  fee: number;           // Fee amount in ETH
  percentage: string;    // Percentage as string (e.g., "2.0%")
  tier: string;          // Tier name
  tierBps: number;       // Basis points (200 = 2.0%, 150 = 1.5%)
  sellerAmount: number;  // Amount seller receives (amount - fee)
  totalRequired: number; // Total user must deposit (amount)
}

// Fee tiers matching smart contract
export const FEE_TIER_1 = 200;  // 2.0% in basis points
export const FEE_TIER_2 = 150;  // 1.5% in basis points
export const FEE_DENOMINATOR = 10000;

// Tier thresholds (in ETH)
export const TIER_1_MAX_ETH = 1_000_000;      // $1M equivalent
export const TIER_2_MAX_ETH = 100_000_000;    // $100M equivalent

// Tier labels
export const TIER_LABELS = {
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise'
};

/**
 * Calculate fee for escrow amount (progressive tiers)
 * @param amount Escrow amount in ETH (excluding fee)
 * @returns FeeInfo object with all fee details
 */
export function calculateCustomEscrowFee(amount: number): FeeInfo {
  if (amount <= 0) {
    return {
      fee: 0,
      percentage: '0%',
      tier: 'Invalid',
      tierBps: 0,
      sellerAmount: 0,
      totalRequired: 0
    };
  }

  let fee: number;
  let percentage: string;
  let tier: string;
  let tierBps: number;

  if (amount <= TIER_1_MAX_ETH) {
    // Tier 1: 0 - $1M → 2.0% fee
    tierBps = FEE_TIER_1;
    fee = (amount * tierBps) / FEE_DENOMINATOR;
    percentage = '2.0%';
    tier = TIER_LABELS.STANDARD;
  } else if (amount <= TIER_2_MAX_ETH) {
    // Tier 2: $1M - $100M → 1.5% fee
    tierBps = FEE_TIER_2;
    fee = (amount * tierBps) / FEE_DENOMINATOR;
    percentage = '1.5%';
    tier = TIER_LABELS.PREMIUM;
  } else {
    // Tier 3: > $100M → Custom pricing
    return {
      fee: 0,
      percentage: 'Custom',
      tier: TIER_LABELS.ENTERPRISE,
      tierBps: 0,
      sellerAmount: amount,
      totalRequired: amount
    };
  }

  return {
    fee,
    percentage,
    tier,
    tierBps,
    sellerAmount: amount - fee,
    totalRequired: amount
  };
}

/**
 * Calculate total required deposit (amount to lock in escrow)
 * User deposits totalRequired, seller gets sellerAmount, platform gets fee
 *
 * @param desiredSellerAmount Amount seller should receive (after fees)
 * @returns FeeInfo with totalRequired calculated
 */
export function calculateTotalRequired(desiredSellerAmount: number): FeeInfo {
  if (desiredSellerAmount <= 0) {
    return {
      fee: 0,
      percentage: '0%',
      tier: 'Invalid',
      tierBps: 0,
      sellerAmount: 0,
      totalRequired: 0
    };
  }

  let tierBps: number;
  let percentage: string;
  let tier: string;

  // Determine tier
  if (desiredSellerAmount <= TIER_1_MAX_ETH) {
    tierBps = FEE_TIER_1;
    percentage = '2.0%';
    tier = TIER_LABELS.STANDARD;
  } else if (desiredSellerAmount <= TIER_2_MAX_ETH) {
    tierBps = FEE_TIER_2;
    percentage = '1.5%';
    tier = TIER_LABELS.PREMIUM;
  } else {
    return {
      fee: 0,
      percentage: 'Custom',
      tier: TIER_LABELS.ENTERPRISE,
      tierBps: 0,
      sellerAmount: desiredSellerAmount,
      totalRequired: desiredSellerAmount
    };
  }

  // Calculate: desiredSellerAmount = totalRequired - (totalRequired * tierBps / 10000)
  // Solving for totalRequired:
  // totalRequired = desiredSellerAmount / (1 - tierBps / 10000)
  const multiplier = 1 - (tierBps / FEE_DENOMINATOR);
  const totalRequired = desiredSellerAmount / multiplier;
  const fee = totalRequired - desiredSellerAmount;

  return {
    fee,
    percentage,
    tier,
    tierBps,
    sellerAmount: desiredSellerAmount,
    totalRequired
  };
}

/**
 * Get tier info for display (without calculating)
 * @param amount Amount in ETH
 * @returns Tier information
 */
export function getTierInfo(amount: number): {
  tier: string;
  percentage: string;
  bps: number;
  min: number;
  max: number | null;
} {
  if (amount <= TIER_1_MAX_ETH) {
    return {
      tier: TIER_LABELS.STANDARD,
      percentage: '2.0%',
      bps: FEE_TIER_1,
      min: 0,
      max: TIER_1_MAX_ETH
    };
  } else if (amount <= TIER_2_MAX_ETH) {
    return {
      tier: TIER_LABELS.PREMIUM,
      percentage: '1.5%',
      bps: FEE_TIER_2,
      min: TIER_1_MAX_ETH,
      max: TIER_2_MAX_ETH
    };
  } else {
    return {
      tier: TIER_LABELS.ENTERPRISE,
      percentage: 'Custom',
      bps: 0,
      min: TIER_2_MAX_ETH,
      max: null
    };
  }
}

/**
 * Format fee info for display
 * @param feeInfo FeeInfo object
 * @returns Formatted strings for UI
 */
export function formatFeeInfo(feeInfo: FeeInfo): {
  feeDisplay: string;
  percentageDisplay: string;
  tierDisplay: string;
  sellerDisplay: string;
  totalDisplay: string;
} {
  return {
    feeDisplay: `${feeInfo.fee.toFixed(4)} ETH`,
    percentageDisplay: feeInfo.percentage,
    tierDisplay: `${feeInfo.tier} Tier`,
    sellerDisplay: `${feeInfo.sellerAmount.toFixed(4)} ETH`,
    totalDisplay: `${feeInfo.totalRequired.toFixed(4)} ETH`
  };
}

/**
 * Convert ETH to USD (requires ETH price)
 * @param ethAmount Amount in ETH
 * @param ethPrice ETH price in USD
 * @returns USD amount
 */
export function ethToUsd(ethAmount: number, ethPrice: number): number {
  return ethAmount * ethPrice;
}

/**
 * Convert USD to ETH (requires ETH price)
 * @param usdAmount Amount in USD
 * @param ethPrice ETH price in USD
 * @returns ETH amount
 */
export function usdToEth(usdAmount: number, ethPrice: number): number {
  return usdAmount / ethPrice;
}

/**
 * Get all tier breakdowns (for UI display)
 * @returns Array of tier information
 */
export function getAllTiers(): Array<{
  name: string;
  percentage: string;
  min: string;
  max: string;
  description: string;
}> {
  return [
    {
      name: TIER_LABELS.STANDARD,
      percentage: '2.0%',
      min: '0',
      max: '1M ETH',
      description: 'For escrows up to $1M equivalent'
    },
    {
      name: TIER_LABELS.PREMIUM,
      percentage: '1.5%',
      min: '1M ETH',
      max: '100M ETH',
      description: 'For escrows $1M - $100M equivalent'
    },
    {
      name: TIER_LABELS.ENTERPRISE,
      percentage: 'Custom',
      min: '100M ETH',
      max: 'Unlimited',
      description: 'Contact admin for custom pricing'
    }
  ];
}

/**
 * Example calculations for testing
 */
export const EXAMPLE_CALCULATIONS = {
  small: calculateCustomEscrowFee(1), // 1 ETH → 2.0% fee
  medium: calculateCustomEscrowFee(10_000), // 10k ETH → 2.0% fee
  large: calculateCustomEscrowFee(5_000_000), // 5M ETH → 1.5% fee
  enterprise: calculateCustomEscrowFee(150_000_000) // 150M ETH → Custom
};
