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
    <div className="w-full min-h-screen bg-transparent" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-light">Back to Launchpad</span>
        </button>

        {/* Project Header with Switcher */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-xl font-medium">
                {launch.token_symbol?.slice(0, 1) || 'y'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-light text-gray-900">{(launch.token_symbol || 'USYC').slice(0, 4)}</h1>
              <p className="text-gray-600 text-sm font-light">{launch.name}</p>
            </div>
          </div>

          {/* Compact Rounded Switcher */}
          <div className="flex items-center gap-1 bg-transparent backdrop-blur-xl rounded-full border border-gray-200 p-1" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
            {[
              { id: 'overview', icon: <TrendingUp size={14} />, label: 'Overview' },
              { id: 'details', icon: <Building2 size={14} />, label: 'Details' },
              { id: 'tokenomics', icon: <Info size={14} />, label: 'Economics' },
              { id: 'legal', icon: <Shield size={14} />, label: 'Legal' },
              { id: 'documents', icon: <FileText size={14} />, label: 'Docs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`p-2 rounded-full transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/40'
                }`}
                title={tab.label}
              >
                {tab.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT CARD - Project Stats & Chart */}
          <div className="lg:col-span-2 bg-transparent backdrop-blur-xl rounded-2xl border border-gray-200 p-6 space-y-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>

            {activeSubTab === 'overview' && (
              <>
                {/* Header Stats */}
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <h2 className="text-sm text-gray-600 font-light">{launch.name}</h2>
                    <p className="text-4xl font-light text-gray-900">{formatLargeNumber(totalValue)}</p>
                  </div>

                  {/* Stat Row 1 */}
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 font-light">Instant Redemption Capacity</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100/60 rounded-md">
                        <div className="w-3 h-3 bg-gray-800 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-white font-medium">P</span>
                        </div>
                        <span className="text-xs text-gray-700 font-light">PYUSD</span>
                      </div>
                    </div>
                    <p className="text-base font-light text-gray-900 tabular-nums">${pyusdCapacity.toLocaleString()}</p>
                  </div>

                  {/* Stat Row 2 */}
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 font-light">Est. Yield (Net of Fees)</span>
                      <Info size={14} className="text-gray-500" />
                    </div>
                    <p className="text-base font-light text-gray-900 tabular-nums">{estYield.toFixed(3)}%</p>
                  </div>

                  {/* Stat Row 3 */}
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-200">
                    <span className="text-sm text-gray-600 font-light">{launch.token_symbol || 'USYC'} Price</span>
                    <p className="text-base font-light text-gray-900 tabular-nums">${tokenPrice.toFixed(6)}</p>
                  </div>

                  {/* Stat Row 4 */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 font-light">Instant Redemption Capacity</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100/60 rounded-md">
                        <div className="w-3 h-3 bg-gray-800 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-white font-medium">U</span>
                        </div>
                        <span className="text-xs text-gray-700 font-light">USDC</span>
                      </div>
                    </div>
                    <p className="text-base font-light text-gray-900 tabular-nums">{formatLargeNumber(usdcCapacity)}</p>
                  </div>
                </div>

                {/* Token Price Chart */}
                <div className="pt-6 border-t border-gray-200">
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
              <div className="space-y-6">
                <h3 className="text-2xl font-light text-gray-900">Asset Details</h3>

                {/* Asset Information Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-light uppercase tracking-wide">Asset Type</p>
                    <p className="text-base font-light text-gray-900">{launch.project_type === 'sto' ? 'Security Token' : 'Utility Token'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-light uppercase tracking-wide">Token Standard</p>
                    <p className="text-base font-light text-gray-900">ERC-20</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-light uppercase tracking-wide">Total Supply</p>
                    <p className="text-base font-light text-gray-900 tabular-nums">{(launch.target_amount / tokenPrice).toLocaleString()} Tokens</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-light uppercase tracking-wide">Minimum Investment</p>
                    <p className="text-base font-light text-gray-900 tabular-nums">$1,000</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-light uppercase tracking-wide mb-3">Description</p>
                  <p className="text-sm font-light text-gray-700 leading-relaxed">
                    {launch.description || 'This is a tokenized real-world asset offering providing investors with fractional ownership and passive income opportunities through blockchain technology.'}
                  </p>
                </div>

                {launch.smart_contract_address && (
                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-light uppercase tracking-wide mb-3">Smart Contract</p>
                    <div className="flex items-center gap-3 p-3 bg-gray-100/60 rounded-lg">
                      <Shield size={16} className="text-gray-600" />
                      <code className="text-sm font-mono text-gray-900 font-light">{launch.smart_contract_address}</code>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'tokenomics' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-light text-gray-900">Token Economics</h3>

                {/* Tokenomics Stats */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-transparent rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">Token Price</span>
                      <p className="text-xl font-light text-gray-900 tabular-nums">${tokenPrice.toFixed(6)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-transparent rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">Total Value Locked</span>
                      <p className="text-xl font-light text-gray-900 tabular-nums">{formatLargeNumber(totalValue)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-transparent rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">Expected APY</span>
                      <p className="text-xl font-light text-gray-900 tabular-nums">{estYield.toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="p-4 bg-transparent rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">Revenue Distribution</span>
                      <p className="text-xl font-light text-gray-900">Quarterly</p>
                    </div>
                  </div>

                  <div className="p-4 bg-transparent rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">Lock-up Period</span>
                      <p className="text-xl font-light text-gray-900 tabular-nums">12 Months</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'legal' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-light text-gray-900">Legal & Compliance</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-transparent rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield size={18} className="text-gray-600" />
                      <h4 className="text-base font-light text-gray-900">Regulatory Status</h4>
                    </div>
                    <p className="text-sm font-light text-gray-700">
                      This offering is compliant with applicable securities regulations and has been reviewed by legal counsel.
                    </p>
                  </div>

                  <div className="p-4 bg-transparent rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={18} className="text-gray-600" />
                      <h4 className="text-base font-light text-gray-900">Jurisdiction</h4>
                    </div>
                    <p className="text-sm font-light text-gray-700">United States - Regulation D 506(c)</p>
                  </div>

                  <div className="p-4 bg-transparent rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Info size={18} className="text-gray-600" />
                      <h4 className="text-base font-light text-gray-900">Investor Requirements</h4>
                    </div>
                    <p className="text-sm font-light text-gray-700">
                      Accredited investors only. Minimum investment: $1,000
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'documents' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-light text-gray-900">Documents</h3>

                <div className="space-y-3">
                  {[
                    { name: 'Prospectus', size: '2.4 MB', date: 'Updated Jan 15, 2025' },
                    { name: 'Legal Opinion', size: '1.8 MB', date: 'Updated Jan 10, 2025' },
                    { name: 'Asset Valuation Report', size: '3.1 MB', date: 'Updated Jan 5, 2025' },
                    { name: 'Audit Report', size: '1.2 MB', date: 'Updated Dec 20, 2024' }
                  ].map((doc, index) => (
                    <button
                      key={index}
                      className="w-full p-4 bg-transparent hover:bg-gray-100/20 rounded-lg border border-gray-200 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                            <FileText size={20} className="text-gray-700" />
                          </div>
                          <div>
                            <p className="text-sm font-light text-gray-900">{doc.name}</p>
                            <p className="text-xs font-light text-gray-500">{doc.size} · {doc.date}</p>
                          </div>
                        </div>
                        <ChevronDown size={16} className="text-gray-400 rotate-[-90deg]" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT CARD - Investment Interface */}
          <div className="lg:col-span-1 bg-transparent backdrop-blur-xl rounded-2xl border border-gray-200 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light text-gray-900">Invest in {launch.token_symbol || 'USYC'}</h2>
              <button
                onClick={handleConnectWallet}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-light transition-colors"
              >
                {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('fund')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-light transition-colors ${
                  activeTab === 'fund'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 bg-white/40'
                }`}
              >
                Fund
              </button>
              <button
                onClick={() => setActiveTab('redeem')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-light transition-colors ${
                  activeTab === 'redeem'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 bg-white/40'
                }`}
              >
                Redeem
              </button>
            </div>

            {/* Input Section 1 - Payment Token */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 font-light">Balance</span>
                <button
                  onClick={handleMaxPayment}
                  className="text-xs text-gray-600 hover:text-gray-900 transition-colors font-light"
                >
                  Max
                </button>
              </div>
              <div className="bg-transparent rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="relative">
                    <button
                      onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100/40 hover:bg-gray-100/60 rounded-lg transition-colors border border-gray-200"
                    >
                      <div className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium">P</span>
                      </div>
                      <span className="text-sm font-light text-gray-900">{selectedPaymentToken}</span>
                      <ChevronDown size={14} className="text-gray-600" />
                    </button>

                    {showPaymentDropdown && (
                      <div className="absolute top-full left-0 mt-2 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-lg shadow-xl z-10 min-w-[120px]">
                        {['PYUSD', 'USDC', 'USDT'].map((token) => (
                          <button
                            key={token}
                            onClick={() => {
                              setSelectedPaymentToken(token);
                              setShowPaymentDropdown(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-900 text-sm font-light transition-colors first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
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
                    className="bg-transparent text-right text-2xl font-light text-gray-900 outline-none w-32"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-light">Balance</span>
                  <span className="text-sm text-gray-900 font-light">0</span>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={handleSwapTokens}
                className="w-10 h-10 bg-gray-100/40 hover:bg-gray-100/60 border-2 border-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ArrowUpDown size={16} className="text-gray-600" />
              </button>
            </div>

            {/* Input Section 2 - Receive Token */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 font-light">Balance</span>
                <button
                  onClick={handleMaxReceive}
                  className="text-xs text-gray-600 hover:text-gray-900 transition-colors font-light"
                >
                  Max
                </button>
              </div>
              <div className="bg-transparent rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="relative">
                    <button
                      onClick={() => setShowReceiveDropdown(!showReceiveDropdown)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100/40 hover:bg-gray-100/60 rounded-lg transition-colors border border-gray-200"
                    >
                      <div className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium">y</span>
                      </div>
                      <span className="text-sm font-light text-gray-900">{selectedReceiveToken}</span>
                      <ChevronDown size={14} className="text-gray-600" />
                    </button>

                    {showReceiveDropdown && (
                      <div className="absolute top-full left-0 mt-2 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-lg shadow-xl z-10 min-w-[120px]">
                        {['USYC', 'USDC', 'USDT'].map((token) => (
                          <button
                            key={token}
                            onClick={() => {
                              setSelectedReceiveToken(token);
                              setShowReceiveDropdown(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-900 text-sm font-light transition-colors first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
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
                    className="bg-transparent text-right text-2xl font-light text-gray-900 outline-none w-32"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-light">Balance</span>
                  <span className="text-sm text-gray-900 font-light">0</span>
                </div>
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="mb-6 p-3 bg-transparent rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700 font-light">
                  <span className="text-gray-900">⚡</span>
                  <span>1 {selectedPaymentToken} = {exchangeRate.toFixed(6)} {selectedReceiveToken}</span>
                </div>
                <button className="text-gray-600 hover:text-gray-900 transition-colors">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleConnectWallet}
                disabled={isConnected}
                className="w-full px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-base font-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnected ? 'Wallet Connected' : 'Connect Your Wallet'}
              </button>

              <button className="w-full px-6 py-4 bg-transparent border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-base font-light transition-colors">
                Contact us to get access
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
