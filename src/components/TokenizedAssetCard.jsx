import React from 'react';
import { TrendingUp, Users, DollarSign, Clock, ArrowRight } from 'lucide-react';

/**
 * TokenizedAssetCard - Minimalistic card for tokenized assets marketplace
 * Monochromatic design matching the Adventures page style
 */
const TokenizedAssetCard = ({ asset, onClick }) => {
  if (!asset) return null;

  const {
    name,
    category,
    asset_type,
    location,
    image_url,
    cover_image_url,
    token_price,
    min_investment,
    target_amount,
    raised_amount,
    current_waitlist,
    target_waitlist,
    estimated_apy,
    status,
    current_phase
  } = asset;

  const displayImage = cover_image_url || image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800';
  const progressPercentage = target_waitlist ? Math.min((current_waitlist / target_waitlist) * 100, 100) : 0;

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      'private-jet': 'Private Jet',
      'yacht': 'Yacht',
      'luxury-car': 'Luxury Car',
      'real-estate': 'Real Estate'
    };
    return labels[cat] || cat || 'Asset';
  };

  const getStatusBadge = () => {
    if (current_phase === 'waitlist') return { label: 'Waitlist', bg: 'bg-gray-900' };
    if (current_phase === 'fundraising') return { label: 'Live', bg: 'bg-green-600' };
    if (status === 'upcoming') return { label: 'Coming Soon', bg: 'bg-gray-600' };
    if (status === 'completed') return { label: 'Funded', bg: 'bg-blue-600' };
    return { label: 'Active', bg: 'bg-gray-900' };
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all hover:shadow-md"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={displayImage}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 ${statusBadge.bg} text-white text-[10px] font-medium rounded-full`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-medium rounded-full">
            {getCategoryLabel(category)}
          </span>
        </div>

        {/* APY Badge */}
        {estimated_apy && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium rounded-full flex items-center gap-1">
              <TrendingUp size={10} />
              {estimated_apy}% APY
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1 line-clamp-1">
          {name}
        </h3>

        {/* Location / Asset Type */}
        <p className="text-xs text-gray-500 mb-3">
          {asset_type} {location && `· ${location}`}
        </p>

        {/* Waitlist Progress */}
        {current_phase === 'waitlist' && target_waitlist > 0 && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Users size={10} />
                Waitlist
              </span>
              <span className="text-[10px] font-medium text-gray-900">
                {current_waitlist || 0}/{target_waitlist}
              </span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-500">Min. Investment</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(min_investment)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Target</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(target_amount)}
            </p>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full mt-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 group-hover:gap-2">
          View Details
          <ArrowRight size={12} className="transition-all" />
        </button>
      </div>
    </div>
  );
};

export default TokenizedAssetCard;
