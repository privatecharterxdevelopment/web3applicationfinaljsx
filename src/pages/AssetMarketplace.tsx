/**
 * Asset Marketplace - Standalone Tokenized Assets Page
 *
 * Clean design with collapsible sidebar, asset type badges, and Polymesh wallet.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { AssetService, type MarketplaceAsset } from '../services/polymesh';
import Footer from '../components/Landingpagenew/Footer';

export default function AssetMarketplace() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  // State
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<MarketplaceAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Slider filter values
  const [apyValue, setApyValue] = useState<[number, number]>([0, 25]);
  const [minInvestValue, setMinInvestValue] = useState<number>(0);
  const [tokenPriceValue, setTokenPriceValue] = useState<number>(1000);

  // Asset type options for header badges
  const assetTypes = [
    { id: 'all', label: 'All' },
    { id: 'private-jet', label: 'Jets' },
    { id: 'yacht', label: 'Yachts' },
    { id: 'luxury-car', label: 'Cars' },
    { id: 'real-estate', label: 'Real Estate' },
  ];

  // Load assets
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
      setTimeout(() => setLoading(false), 600);
    }
  };

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchQuery ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.ticker.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || selectedCategory === 'all' ||
      asset.category === selectedCategory;

    const matchesStatus = !selectedStatus ||
      asset.status === selectedStatus;

    // APY slider filter
    const matchesApy = !asset.estimatedApy ||
      (asset.estimatedApy >= apyValue[0] && asset.estimatedApy <= apyValue[1]);

    // Min investment slider filter (show assets with minInvestment >= selected value)
    const matchesMinInvest = !asset.minInvestment ||
      minInvestValue === 0 ||
      asset.minInvestment >= minInvestValue;

    // Token price slider filter (show assets with tokenPrice <= selected value)
    const matchesTokenPrice = !asset.tokenPrice ||
      tokenPriceValue === 1000 ||
      asset.tokenPrice <= tokenPriceValue;

    return matchesSearch && matchesCategory && matchesStatus && matchesApy && matchesMinInvest && matchesTokenPrice;
  });

  // Loading screen
  if (loading) {
    return (
      <div className="h-[100dvh] font-['DM_Sans'] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="https://i.ibb.co/DPF5g3Sk/iu42DU1.png"
            alt="PrivateCharterX"
            className="h-10 object-contain animate-pulse"
          />
          <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] font-['DM_Sans'] bg-white">
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex flex-1">

          {/* Collapsible Sidebar */}
          <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${
            sidebarOpen ? 'w-60' : 'w-14'
          }`}>
            {/* Sidebar Header with Logo + Toggle */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
              {sidebarOpen && (
                <img
                  src="https://i.ibb.co/DPF5g3Sk/iu42DU1.png"
                  alt="PrivateCharterX"
                  className="h-7 object-contain"
                />
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all ${!sidebarOpen ? 'mx-auto' : ''}`}
              >
                {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>

            {/* Sidebar Content */}
            {sidebarOpen && (
              <div className="flex-1 p-4 space-y-5 overflow-y-auto">
                {/* Status Filter - Grey Badges */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: null, label: 'All' },
                      { id: 'active', label: 'Live' },
                      { id: 'upcoming', label: 'Soon' },
                    ].map((opt) => (
                      <button
                        key={opt.id || 'all'}
                        onClick={() => setSelectedStatus(opt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          selectedStatus === opt.id
                            ? 'bg-gray-200 text-gray-900'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-150'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* APY Range Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Est. APY</p>
                    <span className="text-[10px] text-gray-600">{apyValue[0]}% - {apyValue[1]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={apyValue[1]}
                    onChange={(e) => setApyValue([apyValue[0], parseInt(e.target.value)])}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                    <span>0%</span>
                    <span>25%+</span>
                  </div>
                </div>

                {/* Min Investment Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Min. Investment</p>
                    <span className="text-[10px] text-gray-600">${(minInvestValue / 1000).toFixed(0)}K</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={minInvestValue}
                    onChange={(e) => setMinInvestValue(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                    <span>$0</span>
                    <span>$100K+</span>
                  </div>
                </div>

                {/* Token Price Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Token Price</p>
                    <span className="text-[10px] text-gray-600">${tokenPriceValue}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    value={tokenPriceValue}
                    onChange={(e) => setTokenPriceValue(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                    <span>$0</span>
                    <span>$1000+</span>
                  </div>
                </div>

                {/* Back to Dashboard */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Home size={14} />
                    Back to Dashboard
                  </button>
                </div>

                {/* CTA Card - Grey */}
                <div className="pt-3">
                  <div className="bg-gray-100 rounded-xl p-4">
                    <p className="text-xs text-gray-700 font-medium mb-1">
                      Tokenize your assets
                    </p>
                    <p className="text-[10px] text-gray-500 mb-3">
                      List your jets, yachts & more on Polymesh.
                    </p>
                    <button
                      onClick={() => navigate('/dashboard/web3/tokenization')}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-[10px] font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Get Started
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Collapsed state icons */}
            {!sidebarOpen && (
              <div className="flex-1 flex flex-col items-center py-4 gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                  title="Filters"
                >
                  <SlidersHorizontal size={18} />
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                  title="Dashboard"
                >
                  <Home size={18} />
                </button>
              </div>
            )}
          </aside>

          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-600"
            >
              <SlidersHorizontal size={18} />
            </button>
            <img
              src="https://i.ibb.co/DPF5g3Sk/iu42DU1.png"
              alt="PrivateCharterX"
              className="h-6 object-contain"
            />
            <button
              onClick={() => open()}
              className="p-2 text-gray-600"
            >
              <Wallet size={18} />
            </button>
          </div>

          {/* Mobile Filter Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-72 h-full bg-white p-5 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium text-gray-900">Filters</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-gray-400">
                    <X size={18} />
                  </button>
                </div>
                {/* Mobile filters content */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Asset Type</p>
                    <div className="flex flex-wrap gap-2">
                      {assetTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedCategory(type.id === 'all' ? null : type.id)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                            (selectedCategory === type.id) || (type.id === 'all' && !selectedCategory)
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 flex flex-col pt-14 lg:pt-0">
            {/* Header */}
            <div className="flex-shrink-0 px-4 lg:px-6 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between gap-4">
                {/* Asset Type Badges */}
                <div className="hidden md:flex items-center gap-1.5">
                  {assetTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedCategory(type.id === 'all' ? null : type.id)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                        (selectedCategory === type.id) || (type.id === 'all' && !selectedCategory)
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Right: Search + Wallet */}
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative hidden sm:block">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-40 lg:w-48 pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none focus:bg-white focus:border-gray-300 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Wallet Button */}
                  <button
                    onClick={() => open()}
                    className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      isConnected
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    <Wallet size={14} />
                    {isConnected && address
                      ? `${address.slice(0, 4)}...${address.slice(-4)}`
                      : 'Connect Wallet'
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* Assets Grid */}
            <div className="flex-1 bg-gray-50/50 overflow-y-auto">
              <div className="p-4 lg:p-6">
                {filteredAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-sm text-gray-500 mb-2">No assets found</p>
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedStatus(null);
                        setApyValue([0, 25]);
                        setMinInvestValue(0);
                        setTokenPriceValue(1000);
                        setSearchQuery('');
                      }}
                      className="text-xs text-gray-900 underline"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filteredAssets.map((asset) => (
                      <AssetCard key={asset.id} asset={asset} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

// Asset Card
function AssetCard({ asset }: { asset: MarketplaceAsset }) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div
      onClick={() => navigate(`/marketplace/${asset.ticker}`)}
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="relative w-full h-36 overflow-hidden bg-gray-100">
        <img
          src={asset.imageUrl || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600'}
          alt={asset.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2.5 left-2.5">
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
            asset.status === 'active'
              ? 'bg-gray-900 text-white'
              : 'bg-white/90 text-gray-600'
          }`}>
            {asset.status === 'active' ? 'Live' : 'Soon'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <p className="text-[10px] text-gray-400 font-mono mb-0.5">{asset.ticker}</p>
          <h3 className="text-sm font-medium text-gray-900 leading-tight line-clamp-1">
            {asset.name}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-[9px] text-gray-400 uppercase">Price</p>
            <p className="text-sm font-medium text-gray-900">${asset.tokenPrice?.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-gray-400 uppercase">APY</p>
            <p className="text-sm font-medium text-gray-900">{asset.estimatedApy}%</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-400 uppercase">Min</p>
            <p className="text-sm font-medium text-gray-900">{formatCurrency(asset.minInvestment)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
