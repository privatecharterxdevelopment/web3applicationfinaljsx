/**
 * Asset Marketplace Detail - Individual Asset Page
 *
 * Monochromatic, luxury design with full-width header image.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  FileText,
  Users,
  Download,
  Lock,
  Wallet,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { AssetService, type MarketplaceAsset } from '../services/polymesh';

// Tab types
type TabType = 'overview' | 'tokenomics' | 'documents';

export default function AssetMarketplaceDetail() {
  const navigate = useNavigate();
  const { ticker } = useParams<{ ticker: string }>();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  // State
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<MarketplaceAsset | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  // Load asset
  useEffect(() => {
    if (ticker) {
      loadAsset();
    }
  }, [ticker]);

  const loadAsset = async () => {
    setLoading(true);
    try {
      const data = await AssetService.getAssetByTicker(ticker!);
      setAsset(data);
      const docs = await AssetService.getAssetDocuments(ticker!);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading asset:', error);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  // Mock chart data
  const chartData = useMemo(() => {
    if (!asset) return [];
    const basePrice = asset.tokenPrice || 100;
    const data = [];
    for (let i = 0; i < 30; i++) {
      const variance = (Math.random() - 0.45) * 5;
      const price = basePrice + (i * 0.5) + variance;
      data.push({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Math.max(price, basePrice * 0.95)
      });
    }
    return data;
  }, [asset?.tokenPrice]);

  // Calculate tokens
  const tokensToReceive = useMemo(() => {
    const amount = parseFloat(investmentAmount) || 0;
    const price = asset?.tokenPrice || 1;
    return Math.floor(amount / price);
  }, [investmentAmount, asset?.tokenPrice]);

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // Copy address
  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Funding progress
  const fundingProgress = asset?.targetAmount
    ? Math.min(((asset.raisedAmount || 0) / asset.targetAmount) * 100, 100)
    : 0;

  // Loading screen
  if (loading) {
    return (
      <div className="h-[100dvh] font-['DM_Sans'] relative overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/istockphoto-1733442081-640_adpp_is.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9pc3RvY2twaG90by0xNzMzNDQyMDgxLTY0MF9hZHBwX2lzLm1wNCIsImlhdCI6MTc1OTUyMDc5MCwiZXhwIjoxNzkxMDU2NzkwfQ.P5Hr5zLzhYdk5sjvXuPs1clfrt4nLZhKDhbF0gvH5Ss" type="video/mp4" />
        </video>
        <div className="relative z-10 h-full flex items-center justify-center">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-20 h-20 object-contain"
          >
            <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/videoExport-2025-10-19@14-08-49.871-540x540@60fps.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="h-[100dvh] font-['DM_Sans'] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Asset not found</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'tokenomics', label: 'Tokenomics' },
    { id: 'documents', label: 'Documents' }
  ];

  return (
    <div className="h-[100dvh] font-['DM_Sans'] relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/istockphoto-1733442081-640_adpp_is.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9pc3RvY2twaG90by0xNzMzNDQyMDgxLTY0MF9hZHBwX2lzLm1wNCIsImlhdCI6MTc1OTUyMDc5MCwiZXhwIjoxNzkxMDU2NzkwfQ.P5Hr5zLzhYdk5sjvXuPs1clfrt4nLZhKDhbF0gvH5Ss" type="video/mp4" />
      </video>

      {/* Main Container */}
      <div className="relative z-10 h-full bg-white/30 backdrop-blur-3xl overflow-hidden" style={{ backdropFilter: 'blur(60px) saturate(120%)' }}>
        <div className="h-full overflow-y-auto">
          {/* Hero Header with Image */}
          <div className="relative h-72 lg:h-80">
            <img
              src={asset.coverImageUrl || asset.imageUrl || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200'}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

            {/* Back Button */}
            <button
              onClick={() => navigate('/marketplace')}
              className="absolute top-5 left-5 flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white/90 hover:bg-white/20 transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {/* Status Badge */}
            <div className="absolute top-5 right-5">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                asset.status === 'active'
                  ? 'bg-white/90 text-gray-900'
                  : 'bg-white/20 text-white'
              }`}>
                {asset.status === 'active' ? 'Live' : 'Coming Soon'}
              </span>
            </div>

            {/* Asset Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="max-w-5xl mx-auto flex items-end justify-between">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">
                    {asset.assetType || 'Security Token'}
                  </p>
                  <h1 className="text-2xl lg:text-3xl font-light text-white tracking-tight mb-2">
                    {asset.name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-white/10 text-white text-xs font-mono rounded">
                      {asset.ticker}
                    </span>
                    <div className="flex items-center gap-1 text-white/60 text-xs">
                      <MapPin size={12} />
                      {asset.location}
                    </div>
                  </div>
                </div>
                <div className="text-right hidden lg:block">
                  <p className="text-white/50 text-xs mb-1">Token Price</p>
                  <p className="text-2xl font-light text-white">${asset.tokenPrice?.toFixed(2)}</p>
                  {asset.estimatedApy && (
                    <p className="text-white/70 text-xs mt-1 flex items-center justify-end gap-1">
                      <TrendingUp size={12} />
                      {asset.estimatedApy}% APY
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Content */}
              <div className="lg:col-span-2">
                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-white/50 rounded-xl mb-6 w-fit">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">About</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{asset.description}</p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label: 'Total Value', value: formatCurrency(asset.targetAmount) },
                          { label: 'Est. APY', value: `${asset.estimatedApy}%` },
                          { label: 'Min Investment', value: formatCurrency(asset.minInvestment) },
                          { label: 'Token Supply', value: parseInt(asset.totalSupply).toLocaleString() }
                        ].map((stat, i) => (
                          <div key={i} className="bg-gray-50/80 rounded-xl p-4">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{stat.label}</p>
                            <p className="text-base font-medium text-gray-900 mt-1">{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Mini Chart */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Price History</h4>
                        <div className="h-32 bg-gray-50/80 rounded-xl p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#111827" stopOpacity={0.1} />
                                  <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-gray-900 text-white px-2 py-1 rounded text-[10px]">
                                        ${payload[0].value?.toFixed(2)}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Area type="monotone" dataKey="price" stroke="#111827" strokeWidth={1.5} fill="url(#priceGrad)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tokenomics' && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-medium text-gray-900">Token Details</h3>
                      <div className="divide-y divide-gray-100">
                        {[
                          { label: 'Token Standard', value: 'Polymesh Security Token' },
                          { label: 'Compliance', value: 'SEC Reg D 506(c)' },
                          { label: 'Total Supply', value: `${parseInt(asset.totalSupply).toLocaleString()} tokens` },
                          { label: 'Token Price', value: `$${asset.tokenPrice?.toFixed(2)}` },
                          { label: 'Min Investment', value: formatCurrency(asset.minInvestment) },
                          { label: 'Max Investment', value: formatCurrency(asset.maxInvestment) },
                          { label: 'Divisible', value: asset.isDivisible ? 'Yes' : 'No' },
                          { label: 'Funding Round', value: asset.fundingRound || 'Series A' }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-3">
                            <span className="text-xs text-gray-500">{item.label}</span>
                            <span className="text-xs font-medium text-gray-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900">Legal Documents</h3>
                      {documents.length > 0 ? (
                        <div className="space-y-2">
                          {documents.map((doc, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                                  <FileText size={14} className="text-gray-500" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-900">{doc.name}</p>
                                  <p className="text-[10px] text-gray-400">PDF Document</p>
                                </div>
                              </div>
                              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] text-gray-600 hover:text-gray-900">
                                <Download size={12} />
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50/80 rounded-xl">
                          <div className="flex items-start gap-2">
                            <Lock size={14} className="text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-gray-700">Documents Restricted</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                Connect wallet and complete KYC to access legal documents.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Investment Widget */}
              <div className="lg:col-span-1">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 sticky top-6 space-y-4">
                  {/* Mobile Price Display */}
                  <div className="lg:hidden flex items-center justify-between pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400">Token Price</p>
                      <p className="text-xl font-medium text-gray-900">${asset.tokenPrice?.toFixed(2)}</p>
                    </div>
                    {asset.estimatedApy && (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400">Est. APY</p>
                        <p className="text-lg font-medium text-gray-900">{asset.estimatedApy}%</p>
                      </div>
                    )}
                  </div>

                  {/* Wallet Status */}
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        isConnected ? 'bg-gray-200' : 'bg-gray-100'
                      }`}>
                        <Wallet size={12} className={isConnected ? 'text-gray-700' : 'text-gray-400'} />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400">{isConnected ? 'Connected' : 'Wallet'}</p>
                        <p className="text-[10px] font-medium text-gray-900">
                          {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {isConnected && address ? (
                      <button onClick={() => copyAddress(address)} className="text-gray-400 hover:text-gray-600">
                        {copied ? <Check size={12} className="text-gray-700" /> : <Copy size={12} />}
                      </button>
                    ) : (
                      <button onClick={() => open?.()} className="px-3 py-1.5 bg-gray-900 text-white text-[10px] font-medium rounded-lg">
                        Connect
                      </button>
                    )}
                  </div>

                  {/* Funding Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Users size={10} />
                        Funding Progress
                      </span>
                      <span className="text-[10px] font-medium text-gray-700">{fundingProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-800 rounded-full" style={{ width: `${fundingProgress}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[9px] text-gray-400">{formatCurrency(asset.raisedAmount)}</span>
                      <span className="text-[9px] text-gray-400">{formatCurrency(asset.targetAmount)}</span>
                    </div>
                  </div>

                  {/* Investment Input */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1.5 block">Investment Amount</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={investmentAmount}
                          onChange={(e) => setInvestmentAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-3 bg-gray-50/80 border border-gray-200/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400">USDC</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 mb-1.5 block">You Receive</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={tokensToReceive.toLocaleString()}
                          readOnly
                          className="w-full px-3 py-3 bg-gray-100/80 border border-gray-200/50 rounded-xl text-sm font-medium text-gray-700"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400">{asset.ticker}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[1000, 5000, 10000, 25000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setInvestmentAmount(amount.toString())}
                        className="py-2 bg-gray-100/80 hover:bg-gray-200/80 rounded-lg text-[10px] font-medium text-gray-600 transition-colors"
                      >
                        ${(amount / 1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      if (!isConnected) {
                        open?.();
                      } else {
                        alert('Investment flow will redirect to Polymesh settlement');
                      }
                    }}
                    disabled={isConnected && (!investmentAmount || tokensToReceive <= 0)}
                    className="w-full py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {!isConnected ? 'Connect Wallet' : 'Invest Now'}
                  </button>

                  {/* Disclaimer */}
                  <div className="p-3 bg-gray-50/80 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[9px] text-gray-500 leading-relaxed">
                        Securities involve significant risk including potential loss of principal. Past performance is not indicative of future results.
                      </p>
                    </div>
                  </div>

                  {/* Polymesh Badge */}
                  <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-gray-100">
                    <span className="text-[9px] text-gray-400">Secured by Polymesh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
