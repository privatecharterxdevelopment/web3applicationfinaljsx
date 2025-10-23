/**
 * Subscription Management Page
 *
 * Full-featured subscription management interface
 * - View current plan details
 * - Upgrade/downgrade options
 * - Cancel subscription
 * - Billing history
 * - Usage statistics
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import stripeService from '../services/stripeService';
import { useAccount } from 'wagmi';
import nftBenefitsService from '../services/nftBenefitsService';

const SubscriptionManagement = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [benefits, setBenefits] = useState(null);
  const [nftInfo, setNftInfo] = useState({ hasNFT: false, nfts: [] });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, [address]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const subData = await stripeService.getSubscriptionBenefits();
      setBenefits(subData);

      const currentSub = await stripeService.getCurrentSubscription();
      setSubscription(currentSub);

      if (address) {
        const nftData = await nftBenefitsService.checkUserNFTs(address);
        setNftInfo(nftData);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier, billingCycle) => {
    setProcessing(true);
    try {
      const { url } = await stripeService.createCheckoutSession(tier, billingCycle);
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start upgrade process. Please try again.');
      setProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    setProcessing(true);
    try {
      const { url } = await stripeService.createPortalSession();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setProcessing(true);
    try {
      await stripeService.cancelSubscription();
      alert('✅ Subscription cancelled. You can continue using your plan until the end of the billing period.');
      setShowCancelConfirm(false);
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async () => {
    setProcessing(true);
    try {
      await stripeService.reactivateSubscription();
      alert('✅ Subscription reactivated!');
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      alert('Failed to reactivate subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const pricingPlans = [
    {
      tier: 'starter',
      name: 'Starter',
      monthlyPrice: 79,
      annualPrice: 790,
      commission: 15,
      features: [
        'AI-powered booking assistant',
        '15% commission on bookings',
        'Email support',
        'Standard response time',
        'Access to all service categories'
      ]
    },
    {
      tier: 'professional',
      name: 'Professional',
      monthlyPrice: 149,
      annualPrice: 1490,
      commission: 12,
      popular: true,
      features: [
        'Everything in Starter',
        '12% commission (3% savings)',
        'Priority support',
        'Faster response time',
        'Dedicated account manager',
        'Exclusive deals & offers'
      ]
    },
    {
      tier: 'elite',
      name: 'Elite',
      monthlyPrice: 299,
      annualPrice: 2990,
      commission: 10,
      features: [
        'Everything in Professional',
        '10% commission (5% savings)',
        '24/7 VIP support',
        'Instant priority booking',
        'Concierge service',
        'Custom travel planning',
        'Exclusive event access'
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl mx-auto">
      <div className="p-8 space-y-8">
        {/* Current Plan Card */}
        <div className="border-b border-gray-200 pb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-black mb-2">Your Subscription</h2>
              <p className="text-gray-600">Manage your plan and billing</p>
            </div>
          </div>

          {benefits && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Plan Details */}
              <div className="space-y-4">
                <div>
                  <div className="text-gray-600 text-sm mb-1">Current Plan</div>
                  <div className="text-2xl font-semibold text-black">
                    {benefits.displayName}
                  </div>
                </div>

                {benefits.tier !== 'explorer' && benefits.price && (
                  <>
                    <div>
                      <div className="text-gray-600 text-sm mb-1">Price</div>
                      <div className="text-xl font-medium text-black">
                        €{benefits.price}
                        <span className="text-gray-500 text-sm font-normal">
                          /{benefits.billingCycle === 'annual' ? 'year' : 'month'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-600 text-sm mb-1">Commission Rate</div>
                      <div className="text-xl font-medium text-black">{benefits.commissionRate}%</div>
                    </div>

                    {benefits.currentPeriodEnd && (
                      <div>
                        <div className="text-gray-600 text-sm mb-1">
                          {benefits.cancelAtPeriodEnd ? 'Expires On' : 'Renews On'}
                        </div>
                        <div className="text-black">{formatDate(benefits.currentPeriodEnd)}</div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {benefits.canUpgrade && (
                  <button
                    onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>Upgrade Plan</span>
                  </button>
                )}

                {benefits.tier !== 'explorer' && (
                  <>
                    <button
                      onClick={handleManageBilling}
                      disabled={processing}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-black py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 border border-gray-300"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>Manage Billing</span>
                    </button>

                    {!benefits.cancelAtPeriodEnd ? (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-all duration-300 border border-gray-300"
                      >
                        Cancel Subscription
                      </button>
                    ) : (
                      <button
                        onClick={handleReactivate}
                        disabled={processing}
                        className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition-all duration-300"
                      >
                        Reactivate Subscription
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Warning for cancelled subscription */}
          {benefits?.cancelAtPeriodEnd && (
            <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-gray-900 font-medium text-sm">Subscription Cancelled</div>
                <div className="text-gray-600 text-sm mt-1">
                  Your plan will expire on {formatDate(benefits.currentPeriodEnd)}. Reactivate to continue enjoying benefits.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FREE PLAN - Horizontal Banner Above All Plans */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black mb-2">Free Explorer</h3>
              <p className="text-gray-600 text-sm mb-4">
                Try our platform with 2 AI chats per month. Limited features, no credit card required.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>2 AI chats/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>Basic search access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>Email support</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>20% commission</span>
                </div>
              </div>
            </div>
            <div className="ml-6 flex flex-col items-end justify-center">
              <div className="text-3xl font-semibold text-black mb-2">€0</div>
              <div className="text-sm text-gray-500">Always free</div>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div id="plans-section">
          <h3 className="text-xl font-semibold text-black mb-6">Paid Plans</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.tier}
                className={`bg-white border rounded-lg p-6 transition-all duration-300 hover:shadow-lg ${
                  plan.popular
                    ? 'border-black ring-2 ring-black'
                    : 'border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="bg-black text-white text-xs font-semibold px-3 py-1 rounded mb-4 inline-block">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-xl font-semibold mb-2 text-black">
                  {plan.name}
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-semibold text-black">
                    €{plan.monthlyPrice}
                    <span className="text-gray-500 text-lg font-normal">/mo</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    or €{plan.annualPrice}/year (save 17%)
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600">Commission Rate</div>
                  <div className="text-lg font-semibold text-black">{plan.commission}%</div>
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-black rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleUpgrade(plan.tier, 'monthly')}
                    disabled={processing || benefits?.tier === plan.tier}
                    className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
                      benefits?.tier === plan.tier
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {benefits?.tier === plan.tier ? 'Current Plan' : 'Upgrade Monthly'}
                  </button>
                  <button
                    onClick={() => handleUpgrade(plan.tier, 'annual')}
                    disabled={processing || benefits?.tier === plan.tier}
                    className="w-full py-2 rounded-lg font-medium text-sm transition-all duration-300 bg-gray-100 hover:bg-gray-200 text-black border border-gray-300"
                  >
                    Upgrade Annual
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NFT Benefits Card */}
        {nftInfo.hasNFT && (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-black mb-2">
                  NFT Holder Benefits
                </h4>
                <p className="text-gray-600 text-sm">You own {nftInfo.nfts.length} NFT{nftInfo.nfts.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-black font-medium">10% Discount</div>
                <div className="text-gray-600 text-sm">On all bookings</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-black font-medium">Free Service</div>
                <div className="text-gray-600 text-sm">≤$1,500 per NFT</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-black font-medium">8% Commission</div>
                <div className="text-gray-600 text-sm">Lowest rate available</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-gray-700" />
              <h3 className="text-xl font-semibold text-black">Cancel Subscription?</h3>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-black transition-all"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={processing}
                className="flex-1 py-3 rounded-lg font-medium bg-black hover:bg-gray-800 text-white transition-all"
              >
                {processing ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
