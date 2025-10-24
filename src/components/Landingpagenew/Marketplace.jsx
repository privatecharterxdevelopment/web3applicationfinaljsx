import React, { useState, useEffect } from 'react';
import {
  Package, TrendingUp, Shield, AlertCircle, Info, Filter,
  ChevronDown, ExternalLink, CheckCircle, Clock, Plane,
  Ship, Car, Palette, Building2, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import AssetDetailModal from './Marketplace/AssetDetailModal';
import PageHeader from './PageHeader';
import Button from './Button';

export default function Marketplace() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userKYCStatus, setUserKYCStatus] = useState(null);

  const categories = [
    { id: 'all', label: 'All Assets', icon: Package },
    { id: 'jets', label: 'Private Jets', icon: Plane },
    { id: 'yachts', label: 'Yachts', icon: Ship },
    { id: 'helicopters', label: 'Helicopters', icon: Building2 },
    { id: 'cars', label: 'Luxury Cars', icon: Car },
    { id: 'art', label: 'Art & Collectibles', icon: Palette },
    { id: 'real-estate', label: 'Real Estate', icon: Building2 }
  ];

  useEffect(() => {
    fetchAssets();
    if (user) {
      checkKYCStatus();
    }
  }, [user]);

  useEffect(() => {
    filterAssets();
  }, [assets, categoryFilter]);

  const checkKYCStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('kyc_status')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setUserKYCStatus(data.kyc_status);
      }
    } catch (error) {
      console.error('Error checking KYC:', error);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      // Fetch tokenization requests that are approved for STO marketplace
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          *,
          user_profiles!inner(first_name, last_name, email)
        `)
        .eq('type', 'tokenization')
        .in('status', ['approved_for_sto', 'live_on_marketplace'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format assets data
      const formattedAssets = data?.map(asset => ({
        id: asset.id,
        name: asset.data?.asset_name || 'Unnamed Asset',
        description: asset.data?.description || '',
        category: mapAssetTypeToCategory(asset.data?.asset_type),
        assetType: asset.data?.asset_type,
        tokenType: asset.data?.token_type || 'Security Token',
        totalValue: asset.estimated_cost || 0,
        totalSupply: asset.data?.total_supply || 100,
        minInvestment: asset.data?.min_investment || 1000,
        pricePerToken: (asset.estimated_cost || 0) / (asset.data?.total_supply || 100),
        soldTokens: 0, // Will be calculated from sto_investments table
        availableTokens: asset.data?.total_supply || 100,
        status: asset.status,
        images: asset.data?.images || [],
        specifications: asset.data?.specifications || {},
        owner: {
          name: `${asset.user_profiles.first_name} ${asset.user_profiles.last_name}`,
          email: asset.user_profiles.email
        },
        contractAddress: asset.data?.contract_address || null,
        createdAt: asset.created_at,
        launchDate: asset.data?.launch_date || null
      })) || [];

      setAssets(formattedAssets);
    } catch (error) {
      console.error('Failed to fetch marketplace assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const mapAssetTypeToCategory = (assetType) => {
    const mapping = {
      'private-jet': 'jets',
      'yacht': 'yachts',
      'helicopter': 'helicopters',
      'luxury-car': 'cars',
      'art': 'art',
      'real-estate': 'real-estate'
    };
    return mapping[assetType] || 'other';
  };

  const filterAssets = () => {
    if (categoryFilter === 'all') {
      setFilteredAssets(assets);
    } else {
      setFilteredAssets(assets.filter(asset => asset.category === categoryFilter));
    }
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : Package;
  };

  const getStatusBadge = (status) => {
    if (status === 'live_on_marketplace') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <CheckCircle size={12} />
          Live
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
        <Clock size={12} />
        Coming Soon
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-transparent flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <PageHeader
            title="Luxury Asset Marketplace"
            subtitle="Invest in fractional ownership of premium assets"
          />

          {/* KYC Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                  KYC/AML Verification Required
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  All investments require identity verification to comply with securities regulations.
                  {userKYCStatus === 'verified' ? (
                    <span className="ml-2 inline-flex items-center gap-1 text-green-700">
                      <CheckCircle size={14} />
                      Your account is verified
                    </span>
                  ) : (
                    <span className="ml-2 text-yellow-900 font-medium">
                      Complete KYC to invest
                    </span>
                  )}
                </p>
                {userKYCStatus !== 'verified' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-yellow-900 hover:text-yellow-700 underline"
                  >
                    Start Verification →
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = categoryFilter === category.id;
              return (
                <Button
                  key={category.id}
                  onClick={() => setCategoryFilter(category.id)}
                  variant={isActive ? 'primary' : 'secondary'}
                  size="sm"
                  icon={<Icon size={16} />}
                  className="whitespace-nowrap"
                >
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-20">
            <Package size={64} className="text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Assets Available</h3>
            <p className="text-gray-600 mb-6">
              {categoryFilter === 'all'
                ? 'No luxury assets are currently listed on the marketplace.'
                : 'No assets available in this category.'}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <Info size={20} className="text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-800">
                Assets are reviewed and approved by our team before listing.
                Check back soon for new opportunities!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => {
              const CategoryIcon = getCategoryIcon(asset.category);
              const soldPercentage = (asset.soldTokens / asset.totalSupply) * 100;

              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowDetailModal(true);
                  }}
                  className="bg-white/35 hover:bg-white/50 rounded-xl border border-gray-300/50 backdrop-blur-xl transition-all duration-300 cursor-pointer hover:shadow-lg group"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                    {asset.images && asset.images.length > 0 ? (
                      <img
                        src={asset.images[0]}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <CategoryIcon size={48} className="text-gray-400" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(asset.status)}
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <CategoryIcon size={14} className="text-gray-700" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                        {asset.name}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {asset.description || 'Premium luxury asset available for fractional investment'}
                      </p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-300/30">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Value</p>
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(asset.totalValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Min Investment</p>
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(asset.minInvestment)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>Funding Progress</span>
                        <span className="font-medium">{soldPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gray-700 to-gray-900 transition-all duration-500"
                          style={{ width: `${soldPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {asset.availableTokens} of {asset.totalSupply} shares available
                      </p>
                    </div>

                    {/* CTA Button */}
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      icon={<ExternalLink size={14} />}
                      iconPosition="right"
                      className="group-hover:shadow-lg"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/30 backdrop-blur-md rounded-xl p-6 border border-gray-300/40">
            <Shield size={32} className="text-gray-700 mb-3" />
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Secure & Compliant</h4>
            <p className="text-xs text-gray-600">
              All assets are tokenized using audited smart contracts and comply with securities regulations.
            </p>
          </div>

          <div className="bg-white/30 backdrop-blur-md rounded-xl p-6 border border-gray-300/40">
            <Sparkles size={32} className="text-gray-700 mb-3" />
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Fractional Ownership</h4>
            <p className="text-xs text-gray-600">
              Own a fraction of premium assets starting from $1,000. Diversify your luxury portfolio.
            </p>
          </div>

          <div className="bg-white/30 backdrop-blur-md rounded-xl p-6 border border-gray-300/40">
            <TrendingUp size={32} className="text-gray-700 mb-3" />
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Liquidity & Trading</h4>
            <p className="text-xs text-gray-600">
              Trade your shares on the secondary market. P2P trading coming soon.
            </p>
          </div>
        </div>
      </div>

      {/* Asset Detail Modal */}
      {showDetailModal && selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          userKYCStatus={userKYCStatus}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAsset(null);
          }}
          onRefresh={fetchAssets}
        />
      )}
    </div>
  );
}
