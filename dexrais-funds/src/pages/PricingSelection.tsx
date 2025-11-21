import { useNavigate } from 'react-router-dom';
import { Zap, Rocket, Crown } from 'lucide-react';
import Header from '../components/Landing/Header';
import PricingCard from '../components/Pricing/PricingCard';
import { PRICING_TIERS, PricingTier } from '../lib/pricing';

export default function PricingSelection() {
  const navigate = useNavigate();

  const handleSelectTier = (tier: PricingTier) => {
    // Navigate to create campaign with selected tier
    navigate('/create', { state: { selectedTier: tier } });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-32">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-medium text-gray-900 mb-4 tracking-tight" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            Choose Your Plan
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Select the perfect tier for your fundraising campaign
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Starter */}
          <PricingCard
            tier={PRICING_TIERS.starter}
            icon={<Zap className="w-8 h-8 text-white" />}
            onSelect={() => handleSelectTier('starter')}
          />

          {/* Pro */}
          <PricingCard
            tier={PRICING_TIERS.pro}
            icon={<Rocket className="w-8 h-8 text-white" />}
            popular
            onSelect={() => handleSelectTier('pro')}
          />

          {/* Enterprise */}
          <PricingCard
            tier={PRICING_TIERS.enterprise}
            icon={<Crown className="w-8 h-8 text-white" />}
            onSelect={() => handleSelectTier('enterprise')}
          />
        </div>

        {/* Add-On Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                ⭐ Add-On: Smart Contract Audit
              </h3>
              <p className="text-sm text-gray-600">
                Professional audit by OpenZeppelin, CertiK, or Quantstamp
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-medium text-gray-900 mb-1">CHF 15,000</div>
              <div className="text-xs text-gray-600">(16,500 USDC)</div>
            </div>
          </div>
        </div>

        {/* Enterprise + Audit Bundle */}
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-medium text-gray-900 mb-1">
                  Enterprise + Audit Bundle
                </h3>
                <p className="text-sm text-gray-600">
                  All Enterprise features + Smart Contract Audit INCLUDED
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-medium text-gray-900 mb-1">CHF 15,000</div>
              <div className="text-xs text-gray-600 mb-4">(16,500 USDC) + 1% fee</div>
              <button
                onClick={() => handleSelectTier('enterprise_audit')}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-black transition-colors"
              >
                Select Bundle
              </button>
            </div>
          </div>

          {/* Bundle Features */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-sm text-gray-700">Unlimited Fundraise</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-sm text-gray-700">Featured 30 Days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-sm text-gray-700">Newsletter + Social</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-sm text-gray-700">Smart Contract Audit ⭐</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-sm text-gray-700">Advanced Governance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-sm text-gray-700">Priority Approval</span>
            </div>
          </div>
        </div>

        {/* Comparison Note */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 font-light">
            All plans include Gnosis Safe escrow, DAO voting, and Kleros dispute resolution
          </p>
        </div>
      </div>
    </div>
  );
}
