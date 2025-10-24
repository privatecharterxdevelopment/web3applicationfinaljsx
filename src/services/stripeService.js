/**
 * Stripe Service
 * 
 * Handles all Stripe-related operations:
 * - Subscription management
 * - Checkout sessions
 * - Customer portal
 * - Webhook handling
 */

import { supabase } from '../lib/supabase';

// Stripe product IDs (set these after creating products in Stripe Dashboard)
const STRIPE_PRODUCTS = {
  starter_monthly: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID,
  starter_annual: import.meta.env.VITE_STRIPE_STARTER_ANNUAL_PRICE_ID,
  professional_monthly: import.meta.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
  professional_annual: import.meta.env.VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
  elite_monthly: import.meta.env.VITE_STRIPE_ELITE_MONTHLY_PRICE_ID,
  elite_annual: import.meta.env.VITE_STRIPE_ELITE_ANNUAL_PRICE_ID,
};

// Pricing configuration
const PRICING = {
  starter: {
    monthly: 79,
    annual: 790, // 17% discount (79 * 12 * 0.83)
    commission_rate: 0.15,
    features: [
      'AI-powered booking assistant',
      '15% commission on bookings',
      'Email support',
      'Standard response time',
      'Access to all service categories',
      'Referral rewards program'
    ]
  },
  professional: {
    monthly: 149,
    annual: 1490, // 17% discount (149 * 12 * 0.83)
    commission_rate: 0.12,
    features: [
      'Everything in Starter',
      '12% commission on bookings (3% savings)',
      'Priority support',
      'Faster response time',
      'Dedicated account manager',
      'Exclusive deals & offers',
      'Early access to new features'
    ]
  },
  elite: {
    monthly: 299,
    annual: 2990, // 17% discount (299 * 12 * 0.83)
    commission_rate: 0.10,
    features: [
      'Everything in Professional',
      '10% commission on bookings (5% savings)',
      '24/7 VIP support',
      'Instant priority booking',
      'Concierge service',
      'Custom travel planning',
      'Complimentary upgrades when available',
      'Exclusive event access'
    ]
  }
};

class StripeService {
  constructor() {
    this.stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://yourapp.com/api';
  }

  /**
   * Get pricing information
   */
  getPricing() {
    return PRICING;
  }

  /**
   * Get user's current subscription
   * @returns {Promise<Object|null>}
   */
  async getCurrentSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  /**
   * Get user's subscription tier
   * @returns {Promise<string>} - Returns 'explorer', 'starter', 'professional', 'elite', or 'nft'
   */
  async getUserTier() {
    const subscription = await this.getCurrentSubscription();
    return subscription?.tier || 'explorer';
  }

  /**
   * Get user's commission rate
   * @returns {Promise<number>}
   */
  async getCommissionRate() {
    const subscription = await this.getCurrentSubscription();
    return subscription?.commission_rate || 0.20; // Default 20% for explorer
  }

  /**
   * Create Stripe checkout session
   * @param {string} tier - 'starter', 'professional', or 'elite'
   * @param {string} billingCycle - 'monthly' or 'annual'
   * @returns {Promise<{url: string}>}
   */
  async createCheckoutSession(tier, billingCycle = 'monthly') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get or create Stripe customer
      const customer = await this.getOrCreateCustomer();

      // Get price ID
      const priceKey = `${tier}_${billingCycle}`;
      const priceId = STRIPE_PRODUCTS[priceKey];

      if (!priceId) {
        throw new Error(`Invalid tier or billing cycle: ${tier} ${billingCycle}`);
      }

      // Call your backend to create checkout session
      const response = await fetch(`${this.apiBaseUrl}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          priceId,
          customerId: customer.stripe_customer_id,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing?subscription=cancelled`,
          metadata: {
            user_id: user.id,
            tier,
            billing_cycle: billingCycle,
            commission_rate: PRICING[tier].commission_rate
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      return { url };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Get or create Stripe customer
   * @returns {Promise<Object>}
   */
  async getOrCreateCustomer() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if customer exists
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (subscription?.stripe_customer_id) {
        return { stripe_customer_id: subscription.stripe_customer_id };
      }

      // Create new customer
      const response = await fetch(`${this.apiBaseUrl}/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          email: user.email,
          metadata: {
            user_id: user.id
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const { customerId } = await response.json();

      // Save customer ID
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          tier: 'explorer',
          status: 'active',
          commission_rate: 0.20
        });

      return { stripe_customer_id: customerId };
    } catch (error) {
      console.error('Error getting/creating customer:', error);
      throw error;
    }
  }

  /**
   * Create customer portal session for managing subscription
   * @returns {Promise<{url: string}>}
   */
  async createPortalSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const customer = await this.getOrCreateCustomer();

      const response = await fetch(`${this.apiBaseUrl}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          customerId: customer.stripe_customer_id,
          returnUrl: `${window.location.origin}/dashboard`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      return { url };
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription at period end
   * @returns {Promise<boolean>}
   */
  async cancelSubscription() {
    try {
      const subscription = await this.getCurrentSubscription();
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      const response = await fetch(`${this.apiBaseUrl}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Update local state
      await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate cancelled subscription
   * @returns {Promise<boolean>}
   */
  async reactivateSubscription() {
    try {
      const subscription = await this.getCurrentSubscription();
      if (!subscription) {
        throw new Error('No subscription found');
      }

      const response = await fetch(`${this.apiBaseUrl}/reactivate-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      // Update local state
      await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      return true;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Check if user can access a feature based on tier
   * @param {string} feature - Feature name
   * @returns {Promise<boolean>}
   */
  async canAccessFeature(feature) {
    const tier = await this.getUserTier();
    
    const tierLevels = {
      explorer: 0,
      starter: 1,
      professional: 2,
      elite: 3,
      nft: 3 // NFT holders get Elite-level access
    };

    const featureRequirements = {
      ai_booking: 1,           // Starter and above
      priority_support: 2,     // Professional and above
      concierge: 3,           // Elite and above
      dedicated_manager: 2,   // Professional and above
      instant_booking: 3      // Elite and above
    };

    const userLevel = tierLevels[tier] || 0;
    const requiredLevel = featureRequirements[feature] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Get subscription benefits for display
   * @returns {Promise<Object>}
   */
  async getSubscriptionBenefits() {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) {
      return {
        tier: 'explorer',
        displayName: 'Explorer (Free)',
        commissionRate: 20,
        features: [
          'Browse all services',
          'Manual booking only',
          '20% commission on bookings',
          'Email support',
          'Access to referral program'
        ],
        canUpgrade: true
      };
    }

    const tierConfig = PRICING[subscription.tier];
    const isAnnual = subscription.billing_cycle === 'annual';

    return {
      tier: subscription.tier,
      displayName: subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1),
      price: isAnnual ? tierConfig.annual : tierConfig.monthly,
      billingCycle: subscription.billing_cycle,
      commissionRate: subscription.commission_rate * 100,
      features: tierConfig.features,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canUpgrade: subscription.tier !== 'elite',
      canDowngrade: subscription.tier !== 'explorer'
    };
  }
}

export const stripeService = new StripeService();
export default stripeService;
