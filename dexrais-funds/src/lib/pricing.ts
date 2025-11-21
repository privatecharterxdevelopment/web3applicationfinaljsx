export type PricingTier = 'starter' | 'pro' | 'enterprise' | 'enterprise_audit';

export interface TierDetails {
  tier: PricingTier;
  name: string;
  priceChf: number;
  priceUsdc: number;
  transactionFee: number;
  maxFundraise: number | null;
  features: {
    milestones: number;
    featuredDays: number;
    dashboard: 'basic' | 'advanced';
    customToken?: boolean;
    newsletter?: boolean;
    priority?: boolean;
    audit?: boolean;
  };
}

// CHF to USDC conversion rate (update weekly)
export const CHF_TO_USDC_RATE = 1.10;

export const PRICING_TIERS: Record<PricingTier, TierDetails> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    priceChf: 250,
    priceUsdc: 275, // 250 * 1.10
    transactionFee: 2.5,
    maxFundraise: 50000,
    features: {
      milestones: 3,
      featuredDays: 0,
      dashboard: 'basic',
    },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    priceChf: 500,
    priceUsdc: 550, // 500 * 1.10
    transactionFee: 1.5,
    maxFundraise: 250000,
    features: {
      milestones: -1, // unlimited
      featuredDays: 7,
      dashboard: 'advanced',
      customToken: true,
    },
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    priceChf: 2000,
    priceUsdc: 2200, // 2000 * 1.10
    transactionFee: 1.0,
    maxFundraise: null, // unlimited
    features: {
      milestones: -1,
      featuredDays: 30,
      dashboard: 'advanced',
      customToken: true,
      newsletter: true,
      priority: true,
    },
  },
  enterprise_audit: {
    tier: 'enterprise_audit',
    name: 'Enterprise + Audit',
    priceChf: 15000,
    priceUsdc: 16500, // 15000 * 1.10
    transactionFee: 1.0,
    maxFundraise: null,
    features: {
      milestones: -1,
      featuredDays: 30,
      dashboard: 'advanced',
      customToken: true,
      newsletter: true,
      priority: true,
      audit: true,
    },
  },
};

export function getTierDetails(tier: PricingTier): TierDetails {
  return PRICING_TIERS[tier];
}

export function formatPrice(chf: number): string {
  return `CHF ${chf.toLocaleString()}`;
}

export function formatFee(percentage: number): string {
  return `${percentage}%`;
}
