import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Shield, CheckCircle, Clock, XCircle,
  TrendingUp, TrendingDown, FileText, Building2, Coins, AlertCircle, Edit, Eye, Download,
  Activity, DollarSign, Plane, Ship, Home as HomeIcon, Briefcase, Plus, ExternalLink,
  Sparkles, BarChart3, LineChart, PieChart, ArrowUpRight, ArrowDownRight, Wallet,
  Link as LinkIcon, Copy, Check, ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../../thefinalwebapplicationpcx-main/src/context/AuthContext';
import { web3Service } from '../../lib/web3';
import { useAccount } from 'wagmi';
import { LineChart as RechartsLineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart as RechartsBarChart, Bar } from 'recharts';
import LaunchpadTransactions from './LaunchpadTransactions';

export default function ProfileOverviewEnhanced() {
  const { user } = useAuth();
  const { address: walletAddress, isConnected, chain } = useAccount();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [tokenizedAssets, setTokenizedAssets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState({
    chartData: [],
    assetPerformance: [],
    interactionData: []
  });
  const [stats, setStats] = useState({
    totalValue: 0,
    totalAssets: 0,
    totalTransactions: 0,
    portfolioChange: 0,
    roi: 0
  });
  const [timeRange, setTimeRange] = useState('7d');
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (walletAddress) {
      fetchWalletTransactions();
    }
  }, [walletAddress, timeRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchTokenizedAssets(),
        fetchAnalytics()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setProfileData(data || {
        kyc_status: 'not_started',
        wallet_address: walletAddress,
        created_at: user.created_at
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTokenizedAssets = async () => {
    try {
      const { data: tokenRequests } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'tokenization')
        .order('created_at', { ascending: false });

      if (tokenRequests && tokenRequests.length > 0) {
        const assets = tokenRequests.map(asset => ({
          id: asset.id,
          name: asset.service_type || 'Asset',
          type: asset.details || 'Real Estate',
          tokens: Math.floor(Math.random() * 500),
          totalTokens: 1000,
          value: asset.estimated_cost || 0,
          change24h: (Math.random() * 10 - 5).toFixed(2),
          apy: (5 + Math.random() * 10).toFixed(2),
          status: asset.status,
          created_at: asset.created_at,
          icon: getAssetIcon(asset.service_type)
        }));

        setTokenizedAssets(assets);

        const totalValue = assets.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
        const totalAssets = assets.filter(a => a.status === 'completed').length;

        setStats(prev => ({
          ...prev,
          totalValue,
          totalAssets,
          portfolioChange: (Math.random() * 10 - 2).toFixed(2),
          roi: ((totalValue * 0.075) / totalValue * 100).toFixed(2)
        }));
      }
    } catch (error) {
      console.error('Error fetching tokenized assets:', error);
    }
  };

  const fetchWalletTransactions = async () => {
    try {
      if (!walletAddress) return;

      const mockTransactions = [
        {
          id: '1',
          type: 'buy',
          asset: 'Private Jet Token',
          amount: 50,
          value: 125000,
          timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
          hash: '0x1234...5678',
          status: 'completed'
        },
        {
          id: '2',
          type: 'sell',
          asset: 'Yacht Token',
          amount: 25,
          value: 75000,
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
          hash: '0x8765...4321',
          status: 'completed'
        }
      ];

      setTransactions(mockTransactions);
      setStats(prev => ({
        ...prev,
        totalTransactions: mockTransactions.length
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchAnalytics = async () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const chartData = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      chartData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 50000 + Math.random() * 100000,
        transactions: Math.floor(Math.random() * 10),
        visitors: Math.floor(Math.random() * 50)
      });
    }

    const assetPerformance = [
      { name: 'Private Jet', value: 35, change: +12.5 },
      { name: 'Real Estate', value: 28, change: +8.3 },
      { name: 'Yacht', value: 22, change: -2.1 },
      { name: 'Luxury Car', value: 15, change: +5.7 }
    ];

    setAnalytics({
      chartData,
      assetPerformance,
      interactionData: chartData
    });
  };

  const getAssetIcon = (type) => {
    const icons = {
      'jet': '✈',
      'helicopter': '🚁',
      'yacht': '⛵',
      'real-estate': '🏢',
      'luxury-car': '🚗',
      'art': '🖼'
    };
    return icons[type] || '💎';
  };

  const copyWalletAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
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
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border border-black/10 border-t-black rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-black/40">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Minimal Header */}
      <div className="border-b border-black/5">
        <div className="max-w-[1920px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-black tracking-tight">Profile Overview</h1>
              <p className="text-xs text-black/40 mt-0.5">Your account summary</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300/50 rounded text-xs focus:outline-none focus:border-gray-400/50 transition-colors bg-white/20"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <option value="7d">7d</option>
                <option value="30d">30d</option>
                <option value="90d">90d</option>
              </select>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-[1920px] mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Minimal Asset List */}
          <div className="col-span-12 lg:col-span-3">
            <div className="border border-gray-300/50 rounded-xl bg-white/35 sticky top-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <div className="px-5 py-4 border-b border-black/5">
                <h2 className="text-sm font-medium text-black">My Assets</h2>
                <p className="text-[10px] text-black/30 mt-0.5">{tokenizedAssets.length} tokenized</p>
              </div>

              <div className="p-3 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {tokenizedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group p-3 rounded-sm border border-black/0 hover:border-black/10 hover:bg-black/[0.02] transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {/* Minimal Icon */}
                      <div className="w-8 h-8 rounded-sm border border-black/10 flex items-center justify-center text-sm flex-shrink-0">
                        {asset.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-medium text-black text-xs truncate leading-tight">
                            {asset.name}
                          </h3>
                          <span className={`text-[10px] font-mono ${
                            parseFloat(asset.change24h) >= 0 ? 'text-black/40' : 'text-black/40'
                          }`}>
                            {parseFloat(asset.change24h) >= 0 ? '+' : ''}{asset.change24h}%
                          </span>
                        </div>

                        <p className="text-[10px] text-black/30 mb-2">{asset.type}</p>

                        {/* Minimal Progress */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-black/30">Tokens</span>
                            <span className="font-mono text-black/60">
                              {asset.tokens}/{asset.totalTokens}
                            </span>
                          </div>
                          <div className="w-full h-px bg-black/5">
                            <div
                              className="h-full bg-black/20"
                              style={{ width: `${(asset.tokens / asset.totalTokens) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-black">
                            {formatCurrency(asset.value)}
                          </span>
                          <span className="text-[10px] text-black/30">
                            {asset.apy}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {tokenizedAssets.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-sm border border-black/10 flex items-center justify-center mx-auto mb-3">
                      <Coins size={20} className="text-black/20" />
                    </div>
                    <p className="text-xs text-black/30 mb-4">No assets</p>
                    <button className="px-4 py-1.5 border border-black/10 hover:border-black/30 rounded-sm text-xs transition-colors">
                      Tokenize
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Profile & KYC Info Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Info */}
              <div className="border border-gray-300/50 rounded-xl bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="px-5 py-4 border-b border-black/5">
                  <h2 className="text-sm font-medium text-black">Profile</h2>
                  <p className="text-[10px] text-black/30 mt-0.5">Account information</p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-black/5">
                    <div className="w-12 h-12 rounded-sm border border-black/10 flex items-center justify-center text-black font-medium">
                      {user?.first_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-black">
                        {user?.first_name} {user?.last_name}
                      </h3>
                      <p className="text-[10px] text-black/40">{user?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-black/40">Email</span>
                      <span className="text-black/80">{user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-black/40">Phone</span>
                      <span className="text-black/80">{profileData?.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-black/40">Member since</span>
                      <span className="text-black/80">
                        {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 border border-black/10 rounded-sm text-xs hover:border-black/30 transition-colors">
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* KYC Status */}
              <div className="border border-gray-300/50 rounded-xl bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="px-5 py-4 border-b border-black/5">
                  <h2 className="text-sm font-medium text-black">Verification</h2>
                  <p className="text-[10px] text-black/30 mt-0.5">KYC status</p>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-sm border border-black/10 flex items-center justify-center">
                      {profileData?.kyc_status === 'verified' ? (
                        <CheckCircle size={20} className="text-black/60" />
                      ) : profileData?.kyc_status === 'pending' ? (
                        <Clock size={20} className="text-black/40" />
                      ) : (
                        <AlertCircle size={20} className="text-black/30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-black">
                          {profileData?.kyc_status === 'verified' ? 'Verified' :
                           profileData?.kyc_status === 'pending' ? 'Pending Review' :
                           'Not Verified'}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          profileData?.kyc_status === 'verified' ? 'bg-black/5 text-black/60' :
                          profileData?.kyc_status === 'pending' ? 'bg-black/5 text-black/40' :
                          'bg-black/5 text-black/30'
                        }`}>
                          {profileData?.kyc_status || 'Not started'}
                        </span>
                      </div>
                      <p className="text-[10px] text-black/40 leading-relaxed">
                        {profileData?.kyc_status === 'verified' ?
                          'Your identity has been verified. You have full access to all features.' :
                         profileData?.kyc_status === 'pending' ?
                          'Your documents are under review. This typically takes 24-48 hours.' :
                          'Complete KYC verification to unlock higher transaction limits and additional features.'}
                      </p>
                    </div>
                  </div>

                  {profileData?.kyc_status !== 'verified' && (
                    <button className="w-full px-4 py-2 bg-black text-white rounded-sm text-xs hover:bg-black/90 transition-colors">
                      {profileData?.kyc_status === 'pending' ? 'Check Status' : 'Start Verification'}
                    </button>
                  )}

                  {profileData?.kyc_status === 'verified' && (
                    <div className="pt-4 border-t border-black/5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-black/40">Verified on</span>
                        <span className="text-black/60">
                          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Minimal Chart */}
            <div className="border border-gray-300/50 rounded-xl bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <div className="px-5 py-4 border-b border-black/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-black">Trends</h2>
                    <p className="text-[10px] text-black/30 mt-0.5">Portfolio value</p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analytics.chartData}>
                    <defs>
                      <linearGradient id="colorValueMono" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" stopOpacity={0.05}/>
                        <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" stroke="#00000008" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#00000040' }}
                      stroke="#00000010"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#00000040' }}
                      stroke="#00000010"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid rgba(0,0,0,0.05)',
                        borderRadius: '2px',
                        fontSize: '11px'
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#000000"
                      strokeWidth={1}
                      fillOpacity={1}
                      fill="url(#colorValueMono)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance & Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance */}
              <div className="border border-gray-300/50 rounded-xl bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="px-5 py-4 border-b border-black/5">
                  <h2 className="text-sm font-medium text-black">Performance</h2>
                  <p className="text-[10px] text-black/30 mt-0.5">By asset type</p>
                </div>

                <div className="p-5">
                  <div className="space-y-3">
                    {analytics.assetPerformance.map((asset, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-1 h-1 rounded-full bg-black/20" />
                          <span className="text-xs text-black/60">{asset.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-black">{asset.value}%</span>
                          <span className={`text-[10px] font-mono ${
                            asset.change >= 0 ? 'text-black/40' : 'text-black/40'
                          }`}>
                            {asset.change >= 0 ? '+' : ''}{asset.change}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div className="border border-gray-300/50 rounded-xl bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="px-5 py-4 border-b border-black/5">
                  <h2 className="text-sm font-medium text-black">Activity</h2>
                  <p className="text-[10px] text-black/30 mt-0.5">Transaction volume</p>
                </div>

                <div className="p-5">
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsBarChart data={analytics.interactionData.slice(-10)}>
                      <CartesianGrid strokeDasharray="0" stroke="#00000008" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#00000040' }}
                        stroke="#00000010"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#00000040' }}
                        stroke="#00000010"
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid rgba(0,0,0,0.05)',
                          borderRadius: '2px',
                          fontSize: '11px'
                        }}
                      />
                      <Bar dataKey="transactions" fill="#000000" fillOpacity={0.1} radius={[2, 2, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Signed Transactions (Launchpad) */}
            <LaunchpadTransactions
              limit={5}
              showHeader={true}
              onViewAll={() => {
                // Navigate to transactions page
                const event = new CustomEvent('navigate-to-category', { detail: { category: 'transactions' } });
                window.dispatchEvent(event);
              }}
            />

            {/* Transactions */}
            <div className="border border-gray-300/50 rounded-xl bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <div className="px-5 py-4 border-b border-black/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-black">Transactions</h2>
                    <p className="text-[10px] text-black/30 mt-0.5">Recent activity</p>
                  </div>
                  <button className="text-[10px] text-black/40 hover:text-black transition-colors">
                    View all
                  </button>
                </div>
              </div>

              <div className="divide-y divide-black/5">
                {transactions.length > 0 ? transactions.map((tx) => (
                  <div key={tx.id} className="px-5 py-4 hover:bg-black/[0.01] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-sm border border-black/10 flex items-center justify-center">
                          {tx.type === 'buy' ? (
                            <ArrowDownRight className="text-black/40" size={14} />
                          ) : (
                            <ArrowUpRight className="text-black/40" size={14} />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-medium text-black">
                            {tx.type === 'buy' ? 'Buy' : 'Sell'} {tx.asset}
                          </h3>
                          <p className="text-[10px] text-black/30 mt-0.5">
                            {tx.amount} tokens • {new Date(tx.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-black">
                          {tx.type === 'buy' ? '-' : '+'}{formatCurrency(tx.value)}
                        </p>
                        <a
                          href={`https://basescan.org/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-black/30 hover:text-black font-mono flex items-center gap-1 mt-0.5 justify-end"
                        >
                          {tx.hash}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-16 text-center">
                    <div className="w-12 h-12 rounded-sm border border-black/10 flex items-center justify-center mx-auto mb-3">
                      <Activity size={20} className="text-black/20" />
                    </div>
                    <p className="text-xs text-black/30">No transactions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
