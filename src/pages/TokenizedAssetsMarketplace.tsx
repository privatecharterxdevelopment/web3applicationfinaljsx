import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, TrendingUp, Users, DollarSign, Shield, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LandingHeader from '../components/Landingpagenew/LandingHeader';
import Footer from '../components/Landingpagenew/Footer';

interface TokenizedAsset {
  id: string;
  name: string;
  description: string;
  category: string;
  asset_type: string;
  location: string;
  image_url: string;
  cover_image_url: string;
  token_symbol: string;
  token_price: number;
  target_amount: number;
  min_investment: number;
  estimated_apy: number;
  current_phase: string;
  status: string;
  current_waitlist: number;
  target_waitlist: number;
}

export default function TokenizedAssetsMarketplace() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<TokenizedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [minInvestmentRange, setMinInvestmentRange] = useState<string>('all');
  const [apyRange, setApyRange] = useState<string>('all');

  const categories = [
    { id: 'private-jet', label: 'Private Jets' },
    { id: 'yacht', label: 'Yachts' },
    { id: 'luxury-car', label: 'Luxury Cars' },
    { id: 'real-estate', label: 'Real Estate' },
  ];

  const statusOptions = [
    { id: 'active', label: 'Live' },
    { id: 'upcoming', label: 'Coming Soon' },
    { id: 'waitlist', label: 'Waitlist Open' },
  ];

  const investmentRanges = [
    { id: 'all', label: 'Any Amount' },
    { id: 'under5k', label: 'Under $5,000' },
    { id: '5k-25k', label: '$5,000 - $25,000' },
    { id: '25k-100k', label: '$25,000 - $100,000' },
    { id: 'over100k', label: '$100,000+' },
  ];

  const apyRanges = [
    { id: 'all', label: 'Any APY' },
    { id: 'under5', label: 'Under 5%' },
    { id: '5-10', label: '5% - 10%' },
    { id: '10-15', label: '10% - 15%' },
    { id: 'over15', label: '15%+' },
  ];

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('launchpad_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleStatus = (id: string) => {
    setSelectedStatus(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedStatus([]);
    setMinInvestmentRange('all');
    setApyRange('all');
    setSearchQuery('');
  };

  const filteredAssets = assets.filter(asset => {
    // Search
    const matchesSearch = !searchQuery ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category
    const matchesCategory = selectedCategories.length === 0 ||
      selectedCategories.includes(asset.category);

    // Status
    const matchesStatus = selectedStatus.length === 0 ||
      selectedStatus.includes(asset.status) ||
      (selectedStatus.includes('waitlist') && asset.current_phase === 'waitlist');

    // Min Investment
    let matchesInvestment = true;
    if (minInvestmentRange !== 'all' && asset.min_investment) {
      const min = asset.min_investment;
      if (minInvestmentRange === 'under5k') matchesInvestment = min < 5000;
      else if (minInvestmentRange === '5k-25k') matchesInvestment = min >= 5000 && min < 25000;
      else if (minInvestmentRange === '25k-100k') matchesInvestment = min >= 25000 && min < 100000;
      else if (minInvestmentRange === 'over100k') matchesInvestment = min >= 100000;
    }

    // APY
    let matchesApy = true;
    if (apyRange !== 'all' && asset.estimated_apy) {
      const apy = asset.estimated_apy;
      if (apyRange === 'under5') matchesApy = apy < 5;
      else if (apyRange === '5-10') matchesApy = apy >= 5 && apy < 10;
      else if (apyRange === '10-15') matchesApy = apy >= 10 && apy < 15;
      else if (apyRange === 'over15') matchesApy = apy >= 15;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesInvestment && matchesApy;
  });

  const activeFilterCount = selectedCategories.length + selectedStatus.length +
    (minInvestmentRange !== 'all' ? 1 : 0) + (apyRange !== 'all' ? 1 : 0);

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // Filter Sidebar Component
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`${isMobile ? '' : 'sticky top-24'}`}>
      <div className={`${isMobile ? '' : 'bg-white rounded-2xl border border-gray-200 p-5'} space-y-5`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Asset Type */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-700 mb-3">Asset Type</h4>
          <div className="space-y-2.5">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-700 mb-3">Status</h4>
          <div className="space-y-2.5">
            {statusOptions.map((status) => (
              <label key={status.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedStatus.includes(status.id)}
                  onChange={() => toggleStatus(status.id)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Min Investment */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-700 mb-3">Min. Investment</h4>
          <select
            value={minInvestmentRange}
            onChange={(e) => setMinInvestmentRange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            {investmentRanges.map((range) => (
              <option key={range.id} value={range.id}>{range.label}</option>
            ))}
          </select>
        </div>

        {/* APY Range */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-700 mb-3">Expected APY</h4>
          <select
            value={apyRange}
            onChange={(e) => setApyRange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            {apyRanges.map((range) => (
              <option key={range.id} value={range.id}>{range.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* tZERO Info - Separate card */}
      <div className={`${isMobile ? 'mt-5' : 'mt-4'} p-4 bg-white rounded-2xl border border-gray-200`}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={14} className="text-gray-600" />
          <span className="text-xs font-medium text-gray-900">SEC Regulated</span>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          All offerings are SEC-compliant security tokens issued in partnership with tZERO.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <LandingHeader onGetStarted={() => navigate('/dashboard')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-gray-900 tracking-tight">
              Marketplace
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              SEC-regulated tokenized assets via tZERO
            </p>
          </div>

          {/* Search + Mobile Filter Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search offerings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-gray-300"
              />
            </div>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
            >
              <SlidersHorizontal size={14} />
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex gap-8">
          {/* Left Sidebar - Desktop */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <FilterSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {filteredAssets.length} offering{filteredAssets.length !== 1 ? 's' : ''}
                {activeFilterCount > 0 && (
                  <span className="text-gray-400"> · {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied</span>
                )}
              </p>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-16 h-16">
                  <video autoPlay loop muted playsInline className="w-full h-full object-contain">
                    <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <Shield size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-900 font-medium mb-1">No offerings found</p>
                <p className="text-xs text-gray-500 mb-4">Try adjusting your filters</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-gray-600 hover:text-gray-900 underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onClick={() => navigate(`/marketplace/asset/${asset.id}`)}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-1 text-gray-500 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar isMobile />
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg"
              >
                Show {filteredAssets.length} results
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// Asset Card Component
function AssetCard({
  asset,
  onClick,
  formatCurrency
}: {
  asset: TokenizedAsset;
  onClick: () => void;
  formatCurrency: (amount: number | null | undefined) => string;
}) {
  const progress = asset.target_waitlist
    ? Math.min((asset.current_waitlist / asset.target_waitlist) * 100, 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        <img
          src={asset.image_url || asset.cover_image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600'}
          alt={asset.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Token badge */}
        <div className="absolute top-3 left-3">
          <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md">
            <span className="text-[10px] font-semibold text-gray-900 tracking-wide">
              {asset.token_symbol || 'TKN'}
            </span>
          </div>
        </div>

        {/* APY badge */}
        {asset.estimated_apy && (
          <div className="absolute top-3 right-3">
            <div className="px-2 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-md flex items-center gap-1">
              <TrendingUp size={10} className="text-white" />
              <span className="text-[10px] font-semibold text-white">
                {asset.estimated_apy}%
              </span>
            </div>
          </div>
        )}

        {/* Title on image */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-medium text-sm truncate drop-shadow-sm">
            {asset.name}
          </h3>
          <p className="text-white/70 text-xs truncate">
            {asset.location || asset.asset_type}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Waitlist</span>
            <span className="text-[10px] font-medium text-gray-700">
              {asset.current_waitlist || 0}/{asset.target_waitlist || 100}
            </span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gray-800 to-gray-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Min. Invest</p>
            <p className="text-sm font-semibold text-gray-900">{formatCurrency(asset.min_investment)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Target</p>
            <p className="text-sm font-semibold text-gray-900">{formatCurrency(asset.target_amount)}</p>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 group-hover:gap-2">
          View Offering
          <ArrowRight size={12} className="transition-all" />
        </button>
      </div>
    </div>
  );
}
