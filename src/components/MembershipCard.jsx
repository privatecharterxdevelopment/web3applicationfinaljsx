/**
 * Membership Card Component
 * 
 * Displays user's subscription tier, benefits, and upgrade options
 * Shown in dashboard sidebar
 */

import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, Sparkles, Calendar, Shield, ExternalLink } from 'lucide-react';
import stripeService from '../services/stripeService';
import nftBenefitsService from '../services/nftBenefitsService';
import { useAccount } from 'wagmi';

const MembershipCard = ({ compact = false }) => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [nftInfo, setNftInfo] = useState({ hasNFT: false, nfts: [] });
  const [benefits, setBenefits] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [address]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      // Load subscription
      const subData = await stripeService.getSubscriptionBenefits();
      setSubscription(subData);
      setBenefits(subData);

      // Load NFT info if wallet connected
      if (address) {
        const nftData = await nftBenefitsService.checkUserNFTs(address);
        setNftInfo(nftData);
        
        // If user has NFT, override tier display
        if (nftData.hasNFT) {
          setBenefits({
            ...subData,
            tier: 'nft',
            displayName: 'NFT Holder',
            commissionRate: 8,
            features: [
              '10% discount on all bookings',
              '1 FREE service per NFT (≤$1,500)',
              'Elite-level features',
              '8% commission (lowest rate)',
              'VIP support',
              'Priority booking'
            ]
          });
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const { url } = await stripeService.createPortalSession();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Unable to open billing portal. Please try again.');
    }
  };

  const getTierIcon = (tier) => {
    const icons = {
      explorer: <Sparkles className="w-5 h-5 text-gray-400" />,
      starter: <TrendingUp className="w-5 h-5 text-green-400" />,
      professional: <Crown className="w-5 h-5 text-blue-400" />,
      elite: <Shield className="w-5 h-5 text-purple-400" />,
      nft: <Crown className="w-5 h-5 text-yellow-400" />
    };
    return icons[tier] || icons.explorer;
  };

  const getTierGradient = (tier) => {
    const gradients = {
      explorer: 'from-gray-500 to-gray-600',
      starter: 'from-green-500 to-emerald-600',
      professional: 'from-blue-500 to-cyan-600',
      elite: 'from-purple-500 to-pink-600',
      nft: 'from-yellow-500 to-orange-600'
    };
    return gradients[tier] || gradients.explorer;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 animate-pulse">
        <div className="h-20 bg-white/10 rounded-lg" />
      </div>
    );
  }

  if (!benefits) return null;

  // Compact version for sidebar
  if (compact) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300">
        {/* Tier Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getTierIcon(benefits.tier)}
            <div>
              <div className="text-sm font-bold text-white">
                {benefits.displayName}
              </div>
            </div>
          </div>
          
          {nftInfo.hasNFT && (
            <div className="flex items-center space-x-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-semibold">
              <Crown className="w-3 h-3" />
              <span>NFT</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {benefits.tier !== 'explorer' && benefits.currentPeriodEnd && (
          <div className="flex items-center space-x-2 text-xs text-gray-400 mb-3">
            <Calendar className="w-3 h-3" />
            <span>Renews {formatDate(benefits.currentPeriodEnd)}</span>
          </div>
        )}

        {/* Upgrade Button - Only show for NON-Explorer tiers */}
        {benefits.canUpgrade && benefits.tier !== 'explorer' && (
          <button
            onClick={handleUpgrade}
            className={`w-full bg-gradient-to-r ${getTierGradient(benefits.tier)} text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Manage Plan</span>
          </button>
        )}
      </div>
    );
  }

  // Full version for dedicated page
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
      {/* Header with tier badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${getTierGradient(benefits.tier)}`}>
            {getTierIcon(benefits.tier)}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">
              {benefits.displayName}
            </h3>
            <p className="text-gray-400 text-sm">Your current membership</p>
          </div>
        </div>

        {nftInfo.hasNFT && (
          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-2 bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full text-sm font-semibold">
              <Crown className="w-4 h-4" />
              <span>NFT Holder</span>
            </div>
            <div className="text-xs text-gray-400">
              {nftInfo.nfts.length} NFT{nftInfo.nfts.length !== 1 ? 's' : ''} owned
            </div>
          </div>
        )}
      </div>

      {/* Pricing Info */}
      {benefits.tier !== 'explorer' && benefits.price && (
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-white">
                €{benefits.price}
                <span className="text-lg text-gray-400 font-normal">
                  /{benefits.billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>
              {benefits.billingCycle === 'annual' && (
                <div className="text-sm text-green-400 font-semibold mt-1">
                  💰 Save 17% with annual billing
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Commission Rate</div>
              <div className="text-2xl font-bold text-white">
                {benefits.commissionRate}%
              </div>
            </div>
          </div>
          
          {benefits.currentPeriodEnd && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {benefits.cancelAtPeriodEnd ? 'Expires on' : 'Renews on'}
                </span>
                <span className="text-white font-semibold">
                  {formatDate(benefits.currentPeriodEnd)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Benefits List */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Membership Benefits
        </h4>
        <div className="space-y-2">
          {benefits.features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 text-gray-300"
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                <span className="text-green-400 text-xs">✓</span>
              </div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {benefits.canUpgrade && (
          <button
            onClick={handleUpgrade}
            className={`w-full bg-gradient-to-r ${getTierGradient(benefits.tier === 'explorer' ? 'professional' : 'elite')} text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>
              {benefits.tier === 'explorer' ? 'Upgrade to Save More' : 'Upgrade Your Plan'}
            </span>
          </button>
        )}

        {benefits.tier !== 'explorer' && (
          <button
            onClick={handleUpgrade}
            className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 border border-white/10"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Manage Billing</span>
          </button>
        )}
      </div>

      {/* Warning for cancelled subscription */}
      {benefits.cancelAtPeriodEnd && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="text-red-400 text-xl">⚠️</div>
            <div className="flex-1">
              <div className="text-red-400 font-semibold text-sm">
                Subscription Cancelled
              </div>
              <div className="text-gray-400 text-xs mt-1">
                Your plan will expire on {formatDate(benefits.currentPeriodEnd)}.
                Reactivate to continue enjoying benefits.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipCard;
