/**
 * MarketplaceAssetDetail - Tokenized Asset Detail Page
 *
 * Glassmorphic design with full-width image header.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Shield,
  FileText,
  Users,
  Building2,
  BarChart3,
  Table,
  History,
  ExternalLink,
  Check,
  AlertCircle,
  Wallet,
  Copy,
  Download,
  Lock,
  Loader2,
  MapPin,
  Plane,
  Ship,
  Car
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { type MarketplaceAsset, AssetService } from '../../services/polymesh';
import { useAuth } from '../../context/AuthContext';

// Tab types
type TabType = 'overview' | 'sto' | 'chart' | 'metrics' | 'data' | 'cap-table' | 'transactions' | 'documents';

// Props
interface MarketplaceAssetDetailProps {
  asset: MarketplaceAsset;
  onBack: () => void;
}

export default function MarketplaceAssetDetail({ asset, onBack }: MarketplaceAssetDetailProps) {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [marketType, setMarketType] = useState<'primary' | 'secondary'>('primary');
  const [chartPeriod, setChartPeriod] = useState('1M');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  // Mock chart data
  const chartData = useMemo(() => {
    const basePrice = asset.tokenPrice || 100;
    const periods = 30;
    const data = [];

    for (let i = 0; i < periods; i++) {
      const variance = (Math.random() - 0.45) * 5;
      const price = basePrice + (i * 0.5) + variance;
      data.push({
        date: new Date(Date.now() - (periods - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Math.max(price, basePrice * 0.95),
        volume: Math.floor(Math.random() * 100000) + 50000
      });
    }
    return data;
  }, [asset.tokenPrice]);

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, [asset.ticker]);

  const loadDocuments = async () => {
    const docs = await AssetService.getAssetDocuments(asset.ticker);
    setDocuments(docs);
  };

  // Calculate tokens from amount
  const tokensToReceive = useMemo(() => {
    const amount = parseFloat(investmentAmount) || 0;
    const price = asset.tokenPrice || 1;
    return Math.floor(amount / price);
  }, [investmentAmount, asset.tokenPrice]);

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Copy address
  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle investment
  const handleInvest = async () => {
    if (!isConnected) {
      open?.();
      return;
    }

    if (!investmentAmount || tokensToReceive <= 0) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Investment flow will redirect to Polymesh settlement');
    }, 1500);
  };

  // Funding progress
  const fundingProgress = asset.targetAmount
    ? Math.min(((asset.raisedAmount || 0) / asset.targetAmount) * 100, 100)
    : 0;

  // Category icon
  const getCategoryIcon = () => {
    switch (asset.category) {
      case 'private-jet': return Plane;
      case 'yacht': return Ship;
      case 'luxury-car': return Car;
      default: return Building2;
    }
  };
  const CategoryIcon = getCategoryIcon();

  // Tabs configuration
  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'sto', label: 'STO' },
    { id: 'chart', label: 'Chart' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'data', label: 'Data' },
    { id: 'cap-table', label: 'Cap Table' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'documents', label: 'Documents' }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Hero Header with Image */}
      <div className="relative h-56 md:h-64 flex-shrink-0">
        <img
          src={asset.coverImageUrl || asset.imageUrl || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200'}
          alt={asset.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-white/90 hover:bg-white/20 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Badges */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
            asset.status === 'active'
              ? 'bg-emerald-500/90 text-white'
              : 'bg-amber-500/90 text-white'
          }`}>
            {asset.status === 'active' ? 'Live' : 'Coming Soon'}
          </span>
          <div className="px-2.5 py-1 bg-purple-500/90 backdrop-blur-sm rounded-lg flex items-center gap-1.5">
            <span className="text-white text-xs font-medium">Polymesh</span>
          </div>
        </div>

        {/* Asset Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CategoryIcon size={14} className="text-white/60" />
                <span className="text-xs text-white/60">{asset.assetType || 'Security Token'}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-light text-white tracking-tight font-['DM_Sans']">
                {asset.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-0.5 bg-white/10 text-white text-xs font-mono rounded">
                  {asset.ticker}
                </span>
                <div className="flex items-center gap-1 text-white/60 text-xs">
                  <MapPin size={12} />
                  {asset.location}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs mb-0.5">Token Price</p>
              <p className="text-2xl font-semibold text-white">${asset.tokenPrice?.toFixed(2)}</p>
              {asset.estimatedApy && (
                <p className="text-emerald-400 text-xs font-medium flex items-center justify-end gap-1 mt-1">
                  <TrendingUp size={12} />
                  {asset.estimatedApy}% APY
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-shrink-0 border-b border-gray-200/50 px-5 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column - Tab Content */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-5">
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">About</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{asset.description}</p>
                    </div>

                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Value', value: formatCurrency(asset.targetAmount), sub: 'Asset valuation' },
                        { label: 'Est. APY', value: `${asset.estimatedApy}%`, sub: 'Annual return', highlight: true },
                        { label: 'Holders', value: '127', sub: 'Verified investors' },
                        { label: '30d Volume', value: '$243K', sub: '+12% vs last month' }
                      ].map((stat, i) => (
                        <div key={i} className="bg-gray-50/80 rounded-xl p-3">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</p>
                          <p className={`text-base font-semibold mt-0.5 ${stat.highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {stat.value}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Mini Chart */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Price History</h4>
                        <div className="flex gap-1">
                          {['1W', '1M', '3M', 'ALL'].map((period) => (
                            <button
                              key={period}
                              onClick={() => setChartPeriod(period)}
                              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                                chartPeriod === period
                                  ? 'bg-gray-900 text-white'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {period}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
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
                            <Area type="monotone" dataKey="price" stroke="#111827" strokeWidth={1.5} fill="url(#colorPrice)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'sto' && (
                  <div className="space-y-5">
                    <h3 className="text-sm font-medium text-gray-900">Security Token Offering</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Token Standard', value: 'Polymesh Security Token' },
                        { label: 'Compliance', value: 'SEC Reg D 506(c)' },
                        { label: 'Total Supply', value: `${parseInt(asset.totalSupply).toLocaleString()} tokens` },
                        { label: 'Funding Round', value: asset.fundingRound || 'Series A' }
                      ].map((item, i) => (
                        <div key={i} className="bg-gray-50/80 rounded-xl p-3">
                          <p className="text-[10px] text-gray-500">{item.label}</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-medium text-gray-700 mb-3">Compliance Requirements</h4>
                      <div className="space-y-2">
                        {['KYC/AML Verification', 'Accredited Investor (US)', 'Jurisdiction Allowed', '12-Month Lock-up'].map((req, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <Check size={12} className="text-emerald-500" />
                            {req}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chart' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Price Chart</h3>
                      <div className="flex gap-1">
                        {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((period) => (
                          <button
                            key={period}
                            onClick={() => setChartPeriod(period)}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                              chartPeriod === period
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPrice2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#111827" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                                    ${payload[0].value?.toFixed(2)}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area type="monotone" dataKey="price" stroke="#111827" strokeWidth={1.5} fill="url(#colorPrice2)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {activeTab === 'metrics' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Market Cap', value: formatCurrency((asset.tokenPrice || 0) * parseInt(asset.totalSupply)), change: '+5.2%' },
                        { label: 'Fully Diluted Value', value: formatCurrency(asset.targetAmount), change: '+2.1%' },
                        { label: 'Circulating Supply', value: `${(parseInt(asset.totalSupply) * 0.45).toLocaleString()}`, change: '45%' },
                        { label: 'Total Supply', value: parseInt(asset.totalSupply).toLocaleString() },
                        { label: '24h Volume', value: '$125K', change: '+18%' },
                        { label: 'Holders', value: '127', change: '+3' },
                        { label: 'Avg. Hold Time', value: '45 days' },
                        { label: 'Dividend Yield', value: `${asset.estimatedApy}%` }
                      ].map((metric, i) => (
                        <div key={i} className="bg-gray-50/80 rounded-xl p-3">
                          <p className="text-[10px] text-gray-500">{metric.label}</p>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <p className="text-sm font-semibold text-gray-900">{metric.value}</p>
                            {metric.change && (
                              <span className={`text-[10px] font-medium ${metric.change.startsWith('+') ? 'text-emerald-600' : 'text-gray-500'}`}>
                                {metric.change}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'data' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Asset Data</h3>
                    <div className="divide-y divide-gray-100">
                      {[
                        { label: 'Asset Type', value: asset.assetType },
                        { label: 'Category', value: asset.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
                        { label: 'Location', value: asset.location },
                        { label: 'Owner DID', value: asset.ownerDid?.slice(0, 20) + '...' },
                        { label: 'Created', value: asset.createdAt },
                        { label: 'Divisible', value: asset.isDivisible ? 'Yes' : 'No' },
                        { label: 'Min Investment', value: formatCurrency(asset.minInvestment) },
                        { label: 'Max Investment', value: formatCurrency(asset.maxInvestment) }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2.5">
                          <span className="text-xs text-gray-500">{item.label}</span>
                          <span className="text-xs font-medium text-gray-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'cap-table' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Cap Table</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-500 border-b border-gray-100">
                            <th className="pb-2 font-medium">Holder</th>
                            <th className="pb-2 font-medium">Tokens</th>
                            <th className="pb-2 font-medium">%</th>
                            <th className="pb-2 font-medium">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {[
                            { did: '0x1234...5678', tokens: 2500, pct: 25 },
                            { did: '0xabcd...ef01', tokens: 1500, pct: 15 },
                            { did: '0x9876...5432', tokens: 1000, pct: 10 },
                            { did: '0xfedc...ba98', tokens: 800, pct: 8 },
                            { did: 'Other Holders', tokens: 4200, pct: 42 }
                          ].map((holder, i) => (
                            <tr key={i}>
                              <td className="py-2 font-mono text-gray-600">{holder.did}</td>
                              <td className="py-2 text-gray-900">{holder.tokens.toLocaleString()}</td>
                              <td className="py-2 text-gray-900">{holder.pct}%</td>
                              <td className="py-2 font-medium text-gray-900">{formatCurrency(holder.tokens * (asset.tokenPrice || 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'transactions' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Recent Transactions</h3>
                    <div className="space-y-2">
                      {[
                        { type: 'Buy', amount: 500, price: asset.tokenPrice, time: '2h ago', hash: '0x1234...5678' },
                        { type: 'Buy', amount: 250, price: asset.tokenPrice, time: '5h ago', hash: '0xabcd...ef01' },
                        { type: 'Sell', amount: 100, price: (asset.tokenPrice || 0) * 0.98, time: '1d ago', hash: '0x9876...5432' },
                        { type: 'Buy', amount: 1000, price: (asset.tokenPrice || 0) * 0.95, time: '2d ago', hash: '0xfedc...ba98' }
                      ].map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50/80 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              tx.type === 'Buy' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {tx.type === 'Buy' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900">{tx.type} {tx.amount} tokens</p>
                              <p className="text-[10px] text-gray-400">{tx.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-900">${tx.price?.toFixed(2)}/token</p>
                            <button className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                              {tx.hash} <ExternalLink size={8} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Legal Documents</h3>
                    <div className="space-y-2">
                      {documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                              <FileText size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900">{doc.name}</p>
                              <p className="text-[10px] text-gray-400">PDF</p>
                            </div>
                          </div>
                          <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] text-gray-600 hover:text-gray-900">
                            <Download size={12} />
                            Download
                          </button>
                        </div>
                      ))}

                      {!isConnected && (
                        <div className="p-3 bg-amber-50/80 border border-amber-200/50 rounded-xl">
                          <div className="flex items-start gap-2">
                            <Lock size={14} className="text-amber-600 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-amber-900">Documents Restricted</p>
                              <p className="text-[10px] text-amber-700 mt-0.5">
                                Connect wallet and complete KYC to access.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Investment Widget */}
            <div className="lg:col-span-1">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 sticky top-4 space-y-4">
                {/* Market Type Toggle */}
                <div className="flex bg-gray-100/80 rounded-lg p-0.5">
                  <button
                    onClick={() => setMarketType('primary')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      marketType === 'primary'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Primary
                  </button>
                  <button
                    onClick={() => setMarketType('secondary')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      marketType === 'secondary'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Secondary
                  </button>
                </div>

                {/* Wallet Status */}
                <div className="flex items-center justify-between p-2.5 bg-gray-50/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isConnected ? 'bg-emerald-100' : 'bg-gray-200'
                    }`}>
                      <Wallet size={12} className={isConnected ? 'text-emerald-600' : 'text-gray-400'} />
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
                      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  ) : (
                    <button onClick={() => open?.()} className="px-2 py-1 bg-gray-900 text-white text-[10px] font-medium rounded-md">
                      Connect
                    </button>
                  )}
                </div>

                {/* Funding Progress */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Users size={10} />
                      Funding
                    </span>
                    <span className="text-[10px] font-medium text-gray-700">{fundingProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-800 rounded-full" style={{ width: `${fundingProgress}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-gray-400">{formatCurrency(asset.raisedAmount)}</span>
                    <span className="text-[9px] text-gray-400">{formatCurrency(asset.targetAmount)}</span>
                  </div>
                </div>

                {/* Investment Input */}
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Pay</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                        placeholder="0.00"
                        min={asset.minInvestment}
                        max={asset.maxInvestment}
                        className="w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400">USDC</span>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1">
                      Min: {formatCurrency(asset.minInvestment)} | Max: {formatCurrency(asset.maxInvestment)}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Receive</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tokensToReceive.toLocaleString()}
                        readOnly
                        className="w-full px-3 py-2.5 bg-gray-100/80 border border-gray-200/50 rounded-xl text-sm font-medium text-gray-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400">{asset.ticker}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1">@ ${asset.tokenPrice?.toFixed(2)}/token</p>
                  </div>
                </div>

                {/* Quick Amounts */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[1000, 5000, 10000, 25000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setInvestmentAmount(amount.toString())}
                      className="py-1.5 bg-gray-100/80 hover:bg-gray-200/80 rounded-lg text-[10px] font-medium text-gray-600 transition-colors"
                    >
                      ${(amount / 1000).toFixed(0)}K
                    </button>
                  ))}
                </div>

                {/* Invest Button */}
                <button
                  onClick={handleInvest}
                  disabled={loading || !investmentAmount || tokensToReceive <= 0}
                  className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : !isConnected ? (
                    'Connect Wallet'
                  ) : (
                    'Invest Now'
                  )}
                </button>

                {/* Disclaimer */}
                <div className="p-2.5 bg-amber-50/80 border border-amber-200/50 rounded-xl">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-[9px] text-amber-800 leading-relaxed">
                      <strong>Risk:</strong> Securities involve significant risk. Past performance is not indicative of future results.
                    </p>
                  </div>
                </div>

                {/* Polymesh Badge */}
                <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-gray-100">
                  <div className="w-3 h-3 bg-purple-600 rounded flex items-center justify-center">
                    <span className="text-white text-[6px] font-bold">P</span>
                  </div>
                  <span className="text-[9px] text-gray-400">Secured by Polymesh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
