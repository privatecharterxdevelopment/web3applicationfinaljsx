/**
 * MarketplaceView - Tokenized Assets Marketplace
 *
 * Minimal glassmorphic design showing asset cards.
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  MapPin,
  Loader2,
  ChevronRight,
  Plane,
  Ship,
  Car,
  Building2,
  X
} from 'lucide-react';
import { AssetService, type MarketplaceAsset } from '../../services/polymesh';
import MarketplaceAssetDetail from './MarketplaceAssetDetail';

// Category icons mapping
const categoryIcons: Record<string, React.ElementType> = {
  'private-jet': Plane,
  'yacht': Ship,
  'luxury-car': Car,
  'real-estate': Building2
};

// Category labels
const categoryLabels: Record<string, string> = {
  'private-jet': 'Private Jets',
  'yacht': 'Yachts',
  'luxury-car': 'Luxury Cars',
  'real-estate': 'Real Estate'
};

interface MarketplaceViewProps {
  onClose?: () => void;
}

export default function MarketplaceView({ onClose }: MarketplaceViewProps) {
  const [assets, setAssets] = useState<MarketplaceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Detail view state
  const [selectedAsset, setSelectedAsset] = useState<MarketplaceAsset | null>(null);

  // Fetch assets
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await AssetService.getAssets({ limit: 50 });
      setAssets(data);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchQuery ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.ticker.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || asset.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // If an asset is selected, show detail view
  if (selectedAsset) {
    return (
      <MarketplaceAssetDetail
        asset={selectedAsset}
        onBack={() => setSelectedAsset(null)}
      />
    );
  }

  const categories = Object.entries(categoryLabels);

  return (
    <div className="h-full flex flex-col">
      {/* Minimal Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-light text-gray-900 tracking-tight font-['DM_Sans']">Asset Marketplace</h1>
            <p className="text-xs text-gray-500 mt-0.5">Tokenized securities on Polymesh</p>
          </div>
          <div className="text-xs text-gray-400">
            {assets.length} assets
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-400"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !selectedCategory
                  ? 'bg-gray-900 text-white'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              All
            </button>
            {categories.map(([key, label]) => {
              const Icon = categoryIcons[key];
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedCategory === key
                      ? 'bg-gray-900 text-white'
                      : 'bg-white/60 text-gray-600 hover:bg-white/80'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>

          {(selectedCategory || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-gray-500">No assets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onClick={() => setSelectedAsset(asset)}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal Asset Card Component
function AssetCard({
  asset,
  onClick,
  formatCurrency
}: {
  asset: MarketplaceAsset;
  onClick: () => void;
  formatCurrency: (amount: number | undefined) => string;
}) {
  const CategoryIcon = categoryIcons[asset.category || ''] || Building2;
  const progress = asset.targetAmount
    ? Math.min(((asset.raisedAmount || 0) / asset.targetAmount) * 100, 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className="group bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200/50 hover:border-gray-300 hover:shadow-lg hover:bg-white/90 transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        <img
          src={asset.imageUrl || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600'}
          alt={asset.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
            asset.status === 'active'
              ? 'bg-emerald-500/90 text-white'
              : 'bg-amber-500/90 text-white'
          }`}>
            {asset.status === 'active' ? 'Live' : 'Soon'}
          </span>
        </div>

        {/* APY Badge */}
        {asset.estimatedApy && (
          <div className="absolute top-2.5 right-2.5">
            <div className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-md flex items-center gap-1">
              <TrendingUp size={10} className="text-emerald-600" />
              <span className="text-[10px] font-semibold text-gray-900">
                {asset.estimatedApy}%
              </span>
            </div>
          </div>
        )}

        {/* Title on image */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <CategoryIcon size={10} className="text-white/70" />
            <span className="text-[10px] text-white/70">
              {categoryLabels[asset.category || ''] || 'Asset'}
            </span>
          </div>
          <h3 className="text-white font-medium text-sm truncate">
            {asset.name}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Ticker and Price Row */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded">
            {asset.ticker}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-gray-900">
              ${asset.tokenPrice?.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400">/token</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2.5">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-800 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">{progress.toFixed(0)}%</span>
            <span className="text-[10px] text-gray-400">{formatCurrency(asset.targetAmount)}</span>
          </div>
        </div>

        {/* Location & CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-gray-400">
            <MapPin size={10} />
            <span className="text-[10px]">{asset.location || 'Global'}</span>
          </div>
          <button className="flex items-center gap-0.5 text-[10px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
            View
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
