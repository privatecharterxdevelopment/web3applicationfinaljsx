import { Check } from 'lucide-react';
import { TierDetails, formatPrice, formatFee } from '../../lib/pricing';

interface PricingCardProps {
  tier: TierDetails;
  icon: React.ReactNode;
  popular?: boolean;
  onSelect: () => void;
}

export default function PricingCard({ tier, icon, popular, onSelect }: PricingCardProps) {
  const features = [
    { label: 'Project Listing', included: true },
    tier.features.featuredDays > 0 && { label: `Featured (${tier.features.featuredDays} days)`, included: true },
    tier.features.newsletter && { label: 'Newsletter + Social', included: true },
    { label: 'Gnosis Safe Escrow', included: true },
    {
      label: tier.features.milestones === -1 ? 'Unlimited Milestones' : `${tier.features.milestones} Milestones`,
      included: true
    },
    { label: 'DAO Vote + Kleros', included: true },
    { label: `${tier.features.dashboard === 'advanced' ? 'Advanced' : 'Basic'} Dashboard`, included: true },
    tier.features.customToken && { label: 'Custom Token Design', included: true },
    tier.features.priority && { label: 'Priority Approval', included: true },
    tier.features.audit && { label: 'Smart Contract Audit ⭐', included: true },
  ].filter(Boolean);

  return (
    <div className={`bg-white border rounded-2xl p-8 hover:border-gray-400 transition-all group relative ${popular ? 'border-2 border-gray-900' : 'border-gray-200'}`}>
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
            Popular
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
        {icon}
      </div>

      {/* Tier Name */}
      <h3 className="text-2xl font-medium text-gray-900 mb-2">{tier.name}</h3>

      {/* Price */}
      <div className="mb-6">
        <div className="text-3xl font-medium text-gray-900 mb-1">
          {formatPrice(tier.priceChf)}
        </div>
        <div className="text-xs text-gray-600">
          ({tier.priceUsdc} USDC) + {formatFee(tier.transactionFee)} fee
        </div>
      </div>

      {/* Max Fundraise */}
      {tier.maxFundraise && (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Max Fundraise: <span className="font-medium text-gray-900">{formatPrice(tier.maxFundraise)}</span>
          </p>
        </div>
      )}
      {!tier.maxFundraise && (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-900 font-medium">Unlimited Fundraise</p>
        </div>
      )}

      {/* Features */}
      <div className="space-y-3 mb-8">
        {features.map((feature: any, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check size={16} className="text-gray-900 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700">{feature.label}</span>
          </div>
        ))}
      </div>

      {/* Select Button */}
      <button
        onClick={onSelect}
        className="w-full py-3 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-black transition-colors"
      >
        Select {tier.name}
      </button>
    </div>
  );
}
