import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, TrendingUp, FileText, Shield, Check, Loader2,
  ExternalLink, Info, Building2, ChevronDown, Wallet, Copy
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import LandingHeader from '../components/Landingpagenew/LandingHeader';
import Footer from '../components/Landingpagenew/Footer';

interface TokenizedAsset {
  id: string;
  name: string;
  description: string;
  category: string;
  asset_type: string;
  location: string;
  year: number;
  image_url: string;
  cover_image_url: string;
  token_standard: string;
  token_symbol: string;
  token_price: number;
  total_supply: number;
  target_amount: number;
  min_investment: number;
  max_investment: number;
  estimated_apy: number;
  revenue_model: string;
  current_phase: string;
  status: string;
  current_waitlist: number;
  target_waitlist: number;
}

export default function TokenizedAssetMarketplaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  const [asset, setAsset] = useState<TokenizedAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartPeriod, setChartPeriod] = useState('1M');
  const [copied, setCopied] = useState(false);

  // Mock chart data
  const chartData = useMemo(() => {
    const dataPoints = [
      { month: 'Aug', y: 45 },
      { month: 'Sep', y: 42 },
      { month: 'Oct', y: 48 },
      { month: 'Nov', y: 52 },
      { month: 'Dec', y: 55 },
      { month: 'Jan', y: 58 },
      { month: 'Feb', y: 62 }
    ];
    return dataPoints.map((point, index) => ({
      name: point.month,
      value: 100 - point.y,
    }));
  }, []);

  useEffect(() => {
    if (id) {
      loadAsset();
      checkWaitlist();
    }
  }, [id, user]);

  const loadAsset = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('launchpad_projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setAsset(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkWaitlist = async () => {
    if (!user?.email || !id) return;
    try {
      const { data } = await supabase
        .from('launchpad_waitlist')
        .select('id')
        .eq('launch_id', id)
        .eq('email', user.email)
        .single();
      setHasJoined(!!data);
    } catch {
      setHasJoined(false);
    }
  };

  const handleJoin = async () => {
    if (!form.name || !form.email) {
      setError('Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Invalid email');
      return;
    }

    setJoining(true);
    setError('');

    try {
      const { error } = await supabase.from('launchpad_waitlist').insert({
        launch_id: id,
        user_id: user?.id || null,
        email: form.email,
        wallet_address: address || 'pending',
        signature: 'waitlist_join',
        signature_message: `Join waitlist for ${asset?.name}`
      });

      if (error) {
        if (error.code === '23505') {
          setError('Already on waitlist');
        } else throw error;
        return;
      }

      await supabase
        .from('launchpad_projects')
        .update({ current_waitlist: (asset?.current_waitlist || 0) + 1 })
        .eq('id', id);

      setHasJoined(true);
      setSuccess(true);
      setShowModal(false);
      loadAsset();
    } catch (error) {
      setError('Failed to join. Try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleConnectWallet = () => {
    if (!isConnected && open) {
      open();
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <LandingHeader onGetStarted={() => navigate('/dashboard')} />
        <div className="flex items-center justify-center py-32">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <LandingHeader onGetStarted={() => navigate('/dashboard')} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Asset not found</p>
          <button onClick={() => navigate('/marketplace')} className="mt-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mx-auto">
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>
    );
  }

  const progress = asset.target_waitlist ? Math.min((asset.current_waitlist / asset.target_waitlist) * 100, 100) : 0;
  const tokenPrice = asset.token_price || 1.00;

  return (
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <LandingHeader onGetStarted={() => navigate('/dashboard')} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        {/* Back */}
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Marketplace
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-semibold">
                {asset.token_symbol?.slice(0, 1) || 'T'}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-900">{asset.token_symbol || 'TKN'}</h1>
              <p className="text-gray-500 text-xs">{asset.name}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-1 overflow-x-auto">
            {[
              { id: 'overview', icon: <TrendingUp size={12} />, label: 'Overview' },
              { id: 'details', icon: <Building2 size={12} />, label: 'Details' },
              { id: 'legal', icon: <Shield size={12} />, label: 'Legal' },
              { id: 'documents', icon: <FileText size={12} />, label: 'Docs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT - Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image */}
            <div className="aspect-[2/1] rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={asset.cover_image_url || asset.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200'}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">Total Value</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(asset.target_amount)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">Min. Investment</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(asset.min_investment)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">Est. APY</span>
                      <span className="text-sm font-medium text-green-600">{asset.estimated_apy || 8}%</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-gray-500">Token Price</span>
                      <span className="text-sm font-medium text-gray-900">${tokenPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <h2 className="text-2xl font-medium text-gray-900">${tokenPrice.toFixed(2)}</h2>
                          <span className="text-xs font-medium text-green-600">+{asset.estimated_apy || 8}%</span>
                        </div>
                        <p className="text-xs text-gray-500">Token Price (USD)</p>
                      </div>
                    </div>

                    <div className="h-20 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#000000"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400 px-2 mb-3">
                      <span>Aug</span>
                      <span>Nov</span>
                      <span>Now</span>
                    </div>

                    <div className="flex gap-1 pt-3 border-t border-gray-100">
                      {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
                        <button
                          key={period}
                          onClick={() => setChartPeriod(period)}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                            chartPeriod === period
                              ? 'bg-gray-900 text-white'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-gray-900">Asset Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Asset Type</p>
                      <p className="text-sm font-medium text-gray-900">{asset.asset_type || 'Security Token'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Token Standard</p>
                      <p className="text-sm font-medium text-gray-900">{asset.token_standard || 'ERC-1400'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Total Supply</p>
                      <p className="text-sm font-medium text-gray-900">{asset.total_supply?.toLocaleString() || '100,000'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Revenue Model</p>
                      <p className="text-sm font-medium text-gray-900">{asset.revenue_model || 'Charter Revenue'}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Description</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{asset.description}</p>
                  </div>
                </div>
              )}

              {activeTab === 'legal' && (
                <div className="space-y-3">
                  <h3 className="text-base font-medium text-gray-900">Legal & Compliance</h3>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={14} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Regulatory Status</span>
                    </div>
                    <p className="text-xs text-gray-600">SEC-compliant via tZERO partnership</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Info size={14} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Investor Requirements</span>
                    </div>
                    <p className="text-xs text-gray-600">Accredited investors • KYC/AML required</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Check size={12} className="text-green-600" />
                      Regulated security tokens
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check size={12} className="text-green-600" />
                      KYC/AML compliant
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check size={12} className="text-green-600" />
                      Blockchain ownership
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check size={12} className="text-green-600" />
                      Secondary trading
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-3">
                  <h3 className="text-base font-medium text-gray-900">Documents</h3>
                  {[
                    { name: 'Offering Memorandum', size: 'PDF', available: false },
                    { name: 'Subscription Agreement', size: 'PDF', available: false },
                    { name: 'Risk Disclosure', size: 'PDF', available: false }
                  ].map((doc, i) => (
                    <button
                      key={i}
                      disabled={!doc.available}
                      className="w-full p-3 bg-gray-50 rounded-xl text-left opacity-50 cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-700">{doc.name}</span>
                        </div>
                        <ExternalLink size={12} className="text-gray-400" />
                      </div>
                    </button>
                  ))}
                  <p className="text-[10px] text-gray-400 text-center">Available after KYC verification</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT - Investment Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24 space-y-4">
              {/* Wallet Connection */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-gray-200'}`}>
                    <Wallet size={14} className={isConnected ? 'text-green-600' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">{isConnected ? 'Connected' : 'Wallet'}</p>
                    <p className="text-xs font-medium text-gray-900">
                      {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                    </p>
                  </div>
                </div>
                {isConnected && address ? (
                  <button onClick={() => copyAddress(address)} className="text-gray-400 hover:text-gray-600">
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectWallet}
                    className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Waitlist Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Users size={12} />
                    Waitlist
                  </span>
                  <span className="text-xs font-medium text-gray-900">
                    {asset.current_waitlist || 0}/{asset.target_waitlist || 100}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-900 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2 py-3 border-y border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Target Raise</span>
                  <span className="font-medium text-gray-900">{formatCurrency(asset.target_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Min. Investment</span>
                  <span className="font-medium text-gray-900">{formatCurrency(asset.min_investment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Est. APY</span>
                  <span className="font-medium text-green-600 flex items-center gap-1">
                    <TrendingUp size={12} />
                    {asset.estimated_apy || 8}%
                  </span>
                </div>
              </div>

              {/* Success */}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-700 flex items-center gap-1.5">
                    <Check size={12} />
                    You're on the waitlist!
                  </p>
                </div>
              )}

              {/* CTA */}
              {hasJoined ? (
                <div className="text-center py-4 bg-gray-50 rounded-xl">
                  <Check size={20} className="mx-auto text-green-600 mb-1" />
                  <p className="text-sm font-medium text-gray-900">On Waitlist</p>
                  <p className="text-xs text-gray-500">We'll notify you when live</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Join Waitlist
                </button>
              )}

              {/* tZERO Badge */}
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-100">
                <Shield size={12} className="text-gray-400" />
                <span className="text-[10px] text-gray-400">SEC-regulated via tZERO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Join Waitlist</h3>
            <p className="text-xs text-gray-500 mb-4">
              Be notified when {asset.name} opens for investment.
            </p>

            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-gray-300 outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-gray-300 outline-none"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {joining ? <Loader2 size={14} className="animate-spin" /> : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
