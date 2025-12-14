import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Info, ChevronDown, RefreshCw, ArrowUpDown, FileText, Shield, TrendingUp, Building2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useAuth } from '../../context/AuthContext';
import TokenPriceChart from './TokenPriceChart';

export default function LaunchDetailPageNew({ launch, onBack }) {
  const [activeTab, setActiveTab] = useState('fund'); // 'fund' or 'redeem'
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'details', 'tokenomics', 'legal', 'documents'
  const [selectedPaymentToken, setSelectedPaymentToken] = useState('PYUSD');
  const [selectedReceiveToken, setSelectedReceiveToken] = useState('USYC');
  const [paymentAmount, setPaymentAmount] = useState('0.00');
  const [receiveAmount, setReceiveAmount] = useState('0.00');
  const [chartPeriod, setChartPeriod] = useState('monthly');
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [showReceiveDropdown, setShowReceiveDropdown] = useState(false);

  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { user } = useAuth();

  // Token logos
  const tokenLogos = {
    PYUSD: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/usdc-3d-icon-png-download-8263869.webp',
    USDC: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/usdc-3d-icon-png-download-8263869.webp',
    USDT: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/green-circle-with-large-t-it-that-is-labeled-t_767610-17.jpg',
    USYC: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/usdc-3d-icon-png-download-8263869.webp'
  };

  // Calculate exchange rate
  const exchangeRate = 0.932871;

  useEffect(() => {
    if (paymentAmount && !isNaN(paymentAmount)) {
      setReceiveAmount((parseFloat(paymentAmount) * exchangeRate).toFixed(2));
    }
  }, [paymentAmount]);

  // Static chart data - historical price data
  const chartData = React.useMemo(() => {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const basePrice = 1.071723;
    // Static data points for consistent chart
    const dataPoints = [
      { month: 'Aug', y: 45 },
      { month: 'Sep', y: 42 },
      { month: 'Oct', y: 48 },
      { month: 'Nov', y: 52 },
      { month: 'Dec', y: 55 },
      { month: 'Jan', y: 58 },
      { month: 'Feb', y: 62 }
    ];

    return dataPoints.map((point, i) => ({
      ...point,
      x: (i / (dataPoints.length - 1)) * 100,
      price: basePrice + (i * 0.002)
    }));
  }, []);

  const tokenPrice = launch.token_price || 1.071723;
  const priceChange = '+21.0%';

  const formatLargeNumber = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const totalValue = 1446486742.80;
  const pyusdCapacity = 316693.01;
  const estYield = 3.508;
  const usdcCapacity = 176064780.86;

  const handleConnectWallet = () => {
    if (!isConnected) {
      open();
    }
  };

  const handleMaxPayment = () => {
    // Set to max available balance (mock)
    setPaymentAmount('0');
  };

  const handleMaxReceive = () => {
    // Set to max available balance (mock)
    setReceiveAmount('0');
  };

  const handleSwapTokens = () => {
    // Swap the selected tokens
    const tempToken = selectedPaymentToken;
    setSelectedPaymentToken(selectedReceiveToken);
    setSelectedReceiveToken(tempToken);

    const tempAmount = paymentAmount;
    setPaymentAmount(receiveAmount);
    setReceiveAmount(tempAmount);
  };

  return (
    <div className="w-full min-h-screen bg-transparent" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">Back to Launchpad</span>
        </button>

        {/* Project Header with Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white text-base sm:text-lg font-semibold">
                {launch.token_symbol?.slice(0, 1) || 'T'}
              </span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-medium text-gray-900">{(launch.token_symbol || 'USYC').slice(0, 4)}</h1>
              <p className="text-gray-500 text-xs truncate max-w-[180px] sm:max-w-none">{launch.name}</p>
            </div>
          </div>

          {/* Compact Tab Switcher - Horizontal scroll on mobile */}
          <div className="flex items-center gap-1 bg-white/15 backdrop-blur-xl rounded-xl border border-gray-300/50 p-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-1">
            {[
              { id: 'overview', icon: <TrendingUp size={12} />, label: 'Overview' },
              { id: 'details', icon: <Building2 size={12} />, label: 'Details' },
              { id: 'tokenomics', icon: <Info size={12} />, label: 'Economics' },
              { id: 'legal', icon: <Shield size={12} />, label: 'Legal' },
              { id: 'documents', icon: <FileText size={12} />, label: 'Docs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout - Investment card first on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT CARD - Project Stats & Chart */}
          <div className="lg:col-span-2 order-2 lg:order-1 bg-white/20 backdrop-blur-xl rounded-2xl border border-gray-300/50 p-4 sm:p-6 space-y-4">

            {activeSubTab === 'overview' && (
              <>
                {/* Header Stats */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                    <h2 className="text-xs text-gray-500">{launch.name}</h2>
                    <p className="text-2xl sm:text-3xl font-medium text-gray-900">{formatLargeNumber(totalValue)}</p>
                  </div>

                  {/* Stat Row 1 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Redemption Capacity</span>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded">
                        <div className="w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center">
                          <span className="text-[6px] text-white font-medium">P</span>
                        </div>
                        <span className="text-[10px] text-gray-600">PYUSD</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 tabular-nums">${pyusdCapacity.toLocaleString()}</p>
                  </div>

                  {/* Stat Row 2 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Est. Yield (Net)</span>
                      <Info size={12} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 tabular-nums">{estYield.toFixed(3)}%</p>
                  </div>

                  {/* Stat Row 3 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <span className="text-xs text-gray-500">{launch.token_symbol || 'USYC'} Price</span>
                    <p className="text-sm font-medium text-gray-900 tabular-nums">${tokenPrice.toFixed(6)}</p>
                  </div>

                  {/* Stat Row 4 */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Redemption Capacity</span>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded">
                        <div className="w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center">
                          <span className="text-[6px] text-white font-medium">U</span>
                        </div>
                        <span className="text-[10px] text-gray-600">USDC</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 tabular-nums">{formatLargeNumber(usdcCapacity)}</p>
                  </div>
                </div>

                {/* Token Price Chart */}
                <div className="pt-4 border-t border-gray-200">
                  <TokenPriceChart
                    chartData={chartData}
                    tokenPrice={tokenPrice}
                    priceChange={priceChange}
                    chartPeriod={chartPeriod}
                    onPeriodChange={setChartPeriod}
                  />
                </div>
              </>
            )}

            {activeSubTab === 'details' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Asset Details</h3>

                {/* Asset Information Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Asset Type</p>
                    <p className="text-sm font-medium text-gray-900">{launch.project_type === 'sto' ? 'Security Token' : 'Utility Token'}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Token Standard</p>
                    <p className="text-sm font-medium text-gray-900">ERC-20</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Total Supply</p>
                    <p className="text-sm font-medium text-gray-900 tabular-nums">{(launch.target_amount / tokenPrice).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Min. Investment</p>
                    <p className="text-sm font-medium text-gray-900 tabular-nums">$1,000</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200/50">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Description</p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {launch.description || 'This is a tokenized real-world asset offering providing investors with fractional ownership and passive income opportunities through blockchain technology.'}
                  </p>
                </div>

                {launch.smart_contract_address && (
                  <div className="pt-4 border-t border-gray-200/50">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Smart Contract</p>
                    <div className="flex items-center gap-2 p-2.5 bg-gray-100/60 rounded-lg overflow-x-auto">
                      <Shield size={14} className="text-gray-600 flex-shrink-0" />
                      <code className="text-xs font-mono text-gray-900 truncate">{launch.smart_contract_address}</code>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'tokenomics' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Token Economics</h3>

                {/* Tokenomics Stats */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Token Price</span>
                      <p className="text-sm font-medium text-gray-900 tabular-nums">${tokenPrice.toFixed(6)}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Total Value Locked</span>
                      <p className="text-sm font-medium text-gray-900 tabular-nums">{formatLargeNumber(totalValue)}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Expected APY</span>
                      <p className="text-sm font-medium text-gray-900 tabular-nums">{estYield.toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Revenue Distribution</span>
                      <p className="text-sm font-medium text-gray-900">Quarterly</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Lock-up Period</span>
                      <p className="text-sm font-medium text-gray-900 tabular-nums">12 Months</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'legal' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Legal & Compliance</h3>

                <div className="space-y-2">
                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Shield size={14} className="text-gray-600" />
                      <h4 className="text-sm font-medium text-gray-900">Regulatory Status</h4>
                    </div>
                    <p className="text-xs text-gray-600">
                      Compliant with applicable securities regulations.
                    </p>
                  </div>

                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText size={14} className="text-gray-600" />
                      <h4 className="text-sm font-medium text-gray-900">Jurisdiction</h4>
                    </div>
                    <p className="text-xs text-gray-600">United States - Regulation D 506(c)</p>
                  </div>

                  <div className="p-3 bg-white/20 rounded-lg border border-gray-200/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Info size={14} className="text-gray-600" />
                      <h4 className="text-sm font-medium text-gray-900">Investor Requirements</h4>
                    </div>
                    <p className="text-xs text-gray-600">
                      Accredited investors only. Min: $1,000
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'documents' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>

                <div className="space-y-2">
                  {[
                    { name: 'Prospectus', size: '2.4 MB', date: 'Jan 15, 2025' },
                    { name: 'Legal Opinion', size: '1.8 MB', date: 'Jan 10, 2025' },
                    { name: 'Valuation Report', size: '3.1 MB', date: 'Jan 5, 2025' },
                    { name: 'Audit Report', size: '1.2 MB', date: 'Dec 20, 2024' }
                  ].map((doc, index) => (
                    <button
                      key={index}
                      className="w-full p-3 bg-white/20 hover:bg-white/30 rounded-lg border border-gray-200/50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-gray-100/60 rounded-lg group-hover:bg-gray-200/60 transition-colors">
                            <FileText size={16} className="text-gray-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                            <p className="text-[10px] text-gray-500">{doc.size} · {doc.date}</p>
                          </div>
                        </div>
                        <ChevronDown size={14} className="text-gray-400 -rotate-90" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT CARD - Investment Interface */}
          <div className="lg:col-span-1 order-1 lg:order-2 bg-white/20 backdrop-blur-xl rounded-2xl border border-gray-300/50 p-4 sm:p-6">

            {/* Header */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-900">Invest in {launch.token_symbol || 'USYC'}</h2>
              </div>
              <button
                onClick={handleConnectWallet}
                className="w-full px-3 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                onClick={() => setActiveTab('fund')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'fund'
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Fund
              </button>
              <button
                onClick={() => setActiveTab('redeem')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'redeem'
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Redeem
              </button>
            </div>

            {/* Input Section 1 - Payment Token */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500">You Pay</span>
                <button
                  onClick={handleMaxPayment}
                  className="text-[10px] text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Max
                </button>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-gray-300/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                      className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white font-medium">P</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900">{selectedPaymentToken}</span>
                      <ChevronDown size={12} className="text-gray-500" />
                    </button>

                    {showPaymentDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-lg shadow-xl z-10 min-w-[100px]">
                        {['PYUSD', 'USDC', 'USDT'].map((token) => (
                          <button
                            key={token}
                            onClick={() => {
                              setSelectedPaymentToken(token);
                              setShowPaymentDropdown(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-gray-900 text-xs font-medium transition-colors first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="w-3 h-3 bg-black rounded-full"></div>
                            {token}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-transparent text-right text-xl font-medium text-gray-900 outline-none w-24"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Balance</span>
                  <span className="text-xs text-gray-600">0</span>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1.5 relative z-10">
              <button
                onClick={handleSwapTokens}
                className="w-8 h-8 bg-white/60 hover:bg-white border border-gray-200/50 rounded-full flex items-center justify-center transition-colors shadow-sm"
              >
                <ArrowUpDown size={14} className="text-gray-600" />
              </button>
            </div>

            {/* Input Section 2 - Receive Token */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500">You Receive</span>
                <button
                  onClick={handleMaxReceive}
                  className="text-[10px] text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Max
                </button>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-gray-300/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowReceiveDropdown(!showReceiveDropdown)}
                      className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white font-medium">y</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900">{selectedReceiveToken}</span>
                      <ChevronDown size={12} className="text-gray-500" />
                    </button>

                    {showReceiveDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-lg shadow-xl z-10 min-w-[100px]">
                        {['USYC', 'USDC', 'USDT'].map((token) => (
                          <button
                            key={token}
                            onClick={() => {
                              setSelectedReceiveToken(token);
                              setShowReceiveDropdown(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-gray-900 text-xs font-medium transition-colors first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="w-3 h-3 bg-black rounded-full"></div>
                            {token}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={receiveAmount}
                    readOnly
                    placeholder="0.00"
                    className="bg-transparent text-right text-xl font-medium text-gray-900 outline-none w-24"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Balance</span>
                  <span className="text-xs text-gray-600">0</span>
                </div>
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span>⚡</span>
                  <span>1 {selectedPaymentToken} = {exchangeRate.toFixed(4)} {selectedReceiveToken}</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleConnectWallet}
                disabled={isConnected}
                className="w-full px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </button>

              <button className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors">
                Contact for Access
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
